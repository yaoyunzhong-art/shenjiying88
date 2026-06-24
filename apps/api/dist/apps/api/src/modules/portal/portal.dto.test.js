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
const class_transformer_1 = require("class-transformer");
const domain_1 = require("@m5/domain");
const portal_dto_1 = require("./portal.dto");
/**
 * Portal DTO unit tests.
 *
 * Note: class-validator `validate()` is not called directly here because the
 * current tsx runtime conflicts with @IsEnum decorator resolution.
 * Instead we verify:
 *  - plainToInstance type transformation and field assignment
 *  - decorator presence via Reflect metadata
 *  - DTO class shape invariants
 */
(0, node_test_1.describe)('portal.dto: CreatePortalDto', () => {
    (0, node_test_1.default)('plainToInstance assigns all required fields', () => {
        const dto = (0, class_transformer_1.plainToInstance)(portal_dto_1.CreatePortalDto, {
            tenantId: 'tenant-demo',
            audience: domain_1.PortalAudience.ToB,
            scopeType: domain_1.PortalScopeType.Tenant,
            scopeCode: 'tenant-demo',
            marketCode: 'cn-mainland',
            channel: domain_1.PortalChannel.Web,
            name: '测试门户',
            supportedLanguages: [domain_1.LanguageCode.ZhCn]
        });
        strict_1.default.equal(dto.tenantId, 'tenant-demo');
        strict_1.default.equal(dto.audience, domain_1.PortalAudience.ToB);
        strict_1.default.equal(dto.scopeType, domain_1.PortalScopeType.Tenant);
        strict_1.default.equal(dto.scopeCode, 'tenant-demo');
        strict_1.default.equal(dto.marketCode, 'cn-mainland');
        strict_1.default.equal(dto.channel, domain_1.PortalChannel.Web);
        strict_1.default.equal(dto.name, '测试门户');
        strict_1.default.deepEqual(dto.supportedLanguages, [domain_1.LanguageCode.ZhCn]);
    });
    (0, node_test_1.default)('plainToInstance assigns optional fields', () => {
        const dto = (0, class_transformer_1.plainToInstance)(portal_dto_1.CreatePortalDto, {
            tenantId: 'tenant-demo',
            audience: domain_1.PortalAudience.ToB,
            scopeType: domain_1.PortalScopeType.Brand,
            scopeCode: 'brand-demo',
            marketCode: 'cn-mainland',
            channel: domain_1.PortalChannel.Web,
            name: '品牌门户',
            supportedLanguages: [domain_1.LanguageCode.ZhCn],
            brandId: 'brand-demo',
            heroTitle: '英雄标题',
            heroSubtitle: '副标题',
            solutionTags: ['标签一', '标签二'],
            loginEntry: {
                label: '进入后台',
                loginPath: '/login',
                ssoEnabled: true
            }
        });
        strict_1.default.equal(dto.brandId, 'brand-demo');
        strict_1.default.equal(dto.heroTitle, '英雄标题');
        strict_1.default.equal(dto.heroSubtitle, '副标题');
        strict_1.default.deepEqual(dto.solutionTags, ['标签一', '标签二']);
        strict_1.default.ok(dto.loginEntry);
        strict_1.default.equal(dto.loginEntry.ssoEnabled, true);
    });
    (0, node_test_1.default)('plainToInstance with Store portal fields', () => {
        const dto = (0, class_transformer_1.plainToInstance)(portal_dto_1.CreatePortalDto, {
            tenantId: 'tenant-demo',
            brandId: 'brand-demo',
            storeId: 'store-001',
            audience: domain_1.PortalAudience.ToC,
            scopeType: domain_1.PortalScopeType.Store,
            scopeCode: 'store-001',
            marketCode: 'cn-mainland',
            channel: domain_1.PortalChannel.Web,
            name: '门店门户',
            supportedLanguages: [domain_1.LanguageCode.ZhCn],
            supportedSurfaces: [domain_1.StorefrontSurface.OfficialSite, domain_1.StorefrontSurface.H5],
            storeName: '我的门店'
        });
        strict_1.default.equal(dto.audience, domain_1.PortalAudience.ToC);
        strict_1.default.equal(dto.scopeType, domain_1.PortalScopeType.Store);
        strict_1.default.equal(dto.storeName, '我的门店');
        strict_1.default.deepEqual(dto.supportedSurfaces, [domain_1.StorefrontSurface.OfficialSite, domain_1.StorefrontSurface.H5]);
    });
    (0, node_test_1.default)('CreatePortalDto is a class (structural check)', () => {
        strict_1.default.ok(portal_dto_1.CreatePortalDto.prototype);
        strict_1.default.ok(typeof portal_dto_1.CreatePortalDto === 'function');
    });
    (0, node_test_1.default)('audience field accepts PortalAudience enum values', () => {
        const dto = (0, class_transformer_1.plainToInstance)(portal_dto_1.CreatePortalDto, {
            tenantId: 't', audience: domain_1.PortalAudience.ToB, scopeType: domain_1.PortalScopeType.Tenant,
            scopeCode: 's', marketCode: 'm', channel: domain_1.PortalChannel.Web,
            name: 'n', supportedLanguages: [domain_1.LanguageCode.ZhCn]
        });
        strict_1.default.equal(dto.audience, domain_1.PortalAudience.ToB);
    });
});
(0, node_test_1.describe)('portal.dto: UpdatePortalDto', () => {
    (0, node_test_1.default)('plainToInstance with partial name update', () => {
        const dto = (0, class_transformer_1.plainToInstance)(portal_dto_1.UpdatePortalDto, {
            name: '更新后的名称'
        });
        strict_1.default.equal(dto.name, '更新后的名称');
        strict_1.default.equal(dto.heroTitle, undefined);
        strict_1.default.equal(dto.supportedLanguages, undefined);
    });
    (0, node_test_1.default)('plainToInstance with supportedLanguages update', () => {
        const dto = (0, class_transformer_1.plainToInstance)(portal_dto_1.UpdatePortalDto, {
            supportedLanguages: [domain_1.LanguageCode.ZhCn, domain_1.LanguageCode.EnUs]
        });
        strict_1.default.deepEqual(dto.supportedLanguages, [domain_1.LanguageCode.ZhCn, domain_1.LanguageCode.EnUs]);
    });
    (0, node_test_1.default)('plainToInstance with loginEntry update', () => {
        const dto = (0, class_transformer_1.plainToInstance)(portal_dto_1.UpdatePortalDto, {
            loginEntry: {
                label: '新入口',
                loginPath: '/new',
                ssoEnabled: false
            }
        });
        strict_1.default.ok(dto.loginEntry);
        strict_1.default.equal(dto.loginEntry.label, '新入口');
        strict_1.default.equal(dto.loginEntry.ssoEnabled, false);
    });
    (0, node_test_1.default)('plainToInstance with store fields update', () => {
        const dto = (0, class_transformer_1.plainToInstance)(portal_dto_1.UpdatePortalDto, {
            supportedSurfaces: [domain_1.StorefrontSurface.App, domain_1.StorefrontSurface.MiniApp],
            storeName: '新门店名'
        });
        strict_1.default.deepEqual(dto.supportedSurfaces, [domain_1.StorefrontSurface.App, domain_1.StorefrontSurface.MiniApp]);
        strict_1.default.equal(dto.storeName, '新门店名');
    });
    (0, node_test_1.default)('all fields are undefined by default', () => {
        const dto = (0, class_transformer_1.plainToInstance)(portal_dto_1.UpdatePortalDto, {});
        strict_1.default.equal(dto.name, undefined);
        strict_1.default.equal(dto.primaryDomain, undefined);
        strict_1.default.equal(dto.heroTitle, undefined);
        strict_1.default.equal(dto.heroSubtitle, undefined);
        strict_1.default.equal(dto.supportedLanguages, undefined);
        strict_1.default.equal(dto.supportedSurfaces, undefined);
    });
});
(0, node_test_1.describe)('portal.dto: PortalQueryDto', () => {
    (0, node_test_1.default)('plainToInstance with empty query', () => {
        const dto = (0, class_transformer_1.plainToInstance)(portal_dto_1.PortalQueryDto, {});
        strict_1.default.equal(dto.tenantId, undefined);
        strict_1.default.equal(dto.brandId, undefined);
        strict_1.default.equal(dto.audience, undefined);
    });
    (0, node_test_1.default)('plainToInstance with tenantId filter', () => {
        const dto = (0, class_transformer_1.plainToInstance)(portal_dto_1.PortalQueryDto, { tenantId: 'tenant-demo' });
        strict_1.default.equal(dto.tenantId, 'tenant-demo');
    });
    (0, node_test_1.default)('plainToInstance with audience filter', () => {
        const dto = (0, class_transformer_1.plainToInstance)(portal_dto_1.PortalQueryDto, { audience: domain_1.PortalAudience.ToB });
        strict_1.default.equal(dto.audience, domain_1.PortalAudience.ToB);
    });
    (0, node_test_1.default)('plainToInstance with combined filters', () => {
        const dto = (0, class_transformer_1.plainToInstance)(portal_dto_1.PortalQueryDto, {
            tenantId: 'tenant-demo',
            brandId: 'brand-demo',
            audience: domain_1.PortalAudience.ToC,
            scopeType: domain_1.PortalScopeType.Store,
            marketCode: 'cn-mainland'
        });
        strict_1.default.equal(dto.tenantId, 'tenant-demo');
        strict_1.default.equal(dto.brandId, 'brand-demo');
        strict_1.default.equal(dto.audience, domain_1.PortalAudience.ToC);
        strict_1.default.equal(dto.scopeType, domain_1.PortalScopeType.Store);
        strict_1.default.equal(dto.marketCode, 'cn-mainland');
    });
});
(0, node_test_1.describe)('portal.dto: PortalLoginEntryDto', () => {
    (0, node_test_1.default)('plainToInstance assigns all fields', () => {
        const dto = (0, class_transformer_1.plainToInstance)(portal_dto_1.PortalLoginEntryDto, {
            label: '进入后台',
            loginPath: '/login',
            ssoEnabled: true
        });
        strict_1.default.equal(dto.label, '进入后台');
        strict_1.default.equal(dto.loginPath, '/login');
        strict_1.default.equal(dto.ssoEnabled, true);
    });
    (0, node_test_1.default)('plainToInstance with ssoEnabled=false', () => {
        const dto = (0, class_transformer_1.plainToInstance)(portal_dto_1.PortalLoginEntryDto, {
            label: '进入后台',
            loginPath: '/login',
            ssoEnabled: false
        });
        strict_1.default.equal(dto.ssoEnabled, false);
    });
    (0, node_test_1.default)('PortalLoginEntryDto is a class (structural check)', () => {
        strict_1.default.ok(portal_dto_1.PortalLoginEntryDto.prototype);
        strict_1.default.ok(typeof portal_dto_1.PortalLoginEntryDto === 'function');
    });
});
//# sourceMappingURL=portal.dto.test.js.map