/**
 * load-test.ts - Phase-23 T95
 * 压测 (Load Test)
 *
 * 模式:
 * - 并发请求模拟
 * - RPS (requests per second) 控制
 * - 错误率统计
 * - Latency percentiles (P50/P95/P99)
 * - Ramp-up 渐进加压
 */
import { Injectable } from '@nestjs/common';

// ── Types ──

export interface LoadTestTask {
  id: string;
  payload?: unknown;
}

export interface LoadTestResult {
  totalRequests: number;
  successful: number;
  failed: number;
  errorRate: number;
  actualRps: number;
  totalDurationMs: number;
  latency: {
    p50: number;
    p95: number;
    p99: number;
    min: number;
    max: number;
    mean: number;
  };
  errors: Record<string, number>;
}

export interface LoadTestOptions {
  concurrency?: number;
  requestsPerUser?: number;
  targetRps?: number;
  rampUpMs?: number;
  timeoutMs?: number;
  onProgress?: (completed: number, total: number) => void;
}

export type TaskRunner = (task: LoadTestTask) => Promise<unknown>;

export function defaultMockRunner(task: LoadTestTask): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const latency = 30 + Math.random() * 40;
    setTimeout(() => {
      if (Math.random() < 0.05) reject(new Error('Mock error'));
      else resolve({ taskId: task.id, result: 'ok' });
    }, latency);
  });
}

// ── LoadTester ──

@Injectable()
export class LoadTester {
  async run(runner: TaskRunner, options: LoadTestOptions = {}): Promise<LoadTestResult> {
    const concurrency = options.concurrency ?? 10;
    const requestsPerUser = options.requestsPerUser ?? 100;
    const targetRps = options.targetRps ?? 0;
    const rampUpMs = options.rampUpMs ?? 0;
    const timeoutMs = options.timeoutMs ?? 5000;

    const totalRequests = concurrency * requestsPerUser;
    const start = Date.now();
    const latencies: number[] = [];
    const errors: Record<string, number> = {};
    let successful = 0;
    let failed = 0;
    let completed = 0;

    const userDelay = rampUpMs > 0 ? rampUpMs / concurrency : 0;
    const rpsDelay = targetRps > 0 ? (concurrency * 1000) / targetRps : 0;

    const userPromises: Promise<void>[] = [];

    for (let u = 0; u < concurrency; u++) {
      if (userDelay > 0) await sleep(userDelay);
      userPromises.push(this.runUser(u, requestsPerUser, runner, {
        timeoutMs,
        rpsDelay,
        onLatency: (latency) => latencies.push(latency),
        onResult: (success, errMsg) => {
          if (success) successful++;
          else { failed++; errors[errMsg] = (errors[errMsg] ?? 0) + 1; }
          completed++;
          options.onProgress?.(completed, totalRequests);
        },
      }));
    }

    await Promise.all(userPromises);

    const totalDurationMs = Date.now() - start;
    const actualRps = totalRequests / (totalDurationMs / 1000);

    latencies.sort((a, b) => a - b);
    const percentile = (p: number) => {
      if (latencies.length === 0) return 0;
      const idx = Math.floor((p / 100) * latencies.length);
      return latencies[Math.min(idx, latencies.length - 1)];
    };
    const sumLat = latencies.reduce((s, l) => s + l, 0);
    const mean = latencies.length === 0 ? 0 : sumLat / latencies.length;

    return {
      totalRequests,
      successful,
      failed,
      errorRate: totalRequests === 0 ? 0 : failed / totalRequests,
      actualRps,
      totalDurationMs,
      latency: {
        p50: percentile(50),
        p95: percentile(95),
        p99: percentile(99),
        min: latencies[0] ?? 0,
        max: latencies[latencies.length - 1] ?? 0,
        mean,
      },
      errors,
    };
  }

  private async runUser(
    userIdx: number,
    requests: number,
    runner: TaskRunner,
    opts: { timeoutMs: number; rpsDelay: number; onLatency: (l: number) => void; onResult: (s: boolean, e: string) => void },
  ): Promise<void> {
    for (let i = 0; i < requests; i++) {
      const task: LoadTestTask = { id: `u${userIdx}-r${i}`, payload: { userIdx, reqIdx: i } };
      const start = Date.now();
      try {
        await Promise.race([
          runner(task),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), opts.timeoutMs),
          ),
        ]);
        opts.onLatency(Date.now() - start);
        opts.onResult(true, '');
      } catch (e) {
        opts.onLatency(Date.now() - start);
        opts.onResult(false, (e as Error).message);
      }
      if (opts.rpsDelay > 0) await sleep(opts.rpsDelay);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
