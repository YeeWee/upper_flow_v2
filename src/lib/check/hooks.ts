import { join } from "node:path";
import { AvpError } from "../errors";
import { pathExists, readText } from "../fs";
import { probeHook } from "../hook";
import { durationOf } from "./report";
import { CHECK_IDS } from "./types";
import type { CheckContext } from "./types";

const HOOK_IDS = new Set<string>([
  CHECK_IDS.hookOverrun,
  CHECK_IDS.hookNotSeekSafe,
  CHECK_IDS.hookEmpty,
  CHECK_IDS.hookInvalid,
]);

const HOOK_FIXES: Record<string, string> = {
  [CHECK_IDS.hookOverrun]:
    "缩短动效、拆到下一拍，或加长口播后重跑 avp tts。",
  [CHECK_IDS.hookNotSeekSafe]:
    "去掉 repeat:-1 / rAF / Date.now / 定时器，改成有限时长、相对 ctx.start 的 tl.to/fromTo。",
  [CHECK_IDS.hookEmpty]:
    "在钩子里构建至少一个动效；若刻意静止，把 motion 改成 static 后重跑 avp plan。",
  [CHECK_IDS.hookInvalid]:
    "修好钩子语法与 export default (tl, root, ctx) => void 签名。",
};

/** error：motion: hook 必须有钩子，且钩子可编译、seek-safe、不超拍、不为空。 */
export function checkHooks(ctx: CheckContext): void {
  let startMs = 0;
  for (const beat of ctx.manifest.beats) {
    const durationMs = durationOf(beat);
    const hookPath = join(ctx.paths.hooks, `${beat.id}.hook.ts`);

    if (beat.motion === "hook") {
      if (!pathExists(hookPath)) {
        ctx.findings.push({
          id: CHECK_IDS.hookMissing,
          level: "error",
          beatId: beat.id,
          chapter: beat.chapter,
          field: "hook",
          message:
            `节拍 ${beat.id} 声明 motion: "hook"，但缺少钩子文件：` +
            `composition/hooks/${beat.id}.hook.ts` +
            `\n缺少钩子时合成稿无法构建这一拍的动效。`,
          fix:
            `写 composition/hooks/${beat.id}.hook.ts` +
            `（export default (tl, root, ctx) => …），` +
            `或把该拍 motion 改成 "static" 后重跑 avp plan。`,
        });
      } else {
        try {
          probeHook(beat.id, readText(hookPath), {
            start: startMs / 1000,
            duration: durationMs / 1000,
          });
        } catch (err) {
          const code = err instanceof AvpError ? err.code : "hook-invalid";
          const id = HOOK_IDS.has(code) ? code : CHECK_IDS.hookInvalid;
          ctx.findings.push({
            id,
            level: "error",
            beatId: beat.id,
            chapter: beat.chapter,
            field: "hook",
            message: err instanceof Error ? err.message : String(err),
            fix: HOOK_FIXES[id] ?? HOOK_FIXES[CHECK_IDS.hookInvalid]!,
          });
        }
      }
    }

    // static 拍即使留着旧钩子文件也不报：compose 会忽略它。
    startMs += durationMs;
  }
}
