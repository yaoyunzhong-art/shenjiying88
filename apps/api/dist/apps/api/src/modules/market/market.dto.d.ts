import { CountryCode, CurrencyCode, EmailProvider, LanguageCode, NetworkRegion, SocialPlatform, TaxMode } from '@m5/domain';
export declare class MarketLocaleDto {
    defaultLanguage: LanguageCode;
    supportedLanguages: LanguageCode[];
}
export declare class MarketTimezoneDto {
    timezone: string;
}
export declare class MarketCurrencyDto {
    currencyCode: CurrencyCode;
    symbol: string;
}
export declare class MarketTaxDto {
    taxMode: TaxMode;
    taxRate: number;
    taxLabel: string;
}
export declare class MarketNetworkDto {
    networkRegion: NetworkRegion;
    apiBaseUrl: string;
    cdnBaseUrl: string;
    callbackBaseUrl: string;
}
export declare class MarketEmailDto {
    provider: EmailProvider;
    fromName: string;
    fromAddress: string;
    replyTo: string;
}
export declare class MarketSocialDto {
    primaryPlatforms: SocialPlatform[];
    supportPlatforms: SocialPlatform[];
}
export declare class MarketProfileDto {
    marketCode: string;
    marketName: string;
    countryCode: CountryCode;
    locale: MarketLocaleDto;
    timezone: MarketTimezoneDto;
    currency: MarketCurrencyDto;
    tax: MarketTaxDto;
    network: MarketNetworkDto;
    email: MarketEmailDto;
    social: MarketSocialDto;
}
export declare class CreateMarketProfileDto extends MarketProfileDto {
}
export declare class UpdateMarketProfileDto {
    marketName?: string;
    locale?: MarketLocaleDto;
    timezone?: MarketTimezoneDto;
    currency?: MarketCurrencyDto;
    tax?: MarketTaxDto;
    network?: MarketNetworkDto;
    email?: MarketEmailDto;
    social?: MarketSocialDto;
}
/** Response DTO for the scoped market endpoint */
export declare class ScopedMarketResponseDto {
    scopeType: string;
    scopeCode: string;
    marketProfile: MarketProfileDto;
}
//# sourceMappingURL=market.dto.d.ts.map