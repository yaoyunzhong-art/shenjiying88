"use strict";
/**
 * 🐜 自动: [ai-rule-engine] [C] 角色测试
 *
 * 8 角色视角的 ai-rule-engine 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
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
const ai_rule_engine_controller_1 = require("./ai-rule-engine.controller");
const ai_rule_engine_service_1 = require("./ai-rule-engine.service");
// ── 角色定义 ──
const ROLES = {
    StoreManager: '👔店长',
    FrontDesk: '🛒前台',
    HR: '👥HR',
    Security: '🔧安监',
    Guide: '🎮导玩员',
    Operations: '🎯运行专员',
    Teambuilding: '🤝团建',
    Marketing: '📢营销',
};
// ── 测试数据工厂 ──
function createController() {
    const service = new ai_rule_engine_service_1.AiRuleEngineService();
    return new ai_rule_engine_controller_1.AiRuleEngineController(service);
}
const svipMemberData = {
    memberId: 'mem-svip-001',
    totalPoints: 8000,
    totalSpend: 20000,
    visitCount: 50,
    tenantId: 't-001',
};
const vipMemberData = {
    memberId: 'mem-vip-002',
    totalPoints: 3000,
    totalSpend: 12000,
    visitCount: 25,
    tenantId: 't-001',
};
const regularMemberData = {
    memberId: 'mem-regular-003',
    totalPoints: 100,
    totalSpend: 200,
    visitCount: 3,
    tenantId: 't-001',
};
const criticalAnomalyData = {
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
};
const normalDeviceData = {
    deviceId: 'dev-healthy-002',
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
};
// ── 👔店长 ──
(0, node_test_1.describe)(`${ROLES.StoreManager} ai-rule-engine 角色测试`, () => {
    (0, node_test_1.default)('店长可评估高价值会员等级 => SVIP', () => {
        const ctrl = createController();
        const res = ctrl.evaluateMemberLevel(svipMemberData);
        const result = res.result;
        strict_1.default.equal(res.type, 'member-level');
        strict_1.default.equal(result.suggestedLevel, 'SVIP');
        strict_1.default.equal(result.triggeredRules.length, 3);
        strict_1.default.ok(result.confidence >= 0.8);
        strict_1.default.ok(Date.parse(res.timestamp) > 0);
    });
    (0, node_test_1.default)('店长查看普通会员评估 => REGULAR', () => {
        const ctrl = createController();
        const res = ctrl.evaluateMemberLevel(regularMemberData);
        const result = res.result;
        strict_1.default.equal(result.suggestedLevel, 'REGULAR');
        strict_1.default.ok(result.confidence <= 0.5);
    });
    (0, node_test_1.default)('店长批量评估全体会员等级（管理决策辅助）', () => {
        const ctrl = createController();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = ctrl.evaluateBatch({
            items: [
                { type: 'member-level', data: svipMemberData },
                { type: 'member-level', data: vipMemberData },
                { type: 'member-level', data: regularMemberData }
            ]
        });
        strict_1.default.equal(result.total, 3);
        strict_1.default.equal(result.succeeded, 3);
        strict_1.default.equal(result.failed, 0);
        const levels = result.items.map(i => i.result.suggestedLevel);
        strict_1.default.deepEqual(levels, ['SVIP', 'REGULAR', 'REGULAR']);
    });
    (0, node_test_1.default)('店长查看规则引擎配置状态（运维可见性）', () => {
        const ctrl = createController();
        const engines = ctrl.getEngines();
        strict_1.default.ok(Array.isArray(engines));
        strict_1.default.ok(engines.length >= 3);
        const memberLevelEngine = engines.find((e) => e.engineId === 'member-level-v1');
        strict_1.default.ok(memberLevelEngine);
        strict_1.default.equal(memberLevelEngine.conditionsCount, 3);
        strict_1.default.equal(memberLevelEngine.actionsCount, 3);
        strict_1.default.equal(memberLevelEngine.matchStrategy, 'ALL');
        const deviceEngine = engines.find((e) => e.engineId === 'device-anomaly-v1');
        strict_1.default.ok(deviceEngine);
        strict_1.default.equal(deviceEngine.conditionsCount, 5);
        strict_1.default.equal(deviceEngine.matchStrategy, 'ANY');
        const riskEngine = engines.find((e) => e.engineId === 'risk-score-v1');
        strict_1.default.ok(riskEngine);
        strict_1.default.equal(riskEngine.conditionsCount, 5);
    });
    (0, node_test_1.default)('店长对高退款门店做风险评分（风控视角）', () => {
        const ctrl = createController();
        const res = ctrl.evaluateRiskScore({
            subjectId: 'store-risky-001',
            subjectType: 'store',
            metrics: {
                refundCount: 10,
                abnormalPaymentCount: 5,
                complaintCount: 3,
                voidRefundAmount: 2000,
                deviceAnomalyCount: 1,
                activeDays: 7,
                recentTransactionAmount: 100000
            },
            tenantId: 't-001'
        });
        const result = res.result;
        strict_1.default.equal(res.type, 'risk-score');
        // cond-high-refund ✓, cond-abnormal-payment ✓, cond-complaints ✓, cond-void-refund ✓
        // weightedScore = 25+20+20+20 = 85 + extra (void>=1000 => +15, abnormal>=5 => +10) = 110 => clamp 100
        strict_1.default.ok(result.riskScore >= 80);
        strict_1.default.equal(result.riskLevel, 'CRITICAL');
        strict_1.default.ok(result.reasons.length >= 3);
        strict_1.default.ok(result.recommendations.length >= 3);
    });
});
// ── 🛒前台 ──
(0, node_test_1.describe)(`${ROLES.FrontDesk} ai-rule-engine 角色测试`, () => {
    (0, node_test_1.default)('前台为新会员查询等级建议 => REGULAR（边界：零消费零积分）', () => {
        const ctrl = createController();
        const res = ctrl.evaluateMemberLevel({
            memberId: 'new-member-001',
            totalPoints: 0,
            totalSpend: 0,
            visitCount: 0,
            tenantId: 't-001',
        });
        const result = res.result;
        strict_1.default.equal(result.suggestedLevel, 'REGULAR');
        strict_1.default.equal(result.triggeredRules.length, 0);
        strict_1.default.equal(result.confidence, 0.3);
    });
    (0, node_test_1.default)('前台通过通用 evaluate 端点查询会员等级', () => {
        const ctrl = createController();
        const res = ctrl.evaluate({
            type: 'member-level',
            data: {
                memberId: 'mem-front-001',
                totalPoints: 3000,
                totalSpend: 8000,
                visitCount: 22,
                tenantId: 't-001',
            },
        });
        strict_1.default.equal(res.type, 'member-level');
        const result = res.result;
        // matchStrategy=ALL, 不满足全部条件 => REGULAR
        strict_1.default.equal(result.suggestedLevel, 'REGULAR');
        strict_1.default.ok(result.triggeredRules.length < 3); // 只有部分条件触发
    });
    (0, node_test_1.default)('前台批量评估多会员（快速结账排队时的批量查询）', () => {
        const ctrl = createController();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = ctrl.evaluateBatch({
            items: [
                { type: 'member-level', data: { memberId: 'cashier-q-01', totalPoints: 500, totalSpend: 1000, visitCount: 5, tenantId: 't-001' } },
                { type: 'member-level', data: { memberId: 'cashier-q-02', totalPoints: 6000, totalSpend: 12000, visitCount: 30, tenantId: 't-001' } }
            ]
        });
        strict_1.default.equal(result.total, 2);
        strict_1.default.equal(result.succeeded, 2);
        const items = result.items;
        strict_1.default.equal(items[0].inputId, 'cashier-q-01');
        strict_1.default.equal(items[1].inputId, 'cashier-q-02');
    });
});
// ── 👥HR ──
(0, node_test_1.describe)(`${ROLES.HR} ai-rule-engine 角色测试`, () => {
    (0, node_test_1.default)('HR 评估员工会员等级 => 触发2条件但 ALL 不满足 => REGULAR', () => {
        const ctrl = createController();
        const res = ctrl.evaluateMemberLevel(vipMemberData);
        const result = res.result;
        // totalSpend=12000, totalPoints=3000, visitCount=25
        // cond-high-spend ✓, cond-high-points ✗(3000<5000), cond-frequent-visit ✓
        // matchStrategy=ALL => isMatch=false => REGULAR + empty triggeredRules
        strict_1.default.equal(result.suggestedLevel, 'REGULAR');
        strict_1.default.equal(result.confidence, 0.3);
        strict_1.default.equal(result.triggeredRules.length, 0); // isMatch=false => []
    });
    (0, node_test_1.default)('HR 通用端点输入错误类型 => 抛出异常（边界：类型不匹配）', () => {
        const ctrl = createController();
        strict_1.default.throws(() => ctrl.evaluate({
            type: 'staff-performance',
            data: {},
        }), /Unsupported evaluation type/);
    });
    (0, node_test_1.default)('HR 批量评估新入职员工关联会员（批量入职场景）', () => {
        const ctrl = createController();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = ctrl.evaluateBatch({
            items: [
                { type: 'member-level', data: { memberId: 'hr-new-01', totalPoints: 0, totalSpend: 0, visitCount: 0, tenantId: 't-001' } },
                { type: 'member-level', data: { memberId: 'hr-new-02', totalPoints: 3000, totalSpend: 6000, visitCount: 22, tenantId: 't-001' } }
            ]
        });
        strict_1.default.equal(result.total, 2);
        strict_1.default.equal(result.succeeded, 2);
        const levels = result.items.map(i => i.result.suggestedLevel);
        strict_1.default.deepEqual(levels, ['REGULAR', 'REGULAR']);
    });
});
// ── 🔧安监 ──
(0, node_test_1.describe)(`${ROLES.Security} ai-rule-engine 角色测试`, () => {
    (0, node_test_1.default)('安监检测设备严重异常 => CRITICAL', () => {
        const ctrl = createController();
        const res = ctrl.detectDeviceAnomaly(criticalAnomalyData);
        const result = res.result;
        strict_1.default.equal(result.isAnomaly, true);
        strict_1.default.equal(result.severity, 'CRITICAL');
        strict_1.default.equal(result.anomalyType, 'CPU_SPIKE');
        strict_1.default.ok(result.triggeredRules.length >= 3);
        strict_1.default.ok(result.recommendations.length >= 3);
    });
    (0, node_test_1.default)('安监检查健康设备正常 => 无异常', () => {
        const ctrl = createController();
        const res = ctrl.detectDeviceAnomaly(normalDeviceData);
        const result = res.result;
        strict_1.default.equal(result.isAnomaly, false);
        strict_1.default.equal(result.severity, 'LOW');
        strict_1.default.deepStrictEqual(result.recommendations, ['All metrics within normal range']);
    });
    (0, node_test_1.default)('安监对投诉多的会员做风险评分 => HIGH', () => {
        const ctrl = createController();
        const res = ctrl.evaluateRiskScore({
            subjectId: 'member-complaint-001',
            subjectType: 'member',
            metrics: {
                refundCount: 5,
                complaintCount: 3,
                voidRefundAmount: 800,
                abnormalPaymentCount: 1,
                deviceAnomalyCount: 0,
                activeDays: 14,
                recentTransactionAmount: 5000
            },
            tenantId: 't-001'
        });
        const result = res.result;
        // cond-high-refund ✓(5>=3, w0.25) + cond-complaints ✓(3>=1, w0.2) + cond-void-refund ✓(800>=500, w0.2)
        // = 25+20+20 = 65 => HIGH
        strict_1.default.equal(result.riskLevel, 'HIGH');
        strict_1.default.ok(result.riskScore >= 50);
        strict_1.default.ok(result.triggeredRules.includes('cond-high-refund'));
        strict_1.default.ok(result.triggeredRules.includes('cond-complaints'));
    });
    (0, node_test_1.default)('安监批量评估可疑设备群（安全巡检批量）', () => {
        const ctrl = createController();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = ctrl.evaluateBatch({
            items: [
                { type: 'device-anomaly', data: criticalAnomalyData },
                { type: 'device-anomaly', data: normalDeviceData },
                { type: 'device-anomaly', data: { deviceId: 'dev-security-01', storeId: 'store-001', metrics: { cpuUsage: 91, memoryUsage: 87, diskUsage: 50, networkLatencyMs: 100, errorRate: 2, uptimeHours: 300 }, tenantId: 't-001' } }
            ]
        });
        strict_1.default.equal(result.total, 3);
        strict_1.default.equal(result.succeeded, 3);
        strict_1.default.equal(result.failed, 0);
        const item1 = result.items[0].result;
        strict_1.default.equal(item1.isAnomaly, true);
        strict_1.default.equal(item1.severity, 'CRITICAL');
        const item2 = result.items[1].result;
        strict_1.default.equal(item2.isAnomaly, false);
        const item3 = result.items[2].result;
        strict_1.default.equal(item3.isAnomaly, true);
        // cpuUsage=91>=90 + memoryUsage=87>=85 => 2个异常 => HIGH
        strict_1.default.equal(item3.severity, 'HIGH');
    });
});
// ── 🎮导玩员 ──
(0, node_test_1.describe)(`${ROLES.Guide} ai-rule-engine 角色测试`, () => {
    (0, node_test_1.default)('导玩员通过通用端点检测设备异常 => CPU_SPIKE', () => {
        const ctrl = createController();
        const res = ctrl.evaluate({
            type: 'device-anomaly',
            data: {
                deviceId: 'dev-guide-001',
                storeId: 'store-001',
                metrics: {
                    cpuUsage: 93,
                    memoryUsage: 50,
                    diskUsage: 30,
                    networkLatencyMs: 80,
                    errorRate: 1,
                    uptimeHours: 500,
                },
                tenantId: 't-001',
            },
        });
        const result = res.result;
        strict_1.default.equal(result.isAnomaly, true);
        strict_1.default.equal(result.anomalyType, 'CPU_SPIKE');
        strict_1.default.equal(result.severity, 'MEDIUM');
    });
    (0, node_test_1.default)('导玩员查看高积分会员评估 => 不满足 ALL 回退 REGULAR（边界：高积分低消费）', () => {
        const ctrl = createController();
        const res = ctrl.evaluateMemberLevel({
            memberId: 'mem-guide-001',
            totalPoints: 6000,
            totalSpend: 3000,
            visitCount: 30,
            tenantId: 't-001',
        });
        const result = res.result;
        // high-points ✓ (6000>=5000), frequent-visit ✓ (30>=20), high-spend ✗ (3000<10000)
        // ALL => isMatch=false => REGULAR + empty triggeredRules
        strict_1.default.equal(result.suggestedLevel, 'REGULAR');
        strict_1.default.equal(result.triggeredRules.length, 0);
        strict_1.default.equal(result.confidence, 0.3);
    });
    (0, node_test_1.default)('导玩员对游客设备做异常检测（游客无会员体系但需安检）', () => {
        const ctrl = createController();
        const res = ctrl.evaluate({
            type: 'device-anomaly',
            data: {
                deviceId: 'dev-visitor-001',
                storeId: 'store-guest',
                metrics: {
                    cpuUsage: 15,
                    memoryUsage: 25,
                    diskUsage: 35,
                    networkLatencyMs: 40,
                    errorRate: 0.1,
                    uptimeHours: 50
                },
                tenantId: 't-001'
            }
        });
        const result = res.result;
        strict_1.default.equal(result.isAnomaly, false);
        strict_1.default.equal(result.severity, 'LOW');
    });
    (0, node_test_1.default)('导玩员对高频退款设备做风险排查', () => {
        const ctrl = createController();
        const res = ctrl.evaluateRiskScore({
            subjectId: 'device-risky-guide',
            subjectType: 'device',
            metrics: {
                refundCount: 4,
                deviceAnomalyCount: 1,
                complaintCount: 0,
                abnormalPaymentCount: 0,
                activeDays: 10,
                recentTransactionAmount: 3000
            },
            tenantId: 't-001'
        });
        const result = res.result;
        // cond-high-refund ✓(4>=3, w0.25) => 25 => MEDIUM
        strict_1.default.equal(result.riskLevel, 'MEDIUM');
        strict_1.default.ok(result.triggeredRules.includes('cond-high-refund'));
        strict_1.default.ok(result.reasons.some(r => r.includes('退款')));
    });
});
// ── 🎯运行专员 ──
(0, node_test_1.describe)(`${ROLES.Operations} ai-rule-engine 角色测试`, () => {
    (0, node_test_1.default)('运行专员检测内存泄漏设备 => MEMORY_LEAK', () => {
        const ctrl = createController();
        const res = ctrl.detectDeviceAnomaly({
            deviceId: 'dev-ops-001',
            storeId: 'store-001',
            metrics: {
                cpuUsage: 40,
                memoryUsage: 95,
                diskUsage: 30,
                networkLatencyMs: 100,
                errorRate: 1,
                uptimeHours: 720,
            },
            tenantId: 't-001',
        });
        const result = res.result;
        strict_1.default.equal(result.isAnomaly, true);
        strict_1.default.equal(result.anomalyType, 'MEMORY_LEAK');
        strict_1.default.equal(result.severity, 'MEDIUM');
        strict_1.default.ok(result.recommendations.some(r => r.includes('内存')));
    });
    (0, node_test_1.default)('运行专员检测网络延迟设备 => NETWORK_LATENCY', () => {
        const ctrl = createController();
        const res = ctrl.detectDeviceAnomaly({
            deviceId: 'dev-ops-002',
            storeId: 'store-002',
            metrics: {
                cpuUsage: 30,
                memoryUsage: 40,
                diskUsage: 50,
                networkLatencyMs: 800,
                errorRate: 1,
                uptimeHours: 200,
            },
            tenantId: 't-001',
        });
        const result = res.result;
        strict_1.default.equal(result.isAnomaly, true);
        strict_1.default.equal(result.anomalyType, 'NETWORK_LATENCY');
        strict_1.default.equal(result.severity, 'MEDIUM');
    });
    (0, node_test_1.default)('运行专员查看引擎状态（运维监控日常排查）', () => {
        const ctrl = createController();
        const engines = ctrl.getEngines();
        strict_1.default.ok(engines.length >= 3);
        engines.forEach((e) => {
            strict_1.default.ok(e.engineId.startsWith('member-level') || e.engineId.startsWith('device-anomaly') || e.engineId.startsWith('risk-score'));
            strict_1.default.ok(typeof e.engineName === 'string');
            // status is AiExecutionStatus enum value (e.g. 'SUCCEEDED')
            strict_1.default.ok(typeof e.status === 'string');
            strict_1.default.ok(e.conditionsCount > 0);
            strict_1.default.ok(e.actionsCount > 0);
        });
    });
    (0, node_test_1.default)('运行专员对设备密集门店做风险评分 => MEDIUM', () => {
        const ctrl = createController();
        const res = ctrl.evaluateRiskScore({
            subjectId: 'store-dev-heavy',
            subjectType: 'store',
            metrics: {
                deviceAnomalyCount: 3,
                refundCount: 1,
                abnormalPaymentCount: 0,
                complaintCount: 0,
                activeDays: 60,
                recentTransactionAmount: 20000
            },
            tenantId: 't-001'
        });
        const result = res.result;
        // cond-device-anomaly ✓(3>=2, w0.15) => 15 => LOW (<25)
        strict_1.default.equal(result.riskLevel, 'LOW');
        strict_1.default.ok(result.riskScore >= 10);
        strict_1.default.ok(result.triggeredRules.includes('cond-device-anomaly'));
    });
});
// ── 🤝团建 ──
(0, node_test_1.describe)(`${ROLES.Teambuilding} ai-rule-engine 角色测试`, () => {
    (0, node_test_1.default)('团建评估团队高活跃会员 => SVIP（边界：最高临界值）', () => {
        const ctrl = createController();
        const res = ctrl.evaluateMemberLevel({
            memberId: 'mem-team-001',
            totalPoints: 99999,
            totalSpend: 99999,
            visitCount: 999,
            tenantId: 't-001',
        });
        const result = res.result;
        strict_1.default.equal(result.suggestedLevel, 'SVIP');
        strict_1.default.equal(result.confidence, 1.0);
    });
    (0, node_test_1.default)('团建检测磁盘满设备 => DISK_FULL', () => {
        const ctrl = createController();
        const res = ctrl.detectDeviceAnomaly({
            deviceId: 'dev-team-001',
            storeId: 'store-003',
            metrics: {
                cpuUsage: 50,
                memoryUsage: 40,
                diskUsage: 95,
                networkLatencyMs: 60,
                errorRate: 2,
                uptimeHours: 300,
            },
            tenantId: 't-001',
        });
        const result = res.result;
        strict_1.default.equal(result.isAnomaly, true);
        strict_1.default.equal(result.anomalyType, 'DISK_FULL');
        // 单点异常 => MEDIUM
        strict_1.default.equal(result.severity, 'MEDIUM');
    });
    (0, node_test_1.default)('团建活动前对场地做风险评分（活动安全前置检查）', () => {
        const ctrl = createController();
        const res = ctrl.evaluateRiskScore({
            subjectId: 'venue-team-001',
            subjectType: 'store',
            metrics: {
                deviceAnomalyCount: 3,
                complaintCount: 0,
                refundCount: 1,
                abnormalPaymentCount: 0,
                activeDays: 30,
                recentTransactionAmount: 15000
            },
            tenantId: 't-001'
        });
        const result = res.result;
        // cond-device-anomaly ✓(3>=2, w0.15) => 15 => LOW (<25)
        strict_1.default.equal(result.riskLevel, 'LOW');
        strict_1.default.ok(result.recommendations.some(r => r.includes('设备')));
    });
    (0, node_test_1.default)('团建查看引擎状态确认活动可用性', () => {
        const ctrl = createController();
        const engines = ctrl.getEngines();
        const riskEngine = engines.find((e) => e.engineId === 'risk-score-v1');
        strict_1.default.ok(riskEngine);
        // AiExecutionStatus.Succeeded = 'SUCCEEDED'
        strict_1.default.ok(typeof riskEngine.status === 'string');
        strict_1.default.ok(riskEngine.conditionsCount >= 3);
    });
});
// ── 📢营销 ──
(0, node_test_1.describe)(`${ROLES.Marketing} ai-rule-engine 角色测试`, () => {
    (0, node_test_1.default)('营销评估潜在升级会员 => ALL不满足退回 REGULAR（边界：仅高到访）', () => {
        const ctrl = createController();
        const res = ctrl.evaluateMemberLevel({
            memberId: 'mem-mkt-001',
            totalPoints: 4000,
            totalSpend: 8000,
            visitCount: 25,
            tenantId: 't-001',
        });
        const result = res.result;
        // totalSpend=8000<10000, totalPoints=4000<5000, visitCount=25>=20
        // ALL => isMatch=false => REGULAR + empty triggeredRules
        strict_1.default.equal(result.suggestedLevel, 'REGULAR');
        strict_1.default.equal(result.triggeredRules.length, 0);
        strict_1.default.equal(result.confidence, 0.3);
    });
    (0, node_test_1.default)('营销检测多指标异常设备（边界：错误率高 + CPU 高）', () => {
        const ctrl = createController();
        const res = ctrl.detectDeviceAnomaly({
            deviceId: 'dev-mkt-001',
            storeId: 'store-001',
            metrics: {
                cpuUsage: 92,
                memoryUsage: 50,
                diskUsage: 40,
                networkLatencyMs: 100,
                errorRate: 8,
                uptimeHours: 200,
            },
            tenantId: 't-001',
        });
        const result = res.result;
        strict_1.default.equal(result.isAnomaly, true);
        // 2个异常 => HIGH
        strict_1.default.equal(result.severity, 'HIGH');
        strict_1.default.equal(result.triggeredRules.length, 2);
    });
    (0, node_test_1.default)('营销批量评估活动会员 + 场地设备（批量端点）', () => {
        const ctrl = createController();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = ctrl.evaluateBatch({
            items: [
                { type: 'member-level', data: { memberId: 'mkt-batch-01', totalPoints: 8000, totalSpend: 20000, visitCount: 50, tenantId: 't-001' } },
                { type: 'member-level', data: { memberId: 'mkt-batch-02', totalPoints: 100, totalSpend: 200, visitCount: 3, tenantId: 't-001' } },
                { type: 'device-anomaly', data: { deviceId: 'dev-batch-01', storeId: 'store-001', metrics: { cpuUsage: 20, memoryUsage: 30, diskUsage: 40, networkLatencyMs: 50, errorRate: 0.5, uptimeHours: 100 }, tenantId: 't-001' } }
            ]
        });
        strict_1.default.equal(result.total, 3);
        strict_1.default.equal(result.succeeded, 3);
        strict_1.default.equal(result.failed, 0);
        strict_1.default.equal(result.items.length, 3);
        // 批量第1项: SVIP
        const item1 = result.items[0].result;
        strict_1.default.equal(item1.suggestedLevel, 'SVIP');
        // 批量第2项: REGULAR
        const item2 = result.items[1].result;
        strict_1.default.equal(item2.suggestedLevel, 'REGULAR');
        // 批量第3项: 正常设备
        const item3 = result.items[2].result;
        strict_1.default.equal(item3.isAnomaly, false);
        strict_1.default.ok(Date.parse(result.timestamp) > 0);
    });
    (0, node_test_1.default)('营销通过通用端点评估风险（批量活动前的风险排查）', () => {
        const ctrl = createController();
        const res = ctrl.evaluateRiskScore({
            subjectId: 'mkt-campaign-001',
            subjectType: 'store',
            metrics: {
                refundCount: 5,
                abnormalPaymentCount: 2,
                complaintCount: 1,
                deviceAnomalyCount: 0,
                activeDays: 30,
                recentTransactionAmount: 50000
            },
            tenantId: 't-001'
        });
        const result = res.result;
        strict_1.default.equal(res.type, 'risk-score');
        // cond-high-refund (refundCount=5>=3 weight 0.25) + cond-abnormal-payment (2>=2 weight 0.2) + cond-complaints (1>=1 weight 0.2)
        // weightedScore = 25 + 20 + 20 = 65 => HIGH
        strict_1.default.ok(result.riskScore >= 50);
        strict_1.default.equal(result.riskLevel, 'HIGH');
        strict_1.default.ok(result.triggeredRules.length >= 2);
        strict_1.default.ok(result.reasons.length >= 2);
        strict_1.default.ok(result.recommendations.length >= 2);
        strict_1.default.ok(Date.parse(result.evaluatedAt) > 0);
    });
});
//# sourceMappingURL=ai-rule-engine.role.test.js.map