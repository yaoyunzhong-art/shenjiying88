declare enum UserRole {
    SuperAdmin = "SUPER_ADMIN",
    TenantAdmin = "TENANT_ADMIN",
    BrandManager = "BRAND_MANAGER",
    StoreManager = "STORE_MANAGER",
    Guide = "GUIDE",
    Cashier = "CASHIER",
    Operations = "OPERATIONS",
    Finance = "FINANCE",
    Warehouse = "WAREHOUSE",
    Coach = "COACH"
}
declare enum ClientChannel {
    Pc = "PC",
    Pad = "PAD",
    H5 = "H5",
    MiniApp = "MINIAPP",
    App = "APP"
}
declare enum PortalAudience {
    ToC = "TOC",
    ToB = "TOB"
}
declare enum PortalScopeType {
    Tenant = "TENANT",
    Brand = "BRAND",
    Store = "STORE"
}
declare enum PortalChannel {
    Web = "WEB",
    H5 = "H5",
    MiniApp = "MINIAPP",
    App = "APP",
    Pc = "PC",
    Pad = "PAD"
}
declare enum StorefrontSurface {
    OfficialSite = "OFFICIAL_SITE",
    H5 = "H5",
    MiniApp = "MINIAPP",
    App = "APP",
    PcConsole = "PC_CONSOLE",
    PadConsole = "PAD_CONSOLE"
}
declare enum CountryCode {
    China = "CN",
    UnitedStates = "US"
}
declare enum LanguageCode {
    ZhCn = "zh-CN",
    EnUs = "en-US"
}
declare enum CurrencyCode {
    Cny = "CNY",
    Usd = "USD"
}
declare enum TaxMode {
    Included = "PRICES_INCLUDE_TAX",
    Excluded = "PRICES_EXCLUDE_TAX",
    Zero = "ZERO_TAX"
}
declare enum NetworkRegion {
    MainlandChina = "MAINLAND_CHINA",
    NorthAmerica = "NORTH_AMERICA",
    Global = "GLOBAL"
}
declare enum EmailProvider {
    AliyunDm = "ALIYUN_DM",
    SendGrid = "SENDGRID",
    Ses = "SES",
    Resend = "RESEND"
}
declare enum SocialPlatform {
    Wechat = "WECHAT",
    Weibo = "WEIBO",
    Xiaohongshu = "XIAOHONGSHU",
    Douyin = "DOUYIN",
    Facebook = "FACEBOOK",
    Instagram = "INSTAGRAM",
    X = "X",
    LinkedIn = "LINKEDIN",
    TikTok = "TIKTOK"
}
declare enum ConfigInheritanceMode {
    PlatformDefault = "PLATFORM_DEFAULT",
    TenantDefault = "TENANT_DEFAULT",
    BrandOverride = "BRAND_OVERRIDE",
    StoreOverride = "STORE_OVERRIDE"
}
interface TenantScope {
    tenantId: string;
    brandId?: string;
    storeId?: string;
}
interface LocalePolicy {
    defaultLanguage: LanguageCode;
    supportedLanguages: LanguageCode[];
}
interface TimezonePolicy {
    timezone: string;
}
interface CurrencyPolicy {
    currencyCode: CurrencyCode;
    symbol: string;
}
interface TaxPolicy {
    taxMode: TaxMode;
    taxRate?: number;
    taxLabel: string;
}
interface NetworkPolicy {
    networkRegion: NetworkRegion;
    apiBaseUrl: string;
    cdnBaseUrl: string;
    callbackBaseUrl?: string;
}
interface EmailPolicy {
    provider: EmailProvider;
    fromName: string;
    fromAddress: string;
    replyTo?: string;
}
interface SocialPolicy {
    primaryPlatforms: SocialPlatform[];
    supportPlatforms: SocialPlatform[];
}
interface MarketProfile {
    marketCode: string;
    marketName: string;
    countryCode: CountryCode;
    locale: LocalePolicy;
    timezone: TimezonePolicy;
    currency: CurrencyPolicy;
    tax: TaxPolicy;
    network: NetworkPolicy;
    email: EmailPolicy;
    social: SocialPolicy;
}
interface RegionalConfigOverride {
    scopeType: PortalScopeType;
    scopeCode: string;
    inheritanceMode: ConfigInheritanceMode;
    marketCode: string;
    locale?: Partial<LocalePolicy>;
    timezone?: Partial<TimezonePolicy>;
    currency?: Partial<CurrencyPolicy>;
    tax?: Partial<TaxPolicy>;
    network?: Partial<NetworkPolicy>;
    email?: Partial<EmailPolicy>;
    social?: Partial<SocialPolicy>;
}
interface PortalLoginEntry {
    label: string;
    loginPath: string;
    ssoEnabled: boolean;
}
interface BasePortal {
    audience: PortalAudience;
    scopeType: PortalScopeType;
    scopeCode: string;
    marketCode: string;
    channel: PortalChannel;
    name: string;
    primaryDomain?: string;
    supportedLanguages: LanguageCode[];
}
interface StorePortal extends BasePortal {
    audience: PortalAudience.ToC;
    scopeType: PortalScopeType.Store;
    tenantCode: string;
    brandCode: string;
    storeCode: string;
    storeName: string;
    supportedSurfaces: StorefrontSurface[];
}
interface TobPortal extends BasePortal {
    audience: PortalAudience.ToB;
    scopeType: PortalScopeType.Tenant | PortalScopeType.Brand;
    tenantCode: string;
    brandCode?: string;
    heroTitle: string;
    heroSubtitle: string;
    solutionTags: string[];
    loginEntry: PortalLoginEntry;
}
interface WorkbenchNavItem {
    key: string;
    label: string;
    href: string;
    description: string;
}
interface RoleWorkbench {
    role: UserRole;
    channel: ClientChannel;
    title: string;
    description: string;
    navItems: WorkbenchNavItem[];
    marketCodes?: string[];
}
interface LytMemberProfile {
    memberId: string;
    mobile?: string;
    nickname?: string;
    levelName?: string;
}
interface LytOrderPayload {
    storeId: string;
    memberId?: string;
    items: Array<{
        skuId: string;
        quantity: number;
        price: number;
    }>;
}
interface LytOrderResult {
    orderId: string;
    totalAmount: number;
    status: 'CREATED' | 'PAID' | 'FAILED';
}
type StructuredValue = string | number | boolean | null | StructuredValue[] | {
    [key: string]: StructuredValue;
};
declare enum FoundationScopeType {
    Platform = "PLATFORM",
    Tenant = "TENANT",
    Brand = "BRAND",
    Store = "STORE",
    Market = "MARKET",
    Portal = "PORTAL",
    User = "USER",
    Device = "DEVICE",
    Integration = "INTEGRATION"
}
declare enum IdentitySubjectType {
    PlatformUser = "PLATFORM_USER",
    TenantUser = "TENANT_USER",
    BrandUser = "BRAND_USER",
    StoreUser = "STORE_USER",
    Employee = "EMPLOYEE",
    Member = "MEMBER",
    Device = "DEVICE",
    ServiceAccount = "SERVICE_ACCOUNT"
}
declare enum OrganizationNodeType {
    Platform = "PLATFORM",
    Tenant = "TENANT",
    Brand = "BRAND",
    Region = "REGION",
    Store = "STORE",
    Department = "DEPARTMENT",
    Team = "TEAM"
}
declare enum PolicyEffect {
    Allow = "ALLOW",
    Deny = "DENY"
}
declare enum PolicySubjectType {
    Role = "ROLE",
    User = "USER",
    Group = "GROUP",
    ServiceAccount = "SERVICE_ACCOUNT",
    IntegrationApp = "INTEGRATION_APP"
}
declare enum PolicyConditionOperator {
    Eq = "EQ",
    NotEq = "NOT_EQ",
    In = "IN",
    NotIn = "NOT_IN",
    Gte = "GTE",
    Lte = "LTE",
    Exists = "EXISTS"
}
declare enum ConfigValueType {
    Json = "JSON",
    String = "STRING",
    Number = "NUMBER",
    Boolean = "BOOLEAN"
}
declare enum SecretKind {
    ApiKey = "API_KEY",
    AccessToken = "ACCESS_TOKEN",
    RefreshToken = "REFRESH_TOKEN",
    Password = "PASSWORD",
    Certificate = "CERTIFICATE",
    PrivateKey = "PRIVATE_KEY",
    PublicKey = "PUBLIC_KEY",
    WebhookSecret = "WEBHOOK_SECRET"
}
declare enum SecretProvider {
    Database = "DATABASE",
    Vault = "VAULT",
    Kms = "KMS",
    External = "EXTERNAL"
}
declare enum CertificateFormat {
    Pem = "PEM",
    Pfx = "PFX",
    Jks = "JKS"
}
declare enum EventStatus {
    Pending = "PENDING",
    Processing = "PROCESSING",
    Published = "PUBLISHED",
    Failed = "FAILED",
    DeadLetter = "DEAD_LETTER"
}
declare enum WebhookDeliveryStatus {
    Pending = "PENDING",
    Delivered = "DELIVERED",
    Failed = "FAILED",
    DeadLetter = "DEAD_LETTER"
}
declare enum NotificationChannelType {
    Email = "EMAIL",
    Sms = "SMS",
    Push = "PUSH",
    InApp = "IN_APP",
    Webhook = "WEBHOOK",
    Social = "SOCIAL"
}
declare enum NotificationStatus {
    Pending = "PENDING",
    Sent = "SENT",
    Failed = "FAILED",
    Cancelled = "CANCELLED"
}
declare enum EdgeNodeStatus {
    Online = "ONLINE",
    Offline = "OFFLINE",
    Degraded = "DEGRADED",
    Maintenance = "MAINTENANCE"
}
declare enum EdgeSyncDirection {
    Upstream = "UPSTREAM",
    Downstream = "DOWNSTREAM",
    Bidirectional = "BIDIRECTIONAL"
}
declare enum FileAssetKind {
    Avatar = "AVATAR",
    Image = "IMAGE",
    Video = "VIDEO",
    Document = "DOCUMENT",
    Archive = "ARCHIVE",
    Certificate = "CERTIFICATE"
}
declare enum OpenPlatformAppType {
    Internal = "INTERNAL",
    Isv = "ISV",
    Partner = "PARTNER"
}
declare enum QuotaPeriod {
    Minute = "MINUTE",
    Hour = "HOUR",
    Day = "DAY",
    Month = "MONTH"
}
declare enum FeatureFlagStatus {
    Draft = "DRAFT",
    Active = "ACTIVE",
    Paused = "PAUSED",
    Archived = "ARCHIVED"
}
declare enum RolloutStrategy {
    All = "ALL",
    Percentage = "PERCENTAGE",
    AllowList = "ALLOW_LIST",
    ScopeMatch = "SCOPE_MATCH"
}
declare enum BackupStatus {
    Pending = "PENDING",
    Running = "RUNNING",
    Succeeded = "SUCCEEDED",
    Failed = "FAILED"
}
declare enum RestoreStatus {
    Pending = "PENDING",
    Running = "RUNNING",
    Succeeded = "SUCCEEDED",
    Failed = "FAILED",
    Cancelled = "CANCELLED"
}
declare enum PiiLevel {
    Public = "PUBLIC",
    Internal = "INTERNAL",
    Sensitive = "SENSITIVE",
    Restricted = "RESTRICTED"
}
declare enum AiProvider {
    OpenAI = "OPENAI",
    AzureOpenAI = "AZURE_OPENAI",
    Anthropic = "ANTHROPIC",
    Gemini = "GEMINI",
    DeepSeek = "DEEPSEEK"
}
declare enum AiExecutionStatus {
    Pending = "PENDING",
    Succeeded = "SUCCEEDED",
    Failed = "FAILED",
    Escalated = "ESCALATED"
}
interface FoundationScope {
    scopeType: FoundationScopeType;
    scopeId: string;
    tenantId?: string;
    brandId?: string;
    storeId?: string;
    marketCode?: string;
    portalCode?: string;
}
interface IdentityAccount {
    id: string;
    subjectType: IdentitySubjectType;
    username?: string;
    mobile?: string;
    email?: string;
    displayName: string;
    status: string;
    tenantScope?: TenantScope;
    organizationIds: string[];
    roleKeys: string[];
    loginPolicyKey?: string;
    metadata?: Record<string, StructuredValue>;
}
interface OrganizationNode {
    id: string;
    nodeType: OrganizationNodeType;
    code: string;
    name: string;
    scope: FoundationScope;
    parentId?: string;
    attributes?: Record<string, StructuredValue>;
}
interface OrganizationMembership {
    id: string;
    identityId: string;
    organizationNodeId: string;
    titles?: string[];
    isPrimary: boolean;
    effectiveFrom?: string;
    effectiveTo?: string;
}
interface PolicySubject {
    subjectType: PolicySubjectType;
    subjectId: string;
}
interface PolicyCondition {
    field: string;
    operator: PolicyConditionOperator;
    value?: StructuredValue;
}
interface AccessPolicy {
    id: string;
    name: string;
    effect: PolicyEffect;
    scope: FoundationScope;
    subjects: PolicySubject[];
    actions: string[];
    resources: string[];
    conditions?: PolicyCondition[];
    dataScope?: StructuredValue;
}
interface ConfigEntry {
    id: string;
    namespace: string;
    key: string;
    valueType: ConfigValueType;
    scope: FoundationScope;
    version: number;
    value: StructuredValue;
    schemaRef?: string;
    tags?: string[];
}
interface ConfigRevision {
    id: string;
    configEntryId: string;
    version: number;
    changedBy: string;
    changeReason?: string;
    snapshot: StructuredValue;
    createdAt: string;
}
interface SecretAsset {
    id: string;
    key: string;
    kind: SecretKind;
    provider: SecretProvider;
    scope: FoundationScope;
    version: number;
    reference: string;
    expiresAt?: string;
    rotatedAt?: string;
    metadata?: Record<string, StructuredValue>;
}
interface CertificateAsset {
    id: string;
    name: string;
    format: CertificateFormat;
    scope: FoundationScope;
    domains: string[];
    secretRef: string;
    expiresAt: string;
    autoRenew: boolean;
}
interface DomainEvent {
    id: string;
    eventType: string;
    aggregateType: string;
    aggregateId: string;
    scope: FoundationScope;
    idempotencyKey?: string;
    status: EventStatus;
    payload: StructuredValue;
    occurredAt: string;
}
interface WebhookSubscription {
    id: string;
    topic: string;
    scope: FoundationScope;
    targetUrl: string;
    secretRef: string;
    enabled: boolean;
    retryLimit: number;
    metadata?: Record<string, StructuredValue>;
}
interface AuditTrailRecord {
    id: string;
    action: string;
    actorId: string;
    actorType: IdentitySubjectType;
    scope: FoundationScope;
    resourceType: string;
    resourceId?: string;
    sourceChannel?: ClientChannel | PortalChannel;
    before?: StructuredValue;
    after?: StructuredValue;
    occurredAt: string;
}
interface NotificationTemplate {
    id: string;
    code: string;
    channel: NotificationChannelType;
    marketCode?: string;
    locale: LanguageCode;
    titleTemplate?: string;
    bodyTemplate: string;
    variables: string[];
}
interface NotificationDispatch {
    id: string;
    templateId?: string;
    channel: NotificationChannelType;
    scope: FoundationScope;
    recipient: string;
    payload: StructuredValue;
    status: NotificationStatus;
    scheduledAt?: string;
    sentAt?: string;
}
interface EdgeNode {
    id: string;
    code: string;
    tenantId: string;
    brandId?: string;
    storeId?: string;
    status: EdgeNodeStatus;
    lastSeenAt?: string;
    capabilities: string[];
}
interface EdgeSyncTask {
    id: string;
    edgeNodeId: string;
    direction: EdgeSyncDirection;
    aggregateType: string;
    aggregateId: string;
    status: EventStatus;
    payload: StructuredValue;
    retryCount: number;
}
interface FileAsset {
    id: string;
    kind: FileAssetKind;
    scope: FoundationScope;
    bucket: string;
    objectKey: string;
    mimeType: string;
    size: number;
    checksum?: string;
    tags?: string[];
}
interface OpenPlatformApp {
    id: string;
    appType: OpenPlatformAppType;
    name: string;
    appKey: string;
    scope: FoundationScope;
    redirectUris: string[];
    webhookTopics: string[];
    rateLimitPolicyId?: string;
    sandboxEnabled: boolean;
}
interface RateLimitPolicy {
    id: string;
    code: string;
    scope: FoundationScope;
    period: QuotaPeriod;
    limit: number;
    burstLimit?: number;
    dimensionKeys: string[];
}
interface QuotaLedger {
    id: string;
    policyId: string;
    subjectKey: string;
    period: QuotaPeriod;
    consumed: number;
    remaining?: number;
    resetAt: string;
}
interface FeatureFlag {
    id: string;
    key: string;
    name: string;
    status: FeatureFlagStatus;
    scope: FoundationScope;
    strategy: RolloutStrategy;
    enabled: boolean;
    percentage?: number;
    allowList?: string[];
}
interface BackupSnapshot {
    id: string;
    resourceType: string;
    resourceId: string;
    scope: FoundationScope;
    status: BackupStatus;
    storageUri: string;
    capturedAt: string;
    expiresAt?: string;
}
interface RestoreRun {
    id: string;
    backupSnapshotId: string;
    scope: FoundationScope;
    status: RestoreStatus;
    requestedBy: string;
    targetEnvironment: string;
    startedAt?: string;
    finishedAt?: string;
}
interface PiiPolicy {
    id: string;
    fieldName: string;
    piiLevel: PiiLevel;
    scope: FoundationScope;
    maskingStrategy: string;
    retentionDays?: number;
    purposeLimit?: string[];
}
interface AiModelConfig {
    id: string;
    provider: AiProvider;
    model: string;
    scope: FoundationScope;
    maxInputTokens: number;
    maxOutputTokens: number;
    costQuotaId?: string;
    safetyPolicyId?: string;
}
interface AiPromptTemplate {
    id: string;
    code: string;
    modelConfigId: string;
    version: number;
    prompt: string;
    variables: string[];
    outputSchema?: StructuredValue;
}
interface AiExecutionRecord {
    id: string;
    modelConfigId: string;
    promptTemplateId?: string;
    scope: FoundationScope;
    status: AiExecutionStatus;
    input: StructuredValue;
    output?: StructuredValue;
    tokenUsage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    escalatedToHuman: boolean;
    createdAt: string;
}

export { type AccessPolicy, type AiExecutionRecord, AiExecutionStatus, type AiModelConfig, type AiPromptTemplate, AiProvider, type AuditTrailRecord, type BackupSnapshot, BackupStatus, type BasePortal, type CertificateAsset, CertificateFormat, ClientChannel, type ConfigEntry, ConfigInheritanceMode, type ConfigRevision, ConfigValueType, CountryCode, CurrencyCode, type CurrencyPolicy, type DomainEvent, type EdgeNode, EdgeNodeStatus, EdgeSyncDirection, type EdgeSyncTask, type EmailPolicy, EmailProvider, EventStatus, type FeatureFlag, FeatureFlagStatus, type FileAsset, FileAssetKind, type FoundationScope, FoundationScopeType, type IdentityAccount, IdentitySubjectType, LanguageCode, type LocalePolicy, type LytMemberProfile, type LytOrderPayload, type LytOrderResult, type MarketProfile, type NetworkPolicy, NetworkRegion, NotificationChannelType, type NotificationDispatch, NotificationStatus, type NotificationTemplate, type OpenPlatformApp, OpenPlatformAppType, type OrganizationMembership, type OrganizationNode, OrganizationNodeType, PiiLevel, type PiiPolicy, type PolicyCondition, PolicyConditionOperator, PolicyEffect, type PolicySubject, PolicySubjectType, PortalAudience, PortalChannel, type PortalLoginEntry, PortalScopeType, type QuotaLedger, QuotaPeriod, type RateLimitPolicy, type RegionalConfigOverride, type RestoreRun, RestoreStatus, type RoleWorkbench, RolloutStrategy, type SecretAsset, SecretKind, SecretProvider, SocialPlatform, type SocialPolicy, type StorePortal, StorefrontSurface, type StructuredValue, TaxMode, type TaxPolicy, type TenantScope, type TimezonePolicy, type TobPortal, UserRole, WebhookDeliveryStatus, type WebhookSubscription, type WorkbenchNavItem };
