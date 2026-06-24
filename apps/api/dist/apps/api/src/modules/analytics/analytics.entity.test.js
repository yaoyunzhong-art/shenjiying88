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
const analytics_entity_1 = require("./analytics.entity");
(0, node_test_1.describe)('AnalyticsEntity', () => {
    (0, node_test_1.default)('AnalyticsScope and DiagnosticSeverity enums are stable', () => {
        strict_1.default.equal(analytics_entity_1.AnalyticsScope.Tenant, 'TENANT');
        strict_1.default.equal(analytics_entity_1.AnalyticsScope.Brand, 'BRAND');
        strict_1.default.equal(analytics_entity_1.AnalyticsScope.Store, 'STORE');
        strict_1.default.equal(analytics_entity_1.DiagnosticSeverity.Info, 'INFO');
        strict_1.default.equal(analytics_entity_1.DiagnosticSeverity.Warning, 'WARNING');
        strict_1.default.equal(analytics_entity_1.DiagnosticSeverity.Critical, 'CRITICAL');
    });
    (0, node_test_1.default)('DiagnosticCategory enums cover the diagnostic categories', () => {
        const categories = Object.values(analytics_entity_1.DiagnosticCategory);
        strict_1.default.ok(categories.includes(analytics_entity_1.DiagnosticCategory.PaymentHealth));
        strict_1.default.ok(categories.includes(analytics_entity_1.DiagnosticCategory.CouponPerformance));
        strict_1.default.ok(categories.includes(analytics_entity_1.DiagnosticCategory.BlindboxEngagement));
        strict_1.default.ok(categories.includes(analytics_entity_1.DiagnosticCategory.MemberActivity));
        strict_1.default.ok(categories.includes(analytics_entity_1.DiagnosticCategory.PointEconomy));
        strict_1.default.ok(categories.includes(analytics_entity_1.DiagnosticCategory.ConcentrationRisk));
    });
});
//# sourceMappingURL=analytics.entity.test.js.map