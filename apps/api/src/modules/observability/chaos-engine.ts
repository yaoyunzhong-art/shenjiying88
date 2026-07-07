/**
 * chaos-engine.ts - Phase-22 T79
 * 故障演练 (Chaos Engineering) 引擎
 *
 * 5 类故障注入:
 * 1. CPU spike: 占用 CPU 资源
 * 2. Memory leak: 持续分配内存
 * 3. Network latency: 注入响应延迟
 * 4. Network partition: 模拟断网
 * 5. Service crash: 强制抛错 / 退出进程
 *
 * 设计:
 * - 所有故障都有 scope (全局 / tenant / endpoint)
 * - 都有持续时间 (auto-revert)
 * - 可注入又可立即回滚
 * - 演练记录到 chaos-experiments
 */
import { randomUUID } from 'node:crypto';

export type ChaosType = 'cpu_spike' | 'memory_leak' | 'latency' | 'partition' | 'crash' | 'exception';

export type ChaosScope = 'global' | 'tenant' | 'endpoint' | 'user';

export interface ChaosExperiment {
  id: string;
  type: ChaosType;
  scope: ChaosScope;
  target?: string;
  /** 故障参数 (e.g. CPU 占用率, 延迟 ms) */
  params: Record<string, number | string>;
  /** 开始时间 */
  startedAt: string;
  /** 结束时间 (自动停止) */
  endsAt?: string;
  /** 演练描述 */
  description?: string;
  /** 状态 */
  status: 'pending' | 'active' | 'completed' | 'rolled-back' | 'failed';
  /** 影响请求数 (演练期间) */
  impact?: {
    totalRequests: number;
    erroredRequests: number;
    avgLatencyMs: number;
  };
}

export interface ChaosPreset {
  name: string;
  type: ChaosType;
  description: string;
  defaultParams: Record<string, number | string>;
}

// ── Default Presets ──

export const CHAOS_PRESETS: ChaosPreset[] = [
  {
    name: 'cpu-spike-90',
    type: 'cpu_spike',
    description: 'CPU 占用率提升到 90%',
    defaultParams: { cpuPercent: 90, durationMs: 60_000 },
  },
  {
    name: 'memory-leak-100mb',
    type: 'memory_leak',
    description: '持续分配内存 100MB',
    defaultParams: { leakBytes: 100 * 1024 * 1024, durationMs: 60_000 },
  },
  {
    name: 'latency-500ms',
    type: 'latency',
    description: '所有响应注入 500ms 延迟',
    defaultParams: { delayMs: 500, durationMs: 60_000, scope: 'global' },
  },
  {
    name: 'latency-p99-2s',
    type: 'latency',
    description: 'P99 注入 2s 延迟 (部分请求)',
    defaultParams: { delayMs: 2000, probability: 0.01, durationMs: 60_000 },
  },
  {
    name: 'partition-tenants',
    type: 'partition',
    description: '特定 tenant 失联',
    defaultParams: { durationMs: 30_000 },
  },
  {
    name: 'crash-all',
    type: 'crash',
    description: '进程崩溃 (强制退出)',
    defaultParams: { exitCode: 1 },
  },
  {
    name: 'exception-5xx',
    type: 'exception',
    description: '5% 请求返回 500',
    defaultParams: { rate: 0.05, durationMs: 60_000 },
  },
];

// ── Active experiments tracker ──

export class ChaosEngine {
  private readonly experiments = new Map<string, ChaosExperiment>();
  private readonly completed: ChaosExperiment[] = [];
  private readonly cleanupTimers = new Map<string, NodeJS.Timeout>();

  /**
   * 启动故障演练
   */
  start(input: {
    type: ChaosType;
    scope: ChaosScope;
    target?: string;
    params?: Record<string, number | string>;
    description?: string;
    autoRevertMs?: number;
  }): ChaosExperiment {
    const id = `chaos-${randomUUID().slice(0, 8)}`;
    const now = new Date();
    const endsAt = input.autoRevertMs
      ? new Date(now.getTime() + input.autoRevertMs).toISOString()
      : undefined;

    const exp: ChaosExperiment = {
      id,
      type: input.type,
      scope: input.scope,
      target: input.target,
      params: input.params ?? {},
      startedAt: now.toISOString(),
      endsAt,
      description: input.description,
      status: 'active',
    };
    this.experiments.set(id, exp);

    if (endsAt) {
      const timer = setTimeout(() => this.complete(id), input.autoRevertMs);
      this.cleanupTimers.set(id, timer);
    }

    return exp;
  }

  /**
   * 列出 active experiments
   */
  listActive(): ChaosExperiment[] {
    return Array.from(this.experiments.values()).filter((e) => e.status === 'active');
  }

  listAll(): ChaosExperiment[] {
    return [...Array.from(this.experiments.values()), ...this.completed];
  }

  get(id: string): ChaosExperiment | undefined {
    return this.experiments.get(id) ?? this.completed.find((e) => e.id === id);
  }

  /**
   * 立即回滚故障
   */
  rollback(id: string): ChaosExperiment | undefined {
    const exp = this.experiments.get(id);
    if (!exp) return undefined;
    const timer = this.cleanupTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.cleanupTimers.delete(id);
    }
    exp.status = 'rolled-back';
    this.experiments.delete(id);
    this.completed.push(exp);
    return exp;
  }

  /**
   * 标记完成 (auto-revert 触发)
   */
  complete(id: string): ChaosExperiment | undefined {
    const exp = this.experiments.get(id);
    if (!exp) return undefined;
    exp.status = 'completed';
    this.cleanupTimers.delete(id);
    this.experiments.delete(id);
    this.completed.push(exp);
    return exp;
  }

  /**
   * 记录演练影响
   */
  recordImpact(id: string, impact: NonNullable<ChaosExperiment['impact']>): void {
    const exp = this.experiments.get(id);
    if (exp) exp.impact = impact;
  }

  /**
   * 全部回滚 (紧急停止)
   */
  rollbackAll(): number {
    let count = 0;
    for (const id of Array.from(this.experiments.keys())) {
      this.rollback(id);
      count++;
    }
    return count;
  }
}

// ── Injectors (实际副作用实现) ──

/**
 * CPU spike injector (同步占用 CPU)
 * 注意:仅用于测试环境,生产禁用 (CHAOS_ENABLED=true)
 */
export class CpuSpikeInjector {
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  start(cpuPercent: number, durationMs: number): { active: () => boolean; stop: () => void } {
    if (process.env.CHAOS_ENABLED !== 'true') {
      console.warn('[chaos] CHAOS_ENABLED !== true, CPU spike disabled');
      return { active: () => false, stop: () => {} };
    }

    this.running = true;
    const intervalMs = 100;
    const busyMs = (intervalMs * cpuPercent) / 100;
    const start = Date.now();

    this.timer = setInterval(() => {
      const until = Date.now() + busyMs;
      while (Date.now() < until && this.running && Date.now() - start < durationMs) {
        Math.random();
      }
      if (Date.now() - start >= durationMs) this.stop();
    }, intervalMs);

    return {
      active: () => this.running,
      stop: () => this.stop(),
    };
  }

  stop(): void {
    this.running = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}

/**
 * Latency injector (Express middleware)
 */
export function latencyMiddleware(delayMs: number, probability = 1) {
  return (req: { url?: string }, _res: unknown, next: () => void) => {
    if (Math.random() < probability) {
      setTimeout(next, delayMs);
    } else {
      next();
    }
  };
}

/**
 * Exception injector (按比例抛 500)
 */
export function exceptionMiddleware(rate: number) {
  return (req: { url?: string }, res: { statusCode: number; end: (s: string) => void }, next: () => void) => {
    if (Math.random() < rate) {
      res.statusCode = 500;
      res.end('chaos-injected-error');
    } else {
      next();
    }
  };
}
