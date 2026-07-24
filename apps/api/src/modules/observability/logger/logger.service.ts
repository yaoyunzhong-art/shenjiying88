/**
 * Structured Logger Service (pino)
 *
 * 替代 console.log/warn,提供:
 *   - JSON 格式化输出 (生产) / pino-pretty (开发)
 *   - 子 logger (child bindings) 支持 traceId / requestId / tenantId 上下文
 *   - 级别可调 (LOG_LEVEL env: trace|debug|info|warn|error|fatal)
 *   - 高性能 (pino 同步路径, ~5x 比 console 快)
 *
 * 用法:
 *   constructor(@Inject(LoggerService) private readonly logger: LoggerService) {}
 *   this.logger.info({ orderId, tenantId }, 'order created')
 *   this.logger.child({ tenantId: 't-001' }).warn('payment timeout')
 */

import { Inject, Injectable, Optional } from '@nestjs/common';
import pino, { type Logger as PinoLogger, type StreamEntry } from 'pino';

type DestinationStream = { write(msg: string): void };

export const LOGGER_CONFIG = Symbol.for('m5.logger.config');

export interface LoggerConfig {
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  pretty: boolean;
  redactPaths: string[];
  serviceName: string;
}

export function resolvePrettyMode(): boolean {
  const raw = process.env.LOG_PRETTY?.trim().toLowerCase();
  if (raw === undefined || raw === '') {
    return process.env.NODE_ENV !== 'production';
  }

  if (raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on') {
    return true;
  }

  if (raw === '0' || raw === 'false' || raw === 'no' || raw === 'off') {
    return false;
  }

  return process.env.NODE_ENV !== 'production';
}

const DEFAULT_CONFIG: LoggerConfig = {
  level: (process.env.LOG_LEVEL as LoggerConfig['level']) ?? 'info',
  pretty: resolvePrettyMode(),
  redactPaths: [
    'req.headers.authorization',
    'req.headers.cookie',
    '*.password',
    '*.secret',
    '*.token',
  ],
  serviceName: process.env.SERVICE_NAME ?? 'm5-api',
};

/** 测试用:注入自定义 stream (避免污染 stdout) */
export const LOGGER_DESTINATION = Symbol.for('m5.logger.destination');

@Injectable()
export class LoggerService {
  private readonly root: PinoLogger;
  private readonly config: LoggerConfig;

  constructor(
    @Optional() @Inject(LOGGER_CONFIG) config?: Partial<LoggerConfig>,
    @Optional() @Inject(LOGGER_DESTINATION) destination?: StreamEntry | NodeJS.WritableStream,
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    const redact =
      this.config.redactPaths.length > 0
        ? { paths: this.config.redactPaths, censor: '[REDACTED]' }
        : undefined;
    this.root = pino(
      {
        level: this.config.level,
        base: { service: this.config.serviceName, env: process.env.NODE_ENV ?? 'development' },
        timestamp: pino.stdTimeFunctions.isoTime,
        redact,
        transport:
          this.config.pretty && !destination
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  translateTime: 'SYS:standard',
                  ignore: 'pid,hostname,service,env',
                },
              }
            : undefined,
      },
      destination as DestinationStream,
    );
  }

  /**
   * 获取带上下文的子 logger (traceId / requestId / tenantId)
   * 同一子 logger 的所有日志都自动带上 bindings
   */
  child(bindings: Record<string, unknown>): LoggerService {
    const child = Object.create(LoggerService.prototype) as LoggerService;
    // 直接绑定到 pino 的 child logger,避免再创建 wrapper
    (child as unknown as { root: PinoLogger }).root = this.root.child(bindings);
    (child as unknown as { config: LoggerConfig }).config = this.config;
    return child;
  }

  info(obj: Record<string, unknown>, msg?: string): void {
    this.root.info(obj, msg);
  }

  warn(obj: Record<string, unknown>, msg?: string): void {
    this.root.warn(obj, msg);
  }

  error(obj: Record<string, unknown>, msg?: string): void {
    this.root.error(obj, msg);
  }

  debug(obj: Record<string, unknown>, msg?: string): void {
    this.root.debug(obj, msg);
  }

  trace(obj: Record<string, unknown>, msg?: string): void {
    this.root.trace(obj, msg);
  }

  fatal(obj: Record<string, unknown>, msg?: string): void {
    this.root.fatal(obj, msg);
  }

  /** 测试用:获取底层 pino logger */
  raw(): PinoLogger {
    return this.root;
  }
}
