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
const domain_1 = require("@m5/domain");
const portal_entity_1 = require("./portal.entity");
function createTobPortal(overrides = {}) {
    return {
        audience: domain_1.PortalAudience.ToB,
        scopeType: domain_1.PortalScopeType.Tenant,
        scopeCode: 'tenant-demo',
        marketCode: 'cn-mainland',
        channel: domain_1.PortalChannel.Web,
        name: '测试租户 ToB 官网',
        primaryDomain: 'tenant-demo.cn-mainland.b2b.local',
        supportedLanguages: [domain_1.LanguageCode.ZhCn],
        heroTitle: '企业级经营门户',
        heroSubtitle: '品牌、门店、会员统一管理',
        solutionTags: ['多租户', '国际化'],
        loginEntry: {
            label: '进入后台',
            loginPath: '/cn-mainland/tenant-demo/login',
            ssoEnabled: true
        },
        tenantCode: 'tenant-demo',
        ...overrides
    };
}
function createStorePortal(overrides = {}) {
    return {
        audience: domain_1.PortalAudience.ToC,
        scopeType: domain_1.PortalScopeType.Store,
        scopeCode: 'store-001',
        marketCode: 'cn-mainland',
        channel: domain_1.PortalChannel.Web,
        name: 'store-001 门店门户',
        primaryDomain: 'store-001.cn-mainland.local',
        supportedLanguages: [domain_1.LanguageCode.ZhCn],
        supportedSurfaces: [
            domain_1.StorefrontSurface.OfficialSite,
            domain_1.StorefrontSurface.H5,
            domain_1.StorefrontSurface.MiniApp
        ],
        storeName: 'store-001 门店',
        tenantCode: 'tenant-demo',
        brandCode: 'brand-demo',
        storeCode: 'store-001',
        ...overrides
    };
}
(0, node_test_1.describe)('portal.entity: toPortalEntity', () => {
    (0, node_test_1.default)('converts TobPortal to PortalEntity with correct audience', () => {
        const portal = createTobPortal();
        const entity = (0, portal_entity_1.toPortalEntity)(portal, { id: 'p1', tenantId: 'tenant-demo' });
        strict_1.default.equal(entity.id, 'p1');
        strict_1.default.equal(entity.tenantId, 'tenant-demo');
        strict_1.default.equal(entity.audience, domain_1.PortalAudience.ToB);
        strict_1.default.equal(entity.scopeType, domain_1.PortalScopeType.Tenant);
        strict_1.default.equal(entity.scopeCode, 'tenant-demo');
        strict_1.default.equal(entity.marketCode, 'cn-mainland');
        strict_1.default.equal(entity.channel, domain_1.PortalChannel.Web);
        strict_1.default.equal(entity.name, '测试租户 ToB 官网');
    });
    (0, node_test_1.default)('converts TobPortal includes login entry and hero fields', () => {
        const portal = createTobPortal();
        const entity = (0, portal_entity_1.toPortalEntity)(portal, { id: 'p1', tenantId: 'tenant-demo' });
        strict_1.default.equal(entity.heroTitle, '企业级经营门户');
        strict_1.default.equal(entity.heroSubtitle, '品牌、门店、会员统一管理');
        strict_1.default.deepEqual(entity.solutionTags, ['多租户', '国际化']);
        strict_1.default.ok(entity.loginEntry);
        strict_1.default.equal(entity.loginEntry.ssoEnabled, true);
        strict_1.default.equal(entity.loginEntry.loginPath, '/cn-mainland/tenant-demo/login');
    });
    (0, node_test_1.default)('converts StorePortal to PortalEntity with ToC audience', () => {
        const portal = createStorePortal();
        const entity = (0, portal_entity_1.toPortalEntity)(portal, {
            id: 'p2',
            tenantId: 'tenant-demo',
            brandId: 'brand-demo',
            storeId: 'store-001'
        });
        strict_1.default.equal(entity.audience, domain_1.PortalAudience.ToC);
        strict_1.default.equal(entity.scopeType, domain_1.PortalScopeType.Store);
        strict_1.default.equal(entity.brandId, 'brand-demo');
        strict_1.default.equal(entity.storeId, 'store-001');
        strict_1.default.equal(entity.storeName, 'store-001 门店');
    });
    (0, node_test_1.default)('converts StorePortal includes supported surfaces', () => {
        const portal = createStorePortal();
        const entity = (0, portal_entity_1.toPortalEntity)(portal, { id: 'p2', tenantId: 'tenant-demo' });
        strict_1.default.ok(entity.supportedSurfaces);
        strict_1.default.ok(entity.supportedSurfaces.includes(domain_1.StorefrontSurface.OfficialSite));
        strict_1.default.ok(entity.supportedSurfaces.includes(domain_1.StorefrontSurface.H5));
        strict_1.default.ok(entity.supportedSurfaces.includes(domain_1.StorefrontSurface.MiniApp));
    });
    (0, node_test_1.default)('converts StorePortal has createdAt and updatedAt', () => {
        const portal = createStorePortal();
        const entity = (0, portal_entity_1.toPortalEntity)(portal, { id: 'p2', tenantId: 'tenant-demo' });
        strict_1.default.ok(entity.createdAt);
        strict_1.default.ok(entity.updatedAt);
        // Verify ISO format
        strict_1.default.ok(!isNaN(Date.parse(entity.createdAt)));
        strict_1.default.ok(!isNaN(Date.parse(entity.updatedAt)));
    });
    (0, node_test_1.default)('entity has primaryDomain from portal', () => {
        const portal = createTobPortal();
        const entity = (0, portal_entity_1.toPortalEntity)(portal, { id: 'p1', tenantId: 'tenant-demo' });
        strict_1.default.equal(entity.primaryDomain, 'tenant-demo.cn-mainland.b2b.local');
    });
});
(0, node_test_1.describe)('portal.entity: isTobPortalEntity', () => {
    (0, node_test_1.default)('returns true for ToB portal entity', () => {
        const portal = createTobPortal();
        const entity = (0, portal_entity_1.toPortalEntity)(portal, { id: 'p1', tenantId: 'tenant-demo' });
        strict_1.default.equal((0, portal_entity_1.isTobPortalEntity)(entity), true);
    });
    (0, node_test_1.default)('returns false for Store portal entity', () => {
        const portal = createStorePortal();
        const entity = (0, portal_entity_1.toPortalEntity)(portal, { id: 'p2', tenantId: 'tenant-demo' });
        strict_1.default.equal((0, portal_entity_1.isTobPortalEntity)(entity), false);
    });
});
(0, node_test_1.describe)('portal.entity: isStorePortalEntity', () => {
    (0, node_test_1.default)('returns true for Store portal entity', () => {
        const portal = createStorePortal();
        const entity = (0, portal_entity_1.toPortalEntity)(portal, { id: 'p2', tenantId: 'tenant-demo' });
        strict_1.default.equal((0, portal_entity_1.isStorePortalEntity)(entity), true);
    });
    (0, node_test_1.default)('returns false for ToB portal entity', () => {
        const portal = createTobPortal();
        const entity = (0, portal_entity_1.toPortalEntity)(portal, { id: 'p1', tenantId: 'tenant-demo' });
        strict_1.default.equal((0, portal_entity_1.isStorePortalEntity)(entity), false);
    });
});
(0, node_test_1.describe)('portal.entity: isSsoEnabled', () => {
    (0, node_test_1.default)('returns true when loginEntry has ssoEnabled=true', () => {
        const portal = createTobPortal();
        const entity = (0, portal_entity_1.toPortalEntity)(portal, { id: 'p1', tenantId: 'tenant-demo' });
        strict_1.default.equal((0, portal_entity_1.isSsoEnabled)(entity), true);
    });
    (0, node_test_1.default)('returns false when loginEntry has ssoEnabled=false', () => {
        const portal = createTobPortal({
            loginEntry: {
                label: '进入后台',
                loginPath: '/login',
                ssoEnabled: false
            }
        });
        const entity = (0, portal_entity_1.toPortalEntity)(portal, { id: 'p1', tenantId: 'tenant-demo' });
        strict_1.default.equal((0, portal_entity_1.isSsoEnabled)(entity), false);
    });
    (0, node_test_1.default)('returns false when loginEntry is undefined', () => {
        const storePortal = createStorePortal();
        const entity = (0, portal_entity_1.toPortalEntity)(storePortal, { id: 'p2', tenantId: 'tenant-demo' });
        strict_1.default.equal((0, portal_entity_1.isSsoEnabled)(entity), false);
    });
});
//# sourceMappingURL=portal.entity.test.js.map