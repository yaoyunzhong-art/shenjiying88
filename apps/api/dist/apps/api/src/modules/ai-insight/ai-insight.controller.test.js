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
 * 🐜 自动: [ai-insight] [D] controller 测试
 * AiInsightController 单元测试：正例 + 反例 + 边界
 */
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const ai_insight_controller_1 = require("./ai-insight.controller");
const ai_insight_service_1 = require("./ai-insight.service");
const TENANT_ID = 'default';
const STORE_ID = 'store-01';
function createController() {
    const service = new ai_insight_service_1.AiInsightService();
    return new ai_insight_controller_1.AiInsightController(service);
}
// ── KPI 看板 ──
(0, node_test_1.describe)('AiInsightController: KPI endpoints', () => {
    (0, node_test_1.default)('GET /kpis returns KPI list', () => {
        const ctrl = createController();
        const result = ctrl.getKPIs(TENANT_ID, { storeId: STORE_ID, category: 'revenue' });
        strict_1.default.ok(Array.isArray(result));
        strict_1.default.ok(result.length > 0);
        for (const kpi of result) {
            strict_1.default.equal(kpi.category, 'revenue');
        }
    });
    (0, node_test_1.default)('GET /kpis with no category returns all', () => {
        const ctrl = createController();
        const result = ctrl.getKPIs(TENANT_ID, {});
        strict_1.default.ok(result.length > 0);
    });
    (0, node_test_1.default)('GET /kpis with category=operation', () => {
        const ctrl = createController();
        const result = ctrl.getKPIs(TENANT_ID, { category: 'operation' });
        for (const kpi of result) {
            strict_1.default.equal(kpi.category, 'operation');
        }
    });
    (0, node_test_1.default)('GET /kpis/:kpiId returns KPI detail', () => {
        const ctrl = createController();
        const kpis = ctrl.getKPIs(TENANT_ID, {});
        const result = ctrl.getKPIDetail(kpis[0].id);
        strict_1.default.ok(result);
        strict_1.default.equal(result.id, kpis[0].id);
    });
    (0, node_test_1.default)('GET /kpis/:kpiId returns undefined for non-existent', () => {
        const ctrl = createController();
        const result = ctrl.getKPIDetail('no-such-id');
        strict_1.default.equal(result, undefined);
    });
    (0, node_test_1.default)('GET /kpis with empty storeId returns all stores', () => {
        const ctrl = createController();
        const result = ctrl.getKPIs(TENANT_ID, {});
        // 至少应有 3 * 10 = 30 条 KPI（3个门店 × 10个指标）
        strict_1.default.ok(result.length >= 10, `expected >= 10, got ${result.length}`);
    });
});
// ── 洞察报告 ──
(0, node_test_1.describe)('AiInsightController: Report endpoints', () => {
    (0, node_test_1.default)('POST /reports generates report', () => {
        const ctrl = createController();
        const report = ctrl.generateReport(TENANT_ID, {
            type: 'revenue',
            storeId: STORE_ID,
            periodStart: '2026-06-01',
            periodEnd: '2026-06-07'
        });
        strict_1.default.equal(report.type, 'revenue');
        strict_1.default.equal(report.tenantId, TENANT_ID);
        strict_1.default.ok(report.id.startsWith('report-'));
        strict_1.default.ok(report.summary.length > 0);
    });
    (0, node_test_1.default)('POST /reports generates member report', () => {
        const ctrl = createController();
        const report = ctrl.generateReport(TENANT_ID, {
            type: 'member',
            periodStart: '2026-06-01',
            periodEnd: '2026-06-07'
        });
        strict_1.default.equal(report.type, 'member');
        strict_1.default.ok(report.data.metrics);
    });
    (0, node_test_1.default)('POST /reports generates all 5 types', () => {
        const ctrl = createController();
        const types = ['revenue', 'member', 'attendance', 'game', 'kpi'];
        for (const type of types) {
            const report = ctrl.generateReport(TENANT_ID, {
                type,
                periodStart: '2026-06-01',
                periodEnd: '2026-06-07'
            });
            strict_1.default.equal(report.type, type);
        }
    });
    (0, node_test_1.default)('GET /reports lists generated reports', () => {
        const ctrl = createController();
        ctrl.generateReport(TENANT_ID, {
            type: 'revenue',
            periodStart: '2026-06-01',
            periodEnd: '2026-06-07'
        });
        ctrl.generateReport(TENANT_ID, {
            type: 'member',
            periodStart: '2026-06-01',
            periodEnd: '2026-06-07'
        });
        const reports = ctrl.getReports(TENANT_ID, { limit: 10 });
        strict_1.default.ok(reports.length >= 2);
    });
    (0, node_test_1.default)('GET /reports filters by type', () => {
        const ctrl = createController();
        ctrl.generateReport(TENANT_ID, {
            type: 'revenue',
            periodStart: '2026-06-01',
            periodEnd: '2026-06-07'
        });
        ctrl.generateReport(TENANT_ID, {
            type: 'member',
            periodStart: '2026-06-01',
            periodEnd: '2026-06-07'
        });
        const revenueOnly = ctrl.getReports(TENANT_ID, { type: 'revenue', limit: 10 });
        for (const r of revenueOnly) {
            strict_1.default.equal(r.type, 'revenue');
        }
    });
    (0, node_test_1.default)('GET /reports with limit=1 returns at most 1', () => {
        const ctrl = createController();
        ctrl.generateReport(TENANT_ID, {
            type: 'kpi',
            periodStart: '2026-06-01',
            periodEnd: '2026-06-07'
        });
        const result = ctrl.getReports(TENANT_ID, { limit: 1 });
        strict_1.default.ok(result.length <= 1);
    });
});
// ── 异常检测 ──
(0, node_test_1.describe)('AiInsightController: Anomaly endpoints', () => {
    (0, node_test_1.default)('GET /anomalies lists anomalies', () => {
        const ctrl = createController();
        const result = ctrl.getAnomalies(TENANT_ID, { limit: 10 });
        strict_1.default.ok(Array.isArray(result));
        strict_1.default.ok(result.length > 0);
    });
    (0, node_test_1.default)('GET /anomalies filters by status=open', () => {
        const ctrl = createController();
        const result = ctrl.getAnomalies(TENANT_ID, { status: 'open' });
        for (const a of result) {
            strict_1.default.equal(a.status, 'open');
        }
    });
    (0, node_test_1.default)('GET /anomalies filters by severity=high', () => {
        const ctrl = createController();
        const result = ctrl.getAnomalies(TENANT_ID, { severity: 'high' });
        for (const a of result) {
            strict_1.default.equal(a.severity, 'high');
        }
    });
    (0, node_test_1.default)('GET /anomalies with limit', () => {
        const ctrl = createController();
        const result = ctrl.getAnomalies(TENANT_ID, { limit: 2 });
        strict_1.default.ok(result.length <= 2);
    });
    (0, node_test_1.default)('POST /anomalies/detect detects anomalies', () => {
        const ctrl = createController();
        const detected = ctrl.detectAnomalies(TENANT_ID, { storeId: STORE_ID });
        strict_1.default.ok(Array.isArray(detected));
        for (const a of detected) {
            strict_1.default.ok(a.id);
            strict_1.default.ok(['low', 'medium', 'high', 'critical'].includes(a.severity));
        }
    });
    (0, node_test_1.default)('PUT /anomalies/:id/acknowledge acknowledges anomaly', () => {
        const ctrl = createController();
        const anomalies = ctrl.getAnomalies(TENANT_ID, { status: 'open', limit: 10 });
        strict_1.default.ok(anomalies.length > 0);
        const result = ctrl.acknowledgeAnomaly(anomalies[0].id);
        strict_1.default.ok(result);
        strict_1.default.equal(result.status, 'acknowledged');
    });
    (0, node_test_1.default)('PUT /anomalies/:id/resolve resolves anomaly', () => {
        const ctrl = createController();
        const anomalies = ctrl.getAnomalies(TENANT_ID, { status: 'open', limit: 10 });
        if (anomalies.length > 0) {
            const result = ctrl.resolveAnomaly(anomalies[0].id, { anomalyId: anomalies[0].id });
            strict_1.default.ok(result);
            strict_1.default.equal(result.status, 'resolved');
            strict_1.default.ok(result.resolvedAt);
        }
    });
    (0, node_test_1.default)('acknowledge non-existent anomaly returns undefined', () => {
        const ctrl = createController();
        const result = ctrl.acknowledgeAnomaly('not-real');
        strict_1.default.equal(result, undefined);
    });
});
// ── 趋势预测 ──
(0, node_test_1.describe)('AiInsightController: Forecast endpoints', () => {
    (0, node_test_1.default)('POST /forecasts generates forecast', () => {
        const ctrl = createController();
        const trend = ctrl.generateForecast(TENANT_ID, { metric: '日营收', period: 'week' });
        strict_1.default.ok(trend.id);
        strict_1.default.equal(trend.metric, '日营收');
        strict_1.default.ok(trend.forecast.length > 0);
        strict_1.default.ok(trend.confidence >= 0 && trend.confidence <= 1);
    });
    (0, node_test_1.default)('POST /forecasts with different metrics', () => {
        const ctrl = createController();
        const metrics = ['日营收', '到店人数', '游戏局数'];
        for (const metric of metrics) {
            const trend = ctrl.generateForecast(TENANT_ID, { metric, period: 'month' });
            strict_1.default.equal(trend.metric, metric);
            strict_1.default.ok(trend.forecast.length > 0);
        }
    });
    (0, node_test_1.default)('GET /forecasts/:id retrieves forecast', () => {
        const ctrl = createController();
        const created = ctrl.generateForecast(TENANT_ID, { metric: '日营收', period: 'week' });
        const fetched = ctrl.getForecast(created.id);
        strict_1.default.ok(fetched);
        strict_1.default.equal(fetched.id, created.id);
        strict_1.default.equal(fetched.metric, '日营收');
    });
    (0, node_test_1.default)('GET /forecasts/:id returns undefined for non-existent', () => {
        const ctrl = createController();
        const result = ctrl.getForecast('invalid-id');
        strict_1.default.equal(result, undefined);
    });
});
// ── 仪表盘 ──
(0, node_test_1.describe)('AiInsightController: Dashboard endpoint', () => {
    (0, node_test_1.default)('GET /dashboard returns summary', () => {
        const ctrl = createController();
        const dashboard = ctrl.getDashboardSummary(TENANT_ID, { storeId: STORE_ID });
        strict_1.default.equal(dashboard.tenantId, TENANT_ID);
        strict_1.default.equal(dashboard.storeId, STORE_ID);
        strict_1.default.ok(dashboard.today);
        strict_1.default.ok(dashboard.thisWeek);
        strict_1.default.ok(dashboard.thisMonth);
        strict_1.default.ok(typeof dashboard.activeAnomalies === 'number');
        strict_1.default.ok(typeof dashboard.reportCount === 'number');
    });
    (0, node_test_1.default)('GET /dashboard without storeId returns tenant-level', () => {
        const ctrl = createController();
        const dashboard = ctrl.getDashboardSummary(TENANT_ID, {});
        strict_1.default.equal(dashboard.tenantId, TENANT_ID);
        strict_1.default.equal(dashboard.storeId, undefined);
    });
    (0, node_test_1.default)('GET /dashboard includes numeric values for all periods', () => {
        const ctrl = createController();
        const dashboard = ctrl.getDashboardSummary(TENANT_ID, { storeId: STORE_ID });
        for (const period of [dashboard.today, dashboard.thisWeek, dashboard.thisMonth]) {
            strict_1.default.ok(typeof period.revenue === 'number');
            strict_1.default.ok(typeof period.members === 'number');
            strict_1.default.ok(typeof period.attendance === 'number');
            strict_1.default.ok(typeof period.games === 'number');
            strict_1.default.ok(Array.isArray(period.kpis));
        }
    });
});
// ── 边界测试 ──
(0, node_test_1.describe)('AiInsightController: Edge cases', () => {
    (0, node_test_1.default)('handles empty storeId query', () => {
        const ctrl = createController();
        const result = ctrl.getKPIs(TENANT_ID, { storeId: undefined });
        strict_1.default.ok(result.length > 0);
    });
    (0, node_test_1.default)('handles empty category query', () => {
        const ctrl = createController();
        const result = ctrl.getKPIs(TENANT_ID, { category: undefined });
        strict_1.default.ok(result.length > 0);
    });
    (0, node_test_1.default)('handles generateReport without storeId', () => {
        const ctrl = createController();
        const report = ctrl.generateReport(TENANT_ID, {
            type: 'kpi',
            periodStart: '2026-06-01',
            periodEnd: '2026-06-07'
        });
        strict_1.default.equal(report.storeId, undefined);
        strict_1.default.ok(report.data.metrics);
    });
    (0, node_test_1.default)('handles large limit gracefully', () => {
        const ctrl = createController();
        const result = ctrl.getReports(TENANT_ID, { limit: 100 });
        strict_1.default.ok(Array.isArray(result));
    });
    (0, node_test_1.default)('multiple reports without data corruption', () => {
        const ctrl = createController();
        const r1 = ctrl.generateReport(TENANT_ID, {
            type: 'revenue',
            periodStart: '2026-01-01',
            periodEnd: '2026-01-07'
        });
        const r2 = ctrl.generateReport(TENANT_ID, {
            type: 'member',
            periodStart: '2026-02-01',
            periodEnd: '2026-02-07'
        });
        strict_1.default.notEqual(r1.id, r2.id);
        strict_1.default.notEqual(r1.type, r2.type);
        strict_1.default.notEqual(r1.periodStart, r2.periodStart);
    });
});
//# sourceMappingURL=ai-insight.controller.test.js.map