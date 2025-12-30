enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

class Logger {
  private level: LogLevel;

  constructor(level: string = 'debug') {
    this.level = (level.toUpperCase() as LogLevel) || LogLevel.INFO;
  }

  private shouldLog(logLevel: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 1,
      [LogLevel.WARN]: 2,
      [LogLevel.ERROR]: 3,
    };

    return levels[logLevel] >= levels[this.level];
  }

  private format(level: LogLevel, message: string, meta?: unknown): string {
    const timestamp = new Date().toISOString();

    let metaStr = '';
    if (meta) {
      if (meta instanceof Error) {
        // [CORRECCIÓN] Extraer info útil del error
        metaStr = ` ${JSON.stringify({ ...meta, message: meta.message, stack: meta.stack })}`;
      } else if (typeof meta === 'object') {
        try {
          metaStr = ` ${JSON.stringify(meta)}`;
        } catch (e) {
          metaStr = ' [Circular]';
        }
      } else {
        metaStr = ` ${meta}`;
      }
    }

    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  debug(message: string, meta?: unknown): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.format(LogLevel.DEBUG, message, meta));
    }
  }

  info(message: string, meta?: unknown): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.format(LogLevel.INFO, message, meta));
    }
  }

  warn(message: string, meta?: unknown): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.format(LogLevel.WARN, message, meta));
    }
  }

  error(message: string, meta?: unknown): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.format(LogLevel.ERROR, message, meta));
    }
  }
}

export const logger = new Logger(process.env.LOG_LEVEL || 'debug');
