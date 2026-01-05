/**
 * Niveles de log disponibles
 */
enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Sistema de logging con niveles configurables
 */
class Logger {
  private level: LogLevel;

  /**
   * @param level - Nivel mínimo de log a mostrar (debug, info, warn, error)
   */
  constructor(level: string = 'debug') {
    this.level = (level.toUpperCase() as LogLevel) || LogLevel.INFO;
  }

  /**
   * Determina si un mensaje debe ser registrado según el nivel configurado
   */
  private shouldLog(logLevel: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 1,
      [LogLevel.WARN]: 2,
      [LogLevel.ERROR]: 3,
    };

    return levels[logLevel] >= levels[this.level];
  }

  /**
   * Formatea un mensaje de log con timestamp y metadatos
   */
  private format(level: LogLevel, message: string, meta?: unknown): string {
    const timestamp = new Date().toISOString();

    let metaStr = '';
    if (meta) {
      if (meta instanceof Error) {
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

  /**
   * Registra un mensaje de debug
   */
  debug(message: string, meta?: unknown): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.format(LogLevel.DEBUG, message, meta));
    }
  }

  /**
   * Registra un mensaje informativo
   */
  info(message: string, meta?: unknown): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.format(LogLevel.INFO, message, meta));
    }
  }

  /**
   * Registra una advertencia
   */
  warn(message: string, meta?: unknown): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.format(LogLevel.WARN, message, meta));
    }
  }

  /**
   * Registra un error
   */
  error(message: string, meta?: unknown): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.format(LogLevel.ERROR, message, meta));
    }
  }
}

/**
 * Instancia global del logger
 */
export const logger = new Logger(process.env.LOG_LEVEL || 'debug');
