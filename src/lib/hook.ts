import { transformSync } from "esbuild";
import { AvpError } from "./errors";

/**
 * 挂载钩子（beat hook）契约：
 *   (tl, root, ctx: { start, duration }) => void
 *
 * 只准相对 ctx.start 构建子时间线；禁止播放时才发生的副作用
 * （repeat:-1 / rAF / Date.now / 定时器）——渲染器逐帧 seek，那些东西
 * 不会复现。构建后用假时间线测量总长，超过该拍时长即失败。
 */
export type BeatHook = (
  tl: FakeTimeline,
  root: unknown,
  ctx: { start: number; duration: number },
) => void;

export interface HookProbe {
  /** 钩子构建出的时间线终点（秒，绝对时间）。 */
  end: number;
  duration: number;
}

const BANNED: { pattern: RegExp; reason: string }[] = [
  { pattern: /repeat\s*:\s*-1/u, reason: "repeat: -1 会永远播放，渲染器无法 seek" },
  {
    pattern: /\brequestAnimationFrame\b/u,
    reason: "requestAnimationFrame 只在播放时发生，逐帧 seek 时不会复现",
  },
  {
    pattern: /\bDate\.now\b|\bperformance\.now\b/u,
    reason: "读取当前时钟会让同一帧在不同时间渲染出不同结果",
  },
  {
    pattern: /\bsetTimeout\b|\bsetInterval\b/u,
    reason: "定时器只在播放时发生，渲染器逐帧 seek 时不会复现",
  },
];

/** 静态拒绝「只在播放时发生」的副作用。 */
export function assertHookSeekSafe(beatId: string, source: string): void {
  for (const { pattern, reason } of BANNED) {
    const match = pattern.exec(source);
    if (match) {
      throw new AvpError(
        "hook-not-seek-safe",
        `节拍 ${beatId} 的钩子用了禁止的写法「${match[0]}」：${reason}。` +
          `\n把动效写成有限时长的 tl.to / tl.fromTo，并相对 ctx.start 计时。`,
        { beatId, field: "hook", pattern: match[0], source: reason },
      );
    }
  }
}

/** 把 TS 钩子编译成 CommonJS，供「测量」与「内联」两处复用。 */
export function compileHook(beatId: string, source: string): string {
  try {
    return transformSync(source, {
      loader: "ts",
      format: "cjs",
      target: "es2020",
      sourcefile: `${beatId}.hook.ts`,
    }).code;
  } catch (err) {
    throw new AvpError(
      "hook-invalid",
      `节拍 ${beatId} 的钩子编译失败：${err instanceof Error ? err.message : String(err)}`,
      { beatId, field: "hook" },
    );
  }
}

interface FakeTimeline {
  _end: number;
  duration(): number;
  to(target: unknown, vars?: { duration?: number }, position?: number): FakeTimeline;
  from(target: unknown, vars?: { duration?: number }, position?: number): FakeTimeline;
  fromTo(
    target: unknown,
    fromVars: unknown,
    toVars?: { duration?: number },
    position?: number,
  ): FakeTimeline;
  set(target: unknown, vars?: unknown, position?: number): FakeTimeline;
  add(child: { duration(): number }, position?: number): FakeTimeline;
  call(fn: unknown, params?: unknown, position?: number): FakeTimeline;
  addLabel(name: string, position?: number): FakeTimeline;
  timeline(vars?: unknown): FakeTimeline;
  [key: string]: unknown;
}

function at(position: unknown): number {
  return typeof position === "number" && Number.isFinite(position) ? position : 0;
}

function createFakeTimeline(): FakeTimeline {
  const tl = {
    _end: 0,
    duration(): number {
      return tl._end;
    },
  } as FakeTimeline;

  const extend = (position: unknown, duration: number): void => {
    tl._end = Math.max(tl._end, at(position) + Math.max(0, duration));
  };

  tl.to = (_target, vars, position) => {
    extend(position, vars?.duration ?? 0.5);
    return tl;
  };
  tl.from = (_target, vars, position) => {
    extend(position, vars?.duration ?? 0.5);
    return tl;
  };
  tl.fromTo = (_target, _fromVars, toVars, position) => {
    extend(position, toVars?.duration ?? 0.5);
    return tl;
  };
  tl.set = (_target, _vars, position) => {
    extend(position, 0);
    return tl;
  };
  tl.add = (child, position) => {
    extend(position, child?.duration?.() ?? 0);
    return tl;
  };
  tl.call = (_fn, _params, position) => {
    extend(position, 0);
    return tl;
  };
  tl.addLabel = () => tl;
  tl.timeline = () => createFakeTimeline();
  return tl;
}

function fakeElement(): unknown {
  const target = Object.create(null) as Record<string, unknown>;
  return new Proxy(target, {
    get(_target, property) {
      if (property === "length") return 0;
      if (property === "dataset") return {};
      return () => fakeElement();
    },
  });
}

function createFakeGsap(): Record<string, unknown> {
  const gsap: Record<string, unknown> = {
    timeline: () => createFakeTimeline(),
    to: () => gsap,
    from: () => gsap,
    fromTo: () => gsap,
    set: () => gsap,
    registerPlugin: () => undefined,
    utils: { toArray: (value: unknown) => (Array.isArray(value) ? value : [value]) },
  };
  return gsap;
}

function loadHook(beatId: string, compiled: string): BeatHook {
  const module = { exports: {} as Record<string, unknown> };
  const fakeGsap = createFakeGsap();
  const requireForHook = (name: string): unknown => {
    if (name === "gsap") return fakeGsap;
    throw new AvpError(
      "hook-import",
      `节拍 ${beatId} 的钩子只允许引用 gsap；不要 import「${name}」。`,
      { beatId, field: "hook" },
    );
  };

  let exported: unknown;
  try {
    const factory = new Function(
      "module",
      "exports",
      "require",
      "gsap",
      `${compiled}\n;return module.exports && module.exports.default !== undefined ? module.exports.default : module.exports;`,
    );
    exported = factory(module, module.exports, requireForHook, fakeGsap);
  } catch (err) {
    throw new AvpError(
      "hook-invalid",
      `节拍 ${beatId} 的钩子执行失败：${err instanceof Error ? err.message : String(err)}`,
      { beatId, field: "hook" },
    );
  }

  if (typeof exported !== "function") {
    throw new AvpError(
      "hook-invalid",
      `节拍 ${beatId} 的钩子必须 export default 一个函数 (tl, root, ctx) => void。`,
      { beatId, field: "hook" },
    );
  }
  return exported as BeatHook;
}

/**
 * 在假 GSAP 时间线上执行钩子，读取它构建出的总长。
 * 只支持契约允许的那部分 API（timeline / to / from / fromTo / set / add / call）。
 */
export function probeHook(
  beatId: string,
  source: string,
  ctx: { start: number; duration: number },
): HookProbe {
  assertHookSeekSafe(beatId, source);
  const compiled = compileHook(beatId, source);
  const hook = loadHook(beatId, compiled);
  const tl = createFakeTimeline();

  try {
    hook(tl, fakeElement(), ctx);
  } catch (err) {
    throw new AvpError(
      "hook-invalid",
      `节拍 ${beatId} 的钩子运行失败：${err instanceof Error ? err.message : String(err)}`,
      { beatId, field: "hook" },
    );
  }

  const end = tl.duration();
  const duration = Math.max(0, end - ctx.start);

  if (end > ctx.start + ctx.duration + 1e-3) {
    throw new AvpError(
      "hook-overrun",
      `节拍 ${beatId} 的钩子总长 ${duration.toFixed(2)}s，超过该拍时长 ${ctx.duration.toFixed(2)}s。` +
        `\n缩短动效、把钩子拆到下一拍，或加长口播。`,
      {
        beatId,
        field: "hook",
        hookDurationMs: Math.round(duration * 1000),
        beatDurationMs: Math.round(ctx.duration * 1000),
      },
    );
  }

  if (end <= ctx.start + 1e-6) {
    throw new AvpError(
      "hook-empty",
      `节拍 ${beatId} 声明 motion: "hook"，但钩子没有在 ctx.start 之后构建任何动效。` +
        `\n要么写动效，要么把该拍标成 motion: "static"。`,
      { beatId, field: "hook", start: ctx.start },
    );
  }

  return { end, duration };
}

/**
 * 把钩子包成浏览器里可调用的函数表达式。
 * 编译产物是 CommonJS，这里提供一个只认 gsap 的 require。
 */
export function inlineHookModule(beatId: string, compiled: string): string {
  return [
    `(function () {`,
    `  const module = { exports: {} };`,
    `  const exports = module.exports;`,
    `  const require = (name) => {`,
    `    if (name === "gsap") return gsap;`,
    `    throw new Error(${JSON.stringify("节拍 " + beatId + " 的钩子不允许 import ")} + name);`,
    `  };`,
    compiled,
    `  return module.exports && module.exports.default !== undefined ? module.exports.default : module.exports;`,
    `})()`,
  ].join("\n");
}
