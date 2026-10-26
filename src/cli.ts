import { resolve } from "node:path";
import { assertKnownFlags, flagBool, flagString, parseArgs } from "./lib/args";
import { asAvpError } from "./lib/errors";
import { shortHash } from "./lib/hash";
import { runCheckCommand, renderCheck } from "./commands/check";
import { runComposeCommand } from "./commands/compose";
import { runInit } from "./commands/init";
import { runPlan } from "./commands/plan";
import { runRenderCommand } from "./commands/render";
import { runTtsCommand } from "./commands/tts";
import { renderStatusTable, runStatus } from "./commands/status";

const HELP = `avp — article-video-production

用法: avp <command> [options] [--json]

命令:
  init            初始化项目（项目账本 + TTS 配置 + 演示脚手架）
  plan            校验 script.md / outline.md → beats.json
  plan --approve  写入 plan 停点的批准哈希
  plan --after-plan  校验已有批准与当前稿子 + 节拍一致
  tts             按节拍合成音频，回写实测时长
  compose         生成 composition/index.html 骨架并拼接每拍身体与钩子
  check           分级检查：error 阻断 / warning 可见 / report 只报
  render          渲染成片：check 闸 + mp4 + 回执 + 联系表 + 静帧报告
  render --brief  只给渲染闸简报：check 结论 / 时长表 / 3 张缩略图（不产片）
  status          五列状态：步骤 / 输入哈希 / 产物 / 状态
  help            显示本帮助

通用参数:
  --json          机器可读输出
  --dir=<path>    项目目录（默认：当前目录）
  --only=<ids>    只输出指定检查项（逗号分隔），如 --only=audio-missing
  --help          显示本帮助

退出码: 0 = 成功；非 0 = 失败，并给出可机械修复的原因。
`;

interface CommandOutput {
  json: Record<string, unknown>;
  lines: string[];
  exitCode?: number;
}

async function run(argv: string[]): Promise<CommandOutput> {
  const parsed = parseArgs(argv);
  const cwd = process.cwd();

  if (flagBool(parsed, "help") || parsed.command === "help") {
    return {
      json: { ok: true, command: "help", text: HELP },
      lines: [HELP.trimEnd()],
    };
  }

  switch (parsed.command) {
    case "init": {
      assertKnownFlags(parsed, ["theme", "dir", "json", "help"]);
      if (parsed.positionals.length > 0) {
        throw new Error(
          `init 不接受位置参数：${parsed.positionals.join(" ")}（用 --dir=）`,
        );
      }
      const root = resolve(cwd, flagString(parsed, "dir") ?? ".");
      const result = runInit(root, flagString(parsed, "theme"));
      const lines = result.alreadyInitialized
        ? [
            `✓ 项目已初始化，不覆盖：${result.root}`,
            `  主题：${result.theme}`,
          ]
        : [
            `✓ 初始化完成：${result.root}`,
            `  主题：${result.theme}`,
            `  已生成：${result.created.join(" ")}`,
            ``,
            `下一步：`,
            `  cd presentation && npm install && npm run dev   # 演示预览`,
            `  写 article.md / script.md / outline.md 之后运行 avp plan`,
          ];
      return {
        json: { ok: true, command: "init", ...result },
        lines,
      };
    }

    case "plan": {
      assertKnownFlags(parsed, [
        "approve",
        "after-plan",
        "dir",
        "json",
        "help",
      ]);
      if (parsed.positionals.length > 0) {
        throw new Error(
          `plan 不接受位置参数：${parsed.positionals.join(" ")}（用 --dir=）`,
        );
      }
      const root = resolve(cwd, flagString(parsed, "dir") ?? ".");
      const approve = flagBool(parsed, "approve");
      const afterPlan = flagBool(parsed, "after-plan");
      const result = await runPlan(root, { approve, afterPlan });
      const summary =
        `✓ 节拍清单：${result.chapters} 章 / ${result.beats} 拍 → ${result.writes.join(" ")}` +
        (result.approval
          ? `（已批准 ${shortHash(result.approval.hash)}）`
          : afterPlan
            ? "（批准已核对）"
            : "");
      return {
        json: { ok: true, command: "plan", ...result },
        lines: [summary],
      };
    }

    case "tts": {
      assertKnownFlags(parsed, [
        "chapter",
        "after-plan",
        "dir",
        "json",
        "help",
      ]);
      if (parsed.positionals.length > 0) {
        throw new Error(
          `tts 不接受位置参数：${parsed.positionals.join(" ")}（用 --chapter=）`,
        );
      }
      const root = resolve(cwd, flagString(parsed, "dir") ?? ".");
      const result = runTtsCommand(root, {
        chapter: flagString(parsed, "chapter"),
        afterPlan: flagBool(parsed, "after-plan"),
      });
      const lines = [
        `✓ TTS：合成 ${result.synthesized} / 缓存 ${result.cached} / 静音 ${result.silent} → .avp/tts.json`,
        `  总时长 ${(result.totalDurationMs / 1000).toFixed(2)}s` +
          (result.complete ? "" : "（未完成：还有节拍没有音频）"),
        ...result.warnings.map((warning) => `  ! ${warning}`),
      ];
      return {
        json: { ok: true, command: "tts", ...result },
        lines,
      };
    }

    case "compose": {
      assertKnownFlags(parsed, ["after-plan", "dir", "json", "help"]);
      if (parsed.positionals.length > 0) {
        throw new Error(
          `compose 不接受位置参数：${parsed.positionals.join(" ")}（用 --dir=）`,
        );
      }
      const root = resolve(cwd, flagString(parsed, "dir") ?? ".");
      const result = runComposeCommand(root, {
        afterPlan: flagBool(parsed, "after-plan"),
      });
      const lines = [
        `✓ 合成稿：${result.clips} 拍 / ${result.hooks} 个钩子 / ${(result.totalMs / 1000).toFixed(2)}s → composition/index.html`,
        ...result.warnings.map((warning) => `  ! ${warning}`),
      ];
      return {
        json: { ok: true, command: "compose", ...result },
        lines,
      };
    }

    case "check": {
      assertKnownFlags(parsed, ["only", "dir", "json", "help"]);
      if (parsed.positionals.length > 0) {
        throw new Error(
          `check 不接受位置参数：${parsed.positionals.join(" ")}（用 --dir=）`,
        );
      }
      const root = resolve(cwd, flagString(parsed, "dir") ?? ".");
      const only = flagString(parsed, "only");
      const result = await runCheckCommand(root, {
        only: only
          ?.split(",")
          .map((id) => id.trim())
          .filter(Boolean),
      });
      return {
        json: { ...result },
        lines: renderCheck(result),
        exitCode: result.ok ? 0 : 1,
      };
    }

    case "render": {
      assertKnownFlags(parsed, ["brief", "after-plan", "dir", "json", "help"]);
      if (parsed.positionals.length > 0) {
        throw new Error(
          `render 不接受位置参数：${parsed.positionals.join(" ")}（用 --dir=）`,
        );
      }
      const root = resolve(cwd, flagString(parsed, "dir") ?? ".");
      const result = await runRenderCommand(root, {
        brief: flagBool(parsed, "brief"),
        afterPlan: flagBool(parsed, "after-plan"),
      });
      const gate =
        `check：${result.check.errors} 个 error / ` +
        `${result.check.warnings} 个 warning / ` +
        `${result.check.reports} 个 report`;
      const duration = [
        `时长：${(result.totalMs / 1000).toFixed(2)}s`,
        ...result.chapters.map(
          (row) =>
            `  ${row.chapter}：${row.beats} 拍 / ${(row.durationMs / 1000).toFixed(2)}s`,
        ),
      ];
      if (result.brief) {
        return {
          json: { ok: true, command: "render", ...result },
          lines: [
            gate,
            `时长：${(result.totalMs / 1000).toFixed(2)}s（${result.chapters
              .map(
                (row) =>
                  `${row.chapter} ${row.beats} 拍 / ${(row.durationMs / 1000).toFixed(2)}s`,
              )
              .join(" · ")}）`,
            `缩略图：${(result.thumbnails ?? []).join(", ")}`,
          ],
        };
      }
      return {
        json: { ok: true, command: "render", ...result },
        lines: [
          `✓ 成片：${result.output}（${(result.totalMs / 1000).toFixed(2)}s）`,
          gate,
          ...duration,
          "",
          `回执：${result.receipt}`,
          `联系表：${result.contactSheet}`,
          `静帧报告：${result.stillReport}`,
          `静帧拍：${(result.staticBeats ?? []).join(", ") || "无"}`,
        ],
      };
    }

    case "status": {
      assertKnownFlags(parsed, ["dir", "json", "help"]);
      const root = resolve(cwd, flagString(parsed, "dir") ?? ".");
      const result = runStatus(root);
      const table = renderStatusTable(result);
      return {
        json: { ok: true, command: "status", ...result },
        lines: [
          `项目：${result.project.root}`,
          `主题：${result.project.theme}   skill：${result.project.skill.name}@${result.project.skill.version} (${result.project.skill.commit.slice(0, 7)})`,
          ``,
          ...table,
        ],
      };
    }

    default:
      throw new Error(
        `未知命令：${parsed.command}\n\n${HELP.trimEnd()}`,
      );
  }
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const json = argv.includes("--json");
  try {
    const output = await run(argv);
    if (json) {
      console.log(JSON.stringify(output.json, null, 2));
    } else {
      console.log(output.lines.join("\n"));
    }
    process.exitCode = output.exitCode ?? 0;
  } catch (err) {
    const error = asAvpError(err);
    if (json) {
      console.log(
        JSON.stringify(
          {
            ok: false,
            error: {
              code: error.code,
              message: error.message,
              ...(error.details ? { details: error.details } : {}),
            },
          },
          null,
          2,
        ),
      );
    } else {
      console.error(`✗ ${error.message}`);
    }
    process.exitCode = 1;
  }
}

void main();
