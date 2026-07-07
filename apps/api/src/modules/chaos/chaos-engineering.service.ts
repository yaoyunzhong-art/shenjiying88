// chaos-engineering.service.ts - T124-2
// 混沌工程服务：故障注入 + 自动回滚
import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ExperimentStatus = 'PENDING' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED';
export type FaultType = 'LATENCY' | 'ERROR' | 'TIMEOUT' | 'CPU_BURN';
export type RollbackTrigger = 'MANUAL' | 'AUTO' | 'SCHEDULED';

export interface FaultInjection {
  type: FaultType;
  target: string;
  params: Record<string, number | string>;
  active: boolean;
  startedAt?: string;
}

export interface ChaosExperiment {
  id: string;
  name: string;
  target: string;
  faultInjections: FaultInjection[];
  status: ExperimentStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  results?: ExperimentResult;
}

export interface ExperimentResult {
  success: boolean;
  durationMs: number;
  metrics: {
    requestsTotal: number;
    requestsFailed: number;
    latencyAvg: number;
    latencyP99: number;
    errorRate: number;
  };
  faultsTriggered: number;
  rollbackTriggered: boolean;
  summary: string;
}

export interface RollbackHistoryEntry {
  id: string;
  experimentId: string;
  trigger: RollbackTrigger;
  reason: string;
  triggeredAt: string;
  completedAt?: string;
  success: boolean;
  healthCheckPassed: boolean;
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  errorRate: number;
  latencyAvg: number;
  healthy: boolean;
}

// ── ChaosExperiment ───────────────────────────────────────────────────────────

@Injectable()
export class ChaosExperimentService {
  private readonly logger = new Logger(ChaosExperimentService.name);
  private readonly experiments = new Map<string, ChaosExperiment>();

  createExperiment(
    name: string,
    target: string,
    injection: Omit<FaultInjection, 'active' | 'startedAt'>,
  ): ChaosExperiment {
    const experiment: ChaosExperiment = {
      id: `exp-${randomUUID()}`,
      name,
      target,
      faultInjections: [{ ...injection, active: false }],
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    this.experiments.set(experiment.id, experiment);
    this.logger.log(`[experiment ${experiment.id}] created: ${name} → ${target}`);
    return experiment;
  }

  async runExperiment(experimentId: string): Promise<ChaosExperiment | undefined> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      this.logger.warn(`[experiment ${experimentId}] not found`);
      return undefined;
    }

    if (experiment.status === 'RUNNING') {
      this.logger.warn(`[experiment ${experimentId}] already running`);
      return experiment;
    }

    experiment.status = 'RUNNING';
    experiment.startedAt = new Date().toISOString();
    experiment.faultInjections.forEach((f) => {
      f.active = true;
      f.startedAt = new Date().toISOString();
    });

    this.logger.log(`[experiment ${experimentId}] running: ${experiment.name}`);
    return experiment;
  }

  async pauseExperiment(experimentId: string): Promise<ChaosExperiment | undefined> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      this.logger.warn(`[experiment ${experimentId}] not found`);
      return undefined;
    }

    experiment.status = 'PAUSED';
    experiment.faultInjections.forEach((f) => {
      f.active = false;
    });

    this.logger.log(`[experiment ${experimentId}] paused: ${experiment.name}`);
    return experiment;
  }

  getExperimentResult(experimentId: string): ExperimentResult | undefined {
    const experiment = this.experiments.get(experimentId);
    return experiment?.results;
  }

  getExperiment(id: string): ChaosExperiment | undefined {
    return this.experiments.get(id);
  }

  listExperiments(): ChaosExperiment[] {
    return Array.from(this.experiments.values());
  }

  completeExperiment(experimentId: string, results: ExperimentResult): void {
    const experiment = this.experiments.get(experimentId);
    if (experiment) {
      experiment.status = results.success ? 'COMPLETED' : 'FAILED';
      experiment.completedAt = new Date().toISOString();
      experiment.results = results;
      this.logger.log(`[experiment ${experimentId}] completed: ${results.summary}`);
    }
  }
}

// ── FaultInjectionService ─────────────────────────────────────────────────────

@Injectable()
export class FaultInjectionService {
  private readonly logger = new Logger(FaultInjectionService.name);
  private readonly activeFaults = new Map<string, FaultInjection>();

  injectLatency(target: string, delayMs: number): FaultInjection {
    const fault: FaultInjection = {
      type: 'LATENCY',
      target,
      params: { delayMs },
      active: true,
      startedAt: new Date().toISOString(),
    };
    this.activeFaults.set(target, fault);
    this.logger.log(`[fault] inject latency → ${target}: +${delayMs}ms`);
    return fault;
  }

  injectError(target: string, errorRate: number): FaultInjection {
    const fault: FaultInjection = {
      type: 'ERROR',
      target,
      params: { errorRate: Math.min(100, Math.max(0, errorRate)) },
      active: true,
      startedAt: new Date().toISOString(),
    };
    this.activeFaults.set(target, fault);
    this.logger.log(`[fault] inject error → ${target}: ${errorRate}%`);
    return fault;
  }

  injectTimeout(target: string, timeoutMs: number): FaultInjection {
    const fault: FaultInjection = {
      type: 'TIMEOUT',
      target,
      params: { timeoutMs },
      active: true,
      startedAt: new Date().toISOString(),
    };
    this.activeFaults.set(target, fault);
    this.logger.log(`[fault] inject timeout → ${target}: ${timeoutMs}ms`);
    return fault;
  }

  injectCPUBurn(target: string, percentage: number): FaultInjection {
    const fault: FaultInjection = {
      type: 'CPU_BURN',
      target,
      params: { percentage: Math.min(100, Math.max(0, percentage)) },
      active: true,
      startedAt: new Date().toISOString(),
    };
    this.activeFaults.set(target, fault);
    this.logger.log(`[fault] inject CPU burn → ${target}: ${percentage}%`);
    return fault;
  }

  stopInjection(target: string): boolean {
    const fault = this.activeFaults.get(target);
    if (!fault) {
      this.logger.warn(`[fault] no active fault for target: ${target}`);
      return false;
    }
    fault.active = false;
    this.activeFaults.delete(target);
    this.logger.log(`[fault] stopped → ${target}`);
    return true;
  }

  getActiveFault(target: string): FaultInjection | undefined {
    return this.activeFaults.get(target);
  }

  getAllActiveFaults(): FaultInjection[] {
    return Array.from(this.activeFaults.values());
  }

  isFaultActive(target: string): boolean {
    const fault = this.activeFaults.get(target);
    return fault?.active ?? false;
  }

  getNetworkLatency(target: string): number {
    const fault = this.activeFaults.get(target);
    if (!fault || !fault.active) return 0;
    if (fault.type === 'LATENCY') {
      return fault.params['delayMs'] as number;
    }
    return 0;
  }

  shouldInjectError(target: string): boolean {
    const fault = this.activeFaults.get(target);
    if (!fault || !fault.active || fault.type !== 'ERROR') return false;
    const errorRate = fault.params['errorRate'] as number;
    return Math.random() * 100 < errorRate;
  }

  isTimeoutEnabled(target: string): { enabled: boolean; timeoutMs: number } {
    const fault = this.activeFaults.get(target);
    if (!fault || !fault.active || fault.type !== 'TIMEOUT') {
      return { enabled: false, timeoutMs: 0 };
    }
    return { enabled: true, timeoutMs: fault.params['timeoutMs'] as number };
  }

  getCPUBurnPercentage(target: string): number {
    const fault = this.activeFaults.get(target);
    if (!fault || !fault.active || fault.type !== 'CPU_BURN') return 0;
    return fault.params['percentage'] as number;
  }
}

// ── AutoRollbackService ────────────────────────────────────────────────────────

@Injectable()
export class ChaosAutoRollbackService {
  private readonly logger = new Logger(ChaosAutoRollbackService.name);
  private readonly rollbackHistory: RollbackHistoryEntry[] = [];
  private healthCheckFailures = new Map<string, number>();
  private readonly HEALTH_THRESHOLD = 3;

  monitorExperiment(experimentId: string, metrics: SystemMetrics): {
    healthy: boolean;
    shouldRollback: boolean;
    failureCount: number;
  } {
    const currentFailures = this.healthCheckFailures.get(experimentId) ?? 0;

    if (!metrics.healthy) {
      const newFailures = currentFailures + 1;
      this.healthCheckFailures.set(experimentId, newFailures);
      this.logger.warn(
        `[rollback monitor] experiment=${experimentId} health check failed (${newFailures}/${this.HEALTH_THRESHOLD})`,
      );

      return {
        healthy: false,
        shouldRollback: newFailures >= this.HEALTH_THRESHOLD,
        failureCount: newFailures,
      };
    }

    if (currentFailures > 0) {
      this.healthCheckFailures.set(experimentId, 0);
      this.logger.log(`[rollback monitor] experiment=${experimentId} health restored`);
    }

    return {
      healthy: true,
      shouldRollback: false,
      failureCount: 0,
    };
  }

  async triggerRollbackIfNeeded(
    experimentId: string,
    reason: string,
  ): Promise<RollbackHistoryEntry | undefined> {
    const failureCount = this.healthCheckFailures.get(experimentId) ?? 0;

    if (failureCount < this.HEALTH_THRESHOLD) {
      return undefined;
    }

    const entry: RollbackHistoryEntry = {
      id: `rb-${randomUUID()}`,
      experimentId,
      trigger: 'AUTO',
      reason,
      triggeredAt: new Date().toISOString(),
      success: false,
      healthCheckPassed: false,
    };

    this.rollbackHistory.push(entry);
    this.logger.warn(`[rollback] triggered for experiment=${experimentId}: ${reason}`);

    // Simulate rollback execution
    entry.completedAt = new Date().toISOString();
    entry.success = true;
    entry.healthCheckPassed = true;

    this.healthCheckFailures.delete(experimentId);
    return entry;
  }

  getRollbackHistory(): RollbackHistoryEntry[] {
    return [...this.rollbackHistory].sort(
      (a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime(),
    );
  }

  getRollbackHistoryForExperiment(experimentId: string): RollbackHistoryEntry[] {
    return this.rollbackHistory.filter((r) => r.experimentId === experimentId);
  }

  resetHealthChecks(experimentId: string): void {
    this.healthCheckFailures.delete(experimentId);
  }

  getHealthCheckFailureCount(experimentId: string): number {
    return this.healthCheckFailures.get(experimentId) ?? 0;
  }

  resetForTests(): void {
    this.rollbackHistory.length = 0;
    this.healthCheckFailures.clear();
  }
}
