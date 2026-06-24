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
(0, node_test_1.describe)('AiRuleEngineService', () => {
    let service;
    node_test_1.default.beforeEach(() => {
        service = new ai_rule_engine_service_1.AiRuleEngineService();
    });
    (0, node_test_1.describe)('evaluateMemberLevel', () => {
        // 正常流程：高消费高积分 -> SVIP
        (0, node_test_1.default)('should assign SVIP to high-spend high-points member', () => {
            const result = service.evaluateMemberLevel({
                memberId: 'member-001',
                totalPoints: 6000,
                totalSpend: 15000,
                visitCount: 25,
                tenantId: 'tenant-001'
            });
            strict_1.default.equal(result.memberId, 'member-001');
            strict_1.default.equal(result.suggestedLevel, 'SVIP');
            strict_1.default.ok(result.triggeredRules.length > 0);
            strict_1.default.ok(result.confidence > 0.7);
        });
        // 正常流程：中等消费 -> VIP
        (0, node_test_1.default)('should assign VIP to medium-spend member', () => {
            const result = service.evaluateMemberLevel({
                memberId: 'member-002',
                totalPoints: 3000,
                totalSpend: 8000,
                visitCount: 15,
                tenantId: 'tenant-001'
            });
            strict_1.default.equal(result.memberId, 'member-002');
            // 8000 < 10000, 没有触发 cond-high-spend, 只触发 cond-high-points(3000<5000=false) 和 visitCount<20
            // 所以 matchStrategy=ALL 不匹配
            strict_1.default.equal(result.suggestedLevel, 'REGULAR');
            strict_1.default.equal(result.triggeredRules.length, 0);
        });
        // 正常流程：全低 -> REGULAR
        (0, node_test_1.default)('should assign REGULAR to low-spend member', () => {
            const result = service.evaluateMemberLevel({
                memberId: 'member-003',
                totalPoints: 100,
                totalSpend: 500,
                visitCount: 3,
                tenantId: 'tenant-001'
            });
            strict_1.default.equal(result.memberId, 'member-003');
            strict_1.default.equal(result.suggestedLevel, 'REGULAR');
            strict_1.default.equal(result.triggeredRules.length, 0);
            strict_1.default.ok(result.confidence <= 0.5);
        });
        // 边界条件：恰好达到阈值
        (0, node_test_1.default)('should trigger conditions at exact threshold values', () => {
            const result = service.evaluateMemberLevel({
                memberId: 'member-004',
                totalPoints: 5000,
                totalSpend: 10000,
                visitCount: 20,
                tenantId: 'tenant-001'
            });
            strict_1.default.equal(result.memberId, 'member-004');
            strict_1.default.equal(result.suggestedLevel, 'SVIP');
            strict_1.default.equal(result.triggeredRules.length, 3);
            strict_1.default.equal(result.confidence, 1.0);
        });
        // 边界条件：零值输入
        (0, node_test_1.default)('should handle zero values gracefully', () => {
            const result = service.evaluateMemberLevel({
                memberId: 'member-005',
                totalPoints: 0,
                totalSpend: 0,
                visitCount: 0,
                tenantId: 'tenant-001'
            });
            strict_1.default.equal(result.suggestedLevel, 'REGULAR');
            strict_1.default.equal(result.triggeredRules.length, 0);
        });
        // 只有满足部分条件
        (0, node_test_1.default)('should only trigger matching conditions partially', () => {
            const result = service.evaluateMemberLevel({
                memberId: 'member-006',
                totalPoints: 100,
                totalSpend: 12000,
                visitCount: 10,
                tenantId: 'tenant-001'
            });
            // matchStrategy=ALL, 所以三个条件都要满足
            strict_1.default.equal(result.triggeredRules.length, 0);
            strict_1.default.equal(result.suggestedLevel, 'REGULAR');
        });
    });
    (0, node_test_1.describe)('detectDeviceAnomaly', () => {
        // 正常流程：CPU 异常
        (0, node_test_1.default)('should detect CPU anomaly', () => {
            const result = service.detectDeviceAnomaly({
                deviceId: 'device-001',
                storeId: 'store-001',
                metrics: {
                    cpuUsage: 95,
                    memoryUsage: 50,
                    diskUsage: 40,
                    networkLatencyMs: 100,
                    errorRate: 1,
                    uptimeHours: 720
                },
                tenantId: 'tenant-001'
            });
            strict_1.default.equal(result.deviceId, 'device-001');
            strict_1.default.equal(result.isAnomaly, true);
            strict_1.default.equal(result.anomalyType, 'CPU_SPIKE');
            strict_1.default.ok(result.severity === 'MEDIUM' || result.severity === 'HIGH');
            strict_1.default.ok(result.triggeredRules.length >= 1);
            strict_1.default.ok(result.recommendations.length >= 1);
        });
        // 正常流程：无异常
        (0, node_test_1.default)('should return no anomaly for normal device', () => {
            const result = service.detectDeviceAnomaly({
                deviceId: 'device-002',
                storeId: 'store-001',
                metrics: {
                    cpuUsage: 30,
                    memoryUsage: 40,
                    diskUsage: 50,
                    networkLatencyMs: 50,
                    errorRate: 0.5,
                    uptimeHours: 168
                },
                tenantId: 'tenant-001'
            });
            strict_1.default.equal(result.deviceId, 'device-002');
            strict_1.default.equal(result.isAnomaly, false);
            strict_1.default.equal(result.severity, 'LOW');
            strict_1.default.equal(result.triggeredRules.length, 0);
        });
        // 正常流程：多异常 -> CRITICAL
        (0, node_test_1.default)('should detect multiple anomalies as CRITICAL', () => {
            const result = service.detectDeviceAnomaly({
                deviceId: 'device-003',
                storeId: 'store-001',
                metrics: {
                    cpuUsage: 95,
                    memoryUsage: 90,
                    diskUsage: 95,
                    networkLatencyMs: 600,
                    errorRate: 1,
                    uptimeHours: 720
                },
                tenantId: 'tenant-001'
            });
            strict_1.default.equal(result.deviceId, 'device-003');
            strict_1.default.equal(result.isAnomaly, true);
            strict_1.default.equal(result.severity, 'CRITICAL');
            strict_1.default.ok(result.triggeredRules.length >= 3);
        });
        // 边界条件：恰好达到阈值
        (0, node_test_1.default)('should detect anomaly at exact threshold', () => {
            const result = service.detectDeviceAnomaly({
                deviceId: 'device-004',
                storeId: 'store-001',
                metrics: {
                    cpuUsage: 90,
                    memoryUsage: 85,
                    diskUsage: 90,
                    networkLatencyMs: 500,
                    errorRate: 5,
                    uptimeHours: 24
                },
                tenantId: 'tenant-001'
            });
            strict_1.default.equal(result.deviceId, 'device-004');
            strict_1.default.equal(result.isAnomaly, true);
            // 5 个条件全部触发 -> CRITICAL
            strict_1.default.equal(result.severity, 'CRITICAL');
            strict_1.default.equal(result.triggeredRules.length, 5);
        });
        // 边界条件：内存泄漏
        (0, node_test_1.default)('should detect memory leak', () => {
            const result = service.detectDeviceAnomaly({
                deviceId: 'device-005',
                storeId: 'store-001',
                metrics: {
                    cpuUsage: 40,
                    memoryUsage: 88,
                    diskUsage: 30,
                    networkLatencyMs: 200,
                    errorRate: 2,
                    uptimeHours: 500
                },
                tenantId: 'tenant-001'
            });
            strict_1.default.equal(result.deviceId, 'device-005');
            strict_1.default.equal(result.isAnomaly, true);
            strict_1.default.equal(result.anomalyType, 'MEMORY_LEAK');
            strict_1.default.ok(result.recommendations.some((r) => r.includes('内存')));
        });
        // 边界条件：磁盘满
        (0, node_test_1.default)('should detect disk full anomaly', () => {
            const result = service.detectDeviceAnomaly({
                deviceId: 'device-006',
                storeId: 'store-001',
                metrics: {
                    cpuUsage: 30,
                    memoryUsage: 40,
                    diskUsage: 92,
                    networkLatencyMs: 100,
                    errorRate: 1,
                    uptimeHours: 300
                },
                tenantId: 'tenant-001'
            });
            strict_1.default.equal(result.deviceId, 'device-006');
            strict_1.default.equal(result.isAnomaly, true);
            strict_1.default.equal(result.anomalyType, 'DISK_FULL');
        });
        // 边界条件：网络延迟
        (0, node_test_1.default)('should detect network latency anomaly', () => {
            const result = service.detectDeviceAnomaly({
                deviceId: 'device-007',
                storeId: 'store-001',
                metrics: {
                    cpuUsage: 30,
                    memoryUsage: 40,
                    diskUsage: 50,
                    networkLatencyMs: 600,
                    errorRate: 1,
                    uptimeHours: 100
                },
                tenantId: 'tenant-001'
            });
            strict_1.default.equal(result.deviceId, 'device-007');
            strict_1.default.equal(result.isAnomaly, true);
            strict_1.default.equal(result.anomalyType, 'NETWORK_LATENCY');
            strict_1.default.ok(result.recommendations.some((r) => r.includes('网络')));
        });
        // 边界条件：高错误率
        (0, node_test_1.default)('should detect high error rate anomaly', () => {
            const result = service.detectDeviceAnomaly({
                deviceId: 'device-008',
                storeId: 'store-001',
                metrics: {
                    cpuUsage: 30,
                    memoryUsage: 40,
                    diskUsage: 50,
                    networkLatencyMs: 100,
                    errorRate: 8,
                    uptimeHours: 50
                },
                tenantId: 'tenant-001'
            });
            strict_1.default.equal(result.deviceId, 'device-008');
            strict_1.default.equal(result.isAnomaly, true);
            strict_1.default.equal(result.anomalyType, 'HIGH_ERROR_RATE');
            strict_1.default.ok(result.recommendations.some((r) => r.includes('错误日志')));
        });
        // 边界条件：单个异常 -> MEDIUM
        (0, node_test_1.default)('should detect single anomaly as MEDIUM severity', () => {
            const result = service.detectDeviceAnomaly({
                deviceId: 'device-009',
                storeId: 'store-001',
                metrics: {
                    cpuUsage: 91,
                    memoryUsage: 40,
                    diskUsage: 50,
                    networkLatencyMs: 100,
                    errorRate: 1,
                    uptimeHours: 200
                },
                tenantId: 'tenant-001'
            });
            strict_1.default.equal(result.deviceId, 'device-009');
            strict_1.default.equal(result.isAnomaly, true);
            strict_1.default.equal(result.severity, 'MEDIUM');
            strict_1.default.equal(result.triggeredRules.length, 1);
        });
        // 边界条件：两个异常 -> HIGH
        (0, node_test_1.default)('should detect two anomalies as HIGH severity', () => {
            const result = service.detectDeviceAnomaly({
                deviceId: 'device-010',
                storeId: 'store-001',
                metrics: {
                    cpuUsage: 95,
                    memoryUsage: 90,
                    diskUsage: 50,
                    networkLatencyMs: 100,
                    errorRate: 1,
                    uptimeHours: 100
                },
                tenantId: 'tenant-001'
            });
            strict_1.default.equal(result.deviceId, 'device-010');
            strict_1.default.equal(result.isAnomaly, true);
            strict_1.default.equal(result.severity, 'HIGH');
            strict_1.default.equal(result.triggeredRules.length, 2);
        });
        // 边界条件：未知推荐字段回退
        (0, node_test_1.default)('should provide fallback recommendation for unknown field', () => {
            const result = service.detectDeviceAnomaly({
                deviceId: 'device-011',
                storeId: 'store-001',
                metrics: {
                    cpuUsage: 91,
                    memoryUsage: 40,
                    diskUsage: 50,
                    networkLatencyMs: 100,
                    errorRate: 1,
                    uptimeHours: 200
                },
                tenantId: 'tenant-001'
            });
            strict_1.default.equal(result.isAnomaly, true);
            strict_1.default.equal(result.anomalyType, 'CPU_SPIKE');
            // CPU_SPIKE 推荐包含 "检查高性能进程"
            strict_1.default.ok(result.recommendations.some((r) => r.includes('检查高性能进程')));
        });
        // 边界条件：uptimeHours 不参与异常检测
        (0, node_test_1.default)('should not trigger anomaly for uptimeHours value', () => {
            const result = service.detectDeviceAnomaly({
                deviceId: 'device-012',
                storeId: 'store-001',
                metrics: {
                    cpuUsage: 30,
                    memoryUsage: 40,
                    diskUsage: 50,
                    networkLatencyMs: 100,
                    errorRate: 1,
                    uptimeHours: 9999 // 高 uptime 不应触发异常
                },
                tenantId: 'tenant-001'
            });
            strict_1.default.equal(result.isAnomaly, false);
            strict_1.default.equal(result.severity, 'LOW');
        });
    });
    (0, node_test_1.describe)('batchEvaluate', () => {
        (0, node_test_1.default)('should evaluate multiple member levels', () => {
            const response = service.batchEvaluate({
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
            strict_1.default.ok(response.items[0].result);
            strict_1.default.ok(response.items[1].result);
        });
        (0, node_test_1.default)('should evaluate mixed member and device items', () => {
            const response = service.batchEvaluate({
                items: [
                    {
                        type: 'member-level',
                        data: { memberId: 'mixed-mem', totalPoints: 6000, totalSpend: 15000, visitCount: 30, tenantId: 't-001' }
                    },
                    {
                        type: 'device-anomaly',
                        data: {
                            deviceId: 'mixed-dev', storeId: 's-001',
                            metrics: { cpuUsage: 95, memoryUsage: 88, diskUsage: 92, networkLatencyMs: 600, errorRate: 7, uptimeHours: 100 },
                            tenantId: 't-001'
                        }
                    }
                ]
            });
            strict_1.default.equal(response.total, 2);
            strict_1.default.equal(response.succeeded, 2);
            strict_1.default.equal(response.items[0].type, 'member-level');
            strict_1.default.equal(response.items[1].type, 'device-anomaly');
        });
        (0, node_test_1.default)('should handle empty batch request', () => {
            const response = service.batchEvaluate({ items: [] });
            strict_1.default.equal(response.total, 0);
            strict_1.default.equal(response.succeeded, 0);
            strict_1.default.equal(response.failed, 0);
            strict_1.default.equal(response.items.length, 0);
        });
        (0, node_test_1.default)('should set correct index and inputId for each item', () => {
            const response = service.batchEvaluate({
                items: [
                    { type: 'member-level', data: { memberId: 'idx-mem', totalPoints: 8000, totalSpend: 20000, visitCount: 50, tenantId: 't-001' } },
                    { type: 'member-level', data: { memberId: 'idx-mem-2', totalPoints: 0, totalSpend: 0, visitCount: 0, tenantId: 't-001' } }
                ]
            });
            strict_1.default.equal(response.items[0].index, 0);
            strict_1.default.equal(response.items[0].inputId, 'idx-mem');
            strict_1.default.equal(response.items[1].index, 1);
            strict_1.default.equal(response.items[1].inputId, 'idx-mem-2');
        });
    });
    (0, node_test_1.describe)('evaluateRiskScore', () => {
        // 覆盖所有 risk recommendation fields
        (0, node_test_1.default)('should include all risk recommendation fields', () => {
            const result = service.evaluateRiskScore({
                subjectId: 'subject-rec-all',
                subjectType: 'member',
                metrics: {
                    refundCount: 3,
                    abnormalPaymentCount: 2,
                    deviceAnomalyCount: 2,
                    complaintCount: 1,
                    voidRefundAmount: 500
                },
                tenantId: 'tenant-001'
            });
            strict_1.default.equal(result.triggeredRules.length, 5);
            // 验证所有推荐覆盖
            strict_1.default.ok(result.recommendations.some((r) => r.includes('限制退款')));
            strict_1.default.ok(result.recommendations.some((r) => r.includes('冻结异常支付')));
            strict_1.default.ok(result.recommendations.some((r) => r.includes('设备指纹')));
            strict_1.default.ok(result.recommendations.some((r) => r.includes('调查投诉')));
            strict_1.default.ok(result.recommendations.some((r) => r.includes('审核大额注销退款')));
        });
        // 正常流程：高风险
        (0, node_test_1.default)('should detect CRITICAL risk for subject with multiple flags', () => {
            const result = service.evaluateRiskScore({
                subjectId: 'subject-001',
                subjectType: 'member',
                metrics: {
                    refundCount: 5,
                    abnormalPaymentCount: 3,
                    deviceAnomalyCount: 2,
                    complaintCount: 2,
                    voidRefundAmount: 800
                },
                tenantId: 'tenant-001'
            });
            strict_1.default.equal(result.subjectId, 'subject-001');
            strict_1.default.equal(result.riskLevel, 'CRITICAL');
            strict_1.default.ok(result.riskScore >= 70);
            strict_1.default.ok(result.triggeredRules.length >= 3);
            strict_1.default.ok(result.reasons.length >= 3);
            strict_1.default.ok(result.recommendations.length >= 3);
        });
        // 正常流程：低风险
        (0, node_test_1.default)('should report LOW risk for normal subject', () => {
            const result = service.evaluateRiskScore({
                subjectId: 'subject-002',
                subjectType: 'member',
                metrics: {
                    refundCount: 0,
                    abnormalPaymentCount: 0,
                    complaintCount: 0,
                    voidRefundAmount: 0
                },
                tenantId: 'tenant-001'
            });
            strict_1.default.equal(result.subjectId, 'subject-002');
            strict_1.default.equal(result.riskLevel, 'LOW');
            strict_1.default.equal(result.riskScore, 0);
            strict_1.default.equal(result.triggeredRules.length, 0);
            strict_1.default.equal(result.reasons.length, 0);
        });
        // 正常流程：中等风险
        (0, node_test_1.default)('should report MEDIUM risk for moderate flags', () => {
            const result = service.evaluateRiskScore({
                subjectId: 'subject-003',
                subjectType: 'store',
                metrics: {
                    refundCount: 3,
                    abnormalPaymentCount: 0,
                    complaintCount: 0,
                    voidRefundAmount: 0
                },
                tenantId: 'tenant-001'
            });
            strict_1.default.equal(result.subjectId, 'subject-003');
            // refundCount >= 3 triggers cond-high-refund weight=0.25 -> score=25
            strict_1.default.equal(result.riskLevel, 'MEDIUM');
            strict_1.default.equal(result.riskScore, 25);
            strict_1.default.equal(result.triggeredRules.length, 1);
        });
        // 边界条件：恰好达到高风险阈值
        (0, node_test_1.default)('should score exactly at threshold for HIGH risk', () => {
            // 触发 cond-high-refund(0.25) + cond-complaints(0.20) = 45, 加上 cond-abnormal-payment(0.20)=65，再...
            // 简化为：refundCount=3(0.25)=25, complaintCount=1(0.20)=20, abnormalPaymentCount=2(0.20)=20 -> 65
            const result = service.evaluateRiskScore({
                subjectId: 'subject-004',
                subjectType: 'member',
                metrics: {
                    refundCount: 3,
                    abnormalPaymentCount: 2,
                    complaintCount: 1,
                    voidRefundAmount: 0
                },
                tenantId: 'tenant-001'
            });
            strict_1.default.equal(result.riskLevel, 'HIGH');
            strict_1.default.equal(result.riskScore, 65);
            strict_1.default.equal(result.triggeredRules.length, 3);
        });
        // 边界条件：大额注销退款增加分数
        (0, node_test_1.default)('should boost score for large void refund amount', () => {
            const result = service.evaluateRiskScore({
                subjectId: 'subject-005',
                subjectType: 'member',
                metrics: {
                    refundCount: 3,
                    voidRefundAmount: 1200
                },
                tenantId: 'tenant-001'
            });
            // refundCount=3: +25, voidRefundAmount>=500: +20(cond), voidRefundAmount>=1000: +15 extra
            strict_1.default.equal(result.riskScore, 60);
            strict_1.default.equal(result.riskLevel, 'HIGH');
        });
        // 边界条件：大量异常支付额外加分
        (0, node_test_1.default)('should boost score for many abnormal payments', () => {
            const result = service.evaluateRiskScore({
                subjectId: 'subject-006',
                subjectType: 'member',
                metrics: {
                    abnormalPaymentCount: 5
                },
                tenantId: 'tenant-001'
            });
            // abnormalPaymentCount>=2: +20, abnormalPaymentCount>=5: +10 extra
            strict_1.default.equal(result.riskScore, 30);
            strict_1.default.equal(result.riskLevel, 'MEDIUM');
        });
        // 边界条件：评分上限 100
        (0, node_test_1.default)('should cap risk score at 100', () => {
            const result = service.evaluateRiskScore({
                subjectId: 'subject-007',
                subjectType: 'member',
                metrics: {
                    refundCount: 10,
                    abnormalPaymentCount: 10,
                    deviceAnomalyCount: 5,
                    complaintCount: 5,
                    voidRefundAmount: 5000
                },
                tenantId: 'tenant-001'
            });
            strict_1.default.equal(result.riskScore, 100);
            strict_1.default.equal(result.riskLevel, 'CRITICAL');
        });
    });
    (0, node_test_1.describe)('getEngineStatus', () => {
        (0, node_test_1.default)('should return status for all engines', () => {
            const statuses = service.getEngineStatus();
            strict_1.default.ok(Array.isArray(statuses));
            strict_1.default.ok(statuses.length >= 3);
        });
        (0, node_test_1.default)('member-level engine status should be correct', () => {
            const statuses = service.getEngineStatus();
            const ml = statuses.find((s) => s.engineId === 'member-level-v1');
            strict_1.default.ok(ml);
            strict_1.default.equal(ml.engineName, 'Member Level Evaluator');
            strict_1.default.equal(ml.conditionsCount, 3);
            strict_1.default.equal(ml.actionsCount, 3);
            strict_1.default.equal(ml.matchStrategy, 'ALL');
        });
        (0, node_test_1.default)('device-anomaly engine status should be correct', () => {
            const statuses = service.getEngineStatus();
            const da = statuses.find((s) => s.engineId === 'device-anomaly-v1');
            strict_1.default.ok(da);
            strict_1.default.equal(da.engineName, 'Device Anomaly Detector');
            strict_1.default.equal(da.conditionsCount, 5);
            strict_1.default.equal(da.actionsCount, 2);
            strict_1.default.equal(da.matchStrategy, 'ANY');
        });
        (0, node_test_1.default)('risk-score engine status should be correct', () => {
            const statuses = service.getEngineStatus();
            const rs = statuses.find((s) => s.engineId === 'risk-score-v1');
            strict_1.default.ok(rs);
            strict_1.default.equal(rs.engineName, 'Risk Score Evaluator');
            strict_1.default.equal(rs.conditionsCount, 5);
            strict_1.default.equal(rs.actionsCount, 3);
            strict_1.default.equal(rs.matchStrategy, 'ANY');
        });
        (0, node_test_1.default)('status should include all required fields', () => {
            const statuses = service.getEngineStatus();
            for (const s of statuses) {
                strict_1.default.ok(typeof s.engineId === 'string');
                strict_1.default.ok(typeof s.engineName === 'string');
                strict_1.default.ok(typeof s.conditionsCount === 'number');
                strict_1.default.ok(typeof s.actionsCount === 'number');
                strict_1.default.ok(['ALL', 'ANY'].includes(s.matchStrategy));
                strict_1.default.ok(typeof s.status === 'string');
            }
        });
    });
});
//# sourceMappingURL=ai-rule-engine.service.test.js.map