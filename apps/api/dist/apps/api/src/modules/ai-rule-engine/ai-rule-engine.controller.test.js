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
(0, node_test_1.describe)('AiRuleEngineController', () => {
    const { AiRuleEngineController } = require('./ai-rule-engine.controller');
    const { AiRuleEngineService } = require('./ai-rule-engine.service');
    let controller;
    let service;
    node_test_1.default.beforeEach(() => {
        service = new AiRuleEngineService();
        controller = new AiRuleEngineController(service);
    });
    (0, node_test_1.describe)('route metadata', () => {
        (0, node_test_1.default)('controller path metadata should be ai-rule-engine', () => {
            const path = Reflect.getMetadata('path', AiRuleEngineController);
            strict_1.default.equal(path, 'ai-rule-engine');
        });
        (0, node_test_1.default)('evaluate route should have POST method and evaluate path', () => {
            const method = Reflect.getMetadata('method', AiRuleEngineController.prototype.evaluate);
            const path = Reflect.getMetadata('path', AiRuleEngineController.prototype.evaluate);
            strict_1.default.equal(method, 1); // POST
            strict_1.default.equal(path, 'evaluate');
        });
        (0, node_test_1.default)('evaluateMemberLevel route should have POST method', () => {
            const method = Reflect.getMetadata('method', AiRuleEngineController.prototype.evaluateMemberLevel);
            const path = Reflect.getMetadata('path', AiRuleEngineController.prototype.evaluateMemberLevel);
            strict_1.default.equal(method, 1); // POST
            strict_1.default.equal(path, 'evaluate/member-level');
        });
        (0, node_test_1.default)('detectDeviceAnomaly route should have POST method', () => {
            const method = Reflect.getMetadata('method', AiRuleEngineController.prototype.detectDeviceAnomaly);
            const path = Reflect.getMetadata('path', AiRuleEngineController.prototype.detectDeviceAnomaly);
            strict_1.default.equal(method, 1); // POST
            strict_1.default.equal(path, 'evaluate/device-anomaly');
        });
        (0, node_test_1.default)('evaluateBatch route should have POST method', () => {
            const method = Reflect.getMetadata('method', AiRuleEngineController.prototype.evaluateBatch);
            const path = Reflect.getMetadata('path', AiRuleEngineController.prototype.evaluateBatch);
            strict_1.default.equal(method, 1); // POST
            strict_1.default.equal(path, 'evaluate/batch');
        });
        (0, node_test_1.default)('getEngines route should have GET method', () => {
            const method = Reflect.getMetadata('method', AiRuleEngineController.prototype.getEngines);
            const path = Reflect.getMetadata('path', AiRuleEngineController.prototype.getEngines);
            strict_1.default.equal(method, 0); // GET
            strict_1.default.equal(path, 'engines');
        });
        (0, node_test_1.default)('evaluateRiskScore route should have POST method', () => {
            const method = Reflect.getMetadata('method', AiRuleEngineController.prototype.evaluateRiskScore);
            const path = Reflect.getMetadata('path', AiRuleEngineController.prototype.evaluateRiskScore);
            strict_1.default.equal(method, 1); // POST
            strict_1.default.equal(path, 'evaluate/risk-score');
        });
    });
    (0, node_test_1.describe)('POST /ai-rule-engine/evaluate (member-level)', () => {
        (0, node_test_1.default)('should evaluate member level for SVIP candidate', () => {
            const response = controller.evaluate({
                type: 'member-level',
                data: {
                    memberId: 'mem-001',
                    totalPoints: 6000,
                    totalSpend: 15000,
                    visitCount: 25,
                    tenantId: 't-001'
                }
            });
            strict_1.default.equal(response.type, 'member-level');
            strict_1.default.ok(typeof response.timestamp === 'string');
            strict_1.default.ok(Date.parse(response.timestamp) > 0);
            const result = response.result;
            strict_1.default.equal(result.suggestedLevel, 'SVIP');
            strict_1.default.equal(result.memberId, 'mem-001');
            strict_1.default.ok(result.confidence > 0.7);
        });
        (0, node_test_1.default)('should evaluate member level for REGULAR member', () => {
            const response = controller.evaluate({
                type: 'member-level',
                data: {
                    memberId: 'mem-002',
                    totalPoints: 100,
                    totalSpend: 200,
                    visitCount: 5,
                    tenantId: 't-001'
                }
            });
            strict_1.default.equal(response.type, 'member-level');
            const result = response.result;
            strict_1.default.equal(result.suggestedLevel, 'REGULAR');
        });
    });
    (0, node_test_1.describe)('POST /ai-rule-engine/evaluate (device-anomaly)', () => {
        (0, node_test_1.default)('should detect CPU anomaly via evaluate endpoint', () => {
            const response = controller.evaluate({
                type: 'device-anomaly',
                data: {
                    deviceId: 'dev-001',
                    storeId: 'store-001',
                    metrics: {
                        cpuUsage: 95,
                        memoryUsage: 50,
                        diskUsage: 30,
                        networkLatencyMs: 100,
                        errorRate: 2,
                        uptimeHours: 720
                    },
                    tenantId: 't-001'
                }
            });
            strict_1.default.equal(response.type, 'device-anomaly');
            const result = response.result;
            strict_1.default.equal(result.isAnomaly, true);
            strict_1.default.equal(result.anomalyType, 'CPU_SPIKE');
        });
        (0, node_test_1.default)('should return no anomaly for healthy device', () => {
            const response = controller.evaluate({
                type: 'device-anomaly',
                data: {
                    deviceId: 'dev-002',
                    storeId: 'store-001',
                    metrics: {
                        cpuUsage: 30,
                        memoryUsage: 40,
                        diskUsage: 50,
                        networkLatencyMs: 80,
                        errorRate: 1,
                        uptimeHours: 168
                    },
                    tenantId: 't-001'
                }
            });
            const result = response.result;
            strict_1.default.equal(result.isAnomaly, false);
            strict_1.default.equal(result.severity, 'LOW');
        });
    });
    (0, node_test_1.describe)('POST /ai-rule-engine/evaluate/member-level', () => {
        (0, node_test_1.default)('should evaluate member level directly', () => {
            const response = controller.evaluateMemberLevel({
                memberId: 'direct-001',
                totalPoints: 6000,
                totalSpend: 12000,
                visitCount: 30,
                tenantId: 't-001'
            });
            strict_1.default.equal(response.type, 'member-level');
            const result = response.result;
            strict_1.default.equal(result.suggestedLevel, 'SVIP');
            strict_1.default.equal(result.triggeredRules.length, 3);
        });
        (0, node_test_1.default)('should handle minimal input', () => {
            const response = controller.evaluateMemberLevel({
                memberId: 'direct-002',
                totalPoints: 0,
                totalSpend: 0,
                visitCount: 0,
                tenantId: 't-001'
            });
            const result = response.result;
            strict_1.default.equal(result.suggestedLevel, 'REGULAR');
            strict_1.default.equal(result.triggeredRules.length, 0);
        });
    });
    (0, node_test_1.describe)('POST /ai-rule-engine/evaluate/device-anomaly', () => {
        (0, node_test_1.default)('should detect device anomaly directly', () => {
            const response = controller.detectDeviceAnomaly({
                deviceId: 'direct-dev-001',
                storeId: 'store-001',
                metrics: {
                    cpuUsage: 92,
                    memoryUsage: 88,
                    diskUsage: 50,
                    networkLatencyMs: 200,
                    errorRate: 2,
                    uptimeHours: 1000
                },
                tenantId: 't-001'
            });
            const result = response.result;
            strict_1.default.equal(result.isAnomaly, true);
            strict_1.default.equal(result.severity, 'HIGH');
        });
        (0, node_test_1.default)('should return no anomaly for normal metrics', () => {
            const response = controller.detectDeviceAnomaly({
                deviceId: 'direct-dev-002',
                storeId: 'store-001',
                metrics: {
                    cpuUsage: 20,
                    memoryUsage: 30,
                    diskUsage: 40,
                    networkLatencyMs: 50,
                    errorRate: 0.5,
                    uptimeHours: 100
                },
                tenantId: 't-001'
            });
            const result = response.result;
            strict_1.default.equal(result.isAnomaly, false);
        });
    });
    (0, node_test_1.describe)('POST /ai-rule-engine/evaluate/batch', () => {
        (0, node_test_1.default)('should batch evaluate multiple member levels', () => {
            const response = controller.evaluateBatch({
                items: [
                    {
                        type: 'member-level',
                        data: { memberId: 'batch-mem-001', totalPoints: 8000, totalSpend: 20000, visitCount: 50, tenantId: 't-001' }
                    },
                    {
                        type: 'member-level',
                        data: { memberId: 'batch-mem-002', totalPoints: 100, totalSpend: 200, visitCount: 3, tenantId: 't-001' }
                    }
                ]
            });
            strict_1.default.equal(response.total, 2);
            strict_1.default.equal(response.succeeded, 2);
            strict_1.default.equal(response.failed, 0);
            strict_1.default.equal(response.items.length, 2);
            strict_1.default.equal(response.items[0].type, 'member-level');
            strict_1.default.equal(response.items[0].inputId, 'batch-mem-001');
            strict_1.default.ok(Date.parse(response.timestamp) > 0);
        });
        (0, node_test_1.default)('should batch evaluate mixed types (member + device)', () => {
            const response = controller.evaluateBatch({
                items: [
                    {
                        type: 'member-level',
                        data: { memberId: 'mixed-mem', totalPoints: 6000, totalSpend: 12000, visitCount: 25, tenantId: 't-001' }
                    },
                    {
                        type: 'device-anomaly',
                        data: {
                            deviceId: 'mixed-dev', storeId: 'store-1',
                            metrics: { cpuUsage: 95, memoryUsage: 88, diskUsage: 92, networkLatencyMs: 600, errorRate: 7, uptimeHours: 100 },
                            tenantId: 't-001'
                        }
                    },
                    {
                        type: 'device-anomaly',
                        data: {
                            deviceId: 'mixed-dev-healthy', storeId: 'store-1',
                            metrics: { cpuUsage: 20, memoryUsage: 30, diskUsage: 40, networkLatencyMs: 50, errorRate: 0.5, uptimeHours: 200 },
                            tenantId: 't-001'
                        }
                    }
                ]
            });
            strict_1.default.equal(response.total, 3);
            strict_1.default.equal(response.succeeded, 3);
            strict_1.default.equal(response.failed, 0);
            strict_1.default.equal(response.items[0].type, 'member-level');
            strict_1.default.equal(response.items[1].type, 'device-anomaly');
            strict_1.default.equal(response.items[2].type, 'device-anomaly');
        });
        (0, node_test_1.default)('should handle empty batch request', () => {
            const response = controller.evaluateBatch({ items: [] });
            strict_1.default.equal(response.total, 0);
            strict_1.default.equal(response.succeeded, 0);
            strict_1.default.equal(response.failed, 0);
            strict_1.default.equal(response.items.length, 0);
        });
    });
    (0, node_test_1.describe)('GET /ai-rule-engine/engines', () => {
        (0, node_test_1.default)('should return all engine statuses', () => {
            const engines = controller.getEngines();
            strict_1.default.ok(Array.isArray(engines));
            strict_1.default.ok(engines.length >= 3);
            const memberEngine = engines.find((e) => e.engineId === 'member-level-v1');
            strict_1.default.ok(memberEngine);
            strict_1.default.equal(memberEngine.engineName, 'Member Level Evaluator');
            strict_1.default.equal(memberEngine.conditionsCount, 3);
            strict_1.default.equal(memberEngine.actionsCount, 3);
            strict_1.default.equal(memberEngine.matchStrategy, 'ALL');
            const deviceEngine = engines.find((e) => e.engineId === 'device-anomaly-v1');
            strict_1.default.ok(deviceEngine);
            strict_1.default.equal(deviceEngine.engineName, 'Device Anomaly Detector');
            strict_1.default.equal(deviceEngine.matchStrategy, 'ANY');
            strict_1.default.equal(deviceEngine.conditionsCount, 5);
            const riskEngine = engines.find((e) => e.engineId === 'risk-score-v1');
            strict_1.default.ok(riskEngine);
            strict_1.default.equal(riskEngine.engineName, 'Risk Score Evaluator');
            strict_1.default.equal(riskEngine.conditionsCount, 5);
            strict_1.default.equal(riskEngine.actionsCount, 3);
        });
        (0, node_test_1.default)('engine status should include valid status values', () => {
            const engines = controller.getEngines();
            for (const engine of engines) {
                strict_1.default.ok(typeof engine.engineId === 'string');
                strict_1.default.ok(typeof engine.engineName === 'string');
                strict_1.default.ok(typeof engine.conditionsCount === 'number');
                strict_1.default.ok(typeof engine.actionsCount === 'number');
                strict_1.default.ok(['ALL', 'ANY'].includes(engine.matchStrategy));
                strict_1.default.ok(typeof engine.status === 'string');
            }
        });
    });
    (0, node_test_1.describe)('POST /ai-rule-engine/evaluate/risk-score', () => {
        (0, node_test_1.default)('should evaluate CRITICAL risk for flagged subject', () => {
            const response = controller.evaluateRiskScore({
                subjectId: 'risk-sub-001',
                subjectType: 'member',
                metrics: {
                    refundCount: 5,
                    abnormalPaymentCount: 4,
                    deviceAnomalyCount: 2,
                    complaintCount: 2,
                    voidRefundAmount: 1000
                },
                tenantId: 't-001'
            });
            strict_1.default.equal(response.type, 'risk-score');
            strict_1.default.ok(typeof response.timestamp === 'string');
            strict_1.default.ok(Date.parse(response.timestamp) > 0);
            const result = response.result;
            strict_1.default.equal(result.subjectId, 'risk-sub-001');
            strict_1.default.equal(result.riskLevel, 'CRITICAL');
            strict_1.default.ok(result.riskScore >= 70);
            strict_1.default.ok(result.triggeredRules.length >= 3);
            strict_1.default.ok(result.reasons.length >= 3);
            strict_1.default.ok(result.recommendations.length >= 3);
        });
        (0, node_test_1.default)('should report LOW risk for clean subject', () => {
            const response = controller.evaluateRiskScore({
                subjectId: 'risk-sub-002',
                subjectType: 'store',
                metrics: {
                    refundCount: 0,
                    abnormalPaymentCount: 0,
                    complaintCount: 0
                },
                tenantId: 't-001'
            });
            strict_1.default.equal(response.type, 'risk-score');
            const result = response.result;
            strict_1.default.equal(result.subjectId, 'risk-sub-002');
            strict_1.default.equal(result.riskLevel, 'LOW');
            strict_1.default.equal(result.riskScore, 0);
            strict_1.default.equal(result.triggeredRules.length, 0);
        });
        (0, node_test_1.default)('should report MEDIUM risk for single flag', () => {
            const response = controller.evaluateRiskScore({
                subjectId: 'risk-sub-003',
                subjectType: 'device',
                metrics: {
                    refundCount: 3
                },
                tenantId: 't-001'
            });
            const result = response.result;
            strict_1.default.equal(result.riskLevel, 'MEDIUM');
            strict_1.default.equal(result.riskScore, 25);
        });
        (0, node_test_1.default)('should cap risk score at 100', () => {
            const response = controller.evaluateRiskScore({
                subjectId: 'risk-sub-004',
                subjectType: 'member',
                metrics: {
                    refundCount: 10,
                    abnormalPaymentCount: 10,
                    deviceAnomalyCount: 10,
                    complaintCount: 10,
                    voidRefundAmount: 10000
                },
                tenantId: 't-001'
            });
            const result = response.result;
            strict_1.default.equal(result.riskScore, 100);
            strict_1.default.equal(result.riskLevel, 'CRITICAL');
        });
    });
    (0, node_test_1.describe)('error handling', () => {
        (0, node_test_1.default)('should throw for unsupported evaluation type', () => {
            strict_1.default.throws(() => controller.evaluate({
                type: 'unsupported-type',
                data: {}
            }), /Unsupported evaluation type/);
        });
    });
});
//# sourceMappingURL=ai-rule-engine.controller.test.js.map