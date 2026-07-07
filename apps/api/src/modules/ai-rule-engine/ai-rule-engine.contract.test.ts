import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ai-rule-engine] [C] 合约测试
 *
 * 验证 ai-rule-engine 模块的实体 Shape、业务逻辑契约、模拟器契约
 */

import 'reflect-metadata';
import assert from 'node:assert/strict';
import { PolicyConditionOperator, AiProvider, AiExecutionStatus } from '@m5/domain';
import { AiRuleEngineService } from './ai-rule-engine.service';
import type {
  RuleCondition,
  RuleAction,
  RuleEngine,
  MemberLevelInput,
  MemberLevelOutput,
  DeviceAnomalyInput,
  DeviceAnomalyOutput,
  BatchEvaluateRequest,
  BatchEvaluateResponse,
  RiskScoreInput,
  RiskScoreOutput,
  SimulatorRunInput,
  SimulatorBatchRunOutput,
  SimulatorRunOutput,
  Simulator,
} from './ai-rule-engine.entity';

// ─── 服务实例 helper ──────────────────────────────────

function makeService(): AiRuleEngineService {
  return new AiRuleEngineService();
}

// ─── 合约: 实体 Shape ─────────────────────────────────

describe('[ai-rule-engine] 合约: 引擎状态', () => {
  it('getEngineStatus 返回 3 个引擎', () => {
    const svc = makeService();
    const engines = svc.getEngineStatus();
    assert.equal(engines.length, 3);
  });

  it('每个引擎包含必要字段', () => {
    const svc = makeService();
    for (const e of svc.getEngineStatus()) {
      assert.equal(typeof e.engineId, 'string');
      assert.equal(typeof e.engineName, 'string');
      assert.equal(typeof e.conditionsCount, 'number');
      assert.ok(e.conditionsCount >= 3);
      assert.equal(typeof e.actionsCount, 'number');
      assert.ok(e.actionsCount >= 1);
      assert.ok(['ALL', 'ANY'].includes(e.matchStrategy));
      assert.equal(e.status, AiExecutionStatus.Succeeded);
    }
  });

  it('member-level-v1 引擎 matchStrategy = ALL', () => {
    const svc = makeService();
    const memberEngine = svc.getEngineStatus().find((e) => e.engineId === 'member-level-v1');
    assert.ok(memberEngine);
    assert.equal(memberEngine.matchStrategy, 'ALL');
  });

  it('device-anomaly-v1 引擎 matchStrategy = ANY', () => {
    const svc = makeService();
    const deviceEngine = svc.getEngineStatus().find((e) => e.engineId === 'device-anomaly-v1');
    assert.ok(deviceEngine);
    assert.equal(deviceEngine.matchStrategy, 'ANY');
  });

  it('risk-score-v1 引擎 matchStrategy = ANY', () => {
    const svc = makeService();
    const riskEngine = svc.getEngineStatus().find((e) => e.engineId === 'risk-score-v1');
    assert.ok(riskEngine);
    assert.equal(riskEngine.matchStrategy, 'ANY');
  });
});

// ─── 合约: 成员等级评估 ───────────────────────────────

describe('[ai-rule-engine] 合约: evaluateMemberLevel', () => {
  const svipInput: MemberLevelInput = {
    memberId: 'mem-svip-001',
    totalPoints: 8000,
    totalSpend: 20000,
    visitCount: 50,
    tenantId: 't-001',
  };

  const regularInput: MemberLevelInput = {
    memberId: 'mem-regular-001',
    totalPoints: 100,
    totalSpend: 200,
    visitCount: 3,
    tenantId: 't-001',
  };

  it('SVIP 条件全部满足 → suggestedLevel = SVIP', () => {
    const svc = makeService();
    const result = svc.evaluateMemberLevel(svipInput);
    assert.equal(result.memberId, 'mem-svip-001');
    assert.equal(result.suggestedLevel, 'SVIP');
    assert.equal(result.triggeredRules.length, 3); // 三个条件全部命中
    assert.ok(result.confidence >= 0.8);
  });

  it('无触发条件 → REGULAR + confidence=0.3', () => {
    const svc = makeService();
    const result = svc.evaluateMemberLevel(regularInput);
    assert.equal(result.suggestedLevel, 'REGULAR');
    assert.equal(result.triggeredRules.length, 0);
    assert.equal(result.confidence, 0.3);
  });

  it('部分条件满足(ALL策略) → REGULAR', () => {
    const svc = makeService();
    const result = svc.evaluateMemberLevel({
      memberId: 'mem-partial-001',
      totalPoints: 3000,
      totalSpend: 12000,
      visitCount: 25,
      tenantId: 't-001',
    });
    // cond-high-spend ✓, cond-high-points ✗, cond-frequent-visit ✓
    // ALL => false
    assert.equal(result.suggestedLevel, 'REGULAR');
  });

  it('边界: totalSpend = 10000 刚好达标', () => {
    const svc = makeService();
    const result = svc.evaluateMemberLevel({
      memberId: 'mem-boundary-001',
      totalPoints: 5000,
      totalSpend: 10000,
      visitCount: 20,
      tenantId: 't-001',
    });
    // ALL 三个条件刚好达标
    assert.equal(result.suggestedLevel, 'SVIP');
    assert.equal(result.triggeredRules.length, 3);
  });

  it('边界: 极高消费 + 极低积分 → REGULAR', () => {
    const svc = makeService();
    const result = svc.evaluateMemberLevel({
      memberId: 'mem-extreme-001',
      totalPoints: 0,
      totalSpend: 100000,
      visitCount: 0,
      tenantId: 't-001',
    });
    // 只有 cond-high-spend 满足, ALL => false
    assert.equal(result.suggestedLevel, 'REGULAR');
  });

  it('输出 always 包含 memberId', () => {
    const svc = makeService();
    const ids = ['mem-a', 'mem-b', 'mem-c'];
    for (const id of ids) {
      const r = svc.evaluateMemberLevel({
        memberId: id,
        totalPoints: 0,
        totalSpend: 0,
        visitCount: 0,
        tenantId: 't',
      });
      assert.equal(r.memberId, id);
    }
  });
});

// ─── 合约: 设备异常检测 ───────────────────────────────

describe('[ai-rule-engine] 合约: detectDeviceAnomaly', () => {
  it('3 指标超标 → CRITICAL + CPU_SPIKE', () => {
    const svc = makeService();
    const result = svc.detectDeviceAnomaly({
      deviceId: 'dev-crit-001',
      storeId: 'store-001',
      metrics: {
        cpuUsage: 95,
        memoryUsage: 90,
        diskUsage: 92,
        networkLatencyMs: 50,
        errorRate: 0.5,
        uptimeHours: 1000,
      },
      tenantId: 't-001',
    });
    assert.equal(result.isAnomaly, true);
    assert.equal(result.severity, 'CRITICAL');
    assert.equal(result.anomalyType, 'CPU_SPIKE');
    assert.ok(result.triggeredRules.length >= 3);
    assert.ok(result.recommendations.length >= 3);
  });

  it('0 指标超标 → isAnomaly false', () => {
    const svc = makeService();
    const result = svc.detectDeviceAnomaly({
      deviceId: 'dev-healthy-001',
      storeId: 'store-001',
      metrics: {
        cpuUsage: 20,
        memoryUsage: 30,
        diskUsage: 40,
        networkLatencyMs: 50,
        errorRate: 0.5,
        uptimeHours: 100,
      },
      tenantId: 't-001',
    });
    assert.equal(result.isAnomaly, false);
    assert.equal(result.severity, 'LOW');
    assert.deepStrictEqual(result.recommendations, ['All metrics within normal range']);
  });

  it('单点 CPU 异常 → CPU_SPIKE + MEDIUM', () => {
    const svc = makeService();
    const result = svc.detectDeviceAnomaly({
      deviceId: 'dev-cpu-001',
      storeId: 'store-001',
      metrics: {
        cpuUsage: 92,
        memoryUsage: 50,
        diskUsage: 40,
        networkLatencyMs: 50,
        errorRate: 0.5,
        uptimeHours: 500,
      },
      tenantId: 't-001',
    });
    assert.equal(result.isAnomaly, true);
    assert.equal(result.anomalyType, 'CPU_SPIKE');
    assert.equal(result.severity, 'MEDIUM');
  });

  it('双点内存+磁盘 → HIGH + MEMORY_LEAK', () => {
    const svc = makeService();
    const result = svc.detectDeviceAnomaly({
      deviceId: 'dev-dual-001',
      storeId: 'store-001',
      metrics: {
        cpuUsage: 30,
        memoryUsage: 95,
        diskUsage: 92,
        networkLatencyMs: 100,
        errorRate: 1,
        uptimeHours: 300,
      },
      tenantId: 't-001',
    });
    assert.equal(result.isAnomaly, true);
    // memoryUsage 在条件列表中排在 CPU 前面, 所以 anomalyType = MEMORY_LEAK
    assert.equal(result.anomalyType, 'MEMORY_LEAK');
    assert.equal(result.severity, 'HIGH');
    assert.equal(result.triggeredRules.length, 2);
  });

  it('网络延迟异常 → NETWORK_LATENCY', () => {
    const svc = makeService();
    const result = svc.detectDeviceAnomaly({
      deviceId: 'dev-net-001',
      storeId: 'store-001',
      metrics: {
        cpuUsage: 30,
        memoryUsage: 40,
        diskUsage: 50,
        networkLatencyMs: 600,
        errorRate: 1,
        uptimeHours: 200,
      },
      tenantId: 't-001',
    });
    assert.equal(result.isAnomaly, true);
    assert.equal(result.anomalyType, 'NETWORK_LATENCY');
    assert.equal(result.severity, 'MEDIUM');
  });

  it('错误率异常 → HIGH_ERROR_RATE', () => {
    const svc = makeService();
    const result = svc.detectDeviceAnomaly({
      deviceId: 'dev-err-001',
      storeId: 'store-001',
      metrics: {
        cpuUsage: 30,
        memoryUsage: 40,
        diskUsage: 50,
        networkLatencyMs: 100,
        errorRate: 8,
        uptimeHours: 300,
      },
      tenantId: 't-001',
    });
    assert.equal(result.isAnomaly, true);
    assert.equal(result.anomalyType, 'HIGH_ERROR_RATE');
    assert.equal(result.severity, 'MEDIUM');
  });

  it('设备 ID 始终与输入一致', () => {
    const svc = makeService();
    const result = svc.detectDeviceAnomaly({
      deviceId: 'dev-preserve-001',
      storeId: 's1',
      metrics: {
        cpuUsage: 20,
        memoryUsage: 30,
        diskUsage: 40,
        networkLatencyMs: 50,
        errorRate: 0.5,
        uptimeHours: 100,
      },
      tenantId: 't-001',
    });
    assert.equal(result.deviceId, 'dev-preserve-001');
  });
});

// ─── 合约: 批量评估 ───────────────────────────────────

describe('[ai-rule-engine] 合约: batchEvaluate', () => {
  it('混合评估 member + device → 全部成功', () => {
    const svc = makeService();
    const request: BatchEvaluateRequest = {
      items: [
        {
          index: 0,
          type: 'member-level',
          data: {
            memberId: 'batch-mem-001',
            totalPoints: 8000,
            totalSpend: 20000,
            visitCount: 50,
            tenantId: 't-001',
          },
        },
        {
          index: 1,
          type: 'member-level',
          data: {
            memberId: 'batch-mem-002',
            totalPoints: 100,
            totalSpend: 200,
            visitCount: 3,
            tenantId: 't-001',
          },
        },
        {
          index: 2,
          type: 'device-anomaly',
          data: {
            deviceId: 'batch-dev-001',
            storeId: 's1',
            metrics: {
              cpuUsage: 20,
              memoryUsage: 30,
              diskUsage: 40,
              networkLatencyMs: 50,
              errorRate: 0.5,
              uptimeHours: 100,
            },
            tenantId: 't-001',
          },
        },
      ],
    };
    const result = svc.batchEvaluate(request);
    assert.equal(result.total, 3);
    assert.equal(result.succeeded, 3);
    assert.equal(result.failed, 0);
    assert.equal(result.items.length, 3);
    assert.ok(Date.parse(result.timestamp) > 0);
  });

  it('批量顺序与输入一致', () => {
    const svc = makeService();
    const request: BatchEvaluateRequest = {
      items: [
        {
          index: 0,
          type: 'member-level',
          data: {
            memberId: 'first',
            totalPoints: 8000,
            totalSpend: 20000,
            visitCount: 50,
            tenantId: 't-001',
          },
        },
        {
          index: 1,
          type: 'device-anomaly',
          data: {
            deviceId: 'second',
            storeId: 's1',
            metrics: {
              cpuUsage: 20,
              memoryUsage: 30,
              diskUsage: 40,
              networkLatencyMs: 50,
              errorRate: 0.5,
              uptimeHours: 100,
            },
            tenantId: 't-001',
          },
        },
      ],
    };
    const result = svc.batchEvaluate(request);
    assert.equal(result.items[0].index, 0);
    assert.equal(result.items[0].type, 'member-level');
    assert.equal(result.items[0].inputId, 'first');
    assert.equal(result.items[1].index, 1);
    assert.equal(result.items[1].type, 'device-anomaly');
    assert.equal(result.items[1].inputId, 'second');
  });

  it('批量结果的 MemberLevelOutput 含 suggestedLevel', () => {
    const svc = makeService();
    const res = svc.batchEvaluate({
      items: [
        {
          index: 0,
          type: 'member-level',
          data: {
            memberId: 'm1',
            totalPoints: 100,
            totalSpend: 200,
            visitCount: 3,
            tenantId: 't-001',
          },
        },
      ],
    });
    const r = res.items[0].result as MemberLevelOutput;
    assert.equal(r.suggestedLevel, 'REGULAR');
    assert.equal(typeof r.confidence, 'number');
  });

  it('批量结果的 DeviceAnomalyOutput 含 isAnomaly', () => {
    const svc = makeService();
    const res = svc.batchEvaluate({
      items: [
        {
          index: 0,
          type: 'device-anomaly',
          data: {
            deviceId: 'd1',
            storeId: 's1',
            metrics: {
              cpuUsage: 20,
              memoryUsage: 30,
              diskUsage: 40,
              networkLatencyMs: 50,
              errorRate: 0.5,
              uptimeHours: 100,
            },
            tenantId: 't-001',
          },
        },
      ],
    });
    const r = res.items[0].result as DeviceAnomalyOutput;
    assert.equal(r.isAnomaly, false);
  });

  it('空 items → total=0, succeeded=0, failed=0', () => {
    const svc = makeService();
    const res = svc.batchEvaluate({ items: [] });
    assert.equal(res.total, 0);
    assert.equal(res.succeeded, 0);
    assert.equal(res.failed, 0);
    assert.equal(res.items.length, 0);
  });
});

// ─── 合约: 风险评分 ───────────────────────────────────

describe('[ai-rule-engine] 合约: evaluateRiskScore', () => {
  it('高退款+高投诉+大额注销 → CRITICAL', () => {
    const svc = makeService();
    const result = svc.evaluateRiskScore({
      subjectId: 'sub-risky-001',
      subjectType: 'member',
      metrics: {
        refundCount: 10,
        abnormalPaymentCount: 3,
        complaintCount: 5,
        voidRefundAmount: 2000,
        deviceAnomalyCount: 0,
        activeDays: 7,
        recentTransactionAmount: 50000,
      },
      tenantId: 't-001',
    });
    // cond-high-refund ✓(0.25) + cond-abnormal-payment ✓(0.2) + cond-complaints ✓(0.2) + cond-void-refund ✓(0.2)
    // = 25+20+20+20 = 85 + extra(500>=1000?15:0 + 3>=5?10:0) = 85+15 = 100 => CRITICAL
    assert.equal(result.riskLevel, 'CRITICAL');
    assert.ok(result.riskScore >= 80);
    assert.ok(result.triggeredRules.length >= 3);
    assert.ok(result.reasons.length >= 3);
    assert.ok(result.recommendations.length >= 3);
  });

  it('无任何风险指标 → LOW', () => {
    const svc = makeService();
    const result = svc.evaluateRiskScore({
      subjectId: 'sub-safe-001',
      subjectType: 'device',
      metrics: {
        refundCount: 0,
        abnormalPaymentCount: 0,
        complaintCount: 0,
        voidRefundAmount: 0,
        deviceAnomalyCount: 0,
        activeDays: 30,
        recentTransactionAmount: 0,
      },
      tenantId: 't-001',
    });
    assert.equal(result.riskLevel, 'LOW');
    assert.equal(result.riskScore, 0);
    assert.equal(result.triggeredRules.length, 0);
    assert.equal(result.reasons.length, 0);
  });

  it('设备异常 + 小额退款 → MEDIUM (score 25-49)', () => {
    const svc = makeService();
    const result = svc.evaluateRiskScore({
      subjectId: 'sub-med-001',
      subjectType: 'store',
      metrics: {
        refundCount: 3,
        abnormalPaymentCount: 0,
        complaintCount: 0,
        voidRefundAmount: 100,
        deviceAnomalyCount: 2,
        activeDays: 20,
        recentTransactionAmount: 10000,
      },
      tenantId: 't-001',
    });
    // cond-high-refund ✓(0.25) + cond-device-anomaly ✓(0.15) = 25+15=40 => HIGH if >=50 else 25-49 => MEDIUM
    assert.ok(result.riskScore >= 25);
    assert.ok(result.riskScore < 50);
    assert.equal(result.riskLevel, 'MEDIUM');
  });

  it('subjectType = member 正常输出', () => {
    const svc = makeService();
    const result = svc.evaluateRiskScore({
      subjectId: 'sub-mem-001',
      subjectType: 'member',
      metrics: { refundCount: 1, activeDays: 10, recentTransactionAmount: 1000 },
      tenantId: 't-001',
    });
    assert.equal(result.subjectId, 'sub-mem-001');
    assert.ok(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(result.riskLevel));
    assert.ok(Date.parse(result.evaluatedAt) > 0);
  });

  it('大额注销退款触发额外加分', () => {
    const svc = makeService();
    const withoutExtra = svc.evaluateRiskScore({
      subjectId: 'sub-a',
      subjectType: 'member',
      metrics: { refundCount: 0, voidRefundAmount: 800, activeDays: 10 },
      tenantId: 't-001',
    });
    const withExtra = svc.evaluateRiskScore({
      subjectId: 'sub-b',
      subjectType: 'member',
      metrics: { refundCount: 0, voidRefundAmount: 1500, activeDays: 10 },
      tenantId: 't-001',
    });
    // 1500 >= 1000 触发额外 15 分
    assert.ok(withExtra.riskScore >= withoutExtra.riskScore + 14);
  });
});

// ─── 合约: 模拟器 ─────────────────────────────────────

describe('[ai-rule-engine] 合约: 模拟器', () => {
  it('listSimulators 返回 2 个模拟器', () => {
    const svc = makeService();
    const sims = svc.listSimulators();
    assert.equal(sims.length, 2);
  });

  it('模拟器包含必要字段', () => {
    const svc = makeService();
    for (const sim of svc.listSimulators()) {
      assert.equal(typeof sim.id, 'string');
      assert.equal(typeof sim.name, 'string');
      assert.equal(typeof sim.engineId, 'string');
      assert.equal(typeof sim.rounds, 'number');
      assert.ok(sim.rounds > 0);
      assert.equal(typeof sim.timeoutMs, 'number');
      assert.equal(typeof sim.enableMutation, 'boolean');
      assert.ok(Date.parse(sim.createdAt) > 0);
    }
  });

  it('getSimulator 通过 id 找到', () => {
    const svc = makeService();
    const sim = svc.getSimulator('sim-member-level-v1');
    assert.ok(sim);
    assert.equal(sim?.id, 'sim-member-level-v1');
  });

  it('getSimulator 找不到返回 undefined', () => {
    const svc = makeService();
    const sim = svc.getSimulator('non-existent');
    assert.equal(sim, undefined);
  });

  it('单次模拟: member-level SVIP 命中', () => {
    const svc = makeService();
    const result = svc.runSimulator({
      simulatorId: 'sim-member-level-v1',
      dataType: 'member-level',
      data: {
        memberId: 'sim-mem',
        totalPoints: 8000,
        totalSpend: 20000,
        visitCount: 50,
        tenantId: 't-001',
      },
    });
    assert.equal(result.matched, true);
    assert.ok(result.triggeredConditions.length >= 2);
    assert.ok(result.triggeredActions.length >= 1);
    assert.ok(result.matchScore >= 0.8);
    assert.ok(result.executionTimeMs >= 0);
    assert.ok(Date.parse(result.timestamp) > 0);
  });

  it('单次模拟: member-level 普通会员未命中', () => {
    const svc = makeService();
    const result = svc.runSimulator({
      simulatorId: 'sim-member-level-v1',
      dataType: 'member-level',
      data: {
        memberId: 'sim-reg',
        totalPoints: 100,
        totalSpend: 200,
        visitCount: 3,
        tenantId: 't-001',
      },
    });
    assert.equal(result.matched, false);
    assert.equal(result.triggeredConditions.length, 0);
    assert.equal(result.triggeredActions.length, 0);
  });

  it('单次模拟: device-anomaly 正常设备未命中', () => {
    const svc = makeService();
    const result = svc.runSimulator({
      simulatorId: 'sim-device-anomaly-v1',
      dataType: 'device-anomaly',
      data: {
        deviceId: 'sim-dev',
        storeId: 's1',
        metrics: {
          cpuUsage: 20,
          memoryUsage: 30,
          diskUsage: 40,
          networkLatencyMs: 50,
          errorRate: 0.5,
          uptimeHours: 100,
        },
        tenantId: 't-001',
      },
    });
    assert.equal(result.matched, false);
  });

  it('单次模拟: device-anomaly CRITICAL 设备命中', () => {
    const svc = makeService();
    const result = svc.runSimulator({
      simulatorId: 'sim-device-anomaly-v1',
      dataType: 'device-anomaly',
      data: {
        deviceId: 'sim-dev-crit',
        storeId: 's1',
        metrics: {
          cpuUsage: 95,
          memoryUsage: 90,
          diskUsage: 92,
          networkLatencyMs: 50,
          errorRate: 0.5,
          uptimeHours: 1000,
        },
        tenantId: 't-001',
      },
    });
    assert.equal(result.matched, true);
    assert.ok(result.triggeredConditions.length >= 3);
    assert.ok(result.triggeredActions.length >= 1);
  });

  it('单次模拟 verbose 模式包含日志', () => {
    const svc = makeService();
    const result = svc.runSimulator({
      simulatorId: 'sim-member-level-v1',
      dataType: 'member-level',
      data: { memberId: 'sim-v', totalPoints: 0, totalSpend: 0, visitCount: 0, tenantId: 't-001' },
      verbose: true,
    });
    assert.ok(Array.isArray(result.logs));
    assert.ok(result.logs!.length > 0);
    assert.ok(result.logs!.some((l: string) => l.includes('[SIM]')));
  });

  it('条件覆盖 override 生效', () => {
    const svc = makeService();
    const result = svc.runSimulator({
      simulatorId: 'sim-member-level-v1',
      dataType: 'member-level',
      data: {
        memberId: 'sim-ovr',
        totalPoints: 0,
        totalSpend: 0,
        visitCount: 0,
        tenantId: 't-001',
      },
      conditionOverrides: [
        { conditionId: 'cond-high-spend', value: 0 },
        { conditionId: 'cond-high-points', value: 0 },
        { conditionId: 'cond-frequent-visit', value: 0 },
      ],
    });
    // 覆盖后 0>=0 全部满足
    assert.equal(result.matched, true);
  });

  it('不存在的 simulator → 抛出异常', () => {
    const svc = makeService();
    assert.throws(
      () =>
        svc.runSimulator({
          simulatorId: 'does-not-exist',
          dataType: 'member-level',
          data: { memberId: 'x', totalPoints: 0, totalSpend: 0, visitCount: 0, tenantId: 't' },
        }),
      /Simulator does-not-exist not found/,
    );
  });
});

// ─── 合约: 批量模拟 ───────────────────────────────────

describe('[ai-rule-engine] 合约: runSimulatorBatch', () => {
  it('批量模拟返回 Summary 含聚合统计', () => {
    const svc = makeService();
    const summary = svc.runSimulatorBatch({
      simulatorId: 'sim-member-level-v1',
      dataType: 'member-level',
      data: {
        memberId: 'batch-sim',
        totalPoints: 8000,
        totalSpend: 20000,
        visitCount: 50,
        tenantId: 't-001',
      },
      rounds: 10,
    });
    assert.equal(summary.totalRuns, 10);
    assert.equal(summary.simulatorId, 'sim-member-level-v1');
    assert.ok(summary.matchRate >= 0);
    assert.ok(summary.avgExecutionTimeMs >= 0);
    assert.ok(summary.p50ExecutionTimeMs >= 0);
    assert.ok(summary.p95ExecutionTimeMs >= 0);
    assert.ok(summary.p99ExecutionTimeMs >= 0);
    assert.ok(Array.isArray(summary.mostTriggeredConditions));
    assert.equal(summary.results.length, 10);
    assert.equal(typeof summary.recommendation, 'string');
  });

  it('批量模拟全命中 → matchRate=1', () => {
    const svc = makeService();
    const summary = svc.runSimulatorBatch({
      simulatorId: 'sim-member-level-v1',
      dataType: 'member-level',
      data: {
        memberId: 'all-match',
        totalPoints: 99999,
        totalSpend: 99999,
        visitCount: 999,
        tenantId: 't-001',
      },
      rounds: 5,
    });
    assert.equal(summary.matchRate, 1);
    assert.equal(summary.matchedRuns, 5);
  });

  it('批量模拟全未命中 → matchRate=0', () => {
    const svc = makeService();
    const summary = svc.runSimulatorBatch({
      simulatorId: 'sim-member-level-v1',
      dataType: 'member-level',
      data: {
        memberId: 'no-match',
        totalPoints: 0,
        totalSpend: 0,
        visitCount: 0,
        tenantId: 't-001',
      },
      rounds: 5,
    });
    assert.equal(summary.matchRate, 0);
    assert.equal(summary.matchedRuns, 0);
  });

  it('不存在的模拟器 id → 异常', () => {
    const svc = makeService();
    assert.throws(
      () =>
        svc.runSimulatorBatch({
          simulatorId: 'non-existent',
          dataType: 'member-level',
          data: { memberId: 'x', totalPoints: 0, totalSpend: 0, visitCount: 0, tenantId: 't' },
        }),
      /Simulator non-existent not found/,
    );
  });
});

// ─── 合约: 枚举/常量 ──────────────────────────────────

describe('[ai-rule-engine] 合约: 枚举常量', () => {
  it('PolicyConditionOperator 枚举导出', () => {
    assert.equal(typeof PolicyConditionOperator.Gte, 'string');
    assert.equal(PolicyConditionOperator.Eq, 'EQ');
    assert.equal(PolicyConditionOperator.Gte, 'GTE');
  });

  it('AiProvider 枚举导出', () => {
    assert.equal(typeof AiProvider.DeepSeek, 'string');
  });

  it('AiExecutionStatus 枚举导出', () => {
    assert.equal(AiExecutionStatus.Succeeded, 'SUCCEEDED');
  });
});
