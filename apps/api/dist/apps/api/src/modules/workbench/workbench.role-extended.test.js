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
 * 🐜 Wave-6: 5角色工作台补全 — 扩展测试
 *
 * 覆盖角色：SUPER_ADMIN / OPERATIONS / FINANCE / WAREHOUSE / COACH
 *
 * 测试维度：
 *   1. 每个角色能通过 bootstrap 加载
 *   2. 每个角色 ≥5 导航菜单项
 *   3. 每个角色有首页路径 / 待办卡片 / 权限片段
 *   4. 越权验证：WAREHOUSE 不能访问 FINANCE 菜单
 *   5. RoleBootstrapConfig 结构完整性
 */
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const workbench_entity_1 = require("./workbench.entity");
// =========================================================================
const TARGET_ROLES = [
    { key: 'SUPER_ADMIN', label: '安监', home: '/admin/dashboard' },
    { key: 'OPERATIONS', label: '运营', home: '/ops/dashboard' },
    { key: 'FINANCE', label: '财务', home: '/finance/dashboard' },
    { key: 'WAREHOUSE', label: '仓储', home: '/warehouse/dashboard' },
    { key: 'COACH', label: '教练', home: '/coach/dashboard' },
];
// =========================================================================
// Test 1-5: 每个角色能通过 bootstrap 加载（含完整性断言）
// =========================================================================
for (const roleDef of TARGET_ROLES) {
    (0, node_test_1.describe)(`${roleDef.label} (${roleDef.key}) bootstrap 加载`, () => {
        (0, node_test_1.default)(`normal: ${roleDef.key} bootstrap config exists`, () => {
            const config = (0, workbench_entity_1.getRoleBootstrapConfig)(roleDef.key);
            strict_1.default.ok(config, `${roleDef.key} bootstrap config should exist`);
            strict_1.default.equal(config.role, roleDef.key);
        });
        (0, node_test_1.default)(`normal: ${roleDef.key} homePath is ${roleDef.home}`, () => {
            const config = (0, workbench_entity_1.getRoleBootstrapConfig)(roleDef.key);
            strict_1.default.equal(config.homePath, roleDef.home);
        });
        (0, node_test_1.default)(`normal: ${roleDef.key} has ≥5 nav items`, () => {
            const config = (0, workbench_entity_1.getRoleBootstrapConfig)(roleDef.key);
            strict_1.default.ok(config.extendedNavItems.length >= 5, `${roleDef.key} should have ≥5 nav items (got ${config.extendedNavItems.length})`);
        });
        (0, node_test_1.default)(`normal: ${roleDef.key} has todo card types`, () => {
            const config = (0, workbench_entity_1.getRoleBootstrapConfig)(roleDef.key);
            strict_1.default.ok(config.todoCardTypes.length > 0, `${roleDef.key} should have todo card types`);
        });
        (0, node_test_1.default)(`normal: ${roleDef.key} has permission snippets`, () => {
            const config = (0, workbench_entity_1.getRoleBootstrapConfig)(roleDef.key);
            strict_1.default.ok(config.permissionSnippets.length > 0, `${roleDef.key} should have permission snippets`);
        });
    });
}
// =========================================================================
// Test 6-10: 每个角色导航菜单完整性 (≥5 items 互不重复)
// =========================================================================
(0, node_test_1.describe)('SUPER_ADMIN 导航菜单完整性', () => {
    (0, node_test_1.default)('SUPER_ADMIN nav items ≥ 7 (富菜单)', () => {
        strict_1.default.ok(workbench_entity_1.SUPER_ADMIN_BOOTSTRAP.extendedNavItems.length >= 7);
    });
    (0, node_test_1.default)('SUPER_ADMIN nav keys unique', () => {
        const keys = workbench_entity_1.SUPER_ADMIN_BOOTSTRAP.extendedNavItems.map(i => i.key);
        strict_1.default.equal(keys.length, new Set(keys).size, 'nav keys should be unique');
    });
    (0, node_test_1.default)('SUPER_ADMIN nav items contain tenants + audit + markets', () => {
        const keys = workbench_entity_1.SUPER_ADMIN_BOOTSTRAP.extendedNavItems.map(i => i.key);
        strict_1.default.ok(keys.includes('tenants'));
        strict_1.default.ok(keys.includes('audit'));
        strict_1.default.ok(keys.includes('markets'));
    });
});
(0, node_test_1.describe)('OPERATIONS 导航菜单完整性', () => {
    (0, node_test_1.default)('OPERATIONS nav items ≥ 6', () => {
        strict_1.default.ok(workbench_entity_1.OPERATIONS_BOOTSTRAP.extendedNavItems.length >= 6);
    });
    (0, node_test_1.default)('OPERATIONS nav items contain kpi-dashboard + campaign-effects + traffic-analysis', () => {
        const keys = workbench_entity_1.OPERATIONS_BOOTSTRAP.extendedNavItems.map(i => i.key);
        strict_1.default.ok(keys.includes('kpi-dashboard'));
        strict_1.default.ok(keys.includes('campaign-effects'));
        strict_1.default.ok(keys.includes('traffic-analysis'));
    });
});
(0, node_test_1.describe)('FINANCE 导航菜单完整性', () => {
    (0, node_test_1.default)('FINANCE nav items ≥ 6', () => {
        strict_1.default.ok(workbench_entity_1.FINANCE_BOOTSTRAP.extendedNavItems.length >= 6);
    });
    (0, node_test_1.default)('FINANCE nav items contain reconciliation + settlements + invoices', () => {
        const keys = workbench_entity_1.FINANCE_BOOTSTRAP.extendedNavItems.map(i => i.key);
        strict_1.default.ok(keys.includes('reconciliation'));
        strict_1.default.ok(keys.includes('settlements'));
        strict_1.default.ok(keys.includes('invoices'));
    });
});
(0, node_test_1.describe)('WAREHOUSE 导航菜单完整性', () => {
    (0, node_test_1.default)('WAREHOUSE nav items ≥ 6', () => {
        strict_1.default.ok(workbench_entity_1.WAREHOUSE_BOOTSTRAP.extendedNavItems.length >= 6);
    });
    (0, node_test_1.default)('WAREHOUSE nav items contain inventory-dashboard + purchase-orders + suppliers', () => {
        const keys = workbench_entity_1.WAREHOUSE_BOOTSTRAP.extendedNavItems.map(i => i.key);
        strict_1.default.ok(keys.includes('inventory-dashboard'));
        strict_1.default.ok(keys.includes('purchase-orders'));
        strict_1.default.ok(keys.includes('suppliers'));
    });
});
(0, node_test_1.describe)('COACH 导航菜单完整性', () => {
    (0, node_test_1.default)('COACH nav items ≥ 6', () => {
        strict_1.default.ok(workbench_entity_1.COACH_BOOTSTRAP.extendedNavItems.length >= 6);
    });
    (0, node_test_1.default)('COACH nav items contain class-schedule + students + teaching-records', () => {
        const keys = workbench_entity_1.COACH_BOOTSTRAP.extendedNavItems.map(i => i.key);
        strict_1.default.ok(keys.includes('class-schedule'));
        strict_1.default.ok(keys.includes('students'));
        strict_1.default.ok(keys.includes('teaching-records'));
    });
});
// =========================================================================
// Test 11: 越权验证 — WAREHOUSE 不能访问 FINANCE 菜单
// =========================================================================
(0, node_test_1.describe)('越权验证', () => {
    (0, node_test_1.default)('WAREHOUSE cannot access FINANCE menu', () => {
        strict_1.default.equal((0, workbench_entity_1.canAccessRoleMenu)('WAREHOUSE', 'FINANCE'), false);
    });
    (0, node_test_1.default)('COACH cannot access FINANCE menu', () => {
        strict_1.default.equal((0, workbench_entity_1.canAccessRoleMenu)('COACH', 'FINANCE'), false);
    });
    (0, node_test_1.default)('OPERATIONS cannot access FINANCE menu', () => {
        strict_1.default.equal((0, workbench_entity_1.canAccessRoleMenu)('OPERATIONS', 'FINANCE'), false);
    });
    (0, node_test_1.default)('FINANCE cannot access WAREHOUSE menu', () => {
        strict_1.default.equal((0, workbench_entity_1.canAccessRoleMenu)('FINANCE', 'WAREHOUSE'), false);
    });
    (0, node_test_1.default)('STORE_MANAGER cannot access WAREHOUSE menu', () => {
        strict_1.default.equal((0, workbench_entity_1.canAccessRoleMenu)('STORE_MANAGER', 'WAREHOUSE'), false);
    });
    (0, node_test_1.default)('SUPER_ADMIN can access any role menu', () => {
        for (const { key } of TARGET_ROLES) {
            strict_1.default.equal((0, workbench_entity_1.canAccessRoleMenu)('SUPER_ADMIN', key), true, `SUPER_ADMIN should access ${key} menu`);
        }
    });
    (0, node_test_1.default)('Self role can access own menu', () => {
        for (const { key } of TARGET_ROLES) {
            strict_1.default.equal((0, workbench_entity_1.canAccessRoleMenu)(key, key), true, `${key} should access own menu`);
        }
    });
    (0, node_test_1.default)('Unknown role cannot access FINANCE', () => {
        strict_1.default.equal((0, workbench_entity_1.canAccessRoleMenu)('UNKNOWN_ROLE', 'FINANCE'), false);
    });
});
// =========================================================================
// Test 12: 待办卡片类型完整性
// =========================================================================
(0, node_test_1.describe)('待办卡片类型', () => {
    for (const roleDef of TARGET_ROLES) {
        (0, node_test_1.default)(`${roleDef.key} todo cards have valid priorities`, () => {
            const config = (0, workbench_entity_1.getRoleBootstrapConfig)(roleDef.key);
            const validPriorities = ['HIGH', 'MEDIUM', 'LOW'];
            for (const card of config.todoCardTypes) {
                strict_1.default.ok(validPriorities.includes(card.priority), `${roleDef.key} card "${card.key}" has valid priority (got ${card.priority})`);
                strict_1.default.ok(card.key.length > 0, `${roleDef.key} card should have a key`);
                strict_1.default.ok(card.label.length > 0, `${roleDef.key} card should have a label`);
            }
        });
    }
});
// =========================================================================
// Test 13: 权限矩阵片段完整性
// =========================================================================
(0, node_test_1.describe)('权限矩阵片段完整性', () => {
    (0, node_test_1.default)('All 5 roles have permission snippets covering resources', () => {
        for (const { key } of TARGET_ROLES) {
            const config = (0, workbench_entity_1.getRoleBootstrapConfig)(key);
            strict_1.default.ok(config.permissionSnippets.length >= 2, `${key} should have ≥2 permission snippets`);
            const validScopes = ['platform', 'tenant', 'brand', 'store'];
            for (const snippet of config.permissionSnippets) {
                strict_1.default.ok(validScopes.includes(snippet.scope), `${key} snippet "${snippet.resource}" has valid scope (got ${snippet.scope})`);
                strict_1.default.ok(snippet.actions.length > 0, `${key} snippet "${snippet.resource}" should have actions`);
            }
        }
    });
});
// =========================================================================
// Test 14: ROLE_BOOTSTRAP_CONFIGS 聚合正确
// =========================================================================
(0, node_test_1.describe)('ROLE_BOOTSTRAP_CONFIGS 聚合', () => {
    (0, node_test_1.default)('ROLE_BOOTSTRAP_CONFIGS contains all 5 target roles', () => {
        const keys = Object.keys(workbench_entity_1.ROLE_BOOTSTRAP_CONFIGS);
        strict_1.default.equal(keys.length, 5);
        strict_1.default.ok(keys.includes('SUPER_ADMIN'));
        strict_1.default.ok(keys.includes('OPERATIONS'));
        strict_1.default.ok(keys.includes('FINANCE'));
        strict_1.default.ok(keys.includes('WAREHOUSE'));
        strict_1.default.ok(keys.includes('COACH'));
    });
    (0, node_test_1.default)('ROLE_BOOTSTRAP_CONFIGS entries match standalone exports', () => {
        strict_1.default.equal(workbench_entity_1.ROLE_BOOTSTRAP_CONFIGS['SUPER_ADMIN'], workbench_entity_1.SUPER_ADMIN_BOOTSTRAP);
        strict_1.default.equal(workbench_entity_1.ROLE_BOOTSTRAP_CONFIGS['OPERATIONS'], workbench_entity_1.OPERATIONS_BOOTSTRAP);
        strict_1.default.equal(workbench_entity_1.ROLE_BOOTSTRAP_CONFIGS['FINANCE'], workbench_entity_1.FINANCE_BOOTSTRAP);
        strict_1.default.equal(workbench_entity_1.ROLE_BOOTSTRAP_CONFIGS['WAREHOUSE'], workbench_entity_1.WAREHOUSE_BOOTSTRAP);
        strict_1.default.equal(workbench_entity_1.ROLE_BOOTSTRAP_CONFIGS['COACH'], workbench_entity_1.COACH_BOOTSTRAP);
    });
});
// =========================================================================
// Test 15: getRoleBootstrapConfig 边界
// =========================================================================
(0, node_test_1.describe)('getRoleBootstrapConfig 边界', () => {
    (0, node_test_1.default)('returns undefined for unknown role', () => {
        strict_1.default.equal((0, workbench_entity_1.getRoleBootstrapConfig)('GUIDE'), undefined);
        strict_1.default.equal((0, workbench_entity_1.getRoleBootstrapConfig)('CASHIER'), undefined);
        strict_1.default.equal((0, workbench_entity_1.getRoleBootstrapConfig)(''), undefined);
    });
    (0, node_test_1.default)('returns undefined for TENANT_ADMIN (不在新增5角色中)', () => {
        strict_1.default.equal((0, workbench_entity_1.getRoleBootstrapConfig)('TENANT_ADMIN'), undefined);
    });
});
// =========================================================================
// Test 16: NavItemPriority 枚举值
// =========================================================================
(0, node_test_1.describe)('NavItemPriority 枚举值', () => {
    (0, node_test_1.default)('has High/Medium/Low', () => {
        strict_1.default.equal(workbench_entity_1.NavItemPriority.High, 'HIGH');
        strict_1.default.equal(workbench_entity_1.NavItemPriority.Medium, 'MEDIUM');
        strict_1.default.equal(workbench_entity_1.NavItemPriority.Low, 'LOW');
    });
    (0, node_test_1.default)('all config nav items use valid priorities', () => {
        const valid = new Set(Object.values(workbench_entity_1.NavItemPriority));
        for (const config of Object.values(workbench_entity_1.ROLE_BOOTSTRAP_CONFIGS)) {
            for (const item of config.extendedNavItems) {
                strict_1.default.ok(valid.has(item.priority), `nav item "${item.key}" has valid priority (got ${item.priority})`);
            }
        }
    });
});
//# sourceMappingURL=workbench.role-extended.test.js.map