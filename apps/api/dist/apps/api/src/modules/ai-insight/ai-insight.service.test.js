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
/**
 * 🐜 自动: [ai-insight] [D] service 测试
 * AiInsightService 单元测试：KPI看板、洞察报告、异常检测、趋势预测、仪表盘
 */
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const ai_insight_service_1 = require("./ai-insight.service");
const TENANT_ID = 'default';
const STORE_ID = 'store-01';
function createService() {
    return new ai_insight_service_1.AiInsightService();
}
// ── KPI 看板 ──
(0, node_test_1.describe)('AiInsightService: KPI', () => {
    (0, node_test_1.default)('getKPIs returns KPIs for tenant', () => {
        const service = createService();
        const kpis = service.getKPIs(TENANT_ID);
        strict_1.default.ok(Array.isArray(kpis));
        strict_1.default.ok(kpis.length > 0, 'seed data should provide KPIs');
    });
    (0, node_test_1.default)('getKPIs filters by storeId', () => {
        const service = createService();
        const all = service.getKPIs(TENANT_ID);
        const filtered = service.getKPIs(TENANT_ID, STORE_ID);
        // 按store过滤后的数量应 ≤ 总数
        strict_1.default.ok(filtered.length > 0);
        strict_1.default.ok(filtered.length <= all.length);
        for (const kpi of filtered) {
            // 每个KPI要么匹配storeId要么没有storeId
            strict_1.default.ok(!kpi.storeId || kpi.storeId === STORE_ID, `KPI ${kpi.id} storeId=${kpi.storeId} should match ${STORE_ID}`);
        }
    });
    (0, node_test_1.default)('getKPIs filters by category', () => {
        const service = createService();
        const revenueKPIs = service.getKPIs(TENANT_ID, undefined, 'revenue');
        strict_1.default.ok(revenueKPIs.length > 0);
        for (const kpi of revenueKPIs) {
            strict_1.default.equal(kpi.category, 'revenue');
        }
    });
    (0, node_test_1.default)('getKPIs combines storeId and category filters', () => {
        const service = createService();
        const result = service.getKPIs(TENANT_ID, STORE_ID, 'game');
        strict_1.default.ok(result.length > 0);
        for (const kpi of result) {
            strict_1.default.equal(kpi.category, 'game');
            strict_1.default.ok(!kpi.storeId || kpi.storeId === STORE_ID);
        }
    });
    (0, node_test_1.default)('getKPIDetail returns KPI by id', () => {
        const service = createService();
        const kpis = service.getKPIs(TENANT_ID);
        const first = kpis[0];
        const detail = service.getKPIDetail(first.id);
        strict_1.default.ok(detail);
        strict_1.default.equal(detail.id, first.id);
    });
    (0, node_test_1.default)('getKPIDetail returns undefined for non-existent id', () => {
        const service = createService();
        const result = service.getKPIDetail('non-existent-id');
        strict_1.default.equal(result, undefined);
    });
    (0, node_test_1.default)('KPIs have correct structure', () => {
        const service = createService();
        const kpis = service.getKPIs(TENANT_ID);
        for (const kpi of kpis) {
            strict_1.default.ok(kpi.id, 'should have id');
            strict_1.default.ok(kpi.name, 'should have name');
            strict_1.default.ok(typeof kpi.value === 'number', 'value should be number');
            strict_1.default.ok(typeof kpi.target === 'number', 'target should be number');
            strict_1.default.ok(kpi.unit, 'should have unit');
            strict_1.default.ok(['up', 'down', 'stable'].includes(kpi.trend), 'trend should be valid');
            strict_1.default.ok(['revenue', 'member', 'attendance', 'game', 'operation'].includes(kpi.category), 'category should be valid');
        }
    });
});
// ── 洞察报告 ──
(0, node_test_1.describe)('AiInsightService: Reports', () => {
    (0, node_test_1.default)('generateReport creates a report with correct type', () => {
        const service = createService();
        const report = service.generateReport(TENANT_ID, STORE_ID, 'revenue', '2026-06-01', '2026-06-07');
        strict_1.default.equal(report.type, 'revenue');
        strict_1.default.equal(report.tenantId, TENANT_ID);
        strict_1.default.equal(report.storeId, STORE_ID);
        strict_1.default.equal(report.periodStart, '2026-06-01');
        strict_1.default.equal(report.periodEnd, '2026-06-07');
        strict_1.default.ok(report.id.startsWith('report-'));
        strict_1.default.ok(report.summary.length > 0);
    });
    (0, node_test_1.default)('generateReport includes data with metrics, trends, anomalies', () => {
        const service = createService();
        const report = service.generateReport(TENANT_ID, undefined, 'kpi', '2026-06-01', '2026-06-07');
        strict_1.default.ok(report.data.metrics);
        strict_1.default.ok(Array.isArray(report.data.trends));
        strict_1.default.ok(Array.isArray(report.data.anomalies));
        // KPI report covers all categories
        strict_1.default.ok(Object.keys(report.data.metrics).length > 0);
    });
    (0, node_test_1.default)('generateReport generates summary text', () => {
        const service = createService();
        const report = service.generateReport(TENANT_ID, STORE_ID, 'revenue', '2026-06-01', '2026-06-07');
        strict_1.default.ok(report.summary.includes('指标'), 'summary should mention metrics');
        strict_1.default.ok(report.summary.endsWith('。'), 'summary should end with Chinese period');
    });
    (0, node_test_1.default)('getReports returns generated reports', () => {
        const service = createService();
        // 生成报告
        service.generateReport(TENANT_ID, STORE_ID, 'revenue', '2026-06-01', '2026-06-07');
        service.generateReport(TENANT_ID, STORE_ID, 'member', '2026-06-01', '2026-06-07');
        const reports = service.getReports(TENANT_ID);
        strict_1.default.ok(reports.length >= 2);
    });
    (0, node_test_1.default)('getReports sorts by generatedAt descending', () => {
        const service = createService();
        service.generateReport(TENANT_ID, STORE_ID, 'revenue', '2026-06-01', '2026-06-07');
        service.generateReport(TENANT_ID, STORE_ID, 'member', '2026-06-01', '2026-06-07');
        const reports = service.getReports(TENANT_ID);
        for (let i = 1; i < reports.length; i++) {
            strict_1.default.ok(new Date(reports[i - 1].generatedAt).getTime() >=
                new Date(reports[i].generatedAt).getTime(), 'reports should be sorted desc by generatedAt');
        }
    });
    (0, node_test_1.default)('getReports filters by type', () => {
        const service = createService();
        service.generateReport(TENANT_ID, STORE_ID, 'revenue', '2026-06-01', '2026-06-07');
        service.generateReport(TENANT_ID, STORE_ID, 'member', '2026-06-01', '2026-06-07');
        const revenueReports = service.getReports(TENANT_ID, { type: 'revenue' });
        for (const r of revenueReports) {
            strict_1.default.equal(r.type, 'revenue');
        }
    });
    (0, node_test_1.default)('getReports applies limit', () => {
        const service = createService();
        service.generateReport(TENANT_ID, STORE_ID, 'revenue', '2026-06-01', '2026-06-07');
        service.generateReport(TENANT_ID, STORE_ID, 'member', '2026-06-01', '2026-06-07');
        service.generateReport(TENANT_ID, STORE_ID, 'game', '2026-06-01', '2026-06-07');
        const reports = service.getReports(TENANT_ID, { limit: 2 });
        strict_1.default.ok(reports.length <= 2);
    });
    (0, node_test_1.default)('getReports returns empty for unknown tenant', () => {
        const service = createService();
        const reports = service.getReports('unknown-tenant');
        strict_1.default.deepEqual(reports, []);
    });
});
// ── 异常检测 ──
(0, node_test_1.describe)('AiInsightService: Anomalies', () => {
    (0, node_test_1.default)('getAnomalies returns seed anomalies', () => {
        const service = createService();
        const anomalies = service.getAnomalies(TENANT_ID);
        strict_1.default.ok(anomalies.length > 0, 'seed data should have anomalies');
        // 验证已初始化的3条异常
        strict_1.default.ok(anomalies.length >= 3);
    });
    (0, node_test_1.default)('getAnomalies filters by status', () => {
        const service = createService();
        const open = service.getAnomalies(TENANT_ID, { status: 'open' });
        const resolved = service.getAnomalies(TENANT_ID, { status: 'resolved' });
        for (const a of open) {
            strict_1.default.equal(a.status, 'open');
        }
        for (const a of resolved) {
            strict_1.default.equal(a.status, 'resolved');
        }
    });
    (0, node_test_1.default)('getAnomalies filters by severity', () => {
        const service = createService();
        const high = service.getAnomalies(TENANT_ID, { severity: 'high' });
        for (const a of high) {
            strict_1.default.equal(a.severity, 'high');
        }
    });
    (0, node_test_1.default)('getAnomalies applies limit', () => {
        const service = createService();
        const result = service.getAnomalies(TENANT_ID, { limit: 1 });
        strict_1.default.ok(result.length <= 1);
    });
    (0, node_test_1.default)('acknowledgeAnomaly transitions open to acknowledged', () => {
        const service = createService();
        const anomalies = service.getAnomalies(TENANT_ID, { status: 'open' });
        strict_1.default.ok(anomalies.length > 0, 'should have open anomalies');
        const result = service.acknowledgeAnomaly(anomalies[0].id);
        strict_1.default.ok(result);
        strict_1.default.equal(result.status, 'acknowledged');
    });
    (0, node_test_1.default)('acknowledgeAnomaly returns undefined for non-existent', () => {
        const service = createService();
        const result = service.acknowledgeAnomaly('no-such-id');
        strict_1.default.equal(result, undefined);
    });
    (0, node_test_1.default)('resolveAnomaly transitions to resolved with resolvedAt', () => {
        const service = createService();
        const anomalies = service.getAnomalies(TENANT_ID, { status: 'open' });
        strict_1.default.ok(anomalies.length > 0);
        const result = service.resolveAnomaly(anomalies[0].id);
        strict_1.default.ok(result);
        strict_1.default.equal(result.status, 'resolved');
        strict_1.default.ok(result.resolvedAt, 'should set resolvedAt');
    });
    (0, node_test_1.default)('resolveAnomaly can resolve acknowledged anomalies too', () => {
        const service = createService();
        const acked = service.getAnomalies(TENANT_ID, { status: 'acknowledged' });
        if (acked.length > 0) {
            const result = service.resolveAnomaly(acked[0].id);
            strict_1.default.ok(result);
            strict_1.default.equal(result.status, 'resolved');
        }
    });
    (0, node_test_1.default)('detectAnomalies performs 3-sigma detection', () => {
        const service = createService();
        const detected = service.detectAnomalies(TENANT_ID, STORE_ID);
        strict_1.default.ok(Array.isArray(detected), 'should return array');
        // 每个新检测到的异常都有正确结构
        for (const a of detected) {
            strict_1.default.ok(a.id, 'should have id');
            strict_1.default.ok(a.metric, 'should have metric');
            strict_1.default.ok(typeof a.value === 'number');
            strict_1.default.ok(typeof a.expectedValue === 'number');
            strict_1.default.ok(typeof a.deviationPercent === 'number');
            strict_1.default.ok(['low', 'medium', 'high', 'critical'].includes(a.severity));
            strict_1.default.ok(['open', 'acknowledged', 'resolved'].includes(a.status));
        }
    });
    (0, node_test_1.default)('detectAnomalies filters by metric', () => {
        const service = createService();
        const detected = service.detectAnomalies(TENANT_ID, undefined, '日营收');
        // 如果有足够的数据点进行标准差计算
        if (detected.length > 0) {
            for (const a of detected) {
                strict_1.default.equal(a.metric, '日营收');
            }
        }
    });
    (0, node_test_1.default)('getAnomalies filters by storeId', () => {
        const service = createService();
        const result = service.getAnomalies(TENANT_ID, { storeId: STORE_ID });
        for (const a of result) {
            strict_1.default.ok(!a.storeId || a.storeId === STORE_ID);
        }
    });
    (0, node_test_1.default)('getAnomalies returns empty for unknown tenant', () => {
        const service = createService();
        const result = service.getAnomalies('unknown');
        strict_1.default.deepEqual(result, []);
    });
});
// ── 趋势预测 ──
(0, node_test_1.describe)('AiInsightService: Forecasts', () => {
    (0, node_test_1.default)('generateForecast creates trend with forecast points', () => {
        const service = createService();
        const trend = service.generateForecast(TENANT_ID, '日营收', 'week');
        strict_1.default.ok(trend.id.startsWith('trend-'));
        strict_1.default.equal(trend.metric, '日营收');
        strict_1.default.ok(Array.isArray(trend.forecast));
        strict_1.default.ok(trend.forecast.length > 0, 'should have forecast points');
        strict_1.default.ok(trend.confidence >= 0 && trend.confidence <= 1);
        strict_1.default.ok(trend.generatedAt);
    });
    (0, node_test_1.default)('generateForecast creates sequential forecast dates', () => {
        const service = createService();
        const trend = service.generateForecast(TENANT_ID, '日营收', 'week');
        for (const point of trend.forecast) {
            strict_1.default.ok(point.date, 'each point should have date');
            strict_1.default.ok(typeof point.value === 'number', 'each point should have numeric value');
            // date should be ISO date format
            strict_1.default.ok(/^\d{4}-\d{2}-\d{2}$/.test(point.date), 'date should be YYYY-MM-DD');
        }
    });
    (0, node_test_1.default)('generateForecast handles unknown metric with low confidence', () => {
        const service = createService();
        const trend = service.generateForecast(TENANT_ID, 'unknown_metric', 'week');
        strict_1.default.ok(trend.forecast.length > 0);
        // 未知指标应有较低置信度
        strict_1.default.ok(trend.confidence <= 0.5, `confidence ${trend.confidence} should be low for unknown metric`);
    });
    (0, node_test_1.default)('getForecast returns existing trend', () => {
        const service = createService();
        const created = service.generateForecast(TENANT_ID, '日营收', 'week');
        const fetched = service.getForecast(created.id);
        strict_1.default.ok(fetched);
        strict_1.default.equal(fetched.id, created.id);
        strict_1.default.equal(fetched.metric, created.metric);
        strict_1.default.equal(fetched.confidence, created.confidence);
    });
    (0, node_test_1.default)('getForecast returns undefined for non-existent', () => {
        const service = createService();
        const result = service.getForecast('no-such-id');
        strict_1.default.equal(result, undefined);
    });
    (0, node_test_1.default)('multiple forecasts for same metric create distinct trends', () => {
        const service = createService();
        const t1 = service.generateForecast(TENANT_ID, '日营收', 'week');
        const t2 = service.generateForecast(TENANT_ID, '日营收', 'week');
        strict_1.default.notEqual(t1.id, t2.id, 'each forecast should have unique id');
    });
});
// ── 仪表盘 ──
(0, node_test_1.describe)('AiInsightService: Dashboard', () => {
    (0, node_test_1.default)('getDashboardSummary returns summary with all periods', () => {
        const service = createService();
        const dashboard = service.getDashboardSummary(TENANT_ID, STORE_ID);
        strict_1.default.equal(dashboard.tenantId, TENANT_ID);
        strict_1.default.equal(dashboard.storeId, STORE_ID);
        // 三个周期
        strict_1.default.ok(dashboard.today);
        strict_1.default.ok(dashboard.thisWeek);
        strict_1.default.ok(dashboard.thisMonth);
        // 周期结构
        for (const period of [dashboard.today, dashboard.thisWeek, dashboard.thisMonth]) {
            strict_1.default.ok(period.label);
            strict_1.default.ok(period.start);
            strict_1.default.ok(period.end);
            strict_1.default.ok(typeof period.revenue === 'number');
            strict_1.default.ok(typeof period.members === 'number');
            strict_1.default.ok(typeof period.attendance === 'number');
            strict_1.default.ok(typeof period.games === 'number');
            strict_1.default.ok(Array.isArray(period.kpis));
            strict_1.default.ok(typeof period.yoyPercent === 'number');
        }
    });
    (0, node_test_1.default)('getDashboardSummary includes active anomalies count', () => {
        const service = createService();
        const dashboard = service.getDashboardSummary(TENANT_ID);
        strict_1.default.ok(typeof dashboard.activeAnomalies === 'number');
        strict_1.default.ok(dashboard.activeAnomalies >= 0);
    });
    (0, node_test_1.default)('getDashboardSummary includes report count', () => {
        const service = createService();
        // 生成一些报告
        service.generateReport(TENANT_ID, STORE_ID, 'revenue', '2026-06-01', '2026-06-07');
        service.generateReport(TENANT_ID, STORE_ID, 'member', '2026-06-01', '2026-06-07');
        const dashboard = service.getDashboardSummary(TENANT_ID);
        strict_1.default.ok(dashboard.reportCount >= 2);
    });
    (0, node_test_1.default)('getDashboardSummary without storeId returns all data', () => {
        const service = createService();
        const dashboard = service.getDashboardSummary(TENANT_ID);
        strict_1.default.equal(dashboard.storeId, undefined);
        strict_1.default.ok(dashboard.today);
    });
    (0, node_test_1.default)('getDashboardSummary KPIs are limited to top 5', () => {
        const service = createService();
        const dashboard = service.getDashboardSummary(TENANT_ID, STORE_ID);
        // 每个周期最多5个KPI
        strict_1.default.ok(dashboard.today.kpis.length <= 5);
        strict_1.default.ok(dashboard.thisWeek.kpis.length <= 5);
        strict_1.default.ok(dashboard.thisMonth.kpis.length <= 5);
    });
    (0, node_test_1.default)('getDashboardSummary yoyPercent is within reasonable range', () => {
        const service = createService();
        const dashboard = service.getDashboardSummary(TENANT_ID, STORE_ID);
        // yoyPercent 应该在 -10 ~ +30 之间 (基于 simulateYoyPercent)
        strict_1.default.ok(dashboard.today.yoyPercent >= -10 && dashboard.today.yoyPercent <= 30, `yoyPercent ${dashboard.today.yoyPercent} should be in -10..30`);
    });
});
// ── 集成流程测试 ──
(0, node_test_1.describe)('AiInsightService: Integration flows', () => {
    (0, node_test_1.default)('full workflow: KPI → report → anomaly → forecast → dashboard', () => {
        const service = createService();
        // 1. 查看KPI
        const kpis = service.getKPIs(TENANT_ID, STORE_ID, 'revenue');
        strict_1.default.ok(kpis.length > 0);
        // 2. 生成报告
        const report = service.generateReport(TENANT_ID, STORE_ID, 'revenue', '2026-06-01', '2026-06-07');
        strict_1.default.ok(report.data.trends.length > 0);
        // 3. 检测异常
        service.detectAnomalies(TENANT_ID, STORE_ID);
        // 4. 生成趋势预测
        const trend = service.generateForecast(TENANT_ID, '日营收', 'month');
        strict_1.default.ok(trend.forecast.length > 0);
        // 5. 获取仪表盘
        const dashboard = service.getDashboardSummary(TENANT_ID, STORE_ID);
        strict_1.default.ok(dashboard);
        // 确认报告和异常被仪表盘计入
        strict_1.default.ok(dashboard.reportCount >= 1);
        strict_1.default.ok(dashboard.activeAnomalies >= 0);
    });
    (0, node_test_1.default)('anomaly lifecycle: open → acknowledge → resolve', () => {
        const service = createService();
        const anomalies = service.getAnomalies(TENANT_ID, { status: 'open' });
        strict_1.default.ok(anomalies.length > 0, 'should have open anomalies');
        const anomalyId = anomalies[0].id;
        // acknowledge
        const acked = service.acknowledgeAnomaly(anomalyId);
        strict_1.default.equal(acked?.status, 'acknowledged');
        // resolve
        const resolved = service.resolveAnomaly(anomalyId);
        strict_1.default.equal(resolved?.status, 'resolved');
        strict_1.default.ok(resolved?.resolvedAt);
    });
    (0, node_test_1.default)('getKPIDetail works across all KPIs', () => {
        const service = createService();
        const all = service.getKPIs(TENANT_ID);
        for (const kpi of all) {
            const detail = service.getKPIDetail(kpi.id);
            strict_1.default.ok(detail);
            strict_1.default.equal(detail.id, kpi.id);
            strict_1.default.equal(detail.name, kpi.name);
            strict_1.default.equal(detail.value, kpi.value);
        }
    });
});
//# sourceMappingURL=ai-insight.service.test.js.map