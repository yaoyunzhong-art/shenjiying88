"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketProfile = exports.MarketSocial = exports.MarketEmail = exports.MarketNetwork = exports.MarketTax = exports.MarketCurrency = exports.MarketTimezone = exports.MarketLocale = void 0;
/**
 * Market locale configuration entity
 */
class MarketLocale {
    /** Default language for this market */
    defaultLanguage;
    /** All supported languages */
    supportedLanguages;
}
exports.MarketLocale = MarketLocale;
/**
 * Market timezone configuration entity
 */
class MarketTimezone {
    /** IANA timezone identifier */
    timezone;
}
exports.MarketTimezone = MarketTimezone;
/**
 * Market currency configuration entity
 */
class MarketCurrency {
    /** ISO 4217 currency code */
    currencyCode;
    /** Currency symbol for display */
    symbol;
}
exports.MarketCurrency = MarketCurrency;
/**
 * Market tax configuration entity
 */
class MarketTax {
    /** Tax calculation mode: included or excluded */
    taxMode;
    /** Tax rate as percentage (e.g., 6 for 6%) */
    taxRate;
    /** Human-readable tax label */
    taxLabel;
}
exports.MarketTax = MarketTax;
/**
 * Market network configuration entity
 */
class MarketNetwork {
    /** Network deployment region */
    networkRegion;
    /** Base URL for API endpoints */
    apiBaseUrl;
    /** Base URL for CDN assets */
    cdnBaseUrl;
    /** Base URL for webhook callbacks */
    callbackBaseUrl;
}
exports.MarketNetwork = MarketNetwork;
/**
 * Market email configuration entity
 */
class MarketEmail {
    /** Email delivery provider */
    provider;
    /** Sender display name */
    fromName;
    /** Sender email address */
    fromAddress;
    /** Reply-to email address */
    replyTo;
}
exports.MarketEmail = MarketEmail;
/**
 * Market social media configuration entity
 */
class MarketSocial {
    /** Primary social platforms */
    primaryPlatforms;
    /** All supported social platforms */
    supportPlatforms;
}
exports.MarketSocial = MarketSocial;
/**
 * Market profile entity — represents a geographical market configuration.
 *
 * Each market defines locale, timezone, currency, tax, network, email,
 * and social media settings for a region (e.g., cn-mainland, us-default).
 */
class MarketProfile {
    /** Unique market code (e.g., 'cn-mainland', 'us-default') */
    marketCode;
    /** Human-readable market name */
    marketName;
    /** ISO 3166-1 alpha-2 country code */
    countryCode;
    /** Locale configuration */
    locale;
    /** Timezone configuration */
    timezone;
    /** Currency configuration */
    currency;
    /** Tax configuration */
    tax;
    /** Network configuration */
    network;
    /** Email configuration */
    email;
    /** Social media configuration */
    social;
}
exports.MarketProfile = MarketProfile;
//# sourceMappingURL=market.entity.js.map