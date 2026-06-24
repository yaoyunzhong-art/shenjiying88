"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AiExecutionStatus: () => AiExecutionStatus,
  AiProvider: () => AiProvider,
  BackupStatus: () => BackupStatus,
  CertificateFormat: () => CertificateFormat,
  ClientChannel: () => ClientChannel,
  ConfigInheritanceMode: () => ConfigInheritanceMode,
  ConfigValueType: () => ConfigValueType,
  CountryCode: () => CountryCode,
  CurrencyCode: () => CurrencyCode,
  EdgeNodeStatus: () => EdgeNodeStatus,
  EdgeSyncDirection: () => EdgeSyncDirection,
  EmailProvider: () => EmailProvider,
  EventStatus: () => EventStatus,
  FeatureFlagStatus: () => FeatureFlagStatus,
  FileAssetKind: () => FileAssetKind,
  FoundationScopeType: () => FoundationScopeType,
  IdentitySubjectType: () => IdentitySubjectType,
  LanguageCode: () => LanguageCode,
  NetworkRegion: () => NetworkRegion,
  NotificationChannelType: () => NotificationChannelType,
  NotificationStatus: () => NotificationStatus,
  OpenPlatformAppType: () => OpenPlatformAppType,
  OrganizationNodeType: () => OrganizationNodeType,
  PiiLevel: () => PiiLevel,
  PolicyConditionOperator: () => PolicyConditionOperator,
  PolicyEffect: () => PolicyEffect,
  PolicySubjectType: () => PolicySubjectType,
  PortalAudience: () => PortalAudience,
  PortalChannel: () => PortalChannel,
  PortalScopeType: () => PortalScopeType,
  QuotaPeriod: () => QuotaPeriod,
  RestoreStatus: () => RestoreStatus,
  RolloutStrategy: () => RolloutStrategy,
  SecretKind: () => SecretKind,
  SecretProvider: () => SecretProvider,
  SocialPlatform: () => SocialPlatform,
  StorefrontSurface: () => StorefrontSurface,
  TaxMode: () => TaxMode,
  UserRole: () => UserRole,
  WebhookDeliveryStatus: () => WebhookDeliveryStatus
});
module.exports = __toCommonJS(index_exports);
var UserRole = /* @__PURE__ */ ((UserRole2) => {
  UserRole2["SuperAdmin"] = "SUPER_ADMIN";
  UserRole2["TenantAdmin"] = "TENANT_ADMIN";
  UserRole2["BrandManager"] = "BRAND_MANAGER";
  UserRole2["StoreManager"] = "STORE_MANAGER";
  UserRole2["Guide"] = "GUIDE";
  UserRole2["Cashier"] = "CASHIER";
  UserRole2["Operations"] = "OPERATIONS";
  UserRole2["Finance"] = "FINANCE";
  UserRole2["Warehouse"] = "WAREHOUSE";
  UserRole2["Coach"] = "COACH";
  return UserRole2;
})(UserRole || {});
var ClientChannel = /* @__PURE__ */ ((ClientChannel2) => {
  ClientChannel2["Pc"] = "PC";
  ClientChannel2["Pad"] = "PAD";
  ClientChannel2["H5"] = "H5";
  ClientChannel2["MiniApp"] = "MINIAPP";
  ClientChannel2["App"] = "APP";
  return ClientChannel2;
})(ClientChannel || {});
var PortalAudience = /* @__PURE__ */ ((PortalAudience2) => {
  PortalAudience2["ToC"] = "TOC";
  PortalAudience2["ToB"] = "TOB";
  return PortalAudience2;
})(PortalAudience || {});
var PortalScopeType = /* @__PURE__ */ ((PortalScopeType2) => {
  PortalScopeType2["Tenant"] = "TENANT";
  PortalScopeType2["Brand"] = "BRAND";
  PortalScopeType2["Store"] = "STORE";
  return PortalScopeType2;
})(PortalScopeType || {});
var PortalChannel = /* @__PURE__ */ ((PortalChannel2) => {
  PortalChannel2["Web"] = "WEB";
  PortalChannel2["H5"] = "H5";
  PortalChannel2["MiniApp"] = "MINIAPP";
  PortalChannel2["App"] = "APP";
  PortalChannel2["Pc"] = "PC";
  PortalChannel2["Pad"] = "PAD";
  return PortalChannel2;
})(PortalChannel || {});
var StorefrontSurface = /* @__PURE__ */ ((StorefrontSurface2) => {
  StorefrontSurface2["OfficialSite"] = "OFFICIAL_SITE";
  StorefrontSurface2["H5"] = "H5";
  StorefrontSurface2["MiniApp"] = "MINIAPP";
  StorefrontSurface2["App"] = "APP";
  StorefrontSurface2["PcConsole"] = "PC_CONSOLE";
  StorefrontSurface2["PadConsole"] = "PAD_CONSOLE";
  return StorefrontSurface2;
})(StorefrontSurface || {});
var CountryCode = /* @__PURE__ */ ((CountryCode2) => {
  CountryCode2["China"] = "CN";
  CountryCode2["UnitedStates"] = "US";
  return CountryCode2;
})(CountryCode || {});
var LanguageCode = /* @__PURE__ */ ((LanguageCode2) => {
  LanguageCode2["ZhCn"] = "zh-CN";
  LanguageCode2["EnUs"] = "en-US";
  return LanguageCode2;
})(LanguageCode || {});
var CurrencyCode = /* @__PURE__ */ ((CurrencyCode2) => {
  CurrencyCode2["Cny"] = "CNY";
  CurrencyCode2["Usd"] = "USD";
  return CurrencyCode2;
})(CurrencyCode || {});
var TaxMode = /* @__PURE__ */ ((TaxMode2) => {
  TaxMode2["Included"] = "PRICES_INCLUDE_TAX";
  TaxMode2["Excluded"] = "PRICES_EXCLUDE_TAX";
  TaxMode2["Zero"] = "ZERO_TAX";
  return TaxMode2;
})(TaxMode || {});
var NetworkRegion = /* @__PURE__ */ ((NetworkRegion2) => {
  NetworkRegion2["MainlandChina"] = "MAINLAND_CHINA";
  NetworkRegion2["NorthAmerica"] = "NORTH_AMERICA";
  NetworkRegion2["Global"] = "GLOBAL";
  return NetworkRegion2;
})(NetworkRegion || {});
var EmailProvider = /* @__PURE__ */ ((EmailProvider2) => {
  EmailProvider2["AliyunDm"] = "ALIYUN_DM";
  EmailProvider2["SendGrid"] = "SENDGRID";
  EmailProvider2["Ses"] = "SES";
  EmailProvider2["Resend"] = "RESEND";
  return EmailProvider2;
})(EmailProvider || {});
var SocialPlatform = /* @__PURE__ */ ((SocialPlatform2) => {
  SocialPlatform2["Wechat"] = "WECHAT";
  SocialPlatform2["Weibo"] = "WEIBO";
  SocialPlatform2["Xiaohongshu"] = "XIAOHONGSHU";
  SocialPlatform2["Douyin"] = "DOUYIN";
  SocialPlatform2["Facebook"] = "FACEBOOK";
  SocialPlatform2["Instagram"] = "INSTAGRAM";
  SocialPlatform2["X"] = "X";
  SocialPlatform2["LinkedIn"] = "LINKEDIN";
  SocialPlatform2["TikTok"] = "TIKTOK";
  return SocialPlatform2;
})(SocialPlatform || {});
var ConfigInheritanceMode = /* @__PURE__ */ ((ConfigInheritanceMode2) => {
  ConfigInheritanceMode2["PlatformDefault"] = "PLATFORM_DEFAULT";
  ConfigInheritanceMode2["TenantDefault"] = "TENANT_DEFAULT";
  ConfigInheritanceMode2["BrandOverride"] = "BRAND_OVERRIDE";
  ConfigInheritanceMode2["StoreOverride"] = "STORE_OVERRIDE";
  return ConfigInheritanceMode2;
})(ConfigInheritanceMode || {});
var FoundationScopeType = /* @__PURE__ */ ((FoundationScopeType2) => {
  FoundationScopeType2["Platform"] = "PLATFORM";
  FoundationScopeType2["Tenant"] = "TENANT";
  FoundationScopeType2["Brand"] = "BRAND";
  FoundationScopeType2["Store"] = "STORE";
  FoundationScopeType2["Market"] = "MARKET";
  FoundationScopeType2["Portal"] = "PORTAL";
  FoundationScopeType2["User"] = "USER";
  FoundationScopeType2["Device"] = "DEVICE";
  FoundationScopeType2["Integration"] = "INTEGRATION";
  return FoundationScopeType2;
})(FoundationScopeType || {});
var IdentitySubjectType = /* @__PURE__ */ ((IdentitySubjectType2) => {
  IdentitySubjectType2["PlatformUser"] = "PLATFORM_USER";
  IdentitySubjectType2["TenantUser"] = "TENANT_USER";
  IdentitySubjectType2["BrandUser"] = "BRAND_USER";
  IdentitySubjectType2["StoreUser"] = "STORE_USER";
  IdentitySubjectType2["Employee"] = "EMPLOYEE";
  IdentitySubjectType2["Member"] = "MEMBER";
  IdentitySubjectType2["Device"] = "DEVICE";
  IdentitySubjectType2["ServiceAccount"] = "SERVICE_ACCOUNT";
  return IdentitySubjectType2;
})(IdentitySubjectType || {});
var OrganizationNodeType = /* @__PURE__ */ ((OrganizationNodeType2) => {
  OrganizationNodeType2["Platform"] = "PLATFORM";
  OrganizationNodeType2["Tenant"] = "TENANT";
  OrganizationNodeType2["Brand"] = "BRAND";
  OrganizationNodeType2["Region"] = "REGION";
  OrganizationNodeType2["Store"] = "STORE";
  OrganizationNodeType2["Department"] = "DEPARTMENT";
  OrganizationNodeType2["Team"] = "TEAM";
  return OrganizationNodeType2;
})(OrganizationNodeType || {});
var PolicyEffect = /* @__PURE__ */ ((PolicyEffect2) => {
  PolicyEffect2["Allow"] = "ALLOW";
  PolicyEffect2["Deny"] = "DENY";
  return PolicyEffect2;
})(PolicyEffect || {});
var PolicySubjectType = /* @__PURE__ */ ((PolicySubjectType2) => {
  PolicySubjectType2["Role"] = "ROLE";
  PolicySubjectType2["User"] = "USER";
  PolicySubjectType2["Group"] = "GROUP";
  PolicySubjectType2["ServiceAccount"] = "SERVICE_ACCOUNT";
  PolicySubjectType2["IntegrationApp"] = "INTEGRATION_APP";
  return PolicySubjectType2;
})(PolicySubjectType || {});
var PolicyConditionOperator = /* @__PURE__ */ ((PolicyConditionOperator2) => {
  PolicyConditionOperator2["Eq"] = "EQ";
  PolicyConditionOperator2["NotEq"] = "NOT_EQ";
  PolicyConditionOperator2["In"] = "IN";
  PolicyConditionOperator2["NotIn"] = "NOT_IN";
  PolicyConditionOperator2["Gte"] = "GTE";
  PolicyConditionOperator2["Lte"] = "LTE";
  PolicyConditionOperator2["Exists"] = "EXISTS";
  return PolicyConditionOperator2;
})(PolicyConditionOperator || {});
var ConfigValueType = /* @__PURE__ */ ((ConfigValueType2) => {
  ConfigValueType2["Json"] = "JSON";
  ConfigValueType2["String"] = "STRING";
  ConfigValueType2["Number"] = "NUMBER";
  ConfigValueType2["Boolean"] = "BOOLEAN";
  return ConfigValueType2;
})(ConfigValueType || {});
var SecretKind = /* @__PURE__ */ ((SecretKind2) => {
  SecretKind2["ApiKey"] = "API_KEY";
  SecretKind2["AccessToken"] = "ACCESS_TOKEN";
  SecretKind2["RefreshToken"] = "REFRESH_TOKEN";
  SecretKind2["Password"] = "PASSWORD";
  SecretKind2["Certificate"] = "CERTIFICATE";
  SecretKind2["PrivateKey"] = "PRIVATE_KEY";
  SecretKind2["PublicKey"] = "PUBLIC_KEY";
  SecretKind2["WebhookSecret"] = "WEBHOOK_SECRET";
  return SecretKind2;
})(SecretKind || {});
var SecretProvider = /* @__PURE__ */ ((SecretProvider2) => {
  SecretProvider2["Database"] = "DATABASE";
  SecretProvider2["Vault"] = "VAULT";
  SecretProvider2["Kms"] = "KMS";
  SecretProvider2["External"] = "EXTERNAL";
  return SecretProvider2;
})(SecretProvider || {});
var CertificateFormat = /* @__PURE__ */ ((CertificateFormat2) => {
  CertificateFormat2["Pem"] = "PEM";
  CertificateFormat2["Pfx"] = "PFX";
  CertificateFormat2["Jks"] = "JKS";
  return CertificateFormat2;
})(CertificateFormat || {});
var EventStatus = /* @__PURE__ */ ((EventStatus2) => {
  EventStatus2["Pending"] = "PENDING";
  EventStatus2["Processing"] = "PROCESSING";
  EventStatus2["Published"] = "PUBLISHED";
  EventStatus2["Failed"] = "FAILED";
  EventStatus2["DeadLetter"] = "DEAD_LETTER";
  return EventStatus2;
})(EventStatus || {});
var WebhookDeliveryStatus = /* @__PURE__ */ ((WebhookDeliveryStatus2) => {
  WebhookDeliveryStatus2["Pending"] = "PENDING";
  WebhookDeliveryStatus2["Delivered"] = "DELIVERED";
  WebhookDeliveryStatus2["Failed"] = "FAILED";
  WebhookDeliveryStatus2["DeadLetter"] = "DEAD_LETTER";
  return WebhookDeliveryStatus2;
})(WebhookDeliveryStatus || {});
var NotificationChannelType = /* @__PURE__ */ ((NotificationChannelType2) => {
  NotificationChannelType2["Email"] = "EMAIL";
  NotificationChannelType2["Sms"] = "SMS";
  NotificationChannelType2["Push"] = "PUSH";
  NotificationChannelType2["InApp"] = "IN_APP";
  NotificationChannelType2["Webhook"] = "WEBHOOK";
  NotificationChannelType2["Social"] = "SOCIAL";
  return NotificationChannelType2;
})(NotificationChannelType || {});
var NotificationStatus = /* @__PURE__ */ ((NotificationStatus2) => {
  NotificationStatus2["Pending"] = "PENDING";
  NotificationStatus2["Sent"] = "SENT";
  NotificationStatus2["Failed"] = "FAILED";
  NotificationStatus2["Cancelled"] = "CANCELLED";
  return NotificationStatus2;
})(NotificationStatus || {});
var EdgeNodeStatus = /* @__PURE__ */ ((EdgeNodeStatus2) => {
  EdgeNodeStatus2["Online"] = "ONLINE";
  EdgeNodeStatus2["Offline"] = "OFFLINE";
  EdgeNodeStatus2["Degraded"] = "DEGRADED";
  EdgeNodeStatus2["Maintenance"] = "MAINTENANCE";
  return EdgeNodeStatus2;
})(EdgeNodeStatus || {});
var EdgeSyncDirection = /* @__PURE__ */ ((EdgeSyncDirection2) => {
  EdgeSyncDirection2["Upstream"] = "UPSTREAM";
  EdgeSyncDirection2["Downstream"] = "DOWNSTREAM";
  EdgeSyncDirection2["Bidirectional"] = "BIDIRECTIONAL";
  return EdgeSyncDirection2;
})(EdgeSyncDirection || {});
var FileAssetKind = /* @__PURE__ */ ((FileAssetKind2) => {
  FileAssetKind2["Avatar"] = "AVATAR";
  FileAssetKind2["Image"] = "IMAGE";
  FileAssetKind2["Video"] = "VIDEO";
  FileAssetKind2["Document"] = "DOCUMENT";
  FileAssetKind2["Archive"] = "ARCHIVE";
  FileAssetKind2["Certificate"] = "CERTIFICATE";
  return FileAssetKind2;
})(FileAssetKind || {});
var OpenPlatformAppType = /* @__PURE__ */ ((OpenPlatformAppType2) => {
  OpenPlatformAppType2["Internal"] = "INTERNAL";
  OpenPlatformAppType2["Isv"] = "ISV";
  OpenPlatformAppType2["Partner"] = "PARTNER";
  return OpenPlatformAppType2;
})(OpenPlatformAppType || {});
var QuotaPeriod = /* @__PURE__ */ ((QuotaPeriod2) => {
  QuotaPeriod2["Minute"] = "MINUTE";
  QuotaPeriod2["Hour"] = "HOUR";
  QuotaPeriod2["Day"] = "DAY";
  QuotaPeriod2["Month"] = "MONTH";
  return QuotaPeriod2;
})(QuotaPeriod || {});
var FeatureFlagStatus = /* @__PURE__ */ ((FeatureFlagStatus2) => {
  FeatureFlagStatus2["Draft"] = "DRAFT";
  FeatureFlagStatus2["Active"] = "ACTIVE";
  FeatureFlagStatus2["Paused"] = "PAUSED";
  FeatureFlagStatus2["Archived"] = "ARCHIVED";
  return FeatureFlagStatus2;
})(FeatureFlagStatus || {});
var RolloutStrategy = /* @__PURE__ */ ((RolloutStrategy2) => {
  RolloutStrategy2["All"] = "ALL";
  RolloutStrategy2["Percentage"] = "PERCENTAGE";
  RolloutStrategy2["AllowList"] = "ALLOW_LIST";
  RolloutStrategy2["ScopeMatch"] = "SCOPE_MATCH";
  return RolloutStrategy2;
})(RolloutStrategy || {});
var BackupStatus = /* @__PURE__ */ ((BackupStatus2) => {
  BackupStatus2["Pending"] = "PENDING";
  BackupStatus2["Running"] = "RUNNING";
  BackupStatus2["Succeeded"] = "SUCCEEDED";
  BackupStatus2["Failed"] = "FAILED";
  return BackupStatus2;
})(BackupStatus || {});
var RestoreStatus = /* @__PURE__ */ ((RestoreStatus2) => {
  RestoreStatus2["Pending"] = "PENDING";
  RestoreStatus2["Running"] = "RUNNING";
  RestoreStatus2["Succeeded"] = "SUCCEEDED";
  RestoreStatus2["Failed"] = "FAILED";
  RestoreStatus2["Cancelled"] = "CANCELLED";
  return RestoreStatus2;
})(RestoreStatus || {});
var PiiLevel = /* @__PURE__ */ ((PiiLevel2) => {
  PiiLevel2["Public"] = "PUBLIC";
  PiiLevel2["Internal"] = "INTERNAL";
  PiiLevel2["Sensitive"] = "SENSITIVE";
  PiiLevel2["Restricted"] = "RESTRICTED";
  return PiiLevel2;
})(PiiLevel || {});
var AiProvider = /* @__PURE__ */ ((AiProvider2) => {
  AiProvider2["OpenAI"] = "OPENAI";
  AiProvider2["AzureOpenAI"] = "AZURE_OPENAI";
  AiProvider2["Anthropic"] = "ANTHROPIC";
  AiProvider2["Gemini"] = "GEMINI";
  AiProvider2["DeepSeek"] = "DEEPSEEK";
  return AiProvider2;
})(AiProvider || {});
var AiExecutionStatus = /* @__PURE__ */ ((AiExecutionStatus2) => {
  AiExecutionStatus2["Pending"] = "PENDING";
  AiExecutionStatus2["Succeeded"] = "SUCCEEDED";
  AiExecutionStatus2["Failed"] = "FAILED";
  AiExecutionStatus2["Escalated"] = "ESCALATED";
  return AiExecutionStatus2;
})(AiExecutionStatus || {});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AiExecutionStatus,
  AiProvider,
  BackupStatus,
  CertificateFormat,
  ClientChannel,
  ConfigInheritanceMode,
  ConfigValueType,
  CountryCode,
  CurrencyCode,
  EdgeNodeStatus,
  EdgeSyncDirection,
  EmailProvider,
  EventStatus,
  FeatureFlagStatus,
  FileAssetKind,
  FoundationScopeType,
  IdentitySubjectType,
  LanguageCode,
  NetworkRegion,
  NotificationChannelType,
  NotificationStatus,
  OpenPlatformAppType,
  OrganizationNodeType,
  PiiLevel,
  PolicyConditionOperator,
  PolicyEffect,
  PolicySubjectType,
  PortalAudience,
  PortalChannel,
  PortalScopeType,
  QuotaPeriod,
  RestoreStatus,
  RolloutStrategy,
  SecretKind,
  SecretProvider,
  SocialPlatform,
  StorefrontSurface,
  TaxMode,
  UserRole,
  WebhookDeliveryStatus
});
