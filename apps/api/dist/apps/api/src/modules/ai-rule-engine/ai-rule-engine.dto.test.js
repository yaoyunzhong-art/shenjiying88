"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const ai_rule_engine_dto_1 = require("./ai-rule-engine.dto");
(0, node_test_1.describe)('AiRuleEngine DTOs', () => {
    (0, node_test_1.describe)('DeviceMetricsDto', () => {
        (0, node_test_1.it)('should validate valid device metrics', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_rule_engine_dto_1.DeviceMetricsDto, {
                cpuUsage: 75,
                memoryUsage: 60,
                diskUsage: 45,
                networkLatencyMs: 50,
                errorRate: 1.5,
                uptimeHours: 720
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.strictEqual(errors.length, 0);
        });
        (0, node_test_1.it)('should reject cpuUsage over 100', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_rule_engine_dto_1.DeviceMetricsDto, {
                cpuUsage: 150,
                memoryUsage: 60,
                diskUsage: 45,
                networkLatencyMs: 50,
                errorRate: 1.5,
                uptimeHours: 720
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.ok(errors.length > 0);
            node_assert_1.default.ok(errors.some(e => e.property === 'cpuUsage'));
        });
        (0, node_test_1.it)('should reject negative values', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_rule_engine_dto_1.DeviceMetricsDto, {
                cpuUsage: -5,
                memoryUsage: 60,
                diskUsage: 45,
                networkLatencyMs: 50,
                errorRate: 1.5,
                uptimeHours: 720
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.ok(errors.length > 0);
        });
        (0, node_test_1.it)('should accept boundary values (0 and 100)', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_rule_engine_dto_1.DeviceMetricsDto, {
                cpuUsage: 100,
                memoryUsage: 0,
                diskUsage: 100,
                networkLatencyMs: 0,
                errorRate: 0,
                uptimeHours: 0
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.strictEqual(errors.length, 0);
        });
    });
    (0, node_test_1.describe)('MemberLevelInputDto', () => {
        (0, node_test_1.it)('should validate valid member level input', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_rule_engine_dto_1.MemberLevelInputDto, {
                memberId: 'mem-001',
                totalPoints: 6000,
                totalSpend: 12000,
                visitCount: 25,
                tenantId: 'tenant-1'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.strictEqual(errors.length, 0);
        });
        (0, node_test_1.it)('should reject empty memberId', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_rule_engine_dto_1.MemberLevelInputDto, {
                memberId: '',
                totalPoints: 100,
                totalSpend: 500,
                visitCount: 5,
                tenantId: 'tenant-1'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.ok(errors.length > 0);
        });
        (0, node_test_1.it)('should reject negative totalPoints', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_rule_engine_dto_1.MemberLevelInputDto, {
                memberId: 'mem-001',
                totalPoints: -100,
                totalSpend: 500,
                visitCount: 5,
                tenantId: 'tenant-1'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.ok(errors.length > 0);
        });
        (0, node_test_1.it)('should accept zero values for new members', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_rule_engine_dto_1.MemberLevelInputDto, {
                memberId: 'new-member',
                totalPoints: 0,
                totalSpend: 0,
                visitCount: 0,
                tenantId: 'tenant-1'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.strictEqual(errors.length, 0);
        });
    });
    (0, node_test_1.describe)('DeviceAnomalyInputDto', () => {
        (0, node_test_1.it)('should validate valid device anomaly input', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_rule_engine_dto_1.DeviceAnomalyInputDto, {
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
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.strictEqual(errors.length, 0);
        });
        (0, node_test_1.it)('should reject missing deviceId', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_rule_engine_dto_1.DeviceAnomalyInputDto, {
                storeId: 'store-1',
                metrics: {
                    cpuUsage: 50,
                    memoryUsage: 50,
                    diskUsage: 50,
                    networkLatencyMs: 100,
                    errorRate: 1,
                    uptimeHours: 200
                },
                tenantId: 'tenant-1'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.ok(errors.some(e => e.property === 'deviceId'));
        });
        (0, node_test_1.it)('should reject invalid metrics nested object', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_rule_engine_dto_1.DeviceAnomalyInputDto, {
                deviceId: 'dev-001',
                storeId: 'store-1',
                metrics: {
                    cpuUsage: 250,
                    memoryUsage: 50,
                    diskUsage: 50,
                    networkLatencyMs: 100,
                    errorRate: 1,
                    uptimeHours: 200
                },
                tenantId: 'tenant-1'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            // The nested validation error may appear on metrics or its children
            node_assert_1.default.ok(errors.length > 0);
        });
    });
    (0, node_test_1.describe)('EvaluateRequestDto', () => {
        (0, node_test_1.it)('should validate member-level evaluate request', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_rule_engine_dto_1.EvaluateRequestDto, {
                type: 'member-level',
                data: {
                    memberId: 'mem-001',
                    totalPoints: 6000,
                    totalSpend: 12000,
                    visitCount: 25,
                    tenantId: 'tenant-1'
                }
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.strictEqual(errors.length, 0);
        });
        (0, node_test_1.it)('should validate device-anomaly evaluate request', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_rule_engine_dto_1.EvaluateRequestDto, {
                type: 'device-anomaly',
                data: {
                    deviceId: 'dev-001',
                    storeId: 'store-1',
                    metrics: { cpuUsage: 95 }
                }
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.strictEqual(errors.length, 0);
        });
        (0, node_test_1.it)('should reject invalid type', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_rule_engine_dto_1.EvaluateRequestDto, {
                type: 'invalid-type',
                data: {}
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.ok(errors.some(e => e.property === 'type'));
        });
        (0, node_test_1.it)('should reject missing type', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_rule_engine_dto_1.EvaluateRequestDto, {
                data: { memberId: 'mem-001' }
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.ok(errors.length > 0);
        });
    });
    (0, node_test_1.describe)('RiskMetricsDto', () => {
        (0, node_test_1.it)('should validate valid risk metrics (all fields present)', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_rule_engine_dto_1.RiskMetricsDto, {
                refundCount: 2,
                abnormalPaymentCount: 1,
                deviceAnomalyCount: 3,
                complaintCount: 0,
                voidRefundAmount: 200,
                activeDays: 30,
                recentTransactionAmount: 5000
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.strictEqual(errors.length, 0);
        });
        (0, node_test_1.it)('should validate risk metrics with optional fields omitted', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_rule_engine_dto_1.RiskMetricsDto, {
                refundCount: 1,
                complaintCount: 0
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.strictEqual(errors.length, 0);
        });
        (0, node_test_1.it)('should validate empty risk metrics (all optional)', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_rule_engine_dto_1.RiskMetricsDto, {});
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.strictEqual(errors.length, 0);
        });
        (0, node_test_1.it)('should reject negative refundCount', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_rule_engine_dto_1.RiskMetricsDto, {
                refundCount: -1
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.ok(errors.some(e => e.property === 'refundCount'));
        });
        (0, node_test_1.it)('should reject negative voidRefundAmount', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_rule_engine_dto_1.RiskMetricsDto, {
                voidRefundAmount: -500
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.ok(errors.some(e => e.property === 'voidRefundAmount'));
        });
    });
    (0, node_test_1.describe)('RiskScoreInputDto', () => {
        (0, node_test_1.it)('should validate valid risk score input (member)', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_rule_engine_dto_1.RiskScoreInputDto, {
                subjectId: 'mem-001',
                subjectType: 'member',
                metrics: {
                    refundCount: 5,
                    abnormalPaymentCount: 3,
                    complaintCount: 2,
                    voidRefundAmount: 800
                },
                tenantId: 'tenant-1'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.strictEqual(errors.length, 0);
        });
        (0, node_test_1.it)('should validate valid risk score input (device)', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_rule_engine_dto_1.RiskScoreInputDto, {
                subjectId: 'dev-001',
                subjectType: 'device',
                metrics: {
                    deviceAnomalyCount: 3
                },
                tenantId: 'tenant-1'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.strictEqual(errors.length, 0);
        });
        (0, node_test_1.it)('should validate valid risk score input (store)', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_rule_engine_dto_1.RiskScoreInputDto, {
                subjectId: 'store-1',
                subjectType: 'store',
                metrics: {
                    refundCount: 2,
                    complaintCount: 1
                },
                tenantId: 'tenant-1'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.strictEqual(errors.length, 0);
        });
        (0, node_test_1.it)('should reject empty subjectId', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_rule_engine_dto_1.RiskScoreInputDto, {
                subjectId: '',
                subjectType: 'member',
                metrics: {},
                tenantId: 'tenant-1'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.ok(errors.some(e => e.property === 'subjectId'));
        });
        (0, node_test_1.it)('should reject invalid subjectType', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_rule_engine_dto_1.RiskScoreInputDto, {
                subjectId: 'mem-001',
                subjectType: 'invalid-type',
                metrics: {},
                tenantId: 'tenant-1'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.ok(errors.some(e => e.property === 'subjectType'));
        });
        (0, node_test_1.it)('should reject missing tenantId', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_rule_engine_dto_1.RiskScoreInputDto, {
                subjectId: 'mem-001',
                subjectType: 'member',
                metrics: {}
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.ok(errors.some(e => e.property === 'tenantId'));
        });
        (0, node_test_1.it)('should reject negative metric in nested RiskMetricsDto', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_rule_engine_dto_1.RiskScoreInputDto, {
                subjectId: 'mem-001',
                subjectType: 'member',
                metrics: {
                    refundCount: -3
                },
                tenantId: 'tenant-1'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.ok(errors.length > 0);
        });
    });
});
//# sourceMappingURL=ai-rule-engine.dto.test.js.map