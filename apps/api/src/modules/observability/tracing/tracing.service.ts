/**
 * TracingService — NestJS 注入式 OTel Span 包装
 *
 * 用于业务代码主动创建 span (例如:跨服务的关键业务操作)
 *   constructor(@Inject(TracingService) private readonly trace: TracingService) {}
 *   await this.trace.withSpan('cashier.createOrder', async (span) => {
 *     span.setAttribute('tenantId', tenantId)
 *     // ... 业务
 *   })
 *
 * 当 OTel 未初始化时 (tracing=none),span 为 no-op,业务无感
 */

import { Injectable, Optional } from '@nestjs/common';
import { trace, type Span, type SpanOptions, type Tracer } from '@opentelemetry/api';

@Injectable()
export class TracingService {
  private readonly tracer: Tracer;

  constructor(@Optional() tracerName?: string) {
    this.tracer = trace.getTracer(tracerName ?? 'm5-api');
  }

  /**
   * 在 span 内执行函数。函数抛错时 span 自动记录 error。
   *
   * @param name span 名 (建议 business.action 格式,如 'cashier.createOrder')
   * @param fn 业务函数,接收 Span 用于 setAttribute / addEvent
   */
  async withSpan<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    options?: SpanOptions,
  ): Promise<T> {
    return this.tracer.startActiveSpan(name, options ?? {}, async (span) => {
      try {
        const result = await fn(span);
        span.setStatus({ code: 1 }); // OK
        return result;
      } catch (err) {
        span.recordException(err as Error);
        span.setStatus({ code: 2, message: (err as Error).message }); // ERROR
        throw err;
      } finally {
        span.end();
      }
    });
  }

  /**
   * 同步版本。用于非异步代码块
   */
  withSpanSync<T>(name: string, fn: (span: Span) => T, options?: SpanOptions): T {
    return this.tracer.startActiveSpan(name, options ?? {}, (span) => {
      try {
        const result = fn(span);
        span.setStatus({ code: 1 });
        return result;
      } catch (err) {
        span.recordException(err as Error);
        span.setStatus({ code: 2, message: (err as Error).message });
        throw err;
      } finally {
        span.end();
      }
    });
  }

  /** 获取当前 active span (可能为 noopSpan,业务需兼容) */
  currentSpan(): Span {
    return trace.getActiveSpan() ?? (trace.getTracer('noop').startSpan('noop') as Span);
  }

  /** 直接获取底层 tracer (高级用法) */
  raw(): Tracer {
    return this.tracer;
  }
}
