"use strict";
/**
 * 🐜 自动: [ai-rule-engine] [C] 合约测试
 *
 * 验证 ai-rule-engine 模块的实体 Shape、业务逻辑契约、模拟器契约
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const domain_1 = require("@m5/domain");
const ai_rule_engine_service_1 = require("./ai-rule-engine.service");
// ─── 服务实例 helper ──────────────────────────────────
function makeService() {
    return new ai_rule_engine_service_1.AiRuleEngineService();
}
// ─── 合约: 实体 Shape ─────────────────────────────────
(0, node_test_1.describe)('[ai-rule-engine] 合约: 引擎状态', () => {
    (0, node_test_1.default)('getEngineStatus 返回 3 个引擎', () => {
        const svc = makeService();
        const engines = svc.getEngineStatus();
        strict_1.default.equal(engines.length, 3);
    });
    (0, node_test_1.default)('每个引擎包含必要字段', () => {
        const svc = makeService();
        for (const e of svc.getEngineStatus()) {
            strict_1.default.equal(typeof e.engineId, 'string');
            strict_1.default.equal(typeof e.engineName, 'string');
            strict_1.default.equal(typeof e.conditionsCount, 'number');
            strict_1.default.ok(e.conditionsCount >= 3);
            strict_1.default.equal(typeof e.actionsCount, 'number');
            strict_1.default.ok(e.actionsCount >= 1);
            strict_1.default.ok(['ALL', 'ANY'].includes(e.matchStrategy));
            strict_1.default.equal(e.status, domain_1.AiExecutionStatus.Succeeded);
        }
    });
    (0, node_test_1.default)('member-level-v1 引擎 matchStrategy = ALL', () => {
        const svc = makeService();
        const memberEngine = svc.getEngineStatus().find((e) => e.engineId === 'member-level-v1');
        strict_1.default.ok(memberEngine);
        strict_1.default.equal(memberEngine.matchStrategy, 'ALL');
    });
    (0, node_test_1.default)('device-anomaly-v1 引擎 matchStrategy = ANY', () => {
        const svc = makeService();
        const deviceEngine = svc.getEngineStatus().find((e) => e.engineId === 'device-anomaly-v1');
        strict_1.default.ok(deviceEngine);
        strict_1.default.equal(deviceEngine.matchStrategy, 'ANY');
    });
    (0, node_test_1.default)('risk-score-v1 引擎 matchStrategy = ANY', () => {
        const svc = makeService();
        const riskEngine = svc.getEngineStatus().find((e) => e.engineId === 'risk-score-v1');
        strict_1.default.ok(riskEngine);
        strict_1.default.equal(riskEngine.matchStrategy, 'ANY');
    });
});
// ─── 合约: 成员等级评估 ───────────────────────────────
(0, node_test_1.describe)('[ai-rule-engine] 合约: evaluateMemberLevel', () => {
    const svipInput = {
        memberId: 'mem-svip-001',
        totalPoints: 8000,
        totalSpend: 20000,
        visitCount: 50,
        tenantId: 't-001',
    };
    const regularInput = {
        memberId: 'mem-regular-001',
        totalPoints: 100,
        totalSpend: 200,
        visitCount: 3,
        tenantId: 't-001',
    };
    (0, node_test_1.default)('SVIP 条件全部满足 → suggestedLevel = SVIP', () => {
        const svc = makeService();
        const result = svc.evaluateMemberLevel(svipInput);
        strict_1.default.equal(result.memberId, 'mem-svip-001');
        strict_1.default.equal(result.suggestedLevel, 'SVIP');
        strict_1.default.equal(result.triggeredRules.length, 3); // 三个条件全部命中
        strict_1.default.ok(result.confidence >= 0.8);
    });
    (0, node_test_1.default)('无触发条件 → REGULAR + confidence=0.3', () => {
        const svc = makeService();
        const result = svc.evaluateMemberLevel(regularInput);
        strict_1.default.equal(result.suggestedLevel, 'REGULAR');
        strict_1.default.equal(result.triggeredRules.length, 0);
        strict_1.default.equal(result.confidence, 0.3);
    });
    (0, node_test_1.default)('部分条件满足(ALL策略) → REGULAR', () => {
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
        strict_1.default.equal(result.suggestedLevel, 'REGULAR');
    });
    (0, node_test_1.default)('边界: totalSpend = 10000 刚好达标', () => {
        const svc = makeService();
        const result = svc.evaluateMemberLevel({
            memberId: 'mem-boundary-001',
            totalPoints: 5000,
            totalSpend: 10000,
            visitCount: 20,
            tenantId: 't-001',
        });
        // ALL 三个条件刚好达标
        strict_1.default.equal(result.suggestedLevel, 'SVIP');
        strict_1.default.equal(result.triggeredRules.length, 3);
    });
    (0, node_test_1.default)('边界: 极高消费 + 极低积分 → REGULAR', () => {
        const svc = makeService();
        const result = svc.evaluateMemberLevel({
            memberId: 'mem-extreme-001',
            totalPoints: 0,
            totalSpend: 100000,
            visitCount: 0,
            tenantId: 't-001',
        });
        // 只有 cond-high-spend 满足, ALL => false
        strict_1.default.equal(result.suggestedLevel, 'REGULAR');
    });
    (0, node_test_1.default)('输出 always 包含 memberId', () => {
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
            strict_1.default.equal(r.memberId, id);
        }
    });
});
// ─── 合约: 设备异常检测 ───────────────────────────────
(0, node_test_1.describe)('[ai-rule-engine] 合约: detectDeviceAnomaly', () => {
    (0, node_test_1.default)('3 指标超标 → CRITICAL + CPU_SPIKE', () => {
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
        strict_1.default.equal(result.isAnomaly, true);
        strict_1.default.equal(result.severity, 'CRITICAL');
        strict_1.default.equal(result.anomalyType, 'CPU_SPIKE');
        strict_1.default.ok(result.triggeredRules.length >= 3);
        strict_1.default.ok(result.recommendations.length >= 3);
    });
    (0, node_test_1.default)('0 指标超标 → isAnomaly false', () => {
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
        strict_1.default.equal(result.isAnomaly, false);
        strict_1.default.equal(result.severity, 'LOW');
        strict_1.default.deepStrictEqual(result.recommendations, ['All metrics within normal range']);
    });
    (0, node_test_1.default)('单点 CPU 异常 → CPU_SPIKE + MEDIUM', () => {
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
        strict_1.default.equal(result.isAnomaly, true);
        strict_1.default.equal(result.anomalyType, 'CPU_SPIKE');
        strict_1.default.equal(result.severity, 'MEDIUM');
    });
    (0, node_test_1.default)('双点内存+磁盘 → HIGH + MEMORY_LEAK', () => {
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
        strict_1.default.equal(result.isAnomaly, true);
        // memoryUsage 在条件列表中排在 CPU 前面, 所以 anomalyType = MEMORY_LEAK
        strict_1.default.equal(result.anomalyType, 'MEMORY_LEAK');
        strict_1.default.equal(result.severity, 'HIGH');
        strict_1.default.equal(result.triggeredRules.length, 2);
    });
    (0, node_test_1.default)('网络延迟异常 → NETWORK_LATENCY', () => {
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
        strict_1.default.equal(result.isAnomaly, true);
        strict_1.default.equal(result.anomalyType, 'NETWORK_LATENCY');
        strict_1.default.equal(result.severity, 'MEDIUM');
    });
    (0, node_test_1.default)('错误率异常 → HIGH_ERROR_RATE', () => {
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
        strict_1.default.equal(result.isAnomaly, true);
        strict_1.default.equal(result.anomalyType, 'HIGH_ERROR_RATE');
        strict_1.default.equal(result.severity, 'MEDIUM');
    });
    (0, node_test_1.default)('设备 ID 始终与输入一致', () => {
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
        strict_1.default.equal(result.deviceId, 'dev-preserve-001');
    });
});
// ─── 合约: 批量评估 ───────────────────────────────────
(0, node_test_1.describe)('[ai-rule-engine] 合约: batchEvaluate', () => {
    (0, node_test_1.default)('混合评估 member + device → 全部成功', () => {
        const svc = makeService();
        const request = {
            items: [
                {
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
        strict_1.default.equal(result.total, 3);
        strict_1.default.equal(result.succeeded, 3);
        strict_1.default.equal(result.failed, 0);
        strict_1.default.equal(result.items.length, 3);
        strict_1.default.ok(Date.parse(result.timestamp) > 0);
    });
    (0, node_test_1.default)('批量顺序与输入一致', () => {
        const svc = makeService();
        const request = {
            items: [
                {
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
        strict_1.default.equal(result.items[0].index, 0);
        strict_1.default.equal(result.items[0].type, 'member-level');
        strict_1.default.equal(result.items[0].inputId, 'first');
        strict_1.default.equal(result.items[1].index, 1);
        strict_1.default.equal(result.items[1].type, 'device-anomaly');
        strict_1.default.equal(result.items[1].inputId, 'second');
    });
    (0, node_test_1.default)('批量结果的 MemberLevelOutput 含 suggestedLevel', () => {
        const svc = makeService();
        const res = svc.batchEvaluate({
            items: [
                {
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
        const r = res.items[0].result;
        strict_1.default.equal(r.suggestedLevel, 'REGULAR');
        strict_1.default.equal(typeof r.confidence, 'number');
    });
    (0, node_test_1.default)('批量结果的 DeviceAnomalyOutput 含 isAnomaly', () => {
        const svc = makeService();
        const res = svc.batchEvaluate({
            items: [
                {
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
        const r = res.items[0].result;
        strict_1.default.equal(r.isAnomaly, false);
    });
    (0, node_test_1.default)('空 items → total=0, succeeded=0, failed=0', () => {
        const svc = makeService();
        const res = svc.batchEvaluate({ items: [] });
        strict_1.default.equal(res.total, 0);
        strict_1.default.equal(res.succeeded, 0);
        strict_1.default.equal(res.failed, 0);
        strict_1.default.equal(res.items.length, 0);
    });
});
// ─── 合约: 风险评分 ───────────────────────────────────
(0, node_test_1.describe)('[ai-rule-engine] 合约: evaluateRiskScore', () => {
    (0, node_test_1.default)('高退款+高投诉+大额注销 → CRITICAL', () => {
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
        strict_1.default.equal(result.riskLevel, 'CRITICAL');
        strict_1.default.ok(result.riskScore >= 80);
        strict_1.default.ok(result.triggeredRules.length >= 3);
        strict_1.default.ok(result.reasons.length >= 3);
        strict_1.default.ok(result.recommendations.length >= 3);
    });
    (0, node_test_1.default)('无任何风险指标 → LOW', () => {
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
        strict_1.default.equal(result.riskLevel, 'LOW');
        strict_1.default.equal(result.riskScore, 0);
        strict_1.default.equal(result.triggeredRules.length, 0);
        strict_1.default.equal(result.reasons.length, 0);
    });
    (0, node_test_1.default)('设备异常 + 小额退款 → MEDIUM (score 25-49)', () => {
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
        strict_1.default.ok(result.riskScore >= 25);
        strict_1.default.ok(result.riskScore < 50);
        strict_1.default.equal(result.riskLevel, 'MEDIUM');
    });
    (0, node_test_1.default)('subjectType = member 正常输出', () => {
        const svc = makeService();
        const result = svc.evaluateRiskScore({
            subjectId: 'sub-mem-001',
            subjectType: 'member',
            metrics: { refundCount: 1, activeDays: 10, recentTransactionAmount: 1000 },
            tenantId: 't-001',
        });
        strict_1.default.equal(result.subjectId, 'sub-mem-001');
        strict_1.default.ok(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(result.riskLevel));
        strict_1.default.ok(Date.parse(result.evaluatedAt) > 0);
    });
    (0, node_test_1.default)('大额注销退款触发额外加分', () => {
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
        strict_1.default.ok(withExtra.riskScore >= withoutExtra.riskScore + 14);
    });
});
// ─── 合约: 模拟器 ─────────────────────────────────────
(0, node_test_1.describe)('[ai-rule-engine] 合约: 模拟器', () => {
    (0, node_test_1.default)('listSimulators 返回 2 个模拟器', () => {
        const svc = makeService();
        const sims = svc.listSimulators();
        strict_1.default.equal(sims.length, 2);
    });
    (0, node_test_1.default)('模拟器包含必要字段', () => {
        const svc = makeService();
        for (const sim of svc.listSimulators()) {
            strict_1.default.equal(typeof sim.id, 'string');
            strict_1.default.equal(typeof sim.name, 'string');
            strict_1.default.equal(typeof sim.engineId, 'string');
            strict_1.default.equal(typeof sim.rounds, 'number');
            strict_1.default.ok(sim.rounds > 0);
            strict_1.default.equal(typeof sim.timeoutMs, 'number');
            strict_1.default.equal(typeof sim.enableMutation, 'boolean');
            strict_1.default.ok(Date.parse(sim.createdAt) > 0);
        }
    });
    (0, node_test_1.default)('getSimulator 通过 id 找到', () => {
        const svc = makeService();
        const sim = svc.getSimulator('sim-member-level-v1');
        strict_1.default.ok(sim);
        strict_1.default.equal(sim?.id, 'sim-member-level-v1');
    });
    (0, node_test_1.default)('getSimulator 找不到返回 undefined', () => {
        const svc = makeService();
        const sim = svc.getSimulator('non-existent');
        strict_1.default.equal(sim, undefined);
    });
    (0, node_test_1.default)('单次模拟: member-level SVIP 命中', () => {
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
        strict_1.default.equal(result.matched, true);
        strict_1.default.ok(result.triggeredConditions.length >= 2);
        strict_1.default.ok(result.triggeredActions.length >= 1);
        strict_1.default.ok(result.matchScore >= 0.8);
        strict_1.default.ok(result.executionTimeMs >= 0);
        strict_1.default.ok(Date.parse(result.timestamp) > 0);
    });
    (0, node_test_1.default)('单次模拟: member-level 普通会员未命中', () => {
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
        strict_1.default.equal(result.matched, false);
        strict_1.default.equal(result.triggeredConditions.length, 0);
        strict_1.default.equal(result.triggeredActions.length, 0);
    });
    (0, node_test_1.default)('单次模拟: device-anomaly 正常设备未命中', () => {
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
        strict_1.default.equal(result.matched, false);
    });
    (0, node_test_1.default)('单次模拟: device-anomaly CRITICAL 设备命中', () => {
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
        strict_1.default.equal(result.matched, true);
        strict_1.default.ok(result.triggeredConditions.length >= 3);
        strict_1.default.ok(result.triggeredActions.length >= 1);
    });
    (0, node_test_1.default)('单次模拟 verbose 模式包含日志', () => {
        const svc = makeService();
        const result = svc.runSimulator({
            simulatorId: 'sim-member-level-v1',
            dataType: 'member-level',
            data: { memberId: 'sim-v', totalPoints: 0, totalSpend: 0, visitCount: 0, tenantId: 't-001' },
            verbose: true,
        });
        strict_1.default.ok(Array.isArray(result.logs));
        strict_1.default.ok(result.logs.length > 0);
        strict_1.default.ok(result.logs.some((l) => l.includes('[SIM]')));
    });
    (0, node_test_1.default)('条件覆盖 override 生效', () => {
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
        strict_1.default.equal(result.matched, true);
    });
    (0, node_test_1.default)('不存在的 simulator → 抛出异常', () => {
        const svc = makeService();
        strict_1.default.throws(() => svc.runSimulator({
            simulatorId: 'does-not-exist',
            dataType: 'member-level',
            data: { memberId: 'x', totalPoints: 0, totalSpend: 0, visitCount: 0, tenantId: 't' },
        }), /Simulator does-not-exist not found/);
    });
});
// ─── 合约: 批量模拟 ───────────────────────────────────
(0, node_test_1.describe)('[ai-rule-engine] 合约: runSimulatorBatch', () => {
    (0, node_test_1.default)('批量模拟返回 Summary 含聚合统计', () => {
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
        strict_1.default.equal(summary.totalRuns, 10);
        strict_1.default.equal(summary.simulatorId, 'sim-member-level-v1');
        strict_1.default.ok(summary.matchRate >= 0);
        strict_1.default.ok(summary.avgExecutionTimeMs >= 0);
        strict_1.default.ok(summary.p50ExecutionTimeMs >= 0);
        strict_1.default.ok(summary.p95ExecutionTimeMs >= 0);
        strict_1.default.ok(summary.p99ExecutionTimeMs >= 0);
        strict_1.default.ok(Array.isArray(summary.mostTriggeredConditions));
        strict_1.default.equal(summary.results.length, 10);
        strict_1.default.equal(typeof summary.recommendation, 'string');
    });
    (0, node_test_1.default)('批量模拟全命中 → matchRate=1', () => {
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
        strict_1.default.equal(summary.matchRate, 1);
        strict_1.default.equal(summary.matchedRuns, 5);
    });
    (0, node_test_1.default)('批量模拟全未命中 → matchRate=0', () => {
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
        strict_1.default.equal(summary.matchRate, 0);
        strict_1.default.equal(summary.matchedRuns, 0);
    });
    (0, node_test_1.default)('不存在的模拟器 id → 异常', () => {
        const svc = makeService();
        strict_1.default.throws(() => svc.runSimulatorBatch({
            simulatorId: 'non-existent',
            dataType: 'member-level',
            data: { memberId: 'x', totalPoints: 0, totalSpend: 0, visitCount: 0, tenantId: 't' },
        }), /Simulator non-existent not found/);
    });
});
// ─── 合约: 枚举/常量 ──────────────────────────────────
(0, node_test_1.describe)('[ai-rule-engine] 合约: 枚举常量', () => {
    (0, node_test_1.default)('PolicyConditionOperator 枚举导出', () => {
        strict_1.default.equal(typeof domain_1.PolicyConditionOperator.Gte, 'string');
        strict_1.default.equal(domain_1.PolicyConditionOperator.Eq, 'EQ');
        strict_1.default.equal(domain_1.PolicyConditionOperator.Gte, 'GTE');
    });
    (0, node_test_1.default)('AiProvider 枚举导出', () => {
        strict_1.default.equal(typeof domain_1.AiProvider.DeepSeek, 'string');
    });
    (0, node_test_1.default)('AiExecutionStatus 枚举导出', () => {
        strict_1.default.equal(domain_1.AiExecutionStatus.Succeeded, 'SUCCEEDED');
    });
});
//# sourceMappingURL=ai-rule-engine.contract.test.js.map