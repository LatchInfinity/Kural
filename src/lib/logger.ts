type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: Record<string, unknown>;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || "info";

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatEntry(entry: LogEntry): string {
  const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.module}]`;
  const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : "";
  return `${prefix} ${entry.message}${dataStr}`;
}

function createEntry(level: LogLevel, module: string, message: string, data?: Record<string, unknown>): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    module,
    message,
    data,
  };
}

export const logger = {
  info(module: string, message: string, data?: Record<string, unknown>): void {
    if (!shouldLog("info")) return;
    console.log(formatEntry(createEntry("info", module, message, data)));
  },

  warn(module: string, message: string, data?: Record<string, unknown>): void {
    if (!shouldLog("warn")) return;
    console.warn(formatEntry(createEntry("warn", module, message, data)));
  },

  error(module: string, message: string, data?: Record<string, unknown>): void {
    if (!shouldLog("error")) return;
    console.error(formatEntry(createEntry("error", module, message, data)));
  },

  debug(module: string, message: string, data?: Record<string, unknown>): void {
    if (!shouldLog("debug")) return;
    console.debug(formatEntry(createEntry("debug", module, message, data)));
  },
};
