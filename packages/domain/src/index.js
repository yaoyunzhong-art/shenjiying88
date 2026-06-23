"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiExecutionStatus = exports.AiProvider = exports.PiiLevel = exports.RestoreStatus = exports.BackupStatus = exports.RolloutStrategy = exports.FeatureFlagStatus = exports.QuotaPeriod = exports.OpenPlatformAppType = exports.FileAssetKind = exports.EdgeSyncDirection = exports.EdgeNodeStatus = exports.NotificationStatus = exports.NotificationChannelType = exports.WebhookDeliveryStatus = exports.EventStatus = exports.CertificateFormat = exports.SecretProvider = exports.SecretKind = exports.ConfigValueType = exports.PolicyConditionOperator = exports.PolicySubjectType = exports.PolicyEffect = exports.OrganizationNodeType = exports.IdentitySubjectType = exports.FoundationScopeType = exports.ConfigInheritanceMode = exports.SocialPlatform = exports.EmailProvider = exports.NetworkRegion = exports.TaxMode = exports.CurrencyCode = exports.LanguageCode = exports.CountryCode = exports.StorefrontSurface = exports.PortalChannel = exports.PortalScopeType = exports.PortalAudience = exports.ClientChannel = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["SuperAdmin"] = "SUPER_ADMIN";
    UserRole["TenantAdmin"] = "TENANT_ADMIN";
    UserRole["BrandManager"] = "BRAND_MANAGER";
    UserRole["StoreManager"] = "STORE_MANAGER";
    UserRole["Guide"] = "GUIDE";
    UserRole["Cashier"] = "CASHIER";
    UserRole["Operations"] = "OPERATIONS";
    UserRole["Finance"] = "FINANCE";
    UserRole["Warehouse"] = "WAREHOUSE";
    UserRole["Coach"] = "COACH";
})(UserRole || (exports.UserRole = UserRole = {}));
var ClientChannel;
(function (ClientChannel) {
    ClientChannel["Pc"] = "PC";
    ClientChannel["Pad"] = "PAD";
    ClientChannel["H5"] = "H5";
    ClientChannel["MiniApp"] = "MINIAPP";
    ClientChannel["App"] = "APP";
})(ClientChannel || (exports.ClientChannel = ClientChannel = {}));
var PortalAudience;
(function (PortalAudience) {
    PortalAudience["ToC"] = "TOC";
    PortalAudience["ToB"] = "TOB";
})(PortalAudience || (exports.PortalAudience = PortalAudience = {}));
var PortalScopeType;
(function (PortalScopeType) {
    PortalScopeType["Tenant"] = "TENANT";
    PortalScopeType["Brand"] = "BRAND";
    PortalScopeType["Store"] = "STORE";
})(PortalScopeType || (exports.PortalScopeType = PortalScopeType = {}));
var PortalChannel;
(function (PortalChannel) {
    PortalChannel["Web"] = "WEB";
    PortalChannel["H5"] = "H5";
    PortalChannel["MiniApp"] = "MINIAPP";
    PortalChannel["App"] = "APP";
    PortalChannel["Pc"] = "PC";
    PortalChannel["Pad"] = "PAD";
})(PortalChannel || (exports.PortalChannel = PortalChannel = {}));
var StorefrontSurface;
(function (StorefrontSurface) {
    StorefrontSurface["OfficialSite"] = "OFFICIAL_SITE";
    StorefrontSurface["H5"] = "H5";
    StorefrontSurface["MiniApp"] = "MINIAPP";
    StorefrontSurface["App"] = "APP";
    StorefrontSurface["PcConsole"] = "PC_CONSOLE";
    StorefrontSurface["PadConsole"] = "PAD_CONSOLE";
})(StorefrontSurface || (exports.StorefrontSurface = StorefrontSurface = {}));
var CountryCode;
(function (CountryCode) {
    CountryCode["China"] = "CN";
    CountryCode["UnitedStates"] = "US";
})(CountryCode || (exports.CountryCode = CountryCode = {}));
var LanguageCode;
(function (LanguageCode) {
    LanguageCode["ZhCn"] = "zh-CN";
    LanguageCode["EnUs"] = "en-US";
})(LanguageCode || (exports.LanguageCode = LanguageCode = {}));
var CurrencyCode;
(function (CurrencyCode) {
    CurrencyCode["Cny"] = "CNY";
    CurrencyCode["Usd"] = "USD";
})(CurrencyCode || (exports.CurrencyCode = CurrencyCode = {}));
var TaxMode;
(function (TaxMode) {
    TaxMode["Included"] = "PRICES_INCLUDE_TAX";
    TaxMode["Excluded"] = "PRICES_EXCLUDE_TAX";
    TaxMode["Zero"] = "ZERO_TAX";
})(TaxMode || (exports.TaxMode = TaxMode = {}));
var NetworkRegion;
(function (NetworkRegion) {
    NetworkRegion["MainlandChina"] = "MAINLAND_CHINA";
    NetworkRegion["NorthAmerica"] = "NORTH_AMERICA";
    NetworkRegion["Global"] = "GLOBAL";
})(NetworkRegion || (exports.NetworkRegion = NetworkRegion = {}));
var EmailProvider;
(function (EmailProvider) {
    EmailProvider["AliyunDm"] = "ALIYUN_DM";
    EmailProvider["SendGrid"] = "SENDGRID";
    EmailProvider["Ses"] = "SES";
    EmailProvider["Resend"] = "RESEND";
})(EmailProvider || (exports.EmailProvider = EmailProvider = {}));
var SocialPlatform;
(function (SocialPlatform) {
    SocialPlatform["Wechat"] = "WECHAT";
    SocialPlatform["Weibo"] = "WEIBO";
    SocialPlatform["Xiaohongshu"] = "XIAOHONGSHU";
    SocialPlatform["Douyin"] = "DOUYIN";
    SocialPlatform["Facebook"] = "FACEBOOK";
    SocialPlatform["Instagram"] = "INSTAGRAM";
    SocialPlatform["X"] = "X";
    SocialPlatform["LinkedIn"] = "LINKEDIN";
    SocialPlatform["TikTok"] = "TIKTOK";
})(SocialPlatform || (exports.SocialPlatform = SocialPlatform = {}));
var ConfigInheritanceMode;
(function (ConfigInheritanceMode) {
    ConfigInheritanceMode["PlatformDefault"] = "PLATFORM_DEFAULT";
    ConfigInheritanceMode["TenantDefault"] = "TENANT_DEFAULT";
    ConfigInheritanceMode["BrandOverride"] = "BRAND_OVERRIDE";
    ConfigInheritanceMode["StoreOverride"] = "STORE_OVERRIDE";
})(ConfigInheritanceMode || (exports.ConfigInheritanceMode = ConfigInheritanceMode = {}));
var FoundationScopeType;
(function (FoundationScopeType) {
    FoundationScopeType["Platform"] = "PLATFORM";
    FoundationScopeType["Tenant"] = "TENANT";
    FoundationScopeType["Brand"] = "BRAND";
    FoundationScopeType["Store"] = "STORE";
    FoundationScopeType["Market"] = "MARKET";
    FoundationScopeType["Portal"] = "PORTAL";
    FoundationScopeType["User"] = "USER";
    FoundationScopeType["Device"] = "DEVICE";
    FoundationScopeType["Integration"] = "INTEGRATION";
})(FoundationScopeType || (exports.FoundationScopeType = FoundationScopeType = {}));
var IdentitySubjectType;
(function (IdentitySubjectType) {
    IdentitySubjectType["PlatformUser"] = "PLATFORM_USER";
    IdentitySubjectType["TenantUser"] = "TENANT_USER";
    IdentitySubjectType["BrandUser"] = "BRAND_USER";
    IdentitySubjectType["StoreUser"] = "STORE_USER";
    IdentitySubjectType["Employee"] = "EMPLOYEE";
    IdentitySubjectType["Member"] = "MEMBER";
    IdentitySubjectType["Device"] = "DEVICE";
    IdentitySubjectType["ServiceAccount"] = "SERVICE_ACCOUNT";
})(IdentitySubjectType || (exports.IdentitySubjectType = IdentitySubjectType = {}));
var OrganizationNodeType;
(function (OrganizationNodeType) {
    OrganizationNodeType["Platform"] = "PLATFORM";
    OrganizationNodeType["Tenant"] = "TENANT";
    OrganizationNodeType["Brand"] = "BRAND";
    OrganizationNodeType["Region"] = "REGION";
    OrganizationNodeType["Store"] = "STORE";
    OrganizationNodeType["Department"] = "DEPARTMENT";
    OrganizationNodeType["Team"] = "TEAM";
})(OrganizationNodeType || (exports.OrganizationNodeType = OrganizationNodeType = {}));
var PolicyEffect;
(function (PolicyEffect) {
    PolicyEffect["Allow"] = "ALLOW";
    PolicyEffect["Deny"] = "DENY";
})(PolicyEffect || (exports.PolicyEffect = PolicyEffect = {}));
var PolicySubjectType;
(function (PolicySubjectType) {
    PolicySubjectType["Role"] = "ROLE";
    PolicySubjectType["User"] = "USER";
    PolicySubjectType["Group"] = "GROUP";
    PolicySubjectType["ServiceAccount"] = "SERVICE_ACCOUNT";
    PolicySubjectType["IntegrationApp"] = "INTEGRATION_APP";
})(PolicySubjectType || (exports.PolicySubjectType = PolicySubjectType = {}));
var PolicyConditionOperator;
(function (PolicyConditionOperator) {
    PolicyConditionOperator["Eq"] = "EQ";
    PolicyConditionOperator["NotEq"] = "NOT_EQ";
    PolicyConditionOperator["In"] = "IN";
    PolicyConditionOperator["NotIn"] = "NOT_IN";
    PolicyConditionOperator["Gte"] = "GTE";
    PolicyConditionOperator["Lte"] = "LTE";
    PolicyConditionOperator["Exists"] = "EXISTS";
})(PolicyConditionOperator || (exports.PolicyConditionOperator = PolicyConditionOperator = {}));
var ConfigValueType;
(function (ConfigValueType) {
    ConfigValueType["Json"] = "JSON";
    ConfigValueType["String"] = "STRING";
    ConfigValueType["Number"] = "NUMBER";
    ConfigValueType["Boolean"] = "BOOLEAN";
})(ConfigValueType || (exports.ConfigValueType = ConfigValueType = {}));
var SecretKind;
(function (SecretKind) {
    SecretKind["ApiKey"] = "API_KEY";
    SecretKind["AccessToken"] = "ACCESS_TOKEN";
    SecretKind["RefreshToken"] = "REFRESH_TOKEN";
    SecretKind["Password"] = "PASSWORD";
    SecretKind["Certificate"] = "CERTIFICATE";
    SecretKind["PrivateKey"] = "PRIVATE_KEY";
    SecretKind["PublicKey"] = "PUBLIC_KEY";
    SecretKind["WebhookSecret"] = "WEBHOOK_SECRET";
})(SecretKind || (exports.SecretKind = SecretKind = {}));
var SecretProvider;
(function (SecretProvider) {
    SecretProvider["Database"] = "DATABASE";
    SecretProvider["Vault"] = "VAULT";
    SecretProvider["Kms"] = "KMS";
    SecretProvider["External"] = "EXTERNAL";
})(SecretProvider || (exports.SecretProvider = SecretProvider = {}));
var CertificateFormat;
(function (CertificateFormat) {
    CertificateFormat["Pem"] = "PEM";
    CertificateFormat["Pfx"] = "PFX";
    CertificateFormat["Jks"] = "JKS";
})(CertificateFormat || (exports.CertificateFormat = CertificateFormat = {}));
var EventStatus;
(function (EventStatus) {
    EventStatus["Pending"] = "PENDING";
    EventStatus["Processing"] = "PROCESSING";
    EventStatus["Published"] = "PUBLISHED";
    EventStatus["Failed"] = "FAILED";
    EventStatus["DeadLetter"] = "DEAD_LETTER";
})(EventStatus || (exports.EventStatus = EventStatus = {}));
var WebhookDeliveryStatus;
(function (WebhookDeliveryStatus) {
    WebhookDeliveryStatus["Pending"] = "PENDING";
    WebhookDeliveryStatus["Delivered"] = "DELIVERED";
    WebhookDeliveryStatus["Failed"] = "FAILED";
    WebhookDeliveryStatus["DeadLetter"] = "DEAD_LETTER";
})(WebhookDeliveryStatus || (exports.WebhookDeliveryStatus = WebhookDeliveryStatus = {}));
var NotificationChannelType;
(function (NotificationChannelType) {
    NotificationChannelType["Email"] = "EMAIL";
    NotificationChannelType["Sms"] = "SMS";
    NotificationChannelType["Push"] = "PUSH";
    NotificationChannelType["InApp"] = "IN_APP";
    NotificationChannelType["Webhook"] = "WEBHOOK";
    NotificationChannelType["Social"] = "SOCIAL";
})(NotificationChannelType || (exports.NotificationChannelType = NotificationChannelType = {}));
var NotificationStatus;
(function (NotificationStatus) {
    NotificationStatus["Pending"] = "PENDING";
    NotificationStatus["Sent"] = "SENT";
    NotificationStatus["Failed"] = "FAILED";
    NotificationStatus["Cancelled"] = "CANCELLED";
})(NotificationStatus || (exports.NotificationStatus = NotificationStatus = {}));
var EdgeNodeStatus;
(function (EdgeNodeStatus) {
    EdgeNodeStatus["Online"] = "ONLINE";
    EdgeNodeStatus["Offline"] = "OFFLINE";
    EdgeNodeStatus["Degraded"] = "DEGRADED";
    EdgeNodeStatus["Maintenance"] = "MAINTENANCE";
})(EdgeNodeStatus || (exports.EdgeNodeStatus = EdgeNodeStatus = {}));
var EdgeSyncDirection;
(function (EdgeSyncDirection) {
    EdgeSyncDirection["Upstream"] = "UPSTREAM";
    EdgeSyncDirection["Downstream"] = "DOWNSTREAM";
    EdgeSyncDirection["Bidirectional"] = "BIDIRECTIONAL";
})(EdgeSyncDirection || (exports.EdgeSyncDirection = EdgeSyncDirection = {}));
var FileAssetKind;
(function (FileAssetKind) {
    FileAssetKind["Avatar"] = "AVATAR";
    FileAssetKind["Image"] = "IMAGE";
    FileAssetKind["Video"] = "VIDEO";
    FileAssetKind["Document"] = "DOCUMENT";
    FileAssetKind["Archive"] = "ARCHIVE";
    FileAssetKind["Certificate"] = "CERTIFICATE";
})(FileAssetKind || (exports.FileAssetKind = FileAssetKind = {}));
var OpenPlatformAppType;
(function (OpenPlatformAppType) {
    OpenPlatformAppType["Internal"] = "INTERNAL";
    OpenPlatformAppType["Isv"] = "ISV";
    OpenPlatformAppType["Partner"] = "PARTNER";
})(OpenPlatformAppType || (exports.OpenPlatformAppType = OpenPlatformAppType = {}));
var QuotaPeriod;
(function (QuotaPeriod) {
    QuotaPeriod["Minute"] = "MINUTE";
    QuotaPeriod["Hour"] = "HOUR";
    QuotaPeriod["Day"] = "DAY";
    QuotaPeriod["Month"] = "MONTH";
})(QuotaPeriod || (exports.QuotaPeriod = QuotaPeriod = {}));
var FeatureFlagStatus;
(function (FeatureFlagStatus) {
    FeatureFlagStatus["Draft"] = "DRAFT";
    FeatureFlagStatus["Active"] = "ACTIVE";
    FeatureFlagStatus["Paused"] = "PAUSED";
    FeatureFlagStatus["Archived"] = "ARCHIVED";
})(FeatureFlagStatus || (exports.FeatureFlagStatus = FeatureFlagStatus = {}));
var RolloutStrategy;
(function (RolloutStrategy) {
    RolloutStrategy["All"] = "ALL";
    RolloutStrategy["Percentage"] = "PERCENTAGE";
    RolloutStrategy["AllowList"] = "ALLOW_LIST";
    RolloutStrategy["ScopeMatch"] = "SCOPE_MATCH";
})(RolloutStrategy || (exports.RolloutStrategy = RolloutStrategy = {}));
var BackupStatus;
(function (BackupStatus) {
    BackupStatus["Pending"] = "PENDING";
    BackupStatus["Running"] = "RUNNING";
    BackupStatus["Succeeded"] = "SUCCEEDED";
    BackupStatus["Failed"] = "FAILED";
})(BackupStatus || (exports.BackupStatus = BackupStatus = {}));
var RestoreStatus;
(function (RestoreStatus) {
    RestoreStatus["Pending"] = "PENDING";
    RestoreStatus["Running"] = "RUNNING";
    RestoreStatus["Succeeded"] = "SUCCEEDED";
    RestoreStatus["Failed"] = "FAILED";
    RestoreStatus["Cancelled"] = "CANCELLED";
})(RestoreStatus || (exports.RestoreStatus = RestoreStatus = {}));
var PiiLevel;
(function (PiiLevel) {
    PiiLevel["Public"] = "PUBLIC";
    PiiLevel["Internal"] = "INTERNAL";
    PiiLevel["Sensitive"] = "SENSITIVE";
    PiiLevel["Restricted"] = "RESTRICTED";
})(PiiLevel || (exports.PiiLevel = PiiLevel = {}));
var AiProvider;
(function (AiProvider) {
    AiProvider["OpenAI"] = "OPENAI";
    AiProvider["AzureOpenAI"] = "AZURE_OPENAI";
    AiProvider["Anthropic"] = "ANTHROPIC";
    AiProvider["Gemini"] = "GEMINI";
    AiProvider["DeepSeek"] = "DEEPSEEK";
})(AiProvider || (exports.AiProvider = AiProvider = {}));
var AiExecutionStatus;
(function (AiExecutionStatus) {
    AiExecutionStatus["Pending"] = "PENDING";
    AiExecutionStatus["Succeeded"] = "SUCCEEDED";
    AiExecutionStatus["Failed"] = "FAILED";
    AiExecutionStatus["Escalated"] = "ESCALATED";
})(AiExecutionStatus || (exports.AiExecutionStatus = AiExecutionStatus = {}));
//# sourceMappingURL=index.js.map