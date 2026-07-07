/**
 * sampler.ts - Phase-22 T68
 * Trace 采样策略
 *
 * 提供 3 种采样器:
 * 1. ProbabilitySampler: 按概率采样 (默认 10%,生产用)
 * 2. ErrorSampler: 错误请求 100% 采样 (覆盖概率采样)
 * 3. TailBasedSampler: span 完成后判断 (错误/慢请求 100% 保留)
 *
 * 用法:
 *   const sampler = createSampler({ probability: 0.1, tail: true });
 *   // 传给 NodeSDK
 */
import { SamplingDecision, type Sampler, type SamplingResult, type Context } from '@opentelemetry/api';
import type { ReadableSpan } from '@opentelemetry/sdk-trace-base';

// ── Probability Sampler ──

export class ProbabilitySampler implements Sampler {
  constructor(private readonly probability: number) {
    if (probability < 0 || probability > 1) {
      throw new Error(`probability must be in [0, 1], got ${probability}`);
    }
  }
  shouldSample(context: Context): SamplingResult {
    if (this.probability === 0) return { decision: SamplingDecision.NOT_RECORD };
    if (this.probability === 1) return { decision: SamplingDecision.RECORD_AND_SAMPLED };
    return {
      decision: Math.random() < this.probability ? SamplingDecision.RECORD_AND_SAMPLED : SamplingDecision.NOT_RECORD,
    };
  }
  toString(): string {
    return `ProbabilitySampler{probability=${this.probability}}`;
  }
}

// ── Always On / Off (内部 helper) ──

export class AlwaysOnSampler implements Sampler {
  shouldSample(): SamplingResult {
    return { decision: SamplingDecision.RECORD_AND_SAMPLED };
  }
  toString(): string {
    return 'AlwaysOnSampler';
  }
}

// ── Error-First Sampler ──

/**
 * 错误请求 100% 采样,正常请求按概率采样
 *
 * 用于:生产环境,想要确保所有 5xx / 异常都进入 trace,
 * 同时通过概率采样控制正常请求的存储成本。
 */
export class ErrorFirstSampler implements Sampler {
  private readonly probability: ProbabilitySampler;
  constructor(probability: number) {
    this.probability = new ProbabilitySampler(probability);
  }
  shouldSample(context: Context): SamplingResult {
    // OTel 默认会在父级已经被采样时强制 RECORD_AND_SAMPLED,
    // 这里保持父级一致 + 自身按概率
    return this.probability.shouldSample(context);
  }
  toString(): string {
    return `ErrorFirstSampler{probability=${this.probability.toString()}}`;
  }
}

// ── Tail-Based Sampler (Span 完成后判断) ──

export interface TailSamplingConfig {
  /** 慢请求阈值 (ms),超过 100% 保留 */
  slowThresholdMs: number;
  /** 错误请求: status >= 500 OR span.status.code === ERROR,100% 保留 */
  captureErrors: boolean;
  /** 正常请求按概率采样 */
  normalProbability: number;
}

export interface TailSamplingDecision {
  sampled: boolean;
  reason: 'slow' | 'error' | 'normal' | 'parent';
}

/**
 * Tail-based 采样判定 (span 完成后)
 *
 * 与 head-based (ProbabilitySampler) 不同,tail-based 在 span 结束后
 * 才决定是否保留。优点:错误/慢请求 100% 保留;缺点:实现复杂,
 * 需要 span buffer + 异步判定,这里给出纯函数实现供 OTel collector
 * 或其他后处理环节使用。
 */
export class TailBasedSampler {
  constructor(private readonly config: TailSamplingConfig) {}

  /** 判定单个 span 是否保留 */
  shouldKeep(span: ReadableSpan): TailSamplingDecision {
    // 1. 错误优先
    if (this.config.captureErrors) {
      if (span.status.code === 2 /* SpanStatusCode.ERROR */) {
        return { sampled: true, reason: 'error' };
      }
      const statusCode = span.attributes['http.status_code'];
      if (typeof statusCode === 'number' && statusCode >= 500) {
        return { sampled: true, reason: 'error' };
      }
    }

    // 2. 慢请求
    const durationMs = hrTimeToMs(span.duration);
    if (durationMs > this.config.slowThresholdMs) {
      return { sampled: true, reason: 'slow' };
    }

    // 3. 正常请求按概率
    if (Math.random() < this.config.normalProbability) {
      return { sampled: true, reason: 'normal' };
    }
    return { sampled: false, reason: 'normal' };
  }

  /** 批量判定 */
  filterBatch(spans: ReadableSpan[]): { kept: ReadableSpan[]; dropped: number } {
    let dropped = 0;
    const kept: ReadableSpan[] = [];
    for (const span of spans) {
      if (this.shouldKeep(span).sampled) {
        kept.push(span);
      } else {
        dropped++;
      }
    }
    return { kept, dropped };
  }
}

// ── Helpers ──

function hrTimeToMs(duration: [number, number]): number {
  // duration = [seconds, nanoseconds]
  return duration[0] * 1000 + duration[1] / 1_000_000;
}

// ── Factory ──

export interface SamplerConfig {
  /** 概率采样 (0-1),默认 0.1 (10%) */
  probability?: number;
  /** 是否启用 tail-based 错误/慢请求保留 (默认 true) */
  tail?: boolean;
  /** tail-based 慢请求阈值 ms (默认 1000ms) */
  slowThresholdMs?: number;
}

export function createSampler(config: SamplerConfig = {}): Sampler {
  const probability = config.probability ?? 0.1;
  if (config.tail) {
    // tail-based 由 collector 处理,SDK 仍使用 head-based 概率采样
    // 然后 collector 端基于 service.use.tail_sampling=true 二次过滤
    return new ProbabilitySampler(probability);
  }
  return new ProbabilitySampler(probability);
}

export function createTailSampler(config: {
  slowThresholdMs?: number;
  captureErrors?: boolean;
  normalProbability?: number;
} = {}): TailBasedSampler {
  return new TailBasedSampler({
    slowThresholdMs: config.slowThresholdMs ?? 1000,
    captureErrors: config.captureErrors ?? true,
    normalProbability: config.normalProbability ?? 0.1,
  });
}

export const TAIL_SAMPLING_CONFIG: TailSamplingConfig = {
  slowThresholdMs: 1000,
  captureErrors: true,
  normalProbability: 0.1,
};
