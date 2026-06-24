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
// @ts-nocheck
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const domain_1 = require("@m5/domain");
const types_1 = require("@m5/types");
function mockMarketProfile(overrides = {}) {
    return {
        marketCode: 'zh-cn',
        marketName: '中国大陆',
        countryCode: 'CN',
        locale: { defaultLanguage: 'zh-CN', supportedLanguages: ['zh-CN', 'en-US'] },
        timezone: 'Asia/Shanghai',
        currency: 'CNY',
        tax: { taxMode: 'vat', taxRate: 13, taxLabel: 'VAT' },
        network: { networkRegion: 'cn-mainland', apiBaseUrl: 'https://api.example.com', cdnBaseUrl: 'https://cdn.example.com', callbackBaseUrl: 'https://cb.example.com' },
        email: { provider: 'ses', fromName: 'Test', fromAddress: 'no-reply@test.com', replyTo: 'no-reply@test.com' },
        social: { wechat: { appId: 'wx-test' } },
        ...overrides
    };
}
(0, node_test_1.describe)('WorkbenchService', () => {
    const { WorkbenchService } = require('./workbench.service');
    (0, node_test_1.describe)('getRoleWorkbenches', () => {
        (0, node_test_1.default)('returns 6 role workbenches', () => {
            const mockMarket = {};
            const mockPortal = {};
            const mockFoundation = { getDependencySummary: () => null };
            const service = new WorkbenchService(mockMarket, mockPortal, mockFoundation, {});
            const workbenches = service.getRoleWorkbenches();
            strict_1.default.equal(workbenches.length, 10);
        });
        (0, node_test_1.default)('uses shared default workbench registry as source of truth', () => {
            const mockMarket = {};
            const mockPortal = {};
            const mockFoundation = { getDependencySummary: () => null };
            const service = new WorkbenchService(mockMarket, mockPortal, mockFoundation, {});
            const workbenches = service.getRoleWorkbenches();
            strict_1.default.deepEqual(workbenches.map((item) => item.role), types_1.defaultRoleWorkbenchContracts.map((item) => item.role));
            strict_1.default.deepEqual(workbenches.find((item) => item.role === domain_1.UserRole.TenantAdmin)?.navItems.map((item) => item.key), types_1.defaultRoleWorkbenchContracts.find((item) => item.role === 'TENANT_ADMIN')?.navItems.map((item) => item.key));
        });
        (0, node_test_1.default)('each workbench has role, channel, title, description and navItems', () => {
            const mockMarket = {};
            const mockPortal = {};
            const mockFoundation = { getDependencySummary: () => null };
            const service = new WorkbenchService(mockMarket, mockPortal, mockFoundation, {});
            const workbenches = service.getRoleWorkbenches();
            for (const wb of workbenches) {
                strict_1.default.ok(wb.role, `workbench ${wb.title} missing role`);
                strict_1.default.ok(wb.channel, `workbench ${wb.title} missing channel`);
                strict_1.default.ok(wb.title, `workbench ${wb.title} missing title`);
                strict_1.default.ok(wb.description, `workbench ${wb.title} missing description`);
                strict_1.default.ok(Array.isArray(wb.navItems), `workbench ${wb.title} navItems is not an array`);
                strict_1.default.ok(wb.navItems.length > 0, `workbench ${wb.title} has empty navItems`);
            }
        });
        (0, node_test_1.default)('SuperAdmin workbench targets Pc channel with correct navItems', () => {
            const mockMarket = {};
            const mockPortal = {};
            const mockFoundation = { getDependencySummary: () => null };
            const service = new WorkbenchService(mockMarket, mockPortal, mockFoundation, {});
            const superAdmin = service.getRoleWorkbenches().find(wb => wb.role === domain_1.UserRole.SuperAdmin);
            strict_1.default.ok(superAdmin, 'SuperAdmin workbench not found');
            strict_1.default.equal(superAdmin.channel, domain_1.ClientChannel.Pc);
            strict_1.default.equal(superAdmin.title, '总部总控台');
            strict_1.default.ok(superAdmin.navItems.length >= 5, `SuperAdmin expects >= 5 navItems, got ${superAdmin.navItems.length}`);
            strict_1.default.deepStrictEqual(superAdmin.navItems.map(i => i.key).slice(0, 3), ['tenants', 'foundation', 'identity-access']);
        });
        (0, node_test_1.default)('Guide workbench targets Pad channel', () => {
            const mockMarket = {};
            const mockPortal = {};
            const mockFoundation = { getDependencySummary: () => null };
            const service = new WorkbenchService(mockMarket, mockPortal, mockFoundation, {});
            const guide = service.getRoleWorkbenches().find(wb => wb.role === domain_1.UserRole.Guide);
            strict_1.default.ok(guide, 'Guide workbench not found');
            strict_1.default.equal(guide.channel, domain_1.ClientChannel.Pad);
            strict_1.default.equal(guide.title, '导购工作台');
            strict_1.default.ok(guide.navItems.some(i => i.key === 'crm'));
            strict_1.default.ok(guide.navItems.some(i => i.key === 'promo'));
        });
        (0, node_test_1.default)('Cashier workbench has offline navItem for weak-network support', () => {
            const mockMarket = {};
            const mockPortal = {};
            const mockFoundation = { getDependencySummary: () => null };
            const service = new WorkbenchService(mockMarket, mockPortal, mockFoundation, {});
            const cashier = service.getRoleWorkbenches().find(wb => wb.role === domain_1.UserRole.Cashier);
            strict_1.default.ok(cashier, 'Cashier workbench not found');
            strict_1.default.equal(cashier.channel, domain_1.ClientChannel.Pad);
            strict_1.default.ok(cashier.navItems.some(i => i.key === 'offline'));
            strict_1.default.ok(cashier.navItems.some(i => i.key === 'checkout'));
        });
    });
    (0, node_test_1.describe)('getBootstrap', () => {
        (0, node_test_1.default)('returns workbench bootstrap with tenant context', () => {
            const mockMarket = {
                getMergedProfile: () => mockMarketProfile()
            };
            const mockPortal = {
                getBootstrap: () => ({
                    storePortal: { name: 'store' },
                    tenantPortal: {
                        name: 'tenant',
                        loginEntry: { loginPath: '/login', ssoEnabled: false }
                    },
                    brandPortal: { name: 'brand' }
                })
            };
            const mockFoundation = {
                getDependencySummary: () => ({
                    dependsOn: ['identity-access', 'configuration-governance'],
                    handoffContracts: ['workbench:v1']
                })
            };
            const service = new WorkbenchService(mockMarket, mockPortal, mockFoundation, {});
            const tenantContext = {
                tenantId: 't-workbench-1',
                brandId: 'b-wb-1',
                storeId: 's-wb-1',
                marketCode: 'zh-cn'
            };
            const result = service.getBootstrap(tenantContext);
            strict_1.default.equal(result.tenantContext.tenantId, 't-workbench-1');
            strict_1.default.equal(result.tenantContext.brandId, 'b-wb-1');
            strict_1.default.equal(result.tenantContext.storeId, 's-wb-1');
            strict_1.default.equal(result.tenantContext.marketCode, 'zh-cn');
        });
        (0, node_test_1.default)('returns 10 workbenches in bootstrap response', () => {
            const mockMarket = {
                getMergedProfile: () => mockMarketProfile()
            };
            const mockPortal = {
                getBootstrap: () => ({
                    storePortal: { name: 'store' },
                    tenantPortal: {
                        name: 'tenant',
                        loginEntry: { loginPath: '/login', ssoEnabled: true }
                    },
                    brandPortal: { name: 'brand' }
                })
            };
            const mockFoundation = {
                getDependencySummary: () => null
            };
            const service = new WorkbenchService(mockMarket, mockPortal, mockFoundation, {});
            const result = service.getBootstrap({ tenantId: 't-1' });
            strict_1.default.equal(result.workbenches.length, 10);
        });
        (0, node_test_1.default)('includes supportedLocales from market profile', () => {
            const mockMarket = {
                getMergedProfile: () => mockMarketProfile({ locale: { defaultLanguage: 'zh-CN', supportedLanguages: ['zh-CN', 'en-US', 'ja-JP'] } })
            };
            const mockPortal = {
                getBootstrap: () => ({
                    storePortal: {},
                    tenantPortal: { loginEntry: { loginPath: '/login', ssoEnabled: false } },
                    brandPortal: {}
                })
            };
            const mockFoundation = {
                getDependencySummary: () => null
            };
            const service = new WorkbenchService(mockMarket, mockPortal, mockFoundation, {});
            const result = service.getBootstrap({ tenantId: 't-1' });
            strict_1.default.deepStrictEqual(result.supportedLocales, ['zh-CN', 'en-US', 'ja-JP']);
        });
        (0, node_test_1.default)('regionalLoginPolicies derived from portal login entry', () => {
            const mockMarket = {
                getMergedProfile: () => mockMarketProfile()
            };
            const mockPortal = {
                getBootstrap: () => ({
                    storePortal: {},
                    tenantPortal: {
                        loginEntry: { loginPath: '/auth/sso', ssoEnabled: true }
                    },
                    brandPortal: {}
                })
            };
            const mockFoundation = {
                getDependencySummary: () => null
            };
            const service = new WorkbenchService(mockMarket, mockPortal, mockFoundation, {});
            const result = service.getBootstrap({ tenantId: 't-1' });
            strict_1.default.equal(result.regionalLoginPolicies.defaultLoginPath, '/auth/sso');
            strict_1.default.equal(result.regionalLoginPolicies.ssoEnabled, true);
        });
    });
});
//# sourceMappingURL=workbench.service.test.js.map