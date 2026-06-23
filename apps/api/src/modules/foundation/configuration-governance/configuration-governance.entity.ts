import { FoundationScopeType } from '@prisma/client'

/**
 * 配置条目状态
 */
export enum ConfigEntryStatus {
  ACTIVE = 'ACTIVE',
  DRAFT = 'DRAFT',
  ARCHIVED = 'ARCHIVED'
}

/**
 * Feature Flag 状态
 */
export enum FeatureFlagState {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  ARCHIVED = 'ARCHIVED'
}

/**
 * 秘密凭证类型
 */
export enum SecretKind {
  ApiKey = 'api-key',
  WebhookSigning = 'webhook-signing',
  Certificate = 'certificate'
}

/**
 * 秘密凭证供应商
 */
export enum SecretProviderKind {
  DATABASE = 'DATABASE',
  VAULT = 'VAULT',
  KMS = 'KMS',
  EXTERNAL = 'EXTERNAL'
}

/**
 * 配置层级
 */
export enum ConfigLayer {
  Platform = 'platform',
  Market = 'market',
  Tenant = 'tenant',
  Brand = 'brand',
  Store = 'store'
}

/**
 * 配置片段 - 单层配置快照
 */
export interface ConfigFragment {
  locale?: string
  currency?: string
  timezone?: string
  loginPolicy?: LoginPolicyConfig
  notifications?: NotificationConfig
  checkout?: CheckoutConfig
}

/**
 * 登录策略配置
 */
export interface LoginPolicyConfig {
  mfaRequired?: boolean
  sessionTtlMinutes?: number
  allowedLoginMethods?: string[]
}

/**
 * 通知配置
 */
export interface NotificationConfig {
  emailProvider?: string
  smsProvider?: string
  digestWindow?: string
}

/**
 * 结账配置
 */
export interface CheckoutConfig {
  allowGuestCheckout?: boolean
  paymentChannels?: string[]
}

/**
 * Feature Flag 定义
 */
export interface FeatureFlagDefinition {
  key: string
  name: string
  description: string
  defaultEnabled: boolean
  rules: FeatureFlagRule[]
}

/**
 * Feature Flag 规则
 */
export interface FeatureFlagRule {
  scope: Record<string, string | undefined>
  enabled: boolean
  rolloutPercentage?: number
  note: string
}

/**
 * 配置条目查询结果
 */
export interface ConfigEntryResult {
  id: string
  namespace: string
  key: string
  valueType: string
  scopeType: FoundationScopeType
  tenantId: string | null
  brandId: string | null
  storeId: string | null
  marketProfileId: string | null
  portalSiteId: string | null
  version: number
  value: unknown
  schemaRef: string | null
  tags: string[]
  status: string
  createdBy: string | null
  latestRevision: {
    version: number
    changedBy: string
    changeReason?: string | null
    createdAt: string
  } | null
  updatedAt: string
}

/**
 * 秘密凭证记录
 */
export interface SecretRecord {
  name: string
  type: 'webhook-signing' | 'api-key' | 'certificate'
  scopes: string[]
  consumers: string[]
  algorithm: string
  currentVersion: number
  status: 'active' | 'rotation-due'
  lastRotatedAt: string
  expiresAt?: string
  value: string
  versions: SecretVersionRecord[]
  source?: 'in-memory' | 'persisted'
}

/**
 * 秘密凭证版本记录
 */
export interface SecretVersionRecord {
  version: number
  fingerprint: string
  createdAt: string
  expiresAt: string
  rotatedBy: string
}

/**
 * 证书记录
 */
export interface CertificateRecord {
  name: string
  secretName: string
  format: 'PEM' | 'PFX' | 'JKS'
  scopes: string[]
  consumers: string[]
  domains: string[]
  issuer: string
  autoRenew: boolean
  issuedAt: string
  expiresAt: string
  lastValidatedAt: string
  rotatedBy: string
  status?: 'active' | 'expiring-soon' | 'expired'
}

/**
 * 配置快照
 */
export interface ConfigSnapshot {
  snapshotId: string
  generatedAt: string
  scopeChain: ConfigLayer[]
  context: ConfigSnapshotContext
  config: ConfigFragment
  featureFlags: FeatureFlagEvaluation[]
  secrets: SecretRecord[]
  checksum: string
}

/**
 * 配置快照上下文
 */
export interface ConfigSnapshotContext {
  tenantId: string
  brandId: string
  storeId: string
  marketCode?: string
}

/**
 * Feature Flag 评估结果
 */
export interface FeatureFlagEvaluation {
  key: string
  name: string
  description: string
  enabled: boolean
  reason: string
  matchedScope: Record<string, string | undefined> | null
  rolloutPercentage: number
  subjectKey: string
  source: 'in-memory' | 'persisted'
}

/**
 * 秘密凭证态势
 */
export interface SecretsCertificatePosture {
  generatedAt: string
  secrets: {
    total: number
    rotationDue: number
    expired: number
    sharedConsumers: number
  }
  certificates: {
    total: number
    expiringSoon: number
    expired: number
    autoRenewDisabled: number
  }
  attention: AttentionItem[]
}

/**
 * 态势关注项
 */
export interface AttentionItem {
  type: 'secret' | 'certificate'
  key: string
  status: string
  expiresAt: string | undefined
  linkedSecret?: string
}

/**
 * 配置治理操作结果
 */
export interface ConfigurationGovernanceResult {
  status: string
  entry?: ConfigEntryResult
  record?: FeatureFlagEvaluation
  secret?: SecretRecord
  version?: number
  key?: string
  secretName?: string
  approvalRequest?: unknown
  governance?: GovernanceMetadata
  summary?: string
}

/**
 * 治理元数据
 */
export interface GovernanceMetadata {
  operation: string
  rbac: {
    resource: string
    action: string
    requiredRoles: string[]
    requiredPermissions: string[]
  }
  approval: {
    required: boolean
    approvalId: string | null
    version: number | null
    requestedBy: string | null
    ticket: string | null
    status: string
    submitted: boolean
    persisted: boolean
    decidedBy: string | null
    decidedAt: string | null
    updatedAt: string | null
    execution: {
      attempts: number
      executed: boolean
      executionStatus: string | null
      executedAt: string | null
      executedBy: string | null
      lastFailure: string | null
    }
  }
}

/**
 * 治理基线定义
 */
export interface GovernanceBaseline {
  key: string
  name: string
  ownerModule: string
  summary: string
  controls: string[]
  evidence: string[]
}

/**
 * 模块能力描述符
 */
export interface ModuleCapability {
  key: string
  name: string
  responsibilities: string[]
  entrypoints: string[]
  consumers: string[]
  status: 'active' | 'planned' | 'deprecated'
}

/**
 * 基础模块描述符
 */
export interface FoundationModuleDescriptor {
  key: string
  name: string
  purpose: string
  inboundContracts: string[]
  outboundContracts: string[]
  capabilities: ModuleCapability[]
}
