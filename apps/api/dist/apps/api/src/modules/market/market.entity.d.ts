import { CountryCode, CurrencyCode, EmailProvider, LanguageCode, NetworkRegion, SocialPlatform, TaxMode } from '@m5/domain';
/**
 * Market locale configuration entity
 */
export declare class MarketLocale {
    /** Default language for this market */
    defaultLanguage: LanguageCode;
    /** All supported languages */
    supportedLanguages: LanguageCode[];
}
/**
 * Market timezone configuration entity
 */
export declare class MarketTimezone {
    /** IANA timezone identifier */
    timezone: string;
}
/**
 * Market currency configuration entity
 */
export declare class MarketCurrency {
    /** ISO 4217 currency code */
    currencyCode: CurrencyCode;
    /** Currency symbol for display */
    symbol: string;
}
/**
 * Market tax configuration entity
 */
export declare class MarketTax {
    /** Tax calculation mode: included or excluded */
    taxMode: TaxMode;
    /** Tax rate as percentage (e.g., 6 for 6%) */
    taxRate: number;
    /** Human-readable tax label */
    taxLabel: string;
}
/**
 * Market network configuration entity
 */
export declare class MarketNetwork {
    /** Network deployment region */
    networkRegion: NetworkRegion;
    /** Base URL for API endpoints */
    apiBaseUrl: string;
    /** Base URL for CDN assets */
    cdnBaseUrl: string;
    /** Base URL for webhook callbacks */
    callbackBaseUrl: string;
}
/**
 * Market email configuration entity
 */
export declare class MarketEmail {
    /** Email delivery provider */
    provider: EmailProvider;
    /** Sender display name */
    fromName: string;
    /** Sender email address */
    fromAddress: string;
    /** Reply-to email address */
    replyTo: string;
}
/**
 * Market social media configuration entity
 */
export declare class MarketSocial {
    /** Primary social platforms */
    primaryPlatforms: SocialPlatform[];
    /** All supported social platforms */
    supportPlatforms: SocialPlatform[];
}
/**
 * Market profile entity — represents a geographical market configuration.
 *
 * Each market defines locale, timezone, currency, tax, network, email,
 * and social media settings for a region (e.g., cn-mainland, us-default).
 */
export declare class MarketProfile {
    /** Unique market code (e.g., 'cn-mainland', 'us-default') */
    marketCode: string;
    /** Human-readable market name */
    marketName: string;
    /** ISO 3166-1 alpha-2 country code */
    countryCode: CountryCode;
    /** Locale configuration */
    locale: MarketLocale;
    /** Timezone configuration */
    timezone: MarketTimezone;
    /** Currency configuration */
    currency: MarketCurrency;
    /** Tax configuration */
    tax: MarketTax;
    /** Network configuration */
    network: MarketNetwork;
    /** Email configuration */
    email: MarketEmail;
    /** Social media configuration */
    social: MarketSocial;
}
//# sourceMappingURL=market.entity.d.ts.map