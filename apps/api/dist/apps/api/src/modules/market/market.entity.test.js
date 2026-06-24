"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const domain_1 = require("@m5/domain");
(0, node_test_1.describe)('MarketProfile (entity)', () => {
    const createCNMarket = () => ({
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
    });
    const createUSMarket = () => ({
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
    });
    // ── 正例 ────────────────────────────────────────────────────────
    (0, node_test_1.it)('should create a valid CN market profile', () => {
        const profile = createCNMarket();
        strict_1.default.equal(profile.marketCode, 'cn-mainland');
        strict_1.default.equal(profile.countryCode, domain_1.CountryCode.China);
        strict_1.default.equal(profile.locale.defaultLanguage, domain_1.LanguageCode.ZhCn);
        strict_1.default.equal(profile.currency.symbol, '¥');
        strict_1.default.equal(profile.tax.taxMode, domain_1.TaxMode.Included);
        strict_1.default.equal(profile.network.networkRegion, domain_1.NetworkRegion.MainlandChina);
        strict_1.default.equal(profile.email.provider, domain_1.EmailProvider.AliyunDm);
        strict_1.default.ok(profile.social.primaryPlatforms.includes(domain_1.SocialPlatform.Wechat));
    });
    (0, node_test_1.it)('should create a valid US market profile', () => {
        const profile = createUSMarket();
        strict_1.default.equal(profile.marketCode, 'us-default');
        strict_1.default.equal(profile.countryCode, domain_1.CountryCode.UnitedStates);
        strict_1.default.equal(profile.locale.defaultLanguage, domain_1.LanguageCode.EnUs);
        strict_1.default.equal(profile.currency.symbol, '$');
        strict_1.default.equal(profile.tax.taxMode, domain_1.TaxMode.Excluded);
        strict_1.default.equal(profile.network.networkRegion, domain_1.NetworkRegion.NorthAmerica);
        strict_1.default.equal(profile.email.provider, domain_1.EmailProvider.SendGrid);
        strict_1.default.ok(profile.social.supportPlatforms.includes(domain_1.SocialPlatform.Facebook));
    });
    (0, node_test_1.it)('should support multiple supported languages', () => {
        const profile = createCNMarket();
        profile.locale.supportedLanguages = [domain_1.LanguageCode.ZhCn, domain_1.LanguageCode.EnUs];
        strict_1.default.equal(profile.locale.supportedLanguages.length, 2);
        strict_1.default.ok(profile.locale.supportedLanguages.includes(domain_1.LanguageCode.ZhCn));
        strict_1.default.ok(profile.locale.supportedLanguages.includes(domain_1.LanguageCode.EnUs));
    });
    // ── 边界 ────────────────────────────────────────────────────────
    (0, node_test_1.it)('should handle zero tax rate', () => {
        const profile = createCNMarket();
        profile.tax.taxRate = 0;
        strict_1.default.equal(profile.tax.taxRate, 0);
    });
    (0, node_test_1.it)('should handle empty social platforms', () => {
        const profile = createCNMarket();
        profile.social.primaryPlatforms = [];
        profile.social.supportPlatforms = [];
        strict_1.default.equal(profile.social.primaryPlatforms.length, 0);
        strict_1.default.equal(profile.social.supportPlatforms.length, 0);
    });
    (0, node_test_1.it)('should be structurally assignable across markets', () => {
        const cn = createCNMarket();
        const us = createUSMarket();
        const merged = { ...us, locale: cn.locale, timezone: cn.timezone };
        strict_1.default.equal(merged.locale.defaultLanguage, domain_1.LanguageCode.ZhCn);
        strict_1.default.equal(merged.timezone.timezone, 'Asia/Shanghai');
        strict_1.default.equal(merged.currency.currencyCode, domain_1.CurrencyCode.Usd);
    });
    // ── 子 Entity 单元 ──────────────────────────────────────────────
    (0, node_test_1.it)('MarketLocale should have expected shape', () => {
        const locale = { defaultLanguage: domain_1.LanguageCode.ZhCn, supportedLanguages: [domain_1.LanguageCode.ZhCn] };
        strict_1.default.ok(typeof locale !== 'undefined');
        strict_1.default.equal(typeof locale.defaultLanguage, 'string');
        strict_1.default.equal(Array.isArray(locale.supportedLanguages), true);
    });
    (0, node_test_1.it)('MarketTimezone should have expected shape', () => {
        const tz = { timezone: 'Asia/Tokyo' };
        strict_1.default.equal(tz.timezone, 'Asia/Tokyo');
    });
    (0, node_test_1.it)('MarketCurrency should have expected shape', () => {
        const currency = { currencyCode: domain_1.CurrencyCode.Usd, symbol: '$' };
        strict_1.default.equal(currency.currencyCode, domain_1.CurrencyCode.Usd);
        strict_1.default.equal(currency.symbol, '$');
    });
    (0, node_test_1.it)('MarketTax should have expected shape', () => {
        const tax = { taxMode: domain_1.TaxMode.Included, taxRate: 10, taxLabel: '消费税' };
        strict_1.default.equal(tax.taxRate, 10);
        strict_1.default.equal(tax.taxLabel, '消费税');
    });
    (0, node_test_1.it)('MarketNetwork should have expected shape', () => {
        const net = {
            networkRegion: domain_1.NetworkRegion.NorthAmerica,
            apiBaseUrl: 'https://api.example.com',
            cdnBaseUrl: 'https://cdn.example.com',
            callbackBaseUrl: 'https://hooks.example.com'
        };
        strict_1.default.equal(net.networkRegion, domain_1.NetworkRegion.NorthAmerica);
        strict_1.default.equal(net.apiBaseUrl, 'https://api.example.com');
    });
    (0, node_test_1.it)('MarketEmail should have expected shape', () => {
        const email = {
            provider: domain_1.EmailProvider.SendGrid,
            fromName: 'Test',
            fromAddress: 'test@test.com',
            replyTo: 'reply@test.com'
        };
        strict_1.default.equal(email.provider, domain_1.EmailProvider.SendGrid);
        strict_1.default.equal(email.fromName, 'Test');
    });
    (0, node_test_1.it)('MarketSocial should support mixed platforms', () => {
        const social = {
            primaryPlatforms: [domain_1.SocialPlatform.Wechat],
            supportPlatforms: [domain_1.SocialPlatform.Wechat, domain_1.SocialPlatform.Douyin, domain_1.SocialPlatform.Xiaohongshu]
        };
        strict_1.default.equal(social.primaryPlatforms.length, 1);
        strict_1.default.equal(social.supportPlatforms.length, 3);
        strict_1.default.ok(social.supportPlatforms.includes(domain_1.SocialPlatform.Wechat));
    });
});
//# sourceMappingURL=market.entity.test.js.map