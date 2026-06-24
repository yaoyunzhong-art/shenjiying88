"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortalService = void 0;
const common_1 = require("@nestjs/common");
const domain_1 = require("@m5/domain");
const bootstrap_contract_1 = require("../bootstrap/bootstrap.contract");
const foundation_service_1 = require("../foundation/foundation.service");
const market_service_1 = require("../market/market.service");
const market_contract_1 = require("../market/market.contract");
const portal_contract_1 = require("./portal.contract");
let PortalService = class PortalService {
    marketService;
    foundationService;
    constructor(marketService, foundationService) {
        this.marketService = marketService;
        this.foundationService = foundationService;
    }
    resolveTenantPortal(context) {
        const marketProfile = this.marketService.getMergedProfile(context);
        return {
            audience: domain_1.PortalAudience.ToB,
            scopeType: domain_1.PortalScopeType.Tenant,
            scopeCode: context.tenantId,
            tenantCode: context.tenantId,
            marketCode: marketProfile.marketCode,
            channel: domain_1.PortalChannel.Web,
            name: `${context.tenantId} ToB 官网`,
            primaryDomain: `${context.tenantId}.${marketProfile.marketCode}.b2b.local`,
            supportedLanguages: marketProfile.locale.supportedLanguages,
            heroTitle: `${context.tenantId} 企业级经营门户`,
            heroSubtitle: '覆盖品牌、门店、会员、营销、赛事、财务与全球化配置的统一 SaaS 官网。',
            solutionTags: ['多租户', '多端门户', '国际化配置', '门店运营'],
            loginEntry: {
                label: '进入租户后台',
                loginPath: `/${marketProfile.marketCode}/${context.tenantId}/login`,
                ssoEnabled: true
            }
        };
    }
    resolveBrandPortal(context) {
        const brandCode = context.brandId ?? 'brand-demo';
        const marketProfile = this.marketService.getMergedProfile(context);
        return {
            audience: domain_1.PortalAudience.ToB,
            scopeType: domain_1.PortalScopeType.Brand,
            scopeCode: brandCode,
            tenantCode: context.tenantId,
            brandCode,
            marketCode: marketProfile.marketCode,
            channel: domain_1.PortalChannel.Web,
            name: `${brandCode} 品牌 ToB 官网`,
            primaryDomain: `${brandCode}.${context.tenantId}.${marketProfile.marketCode}.b2b.local`,
            supportedLanguages: marketProfile.locale.supportedLanguages,
            heroTitle: `${brandCode} 品牌经营官网`,
            heroSubtitle: '面向品牌招商、加盟合作、渠道拓展、品牌能力展示和后台登录入口。',
            solutionTags: ['品牌招商', '品牌后台', '国际品牌站', '邮件与社媒触点'],
            loginEntry: {
                label: '进入品牌后台',
                loginPath: `/${marketProfile.marketCode}/${context.tenantId}/${brandCode}/login`,
                ssoEnabled: true
            }
        };
    }
    resolveStorePortal(context) {
        const brandCode = context.brandId ?? 'brand-demo';
        const storeCode = context.storeId ?? 'store-001';
        const marketProfile = this.marketService.getMergedProfile(context);
        return {
            audience: domain_1.PortalAudience.ToC,
            scopeType: domain_1.PortalScopeType.Store,
            scopeCode: storeCode,
            tenantCode: context.tenantId,
            brandCode,
            storeCode,
            storeName: `${storeCode} 门店`,
            marketCode: marketProfile.marketCode,
            channel: domain_1.PortalChannel.Web,
            name: `${storeCode} 门店门户`,
            primaryDomain: `${storeCode}.${brandCode}.${context.tenantId}.${marketProfile.marketCode}.local`,
            supportedLanguages: marketProfile.marketCode === 'cn-mainland' ? [domain_1.LanguageCode.ZhCn] : [domain_1.LanguageCode.EnUs],
            supportedSurfaces: [
                domain_1.StorefrontSurface.OfficialSite,
                domain_1.StorefrontSurface.H5,
                domain_1.StorefrontSurface.MiniApp,
                domain_1.StorefrontSurface.App,
                domain_1.StorefrontSurface.PcConsole,
                domain_1.StorefrontSurface.PadConsole
            ]
        };
    }
    getBootstrap(context) {
        const foundationDependency = this.foundationService.getDependencySummary('portal');
        const marketProfile = this.marketService.getMergedProfile(context);
        const tenantPortal = this.resolveTenantPortal(context);
        const brandPortal = this.resolveBrandPortal(context);
        const storePortal = this.resolveStorePortal(context);
        return {
            tenantPortal: (0, portal_contract_1.toTobPortalContract)(tenantPortal),
            brandPortal: (0, portal_contract_1.toTobPortalContract)(brandPortal),
            storePortal: (0, portal_contract_1.toStorePortalContract)(storePortal),
            marketProfile: (0, market_contract_1.toMarketProfileContract)(marketProfile),
            regionalOverrides: this.marketService.getOverrides(context).map(market_contract_1.toRegionalConfigOverrideContract),
            ...(0, bootstrap_contract_1.toBootstrapFoundationMetadata)(foundationDependency)
        };
    }
};
exports.PortalService = PortalService;
exports.PortalService = PortalService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [market_service_1.MarketService,
        foundation_service_1.FoundationService])
], PortalService);
//# sourceMappingURL=portal.service.js.map