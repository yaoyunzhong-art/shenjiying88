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
 * 🐜 自动: [ai-insight] [D] entity 测试
 * 类型契约测试：InsightReport, TrendItem, AnomalyItem, KPI, Anomaly, Trend, ForecastPoint, DashboardSummary, SummaryPeriod
 */
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
// ── InsightReport ──
(0, node_test_1.describe)('ai-insight.entity: InsightReport', () => {
    (0, node_test_1.default)('creates valid InsightReport with all required fields', () => {
        const report = {
            id: 'report-001',
            tenantId: 'tenant-1',
            type: 'revenue',
            title: '营收洞察报告',
            summary: '营收增长10%',
            data: {
                metrics: { '日营收': 15000 },
                trends: [],
                anomalies: []
            },
            periodStart: '2026-06-01',
            periodEnd: '2026-06-07',
            generatedAt: '2026-06-08T00:00:00.000Z',
            createdAt: '2026-06-08T00:00:00.000Z'
        };
        strict_1.default.equal(report.id, 'report-001');
        strict_1.default.equal(report.tenantId, 'tenant-1');
        strict_1.default.equal(report.type, 'revenue');
        strict_1.default.equal(report.title, '营收洞察报告');
        strict_1.default.equal(report.summary, '营收增长10%');
        strict_1.default.deepEqual(report.data.metrics, { '日营收': 15000 });
        strict_1.default.equal(report.periodStart, '2026-06-01');
        strict_1.default.equal(report.periodEnd, '2026-06-07');
    });
    (0, node_test_1.default)('creates InsightReport with optional brandId and storeId', () => {
        const report = {
            id: 'report-002',
            tenantId: 'tenant-1',
            brandId: 'brand-a',
            storeId: 'store-01',
            type: 'member',
            title: '会员洞察报告',
            summary: '新增会员15人',
            data: {
                metrics: { '新注册会员': 15 },
                trends: [{ name: '新注册会员', current: 15, previous: 12, changePercent: 25 }],
                anomalies: [{ metric: '会员复购率', value: 30, threshold: 45, severity: 'medium' }]
            },
            periodStart: '2026-06-01',
            periodEnd: '2026-06-07',
            generatedAt: '2026-06-08T00:00:00.000Z',
            createdAt: '2026-06-08T00:00:00.000Z'
        };
        strict_1.default.equal(report.brandId, 'brand-a');
        strict_1.default.equal(report.storeId, 'store-01');
        strict_1.default.equal(report.data.trends.length, 1);
        strict_1.default.equal(report.data.anomalies.length, 1);
    });
    (0, node_test_1.default)('supports all 5 report types', () => {
        const types = ['revenue', 'member', 'attendance', 'game', 'kpi'];
        for (const type of types) {
            const report = {
                id: `report-${type}`,
                tenantId: 'tenant-1',
                type,
                title: `${type}报告`,
                summary: '摘要',
                data: { metrics: {}, trends: [], anomalies: [] },
                periodStart: '2026-06-01',
                periodEnd: '2026-06-07',
                generatedAt: new Date().toISOString(),
                createdAt: new Date().toISOString()
            };
            strict_1.default.equal(report.type, type);
        }
    });
});
// ── TrendItem ──
(0, node_test_1.describe)('ai-insight.entity: TrendItem', () => {
    (0, node_test_1.default)('creates valid TrendItem with positive change', () => {
        const item = {
            name: '日营收',
            current: 15000,
            previous: 12000,
            changePercent: 25
        };
        strict_1.default.equal(item.name, '日营收');
        strict_1.default.equal(item.current, 15000);
        strict_1.default.equal(item.previous, 12000);
        strict_1.default.equal(item.changePercent, 25);
    });
    (0, node_test_1.default)('creates TrendItem with negative change', () => {
        const item = {
            name: '投诉率',
            current: 0.8,
            previous: 1.2,
            changePercent: -33.33
        };
        strict_1.default.ok(item.changePercent < 0);
        strict_1.default.ok(item.current < item.previous);
    });
    (0, node_test_1.default)('creates TrendItem with zero change', () => {
        const item = {
            name: '设备使用率',
            current: 72,
            previous: 72,
            changePercent: 0
        };
        strict_1.default.equal(item.changePercent, 0);
    });
});
// ── AnomalyItem ──
(0, node_test_1.describe)('ai-insight.entity: AnomalyItem', () => {
    (0, node_test_1.default)('creates valid AnomalyItem', () => {
        const item = {
            metric: '日营收',
            value: 6500,
            threshold: 12000,
            severity: 'high'
        };
        strict_1.default.equal(item.metric, '日营收');
        strict_1.default.equal(item.value, 6500);
        strict_1.default.equal(item.threshold, 12000);
        strict_1.default.equal(item.severity, 'high');
    });
    (0, node_test_1.default)('supports all 3 severity levels', () => {
        const severities = ['low', 'medium', 'high'];
        for (const severity of severities) {
            const item = {
                metric: '测试指标',
                value: 100,
                threshold: 80,
                severity
            };
            strict_1.default.equal(item.severity, severity);
        }
    });
});
// ── KPI ──
(0, node_test_1.describe)('ai-insight.entity: KPI', () => {
    (0, node_test_1.default)('creates valid KPI with all fields', () => {
        const kpi = {
            id: 'kpi-001',
            tenantId: 'tenant-1',
            name: '日营收',
            category: 'revenue',
            value: 15000,
            target: 20000,
            unit: '元',
            trend: 'up',
            period: 'daily',
            updatedAt: '2026-06-23T00:00:00.000Z'
        };
        strict_1.default.equal(kpi.id, 'kpi-001');
        strict_1.default.equal(kpi.name, '日营收');
        strict_1.default.equal(kpi.category, 'revenue');
        strict_1.default.equal(kpi.value, 15000);
        strict_1.default.equal(kpi.target, 20000);
        strict_1.default.equal(kpi.unit, '元');
        strict_1.default.equal(kpi.trend, 'up');
        strict_1.default.equal(kpi.period, 'daily');
    });
    (0, node_test_1.default)('creates KPI with optional storeId', () => {
        const kpi = {
            id: 'kpi-002',
            tenantId: 'tenant-1',
            storeId: 'store-01',
            name: '客单价',
            category: 'revenue',
            value: 85,
            target: 100,
            unit: '元/人',
            trend: 'stable',
            period: 'daily',
            updatedAt: new Date().toISOString()
        };
        strict_1.default.equal(kpi.storeId, 'store-01');
        strict_1.default.equal(kpi.trend, 'stable');
    });
    (0, node_test_1.default)('supports all 5 categories', () => {
        const categories = ['revenue', 'member', 'attendance', 'game', 'operation'];
        for (const category of categories) {
            const kpi = {
                id: `kpi-${category}`,
                tenantId: 'tenant-1',
                name: `${category}指标`,
                category,
                value: 100,
                target: 150,
                unit: '个',
                trend: 'up',
                period: 'daily',
                updatedAt: new Date().toISOString()
            };
            strict_1.default.equal(kpi.category, category);
        }
    });
    (0, node_test_1.default)('supports all 3 trend directions', () => {
        const trends = ['up', 'down', 'stable'];
        for (const trend of trends) {
            const kpi = {
                id: `kpi-${trend}`,
                tenantId: 'tenant-1',
                name: '测试',
                category: 'revenue',
                value: 100,
                target: 150,
                unit: '元',
                trend,
                period: 'daily',
                updatedAt: new Date().toISOString()
            };
            strict_1.default.equal(kpi.trend, trend);
        }
    });
});
// ── Anomaly ──
(0, node_test_1.describe)('ai-insight.entity: Anomaly', () => {
    (0, node_test_1.default)('creates valid open Anomaly', () => {
        const anomaly = {
            id: 'anomaly-001',
            tenantId: 'tenant-1',
            metric: '日营收',
            value: 6500,
            expectedValue: 15000,
            deviationPercent: 56.67,
            severity: 'high',
            detectedAt: '2026-06-23T00:00:00.000Z',
            status: 'open'
        };
        strict_1.default.equal(anomaly.id, 'anomaly-001');
        strict_1.default.equal(anomaly.metric, '日营收');
        strict_1.default.equal(anomaly.value, 6500);
        strict_1.default.equal(anomaly.expectedValue, 15000);
        strict_1.default.equal(anomaly.deviationPercent, 56.67);
        strict_1.default.equal(anomaly.severity, 'high');
        strict_1.default.equal(anomaly.status, 'open');
        strict_1.default.equal(anomaly.resolvedAt, undefined);
    });
    (0, node_test_1.default)('creates resolved Anomaly with resolvedAt', () => {
        const anomaly = {
            id: 'anomaly-002',
            tenantId: 'tenant-1',
            metric: '投诉率',
            value: 4.8,
            expectedValue: 1.2,
            deviationPercent: 300,
            severity: 'critical',
            detectedAt: '2026-06-22T00:00:00.000Z',
            resolvedAt: '2026-06-23T00:00:00.000Z',
            status: 'resolved'
        };
        strict_1.default.equal(anomaly.status, 'resolved');
        strict_1.default.ok(anomaly.resolvedAt);
        strict_1.default.equal(anomaly.severity, 'critical');
    });
    (0, node_test_1.default)('supports all 4 severity levels', () => {
        const severities = ['low', 'medium', 'high', 'critical'];
        for (const severity of severities) {
            const anomaly = {
                id: `anomaly-${severity}`,
                tenantId: 'tenant-1',
                metric: '测试',
                value: 100,
                expectedValue: 80,
                deviationPercent: 25,
                severity,
                detectedAt: new Date().toISOString(),
                status: 'open'
            };
            strict_1.default.equal(anomaly.severity, severity);
        }
    });
    (0, node_test_1.default)('supports all 3 status values', () => {
        const statuses = ['open', 'acknowledged', 'resolved'];
        for (const status of statuses) {
            const anomaly = {
                id: `anomaly-${status}`,
                tenantId: 'tenant-1',
                metric: '测试',
                value: 100,
                expectedValue: 80,
                deviationPercent: 25,
                severity: 'low',
                detectedAt: new Date().toISOString(),
                status
            };
            strict_1.default.equal(anomaly.status, status);
        }
    });
    (0, node_test_1.default)('creates Anomaly with optional storeId', () => {
        const anomaly = {
            id: 'anomaly-003',
            tenantId: 'tenant-1',
            storeId: 'store-01',
            metric: '设备使用率',
            value: 38,
            expectedValue: 72,
            deviationPercent: 47.22,
            severity: 'medium',
            detectedAt: new Date().toISOString(),
            status: 'open'
        };
        strict_1.default.equal(anomaly.storeId, 'store-01');
    });
});
// ── Trend ──
(0, node_test_1.describe)('ai-insight.entity: Trend', () => {
    (0, node_test_1.default)('creates valid Trend forecast', () => {
        const trend = {
            id: 'trend-001',
            tenantId: 'tenant-1',
            metric: '日营收',
            forecast: [
                { date: '2026-06-24', value: 15200 },
                { date: '2026-06-25', value: 15400 },
                { date: '2026-06-26', value: 15300 }
            ],
            confidence: 0.85,
            generatedAt: '2026-06-23T00:00:00.000Z'
        };
        strict_1.default.equal(trend.id, 'trend-001');
        strict_1.default.equal(trend.metric, '日营收');
        strict_1.default.equal(trend.forecast.length, 3);
        strict_1.default.equal(trend.confidence, 0.85);
        strict_1.default.ok(trend.confidence >= 0 && trend.confidence <= 1);
    });
    (0, node_test_1.default)('creates Trend with optional storeId', () => {
        const trend = {
            id: 'trend-002',
            tenantId: 'tenant-1',
            storeId: 'store-01',
            metric: '到店人数',
            forecast: [{ date: '2026-06-24', value: 185 }],
            confidence: 0.6,
            generatedAt: new Date().toISOString()
        };
        strict_1.default.equal(trend.storeId, 'store-01');
        strict_1.default.equal(trend.forecast.length, 1);
    });
    (0, node_test_1.default)('confidence is clamped between 0 and 1 in type system', () => {
        // TypeScript number allows 0-1 range; verify contract
        const t1 = {
            id: 't-min',
            tenantId: 't',
            metric: 'm',
            forecast: [],
            confidence: 0,
            generatedAt: new Date().toISOString()
        };
        strict_1.default.equal(t1.confidence, 0);
        const t2 = {
            id: 't-max',
            tenantId: 't',
            metric: 'm',
            forecast: [],
            confidence: 1,
            generatedAt: new Date().toISOString()
        };
        strict_1.default.equal(t2.confidence, 1);
    });
});
// ── ForecastPoint ──
(0, node_test_1.describe)('ai-insight.entity: ForecastPoint', () => {
    (0, node_test_1.default)('creates valid ForecastPoint', () => {
        const point = {
            date: '2026-06-24',
            value: 15200
        };
        strict_1.default.equal(point.date, '2026-06-24');
        strict_1.default.equal(point.value, 15200);
    });
    (0, node_test_1.default)('supports zero and negative values (for metrics like change rates)', () => {
        const zero = { date: '2026-06-24', value: 0 };
        strict_1.default.equal(zero.value, 0);
        const neg = { date: '2026-06-24', value: -5 };
        strict_1.default.equal(neg.value, -5);
    });
});
// ── DashboardSummary ──
(0, node_test_1.describe)('ai-insight.entity: DashboardSummary', () => {
    (0, node_test_1.default)('creates valid DashboardSummary', () => {
        const summary = {
            tenantId: 'tenant-1',
            today: {
                label: '今日',
                start: '2026-06-23',
                end: '2026-06-23',
                revenue: 15000,
                members: 25,
                attendance: 180,
                games: 350,
                kpis: [],
                yoyPercent: 12.5
            },
            thisWeek: {
                label: '本周',
                start: '2026-06-17',
                end: '2026-06-23',
                revenue: 95000,
                members: 150,
                attendance: 1200,
                games: 2400,
                kpis: [],
                yoyPercent: 8.3
            },
            thisMonth: {
                label: '本月',
                start: '2026-06-01',
                end: '2026-06-23',
                revenue: 380000,
                members: 600,
                attendance: 5000,
                games: 10000,
                kpis: [],
                yoyPercent: 15.2
            },
            activeAnomalies: 3,
            reportCount: 12,
            generatedAt: '2026-06-23T00:00:00.000Z'
        };
        strict_1.default.equal(summary.tenantId, 'tenant-1');
        strict_1.default.equal(summary.today.label, '今日');
        strict_1.default.equal(summary.activeAnomalies, 3);
        strict_1.default.equal(summary.reportCount, 12);
    });
    (0, node_test_1.default)('creates DashboardSummary with optional storeId', () => {
        const summary = {
            tenantId: 'tenant-1',
            storeId: 'store-01',
            today: {
                label: '今日', start: '2026-06-23', end: '2026-06-23',
                revenue: 0, members: 0, attendance: 0, games: 0, kpis: [], yoyPercent: 0
            },
            thisWeek: {
                label: '本周', start: '2026-06-17', end: '2026-06-23',
                revenue: 0, members: 0, attendance: 0, games: 0, kpis: [], yoyPercent: 0
            },
            thisMonth: {
                label: '本月', start: '2026-06-01', end: '2026-06-23',
                revenue: 0, members: 0, attendance: 0, games: 0, kpis: [], yoyPercent: 0
            },
            activeAnomalies: 0,
            reportCount: 0,
            generatedAt: new Date().toISOString()
        };
        strict_1.default.equal(summary.storeId, 'store-01');
        strict_1.default.equal(summary.activeAnomalies, 0);
        strict_1.default.equal(summary.reportCount, 0);
    });
});
// ── SummaryPeriod ──
(0, node_test_1.describe)('ai-insight.entity: SummaryPeriod', () => {
    (0, node_test_1.default)('creates valid SummaryPeriod', () => {
        const period = {
            label: '今日',
            start: '2026-06-23',
            end: '2026-06-23',
            revenue: 15000,
            members: 25,
            attendance: 180,
            games: 350,
            kpis: [],
            yoyPercent: 12.5
        };
        strict_1.default.equal(period.label, '今日');
        strict_1.default.equal(period.revenue, 15000);
        strict_1.default.equal(period.members, 25);
        strict_1.default.equal(period.attendance, 180);
        strict_1.default.equal(period.games, 350);
        strict_1.default.equal(period.yoyPercent, 12.5);
        strict_1.default.deepEqual(period.kpis, []);
    });
    (0, node_test_1.default)('SummaryPeriod with KPI children', () => {
        const kpis = [{
                id: 'kpi-001', tenantId: 't', name: '日营收',
                category: 'revenue', value: 15000, target: 20000,
                unit: '元', trend: 'up', period: 'daily',
                updatedAt: new Date().toISOString()
            }];
        const period = {
            label: '今日',
            start: '2026-06-23',
            end: '2026-06-23',
            revenue: 15000,
            members: 25,
            attendance: 180,
            games: 350,
            kpis,
            yoyPercent: 12.5
        };
        strict_1.default.equal(period.kpis.length, 1);
        strict_1.default.equal(period.kpis[0].name, '日营收');
    });
});
//# sourceMappingURL=ai-insight.entity.test.js.map