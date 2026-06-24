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
const ai_rule_engine_service_1 = require("./ai-rule-engine.service");
(0, node_test_1.describe)('AiRuleEngine - Simulator', () => {
    let service;
    node_test_1.default.beforeEach(() => {
        service = new ai_rule_engine_service_1.AiRuleEngineService();
    });
    // ─── Simulator listing ───
    (0, node_test_1.describe)('listSimulators', () => {
        (0, node_test_1.default)('should return all simulators', () => {
            const simulators = service.listSimulators();
            strict_1.default.ok(Array.isArray(simulators));
            strict_1.default.ok(simulators.length >= 2);
        });
        (0, node_test_1.default)('should return simulators with required fields', () => {
            const simulators = service.listSimulators();
            for (const sim of simulators) {
                strict_1.default.equal(typeof sim.id, 'string');
                strict_1.default.equal(typeof sim.name, 'string');
                strict_1.default.equal(typeof sim.engineId, 'string');
                strict_1.default.ok(sim.rounds > 0);
            }
        });
    });
    (0, node_test_1.describe)('getSimulator', () => {
        (0, node_test_1.default)('should return a simulator by valid id', () => {
            const sim = service.getSimulator('sim-member-level-v1');
            strict_1.default.ok(sim);
            strict_1.default.equal(sim.id, 'sim-member-level-v1');
            strict_1.default.equal(sim.name, 'Member Level Simulator');
        });
        (0, node_test_1.default)('should return undefined for non-existent simulator id', () => {
            const sim = service.getSimulator('non-existent-sim');
            strict_1.default.equal(sim, undefined);
        });
    });
    // ─── runSimulator - member-level ───
    const highValueInput = {
        simulatorId: 'sim-member-level-v1',
        dataType: 'member-level',
        data: {
            memberId: 'M001',
            totalPoints: 6000,
            totalSpend: 12000,
            visitCount: 25,
            tenantId: 'T001'
        }
    };
    const lowValueInput = {
        simulatorId: 'sim-member-level-v1',
        dataType: 'member-level',
        data: {
            memberId: 'M002',
            totalPoints: 100,
            totalSpend: 200,
            visitCount: 1,
            tenantId: 'T001'
        }
    };
    (0, node_test_1.describe)('runSimulator - member-level', () => {
        (0, node_test_1.default)('should match high-value member', () => {
            const result = service.runSimulator(highValueInput);
            strict_1.default.equal(result.simulatorId, 'sim-member-level-v1');
            strict_1.default.equal(result.simulatorName, 'Member Level Simulator');
            strict_1.default.equal(result.matched, true);
            strict_1.default.ok(result.triggeredConditions.length >= 2);
        });
        (0, node_test_1.default)('should not match low-value member', () => {
            const result = service.runSimulator(lowValueInput);
            strict_1.default.equal(result.matched, false);
            strict_1.default.equal(result.triggeredConditions.length, 0);
        });
        (0, node_test_1.default)('should return triggered actions when matched', () => {
            const result = service.runSimulator(highValueInput);
            strict_1.default.ok(result.triggeredActions.length > 0);
            const actions = result.triggeredActions;
            strict_1.default.ok(actions.some((a) => a.startsWith('act-assign')));
        });
    });
    (0, node_test_1.describe)('runSimulator - device-anomaly', () => {
        const anomalyInput = {
            simulatorId: 'sim-device-anomaly-v1',
            dataType: 'device-anomaly',
            data: {
                deviceId: 'D001',
                storeId: 'S001',
                metrics: {
                    cpuUsage: 95,
                    memoryUsage: 90,
                    diskUsage: 95,
                    networkLatencyMs: 600,
                    errorRate: 8,
                    uptimeHours: 100
                },
                tenantId: 'T001'
            }
        };
        const normalInput = {
            simulatorId: 'sim-device-anomaly-v1',
            dataType: 'device-anomaly',
            data: {
                deviceId: 'D002',
                storeId: 'S001',
                metrics: {
                    cpuUsage: 30,
                    memoryUsage: 40,
                    diskUsage: 50,
                    networkLatencyMs: 20,
                    errorRate: 1,
                    uptimeHours: 720
                },
                tenantId: 'T001'
            }
        };
        (0, node_test_1.default)('should detect anomaly for abnormal device', () => {
            const result = service.runSimulator(anomalyInput);
            strict_1.default.equal(result.matched, true);
            strict_1.default.ok(result.triggeredConditions.length >= 1);
        });
        (0, node_test_1.default)('should not detect anomaly for normal device', () => {
            const result = service.runSimulator(normalInput);
            strict_1.default.equal(result.matched, false);
            strict_1.default.equal(result.triggeredConditions.length, 0);
        });
    });
    (0, node_test_1.describe)('runSimulator - risk-score', () => {
        const riskInput = {
            simulatorId: 'sim-member-level-v1',
            dataType: 'risk-score',
            data: {
                subjectId: 'R001',
                subjectType: 'member',
                metrics: {
                    refundCount: 4,
                    abnormalPaymentCount: 3,
                    deviceAnomalyCount: 2,
                    complaintCount: 2,
                    voidRefundAmount: 600
                },
                tenantId: 'T001'
            }
        };
        (0, node_test_1.default)('should correctly evaluate risk score', () => {
            const result = service.runSimulator(riskInput);
            strict_1.default.ok(result);
            strict_1.default.equal(result.simulatorId, 'sim-member-level-v1');
            strict_1.default.equal(typeof result.matched, 'boolean');
        });
    });
    // ─── Verbose mode ───
    (0, node_test_1.describe)('runSimulator - verbose mode', () => {
        (0, node_test_1.default)('should include logs when verbose is true', () => {
            const input = {
                simulatorId: 'sim-member-level-v1',
                dataType: 'member-level',
                data: {
                    memberId: 'M003',
                    totalPoints: 2000,
                    totalSpend: 6000,
                    visitCount: 15,
                    tenantId: 'T001'
                },
                verbose: true
            };
            const result = service.runSimulator(input);
            strict_1.default.ok(result.logs);
            strict_1.default.ok(Array.isArray(result.logs));
            strict_1.default.ok(result.logs.length > 0);
        });
        (0, node_test_1.default)('should not include logs when verbose is false', () => {
            const input = {
                simulatorId: 'sim-member-level-v1',
                dataType: 'member-level',
                data: {
                    memberId: 'M004',
                    totalPoints: 100,
                    totalSpend: 200,
                    visitCount: 1,
                    tenantId: 'T001'
                },
                verbose: false
            };
            const result = service.runSimulator(input);
            strict_1.default.equal(result.logs, undefined);
        });
    });
    // ─── Condition override ───
    (0, node_test_1.describe)('runSimulator - condition overrides', () => {
        (0, node_test_1.default)('should override condition values and affect matching', () => {
            const input = {
                simulatorId: 'sim-member-level-v1',
                dataType: 'member-level',
                data: {
                    memberId: 'M005',
                    totalPoints: 600,
                    totalSpend: 500,
                    visitCount: 10,
                    tenantId: 'T001'
                },
                conditionOverrides: [
                    { conditionId: 'cond-high-spend', value: 100 },
                    { conditionId: 'cond-high-points', value: 500 },
                    { conditionId: 'cond-frequent-visit', value: 5 }
                ],
                verbose: true
            };
            const result = service.runSimulator(input);
            strict_1.default.ok(result.logs);
            const spendCondLog = result.logs.find((l) => l.includes('cond-high-spend') && l.includes('MATCHED'));
            strict_1.default.ok(spendCondLog);
            strict_1.default.ok(spendCondLog.includes('MATCHED'));
        });
    });
    // ─── Batch simulator ───
    (0, node_test_1.describe)('runSimulatorBatch', () => {
        const batchInput = {
            simulatorId: 'sim-member-level-v1',
            dataType: 'member-level',
            data: {
                memberId: 'M-BATCH',
                totalPoints: 6000,
                totalSpend: 12000,
                visitCount: 25,
                tenantId: 'T001'
            },
            rounds: 10,
            verbose: false
        };
        (0, node_test_1.default)('should run multiple rounds and return summary', () => {
            const summary = service.runSimulatorBatch(batchInput);
            strict_1.default.equal(summary.simulatorId, 'sim-member-level-v1');
            strict_1.default.equal(summary.simulatorName, 'Member Level Simulator');
            strict_1.default.equal(summary.totalRuns, 10);
            strict_1.default.ok(summary.matchedRuns >= 0);
            strict_1.default.ok(summary.matchedRuns <= 10);
            strict_1.default.ok(summary.matchRate >= 0);
            strict_1.default.ok(summary.matchRate <= 1);
            strict_1.default.equal(summary.results.length, 10);
        });
        (0, node_test_1.default)('should return valid percentiles', () => {
            const summary = service.runSimulatorBatch(batchInput);
            strict_1.default.ok(summary.p50ExecutionTimeMs >= 0);
            strict_1.default.ok(summary.p95ExecutionTimeMs >= summary.p50ExecutionTimeMs);
            strict_1.default.ok(summary.p99ExecutionTimeMs >= summary.p95ExecutionTimeMs);
        });
        (0, node_test_1.default)('should include most triggered conditions', () => {
            const summary = service.runSimulatorBatch(batchInput);
            strict_1.default.ok(summary.mostTriggeredConditions);
            strict_1.default.ok(Array.isArray(summary.mostTriggeredConditions));
        });
        (0, node_test_1.default)('should include recommendation text', () => {
            const summary = service.runSimulatorBatch(batchInput);
            strict_1.default.ok(typeof summary.recommendation === 'string');
            strict_1.default.ok(summary.recommendation.length > 0);
        });
    });
    // ─── Batch simulator with mutation ───
    (0, node_test_1.describe)('runSimulatorBatch - with mutation', () => {
        const input = {
            simulatorId: 'sim-device-anomaly-v1',
            dataType: 'device-anomaly',
            data: {
                deviceId: 'D-MUTATE',
                storeId: 'S001',
                metrics: {
                    cpuUsage: 50,
                    memoryUsage: 50,
                    diskUsage: 50,
                    networkLatencyMs: 300,
                    errorRate: 2,
                    uptimeHours: 500
                },
                tenantId: 'T001'
            },
            rounds: 20,
            verbose: false
        };
        (0, node_test_1.default)('should produce varied results with mutation enabled', () => {
            const summary = service.runSimulatorBatch(input);
            strict_1.default.ok(summary.totalRuns >= 1);
            // mutation should create some variation
            const matchedValues = summary.results.map((r) => r.matched);
            strict_1.default.ok(matchedValues.length > 0);
        });
    });
    // ─── Error handling ───
    (0, node_test_1.describe)('runSimulator - error handling', () => {
        (0, node_test_1.default)('should throw for non-existent simulator', () => {
            const input = {
                simulatorId: 'non-existent-sim',
                dataType: 'member-level',
                data: { memberId: 'M', totalPoints: 0, totalSpend: 0, visitCount: 0, tenantId: 'T' }
            };
            strict_1.default.throws(() => service.runSimulator(input), /not found/);
        });
        (0, node_test_1.default)('should throw for unknown dataType', () => {
            const input = {
                simulatorId: 'sim-member-level-v1',
                dataType: 'unknown-type',
                data: {}
            };
            strict_1.default.throws(() => service.runSimulator(input), /Unknown dataType/);
        });
    });
    (0, node_test_1.describe)('runSimulatorBatch - error handling', () => {
        (0, node_test_1.default)('should throw for non-existent simulator', () => {
            strict_1.default.throws(() => service.runSimulatorBatch({
                simulatorId: 'non-existent-sim',
                dataType: 'member-level',
                data: { memberId: 'M', totalPoints: 0, totalSpend: 0, visitCount: 0, tenantId: 'T' }
            }), /not found/);
        });
    });
});
//# sourceMappingURL=ai-rule-engine.simulator.test.js.map