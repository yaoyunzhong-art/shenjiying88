import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
// chaos-engineering.test.ts - T124-2
// 混沌工程服务测试 (18 tests)
import {
  ChaosExperimentService,
  FaultInjectionService,
  ChaosAutoRollbackService,
  ExperimentStatus,
  SystemMetrics,
} from './chaos-engineering.service';

// ── ChaosExperimentService Tests ────────────────────────────────────────────────

describe('ChaosExperimentService', () => {
  let service: ChaosExperimentService;

  beforeEach(() => {
    service = new ChaosExperimentService();
  });

  describe('createExperiment', () => {
    it('EXP-1 should create experiment with PENDING status', () => {
      const experiment = service.createExperiment(
        ' latency-test',
        'api-service',
        { type: 'LATENCY', target: 'api-service', params: { delayMs: 500 } },
      );
      expect(experiment.status).toBe('PENDING');
      expect(experiment.id).toBeDefined();
      expect(experiment.name).toBe(' latency-test');
      expect(experiment.target).toBe('api-service');
    });

    it('EXP-2 should create experiment with fault injection disabled initially', () => {
      const experiment = service.createExperiment(
        'error-test',
        'payment-service',
        { type: 'ERROR', target: 'payment-service', params: { errorRate: 50 } },
      );
      expect(experiment.faultInjections[0].active).toBe(false);
    });

    it('EXP-3 should store experiment for later retrieval', () => {
      const experiment = service.createExperiment(
        'cpu-burn-test',
        'worker-service',
        { type: 'CPU_BURN', target: 'worker-service', params: { percentage: 80 } },
      );
      const retrieved = service.getExperiment(experiment.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(experiment.id);
    });
  });

  describe('runExperiment', () => {
    it('EXP-4 should change status to RUNNING and activate faults', async () => {
      const experiment = service.createExperiment(
        'run-test',
        'order-service',
        { type: 'TIMEOUT', target: 'order-service', params: { timeoutMs: 3000 } },
      );
      const result = await service.runExperiment(experiment.id);
      expect(result?.status).toBe('RUNNING');
      expect(result?.faultInjections[0].active).toBe(true);
      expect(result?.startedAt).toBeDefined();
    });

    it('EXP-5 should return undefined for non-existent experiment', async () => {
      const result = await service.runExperiment('non-existent-id');
      expect(result).toBeUndefined();
    });
  });

  describe('pauseExperiment', () => {
    it('EXP-6 should change status to PAUSED and deactivate faults', async () => {
      const experiment = service.createExperiment(
        'pause-test',
        'inventory-service',
        { type: 'LATENCY', target: 'inventory-service', params: { delayMs: 200 } },
      );
      await service.runExperiment(experiment.id);
      const paused = await service.pauseExperiment(experiment.id);
      expect(paused?.status).toBe('PAUSED');
      expect(paused?.faultInjections[0].active).toBe(false);
    });
  });

  describe('getExperimentResult', () => {
    it('EXP-7 should record and retrieve experiment results', () => {
      const experiment = service.createExperiment(
        'result-test',
        'user-service',
        { type: 'ERROR', target: 'user-service', params: { errorRate: 10 } },
      );
      const result = {
        success: true,
        durationMs: 5000,
        metrics: {
          requestsTotal: 1000,
          requestsFailed: 50,
          latencyAvg: 150,
          latencyP99: 500,
          errorRate: 0.05,
        },
        faultsTriggered: 3,
        rollbackTriggered: false,
        summary: 'Experiment completed successfully',
      };
      service.completeExperiment(experiment.id, result);
      const retrieved = service.getExperimentResult(experiment.id);
      expect(retrieved?.success).toBe(true);
      expect(retrieved?.metrics.requestsTotal).toBe(1000);
      expect(retrieved?.summary).toContain('completed');
    });
  });
});

// ── FaultInjectionService Tests ────────────────────────────────────────────────

describe('FaultInjectionService', () => {
  let service: FaultInjectionService;

  beforeEach(() => {
    service = new FaultInjectionService();
  });

  describe('injectLatency', () => {
    it('FAULT-1 should inject network latency and increase latency metric', () => {
      service.injectLatency('api-gateway', 500);
      const latency = service.getNetworkLatency('api-gateway');
      expect(latency).toBe(500);
    });

    it('FAULT-2 should stop injection and restore network latency', () => {
      service.injectLatency('api-gateway', 500);
      const stopped = service.stopInjection('api-gateway');
      expect(stopped).toBe(true);
      const latency = service.getNetworkLatency('api-gateway');
      expect(latency).toBe(0);
    });

    it('FAULT-3 should return false when stopping non-existent injection', () => {
      const stopped = service.stopInjection('non-existent');
      expect(stopped).toBe(false);
    });
  });

  describe('injectError', () => {
    it('FAULT-4 should inject error fault with specified rate', () => {
      service.injectError('payment-api', 75);
      const fault = service.getActiveFault('payment-api');
      expect(fault?.type).toBe('ERROR');
      expect(fault?.params['errorRate']).toBe(75);
    });

    it('FAULT-5 should clamp error rate to 0-100 range', () => {
      service.injectError('test-service', 150);
      const fault = service.getActiveFault('test-service');
      expect(fault?.params['errorRate']).toBe(100);

      service.injectError('test-service-2', -20);
      const fault2 = service.getActiveFault('test-service-2');
      expect(fault2?.params['errorRate']).toBe(0);
    });
  });

  describe('injectTimeout', () => {
    it('FAULT-6 should inject timeout fault', () => {
      service.injectTimeout('auth-service', 2000);
      const result = service.isTimeoutEnabled('auth-service');
      expect(result.enabled).toBe(true);
      expect(result.timeoutMs).toBe(2000);
    });
  });

  describe('injectCPUBurn', () => {
    it('FAULT-7 should inject CPU burn with specified percentage', () => {
      service.injectCPUBurn('worker-node', 90);
      const percentage = service.getCPUBurnPercentage('worker-node');
      expect(percentage).toBe(90);
    });
  });

  describe('error injection behavior', () => {
    it('FAULT-8 should fail all requests when error rate is 100%', () => {
      service.injectError('failing-service', 100);
      let errorCount = 0;
      const iterations = 100;
      for (let i = 0; i < iterations; i++) {
        if (service.shouldInjectError('failing-service')) {
          errorCount++;
        }
      }
      expect(errorCount).toBe(iterations);
    });

    it('FAULT-9 should not inject errors when fault is stopped', () => {
      service.injectError('conditionally-failing', 100);
      service.stopInjection('conditionally-failing');
      const shouldError = service.shouldInjectError('conditionally-failing');
      expect(shouldError).toBe(false);
    });
  });
});

// ── ChaosAutoRollbackService Tests ─────────────────────────────────────────────

describe('ChaosAutoRollbackService', () => {
  let service: ChaosAutoRollbackService;

  beforeEach(() => {
    service = new ChaosAutoRollbackService();
  });

  afterEach(() => {
    service.resetForTests();
  });

  describe('monitorExperiment', () => {
    it('AUTO-1 should mark healthy when metrics are good', () => {
      const metrics: SystemMetrics = {
        cpuUsage: 45,
        memoryUsage: 60,
        errorRate: 0.01,
        latencyAvg: 100,
        healthy: true,
      };
      const result = service.monitorExperiment('exp-001', metrics);
      expect(result.healthy).toBe(true);
      expect(result.shouldRollback).toBe(false);
    });

    it('AUTO-2 should increment failure count on unhealthy metrics', () => {
      const unhealthyMetrics: SystemMetrics = {
        cpuUsage: 95,
        memoryUsage: 95,
        errorRate: 0.5,
        latencyAvg: 2000,
        healthy: false,
      };
      const result1 = service.monitorExperiment('exp-002', unhealthyMetrics);
      expect(result1.failureCount).toBe(1);
      expect(result1.shouldRollback).toBe(false);

      const result2 = service.monitorExperiment('exp-002', unhealthyMetrics);
      expect(result2.failureCount).toBe(2);

      const result3 = service.monitorExperiment('exp-002', unhealthyMetrics);
      expect(result3.failureCount).toBe(3);
      expect(result3.shouldRollback).toBe(true);
    });

    it('AUTO-3 should reset failure count when health recovers', () => {
      const unhealthyMetrics: SystemMetrics = {
        cpuUsage: 95,
        memoryUsage: 95,
        errorRate: 0.5,
        latencyAvg: 2000,
        healthy: false,
      };
      const healthyMetrics: SystemMetrics = {
        cpuUsage: 45,
        memoryUsage: 60,
        errorRate: 0.01,
        latencyAvg: 100,
        healthy: true,
      };

      service.monitorExperiment('exp-003', unhealthyMetrics);
      service.monitorExperiment('exp-003', unhealthyMetrics);
      const result = service.monitorExperiment('exp-003', healthyMetrics);
      expect(result.failureCount).toBe(0);
      expect(result.healthy).toBe(true);
    });
  });

  describe('triggerRollbackIfNeeded', () => {
    it('AUTO-4 should trigger automatic rollback when threshold exceeded', async () => {
      const unhealthyMetrics: SystemMetrics = {
        cpuUsage: 98,
        memoryUsage: 98,
        errorRate: 0.8,
        latencyAvg: 5000,
        healthy: false,
      };

      // Reach threshold
      service.monitorExperiment('exp-004', unhealthyMetrics);
      service.monitorExperiment('exp-004', unhealthyMetrics);
      service.monitorExperiment('exp-004', unhealthyMetrics);

      const rollback = await service.triggerRollbackIfNeeded(
        'exp-004',
        'Health check failures exceeded threshold',
      );
      expect(rollback).not.toBeUndefined();
      expect(rollback?.trigger).toBe('AUTO');
      expect(rollback?.success).toBe(true);
    });

    it('AUTO-5 should not trigger rollback when below threshold', async () => {
      const unhealthyMetrics: SystemMetrics = {
        cpuUsage: 95,
        memoryUsage: 95,
        errorRate: 0.5,
        latencyAvg: 2000,
        healthy: false,
      };

      service.monitorExperiment('exp-005', unhealthyMetrics);
      service.monitorExperiment('exp-005', unhealthyMetrics);

      const rollback = await service.triggerRollbackIfNeeded(
        'exp-005',
        'Should not trigger',
      );
      expect(rollback).toBeUndefined();
    });
  });

  describe('getRollbackHistory', () => {
    it('AUTO-6 should record rollback history entry', async () => {
      const unhealthyMetrics: SystemMetrics = {
        cpuUsage: 98,
        memoryUsage: 98,
        errorRate: 0.8,
        latencyAvg: 5000,
        healthy: false,
      };

      service.monitorExperiment('exp-006', unhealthyMetrics);
      service.monitorExperiment('exp-006', unhealthyMetrics);
      service.monitorExperiment('exp-006', unhealthyMetrics);
      await service.triggerRollbackIfNeeded('exp-006', 'Critical failure');

      const history = service.getRollbackHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].experimentId).toBe('exp-006');
    });

    it('AUTO-7 should return rollback history sorted by most recent first', async () => {
      const unhealthyMetrics: SystemMetrics = {
        cpuUsage: 98,
        memoryUsage: 98,
        errorRate: 0.8,
        latencyAvg: 5000,
        healthy: false,
      };

      // Create two rollbacks
      service.monitorExperiment('exp-007a', unhealthyMetrics);
      service.monitorExperiment('exp-007a', unhealthyMetrics);
      service.monitorExperiment('exp-007a', unhealthyMetrics);
      await service.triggerRollbackIfNeeded('exp-007a', 'First rollback');

      service.monitorExperiment('exp-007b', unhealthyMetrics);
      service.monitorExperiment('exp-007b', unhealthyMetrics);
      service.monitorExperiment('exp-007b', unhealthyMetrics);
      await service.triggerRollbackIfNeeded('exp-007b', 'Second rollback');

      const history = service.getRollbackHistory();
      expect(history.length).toBe(2);
      expect(new Date(history[0].triggeredAt).getTime()).toBeGreaterThanOrEqual(
        new Date(history[1].triggeredAt).getTime(),
      );
    });
  });
});
