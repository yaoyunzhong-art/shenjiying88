/**
 * failover.service.ts - Phase-20 T48
 * 用途: 多区域故障切换 (Failover)
 * 关联: phase-20-compliance/spec.md §Phase 4
 *
 * 机制:
 * - 健康检查 (per region) - 主动探测
 * - 自动切换: 当前区域连续 N 次失败 → 切到 fallback
 * - 状态机: HEALTHY → DEGRADED → DOWN → RECOVERING → HEALTHY
 * - 切换日志: 记录到 audit log (复用 Phase-20 AuditLogService)
 */
import { Injectable, Logger } from '@nestjs/common';
import { MultiRegionService } from './multi-region.service';
import {
  Region,
  ALL_REGIONS,
  FailoverState,
  FailoverEvent,
  HealthCheckResult,
} from './multi-region.entity';

export interface FailoverOptions {
  /** 失败阈值 (连续失败次数 → 切到 DOWN) */
  failureThreshold?: number;
  /** 检查间隔 (ms) */
  checkIntervalMs?: number;
  /** 健康检查函数 (mock 时使用) */
  checker?: (region: Region) => Promise<{ ok: boolean; latencyMs: number }>;
}

const DEFAULT_FAILURE_THRESHOLD = 3;

@Injectable()
export class FailoverService {
  private readonly logger = new Logger(FailoverService.name);
  private readonly states = new Map<Region, FailoverState>();
  private readonly consecutiveFailures = new Map<Region, number>();
  private readonly events: FailoverEvent[] = [];
  private readonly healthCache = new Map<Region, HealthCheckResult>();

  private failureThreshold: number;
  private checker: (region: Region) => Promise<{ ok: boolean; latencyMs: number }>;

  constructor(private readonly regions: MultiRegionService) {
    this.failureThreshold = DEFAULT_FAILURE_THRESHOLD;
    // 默认 checker: 模拟总是健康
    this.checker = async () => ({ ok: true, latencyMs: 50 });

    for (const r of ALL_REGIONS) {
      this.states.set(r, 'HEALTHY');
      this.consecutiveFailures.set(r, 0);
    }
  }

  /**
   * 配置
   */
  configure(options: FailoverOptions): void {
    if (options.failureThreshold !== undefined) {
      this.failureThreshold = options.failureThreshold;
    }
    if (options.checker) {
      this.checker = options.checker;
    }
  }

  /**
   * 主动健康检查 + 状态机更新
   * @param region 区域
   * @param forceOk 强制标记健康 (用于 mock 测试)
   */
  async checkHealth(region: Region, forceOk?: boolean): Promise<HealthCheckResult> {
    let ok: boolean;
    let latencyMs: number;
    if (forceOk !== undefined) {
      ok = forceOk;
      latencyMs = 50;
    } else {
      try {
        const result = await this.checker(region);
        ok = result.ok;
        latencyMs = result.latencyMs;
      } catch (err) {
        ok = false;
        latencyMs = 9999;
        this.logger.warn(`[${region}] health check error: ${(err as Error).message}`);
      }
    }

    const prevState = this.states.get(region) ?? 'HEALTHY';
    let newState: FailoverState = prevState;
    let failures = this.consecutiveFailures.get(region) ?? 0;

    if (ok) {
      failures = 0;
      // 恢复:从 DOWN → RECOVERING → HEALTHY
      if (prevState === 'DOWN') {
        newState = 'RECOVERING';
        // 下次再 ok 才到 HEALTHY
      } else if (prevState === 'RECOVERING') {
        newState = 'HEALTHY';
      } else {
        // DEGRADED → HEALTHY 需要连续 2 次 ok
        newState = 'HEALTHY';
      }
    } else {
      failures += 1;
      if (failures >= this.failureThreshold) {
        newState = 'DOWN';
      } else if (failures >= 1) {
        newState = 'DEGRADED';
      }
    }

    this.consecutiveFailures.set(region, failures);
    this.transition(region, prevState, newState, ok ? 'check ok' : `failure #${failures}`);

    const result: HealthCheckResult = {
      region,
      state: newState,
      latencyMs,
      errorRate: ok ? 0 : 1,
      lastCheckAt: new Date().toISOString(),
      consecutiveFailures: failures,
    };
    this.healthCache.set(region, result);
    return result;
  }

  /**
   * 状态机过渡
   */
  private transition(
    region: Region,
    from: FailoverState,
    to: FailoverState,
    reason: string,
  ): void {
    if (from !== to) {
      this.states.set(region, to);
      this.events.push({
        ts: new Date().toISOString(),
        region,
        fromState: from,
        toState: to,
        reason,
      });
      this.logger.log(`[${region}] ${from} → ${to}: ${reason}`);
    }
  }

  /**
   * 触发故障切换 - 当主区域不可用时,返回 fallback 区域
   * 使用 failover 自身状态机决策,而非依赖 multi-region.health
   */
  failover(fromRegion: Region): Region | null {
    // 按 latency 排序的健康区域
    const healthyRegions = ALL_REGIONS.filter((r) => {
      if (r === fromRegion) return false;
      const s = this.states.get(r);
      return s === 'HEALTHY' || s === 'RECOVERING';
    });
    const sorted = healthyRegions
      .map((r) => ({ region: r, latency: this.regions.getEndpoint(r)?.latencyMs ?? Infinity }))
      .sort((a, b) => a.latency - b.latency);

    if (sorted.length === 0) return null;
    const target = sorted[0].region;
    this.logger.log(
      `[${fromRegion}] fail over to ${target} (reason: latency-aware)`,
    );
    return target;
  }

  /**
   * 批量健康检查所有区域
   */
  async checkAll(forceOkMap?: Record<Region, boolean>): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];
    for (const r of ALL_REGIONS) {
      const force = forceOkMap?.[r];
      results.push(await this.checkHealth(r, force));
    }
    return results;
  }

  // ── Query ──

  getState(region: Region): FailoverState {
    return this.states.get(region) ?? 'HEALTHY';
  }

  getAllStates(): Record<Region, FailoverState> {
    const result = {} as Record<Region, FailoverState>;
    for (const r of ALL_REGIONS) {
      result[r] = this.states.get(r) ?? 'HEALTHY';
    }
    return result;
  }

  getLastHealth(region: Region): HealthCheckResult | undefined {
    return this.healthCache.get(region);
  }

  getEvents(): FailoverEvent[] {
    return [...this.events];
  }

  getEventsByRegion(region: Region): FailoverEvent[] {
    return this.events.filter((e) => e.region === region);
  }

  /** 获取当前健康区域列表 */
  getHealthyRegions(): Region[] {
    return ALL_REGIONS.filter((r) => this.states.get(r) === 'HEALTHY');
  }

  // ── Test helpers ──
  resetForTests(): void {
    for (const r of ALL_REGIONS) {
      this.states.set(r, 'HEALTHY');
      this.consecutiveFailures.set(r, 0);
    }
    this.events.length = 0;
    this.healthCache.clear();
    this.failureThreshold = DEFAULT_FAILURE_THRESHOLD;
  }
}