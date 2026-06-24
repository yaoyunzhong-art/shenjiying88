"use strict";
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
// ── RuleCondition type contract ─────────────────────────────────
(0, node_test_1.describe)('ai-rule-engine.entity: RuleCondition', () => {
    (0, node_test_1.default)('creates valid RuleCondition with all required fields', () => {
        const cond = {
            id: 'cond-001',
            engineId: 'engine-v1',
            field: 'totalSpend',
            operator: domain_1.PolicyConditionOperator.Gte,
            value: 10000,
            weight: 0.4,
            description: '消费金额 >= 10000'
        };
        strict_1.default.equal(cond.id, 'cond-001');
        strict_1.default.equal(cond.engineId, 'engine-v1');
        strict_1.default.equal(cond.field, 'totalSpend');
        strict_1.default.equal(cond.operator, domain_1.PolicyConditionOperator.Gte);
        strict_1.default.equal(cond.value, 10000);
        strict_1.default.equal(cond.weight, 0.4);
        strict_1.default.equal(cond.description, '消费金额 >= 10000');
    });
    (0, node_test_1.default)('creates RuleCondition without optional description', () => {
        const cond = {
            id: 'cond-002',
            engineId: 'engine-v1',
            field: 'visitCount',
            operator: domain_1.PolicyConditionOperator.Lte,
            value: 5,
            weight: 0.3
        };
        strict_1.default.equal(cond.id, 'cond-002');
        strict_1.default.equal(cond.description, undefined);
    });
    (0, node_test_1.default)('weight is a number in 0-1 range', () => {
        const cond = {
            id: 'cond-003',
            engineId: 'engine-v2',
            field: 'errorRate',
            operator: domain_1.PolicyConditionOperator.Gte,
            value: 5,
            weight: 0.15
        };
        strict_1.default.ok(cond.weight >= 0 && cond.weight <= 1);
    });
    (0, node_test_1.default)('value supports unknown type for flexibility', () => {
        const stringCond = {
            id: 'cond-str',
            engineId: 'eng-str',
            field: 'status',
            operator: domain_1.PolicyConditionOperator.Eq,
            value: 'ACTIVE',
            weight: 1
        };
        strict_1.default.equal(stringCond.value, 'ACTIVE');
        const arrayCond = {
            id: 'cond-arr',
            engineId: 'eng-arr',
            field: 'level',
            operator: domain_1.PolicyConditionOperator.In,
            value: ['VIP', 'SVIP'],
            weight: 1
        };
        strict_1.default.deepEqual(arrayCond.value, ['VIP', 'SVIP']);
    });
});
// ── RuleAction type contract ────────────────────────────────────
(0, node_test_1.describe)('ai-rule-engine.entity: RuleAction', () => {
    (0, node_test_1.default)('creates valid ASSIGN_LEVEL action', () => {
        const action = {
            id: 'act-001',
            engineId: 'engine-v1',
            type: 'ASSIGN_LEVEL',
            params: { level: 'SVIP' },
            priority: 1,
            description: '分配 SVIP 等级'
        };
        strict_1.default.equal(action.id, 'act-001');
        strict_1.default.equal(action.type, 'ASSIGN_LEVEL');
        strict_1.default.deepEqual(action.params, { level: 'SVIP' });
        strict_1.default.equal(action.priority, 1);
    });
    (0, node_test_1.default)('creates valid FLAG_ANOMALY action', () => {
        const action = {
            id: 'act-002',
            engineId: 'engine-v2',
            type: 'FLAG_ANOMALY',
            params: { severity: 'CRITICAL' },
            priority: 2
        };
        strict_1.default.equal(action.type, 'FLAG_ANOMALY');
        strict_1.default.equal(action.priority, 2);
    });
    (0, node_test_1.default)('creates valid SEND_NOTIFICATION action', () => {
        const action = {
            id: 'act-003',
            engineId: 'engine-v1',
            type: 'SEND_NOTIFICATION',
            params: { channel: 'sms', message: '异常告警' },
            priority: 3
        };
        strict_1.default.equal(action.type, 'SEND_NOTIFICATION');
    });
    (0, node_test_1.default)('creates valid ESCALATE action', () => {
        const action = {
            id: 'act-004',
            engineId: 'engine-v1',
            type: 'ESCALATE',
            params: { channel: 'ops-team' },
            priority: 1
        };
        strict_1.default.equal(action.type, 'ESCALATE');
    });
    (0, node_test_1.default)('priority is within valid range 1-10', () => {
        const low = {
            id: 'low-prio',
            engineId: 'eng',
            type: 'SEND_NOTIFICATION',
            params: {},
            priority: 10
        };
        strict_1.default.equal(low.priority, 10);
        const high = {
            id: 'high-prio',
            engineId: 'eng',
            type: 'ASSIGN_LEVEL',
            params: {},
            priority: 1
        };
        strict_1.default.equal(high.priority, 1);
    });
});
// ── RuleEngine type contract ────────────────────────────────────
(0, node_test_1.describe)('ai-rule-engine.entity: RuleEngine', () => {
    (0, node_test_1.default)('creates valid RuleEngine with ALL match strategy', () => {
        const conditions = [
            { id: 'c1', engineId: 'eng-v1', field: 'points', operator: domain_1.PolicyConditionOperator.Gte, value: 5000, weight: 0.5 },
            { id: 'c2', engineId: 'eng-v1', field: 'spend', operator: domain_1.PolicyConditionOperator.Gte, value: 10000, weight: 0.5 }
        ];
        const actions = [
            { id: 'a1', engineId: 'eng-v1', type: 'ASSIGN_LEVEL', params: { level: 'VIP' }, priority: 1 }
        ];
        const engine = {
            id: 'eng-v1',
            name: 'Member Level Evaluator',
            provider: domain_1.AiProvider.DeepSeek,
            model: 'deepseek-v4',
            conditions,
            actions,
            matchStrategy: 'ALL',
            status: domain_1.AiExecutionStatus.Succeeded,
            description: '评估会员等级'
        };
        strict_1.default.equal(engine.id, 'eng-v1');
        strict_1.default.equal(engine.provider, domain_1.AiProvider.DeepSeek);
        strict_1.default.equal(engine.matchStrategy, 'ALL');
        strict_1.default.equal(engine.conditions.length, 2);
        strict_1.default.equal(engine.actions.length, 1);
        strict_1.default.equal(engine.status, domain_1.AiExecutionStatus.Succeeded);
    });
    (0, node_test_1.default)('creates valid RuleEngine with ANY match strategy', () => {
        const engine = {
            id: 'eng-v2',
            name: 'Device Anomaly Detector',
            provider: domain_1.AiProvider.DeepSeek,
            model: 'deepseek-v4',
            conditions: [],
            actions: [],
            matchStrategy: 'ANY',
            status: domain_1.AiExecutionStatus.Pending
        };
        strict_1.default.equal(engine.matchStrategy, 'ANY');
        strict_1.default.equal(engine.status, domain_1.AiExecutionStatus.Pending);
        strict_1.default.equal(engine.conditions.length, 0);
    });
    (0, node_test_1.default)('lastEvaluatedAt is optional and can be ISO date string', () => {
        const engine = {
            id: 'eng-v3',
            name: 'Test Engine',
            provider: domain_1.AiProvider.DeepSeek,
            model: 'deepseek-v4',
            conditions: [],
            actions: [],
            matchStrategy: 'ALL',
            status: domain_1.AiExecutionStatus.Succeeded,
            lastEvaluatedAt: '2026-06-14T06:00:00.000Z'
        };
        strict_1.default.equal(engine.lastEvaluatedAt, '2026-06-14T06:00:00.000Z');
        // Verify it's valid ISO
        strict_1.default.ok(!isNaN(Date.parse(engine.lastEvaluatedAt)));
    });
    (0, node_test_1.default)('description is optional', () => {
        const engine = {
            id: 'eng-no-desc',
            name: 'No Description',
            provider: domain_1.AiProvider.OpenAI,
            model: 'gpt-4',
            conditions: [],
            actions: [],
            matchStrategy: 'ANY',
            status: domain_1.AiExecutionStatus.Failed
        };
        strict_1.default.equal(engine.description, undefined);
    });
});
// ── MemberLevelInput type contract ──────────────────────────────
(0, node_test_1.describe)('ai-rule-engine.entity: MemberLevelInput', () => {
    (0, node_test_1.default)('creates valid MemberLevelInput', () => {
        const input = {
            memberId: 'mem-001',
            totalPoints: 6000,
            totalSpend: 12000,
            visitCount: 25,
            tenantId: 'tenant-1'
        };
        strict_1.default.equal(input.memberId, 'mem-001');
        strict_1.default.equal(input.totalPoints, 6000);
        strict_1.default.equal(input.totalSpend, 12000);
        strict_1.default.equal(input.visitCount, 25);
        strict_1.default.equal(input.tenantId, 'tenant-1');
    });
    (0, node_test_1.default)('accepts zero values for new members', () => {
        const input = {
            memberId: 'new-member',
            totalPoints: 0,
            totalSpend: 0,
            visitCount: 0,
            tenantId: 'tenant-1'
        };
        strict_1.default.equal(input.totalPoints, 0);
        strict_1.default.equal(input.totalSpend, 0);
        strict_1.default.equal(input.visitCount, 0);
    });
    (0, node_test_1.default)('field types are correct', () => {
        const input = {
            memberId: 'mem-002',
            totalPoints: 3000,
            totalSpend: 8000,
            visitCount: 15,
            tenantId: 'tenant-2'
        };
        strict_1.default.equal(typeof input.memberId, 'string');
        strict_1.default.equal(typeof input.totalPoints, 'number');
        strict_1.default.equal(typeof input.totalSpend, 'number');
        strict_1.default.equal(typeof input.visitCount, 'number');
        strict_1.default.equal(typeof input.tenantId, 'string');
    });
});
// ── MemberLevelOutput type contract ─────────────────────────────
(0, node_test_1.describe)('ai-rule-engine.entity: MemberLevelOutput', () => {
    (0, node_test_1.default)('creates valid MemberLevelOutput with triggered rules', () => {
        const output = {
            memberId: 'mem-001',
            currentLevel: 'VIP',
            suggestedLevel: 'SVIP',
            triggeredRules: ['cond-high-spend', 'cond-frequent-visit'],
            confidence: 0.85
        };
        strict_1.default.equal(output.memberId, 'mem-001');
        strict_1.default.equal(output.currentLevel, 'VIP');
        strict_1.default.equal(output.suggestedLevel, 'SVIP');
        strict_1.default.deepEqual(output.triggeredRules, ['cond-high-spend', 'cond-frequent-visit']);
        strict_1.default.ok(output.confidence >= 0 && output.confidence <= 1);
    });
    (0, node_test_1.default)('creates output with no triggered rules（无匹配）', () => {
        const output = {
            memberId: 'mem-002',
            currentLevel: 'REGULAR',
            suggestedLevel: 'REGULAR',
            triggeredRules: [],
            confidence: 0.3
        };
        strict_1.default.equal(output.triggeredRules.length, 0);
        strict_1.default.equal(output.confidence, 0.3);
    });
    (0, node_test_1.default)('confidence is always between 0 and 1', () => {
        const boundaries = [0, 0.5, 1.0];
        for (const c of boundaries) {
            const output = {
                memberId: 'mem-test',
                currentLevel: 'REGULAR',
                suggestedLevel: 'REGULAR',
                triggeredRules: [],
                confidence: c
            };
            strict_1.default.ok(output.confidence >= 0 && output.confidence <= 1);
        }
    });
});
// ── DeviceAnomalyInput type contract ────────────────────────────
(0, node_test_1.describe)('ai-rule-engine.entity: DeviceAnomalyInput', () => {
    (0, node_test_1.default)('creates valid DeviceAnomalyInput', () => {
        const input = {
            deviceId: 'dev-001',
            storeId: 'store-1',
            metrics: {
                cpuUsage: 95,
                memoryUsage: 88,
                diskUsage: 92,
                networkLatencyMs: 600,
                errorRate: 7,
                uptimeHours: 100
            },
            tenantId: 'tenant-1'
        };
        strict_1.default.equal(input.deviceId, 'dev-001');
        strict_1.default.equal(input.storeId, 'store-1');
        strict_1.default.equal(input.metrics.cpuUsage, 95);
        strict_1.default.equal(input.metrics.memoryUsage, 88);
        strict_1.default.equal(input.metrics.diskUsage, 92);
        strict_1.default.equal(input.metrics.networkLatencyMs, 600);
        strict_1.default.equal(input.metrics.errorRate, 7);
        strict_1.default.equal(input.metrics.uptimeHours, 100);
        strict_1.default.equal(input.tenantId, 'tenant-1');
    });
    (0, node_test_1.default)('metrics fields are all numbers', () => {
        const input = {
            deviceId: 'dev-002',
            storeId: 'store-2',
            metrics: {
                cpuUsage: 50,
                memoryUsage: 50,
                diskUsage: 50,
                networkLatencyMs: 100,
                errorRate: 1,
                uptimeHours: 200
            },
            tenantId: 'tenant-2'
        };
        for (const [key, val] of Object.entries(input.metrics)) {
            strict_1.default.equal(typeof val, 'number', `metrics.${key} should be number`);
        }
    });
});
// ── DeviceAnomalyOutput type contract ───────────────────────────
(0, node_test_1.describe)('ai-rule-engine.entity: DeviceAnomalyOutput', () => {
    (0, node_test_1.default)('creates anomaly detected output with CRITICAL severity', () => {
        const output = {
            deviceId: 'dev-001',
            isAnomaly: true,
            anomalyType: 'CPU_SPIKE',
            severity: 'CRITICAL',
            triggeredRules: ['cond-cpu-high', 'cond-memory-high', 'cond-disk-high'],
            recommendations: ['检查高性能进程', '排查内存泄漏', '清理日志']
        };
        strict_1.default.equal(output.isAnomaly, true);
        strict_1.default.equal(output.anomalyType, 'CPU_SPIKE');
        strict_1.default.equal(output.severity, 'CRITICAL');
        strict_1.default.ok(output.triggeredRules.length >= 3);
    });
    (0, node_test_1.default)('creates normal output with no anomaly', () => {
        const output = {
            deviceId: 'dev-002',
            isAnomaly: false,
            severity: 'LOW',
            triggeredRules: [],
            recommendations: ['All metrics within normal range']
        };
        strict_1.default.equal(output.isAnomaly, false);
        strict_1.default.equal(output.severity, 'LOW');
        strict_1.default.equal(output.anomalyType, undefined);
        strict_1.default.equal(output.triggeredRules.length, 0);
    });
    (0, node_test_1.default)('severity extends valid values: LOW / MEDIUM / HIGH / CRITICAL', () => {
        const severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
        for (const sev of severities) {
            const output = {
                deviceId: 'dev-sev',
                isAnomaly: sev !== 'LOW',
                severity: sev,
                triggeredRules: [],
                recommendations: []
            };
            strict_1.default.ok(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(output.severity));
        }
    });
    // ── BatchEvaluate type contracts ─────────────────────────────────
    (0, node_test_1.describe)('ai-rule-engine.entity: BatchEvaluate', () => {
        (0, node_test_1.default)('creates valid BatchEvaluateRequest with mixed items', () => {
            const request = {
                items: [
                    {
                        type: 'member-level',
                        data: { memberId: 'mem-001', totalPoints: 8000, totalSpend: 20000, visitCount: 50, tenantId: 't-001' }
                    },
                    {
                        type: 'device-anomaly',
                        data: {
                            deviceId: 'dev-001', storeId: 'store-1',
                            metrics: { cpuUsage: 95, memoryUsage: 88, diskUsage: 92, networkLatencyMs: 600, errorRate: 7, uptimeHours: 100 },
                            tenantId: 't-001'
                        }
                    }
                ]
            };
            strict_1.default.equal(request.items.length, 2);
            strict_1.default.equal(request.items[0].type, 'member-level');
            strict_1.default.equal(request.items[1].type, 'device-anomaly');
        });
        (0, node_test_1.default)('BatchEvaluateItem carries index and result', () => {
            const item = {
                index: 0,
                type: 'member-level',
                inputId: 'mem-001',
                result: {
                    memberId: 'mem-001',
                    currentLevel: 'VIP',
                    suggestedLevel: 'SVIP',
                    triggeredRules: ['cond-high-spend'],
                    confidence: 0.85
                }
            };
            strict_1.default.equal(item.index, 0);
            strict_1.default.equal(item.inputId, 'mem-001');
            strict_1.default.equal(item.type, 'member-level');
            strict_1.default.ok(item.result.confidence >= 0);
        });
        (0, node_test_1.default)('BatchEvaluateResponse includes summary stats', () => {
            const response = {
                total: 3,
                succeeded: 3,
                failed: 0,
                items: [],
                timestamp: new Date().toISOString()
            };
            strict_1.default.equal(response.total, 3);
            strict_1.default.equal(response.succeeded, 3);
            strict_1.default.equal(response.failed, 0);
            strict_1.default.ok(new Date(response.timestamp).getTime() > 0);
        });
        (0, node_test_1.default)('BatchEvaluateResponse handles partial failures', () => {
            const response = {
                total: 5,
                succeeded: 3,
                failed: 2,
                items: [],
                timestamp: new Date().toISOString()
            };
            strict_1.default.equal(response.succeeded + response.failed, response.total);
        });
    });
    // ── EngineStatus type contract ──────────────────────────────────
    (0, node_test_1.describe)('ai-rule-engine.entity: EngineStatus', () => {
        (0, node_test_1.default)('creates valid EngineStatus snapshot', () => {
            const status = {
                engineId: 'member-level-v1',
                engineName: 'Member Level Evaluator',
                conditionsCount: 3,
                actionsCount: 3,
                matchStrategy: 'ALL',
                status: domain_1.AiExecutionStatus.Succeeded,
                lastEvaluatedAt: '2026-06-14T08:00:00.000Z'
            };
            strict_1.default.equal(status.engineId, 'member-level-v1');
            strict_1.default.equal(status.conditionsCount, 3);
            strict_1.default.equal(status.actionsCount, 3);
            strict_1.default.equal(status.matchStrategy, 'ALL');
            strict_1.default.equal(status.status, domain_1.AiExecutionStatus.Succeeded);
        });
        (0, node_test_1.default)('EngineStatus lastEvaluatedAt is optional', () => {
            const status = {
                engineId: 'device-anomaly-v1',
                engineName: 'Device Anomaly Detector',
                conditionsCount: 5,
                actionsCount: 2,
                matchStrategy: 'ANY',
                status: domain_1.AiExecutionStatus.Pending
            };
            strict_1.default.equal(status.lastEvaluatedAt, undefined);
        });
    });
    (0, node_test_1.default)('anomalyType valid values', () => {
        const types = [
            'CPU_SPIKE', 'MEMORY_LEAK', 'DISK_FULL', 'NETWORK_LATENCY', 'HIGH_ERROR_RATE'
        ];
        for (const t of types) {
            const output = {
                deviceId: 'dev-type',
                isAnomaly: true,
                anomalyType: t,
                severity: 'MEDIUM',
                triggeredRules: ['cond-1'],
                recommendations: ['check']
            };
            strict_1.default.ok([
                'CPU_SPIKE', 'MEMORY_LEAK', 'DISK_FULL', 'NETWORK_LATENCY', 'HIGH_ERROR_RATE'
            ].includes(output.anomalyType));
        }
    });
});
// ──────────────────────────────────────────────────────────────────────────
// Phase-5 Wave-3 🐜7 补强：DiagnosisEntity / DiagnosisBatch 单元测试
// ──────────────────────────────────────────────────────────────────────────
(0, node_test_1.default)('entity: DiagnosisEntity shape validation with COMPLETED status', () => {
    const entity = {
        diagnosisId: 'diag-001',
        engineId: 'engine-fraud-v1',
        scenarioId: 'scenario-spike-tx',
        status: 'COMPLETED',
        matchedRuleIds: ['rule-spike-amount'],
        matchedConditionIds: ['cond-amount-gt-50k'],
        triggeredActionIds: ['action-flag-anomaly'],
        riskLevel: 'high',
        recommendation: '建议加强大额交易的人工审核',
        promptSummary: 'amount=60000, freq=12/min',
        evaluationDurationMs: 18,
        inputSnapshot: { amount: 60000, frequency: 12 },
        outputSnapshot: { matched: true, risk: 'high' },
        createdAt: '2026-06-23T10:00:00.000Z',
        completedAt: '2026-06-23T10:00:00.018Z',
        tenantId: 'tenant-demo',
        requestedBy: 'sec-admin-001'
    };
    strict_1.default.equal(entity.status, 'COMPLETED');
    strict_1.default.equal(entity.matchedRuleIds.length, 1);
    strict_1.default.equal(entity.riskLevel, 'high');
    strict_1.default.ok(entity.completedAt, 'expected completedAt to be set on COMPLETED status');
});
(0, node_test_1.default)('entity: DiagnosisEntity without completedAt is valid for PENDING status', () => {
    const entity = {
        diagnosisId: 'diag-002',
        engineId: 'engine-fraud-v1',
        scenarioId: 'scenario-pending',
        status: 'PENDING',
        matchedRuleIds: [],
        matchedConditionIds: [],
        triggeredActionIds: [],
        riskLevel: 'low',
        recommendation: '',
        promptSummary: '',
        evaluationDurationMs: 0,
        inputSnapshot: {},
        outputSnapshot: {},
        createdAt: '2026-06-23T10:01:00.000Z',
        tenantId: 'tenant-demo',
        requestedBy: 'system'
    };
    strict_1.default.equal(entity.status, 'PENDING');
    strict_1.default.equal(entity.completedAt, undefined);
    strict_1.default.equal(entity.matchedRuleIds.length, 0);
});
(0, node_test_1.default)('entity: DiagnosisBatch riskDistribution sums to totalDiagnoses', () => {
    const batch = {
        batchId: 'batch-001',
        engineId: 'engine-fraud-v2',
        totalDiagnoses: 10,
        matchedDiagnoses: 7,
        matchRate: 0.7,
        riskDistribution: { low: 3, medium: 4, high: 2, critical: 1 },
        avgEvaluationDurationMs: 22,
        diagnoses: [],
        createdAt: '2026-06-23T10:00:00.000Z',
        triggeredBy: 'sec-admin-001',
        tenantId: 'tenant-demo'
    };
    const sum = batch.riskDistribution.low + batch.riskDistribution.medium + batch.riskDistribution.high + batch.riskDistribution.critical;
    strict_1.default.equal(sum, batch.totalDiagnoses);
    strict_1.default.equal(batch.matchRate, 0.7);
});
(0, node_test_1.default)('entity: DiagnosisBatch with zero match preserves zero matchRate', () => {
    const batch = {
        batchId: 'batch-002',
        engineId: 'engine-fraud-v2',
        totalDiagnoses: 5,
        matchedDiagnoses: 0,
        matchRate: 0,
        riskDistribution: { low: 5, medium: 0, high: 0, critical: 0 },
        avgEvaluationDurationMs: 8,
        diagnoses: [],
        createdAt: '2026-06-23T10:05:00.000Z',
        triggeredBy: 'sec-admin-002',
        tenantId: 'tenant-demo'
    };
    strict_1.default.equal(batch.matchedDiagnoses, 0);
    strict_1.default.equal(batch.matchRate, 0);
});
//# sourceMappingURL=ai-rule-engine.entity.test.js.map