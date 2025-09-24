import {ILog} from '@/logs/log';

/**
 * Default logger implementation that writes to console.
 */
const defaultConsoleLogger: ILog = {
  debug: (...args: unknown[]) => console.debug(...args),
  info: (...args: unknown[]) => console.info(...args),
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
};

/**
 * The mutable current logger that tracingLog delegates to.
 */
let currentLogger: ILog = defaultConsoleLogger;

/**
 * Public logger reference that delegates to the current logger.
 * Existing usages like `tracingLog.debug(...)` will continue to work.
 */
export const tracingLog: ILog = {
  debug: (...args: unknown[]) => currentLogger.debug(...args),
  info: (...args: unknown[]) => currentLogger.info(...args),
  warn: (...args: unknown[]) => currentLogger.warn(...args),
  error: (...args: unknown[]) => currentLogger.error(...args),
};

/**
 * Replace the current logger implementation with a custom one.
 */
export function setTracingLogger(logger: ILog): void {
  currentLogger = logger;
}

/**
 * Retrieve the current logger implementation.
 */
export function getTracingLogger(): ILog {
  return currentLogger;
}

/**
 * Reset the logger implementation back to the default console-based logger.
 */
export function resetTracingLogger(): void {
  currentLogger = defaultConsoleLogger;
}
