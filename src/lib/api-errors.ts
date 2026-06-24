export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "Unknown error");
}

export function getErrorStack(error: unknown): string {
  return error instanceof Error ? error.stack || error.message : String(error || "Unknown error");
}
