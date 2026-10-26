import { resolve } from "node:path";
import { assertKnownFlags, flagBool, flagString, parseArgs } from "./lib/args";
import { asAvpError } from "./lib/errors";
import { shortHash } from "./lib/hash";
import { runInit } from "./commands/init";
import { runPlan } from "./commands/plan";
import { renderStatusTable, runStatus } from "./commands/status";

const HELP = `avp — article-video-production

用法: avp <command> [options] [--json]

命令:
  init            初始化项目（项目账本 + TTS 配置 + 演示脚手架）
  plan            校验 script.md / outline.md → beats.json
  plan --approve  写入 plan 停点的批准哈希
  plan --after-plan  校验已有批准与当前稿子 + 节拍一致
  status          四列状态：步骤 / 输入哈希 / 产物 / 状态
  help            显示本帮助

通用参数:
  --json          机器可读输出
  --dir=<path>    项目目录（默认：当前目录）
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
