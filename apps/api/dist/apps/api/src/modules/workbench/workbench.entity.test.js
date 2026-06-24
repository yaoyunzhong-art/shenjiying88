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
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const workbench_entity_1 = require("./workbench.entity");
(0, node_test_1.describe)('Workbench Entity', () => {
    (0, node_test_1.describe)('WORKBENCH_CAPABILITIES', () => {
        (0, node_test_1.default)('defines 14 capability constants', () => {
            strict_1.default.equal(workbench_entity_1.WORKBENCH_CAPABILITIES.length, 14);
        });
        (0, node_test_1.default)('includes core capabilities', () => {
            strict_1.default.ok(workbench_entity_1.WORKBENCH_CAPABILITIES.includes('tenant-management'));
            strict_1.default.ok(workbench_entity_1.WORKBENCH_CAPABILITIES.includes('member-crm'));
            strict_1.default.ok(workbench_entity_1.WORKBENCH_CAPABILITIES.includes('checkout-nuclear'));
            strict_1.default.ok(workbench_entity_1.WORKBENCH_CAPABILITIES.includes('offline-fallback'));
            strict_1.default.ok(workbench_entity_1.WORKBENCH_CAPABILITIES.includes('audit-center'));
        });
    });
    (0, node_test_1.describe)('ROLE_CAPABILITY_MAP', () => {
        (0, node_test_1.default)('maps all 10 roles to capabilities', () => {
            const roles = Object.keys(workbench_entity_1.ROLE_CAPABILITY_MAP);
            strict_1.default.equal(roles.length, 10);
        });
        (0, node_test_1.default)('SUPER_ADMIN has tenant-management and audit-center', () => {
            const caps = workbench_entity_1.ROLE_CAPABILITY_MAP['SUPER_ADMIN'];
            strict_1.default.ok(caps.includes('tenant-management'));
            strict_1.default.ok(caps.includes('audit-center'));
            strict_1.default.ok(caps.includes('market-governance'));
        });
        (0, node_test_1.default)('GUIDE has member-crm and promo-conversion', () => {
            const caps = workbench_entity_1.ROLE_CAPABILITY_MAP['GUIDE'];
            strict_1.default.equal(caps.length, 2);
            strict_1.default.ok(caps.includes('member-crm'));
            strict_1.default.ok(caps.includes('promo-conversion'));
        });
        (0, node_test_1.default)('CASHIER has checkout-nuclear and offline-fallback', () => {
            const caps = workbench_entity_1.ROLE_CAPABILITY_MAP['CASHIER'];
            strict_1.default.equal(caps.length, 2);
            strict_1.default.ok(caps.includes('checkout-nuclear'));
            strict_1.default.ok(caps.includes('offline-fallback'));
        });
        (0, node_test_1.default)('OPERATIONS has audit-center, market-governance, field-scheduling, tenant-management', () => {
            const caps = workbench_entity_1.ROLE_CAPABILITY_MAP['OPERATIONS'];
            strict_1.default.equal(caps.length, 4);
            strict_1.default.ok(caps.includes('audit-center'));
            strict_1.default.ok(caps.includes('market-governance'));
            strict_1.default.ok(caps.includes('field-scheduling'));
            strict_1.default.ok(caps.includes('tenant-management'));
        });
        (0, node_test_1.default)('FINANCE has regional-config, market-governance, audit-center', () => {
            const caps = workbench_entity_1.ROLE_CAPABILITY_MAP['FINANCE'];
            strict_1.default.equal(caps.length, 3);
            strict_1.default.ok(caps.includes('regional-config'));
            strict_1.default.ok(caps.includes('market-governance'));
            strict_1.default.ok(caps.includes('audit-center'));
        });
        (0, node_test_1.default)('WAREHOUSE has brand-matrix, tenant-management, daily-report, market-governance, audit-center', () => {
            const caps = workbench_entity_1.ROLE_CAPABILITY_MAP['WAREHOUSE'];
            strict_1.default.equal(caps.length, 5);
            strict_1.default.ok(caps.includes('brand-matrix'));
            strict_1.default.ok(caps.includes('tenant-management'));
            strict_1.default.ok(caps.includes('daily-report'));
            strict_1.default.ok(caps.includes('market-governance'));
            strict_1.default.ok(caps.includes('audit-center'));
        });
        (0, node_test_1.default)('COACH has member-crm, promo-conversion, audit-center', () => {
            const caps = workbench_entity_1.ROLE_CAPABILITY_MAP['COACH'];
            strict_1.default.equal(caps.length, 3);
            strict_1.default.ok(caps.includes('member-crm'));
            strict_1.default.ok(caps.includes('promo-conversion'));
            strict_1.default.ok(caps.includes('audit-center'));
        });
    });
    (0, node_test_1.describe)('hasCapability', () => {
        (0, node_test_1.default)('returns true for role that has the capability', () => {
            strict_1.default.equal((0, workbench_entity_1.hasCapability)('SUPER_ADMIN', 'tenant-management'), true);
            strict_1.default.equal((0, workbench_entity_1.hasCapability)('GUIDE', 'promo-conversion'), true);
        });
        (0, node_test_1.default)('returns false for role that does not have the capability', () => {
            strict_1.default.equal((0, workbench_entity_1.hasCapability)('GUIDE', 'audit-center'), false);
            strict_1.default.equal((0, workbench_entity_1.hasCapability)('CASHIER', 'tenant-management'), false);
        });
        (0, node_test_1.default)('returns false for unknown role', () => {
            strict_1.default.equal((0, workbench_entity_1.hasCapability)('UNKNOWN_ROLE', 'member-crm'), false);
        });
        (0, node_test_1.default)('returns false for unknown capability', () => {
            strict_1.default.equal((0, workbench_entity_1.hasCapability)('SUPER_ADMIN', 'non-existent-cap'), false);
        });
        (0, node_test_1.default)('4 newly added roles have working capability lookups', () => {
            // OPERATIONS: audit-center, FINANCE: regional-config, WAREHOUSE: daily-report, COACH: member-crm
            strict_1.default.equal((0, workbench_entity_1.hasCapability)('OPERATIONS', 'audit-center'), true);
            strict_1.default.equal((0, workbench_entity_1.hasCapability)('OPERATIONS', 'checkout-nuclear'), false);
            strict_1.default.equal((0, workbench_entity_1.hasCapability)('FINANCE', 'regional-config'), true);
            strict_1.default.equal((0, workbench_entity_1.hasCapability)('FINANCE', 'member-crm'), false);
            strict_1.default.equal((0, workbench_entity_1.hasCapability)('WAREHOUSE', 'daily-report'), true);
            strict_1.default.equal((0, workbench_entity_1.hasCapability)('WAREHOUSE', 'promo-conversion'), false);
            strict_1.default.equal((0, workbench_entity_1.hasCapability)('COACH', 'member-crm'), true);
            strict_1.default.equal((0, workbench_entity_1.hasCapability)('COACH', 'audit-center'), true);
        });
        (0, node_test_1.default)('COACH should not overlap with STORE_MANAGER field-scheduling (business rule)', () => {
            // 团建 / 教练 走自己的 member-crm / promo-conversion / audit-center，
            // 不应该有店长排班 (field-scheduling) — 否则权限边界模糊
            strict_1.default.equal((0, workbench_entity_1.hasCapability)('COACH', 'field-scheduling'), false);
        });
    });
    (0, node_test_1.describe)('makeWorkbenchBootstrapState', () => {
        (0, node_test_1.default)('creates default bootstrap state with version and initialized flag', () => {
            const workbenches = [];
            const state = (0, workbench_entity_1.makeWorkbenchBootstrapState)(workbenches);
            strict_1.default.equal(state.version, '1.0.0');
            strict_1.default.equal(state.initialized, true);
            strict_1.default.deepEqual(state.workbenches, []);
            strict_1.default.ok(state.refreshedAt, 'refreshedAt should be set');
            // Verify it's a valid ISO date
            strict_1.default.ok(new Date(state.refreshedAt).getTime() > 0);
        });
        (0, node_test_1.default)('allows overriding version and initialized', () => {
            const workbenches = [{ role: 'GUIDE' }];
            const state = (0, workbench_entity_1.makeWorkbenchBootstrapState)(workbenches, {
                version: '2.0.0-beta',
                initialized: false
            });
            strict_1.default.equal(state.version, '2.0.0-beta');
            strict_1.default.equal(state.initialized, false);
            strict_1.default.equal(state.workbenches.length, 1);
        });
        (0, node_test_1.default)('overrides refreshedAt when provided', () => {
            const workbenches = [];
            const customDate = '2025-01-15T08:00:00.000Z';
            const state = (0, workbench_entity_1.makeWorkbenchBootstrapState)(workbenches, {
                refreshedAt: customDate
            });
            strict_1.default.equal(state.refreshedAt, customDate);
        });
    });
    (0, node_test_1.describe)('NavItemPriority enum', () => {
        (0, node_test_1.default)('defines three priority levels', () => {
            strict_1.default.equal(workbench_entity_1.NavItemPriority.High, 'HIGH');
            strict_1.default.equal(workbench_entity_1.NavItemPriority.Medium, 'MEDIUM');
            strict_1.default.equal(workbench_entity_1.NavItemPriority.Low, 'LOW');
        });
    });
});
//# sourceMappingURL=workbench.entity.test.js.map