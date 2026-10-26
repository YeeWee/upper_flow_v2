/** 可机械修复的错误：命令失败时给出 code + 人话原因 + 可选定位。 */
export class AvpError extends Error {
  code: string;
  details?: Record<string, unknown>;

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "AvpError";
    this.code = code;
    this.details = details;
  }
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function asAvpError(err: unknown): AvpError {
  if (err instanceof AvpError) return err;
  return new AvpError("internal", errorMessage(err));
}
