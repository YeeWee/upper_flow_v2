import { AvpError } from "./errors";

export type FlagValue = string | boolean;

export interface ParsedArgs {
  command: string;
  positionals: string[];
  flags: Record<string, FlagValue>;
}

/** 这些 flag 后跟一个值（`--theme bold-signal` 与 `--theme=bold-signal` 都行）。 */
const VALUE_FLAGS = new Set([
  "theme",
  "chapter",
  "dir",
  "voice",
  "speed",
  "only",
]);

export function parseArgs(argv: string[]): ParsedArgs {
  const hasCommand = Boolean(argv[0]) && !argv[0]!.startsWith("-");
  const command = hasCommand ? argv[0]! : "help";
  const rest = hasCommand ? argv.slice(1) : argv;
  const positionals: string[] = [];
  const flags: Record<string, FlagValue> = {};
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i]!;
    if (arg === "--") {
      positionals.push(...rest.slice(i + 1));
      break;
    }
    if (arg.startsWith("--")) {
      const body = arg.slice(2);
      const eq = body.indexOf("=");
      if (eq >= 0) {
        flags[body.slice(0, eq)] = body.slice(eq + 1);
        continue;
      }
      if (VALUE_FLAGS.has(body)) {
        const next = rest[i + 1];
        if (next === undefined || next.startsWith("-")) {
          throw new AvpError("missing-value", `--${body} 需要一个值`, {
            flag: body,
          });
        }
        flags[body] = next;
        i++;
        continue;
      }
      flags[body] = true;
    } else if (arg.startsWith("-") && arg !== "-") {
      throw new AvpError("unknown-flag", `未知参数：${arg}`, { flag: arg });
    } else {
      positionals.push(arg);
    }
  }
  return { command, positionals, flags };
}

export function flagBool(parsed: ParsedArgs, name: string): boolean {
  return parsed.flags[name] === true;
}

export function flagString(
  parsed: ParsedArgs,
  name: string,
): string | undefined {
  const value = parsed.flags[name];
  return typeof value === "string" ? value : undefined;
}

export function assertKnownFlags(
  parsed: ParsedArgs,
  allowed: string[],
): void {
  for (const key of Object.keys(parsed.flags)) {
    if (!allowed.includes(key)) {
      throw new AvpError("unknown-flag", `本命令不认识 --${key}`, { flag: key });
    }
  }
}
