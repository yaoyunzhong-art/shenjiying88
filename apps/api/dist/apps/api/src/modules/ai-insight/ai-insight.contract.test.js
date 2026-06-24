"use strict";
/**
 * 🐜 自动: [ai-insight] [C] 合约测试
 *
 * 验证 ai-insight 模块的实体/枚举/序列化的对外契约
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
const ai_insight_service_1 = require("./ai-insight.service");
// ─── 服务实例 helper ───────────────────────────────────
function makeService() {
    // 每个测试新建实例,确保 seed 数据隔离
    return new ai_insight_service_1.AiInsightService();
}
// ─── 实体 Shape 合约 ───────────────────────────────────
(0, node_test_1.describe)('[ai-insight] 合约: 实体 Shape', () => {
    (0, node_test_1.default)('InsightReport 必备字段齐全', () => {
        const svc = makeService();
        const report = svc.generateReport('default', 'store-01', 'revenue', '2026-06-01', '2026-06-07');
        strict_1.default.ok(report.id.startsWith('report-revenue-'));
        strict_1.default.equal(report.tenantId, 'default');
        strict_1.default.equal(report.storeId, 'store-01');
        strict_1.default.equal(report.type, 'revenue');
        strict_1.default.ok(report.title.includes('洞察报告'));
        strict_1.default.equal(typeof report.summary, 'string');
        strict_1.default.ok(report.summary.length > 0);
        strict_1.default.equal(typeof report.data.metrics, 'object');
        strict_1.default.ok(Array.isArray(report.data.trends));
        strict_1.default.ok(Array.isArray(report.data.anomalies));
        strict_1.default.match(report.periodStart, /^\d{4}-\d{2}-\d{2}/);
        strict_1.default.match(report.periodEnd, /^\d{4}-\d{2}-\d{2}/);
        strict_1.default.ok(new Date(report.generatedAt).toString() !== 'Invalid Date');
        strict_1.default.ok(new Date(report.createdAt).toString() !== 'Invalid Date');
    });
    (0, node_test_1.default)('InsightReport.type 仅允许 5 种', () => {
        const svc = makeService();
        const validTypes = ['revenue', 'member', 'attendance', 'game', 'kpi'];
        for (const type of validTypes) {
            const report = svc.generateReport('default', undefined, type, '2026-06-01', '2026-06-07');
            strict_1.default.equal(report.type, type);
        }
    });
    (0, node_test_1.default)('KPI 必备字段齐全', () => {
        const svc = makeService();
        const kpis = svc.getKPIs('default');
        strict_1.default.ok(kpis.length > 0, 'seed data 应该预置 KPI');
        const kpi = kpis[0];
        strict_1.default.equal(typeof kpi.id, 'string');
        strict_1.default.equal(kpi.tenantId, 'default');
        strict_1.default.equal(typeof kpi.name, 'string');
        strict_1.default.ok(['revenue', 'member', 'attendance', 'game', 'operation'].includes(kpi.category));
        strict_1.default.equal(typeof kpi.value, 'number');
        strict_1.default.equal(typeof kpi.target, 'number');
        strict_1.default.equal(typeof kpi.unit, 'string');
        strict_1.default.ok(['up', 'down', 'stable'].includes(kpi.trend));
        strict_1.default.equal(typeof kpi.period, 'string');
        strict_1.default.ok(new Date(kpi.updatedAt).toString() !== 'Invalid Date');
    });
    (0, node_test_1.default)('Anomaly 必备字段齐全', () => {
        const svc = makeService();
        const anomalies = svc.getAnomalies('default');
        strict_1.default.ok(anomalies.length > 0, 'seed data 应该预置 anomaly');
        const a = anomalies[0];
        strict_1.default.equal(typeof a.id, 'string');
        strict_1.default.equal(a.tenantId, 'default');
        strict_1.default.equal(typeof a.metric, 'string');
        strict_1.default.equal(typeof a.value, 'number');
        strict_1.default.equal(typeof a.expectedValue, 'number');
        strict_1.default.equal(typeof a.deviationPercent, 'number');
        strict_1.default.ok(['low', 'medium', 'high', 'critical'].includes(a.severity));
        strict_1.default.ok(new Date(a.detectedAt).toString() !== 'Invalid Date');
        strict_1.default.ok(['open', 'acknowledged', 'resolved'].includes(a.status));
    });
    (0, node_test_1.default)('Trend 必备字段齐全 + forecast 是 7 天数组', () => {
        const svc = makeService();
        const trend = svc.generateForecast('default', '日营收', 'monthly');
        strict_1.default.equal(typeof trend.id, 'string');
        strict_1.default.equal(trend.tenantId, 'default');
        strict_1.default.equal(trend.metric, '日营收');
        strict_1.default.ok(Array.isArray(trend.forecast));
        strict_1.default.equal(trend.forecast.length, 7, '预测应该是未来 7 天');
        for (const point of trend.forecast) {
            strict_1.default.match(point.date, /^\d{4}-\d{2}-\d{2}$/);
            strict_1.default.equal(typeof point.value, 'number');
        }
        strict_1.default.ok(trend.confidence >= 0 && trend.confidence <= 1, 'confidence ∈ [0, 1]');
    });
    (0, node_test_1.default)('DashboardSummary 三周期完整', () => {
        const svc = makeService();
        const summary = svc.getDashboardSummary('default');
        strict_1.default.equal(summary.tenantId, 'default');
        for (const period of [summary.today, summary.thisWeek, summary.thisMonth]) {
            strict_1.default.equal(typeof period.label, 'string');
            strict_1.default.match(period.start, /^\d{4}-\d{2}-\d{2}$/);
            strict_1.default.match(period.end, /^\d{4}-\d{2}-\d{2}$/);
            strict_1.default.equal(typeof period.revenue, 'number');
            strict_1.default.equal(typeof period.members, 'number');
            strict_1.default.equal(typeof period.attendance, 'number');
            strict_1.default.equal(typeof period.games, 'number');
            strict_1.default.ok(Array.isArray(period.kpis));
            strict_1.default.ok(period.kpis.length <= 5, 'Top 5 KPIs');
            strict_1.default.equal(typeof period.yoyPercent, 'number');
        }
        strict_1.default.equal(typeof summary.activeAnomalies, 'number');
        strict_1.default.equal(typeof summary.reportCount, 'number');
    });
});
// ─── 业务映射合约 ─────────────────────────────────────
(0, node_test_1.describe)('[ai-insight] 合约: typeToCategory 映射', () => {
    (0, node_test_1.default)('revenue → revenue', () => {
        const svc = makeService();
        const report = svc.generateReport('default', undefined, 'revenue', '2026-06-01', '2026-06-07');
        strict_1.default.ok(Object.keys(report.data.metrics).length > 0);
    });
    (0, node_test_1.default)('member → member', () => {
        const svc = makeService();
        const report = svc.generateReport('default', undefined, 'member', '2026-06-01', '2026-06-07');
        for (const item of report.data.trends) {
            strict_1.default.ok(typeof item.name === 'string');
        }
    });
    (0, node_test_1.default)('kpi → 全 5 类', () => {
        const svc = makeService();
        const report = svc.generateReport('default', undefined, 'kpi', '2026-06-01', '2026-06-07');
        // 综合报告应包含 ≥ 4 个 metric(覆盖多类别)
        strict_1.default.ok(Object.keys(report.data.metrics).length >= 4);
    });
    (0, node_test_1.default)('attendance → attendance', () => {
        const svc = makeService();
        const report = svc.generateReport('default', undefined, 'attendance', '2026-06-01', '2026-06-07');
        strict_1.default.ok(report.title.includes('到店'));
    });
    (0, node_test_1.default)('game → game', () => {
        const svc = makeService();
        const report = svc.generateReport('default', undefined, 'game', '2026-06-01', '2026-06-07');
        strict_1.default.ok(report.title.includes('游戏'));
    });
});
// ─── 状态机合约 ───────────────────────────────────────
(0, node_test_1.describe)('[ai-insight] 合约: 异常状态机', () => {
    (0, node_test_1.default)('open → acknowledged 合法', () => {
        const svc = makeService();
        const anomalies = svc.getAnomalies('default', { status: 'open' });
        if (anomalies.length > 0) {
            const a = svc.acknowledgeAnomaly(anomalies[0].id);
            strict_1.default.equal(a?.status, 'acknowledged');
        }
    });
    (0, node_test_1.default)('acknowledged → resolved 合法', () => {
        const svc = makeService();
        const anomalies = svc.getAnomalies('default', { status: 'acknowledged' });
        if (anomalies.length > 0) {
            const a = svc.resolveAnomaly(anomalies[0].id);
            strict_1.default.equal(a?.status, 'resolved');
            strict_1.default.ok(a?.resolvedAt);
        }
    });
    (0, node_test_1.default)('resolved 不可再 resolve', () => {
        const svc = makeService();
        const anomalies = svc.getAnomalies('default', { status: 'resolved' });
        if (anomalies.length > 0) {
            const a = svc.resolveAnomaly(anomalies[0].id);
            // 状态保持 resolved
            strict_1.default.equal(a?.status, 'resolved');
        }
    });
    (0, node_test_1.default)('不存在的 anomaly 返回 undefined', () => {
        const svc = makeService();
        const a = svc.acknowledgeAnomaly('non-existent-id');
        strict_1.default.equal(a, undefined);
    });
});
// ─── 报告列表合约 ─────────────────────────────────────
(0, node_test_1.describe)('[ai-insight] 合约: 报告列表过滤', () => {
    (0, node_test_1.default)('limit 限制返回数量', () => {
        const svc = makeService();
        // 先生成 3 份报告
        svc.generateReport('default', 'store-01', 'revenue', '2026-06-01', '2026-06-07');
        svc.generateReport('default', 'store-02', 'member', '2026-06-01', '2026-06-07');
        svc.generateReport('default', 'store-03', 'attendance', '2026-06-01', '2026-06-07');
        const reports = svc.getReports('default', { limit: 2 });
        strict_1.default.equal(reports.length, 2);
    });
    (0, node_test_1.default)('type 过滤报告', () => {
        const svc = makeService();
        svc.generateReport('default', undefined, 'revenue', '2026-06-01', '2026-06-07');
        svc.generateReport('default', undefined, 'member', '2026-06-01', '2026-06-07');
        const revenues = svc.getReports('default', { type: 'revenue' });
        for (const r of revenues)
            strict_1.default.equal(r.type, 'revenue');
    });
    (0, node_test_1.default)('跨租户报告隔离', () => {
        const svc = makeService();
        svc.generateReport('tenant-A', undefined, 'revenue', '2026-06-01', '2026-06-07');
        svc.generateReport('tenant-B', undefined, 'revenue', '2026-06-01', '2026-06-07');
        const aReports = svc.getReports('tenant-A');
        const bReports = svc.getReports('tenant-B');
        strict_1.default.ok(aReports.every((r) => r.tenantId === 'tenant-A'));
        strict_1.default.ok(bReports.every((r) => r.tenantId === 'tenant-B'));
    });
    (0, node_test_1.default)('storeId 过滤报告', () => {
        const svc = makeService();
        svc.generateReport('default', 'store-01', 'revenue', '2026-06-01', '2026-06-07');
        svc.generateReport('default', 'store-02', 'revenue', '2026-06-01', '2026-06-07');
        const s1 = svc.getReports('default', { storeId: 'store-01' });
        for (const r of s1)
            strict_1.default.equal(r.storeId, 'store-01');
    });
});
// ─── KPI 查询合约 ─────────────────────────────────────
(0, node_test_1.describe)('[ai-insight] 合约: KPI 过滤', () => {
    (0, node_test_1.default)('category 过滤 KPI', () => {
        const svc = makeService();
        const revenueKPIs = svc.getKPIs('default', undefined, 'revenue');
        strict_1.default.ok(revenueKPIs.every((k) => k.category === 'revenue'));
        strict_1.default.ok(revenueKPIs.length > 0, 'seed 应预置 revenue KPI');
    });
    (0, node_test_1.default)('storeId 过滤 KPI', () => {
        const svc = makeService();
        const s1 = svc.getKPIs('default', 'store-01');
        strict_1.default.ok(s1.every((k) => k.storeId === 'store-01' || k.storeId === undefined));
    });
    (0, node_test_1.default)('getKPIDetail 找不到返回 undefined', () => {
        const svc = makeService();
        const k = svc.getKPIDetail('non-existent-kpi');
        strict_1.default.equal(k, undefined);
    });
    (0, node_test_1.default)('getKPIDetail 找到返回 KPI', () => {
        const svc = makeService();
        const kpis = svc.getKPIs('default');
        const k = svc.getKPIDetail(kpis[0].id);
        strict_1.default.ok(k);
        strict_1.default.equal(k?.id, kpis[0].id);
    });
});
// ─── 预测合约 ─────────────────────────────────────────
(0, node_test_1.describe)('[ai-insight] 合约: 预测', () => {
    (0, node_test_1.default)('空历史数据生成 7 天默认预测', () => {
        const svc = makeService();
        const trend = svc.generateForecast('empty-tenant', '日营收', 'monthly');
        strict_1.default.equal(trend.forecast.length, 7);
        strict_1.default.ok(trend.confidence >= 0 && trend.confidence <= 1);
    });
    (0, node_test_1.default)('getForecast 通过 id 找到', () => {
        const svc = makeService();
        const created = svc.generateForecast('default', '日营收', 'monthly');
        const found = svc.getForecast(created.id);
        strict_1.default.ok(found);
        strict_1.default.equal(found?.id, created.id);
    });
    (0, node_test_1.default)('getForecast 找不到返回 undefined', () => {
        const svc = makeService();
        const t = svc.getForecast('non-existent-trend');
        strict_1.default.equal(t, undefined);
    });
});
// ─── 异常检测合约 ─────────────────────────────────────
(0, node_test_1.describe)('[ai-insight] 合约: detectAnomalies', () => {
    (0, node_test_1.default)('无 metric 参数时检测所有 metric', () => {
        const svc = makeService();
        const detected = svc.detectAnomalies('default');
        strict_1.default.ok(Array.isArray(detected));
    });
    (0, node_test_1.default)('指定 metric 只检测该指标', () => {
        const svc = makeService();
        const detected = svc.detectAnomalies('default', undefined, '日营收');
        if (detected.length > 0) {
            for (const d of detected) {
                strict_1.default.equal(d.metric, '日营收');
            }
        }
    });
    (0, node_test_1.default)('severity 字段 ∈ {low, medium, high, critical}', () => {
        const svc = makeService();
        const detected = svc.detectAnomalies('default');
        const validSeverities = ['low', 'medium', 'high', 'critical'];
        for (const d of detected) {
            strict_1.default.ok(validSeverities.includes(d.severity));
        }
    });
    (0, node_test_1.default)('severity 过滤异常', () => {
        const svc = makeService();
        const criticals = svc.getAnomalies('default', { severity: 'critical' });
        strict_1.default.ok(criticals.every((a) => a.severity === 'critical'));
    });
    (0, node_test_1.default)('status 过滤异常', () => {
        const svc = makeService();
        const opens = svc.getAnomalies('default', { status: 'open' });
        strict_1.default.ok(opens.every((a) => a.status === 'open'));
    });
});
//# sourceMappingURL=ai-insight.contract.test.js.map