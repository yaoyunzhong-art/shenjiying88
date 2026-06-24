"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toMarketProfileContract = toMarketProfileContract;
exports.toRegionalConfigOverrideContract = toRegionalConfigOverrideContract;
function toMarketProfileContract(profile) {
    return {
        marketCode: profile.marketCode,
        marketName: profile.marketName,
        countryCode: profile.countryCode,
        locale: {
            defaultLanguage: profile.locale.defaultLanguage,
            supportedLanguages: profile.locale.supportedLanguages
        },
        timezone: profile.timezone,
        currency: profile.currency,
        tax: {
            taxMode: profile.tax.taxMode,
            taxRate: profile.tax.taxRate ?? 0,
            taxLabel: profile.tax.taxLabel
        },
        network: {
            networkRegion: profile.network.networkRegion,
            apiBaseUrl: profile.network.apiBaseUrl,
            cdnBaseUrl: profile.network.cdnBaseUrl,
            callbackBaseUrl: profile.network.callbackBaseUrl ?? profile.network.apiBaseUrl
        },
        email: {
            provider: profile.email.provider,
            fromName: profile.email.fromName,
            fromAddress: profile.email.fromAddress,
            replyTo: profile.email.replyTo ?? profile.email.fromAddress
        },
        social: profile.social
    };
}
function toRegionalConfigOverrideContract(override) {
    return {
        scopeType: override.scopeType,
        scopeCode: override.scopeCode,
        inheritanceMode: override.inheritanceMode,
        marketCode: override.marketCode,
        ...(override.locale
            ? {
                locale: {
                    ...(override.locale.defaultLanguage ? { defaultLanguage: override.locale.defaultLanguage } : {}),
                    ...(override.locale.supportedLanguages ? { supportedLanguages: override.locale.supportedLanguages } : {})
                }
            }
            : {}),
        ...(override.timezone ? { timezone: { ...(override.timezone.timezone ? { timezone: override.timezone.timezone } : {}) } } : {}),
        ...(override.currency
            ? {
                currency: {
                    ...(override.currency.currencyCode ? { currencyCode: override.currency.currencyCode } : {}),
                    ...(override.currency.symbol ? { symbol: override.currency.symbol } : {})
                }
            }
            : {}),
        ...(override.tax
            ? {
                tax: {
                    ...(override.tax.taxMode ? { taxMode: override.tax.taxMode } : {}),
                    ...(override.tax.taxRate !== undefined ? { taxRate: override.tax.taxRate } : {}),
                    ...(override.tax.taxLabel ? { taxLabel: override.tax.taxLabel } : {})
                }
            }
            : {}),
        ...(override.network
            ? {
                network: {
                    ...(override.network.networkRegion ? { networkRegion: override.network.networkRegion } : {}),
                    ...(override.network.apiBaseUrl ? { apiBaseUrl: override.network.apiBaseUrl } : {}),
                    ...(override.network.cdnBaseUrl ? { cdnBaseUrl: override.network.cdnBaseUrl } : {}),
                    ...(override.network.callbackBaseUrl ? { callbackBaseUrl: override.network.callbackBaseUrl } : {})
                }
            }
            : {}),
        ...(override.email
            ? {
                email: {
                    ...(override.email.provider ? { provider: override.email.provider } : {}),
                    ...(override.email.fromName ? { fromName: override.email.fromName } : {}),
                    ...(override.email.fromAddress ? { fromAddress: override.email.fromAddress } : {}),
                    ...(override.email.replyTo ? { replyTo: override.email.replyTo } : {})
                }
            }
            : {}),
        ...(override.social
            ? {
                social: {
                    ...(override.social.primaryPlatforms ? { primaryPlatforms: override.social.primaryPlatforms } : {}),
                    ...(override.social.supportPlatforms ? { supportPlatforms: override.social.supportPlatforms } : {})
                }
            }
            : {})
    };
}
//# sourceMappingURL=market.contract.js.map