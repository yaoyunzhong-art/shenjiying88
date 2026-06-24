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
const bootstrap_service_1 = require("./bootstrap.service");
// ── helpers ────────────────────────────────────────────────────
function createContext(overrides = {}) {
    return {
        tenantId: 'tenant-boot',
        brandId: 'brand-boot',
        storeId: 'store-boot',
        marketCode: 'cn-mainland',
        ...overrides
    };
}
// ── BootstrapService tests ─────────────────────────────────────
(0, node_test_1.describe)('BootstrapService', () => {
    const service = new bootstrap_service_1.BootstrapService();
    // ── getHealth() ──────────────────────────────────────────────
    (0, node_test_1.describe)('getHealth()', () => {
        (0, node_test_1.default)('returns status "ok"', () => {
            const result = service.getHealth();
            strict_1.default.equal(result.status, 'ok');
        });
        (0, node_test_1.default)('returns phase "scaffold"', () => {
            const result = service.getHealth();
            strict_1.default.equal(result.phase, 'scaffold');
        });
        (0, node_test_1.default)('returns uptime as a non-negative number', () => {
            const result = service.getHealth();
            strict_1.default.equal(typeof result.uptime, 'number');
            strict_1.default.ok(result.uptime >= 0);
        });
    });
    // ── getBootstrapMetadata() ───────────────────────────────────
    (0, node_test_1.describe)('getBootstrapMetadata()', () => {
        (0, node_test_1.default)('returns tenantContext unchanged', () => {
            const ctx = createContext();
            const result = service.getBootstrapMetadata(ctx);
            strict_1.default.deepStrictEqual(result.tenantContext, ctx);
        });
        (0, node_test_1.default)('returns phase "scaffold"', () => {
            const result = service.getBootstrapMetadata(createContext());
            strict_1.default.equal(result.phase, 'scaffold');
        });
        (0, node_test_1.default)('returns empty foundationDependencies by default', () => {
            const result = service.getBootstrapMetadata(createContext());
            strict_1.default.deepStrictEqual(result.foundationDependencies, []);
        });
        (0, node_test_1.default)('preserves tenantId with minimal context', () => {
            const ctx = { tenantId: 'min-tenant' };
            const result = service.getBootstrapMetadata(ctx);
            strict_1.default.equal(result.tenantContext.tenantId, 'min-tenant');
        });
        (0, node_test_1.default)('preserves brandId and storeId in full context', () => {
            const ctx = createContext({ brandId: 'b-x', storeId: 's-y' });
            const result = service.getBootstrapMetadata(ctx);
            strict_1.default.equal(result.tenantContext.brandId, 'b-x');
            strict_1.default.equal(result.tenantContext.storeId, 's-y');
        });
        (0, node_test_1.default)('preserves marketCode across different markets', () => {
            const ctx = createContext({ marketCode: 'en-global' });
            const result = service.getBootstrapMetadata(ctx);
            strict_1.default.equal(result.tenantContext.marketCode, 'en-global');
        });
    });
});
//# sourceMappingURL=bootstrap.service.test.js.map