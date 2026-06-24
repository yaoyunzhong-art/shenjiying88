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
exports.ScopedMarketResponseDto = exports.UpdateMarketProfileDto = exports.CreateMarketProfileDto = exports.MarketProfileDto = exports.MarketSocialDto = exports.MarketEmailDto = exports.MarketNetworkDto = exports.MarketTaxDto = exports.MarketCurrencyDto = exports.MarketTimezoneDto = exports.MarketLocaleDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const domain_1 = require("@m5/domain");
// ── MarketLocale DTO ────────────────────────────────────────────────
class MarketLocaleDto {
    defaultLanguage;
    supportedLanguages;
}
exports.MarketLocaleDto = MarketLocaleDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: domain_1.LanguageCode, description: 'Default language for this market' }),
    (0, class_validator_1.IsEnum)(domain_1.LanguageCode),
    __metadata("design:type", String)
], MarketLocaleDto.prototype, "defaultLanguage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: domain_1.LanguageCode, isArray: true, description: 'All supported languages' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(domain_1.LanguageCode, { each: true }),
    __metadata("design:type", Array)
], MarketLocaleDto.prototype, "supportedLanguages", void 0);
// ── MarketTimezone DTO ──────────────────────────────────────────────
class MarketTimezoneDto {
    timezone;
}
exports.MarketTimezoneDto = MarketTimezoneDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Asia/Shanghai', description: 'IANA timezone identifier' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarketTimezoneDto.prototype, "timezone", void 0);
// ── MarketCurrency DTO ──────────────────────────────────────────────
class MarketCurrencyDto {
    currencyCode;
    symbol;
}
exports.MarketCurrencyDto = MarketCurrencyDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: domain_1.CurrencyCode, description: 'ISO 4217 currency code' }),
    (0, class_validator_1.IsEnum)(domain_1.CurrencyCode),
    __metadata("design:type", String)
], MarketCurrencyDto.prototype, "currencyCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '¥', description: 'Currency symbol for display' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarketCurrencyDto.prototype, "symbol", void 0);
// ── MarketTax DTO ───────────────────────────────────────────────────
class MarketTaxDto {
    taxMode;
    taxRate;
    taxLabel;
}
exports.MarketTaxDto = MarketTaxDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: domain_1.TaxMode, description: 'Tax calculation mode' }),
    (0, class_validator_1.IsEnum)(domain_1.TaxMode),
    __metadata("design:type", String)
], MarketTaxDto.prototype, "taxMode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 6, description: 'Tax rate as percentage' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], MarketTaxDto.prototype, "taxRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '增值税', description: 'Human-readable tax label' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarketTaxDto.prototype, "taxLabel", void 0);
// ── MarketNetwork DTO ───────────────────────────────────────────────
class MarketNetworkDto {
    networkRegion;
    apiBaseUrl;
    cdnBaseUrl;
    callbackBaseUrl;
}
exports.MarketNetworkDto = MarketNetworkDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: domain_1.NetworkRegion, description: 'Network deployment region' }),
    (0, class_validator_1.IsEnum)(domain_1.NetworkRegion),
    __metadata("design:type", String)
], MarketNetworkDto.prototype, "networkRegion", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'https://cn-api.m5.local', description: 'Base URL for API endpoints' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarketNetworkDto.prototype, "apiBaseUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'https://cn-cdn.m5.local', description: 'Base URL for CDN assets' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarketNetworkDto.prototype, "cdnBaseUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'https://cn-hooks.m5.local', description: 'Base URL for webhook callbacks' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarketNetworkDto.prototype, "callbackBaseUrl", void 0);
// ── MarketEmail DTO ─────────────────────────────────────────────────
class MarketEmailDto {
    provider;
    fromName;
    fromAddress;
    replyTo;
}
exports.MarketEmailDto = MarketEmailDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: domain_1.EmailProvider, description: 'Email delivery provider' }),
    (0, class_validator_1.IsEnum)(domain_1.EmailProvider),
    __metadata("design:type", String)
], MarketEmailDto.prototype, "provider", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'M5 China', description: 'Sender display name' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarketEmailDto.prototype, "fromName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'hello-cn@m5.local', description: 'Sender email address' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarketEmailDto.prototype, "fromAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'support-cn@m5.local', description: 'Reply-to email address' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarketEmailDto.prototype, "replyTo", void 0);
// ── MarketSocial DTO ────────────────────────────────────────────────
class MarketSocialDto {
    primaryPlatforms;
    supportPlatforms;
}
exports.MarketSocialDto = MarketSocialDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: domain_1.SocialPlatform, isArray: true, description: 'Primary social platforms' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(domain_1.SocialPlatform, { each: true }),
    __metadata("design:type", Array)
], MarketSocialDto.prototype, "primaryPlatforms", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: domain_1.SocialPlatform, isArray: true, description: 'All supported social platforms' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(domain_1.SocialPlatform, { each: true }),
    __metadata("design:type", Array)
], MarketSocialDto.prototype, "supportPlatforms", void 0);
// ── MarketProfile DTO ───────────────────────────────────────────────
class MarketProfileDto {
    marketCode;
    marketName;
    countryCode;
    locale;
    timezone;
    currency;
    tax;
    network;
    email;
    social;
}
exports.MarketProfileDto = MarketProfileDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'cn-mainland', description: 'Unique market code' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarketProfileDto.prototype, "marketCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '中国大陆', description: 'Human-readable market name' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarketProfileDto.prototype, "marketName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: domain_1.CountryCode, description: 'ISO 3166-1 alpha-2 country code' }),
    (0, class_validator_1.IsEnum)(domain_1.CountryCode),
    __metadata("design:type", String)
], MarketProfileDto.prototype, "countryCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Locale configuration' }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => MarketLocaleDto),
    __metadata("design:type", MarketLocaleDto)
], MarketProfileDto.prototype, "locale", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Timezone configuration' }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => MarketTimezoneDto),
    __metadata("design:type", MarketTimezoneDto)
], MarketProfileDto.prototype, "timezone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Currency configuration' }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => MarketCurrencyDto),
    __metadata("design:type", MarketCurrencyDto)
], MarketProfileDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Tax configuration' }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => MarketTaxDto),
    __metadata("design:type", MarketTaxDto)
], MarketProfileDto.prototype, "tax", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Network configuration' }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => MarketNetworkDto),
    __metadata("design:type", MarketNetworkDto)
], MarketProfileDto.prototype, "network", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Email configuration' }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => MarketEmailDto),
    __metadata("design:type", MarketEmailDto)
], MarketProfileDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Social media configuration' }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => MarketSocialDto),
    __metadata("design:type", MarketSocialDto)
], MarketProfileDto.prototype, "social", void 0);
// ── DTOs for API input/output ───────────────────────────────────────
class CreateMarketProfileDto extends MarketProfileDto {
}
exports.CreateMarketProfileDto = CreateMarketProfileDto;
class UpdateMarketProfileDto {
    marketName;
    locale;
    timezone;
    currency;
    tax;
    network;
    email;
    social;
}
exports.UpdateMarketProfileDto = UpdateMarketProfileDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '中国大陆', description: 'Human-readable market name' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMarketProfileDto.prototype, "marketName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Locale configuration' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => MarketLocaleDto),
    __metadata("design:type", MarketLocaleDto)
], UpdateMarketProfileDto.prototype, "locale", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Timezone configuration' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => MarketTimezoneDto),
    __metadata("design:type", MarketTimezoneDto)
], UpdateMarketProfileDto.prototype, "timezone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Currency configuration' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => MarketCurrencyDto),
    __metadata("design:type", MarketCurrencyDto)
], UpdateMarketProfileDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Tax configuration' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => MarketTaxDto),
    __metadata("design:type", MarketTaxDto)
], UpdateMarketProfileDto.prototype, "tax", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Network configuration' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => MarketNetworkDto),
    __metadata("design:type", MarketNetworkDto)
], UpdateMarketProfileDto.prototype, "network", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Email configuration' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => MarketEmailDto),
    __metadata("design:type", MarketEmailDto)
], UpdateMarketProfileDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Social media configuration' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => MarketSocialDto),
    __metadata("design:type", MarketSocialDto)
], UpdateMarketProfileDto.prototype, "social", void 0);
/** Response DTO for the scoped market endpoint */
class ScopedMarketResponseDto {
    scopeType;
    scopeCode;
    marketProfile;
}
exports.ScopedMarketResponseDto = ScopedMarketResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'tenant', description: 'Portal scope type' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScopedMarketResponseDto.prototype, "scopeType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'tenant-demo', description: 'Portal scope code' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScopedMarketResponseDto.prototype, "scopeCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Market profile for the requested scope' }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => MarketProfileDto),
    __metadata("design:type", MarketProfileDto)
], ScopedMarketResponseDto.prototype, "marketProfile", void 0);
//# sourceMappingURL=market.dto.js.map