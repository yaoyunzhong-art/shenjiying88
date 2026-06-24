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
// 用 require 动态加载绕过 esbuild decorator 运行时问题
const { AnalyticsScope } = require('./analytics.entity');
const { GetOperationSnapshotDto, GetDiagnosticsDto, GetRecommendationsDto } = require('./analytics.dto');
(0, node_test_1.describe)('Analytics DTOs', () => {
    // ─── GetOperationSnapshotDto ───
    (0, node_test_1.describe)('GetOperationSnapshotDto', () => {
        (0, node_test_1.it)('should accept valid scope TENANT', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(GetOperationSnapshotDto, {
                scope: AnalyticsScope.Tenant
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.strictEqual(errors.length, 0);
        });
        (0, node_test_1.it)('should accept valid scope BRAND with brandId', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(GetOperationSnapshotDto, {
                scope: AnalyticsScope.Brand,
                brandId: 'brand-abc'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.strictEqual(errors.length, 0);
        });
        (0, node_test_1.it)('should accept valid scope STORE with brandId and storeId', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(GetOperationSnapshotDto, {
                scope: AnalyticsScope.Store,
                brandId: 'brand-xyz',
                storeId: 'store-123'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.strictEqual(errors.length, 0);
        });
        (0, node_test_1.it)('should accept empty body (all fields optional)', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(GetOperationSnapshotDto, {});
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.strictEqual(errors.length, 0);
        });
        (0, node_test_1.it)('should reject invalid scope value', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(GetOperationSnapshotDto, {
                scope: 'INVALID_SCOPE'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.ok(errors.length > 0);
            node_assert_1.default.ok(errors.some((e) => e.property === 'scope'));
        });
        (0, node_test_1.it)('should reject non-string brandId', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(GetOperationSnapshotDto, {
                brandId: 12345
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.ok(errors.length > 0);
            node_assert_1.default.ok(errors.some((e) => e.property === 'brandId'));
        });
        (0, node_test_1.it)('should reject non-string storeId', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(GetOperationSnapshotDto, {
                storeId: true
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.ok(errors.length > 0);
            node_assert_1.default.ok(errors.some((e) => e.property === 'storeId'));
        });
        (0, node_test_1.it)('should accept STORE scope with only storeId (brandId optional)', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(GetOperationSnapshotDto, {
                scope: AnalyticsScope.Store,
                storeId: 'store-alone'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.strictEqual(errors.length, 0);
        });
    });
    // ─── GetDiagnosticsDto ───
    (0, node_test_1.describe)('GetDiagnosticsDto', () => {
        (0, node_test_1.it)('should accept valid scope TENANT', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(GetDiagnosticsDto, {
                scope: AnalyticsScope.Tenant
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.strictEqual(errors.length, 0);
        });
        (0, node_test_1.it)('should accept valid scope BRAND with brandId', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(GetDiagnosticsDto, {
                scope: AnalyticsScope.Brand,
                brandId: 'brand-diag'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.strictEqual(errors.length, 0);
        });
        (0, node_test_1.it)('should accept valid scope STORE with both ids', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(GetDiagnosticsDto, {
                scope: AnalyticsScope.Store,
                brandId: 'b-diag',
                storeId: 's-diag'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.strictEqual(errors.length, 0);
        });
        (0, node_test_1.it)('should accept empty body (all fields optional)', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(GetDiagnosticsDto, {});
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.strictEqual(errors.length, 0);
        });
        (0, node_test_1.it)('should reject invalid scope value', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(GetDiagnosticsDto, {
                scope: 'BOGUS'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.ok(errors.length > 0);
            node_assert_1.default.ok(errors.some((e) => e.property === 'scope'));
        });
        (0, node_test_1.it)('should reject non-string brandId', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(GetDiagnosticsDto, {
                brandId: ['array-not-allowed']
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.ok(errors.length > 0);
        });
        (0, node_test_1.it)('should reject non-string storeId', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(GetDiagnosticsDto, {
                storeId: { obj: true }
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.ok(errors.length > 0);
        });
    });
    // ─── GetRecommendationsDto ───
    (0, node_test_1.describe)('GetRecommendationsDto', () => {
        (0, node_test_1.it)('should accept valid scope TENANT', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(GetRecommendationsDto, {
                scope: AnalyticsScope.Tenant
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.strictEqual(errors.length, 0);
        });
        (0, node_test_1.it)('should accept valid scope BRAND with brandId', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(GetRecommendationsDto, {
                scope: AnalyticsScope.Brand,
                brandId: 'brand-rec'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.strictEqual(errors.length, 0);
        });
        (0, node_test_1.it)('should accept valid scope STORE with both ids', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(GetRecommendationsDto, {
                scope: AnalyticsScope.Store,
                brandId: 'b-rec',
                storeId: 's-rec'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.strictEqual(errors.length, 0);
        });
        (0, node_test_1.it)('should accept empty body (all fields optional)', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(GetRecommendationsDto, {});
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.strictEqual(errors.length, 0);
        });
        (0, node_test_1.it)('should reject invalid scope value', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(GetRecommendationsDto, {
                scope: 'NOT_A_SCOPE'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.ok(errors.length > 0);
            node_assert_1.default.ok(errors.some((e) => e.property === 'scope'));
        });
        (0, node_test_1.it)('should accept scope undefined with valid brandId and storeId', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(GetRecommendationsDto, {
                brandId: 'b-only',
                storeId: 's-only'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.strictEqual(errors.length, 0);
        });
        (0, node_test_1.it)('should reject invalid types on optional fields', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(GetRecommendationsDto, {
                scope: AnalyticsScope.Tenant,
                brandId: 42
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.ok(errors.length > 0);
        });
    });
    // ─── Cross-cutting: DTO 实例属性检查 ───
    (0, node_test_1.describe)('DTO instance properties', () => {
        (0, node_test_1.it)('GetOperationSnapshotDto should have expected properties', () => {
            const dto = new GetOperationSnapshotDto();
            dto.scope = AnalyticsScope.Tenant;
            dto.brandId = 'b';
            dto.storeId = 's';
            node_assert_1.default.strictEqual(dto.scope, AnalyticsScope.Tenant);
            node_assert_1.default.strictEqual(dto.brandId, 'b');
            node_assert_1.default.strictEqual(dto.storeId, 's');
        });
        (0, node_test_1.it)('GetDiagnosticsDto should have expected properties', () => {
            const dto = new GetDiagnosticsDto();
            dto.scope = AnalyticsScope.Brand;
            dto.brandId = 'b-diag';
            node_assert_1.default.strictEqual(dto.scope, AnalyticsScope.Brand);
            node_assert_1.default.strictEqual(dto.brandId, 'b-diag');
            node_assert_1.default.strictEqual(dto.storeId, undefined);
        });
        (0, node_test_1.it)('GetRecommendationsDto should have expected properties', () => {
            const dto = new GetRecommendationsDto();
            dto.scope = AnalyticsScope.Store;
            dto.brandId = 'b-rec';
            dto.storeId = 's-rec';
            node_assert_1.default.strictEqual(dto.scope, AnalyticsScope.Store);
            node_assert_1.default.strictEqual(dto.brandId, 'b-rec');
            node_assert_1.default.strictEqual(dto.storeId, 's-rec');
        });
    });
});
//# sourceMappingURL=analytics.dto.test.js.map