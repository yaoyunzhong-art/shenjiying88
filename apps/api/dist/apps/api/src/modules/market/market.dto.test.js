"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const domain_1 = require("@m5/domain");
(0, node_test_1.describe)('MarketDto', () => {
    // ── MarketProfileDto ────────────────────────────────────────────
    (0, node_test_1.describe)('MarketProfileDto', () => {
        (0, node_test_1.it)('should accept a valid CN market profile', () => {
            const dto = {
                marketCode: 'cn-mainland',
                marketName: '中国大陆',
                countryCode: domain_1.CountryCode.China,
                locale: {
                    defaultLanguage: domain_1.LanguageCode.ZhCn,
                    supportedLanguages: [domain_1.LanguageCode.ZhCn]
                },
                timezone: { timezone: 'Asia/Shanghai' },
                currency: { currencyCode: domain_1.CurrencyCode.Cny, symbol: '¥' },
                tax: { taxMode: domain_1.TaxMode.Included, taxRate: 6, taxLabel: '增值税' },
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
            };
            strict_1.default.equal(dto.marketCode, 'cn-mainland');
            strict_1.default.equal(dto.marketName, '中国大陆');
            strict_1.default.equal(dto.countryCode, domain_1.CountryCode.China);
            strict_1.default.equal(dto.locale.defaultLanguage, domain_1.LanguageCode.ZhCn);
            strict_1.default.equal(dto.currency.currencyCode, domain_1.CurrencyCode.Cny);
            strict_1.default.equal(dto.tax.taxRate, 6);
            strict_1.default.equal(dto.email.provider, domain_1.EmailProvider.AliyunDm);
            strict_1.default.equal(dto.social.primaryPlatforms.length, 2);
        });
        (0, node_test_1.it)('should accept a valid US market profile', () => {
            const dto = {
                marketCode: 'us-default',
                marketName: 'United States',
                countryCode: domain_1.CountryCode.UnitedStates,
                locale: {
                    defaultLanguage: domain_1.LanguageCode.EnUs,
                    supportedLanguages: [domain_1.LanguageCode.EnUs]
                },
                timezone: { timezone: 'America/New_York' },
                currency: { currencyCode: domain_1.CurrencyCode.Usd, symbol: '$' },
                tax: { taxMode: domain_1.TaxMode.Excluded, taxRate: 8.25, taxLabel: 'Sales Tax' },
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
                    supportPlatforms: [
                        domain_1.SocialPlatform.LinkedIn,
                        domain_1.SocialPlatform.Instagram,
                        domain_1.SocialPlatform.Facebook,
                        domain_1.SocialPlatform.X
                    ]
                }
            };
            strict_1.default.equal(dto.marketCode, 'us-default');
            strict_1.default.equal(dto.countryCode, domain_1.CountryCode.UnitedStates);
            strict_1.default.equal(dto.tax.taxRate, 8.25);
        });
    });
    // ── CreateMarketProfileDto ──────────────────────────────────────
    (0, node_test_1.describe)('CreateMarketProfileDto', () => {
        (0, node_test_1.it)('should accept a full create payload', () => {
            const dto = {
                marketCode: 'eu-default',
                marketName: 'Europe',
                countryCode: domain_1.CountryCode.UnitedStates,
                locale: {
                    defaultLanguage: domain_1.LanguageCode.EnUs,
                    supportedLanguages: [domain_1.LanguageCode.EnUs]
                },
                timezone: { timezone: 'Europe/London' },
                currency: { currencyCode: domain_1.CurrencyCode.Usd, symbol: '$' },
                tax: { taxMode: domain_1.TaxMode.Excluded, taxRate: 20, taxLabel: 'VAT' },
                network: {
                    networkRegion: domain_1.NetworkRegion.Global,
                    apiBaseUrl: 'https://eu-api.m5.local',
                    cdnBaseUrl: 'https://eu-cdn.m5.local',
                    callbackBaseUrl: 'https://eu-hooks.m5.local'
                },
                email: {
                    provider: domain_1.EmailProvider.Ses,
                    fromName: 'M5 Europe',
                    fromAddress: 'hello-eu@m5.local',
                    replyTo: 'support-eu@m5.local'
                },
                social: {
                    primaryPlatforms: [domain_1.SocialPlatform.X],
                    supportPlatforms: [domain_1.SocialPlatform.X, domain_1.SocialPlatform.Instagram]
                }
            };
            strict_1.default.equal(dto.marketCode, 'eu-default');
            strict_1.default.equal(dto.currency.currencyCode, domain_1.CurrencyCode.Usd);
        });
    });
    // ── UpdateMarketProfileDto (partial update) ─────────────────────
    (0, node_test_1.describe)('UpdateMarketProfileDto', () => {
        (0, node_test_1.it)('should accept an empty update (all optional)', () => {
            const dto = {};
            strict_1.default.ok(typeof dto !== 'undefined');
            strict_1.default.equal(dto.marketName, undefined);
            strict_1.default.equal(dto.locale, undefined);
        });
        (0, node_test_1.it)('should accept partial field update (marketName only)', () => {
            const dto = {
                marketName: '中国（更新版）'
            };
            strict_1.default.equal(dto.marketName, '中国（更新版）');
            strict_1.default.equal(dto.timezone, undefined);
            strict_1.default.equal(dto.currency, undefined);
        });
        (0, node_test_1.it)('should accept nested partial update (tax only)', () => {
            const dto = {
                tax: { taxMode: domain_1.TaxMode.Excluded, taxRate: 13, taxLabel: '增值税（新）' }
            };
            strict_1.default.ok(typeof dto.tax !== 'undefined');
            strict_1.default.equal(dto.tax.taxRate, 13);
            strict_1.default.equal(dto.tax.taxLabel, '增值税（新）');
        });
    });
    // ── ScopedMarketResponseDto ─────────────────────────────────────
    (0, node_test_1.describe)('ScopedMarketResponseDto', () => {
        (0, node_test_1.it)('should accept a scoped response payload', () => {
            const dto = {
                scopeType: 'tenant',
                scopeCode: 'tenant-demo',
                marketProfile: {
                    marketCode: 'cn-mainland',
                    marketName: '中国大陆',
                    countryCode: domain_1.CountryCode.China,
                    locale: {
                        defaultLanguage: domain_1.LanguageCode.ZhCn,
                        supportedLanguages: [domain_1.LanguageCode.ZhCn]
                    },
                    timezone: { timezone: 'Asia/Shanghai' },
                    currency: { currencyCode: domain_1.CurrencyCode.Cny, symbol: '¥' },
                    tax: { taxMode: domain_1.TaxMode.Included, taxRate: 6, taxLabel: '增值税' },
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
                }
            };
            strict_1.default.equal(dto.scopeType, 'tenant');
            strict_1.default.equal(dto.scopeCode, 'tenant-demo');
            strict_1.default.equal(dto.marketProfile.marketCode, 'cn-mainland');
        });
    });
    // ── 子 DTO 单元测试 ─────────────────────────────────────────────
    (0, node_test_1.describe)('MarketLocaleDto', () => {
        (0, node_test_1.it)('should accept valid locale', () => {
            const dto = {
                defaultLanguage: domain_1.LanguageCode.ZhCn,
                supportedLanguages: [domain_1.LanguageCode.ZhCn, domain_1.LanguageCode.EnUs]
            };
            strict_1.default.equal(dto.defaultLanguage, domain_1.LanguageCode.ZhCn);
            strict_1.default.equal(dto.supportedLanguages.length, 2);
        });
    });
    (0, node_test_1.describe)('MarketTimezoneDto', () => {
        (0, node_test_1.it)('should accept valid timezone', () => {
            const dto = { timezone: 'Europe/London' };
            strict_1.default.equal(dto.timezone, 'Europe/London');
        });
    });
    (0, node_test_1.describe)('MarketCurrencyDto', () => {
        (0, node_test_1.it)('should accept valid currency', () => {
            const dto = { currencyCode: domain_1.CurrencyCode.Usd, symbol: '$' };
            strict_1.default.equal(dto.currencyCode, domain_1.CurrencyCode.Usd);
            strict_1.default.equal(dto.symbol, '$');
        });
    });
    (0, node_test_1.describe)('MarketTaxDto', () => {
        (0, node_test_1.it)('should accept zero tax rate', () => {
            const dto = { taxMode: domain_1.TaxMode.Excluded, taxRate: 0, taxLabel: 'Tax Free' };
            strict_1.default.equal(dto.taxRate, 0);
        });
        (0, node_test_1.it)('should accept high tax rate', () => {
            const dto = { taxMode: domain_1.TaxMode.Included, taxRate: 25, taxLabel: 'VAT' };
            strict_1.default.equal(dto.taxRate, 25);
        });
    });
    (0, node_test_1.describe)('MarketNetworkDto', () => {
        (0, node_test_1.it)('should accept valid network config', () => {
            const dto = {
                networkRegion: domain_1.NetworkRegion.NorthAmerica,
                apiBaseUrl: 'https://api.example.com',
                cdnBaseUrl: 'https://cdn.example.com',
                callbackBaseUrl: 'https://hooks.example.com'
            };
            strict_1.default.equal(dto.networkRegion, domain_1.NetworkRegion.NorthAmerica);
            strict_1.default.equal(dto.apiBaseUrl, 'https://api.example.com');
        });
    });
    (0, node_test_1.describe)('MarketEmailDto', () => {
        (0, node_test_1.it)('should accept valid email config', () => {
            const dto = {
                provider: domain_1.EmailProvider.SendGrid,
                fromName: 'Test',
                fromAddress: 'test@test.com',
                replyTo: 'reply@test.com'
            };
            strict_1.default.equal(dto.provider, domain_1.EmailProvider.SendGrid);
            strict_1.default.equal(dto.fromAddress, 'test@test.com');
        });
    });
    (0, node_test_1.describe)('MarketSocialDto', () => {
        (0, node_test_1.it)('should accept valid social config', () => {
            const dto = {
                primaryPlatforms: [domain_1.SocialPlatform.Wechat],
                supportPlatforms: [domain_1.SocialPlatform.Wechat, domain_1.SocialPlatform.Douyin]
            };
            strict_1.default.equal(dto.primaryPlatforms.length, 1);
            strict_1.default.equal(dto.supportPlatforms.length, 2);
        });
    });
});
//# sourceMappingURL=market.dto.test.js.map