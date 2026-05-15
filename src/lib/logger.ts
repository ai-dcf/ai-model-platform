const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

const DEV_LEVEL: LogLevel = process.env.NODE_ENV === 'production' ? 'warn' : 'debug';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[DEV_LEVEL];
}

function timestamp(): string {
  return new Date().toISOString();
}

function formatMessage(scope: string, level: LogLevel, message: string, data?: unknown): string {
  const prefix = `[${timestamp()}] [${level.toUpperCase()}] [${scope}]`;
  if (data !== undefined) {
    return `${prefix} ${message} ${typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data)}`;
  }
  return `${prefix} ${message}`;
}

export function createLogger(scope: string) {
  return {
    debug(message: string, data?: unknown) {
      if (shouldLog('debug')) {
        console.log(formatMessage(scope, 'debug', message, data));
      }
    },
    info(message: string, data?: unknown) {
      if (shouldLog('info')) {
        console.info(formatMessage(scope, 'info', message, data));
      }
    },
    warn(message: string, data?: unknown) {
      if (shouldLog('warn')) {
        console.warn(formatMessage(scope, 'warn', message, data));
      }
    },
    error(message: string, data?: unknown) {
      if (shouldLog('error')) {
        console.error(formatMessage(scope, 'error', message, data));
      }
    },
  };
}
