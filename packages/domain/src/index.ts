export enum UserRole {
  SuperAdmin = 'SUPER_ADMIN',
  TenantAdmin = 'TENANT_ADMIN',
  BrandManager = 'BRAND_MANAGER',
  StoreManager = 'STORE_MANAGER',
  Guide = 'GUIDE',
  Cashier = 'CASHIER',
  Operations = 'OPERATIONS',
  Finance = 'FINANCE',
  Warehouse = 'WAREHOUSE',
  Coach = 'COACH'
}

export enum ClientChannel {
  Pc = 'PC',
  Pad = 'PAD',
  H5 = 'H5',
  MiniApp = 'MINIAPP',
  App = 'APP'
}

export enum PortalAudience {
  ToC = 'TOC',
  ToB = 'TOB'
}

export enum PortalScopeType {
  Tenant = 'TENANT',
  Brand = 'BRAND',
  Store = 'STORE'
}

export enum PortalChannel {
  Web = 'WEB',
  H5 = 'H5',
  MiniApp = 'MINIAPP',
  App = 'APP',
  Pc = 'PC',
  Pad = 'PAD'
}

export enum StorefrontSurface {
  OfficialSite = 'OFFICIAL_SITE',
  H5 = 'H5',
  MiniApp = 'MINIAPP',
  App = 'APP',
  PcConsole = 'PC_CONSOLE',
  PadConsole = 'PAD_CONSOLE'
}

export enum CountryCode {
  China = 'CN',
  UnitedStates = 'US'
}

export enum LanguageCode {
  ZhCn = 'zh-CN',
  EnUs = 'en-US'
}

export enum CurrencyCode {
  Cny = 'CNY',
  Usd = 'USD'
}

export enum TaxMode {
  Included = 'PRICES_INCLUDE_TAX',
  Excluded = 'PRICES_EXCLUDE_TAX',
  Zero = 'ZERO_TAX'
}

export enum NetworkRegion {
  MainlandChina = 'MAINLAND_CHINA',
  NorthAmerica = 'NORTH_AMERICA',
  Global = 'GLOBAL'
}

export enum EmailProvider {
  AliyunDm = 'ALIYUN_DM',
  SendGrid = 'SENDGRID',
  Ses = 'SES',
  Resend = 'RESEND'
}

export enum SocialPlatform {
  Wechat = 'WECHAT',
  Weibo = 'WEIBO',
  Xiaohongshu = 'XIAOHONGSHU',
  Douyin = 'DOUYIN',
  Facebook = 'FACEBOOK',
  Instagram = 'INSTAGRAM',
  X = 'X',
  LinkedIn = 'LINKEDIN',
  TikTok = 'TIKTOK'
}

export enum ConfigInheritanceMode {
  PlatformDefault = 'PLATFORM_DEFAULT',
  TenantDefault = 'TENANT_DEFAULT',
  BrandOverride = 'BRAND_OVERRIDE',
  StoreOverride = 'STORE_OVERRIDE'
}

export interface TenantScope {
  tenantId: string;
  brandId?: string;
  storeId?: string;
}

export interface LocalePolicy {
  defaultLanguage: LanguageCode;
  supportedLanguages: LanguageCode[];
}

export interface TimezonePolicy {
  timezone: string;
}

export interface CurrencyPolicy {
  currencyCode: CurrencyCode;
  symbol: string;
}

export interface TaxPolicy {
  taxMode: TaxMode;
  taxRate?: number;
  taxLabel: string;
}

export interface NetworkPolicy {
  networkRegion: NetworkRegion;
  apiBaseUrl: string;
  cdnBaseUrl: string;
  callbackBaseUrl?: string;
}

export interface EmailPolicy {
  provider: EmailProvider;
  fromName: string;
  fromAddress: string;
  replyTo?: string;
}

export interface SocialPolicy {
  primaryPlatforms: SocialPlatform[];
  supportPlatforms: SocialPlatform[];
}

export interface MarketProfile {
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

export interface RegionalConfigOverride {
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

export interface PortalLoginEntry {
  label: string;
  loginPath: string;
  ssoEnabled: boolean;
}

export interface BasePortal {
  audience: PortalAudience;
  scopeType: PortalScopeType;
  scopeCode: string;
  marketCode: string;
  channel: PortalChannel;
  name: string;
  primaryDomain?: string;
  supportedLanguages: LanguageCode[];
}

export interface StorePortal extends BasePortal {
  audience: PortalAudience.ToC;
  scopeType: PortalScopeType.Store;
  tenantCode: string;
  brandCode: string;
  storeCode: string;
  storeName: string;
  supportedSurfaces: StorefrontSurface[];
}

export interface TobPortal extends BasePortal {
  audience: PortalAudience.ToB;
  scopeType: PortalScopeType.Tenant | PortalScopeType.Brand;
  tenantCode: string;
  brandCode?: string;
  heroTitle: string;
  heroSubtitle: string;
  solutionTags: string[];
  loginEntry: PortalLoginEntry;
}

export interface WorkbenchNavItem {
  key: string;
  label: string;
  href: string;
  description: string;
}

export interface RoleWorkbench {
  role: UserRole;
  channel: ClientChannel;
  title: string;
  description: string;
  navItems: WorkbenchNavItem[];
  marketCodes?: string[];
}

export interface LytMemberProfile {
  memberId: string;
  mobile?: string;
  nickname?: string;
  levelName?: string;
}

export interface LytOrderPayload {
  storeId: string;
  memberId?: string;
  items: Array<{
    skuId: string;
    quantity: number;
    price: number;
  }>;
}

export interface LytOrderResult {
  orderId: string;
  totalAmount: number;
  status: 'CREATED' | 'PAID' | 'FAILED';
}

export type StructuredValue =
  | string
  | number
  | boolean
  | null
  | StructuredValue[]
  | { [key: string]: StructuredValue };

export enum FoundationScopeType {
  Platform = 'PLATFORM',
  Tenant = 'TENANT',
  Brand = 'BRAND',
  Store = 'STORE',
  Market = 'MARKET',
  Portal = 'PORTAL',
  User = 'USER',
  Device = 'DEVICE',
  Integration = 'INTEGRATION'
}

export enum IdentitySubjectType {
  PlatformUser = 'PLATFORM_USER',
  TenantUser = 'TENANT_USER',
  BrandUser = 'BRAND_USER',
  StoreUser = 'STORE_USER',
  Employee = 'EMPLOYEE',
  Member = 'MEMBER',
  Device = 'DEVICE',
  ServiceAccount = 'SERVICE_ACCOUNT'
}

export enum OrganizationNodeType {
  Platform = 'PLATFORM',
  Tenant = 'TENANT',
  Brand = 'BRAND',
  Region = 'REGION',
  Store = 'STORE',
  Department = 'DEPARTMENT',
  Team = 'TEAM'
}

export enum PolicyEffect {
  Allow = 'ALLOW',
  Deny = 'DENY'
}

export enum PolicySubjectType {
  Role = 'ROLE',
  User = 'USER',
  Group = 'GROUP',
  ServiceAccount = 'SERVICE_ACCOUNT',
  IntegrationApp = 'INTEGRATION_APP'
}

export enum PolicyConditionOperator {
  Eq = 'EQ',
  NotEq = 'NOT_EQ',
  In = 'IN',
  NotIn = 'NOT_IN',
  Gte = 'GTE',
  Lte = 'LTE',
  Exists = 'EXISTS'
}

export enum ConfigValueType {
  Json = 'JSON',
  String = 'STRING',
  Number = 'NUMBER',
  Boolean = 'BOOLEAN'
}

export enum SecretKind {
  ApiKey = 'API_KEY',
  AccessToken = 'ACCESS_TOKEN',
  RefreshToken = 'REFRESH_TOKEN',
  Password = 'PASSWORD',
  Certificate = 'CERTIFICATE',
  PrivateKey = 'PRIVATE_KEY',
  PublicKey = 'PUBLIC_KEY',
  WebhookSecret = 'WEBHOOK_SECRET'
}

export enum SecretProvider {
  Database = 'DATABASE',
  Vault = 'VAULT',
  Kms = 'KMS',
  External = 'EXTERNAL'
}

export enum CertificateFormat {
  Pem = 'PEM',
  Pfx = 'PFX',
  Jks = 'JKS'
}

export enum EventStatus {
  Pending = 'PENDING',
  Processing = 'PROCESSING',
  Published = 'PUBLISHED',
  Failed = 'FAILED',
  DeadLetter = 'DEAD_LETTER'
}

export enum WebhookDeliveryStatus {
  Pending = 'PENDING',
  Delivered = 'DELIVERED',
  Failed = 'FAILED',
  DeadLetter = 'DEAD_LETTER'
}

export enum NotificationChannelType {
  Email = 'EMAIL',
  Sms = 'SMS',
  Push = 'PUSH',
  InApp = 'IN_APP',
  Webhook = 'WEBHOOK',
  Social = 'SOCIAL'
}

export enum NotificationStatus {
  Pending = 'PENDING',
  Sent = 'SENT',
  Failed = 'FAILED',
  Cancelled = 'CANCELLED'
}

export enum EdgeNodeStatus {
  Online = 'ONLINE',
  Offline = 'OFFLINE',
  Degraded = 'DEGRADED',
  Maintenance = 'MAINTENANCE'
}

export enum EdgeSyncDirection {
  Upstream = 'UPSTREAM',
  Downstream = 'DOWNSTREAM',
  Bidirectional = 'BIDIRECTIONAL'
}

export enum FileAssetKind {
  Avatar = 'AVATAR',
  Image = 'IMAGE',
  Video = 'VIDEO',
  Document = 'DOCUMENT',
  Archive = 'ARCHIVE',
  Certificate = 'CERTIFICATE'
}

export enum OpenPlatformAppType {
  Internal = 'INTERNAL',
  Isv = 'ISV',
  Partner = 'PARTNER'
}

export enum QuotaPeriod {
  Minute = 'MINUTE',
  Hour = 'HOUR',
  Day = 'DAY',
  Month = 'MONTH'
}

export enum FeatureFlagStatus {
  Draft = 'DRAFT',
  Active = 'ACTIVE',
  Paused = 'PAUSED',
  Archived = 'ARCHIVED'
}

export enum RolloutStrategy {
  All = 'ALL',
  Percentage = 'PERCENTAGE',
  AllowList = 'ALLOW_LIST',
  ScopeMatch = 'SCOPE_MATCH'
}

export enum BackupStatus {
  Pending = 'PENDING',
  Running = 'RUNNING',
  Succeeded = 'SUCCEEDED',
  Failed = 'FAILED'
}

export enum RestoreStatus {
  Pending = 'PENDING',
  Running = 'RUNNING',
  Succeeded = 'SUCCEEDED',
  Failed = 'FAILED',
  Cancelled = 'CANCELLED'
}

export enum PiiLevel {
  Public = 'PUBLIC',
  Internal = 'INTERNAL',
  Sensitive = 'SENSITIVE',
  Restricted = 'RESTRICTED'
}

export enum AiProvider {
  OpenAI = 'OPENAI',
  AzureOpenAI = 'AZURE_OPENAI',
  Anthropic = 'ANTHROPIC',
  Gemini = 'GEMINI',
  DeepSeek = 'DEEPSEEK'
}

export enum AiExecutionStatus {
  Pending = 'PENDING',
  Succeeded = 'SUCCEEDED',
  Failed = 'FAILED',
  Escalated = 'ESCALATED'
}

export interface FoundationScope {
  scopeType: FoundationScopeType;
  scopeId: string;
  tenantId?: string;
  brandId?: string;
  storeId?: string;
  marketCode?: string;
  portalCode?: string;
}

export interface IdentityAccount {
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

export interface OrganizationNode {
  id: string;
  nodeType: OrganizationNodeType;
  code: string;
  name: string;
  scope: FoundationScope;
  parentId?: string;
  attributes?: Record<string, StructuredValue>;
}

export interface OrganizationMembership {
  id: string;
  identityId: string;
  organizationNodeId: string;
  titles?: string[];
  isPrimary: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface PolicySubject {
  subjectType: PolicySubjectType;
  subjectId: string;
}

export interface PolicyCondition {
  field: string;
  operator: PolicyConditionOperator;
  value?: StructuredValue;
}

export interface AccessPolicy {
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

export interface ConfigEntry {
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

export interface ConfigRevision {
  id: string;
  configEntryId: string;
  version: number;
  changedBy: string;
  changeReason?: string;
  snapshot: StructuredValue;
  createdAt: string;
}

export interface SecretAsset {
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

export interface CertificateAsset {
  id: string;
  name: string;
  format: CertificateFormat;
  scope: FoundationScope;
  domains: string[];
  secretRef: string;
  expiresAt: string;
  autoRenew: boolean;
}

export interface DomainEvent {
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

export interface WebhookSubscription {
  id: string;
  topic: string;
  scope: FoundationScope;
  targetUrl: string;
  secretRef: string;
  enabled: boolean;
  retryLimit: number;
  metadata?: Record<string, StructuredValue>;
}

export interface AuditTrailRecord {
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

export interface NotificationTemplate {
  id: string;
  code: string;
  channel: NotificationChannelType;
  marketCode?: string;
  locale: LanguageCode;
  titleTemplate?: string;
  bodyTemplate: string;
  variables: string[];
}

export interface NotificationDispatch {
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

export interface EdgeNode {
  id: string;
  code: string;
  tenantId: string;
  brandId?: string;
  storeId?: string;
  status: EdgeNodeStatus;
  lastSeenAt?: string;
  capabilities: string[];
}

export interface EdgeSyncTask {
  id: string;
  edgeNodeId: string;
  direction: EdgeSyncDirection;
  aggregateType: string;
  aggregateId: string;
  status: EventStatus;
  payload: StructuredValue;
  retryCount: number;
}

export interface FileAsset {
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

export interface OpenPlatformApp {
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

export interface RateLimitPolicy {
  id: string;
  code: string;
  scope: FoundationScope;
  period: QuotaPeriod;
  limit: number;
  burstLimit?: number;
  dimensionKeys: string[];
}

export interface QuotaLedger {
  id: string;
  policyId: string;
  subjectKey: string;
  period: QuotaPeriod;
  consumed: number;
  remaining?: number;
  resetAt: string;
}

export interface FeatureFlag {
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

export interface BackupSnapshot {
  id: string;
  resourceType: string;
  resourceId: string;
  scope: FoundationScope;
  status: BackupStatus;
  storageUri: string;
  capturedAt: string;
  expiresAt?: string;
}

export interface RestoreRun {
  id: string;
  backupSnapshotId: string;
  scope: FoundationScope;
  status: RestoreStatus;
  requestedBy: string;
  targetEnvironment: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface PiiPolicy {
  id: string;
  fieldName: string;
  piiLevel: PiiLevel;
  scope: FoundationScope;
  maskingStrategy: string;
  retentionDays?: number;
  purposeLimit?: string[];
}

export interface AiModelConfig {
  id: string;
  provider: AiProvider;
  model: string;
  scope: FoundationScope;
  maxInputTokens: number;
  maxOutputTokens: number;
  costQuotaId?: string;
  safetyPolicyId?: string;
}

export interface AiPromptTemplate {
  id: string;
  code: string;
  modelConfigId: string;
  version: number;
  prompt: string;
  variables: string[];
  outputSchema?: StructuredValue;
}

export interface AiExecutionRecord {
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
