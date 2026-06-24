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
exports.MarketService = void 0;
const common_1 = require("@nestjs/common");
const domain_1 = require("@m5/domain");
const bootstrap_contract_1 = require("../bootstrap/bootstrap.contract");
const foundation_service_1 = require("../foundation/foundation.service");
const market_contract_1 = require("./market.contract");
let MarketService = class MarketService {
    foundationService;
    constructor(foundationService) {
        this.foundationService = foundationService;
    }
    marketProfiles = [
        {
            marketCode: 'cn-mainland',
            marketName: '中国大陆',
            countryCode: domain_1.CountryCode.China,
            locale: {
                defaultLanguage: domain_1.LanguageCode.ZhCn,
                supportedLanguages: [domain_1.LanguageCode.ZhCn]
            },
            timezone: {
                timezone: 'Asia/Shanghai'
            },
            currency: {
                currencyCode: domain_1.CurrencyCode.Cny,
                symbol: '¥'
            },
            tax: {
                taxMode: domain_1.TaxMode.Included,
                taxRate: 6,
                taxLabel: '增值税'
            },
            network: {
                networkRegion: domain_1.NetworkRegion.MainlandChina,
                apiBaseUrl: 'https://cn-api.m5.local',
                cdnBaseUrl: 'https://cn-cdn.m5.local',
                callbackBaseUrl: 'https://cn-hooks.m5.local'
            },
            email: {
                provider: domain_1.EmailProvider.AliyunDm,
                fromName: 'M5 China',
                fromAddress: 'hello-cn@m5.local',
                replyTo: 'support-cn@m5.local'
            },
            social: {
                primaryPlatforms: [domain_1.SocialPlatform.Wechat, domain_1.SocialPlatform.Xiaohongshu],
                supportPlatforms: [domain_1.SocialPlatform.Wechat, domain_1.SocialPlatform.Weibo, domain_1.SocialPlatform.Douyin]
            }
        },
        {
            marketCode: 'us-default',
            marketName: 'United States',
            countryCode: domain_1.CountryCode.UnitedStates,
            locale: {
                defaultLanguage: domain_1.LanguageCode.EnUs,
                supportedLanguages: [domain_1.LanguageCode.EnUs]
            },
            timezone: {
                timezone: 'America/New_York'
            },
            currency: {
                currencyCode: domain_1.CurrencyCode.Usd,
                symbol: '$'
            },
            tax: {
                taxMode: domain_1.TaxMode.Excluded,
                taxRate: 8.25,
                taxLabel: 'Sales Tax'
            },
            network: {
                networkRegion: domain_1.NetworkRegion.NorthAmerica,
                apiBaseUrl: 'https://us-api.m5.local',
                cdnBaseUrl: 'https://us-cdn.m5.local',
                callbackBaseUrl: 'https://us-hooks.m5.local'
            },
            email: {
                provider: domain_1.EmailProvider.SendGrid,
                fromName: 'M5 US',
                fromAddress: 'hello-us@m5.local',
                replyTo: 'support-us@m5.local'
            },
            social: {
                primaryPlatforms: [domain_1.SocialPlatform.LinkedIn, domain_1.SocialPlatform.Instagram],
                supportPlatforms: [domain_1.SocialPlatform.LinkedIn, domain_1.SocialPlatform.Instagram, domain_1.SocialPlatform.Facebook, domain_1.SocialPlatform.X]
            }
        }
    ];
    getBootstrap() {
        const foundationDependency = this.foundationService.getDependencySummary('market');
        return {
            defaultDomesticMarketCode: 'cn-mainland',
            defaultInternationalMarketCode: 'us-default',
            supportedMarkets: this.marketProfiles.map(market_contract_1.toMarketProfileContract),
            ...(0, bootstrap_contract_1.toBootstrapFoundationMetadata)(foundationDependency)
        };
    }
    getByMarketCode(marketCode) {
        const matched = this.marketProfiles.find((market) => market.marketCode === marketCode);
        const defaultInternational = this.marketProfiles.find((market) => market.marketCode === 'us-default');
        const fallback = this.marketProfiles[0];
        if (matched) {
            return matched;
        }
        if (defaultInternational) {
            return defaultInternational;
        }
        if (fallback) {
            return fallback;
        }
        throw new Error('No market profiles configured');
    }
    getOverrides(context) {
        const marketCode = context.marketCode ?? 'us-default';
        return [
            {
                scopeType: domain_1.PortalScopeType.Tenant,
                scopeCode: context.tenantId,
                inheritanceMode: domain_1.ConfigInheritanceMode.TenantDefault,
                marketCode,
                email: {
                    fromName: `${context.tenantId} HQ`
                }
            },
            {
                scopeType: domain_1.PortalScopeType.Brand,
                scopeCode: context.brandId ?? 'brand-demo',
                inheritanceMode: domain_1.ConfigInheritanceMode.BrandOverride,
                marketCode,
                social: {
                    primaryPlatforms: marketCode === 'cn-mainland'
                        ? [domain_1.SocialPlatform.Wechat, domain_1.SocialPlatform.Douyin]
                        : [domain_1.SocialPlatform.LinkedIn, domain_1.SocialPlatform.Instagram]
                }
            },
            {
                scopeType: domain_1.PortalScopeType.Store,
                scopeCode: context.storeId ?? 'store-001',
                inheritanceMode: domain_1.ConfigInheritanceMode.StoreOverride,
                marketCode,
                timezone: {
                    timezone: marketCode === 'cn-mainland' ? 'Asia/Shanghai' : 'America/Los_Angeles'
                }
            }
        ];
    }
    getMergedProfile(context) {
        const baseProfile = this.getByMarketCode(context.marketCode);
        const overrides = this.getOverrides(context);
        return overrides.reduce((acc, override) => {
            return {
                ...acc,
                locale: { ...acc.locale, ...(override.locale ?? {}) },
                timezone: { ...acc.timezone, ...(override.timezone ?? {}) },
                currency: { ...acc.currency, ...(override.currency ?? {}) },
                tax: { ...acc.tax, ...(override.tax ?? {}) },
                network: { ...acc.network, ...(override.network ?? {}) },
                email: { ...acc.email, ...(override.email ?? {}) },
                social: { ...acc.social, ...(override.social ?? {}) }
            };
        }, baseProfile);
    }
};
exports.MarketService = MarketService;
exports.MarketService = MarketService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [foundation_service_1.FoundationService])
], MarketService);
//# sourceMappingURL=market.service.js.map