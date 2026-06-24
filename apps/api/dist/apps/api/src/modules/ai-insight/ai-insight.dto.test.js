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
 * 🐜 自动: [ai-insight] [D] DTO 测试
 * 验证 class-validator 装饰器的约束和 DTO 转换
 */
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const ai_insight_dto_1 = require("./ai-insight.dto");
// ── GenerateReportDto ──
(0, node_test_1.describe)('ai-insight.dto: GenerateReportDto', () => {
    (0, node_test_1.default)('validates correct report generation input', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_insight_dto_1.GenerateReportDto, {
            type: 'revenue',
            periodStart: '2026-06-01',
            periodEnd: '2026-06-07'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('accepts optional storeId', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_insight_dto_1.GenerateReportDto, {
            type: 'member',
            storeId: 'store-01',
            periodStart: '2026-06-01',
            periodEnd: '2026-06-07'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('rejects missing type', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_insight_dto_1.GenerateReportDto, {
            periodStart: '2026-06-01',
            periodEnd: '2026-06-07'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'type'));
    });
    (0, node_test_1.default)('rejects invalid type', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_insight_dto_1.GenerateReportDto, {
            type: 'invalid',
            periodStart: '2026-06-01',
            periodEnd: '2026-06-07'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'type'));
    });
    (0, node_test_1.default)('rejects missing periodStart', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_insight_dto_1.GenerateReportDto, {
            type: 'revenue',
            periodEnd: '2026-06-07'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'periodStart'));
    });
    (0, node_test_1.default)('rejects missing periodEnd', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_insight_dto_1.GenerateReportDto, {
            type: 'revenue',
            periodStart: '2026-06-01'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'periodEnd'));
    });
    (0, node_test_1.default)('supports all 5 valid types', async () => {
        const types = ['revenue', 'member', 'attendance', 'game', 'kpi'];
        for (const type of types) {
            const dto = (0, class_transformer_1.plainToInstance)(ai_insight_dto_1.GenerateReportDto, {
                type,
                periodStart: '2026-06-01',
                periodEnd: '2026-06-07'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.equal(errors.length, 0, `type=${type} should be valid`);
        }
    });
});
// ── InsightReportQueryDto ──
(0, node_test_1.describe)('ai-insight.dto: InsightReportQueryDto', () => {
    (0, node_test_1.default)('validates empty query (all optional)', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_insight_dto_1.InsightReportQueryDto, {});
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('validates with all optional fields', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_insight_dto_1.InsightReportQueryDto, {
            storeId: 'store-01',
            type: 'revenue',
            limit: 10
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('rejects invalid type', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_insight_dto_1.InsightReportQueryDto, {
            type: 'bad-type'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'type'));
    });
    (0, node_test_1.default)('rejects limit < 1', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_insight_dto_1.InsightReportQueryDto, {
            limit: 0
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'limit'));
    });
    (0, node_test_1.default)('rejects limit > 100', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_insight_dto_1.InsightReportQueryDto, {
            limit: 101
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'limit'));
    });
    (0, node_test_1.default)('accepts limit at boundaries', async () => {
        // min: 1
        let dto = (0, class_transformer_1.plainToInstance)(ai_insight_dto_1.InsightReportQueryDto, { limit: 1 });
        let errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
        // max: 100
        dto = (0, class_transformer_1.plainToInstance)(ai_insight_dto_1.InsightReportQueryDto, { limit: 100 });
        errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
});
// ── KPIQueryDto ──
(0, node_test_1.describe)('ai-insight.dto: KPIQueryDto', () => {
    (0, node_test_1.default)('validates empty query', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_insight_dto_1.KPIQueryDto, {});
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('validates with storeId and category', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_insight_dto_1.KPIQueryDto, {
            storeId: 'store-01',
            category: 'revenue'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('rejects invalid category', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_insight_dto_1.KPIQueryDto, {
            category: 'unknown'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'category'));
    });
    (0, node_test_1.default)('supports all 5 valid categories', async () => {
        const categories = ['revenue', 'member', 'attendance', 'game', 'operation'];
        for (const category of categories) {
            const dto = (0, class_transformer_1.plainToInstance)(ai_insight_dto_1.KPIQueryDto, { category });
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.equal(errors.length, 0, `category=${category} should be valid`);
        }
    });
});
// ── AnomalyQueryDto ──
(0, node_test_1.describe)('ai-insight.dto: AnomalyQueryDto', () => {
    (0, node_test_1.default)('validates empty query', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_insight_dto_1.AnomalyQueryDto, {});
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('validates with all fields', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_insight_dto_1.AnomalyQueryDto, {
            storeId: 'store-01',
            metric: '日营收',
            status: 'open',
            severity: 'high',
            limit: 20
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('rejects invalid status', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_insight_dto_1.AnomalyQueryDto, {
            status: 'deleted'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'status'));
    });
    (0, node_test_1.default)('rejects invalid severity', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_insight_dto_1.AnomalyQueryDto, {
            severity: 'extreme'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'severity'));
    });
    (0, node_test_1.default)('supports all 3 status values', async () => {
        const statuses = ['open', 'acknowledged', 'resolved'];
        for (const status of statuses) {
            const dto = (0, class_transformer_1.plainToInstance)(ai_insight_dto_1.AnomalyQueryDto, { status });
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.equal(errors.length, 0, `status=${status} should be valid`);
        }
    });
    (0, node_test_1.default)('supports all 4 severity values', async () => {
        const severities = ['low', 'medium', 'high', 'critical'];
        for (const severity of severities) {
            const dto = (0, class_transformer_1.plainToInstance)(ai_insight_dto_1.AnomalyQueryDto, { severity });
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.equal(errors.length, 0, `severity=${severity} should be valid`);
        }
    });
    (0, node_test_1.default)('rejects limit < 1', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_insight_dto_1.AnomalyQueryDto, { limit: 0 });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
    });
    (0, node_test_1.default)('rejects limit > 100', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_insight_dto_1.AnomalyQueryDto, { limit: 200 });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
    });
});
// ── ResolveAnomalyDto ──
(0, node_test_1.describe)('ai-insight.dto: ResolveAnomalyDto', () => {
    (0, node_test_1.default)('validates correct input', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_insight_dto_1.ResolveAnomalyDto, {
            anomalyId: 'anomaly-001'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('rejects empty anomalyId', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_insight_dto_1.ResolveAnomalyDto, {
            anomalyId: ''
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'anomalyId'));
    });
    (0, node_test_1.default)('rejects missing anomalyId', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_insight_dto_1.ResolveAnomalyDto, {});
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'anomalyId'));
    });
});
// ── GenerateForecastDto ──
(0, node_test_1.describe)('ai-insight.dto: GenerateForecastDto', () => {
    (0, node_test_1.default)('validates correct input', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_insight_dto_1.GenerateForecastDto, {
            metric: '日营收',
            period: 'week'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('rejects missing metric', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_insight_dto_1.GenerateForecastDto, {
            period: 'week'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'metric'));
    });
    (0, node_test_1.default)('rejects missing period', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_insight_dto_1.GenerateForecastDto, {
            metric: '日营收'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'period'));
    });
    (0, node_test_1.default)('rejects empty metric', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_insight_dto_1.GenerateForecastDto, {
            metric: '',
            period: 'week'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
    });
});
// ── DashboardQueryDto ──
(0, node_test_1.describe)('ai-insight.dto: DashboardQueryDto', () => {
    (0, node_test_1.default)('validates empty query', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_insight_dto_1.DashboardQueryDto, {});
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('validates with optional storeId', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_insight_dto_1.DashboardQueryDto, {
            storeId: 'store-01'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('storeId is truly optional (undefined)', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_insight_dto_1.DashboardQueryDto, {
            storeId: undefined
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
});
//# sourceMappingURL=ai-insight.dto.test.js.map