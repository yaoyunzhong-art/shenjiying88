import { createHash } from 'node:crypto'
import {
  ConfigValueType,
  FeatureFlagStatus,
  FoundationScopeType,
  Prisma,
  RolloutStrategy,
  SecretKind,
  SecretProvider
} from '@prisma/client'
import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import type { RequestTenantContext } from '../../tenant/tenant.types'
import {
  getGovernanceApprovalDetail,
  isGovernanceApprovalExecuted,
  listGovernanceApprovals,
  markGovernanceApprovalExecutionFailed,
  markGovernanceApprovalExecuted,
  summarizeGovernanceApprovals,
  type GovernanceApprovalSnapshot,
  materializeGovernanceApproval
} from '../governance-approval/governance-approval'
import { TrustGovernanceService } from '../trust-governance/trust-governance.service'
import type { FoundationGovernanceBaseline, FoundationModuleDescriptor } from '../foundation.types'

interface LoginPolicyConfig {
  mfaRequired?: boolean
  sessionTtlMinutes?: number
  allowedLoginMethods?: string[]
}

interface NotificationConfig {
  emailProvider?: string
  smsProvider?: string
  digestWindow?: string
}

interface CheckoutConfig {
  allowGuestCheckout?: boolean
  paymentChannels?: string[]
}

interface ConfigFragment {
  locale?: string
  currency?: string
  timezone?: string
  loginPolicy?: LoginPolicyConfig
  notifications?: NotificationConfig
  checkout?: CheckoutConfig
}

interface FeatureFlagDefinition {
  key: string
  name: string
  description: string
  defaultEnabled: boolean
  rules: FeatureFlagRule[]
}

interface FeatureFlagRule {
  scope: Partial<RequestTenantContext>
  enabled: boolean
  rolloutPercentage?: number
  note: string
}

interface SecretVersionRecord {
  version: number
  fingerprint: string
  createdAt: string
  expiresAt: string
  rotatedBy: string
}

interface SecretRecord {
  name: string
  type: 'webhook-signing' | 'api-key' | 'certificate'
  scopes: string[]
  consumers: string[]
  algorithm: string
  currentVersion: number
  status: 'active' | 'rotation-due'
  lastRotatedAt: string
  expiresAt: string
  value: string
  versions: SecretVersionRecord[]
}

interface CertificateRecord {
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
}

interface ConfigEntryMutationInput {
  namespace: string
  key: string
  valueType: keyof typeof ConfigValueType
  scopeType: keyof typeof FoundationScopeType
  tenantId?: string
  brandId?: string
  storeId?: string
  marketProfileId?: string
  portalSiteId?: string
  value: unknown
  schemaRef?: string
  tags?: string[]
  status?: string
  changedBy?: string
  changeReason?: string
  requestedBy?: string
  approvalTicket?: string
  approvalStatus?: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED'
}

interface FeatureFlagMutationInput {
  key: string
  name: string
  scopeType: keyof typeof FoundationScopeType
  tenantId?: string
  brandId?: string
  storeId?: string
  marketProfileId?: string
  status: keyof typeof FeatureFlagStatus
  strategy: keyof typeof RolloutStrategy
  enabled: boolean
  percentage?: number
  allowList?: string[]
  conditions?: Record<string, unknown>
  description?: string
  note?: string
  startsAt?: string
  endsAt?: string
  requestedBy?: string
  approvalTicket?: string
  approvalStatus?: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED'
}

interface SecretRegistrationInput {
  key: string
  type: 'api-key' | 'webhook-signing' | 'certificate'
  scopeType: keyof typeof FoundationScopeType
  tenantId?: string
  brandId?: string
  storeId?: string
  integrationAppId?: string
  provider?: keyof typeof SecretProvider
  reference?: string
  value?: string
  algorithm?: string
  scopes?: string[]
  consumers?: string[]
  expiresAt?: string
  rotatedBy?: string
  requestedBy?: string
  approvalTicket?: string
  approvalStatus?: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED'
}

@Injectable()
export class ConfigurationGovernanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trustGovernanceService: TrustGovernanceService
  ) {}

  private readonly configLayers: {
    defaults: ConfigFragment
    markets: Record<string, ConfigFragment>
    tenants: Record<string, ConfigFragment>
    brands: Record<string, ConfigFragment>
    stores: Record<string, ConfigFragment>
  } = {
    defaults: {
      locale: 'zh-CN',
      currency: 'CNY',
      timezone: 'Asia/Shanghai',
      loginPolicy: {
        mfaRequired: false,
        sessionTtlMinutes: 720,
        allowedLoginMethods: ['password', 'sms-otp']
      },
      notifications: {
        emailProvider: 'aliyun-mail',
        smsProvider: 'aliyun-sms',
        digestWindow: '09:00-10:00'
      },
      checkout: {
        allowGuestCheckout: false,
        paymentChannels: ['wechat-pay', 'alipay']
      }
    },
    markets: {
      CN: {
        locale: 'zh-CN',
        currency: 'CNY',
        timezone: 'Asia/Shanghai',
        checkout: {
          allowGuestCheckout: false,
          paymentChannels: ['wechat-pay', 'alipay', 'union-pay']
        }
      },
      SG: {
        locale: 'en-SG',
        currency: 'SGD',
        timezone: 'Asia/Singapore',
        notifications: {
          emailProvider: 'ses',
          smsProvider: 'twilio',
          digestWindow: '10:00-11:00'
        },
        checkout: {
          allowGuestCheckout: true,
          paymentChannels: ['stripe', 'grab-pay']
        }
      }
    },
    tenants: {
      'tenant-demo': {
        loginPolicy: {
          mfaRequired: true,
          sessionTtlMinutes: 480,
          allowedLoginMethods: ['password', 'sms-otp', 'sso']
        },
        notifications: {
          emailProvider: 'aliyun-mail',
          smsProvider: 'aliyun-sms',
          digestWindow: '08:00-09:00'
        }
      },
      'tenant-premium': {
        notifications: {
          emailProvider: 'ses',
          smsProvider: 'twilio',
          digestWindow: '07:00-08:00'
        }
      }
    },
    brands: {
      'brand-premium': {
        checkout: {
          allowGuestCheckout: true,
          paymentChannels: ['wechat-pay', 'alipay', 'stripe']
        }
      }
    },
    stores: {
      'store-sh-001': {
        timezone: 'Asia/Shanghai',
        notifications: {
          emailProvider: 'aliyun-mail',
          smsProvider: 'aliyun-sms',
          digestWindow: '18:00-19:00'
        }
      },
      'store-sg-flagship': {
        timezone: 'Asia/Singapore'
      }
    }
  }

  private readonly featureFlags: FeatureFlagDefinition[] = [
    {
      key: 'new-checkout',
      name: '新版结账流程',
      description: '按租户、品牌和门店灰度的新结账编排。',
      defaultEnabled: false,
      rules: [
        {
          scope: { tenantId: 'tenant-premium' },
          enabled: true,
          rolloutPercentage: 100,
          note: 'premium 租户全量开启。'
        },
        {
          scope: { brandId: 'brand-premium' },
          enabled: true,
          rolloutPercentage: 50,
          note: 'premium 品牌半量灰度。'
        },
        {
          scope: { storeId: 'store-sh-001' },
          enabled: true,
          rolloutPercentage: 100,
          note: '上海旗舰店用于回归验证。'
        }
      ]
    },
    {
      key: 'ai-order-review',
      name: 'AI 订单审核',
      description: '为高风险订单增加 AI 辅助审核。',
      defaultEnabled: true,
      rules: [
        {
          scope: { marketCode: 'SG' },
          enabled: false,
          rolloutPercentage: 100,
          note: 'SG 市场合规评估前默认关闭。'
        }
      ]
    },
    {
      key: 'member-import-v2',
      name: '会员导入 V2',
      description: '新的成员导入处理链。',
      defaultEnabled: false,
      rules: [
        {
          scope: { tenantId: 'tenant-demo' },
          enabled: true,
          rolloutPercentage: 20,
          note: 'tenant-demo 做小流量验证。'
        }
      ]
    }
  ]

  private readonly secretStore: SecretRecord[] = [
    {
      name: 'lyt-webhook-signing-secret',
      type: 'webhook-signing',
      scopes: ['integration-orchestration', 'lyt-adapter'],
      consumers: ['lyt-adapter'],
      algorithm: 'hmac-sha256',
      currentVersion: 2,
      status: 'active',
      lastRotatedAt: '2026-05-18T08:30:00.000Z',
      expiresAt: '2026-11-18T08:30:00.000Z',
      value: 'lyt-webhook-secret-v2',
      versions: [
        {
          version: 1,
          fingerprint: 'sha256:6bdcad5b9798',
          createdAt: '2026-02-01T00:00:00.000Z',
          expiresAt: '2026-05-18T08:30:00.000Z',
          rotatedBy: 'foundation-bootstrap'
        },
        {
          version: 2,
          fingerprint: 'sha256:2dbd3fb0df6f',
          createdAt: '2026-05-18T08:30:00.000Z',
          expiresAt: '2026-11-18T08:30:00.000Z',
          rotatedBy: 'ops-rotation-bot'
        }
      ]
    },
    {
      name: 'payment-provider-api-key',
      type: 'api-key',
      scopes: ['configuration-governance', 'market'],
      consumers: ['market'],
      algorithm: 'sha256-fingerprint',
      currentVersion: 3,
      status: 'rotation-due',
      lastRotatedAt: '2026-01-10T04:00:00.000Z',
      expiresAt: '2026-07-10T04:00:00.000Z',
      value: 'pay-api-key-2026-v3',
      versions: [
        {
          version: 2,
          fingerprint: 'sha256:a6d8ed2e7d89',
          createdAt: '2025-11-01T00:00:00.000Z',
          expiresAt: '2026-01-10T04:00:00.000Z',
          rotatedBy: 'ops-rotation-bot'
        },
        {
          version: 3,
          fingerprint: 'sha256:5c9be8204160',
          createdAt: '2026-01-10T04:00:00.000Z',
          expiresAt: '2026-07-10T04:00:00.000Z',
          rotatedBy: 'ops-rotation-bot'
        }
      ]
    }
  ]

  private readonly certificateStore: CertificateRecord[] = [
    {
      name: 'lyt-callback-cert',
      secretName: 'lyt-webhook-signing-secret',
      format: 'PEM',
      scopes: ['integration-orchestration', 'lyt-adapter'],
      consumers: ['lyt-adapter'],
      domains: ['callback.lyt.m5.local'],
      issuer: 'M5 Internal CA',
      autoRenew: true,
      issuedAt: '2026-04-01T00:00:00.000Z',
      expiresAt: '2026-08-05T00:00:00.000Z',
      lastValidatedAt: '2026-07-04T09:00:00.000Z',
      rotatedBy: 'ops-cert-bot'
    },
    {
      name: 'payment-gateway-client-cert',
      secretName: 'payment-provider-api-key',
      format: 'PFX',
      scopes: ['configuration-governance', 'market'],
      consumers: ['market'],
      domains: ['payments-gateway.m5.local'],
      issuer: 'Partner Payment CA',
      autoRenew: false,
      issuedAt: '2025-12-15T00:00:00.000Z',
      expiresAt: '2026-07-21T00:00:00.000Z',
      lastValidatedAt: '2026-07-05T08:00:00.000Z',
      rotatedBy: 'sec-admin'
    }
  ]

  getManagementMetadata() {
    return [
      this.buildGovernanceMetadata('config-entry.write', {
        resource: 'config-entry',
        action: 'write',
        requiredRoles: ['SUPER_ADMIN', 'TENANT_ADMIN'],
        requiredPermissions: ['foundation.config.write'],
        approvalRequired: false
      }),
      this.buildGovernanceMetadata('feature-flag.write', {
        resource: 'feature-flag',
        action: 'write',
        requiredRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS'],
        requiredPermissions: ['foundation.feature-flag.write'],
        approvalRequired: false
      }),
      this.buildGovernanceMetadata('secret.register', {
        resource: 'secret',
        action: 'register',
        requiredRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN'],
        requiredPermissions: ['foundation.secret.write'],
        approvalRequired: true
      }),
      this.buildGovernanceMetadata('secret.rotate', {
        resource: 'secret',
        action: 'rotate',
        requiredRoles: ['SUPER_ADMIN', 'SECURITY_ADMIN'],
        requiredPermissions: ['foundation.secret.rotate'],
        approvalRequired: true
      })
    ]
  }

  async listGovernanceApprovals(filters: {
    limit?: number
    approvalTicket?: string
    operation?: string
    resourceType?: string
    resourceKey?: string
    requestedBy?: string
    decidedBy?: string
    status?: 'PENDING' | 'APPROVED' | 'REJECTED'
    tenantId?: string
    from?: string
    to?: string
    executed?: boolean
    executionStatus?: string
    hasFailures?: boolean
    failureStatus?: string
    groupBy?: Array<'operation' | 'resourceType' | 'status' | 'executionStatus' | 'failureStatus' | 'requestedBy'>
  } = {}) {
    return listGovernanceApprovals(this.prisma, {
      ...filters,
      limit: filters.limit ? Math.max(filters.limit * 4, filters.limit) : 100,
      operationIn: ['config-entry.write', 'feature-flag.write', 'secret.register', 'secret.rotate'],
      resourceTypeIn: ['config-entry', 'feature-flag', 'secret']
    }).then((approvals) => approvals.slice(0, filters.limit ?? approvals.length))
  }

  async getGovernanceApprovalDetail(approvalTicket: string) {
    const approval = await getGovernanceApprovalDetail(this.prisma, approvalTicket)
    if (!this.isConfigurationApproval(approval.operation, approval.resourceType)) {
      throw new NotFoundException(`Configuration governance approval not found: ${approvalTicket}`)
    }
    return approval
  }

  async getGovernanceApprovalTimeline(approvalTicket: string, limit?: number): Promise<unknown> {
    const approval = await this.getGovernanceApprovalDetail(approvalTicket)
    const audits = await this.trustGovernanceService.getAuditRecords({
      approvalTicket,
      limit: limit ?? 20
    })

    return {
      approval,
      audits
    }
  }

  async getAuditRecords(filters: {
    limit?: number
    tenantId?: string
    action?: string
    requestId?: string
    actorId?: string
    approvalTicket?: string
    riskLevel?: 'low' | 'medium' | 'high'
    from?: string
    to?: string
  } = {}): Promise<unknown> {
    return this.trustGovernanceService.getAuditRecords({
      ...filters,
      source: 'configuration-governance'
    })
  }

  async summarizeAuditRecords(filters: {
    limit?: number
    tenantId?: string
    action?: string
    requestId?: string
    actorId?: string
    approvalTicket?: string
    riskLevel?: 'low' | 'medium' | 'high'
    from?: string
    to?: string
  } = {}): Promise<unknown> {
    return this.trustGovernanceService.summarizeAuditRecords({
      ...filters,
      source: 'configuration-governance'
    })
  }

  async getOperationsOverview(): Promise<unknown> {
    const [approvals, audits, entries, flags, secrets, certificates, posture] = await Promise.all([
      this.summarizeGovernanceApprovals({
        groupBy: ['operation', 'status', 'executionStatus', 'failureStatus']
      }),
      this.summarizeAuditRecords(),
      this.prisma.configEntry.findMany(),
      this.prisma.featureFlag.findMany(),
      this.getSecretMetadata(),
      this.getCertificateMetadata(),
      this.getSecretsCertificatePosture()
    ])

    const now = Date.now()
    return {
      generatedAt: new Date().toISOString(),
      approvals,
      audits,
      configuration: {
        entries: {
          total: entries.length,
          active: entries.filter((entry) => entry.status === 'ACTIVE').length,
          namespaces: buildCountMap(entries.map((entry) => entry.namespace))
        },
        featureFlags: {
          total: flags.length,
          enabled: flags.filter((flag) => flag.enabled).length,
          active: flags.filter((flag) => flag.status === FeatureFlagStatus.ACTIVE).length,
          byStrategy: buildCountMap(flags.map((flag) => String(flag.strategy)))
        },
        secrets: {
          total: secrets.length,
          persisted: secrets.filter((secret) => !('source' in secret) || secret.source !== 'in-memory').length,
          static: secrets.filter((secret) => 'source' in secret && secret.source === 'in-memory').length,
          rotationDue: secrets.filter((secret) => secret.status === 'rotation-due').length,
          expired: secrets.filter((secret) => (secret.expiresAt ? Date.parse(secret.expiresAt) < now : false)).length
        },
        certificates: {
          total: certificates.length,
          autoRenew: certificates.filter((certificate) => certificate.autoRenew).length,
          expiringSoon: certificates.filter((certificate) => certificate.status === 'expiring-soon').length,
          expired: certificates.filter((certificate) => certificate.status === 'expired').length
        }
      },
      posture
    }
  }

  async summarizeGovernanceApprovals(filters: {
    approvalTicket?: string
    operation?: string
    resourceType?: string
    resourceKey?: string
    requestedBy?: string
    decidedBy?: string
    status?: 'PENDING' | 'APPROVED' | 'REJECTED'
    tenantId?: string
    from?: string
    to?: string
    executed?: boolean
    executionStatus?: string
    hasFailures?: boolean
    failureStatus?: string
    groupBy?: Array<'operation' | 'resourceType' | 'status' | 'executionStatus' | 'failureStatus' | 'requestedBy'>
  } = {}) {
    return summarizeGovernanceApprovals(this.prisma, {
      ...filters,
      operationIn: ['config-entry.write', 'feature-flag.write', 'secret.register', 'secret.rotate'],
      resourceTypeIn: ['config-entry', 'feature-flag', 'secret']
    })
  }

  async resolveConfigSnapshot(context: RequestTenantContext) {
    const normalizedContext = this.normalizeContext(context)
    const resolvedConfig = this.deepMerge(
      this.mergeConfig(normalizedContext),
      await this.getPersistentConfigFragment(normalizedContext)
    )
    const featureFlags = await this.getFeatureFlags(normalizedContext)
    const secrets = await this.getSecretMetadata()

    return {
      snapshotId: this.buildId('snapshot', normalizedContext),
      generatedAt: new Date().toISOString(),
      scopeChain: this.buildScopeChain(normalizedContext),
      context: normalizedContext,
      config: resolvedConfig,
      featureFlags,
      secrets,
      checksum: this.buildChecksum({ normalizedContext, resolvedConfig, featureFlags })
    }
  }

  async getFeatureFlags(context: RequestTenantContext, subjectKey?: string) {
    const normalizedContext = this.normalizeContext(context)
    const persistedKeys = await this.prisma.featureFlag.findMany({
      select: { key: true },
      distinct: ['key']
    })
    const flagKeys = [...new Set([...this.featureFlags.map((flag) => flag.key), ...persistedKeys.map((flag) => flag.key)])]

    return Promise.all(flagKeys.map((flagKey) => this.evaluateFeatureFlag(flagKey, normalizedContext, subjectKey)))
  }

  async listPersistedFeatureFlags(context: RequestTenantContext, subjectKey?: string) {
    const normalizedContext = this.normalizeContext(context)
    const records = await this.prisma.featureFlag.findMany({
      where: {
        OR: [
          { scopeType: FoundationScopeType.PLATFORM },
          { scopeType: FoundationScopeType.TENANT, tenantId: normalizedContext.tenantId },
          { scopeType: FoundationScopeType.BRAND, brandId: normalizedContext.brandId },
          { scopeType: FoundationScopeType.STORE, storeId: normalizedContext.storeId }
        ]
      },
      orderBy: [{ key: 'asc' }, { updatedAt: 'desc' }]
    })

    const latestRecords = new Map<string, (typeof records)[number]>()
    for (const record of records) {
      const dedupeKey = [
        record.key,
        record.scopeType,
        record.tenantId ?? '',
        record.brandId ?? '',
        record.storeId ?? '',
        record.marketProfileId ?? ''
      ].join(':')
      if (!latestRecords.has(dedupeKey)) {
        latestRecords.set(dedupeKey, record)
      }
    }

    return Promise.all(
      [...latestRecords.values()].map((record) =>
        this.evaluateFeatureFlag(record.key, normalizedContext, subjectKey ?? this.getSubjectKey(normalizedContext))
      )
    )
  }

  async evaluateFeatureFlag(flagKey: string, context: RequestTenantContext, subjectKey?: string) {
    const normalizedContext = this.normalizeContext(context)
    const persistedFlags = await this.prisma.featureFlag.findMany({
      where: { key: flagKey },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }]
    })
    if (persistedFlags.length > 0) {
      return this.evaluatePersistedFeatureFlag(flagKey, persistedFlags, normalizedContext, subjectKey)
    }

    const flag = this.featureFlags.find((item) => item.key === flagKey)
    if (!flag) {
      throw new NotFoundException(`Feature flag not found: ${flagKey}`)
    }

    const matches = flag.rules
      .filter((rule) => this.matchesScope(rule.scope, normalizedContext))
      .sort((left, right) => this.getScopeSpecificity(right.scope) - this.getScopeSpecificity(left.scope))
    const winningRule = matches[0]
    const rolloutPercentage = winningRule?.rolloutPercentage ?? (flag.defaultEnabled ? 100 : 0)
    const effectiveSubjectKey = subjectKey ?? this.getSubjectKey(normalizedContext)
    const enabledByRollout = rolloutPercentage >= 100 || this.computeRolloutBucket(flag.key, effectiveSubjectKey) < rolloutPercentage

    return {
      key: flag.key,
      name: flag.name,
      description: flag.description,
      enabled: winningRule ? winningRule.enabled && enabledByRollout : flag.defaultEnabled,
      reason: winningRule?.note ?? 'default-policy',
      matchedScope: winningRule?.scope ?? null,
      rolloutPercentage,
      subjectKey: effectiveSubjectKey,
      source: 'in-memory'
    }
  }

  async getSecretMetadata(secretName?: string) {
    const persistedRecords = await this.prisma.secretAsset.findMany({
      where: secretName ? { key: secretName } : undefined,
      orderBy: [{ key: 'asc' }, { version: 'desc' }]
    })
    const persistedKeys = new Set(persistedRecords.map((record) => record.key))
    const persisted = this.groupByKey(persistedRecords).map(([key, records]) =>
      this.toPersistedSecretMetadata(key, records)
    )

    const fallback = this.secretStore
      .filter((secret) => (!secretName || secret.name === secretName) && !persistedKeys.has(secret.name))
      .map((secret) => this.toStaticSecretMetadata(secret))
    const merged = [...persisted, ...fallback]
    if (secretName && merged.length === 0) {
      throw new NotFoundException(`Secret not found: ${secretName}`)
    }

    return merged
  }

  async getCertificateMetadata(filters: {
    name?: string
    status?: 'active' | 'expiring-soon' | 'expired'
    expiringWithinDays?: number
  } = {}) {
    const windowDays = filters.expiringWithinDays ?? 30
    const certificates = this.certificateStore
      .filter((certificate) => !filters.name || certificate.name === filters.name)
      .map((certificate) => this.toCertificateMetadata(certificate, windowDays))
      .filter((certificate) => !filters.status || certificate.status === filters.status)
      .sort((left, right) => Date.parse(left.expiresAt) - Date.parse(right.expiresAt))

    return certificates
  }

  async getCertificateDetail(
    certificateName: string,
    filters: {
      expiringWithinDays?: number
    } = {}
  ) {
    const certificate = (await this.getCertificateMetadata({
      name: certificateName,
      expiringWithinDays: filters.expiringWithinDays
    }))[0]
    if (!certificate) {
      throw new NotFoundException(`Certificate not found: ${certificateName}`)
    }

    return certificate
  }

  async getSecretsCertificatePosture() {
    const [secrets, certificates] = await Promise.all([this.getSecretMetadata(), this.getCertificateMetadata()])

    return {
      generatedAt: new Date().toISOString(),
      secrets: {
        total: secrets.length,
        rotationDue: secrets.filter((secret) => secret.status === 'rotation-due').length,
        expired: secrets.filter((secret) => (secret.expiresAt ? Date.parse(secret.expiresAt) < Date.now() : false)).length,
        sharedConsumers: secrets.filter((secret) => secret.consumers.length > 1).length
      },
      certificates: {
        total: certificates.length,
        expiringSoon: certificates.filter((certificate) => certificate.status === 'expiring-soon').length,
        expired: certificates.filter((certificate) => certificate.status === 'expired').length,
        autoRenewDisabled: certificates.filter((certificate) => !certificate.autoRenew).length
      },
      attention: {
        secrets: secrets
          .filter((secret) => secret.status === 'rotation-due')
          .map((secret) => ({
            type: 'secret',
            key: secret.name,
            status: secret.status,
            expiresAt: secret.expiresAt
          })),
        certificates: certificates
          .filter((certificate) => certificate.status !== 'active')
          .map((certificate) => ({
            type: 'certificate',
            key: certificate.name,
            status: certificate.status,
            expiresAt: certificate.expiresAt,
            linkedSecret: certificate.secretName
          }))
      }
    }
  }

  async listConfigEntries(filters: {
    namespace?: string
    key?: string
    tenantId?: string
    brandId?: string
    storeId?: string
    marketCode?: string
  }) {
    const entries = await this.prisma.configEntry.findMany({
      where: {
        namespace: filters.namespace,
        key: filters.key,
        OR: [
          { scopeType: FoundationScopeType.PLATFORM },
          filters.tenantId ? { scopeType: FoundationScopeType.TENANT, tenantId: filters.tenantId } : undefined,
          filters.brandId ? { scopeType: FoundationScopeType.BRAND, brandId: filters.brandId } : undefined,
          filters.storeId ? { scopeType: FoundationScopeType.STORE, storeId: filters.storeId } : undefined
        ].filter(Boolean) as Prisma.ConfigEntryWhereInput[]
      },
      include: {
        revisions: {
          orderBy: [{ version: 'desc' }],
          take: 1
        }
      },
      orderBy: [{ updatedAt: 'desc' }]
    })

    return entries.map((entry) => ({
      id: entry.id,
      namespace: entry.namespace,
      key: entry.key,
      valueType: entry.valueType,
      scopeType: entry.scopeType,
      tenantId: entry.tenantId,
      brandId: entry.brandId,
      storeId: entry.storeId,
      marketProfileId: entry.marketProfileId,
      portalSiteId: entry.portalSiteId,
      version: entry.version,
      value: entry.value,
      schemaRef: entry.schemaRef,
      tags: entry.tags,
      status: entry.status,
      createdBy: entry.createdBy,
      latestRevision: entry.revisions[0]
        ? {
            version: entry.revisions[0].version,
            changedBy: entry.revisions[0].changedBy,
            changeReason: entry.revisions[0].changeReason,
            createdAt: entry.revisions[0].createdAt.toISOString()
          }
        : null,
      updatedAt: entry.updatedAt.toISOString()
    }))
  }

  async saveConfigEntry(input: ConfigEntryMutationInput) {
    const scopeType = FoundationScopeType[input.scopeType]
    const valueType = ConfigValueType[input.valueType]
    const tags = input.tags ?? []
    const existing = await this.prisma.configEntry.findFirst({
      where: {
        namespace: input.namespace,
        key: input.key,
        scopeType,
        tenantId: input.tenantId ?? null,
        brandId: input.brandId ?? null,
        storeId: input.storeId ?? null,
        marketProfileId: input.marketProfileId ?? null,
        portalSiteId: input.portalSiteId ?? null
      },
      orderBy: [{ updatedAt: 'desc' }]
    })

    if (!existing) {
      const created = await this.prisma.configEntry.create({
        data: {
          namespace: input.namespace,
          key: input.key,
          valueType,
          scopeType,
          tenantId: input.tenantId ?? null,
          brandId: input.brandId ?? null,
          storeId: input.storeId ?? null,
          marketProfileId: input.marketProfileId ?? null,
          portalSiteId: input.portalSiteId ?? null,
          version: 1,
          value: this.toInputJsonValue(input.value),
          schemaRef: input.schemaRef,
          tags,
          status: input.status ?? 'ACTIVE',
          createdBy: input.changedBy ?? 'foundation-console',
          revisions: {
            create: {
              version: 1,
              changedBy: input.changedBy ?? 'foundation-console',
              changeReason: input.changeReason,
              snapshot: this.toInputJsonValue(input.value)
            }
          }
        }
      })

      const result = {
        status: 'created',
        entry: await this.getConfigEntryById(created.id)
      }

      await this.recordGovernanceAudit('foundation.config-entry.created', {
        tenantId: input.tenantId,
        actorId: input.changedBy ?? 'foundation-console',
        source: 'configuration-governance',
        details: {
          namespace: input.namespace,
          key: input.key,
          scopeType: input.scopeType,
          version: result.entry.version,
          tags,
          reason: input.changeReason ?? null
        }
      })

      const approval = await materializeGovernanceApproval(this.prisma, {
        operation: 'config-entry.write',
        resourceType: 'config-entry',
        resourceKey: this.buildResourceKey(input.namespace, input.key, input.scopeType, input.tenantId, input.brandId, input.storeId),
        scopeType: input.scopeType,
        tenantId: input.tenantId,
        brandId: input.brandId,
        storeId: input.storeId,
        approvalRequired: false,
        requestedBy: input.requestedBy ?? input.changedBy,
        approvalTicket: input.approvalTicket,
        approvalStatus: input.approvalStatus,
        summary: {
          mutation: result.status,
          namespace: input.namespace,
          key: input.key,
          version: result.entry.version
        }
      })

      return {
        ...result,
        governance: this.buildGovernanceMetadata('config-entry.write', {
          resource: 'config-entry',
          action: 'write',
          requiredRoles: ['SUPER_ADMIN', 'TENANT_ADMIN'],
          requiredPermissions: ['foundation.config.write'],
          approvalRequired: false,
          requestedBy: input.requestedBy ?? input.changedBy,
          ticket: input.approvalTicket,
          status: input.approvalStatus,
          approvalRecord: approval
        })
      }
    }

    const nextVersion = existing.version + 1
    await this.prisma.configEntry.update({
      where: { id: existing.id },
      data: {
        valueType,
        version: nextVersion,
        value: this.toInputJsonValue(input.value),
        schemaRef: input.schemaRef,
        tags,
        status: input.status ?? existing.status,
        createdBy: input.changedBy ?? existing.createdBy,
        revisions: {
          create: {
            version: nextVersion,
            changedBy: input.changedBy ?? 'foundation-console',
            changeReason: input.changeReason,
            snapshot: this.toInputJsonValue(input.value)
          }
        }
      }
    })

    const result = {
      status: 'updated',
      entry: await this.getConfigEntryById(existing.id)
    }

    await this.recordGovernanceAudit('foundation.config-entry.updated', {
      tenantId: input.tenantId,
      actorId: input.changedBy ?? 'foundation-console',
      source: 'configuration-governance',
      details: {
        namespace: input.namespace,
        key: input.key,
        scopeType: input.scopeType,
        version: result.entry.version,
        tags,
        reason: input.changeReason ?? null
      }
    })

    const approval = await materializeGovernanceApproval(this.prisma, {
      operation: 'config-entry.write',
      resourceType: 'config-entry',
      resourceKey: this.buildResourceKey(input.namespace, input.key, input.scopeType, input.tenantId, input.brandId, input.storeId),
      scopeType: input.scopeType,
      tenantId: input.tenantId,
      brandId: input.brandId,
      storeId: input.storeId,
      approvalRequired: false,
      requestedBy: input.requestedBy ?? input.changedBy,
      approvalTicket: input.approvalTicket,
      approvalStatus: input.approvalStatus,
      summary: {
        mutation: result.status,
        namespace: input.namespace,
        key: input.key,
        version: result.entry.version
      }
    })

    return {
      ...result,
      governance: this.buildGovernanceMetadata('config-entry.write', {
        resource: 'config-entry',
        action: 'write',
        requiredRoles: ['SUPER_ADMIN', 'TENANT_ADMIN'],
        requiredPermissions: ['foundation.config.write'],
        approvalRequired: false,
        requestedBy: input.requestedBy ?? input.changedBy,
        ticket: input.approvalTicket,
        status: input.approvalStatus,
        approvalRecord: approval
      })
    }
  }

  async saveFeatureFlag(input: FeatureFlagMutationInput) {
    const scopeType = FoundationScopeType[input.scopeType]
    const status = FeatureFlagStatus[input.status]
    const strategy = RolloutStrategy[input.strategy]
    const existing = await this.prisma.featureFlag.findFirst({
      where: {
        key: input.key,
        scopeType,
        tenantId: input.tenantId ?? null,
        brandId: input.brandId ?? null,
        storeId: input.storeId ?? null,
        marketProfileId: input.marketProfileId ?? null
      },
      orderBy: [{ updatedAt: 'desc' }]
    })

    const metadata = this.toInputJsonValue({
      description: input.description,
      note: input.note
    })

    if (!existing) {
      const created = await this.prisma.featureFlag.create({
        data: {
          key: input.key,
          name: input.name,
          scopeType,
          tenantId: input.tenantId ?? null,
          brandId: input.brandId ?? null,
          storeId: input.storeId ?? null,
          marketProfileId: input.marketProfileId ?? null,
          status,
          strategy,
          enabled: input.enabled,
          percentage: input.percentage ?? null,
          allowList: input.allowList ?? [],
          conditions: input.conditions ? this.toInputJsonValue(input.conditions) : undefined,
          startsAt: input.startsAt ? new Date(input.startsAt) : null,
          endsAt: input.endsAt ? new Date(input.endsAt) : null,
          metadata
        }
      })

      const result = {
        status: 'created',
        record: this.toFeatureFlagRecord(created)
      }

      await this.recordGovernanceAudit('foundation.feature-flag.created', {
        tenantId: input.tenantId,
        actorId: 'foundation-console',
        source: 'configuration-governance',
        details: {
          key: input.key,
          name: input.name,
          scopeType: input.scopeType,
          status: input.status,
          strategy: input.strategy,
          enabled: input.enabled
        }
      })

      const approval = await materializeGovernanceApproval(this.prisma, {
        operation: 'feature-flag.write',
        resourceType: 'feature-flag',
        resourceKey: this.buildResourceKey(input.key, input.scopeType, input.tenantId, input.brandId, input.storeId),
        scopeType: input.scopeType,
        tenantId: input.tenantId,
        brandId: input.brandId,
        storeId: input.storeId,
        approvalRequired: false,
        requestedBy: input.requestedBy,
        approvalTicket: input.approvalTicket,
        approvalStatus: input.approvalStatus,
        summary: {
          mutation: result.status,
          key: input.key,
          strategy: input.strategy,
          enabled: input.enabled
        }
      })

      return {
        ...result,
        governance: this.buildGovernanceMetadata('feature-flag.write', {
          resource: 'feature-flag',
          action: 'write',
          requiredRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS'],
          requiredPermissions: ['foundation.feature-flag.write'],
          approvalRequired: false,
          requestedBy: input.requestedBy,
          ticket: input.approvalTicket,
          status: input.approvalStatus,
          approvalRecord: approval
        })
      }
    }

    const updated = await this.prisma.featureFlag.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        status,
        strategy,
        enabled: input.enabled,
        percentage: input.percentage ?? null,
        allowList: input.allowList ?? [],
        conditions: input.conditions ? this.toInputJsonValue(input.conditions) : undefined,
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
        endsAt: input.endsAt ? new Date(input.endsAt) : null,
        metadata
      }
    })

    const result = {
      status: 'updated',
      record: this.toFeatureFlagRecord(updated)
    }

    await this.recordGovernanceAudit('foundation.feature-flag.updated', {
      tenantId: input.tenantId,
      actorId: 'foundation-console',
      source: 'configuration-governance',
      details: {
        key: input.key,
        name: input.name,
        scopeType: input.scopeType,
        status: input.status,
        strategy: input.strategy,
        enabled: input.enabled
      }
    })

    const approval = await materializeGovernanceApproval(this.prisma, {
      operation: 'feature-flag.write',
      resourceType: 'feature-flag',
      resourceKey: this.buildResourceKey(input.key, input.scopeType, input.tenantId, input.brandId, input.storeId),
      scopeType: input.scopeType,
      tenantId: input.tenantId,
      brandId: input.brandId,
      storeId: input.storeId,
      approvalRequired: false,
      requestedBy: input.requestedBy,
      approvalTicket: input.approvalTicket,
      approvalStatus: input.approvalStatus,
      summary: {
        mutation: result.status,
        key: input.key,
        strategy: input.strategy,
        enabled: input.enabled
      }
    })

    return {
      ...result,
      governance: this.buildGovernanceMetadata('feature-flag.write', {
        resource: 'feature-flag',
        action: 'write',
        requiredRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS'],
        requiredPermissions: ['foundation.feature-flag.write'],
        approvalRequired: false,
        requestedBy: input.requestedBy,
        ticket: input.approvalTicket,
        status: input.approvalStatus,
        approvalRecord: approval
      })
    }
  }

  async rotateSecret(
    secretName: string,
    rotatedBy = 'configuration-governance-controller',
    governance?: { requestedBy?: string; approvalTicket?: string; approvalStatus?: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED' }
  ) {
    const persistedRecords = await this.prisma.secretAsset.findMany({
      where: { key: secretName },
      orderBy: [{ version: 'asc' }]
    })
    const persistedCurrent = persistedRecords.at(-1)
    const fallbackSecret = this.secretStore.find((item) => item.name === secretName)
    if (!persistedCurrent && !fallbackSecret) {
      throw new NotFoundException(`Secret not found: ${secretName}`)
    }

    const rotationRequestPayload = {
      secretName,
      scopeType: (persistedCurrent?.scopeType ?? FoundationScopeType.PLATFORM) as string,
      tenantId: persistedCurrent?.tenantId ?? null,
      brandId: persistedCurrent?.brandId ?? null,
      storeId: persistedCurrent?.storeId ?? null
    }
    const approval = await materializeGovernanceApproval(this.prisma, {
      operation: 'secret.rotate',
      resourceType: 'secret',
      resourceKey: secretName,
      scopeType: persistedCurrent?.scopeType ?? FoundationScopeType.PLATFORM,
      tenantId: persistedCurrent?.tenantId ?? undefined,
      brandId: persistedCurrent?.brandId ?? undefined,
      storeId: persistedCurrent?.storeId ?? undefined,
      approvalRequired: true,
      requestedBy: governance?.requestedBy ?? rotatedBy,
      approvalTicket: governance?.approvalTicket,
      approvalStatus: governance?.approvalStatus,
      requestPayload: rotationRequestPayload,
      summary: {
        ...rotationRequestPayload,
        requestedAction: 'rotate'
      }
    })
    if (approval.status === 'REJECTED') {
      await this.recordGovernanceAudit('foundation.approval.execution-blocked', {
        tenantId: persistedCurrent?.tenantId ?? undefined,
        actorId: governance?.requestedBy ?? rotatedBy,
        source: 'configuration-governance',
        details: {
          approvalTicket: approval.ticket,
          operation: approval.operation,
          resourceType: approval.resourceType,
          resourceKey: approval.resourceKey
        }
      })
      return {
        status: 'approval-rejected',
        secretName,
        approvalRequest: approval,
        governance: this.buildGovernanceMetadata('secret.rotate', {
          resource: 'secret',
          action: 'rotate',
          requiredRoles: ['SUPER_ADMIN', 'SECURITY_ADMIN'],
          requiredPermissions: ['foundation.secret.rotate'],
          approvalRequired: true,
          requestedBy: governance?.requestedBy ?? rotatedBy,
          ticket: approval.ticket ?? governance?.approvalTicket,
          status: approval.status,
          approvalRecord: approval
        })
      }
    }
    if (approval.status !== 'APPROVED') {
      return {
        status: 'pending-approval',
        secretName,
        approvalRequest: approval,
        governance: this.buildGovernanceMetadata('secret.rotate', {
          resource: 'secret',
          action: 'rotate',
          requiredRoles: ['SUPER_ADMIN', 'SECURITY_ADMIN'],
          requiredPermissions: ['foundation.secret.rotate'],
          approvalRequired: true,
          requestedBy: governance?.requestedBy ?? rotatedBy,
          ticket: approval.ticket ?? governance?.approvalTicket,
          status: approval.status,
          approvalRecord: approval
        })
      }
    }
    if (isGovernanceApprovalExecuted(approval.summary)) {
      await this.recordGovernanceAudit('foundation.approval.replay-blocked', {
        tenantId: persistedCurrent?.tenantId ?? undefined,
        actorId: governance?.requestedBy ?? rotatedBy,
        source: 'configuration-governance',
        details: {
          approvalTicket: approval.ticket,
          operation: approval.operation,
          resourceType: approval.resourceType,
          resourceKey: approval.resourceKey
        }
      })
      return {
        status: 'already-executed',
        secretName,
        approvalRequest: approval,
        governance: this.buildGovernanceMetadata('secret.rotate', {
          resource: 'secret',
          action: 'rotate',
          requiredRoles: ['SUPER_ADMIN', 'SECURITY_ADMIN'],
          requiredPermissions: ['foundation.secret.rotate'],
          approvalRequired: true,
          requestedBy: governance?.requestedBy ?? rotatedBy,
          ticket: approval.ticket ?? governance?.approvalTicket,
          status: approval.status,
          approvalRecord: approval
        })
      }
    }

    const nextVersion = (persistedCurrent?.version ?? fallbackSecret?.currentVersion ?? 0) + 1
    const now = new Date()
    const nextValue = `${secretName}-v${nextVersion}`
    const expiresAt = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000)
    const baseMetadata = this.getJsonRecord(persistedCurrent?.metadata) ?? this.toStaticSecretMetadata(fallbackSecret!)

    let finalizedApproval: GovernanceApprovalSnapshot
    let result: { status: string; secret: ReturnType<ConfigurationGovernanceService['getSecretMetadata']> extends Promise<(infer U)[]> ? U | undefined : never }
    try {
      await this.prisma.secretAsset.create({
        data: {
          key: secretName,
          kind: persistedCurrent?.kind ?? this.toPrismaSecretKind(fallbackSecret!.type),
          provider: persistedCurrent?.provider ?? SecretProvider.DATABASE,
          scopeType: persistedCurrent?.scopeType ?? FoundationScopeType.PLATFORM,
          tenantId: persistedCurrent?.tenantId ?? null,
          brandId: persistedCurrent?.brandId ?? null,
          storeId: persistedCurrent?.storeId ?? null,
          integrationAppId: persistedCurrent?.integrationAppId ?? null,
          version: nextVersion,
          reference: `secret://${secretName}/v${nextVersion}`,
          metadata: {
            ...baseMetadata,
            type: this.getString(baseMetadata.type) ?? fallbackSecret?.type ?? this.fromPrismaSecretKind(persistedCurrent?.kind),
            scopes:
              this.getStringArray(baseMetadata.scopes).length > 0 ? this.getStringArray(baseMetadata.scopes) : fallbackSecret?.scopes ?? [],
            consumers:
              this.getStringArray(baseMetadata.consumers).length > 0
                ? this.getStringArray(baseMetadata.consumers)
                : fallbackSecret?.consumers ?? [],
            algorithm:
              this.getString(baseMetadata.algorithm) ??
              fallbackSecret?.algorithm ??
              this.getDefaultSecretAlgorithm(persistedCurrent?.kind ?? this.toPrismaSecretKind(fallbackSecret!.type)),
            fingerprint: this.buildFingerprint(nextValue),
            rotatedBy
          },
          expiresAt,
          rotatedAt: now,
          status: 'ACTIVE'
        }
      })

      result = {
        status: 'rotated',
        secret: (await this.getSecretMetadata(secretName))[0]
      }

      await this.recordGovernanceAudit('foundation.secret.rotated', {
        tenantId: persistedCurrent?.tenantId ?? undefined,
        actorId: rotatedBy,
        source: 'configuration-governance',
        details: {
          key: secretName,
          version: result.secret?.currentVersion ?? nextVersion,
          type: result.secret?.type ?? fallbackSecret?.type ?? this.fromPrismaSecretKind(persistedCurrent?.kind),
          status: result.secret?.status ?? 'active'
        }
      })
      await this.recordGovernanceAudit('foundation.approval.executed', {
        tenantId: persistedCurrent?.tenantId ?? undefined,
        actorId: governance?.requestedBy ?? rotatedBy,
        source: 'configuration-governance',
        details: {
          approvalTicket: approval.ticket,
          operation: approval.operation,
          resourceType: approval.resourceType,
          resourceKey: approval.resourceKey,
          executionStatus: 'rotated'
        }
      })

      finalizedApproval = await markGovernanceApprovalExecuted(this.prisma, {
        approvalTicket: approval.ticket ?? governance?.approvalTicket ?? '',
        executedBy: governance?.requestedBy ?? rotatedBy,
        expectedVersion: approval.version ?? undefined,
        executionStatus: 'rotated',
        summary: {
          mutation: 'rotated',
          secretName,
          version: result.secret?.currentVersion ?? nextVersion
        }
      })
    } catch (error) {
      await this.handleApprovalExecutionFailure(approval, governance?.requestedBy ?? rotatedBy, 'secret-rotate-failed', error, {
        secretName,
        nextVersion
      })
      throw error
    }

    return {
      ...result,
      governance: this.buildGovernanceMetadata('secret.rotate', {
        resource: 'secret',
        action: 'rotate',
        requiredRoles: ['SUPER_ADMIN', 'SECURITY_ADMIN'],
        requiredPermissions: ['foundation.secret.rotate'],
        approvalRequired: true,
        requestedBy: governance?.requestedBy ?? rotatedBy,
        ticket: finalizedApproval.ticket ?? governance?.approvalTicket,
        status: finalizedApproval.status,
        approvalRecord: finalizedApproval
      })
    }
  }

  async registerSecret(input: SecretRegistrationInput) {
    const registrationRequestPayload = {
      key: input.key,
      type: input.type,
      scopeType: input.scopeType,
      tenantId: input.tenantId ?? null,
      brandId: input.brandId ?? null,
      storeId: input.storeId ?? null,
      provider: input.provider ?? null,
      valueFingerprint: this.buildFingerprint(input.value ?? input.reference ?? `secret://${input.key}`),
      reference: input.reference ?? null
    }
    const approval = await materializeGovernanceApproval(this.prisma, {
      operation: 'secret.register',
      resourceType: 'secret',
      resourceKey: input.key,
      scopeType: input.scopeType,
      tenantId: input.tenantId,
      brandId: input.brandId,
      storeId: input.storeId,
      approvalRequired: true,
      requestedBy: input.requestedBy ?? input.rotatedBy,
      approvalTicket: input.approvalTicket,
      approvalStatus: input.approvalStatus,
      requestPayload: registrationRequestPayload,
      summary: {
        ...registrationRequestPayload,
        requestedAction: 'register'
      }
    })
    if (approval.status === 'REJECTED') {
      await this.recordGovernanceAudit('foundation.approval.execution-blocked', {
        tenantId: input.tenantId,
        actorId: input.requestedBy ?? input.rotatedBy,
        source: 'configuration-governance',
        details: {
          approvalTicket: approval.ticket,
          operation: approval.operation,
          resourceType: approval.resourceType,
          resourceKey: approval.resourceKey
        }
      })
      return {
        status: 'approval-rejected',
        key: input.key,
        approvalRequest: approval,
        governance: this.buildGovernanceMetadata('secret.register', {
          resource: 'secret',
          action: 'register',
          requiredRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN'],
          requiredPermissions: ['foundation.secret.write'],
          approvalRequired: true,
          requestedBy: input.requestedBy ?? input.rotatedBy,
          ticket: approval.ticket ?? input.approvalTicket,
          status: approval.status,
          approvalRecord: approval
        })
      }
    }
    if (approval.status !== 'APPROVED') {
      return {
        status: 'pending-approval',
        key: input.key,
        approvalRequest: approval,
        governance: this.buildGovernanceMetadata('secret.register', {
          resource: 'secret',
          action: 'register',
          requiredRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN'],
          requiredPermissions: ['foundation.secret.write'],
          approvalRequired: true,
          requestedBy: input.requestedBy ?? input.rotatedBy,
          ticket: approval.ticket ?? input.approvalTicket,
          status: approval.status,
          approvalRecord: approval
        })
      }
    }
    if (isGovernanceApprovalExecuted(approval.summary)) {
      await this.recordGovernanceAudit('foundation.approval.replay-blocked', {
        tenantId: input.tenantId,
        actorId: input.requestedBy ?? input.rotatedBy,
        source: 'configuration-governance',
        details: {
          approvalTicket: approval.ticket,
          operation: approval.operation,
          resourceType: approval.resourceType,
          resourceKey: approval.resourceKey
        }
      })
      return {
        status: 'already-executed',
        key: input.key,
        approvalRequest: approval,
        governance: this.buildGovernanceMetadata('secret.register', {
          resource: 'secret',
          action: 'register',
          requiredRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN'],
          requiredPermissions: ['foundation.secret.write'],
          approvalRequired: true,
          requestedBy: input.requestedBy ?? input.rotatedBy,
          ticket: approval.ticket ?? input.approvalTicket,
          status: approval.status,
          approvalRecord: approval
        })
      }
    }

    const currentRecords = await this.prisma.secretAsset.findMany({
      where: { key: input.key },
      orderBy: [{ version: 'asc' }]
    })
    const current = currentRecords.at(-1)
    const nextVersion = (current?.version ?? 0) + 1
    const secretKind = this.toPrismaSecretKind(input.type)
    const provider = input.provider ? SecretProvider[input.provider] : current?.provider ?? SecretProvider.DATABASE
    const reference = input.reference ?? `secret://${input.key}/v${nextVersion}`
    const fingerprint = this.buildFingerprint(input.value ?? reference)

    let finalizedApproval: GovernanceApprovalSnapshot
    let result: { status: string; version: number; secret: ReturnType<ConfigurationGovernanceService['getSecretMetadata']> extends Promise<(infer U)[]> ? U | undefined : never }
    try {
      const created = await this.prisma.secretAsset.create({
        data: {
          key: input.key,
          kind: secretKind,
          provider,
          scopeType: FoundationScopeType[input.scopeType],
          tenantId: input.tenantId ?? null,
          brandId: input.brandId ?? null,
          storeId: input.storeId ?? null,
          integrationAppId: input.integrationAppId ?? null,
          version: nextVersion,
          reference,
          encryptedPayload: input.value ?? null,
          metadata: this.toInputJsonValue({
            type: input.type,
            scopes: input.scopes ?? [],
            consumers: input.consumers ?? [],
            algorithm: input.algorithm ?? this.getDefaultSecretAlgorithm(secretKind),
            fingerprint,
            rotatedBy: input.rotatedBy ?? 'foundation-console'
          }),
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
          rotatedAt: new Date(),
          status: 'ACTIVE'
        }
      })

      result = {
        status: current ? 'version-added' : 'created',
        version: created.version,
        secret: (await this.getSecretMetadata(input.key))[0]
      }

      await this.recordGovernanceAudit(current ? 'foundation.secret.version-added' : 'foundation.secret.created', {
        tenantId: input.tenantId,
        actorId: input.rotatedBy ?? 'foundation-console',
        source: 'configuration-governance',
        details: {
          key: input.key,
          version: created.version,
          type: input.type,
          scopeType: input.scopeType,
          provider: provider,
          consumers: input.consumers ?? [],
          scopes: input.scopes ?? []
        }
      })
      await this.recordGovernanceAudit('foundation.approval.executed', {
        tenantId: input.tenantId,
        actorId: input.requestedBy ?? input.rotatedBy,
        source: 'configuration-governance',
        details: {
          approvalTicket: approval.ticket,
          operation: approval.operation,
          resourceType: approval.resourceType,
          resourceKey: approval.resourceKey,
          executionStatus: result.status
        }
      })

      finalizedApproval = await markGovernanceApprovalExecuted(this.prisma, {
        approvalTicket: approval.ticket ?? input.approvalTicket ?? '',
        executedBy: input.requestedBy ?? input.rotatedBy ?? 'foundation-console',
        expectedVersion: approval.version ?? undefined,
        executionStatus: result.status,
        summary: {
          mutation: result.status,
          key: input.key,
          version: created.version,
          type: input.type
        }
      })
    } catch (error) {
      await this.handleApprovalExecutionFailure(approval, input.requestedBy ?? input.rotatedBy, 'secret-register-failed', error, {
        key: input.key,
        nextVersion,
        type: input.type
      })
      throw error
    }

    return {
      ...result,
      governance: this.buildGovernanceMetadata('secret.register', {
        resource: 'secret',
        action: 'register',
        requiredRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN'],
        requiredPermissions: ['foundation.secret.write'],
        approvalRequired: true,
        requestedBy: input.requestedBy ?? input.rotatedBy,
        ticket: finalizedApproval.ticket ?? input.approvalTicket,
        status: finalizedApproval.status,
        approvalRecord: finalizedApproval
      })
    }
  }

  getGovernanceBaselines(): FoundationGovernanceBaseline[] {
    return [
      {
        key: 'data-tiering',
        name: '热温冷数据分层',
        ownerModule: 'configuration-governance',
        summary: '按事务、分析、归档三层约束存储选型、保留周期和回收流程。',
        controls: [
          '热数据保留在 PostgreSQL/Redis，承载交易、会话和限流计数。',
          '温数据沉淀到 ClickHouse，支撑审计分析、运营报表和 AI 用量聚合。',
          '冷数据归档到对象存储，必须带租户标签、校验和与恢复索引。',
          '删除、归档、恢复都必须保留变更记录并接入审批。'
        ],
        evidence: ['docs/operations-governance-baseline.md', 'infra/docker/docker-compose.dev.yml']
      },
      {
        key: 'secrets-certificate-rotation',
        name: 'Secrets 与证书轮换',
        ownerModule: 'configuration-governance',
        summary: '通过版本化凭证、到期告警和灰度切换避免一次性替换带来的生产中断。',
        controls: [
          '敏感凭证只保存引用或密文，不落业务代码仓库。',
          '轮换必须支持双版本并行、回滚窗口和生效审计。',
          '证书到期前生成告警并安排演练，外部回调域名变更需要联动验证。',
          '多环境分离凭证，禁止开发环境复用生产 secrets。'
        ],
        evidence: ['docs/operations-governance-baseline.md', 'docs/operations-runbook-template.md']
      },
      {
        key: 'multi-cloud-iac-environment-isolation',
        name: '多云 / IaC 与环境隔离',
        ownerModule: 'configuration-governance',
        summary: '统一用参数化 IaC 模板描述资源边界，并以环境分层限制网络、凭证和数据流向。',
        controls: [
          'IaC 模板只描述中立资源能力，不把云厂商实现写进业务模块。',
          'dev、staging、prod 使用独立网络、证书、备份桶和告警路由。',
          '跨环境访问默认拒绝，调试链路必须通过临时授权与审计。',
          '市场与租户级配置通过继承链下发，不允许前端写死区域策略。'
        ],
        evidence: ['docs/operations-governance-baseline.md', 'docs/security-baseline.md']
      }
    ]
  }

  getDescriptor(): FoundationModuleDescriptor {
    return {
      key: 'configuration-governance',
      name: 'Configuration Governance Module',
      purpose: '集中承载配置中心、secrets/证书治理和 Feature Flag，避免市场策略散落到业务代码。',
      inboundContracts: [
        'Tenant / brand / store scope',
        'Market defaults and override policies',
        'Secrets and certificate metadata'
      ],
      outboundContracts: ['Resolved configuration snapshot', 'Feature flag decision context', 'Secret rotation plan'],
      capabilities: [
        {
          key: 'config-center',
          name: '配置中心入口',
          responsibilities: ['统一承载市场配置与规则', '记录版本和继承链', '为 portal/workbench 输出装配快照'],
          entrypoints: ['ConfigurationGovernanceService.resolveConfigSnapshot'],
          consumers: ['market', 'portal', 'workbench'],
          status: 'active'
        },
        {
          key: 'secrets-certificates',
          name: 'Secrets / 证书治理入口',
          responsibilities: ['管理支付/LYT/邮件等外部密钥', '支持轮换与到期告警', '约束敏感凭证访问'],
          entrypoints: [
            'ConfigurationGovernanceService.rotateSecret',
            'ConfigurationGovernanceService.getCertificateMetadata',
            'ConfigurationGovernanceService.getSecretsCertificatePosture'
          ],
          consumers: ['lyt-adapter'],
          status: 'active'
        },
        {
          key: 'data-lifecycle',
          name: '数据分层与生命周期入口',
          responsibilities: ['定义热温冷数据存储层', '约束保留/归档/销毁流程', '为恢复和分析输出数据索引'],
          entrypoints: ['ConfigurationGovernanceService.resolveConfigSnapshot'],
          consumers: ['market', 'portal', 'workbench', 'lyt-adapter'],
          status: 'active'
        },
        {
          key: 'environment-governance',
          name: '环境与 IaC 治理入口',
          responsibilities: ['沉淀多云中立资源模板', '隔离环境凭证与网络边界', '约束跨环境变更流程'],
          entrypoints: ['ConfigurationGovernanceService.resolveConfigSnapshot'],
          consumers: ['market', 'portal', 'workbench', 'lyt-adapter'],
          status: 'active'
        },
        {
          key: 'feature-flags',
          name: 'Feature Flag 入口',
          responsibilities: ['按租户/品牌/门店做灰度', '支持时间窗和回滚', '为多端装配能力开关'],
          entrypoints: ['ConfigurationGovernanceService.resolveConfigSnapshot', 'ConfigurationGovernanceService.evaluateFeatureFlag'],
          consumers: ['market', 'portal', 'workbench'],
          status: 'active'
        }
      ]
    }
  }

  private normalizeContext(context: RequestTenantContext) {
    return {
      tenantId: context.tenantId ?? 'tenant-demo',
      brandId: context.brandId ?? 'brand-default',
      storeId: context.storeId ?? 'store-default',
      marketCode: context.marketCode ?? 'CN'
    }
  }

  private buildScopeChain(context: Required<RequestTenantContext>) {
    return ['global', `market:${context.marketCode}`, `tenant:${context.tenantId}`, `brand:${context.brandId}`, `store:${context.storeId}`]
  }

  private mergeConfig(context: Required<RequestTenantContext>) {
    const fragments = [
      this.configLayers.defaults,
      this.configLayers.markets[context.marketCode],
      this.configLayers.tenants[context.tenantId],
      this.configLayers.brands[context.brandId],
      this.configLayers.stores[context.storeId]
    ].filter(Boolean)

    return fragments.reduce<ConfigFragment>((accumulator, fragment) => this.deepMerge(accumulator, fragment), {})
  }

  private deepMerge(base: ConfigFragment, patch?: ConfigFragment) {
    if (!patch) {
      return { ...base }
    }

    return {
      ...base,
      ...patch,
      loginPolicy: {
        ...base.loginPolicy,
        ...patch.loginPolicy
      },
      notifications: {
        ...base.notifications,
        ...patch.notifications
      },
      checkout: {
        ...base.checkout,
        ...patch.checkout
      }
    }
  }

  private matchesScope(scope: Partial<RequestTenantContext>, context: Required<RequestTenantContext>) {
    return Object.entries(scope).every(([key, value]) => context[key as keyof RequestTenantContext] === value)
  }

  private getScopeSpecificity(scope: Partial<RequestTenantContext>) {
    return Object.keys(scope).length
  }

  private computeRolloutBucket(flagKey: string, subjectKey: string) {
    const hash = createHash('sha256').update(`${flagKey}:${subjectKey}`).digest('hex').slice(0, 8)
    return Number.parseInt(hash, 16) % 100
  }

  private getSubjectKey(context: Required<RequestTenantContext>) {
    return `${context.tenantId}:${context.brandId}:${context.storeId}`
  }

  private buildFingerprint(value: string) {
    return `sha256:${createHash('sha256').update(value).digest('hex').slice(0, 12)}`
  }

  private buildChecksum(payload: unknown) {
    return createHash('sha256').update(JSON.stringify(payload)).digest('hex')
  }

  private buildId(prefix: string, payload: unknown) {
    return `${prefix}_${this.buildChecksum(payload).slice(0, 12)}`
  }

  private async getPersistentConfigFragment(context: Required<RequestTenantContext>) {
    const entries = await this.prisma.configEntry.findMany({
      where: {
        OR: [
          { scopeType: FoundationScopeType.PLATFORM },
          { scopeType: FoundationScopeType.TENANT, tenantId: context.tenantId },
          { scopeType: FoundationScopeType.BRAND, brandId: context.brandId },
          { scopeType: FoundationScopeType.STORE, storeId: context.storeId }
        ]
      }
    })
    const latestEntries = new Map<string, (typeof entries)[number]>()
    for (const entry of entries) {
      const dedupeKey = `${entry.scopeType}:${entry.tenantId ?? ''}:${entry.brandId ?? ''}:${entry.storeId ?? ''}:${entry.key}`
      const current = latestEntries.get(dedupeKey)
      if (!current || current.version < entry.version || current.updatedAt.getTime() < entry.updatedAt.getTime()) {
        latestEntries.set(dedupeKey, entry)
      }
    }

    return [...latestEntries.values()]
      .sort((left, right) => this.getPersistentScopeSpecificity(left.scopeType) - this.getPersistentScopeSpecificity(right.scopeType))
      .reduce<ConfigFragment>((accumulator, entry) => this.deepMerge(accumulator, this.toConfigFragment(entry.value, entry.key)), {})
  }

  private evaluatePersistedFeatureFlag(
    flagKey: string,
    records: Array<{
      key: string
      name: string
      scopeType: FoundationScopeType
      tenantId: string | null
      brandId: string | null
      storeId: string | null
      marketProfileId: string | null
      status: FeatureFlagStatus
      strategy: RolloutStrategy
      enabled: boolean
      percentage: number | null
      allowList: string[]
      conditions: unknown
      startsAt: Date | null
      endsAt: Date | null
      metadata: unknown
      updatedAt: Date
    }>,
    context: Required<RequestTenantContext>,
    subjectKey?: string
  ) {
    const matched = records
      .filter((record) => this.matchesPersistedFlagScope(record, context))
      .sort((left, right) => this.getPersistentScopeSpecificity(right.scopeType) - this.getPersistentScopeSpecificity(left.scopeType))
    const fallback = records.find((record) => record.scopeType === FoundationScopeType.PLATFORM) ?? records[0]
    const winning = matched[0] ?? fallback
    const metadata = this.getJsonRecord(winning?.metadata)
    const effectiveSubjectKey = subjectKey ?? this.getSubjectKey(context)
    const rolloutPercentage = this.getPersistedRolloutPercentage(winning, effectiveSubjectKey, context)

    return {
      key: flagKey,
      name: winning?.name ?? flagKey,
      description: this.getString(metadata.description) ?? `Persisted feature flag ${flagKey}`,
      enabled: winning ? this.isPersistedFlagEnabled(winning, effectiveSubjectKey, context) : false,
      reason: this.getString(metadata.note) ?? `persisted-${winning?.scopeType?.toLowerCase() ?? 'flag'}`,
      matchedScope: winning ? this.toMatchedScope(winning) : null,
      rolloutPercentage,
      subjectKey: effectiveSubjectKey,
      source: 'prisma'
    }
  }

  private matchesPersistedFlagScope(
    record: {
      scopeType: FoundationScopeType
      tenantId: string | null
      brandId: string | null
      storeId: string | null
    },
    context: Required<RequestTenantContext>
  ) {
    switch (record.scopeType) {
      case FoundationScopeType.PLATFORM:
        return true
      case FoundationScopeType.TENANT:
        return record.tenantId === context.tenantId
      case FoundationScopeType.BRAND:
        return record.brandId === context.brandId
      case FoundationScopeType.STORE:
        return record.storeId === context.storeId
      default:
        return false
    }
  }

  private isPersistedFlagEnabled(
    record: {
      status: FeatureFlagStatus
      strategy: RolloutStrategy
      enabled: boolean
      percentage: number | null
      allowList: string[]
      startsAt: Date | null
      endsAt: Date | null
    },
    subjectKey: string,
    context: Required<RequestTenantContext>
  ) {
    const now = Date.now()
    if (record.status !== FeatureFlagStatus.ACTIVE || !record.enabled) {
      return false
    }
    if (record.startsAt && record.startsAt.getTime() > now) {
      return false
    }
    if (record.endsAt && record.endsAt.getTime() < now) {
      return false
    }

    switch (record.strategy) {
      case RolloutStrategy.ALL:
      case RolloutStrategy.SCOPE_MATCH:
        return true
      case RolloutStrategy.ALLOW_LIST:
        return record.allowList.includes(subjectKey)
      case RolloutStrategy.PERCENTAGE:
        return this.computeRolloutBucket(`persisted:${context.tenantId}:${subjectKey}`, subjectKey) < (record.percentage ?? 0)
      default:
        return false
    }
  }

  private getPersistedRolloutPercentage(
    record:
      | {
          strategy: RolloutStrategy
          enabled: boolean
          percentage: number | null
          allowList: string[]
        }
      | undefined,
    subjectKey: string,
    context: Required<RequestTenantContext>
  ) {
    if (!record || !record.enabled) {
      return 0
    }

    switch (record.strategy) {
      case RolloutStrategy.PERCENTAGE:
        return record.percentage ?? 0
      case RolloutStrategy.ALLOW_LIST:
        return record.allowList.includes(subjectKey) ? 100 : 0
      case RolloutStrategy.ALL:
      case RolloutStrategy.SCOPE_MATCH:
        return 100
      default:
        return this.computeRolloutBucket(`persisted:${context.tenantId}:${subjectKey}`, subjectKey)
    }
  }

  private getPersistentScopeSpecificity(scopeType: FoundationScopeType) {
    switch (scopeType) {
      case FoundationScopeType.PLATFORM:
        return 0
      case FoundationScopeType.TENANT:
        return 1
      case FoundationScopeType.BRAND:
        return 2
      case FoundationScopeType.STORE:
        return 3
      default:
        return 4
    }
  }

  private toMatchedScope(record: {
    scopeType: FoundationScopeType
    tenantId: string | null
    brandId: string | null
    storeId: string | null
    marketProfileId: string | null
  }) {
    return {
      scopeType: record.scopeType,
      tenantId: record.tenantId,
      brandId: record.brandId,
      storeId: record.storeId,
      marketProfileId: record.marketProfileId
    }
  }

  private toConfigFragment(value: unknown, key: string): ConfigFragment {
    if (key === '__fragment__' && this.isRecord(value)) {
      return value as ConfigFragment
    }

    if (key === 'locale' && typeof value === 'string') {
      return { locale: value }
    }
    if (key === 'currency' && typeof value === 'string') {
      return { currency: value }
    }
    if (key === 'timezone' && typeof value === 'string') {
      return { timezone: value }
    }
    if (key === 'loginPolicy' && this.isRecord(value)) {
      return { loginPolicy: value as LoginPolicyConfig }
    }
    if (key === 'notifications' && this.isRecord(value)) {
      return { notifications: value as NotificationConfig }
    }
    if (key === 'checkout' && this.isRecord(value)) {
      return { checkout: value as CheckoutConfig }
    }

    return {}
  }

  private async getConfigEntryById(id: string) {
    const entry = await this.prisma.configEntry.findUnique({
      where: { id },
      include: {
        revisions: {
          orderBy: [{ version: 'desc' }],
          take: 5
        }
      }
    })
    if (!entry) {
      throw new NotFoundException(`Config entry not found: ${id}`)
    }

    return {
      id: entry.id,
      namespace: entry.namespace,
      key: entry.key,
      valueType: entry.valueType,
      scopeType: entry.scopeType,
      tenantId: entry.tenantId,
      brandId: entry.brandId,
      storeId: entry.storeId,
      marketProfileId: entry.marketProfileId,
      portalSiteId: entry.portalSiteId,
      version: entry.version,
      value: entry.value,
      schemaRef: entry.schemaRef,
      tags: entry.tags,
      status: entry.status,
      createdBy: entry.createdBy,
      revisions: entry.revisions.map((revision) => ({
        version: revision.version,
        changedBy: revision.changedBy,
        changeReason: revision.changeReason,
        createdAt: revision.createdAt.toISOString()
      })),
      updatedAt: entry.updatedAt.toISOString()
    }
  }

  private toFeatureFlagRecord(record: {
    id: string
    key: string
    name: string
    scopeType: FoundationScopeType
    tenantId: string | null
    brandId: string | null
    storeId: string | null
    marketProfileId: string | null
    status: FeatureFlagStatus
    strategy: RolloutStrategy
    enabled: boolean
    percentage: number | null
    allowList: string[]
    conditions: unknown
    metadata: unknown
    startsAt: Date | null
    endsAt: Date | null
    updatedAt: Date
  }) {
    const metadata = this.getJsonRecord(record.metadata)
    return {
      id: record.id,
      key: record.key,
      name: record.name,
      scopeType: record.scopeType,
      tenantId: record.tenantId,
      brandId: record.brandId,
      storeId: record.storeId,
      marketProfileId: record.marketProfileId,
      status: record.status,
      strategy: record.strategy,
      enabled: record.enabled,
      percentage: record.percentage,
      allowList: record.allowList,
      conditions: this.getJsonRecord(record.conditions),
      description: this.getString(metadata.description),
      note: this.getString(metadata.note),
      startsAt: record.startsAt?.toISOString() ?? null,
      endsAt: record.endsAt?.toISOString() ?? null,
      updatedAt: record.updatedAt.toISOString()
    }
  }

  private toPersistedSecretMetadata(
    key: string,
    records: Array<{
      kind: SecretKind
      scopeType: FoundationScopeType
      version: number
      provider: SecretProvider
      reference: string
      metadata: unknown
      expiresAt: Date | null
      rotatedAt: Date | null
      status: string
      createdAt: Date
      tenantId: string | null
      brandId: string | null
      storeId: string | null
      integrationAppId: string | null
    }>
  ) {
    if (records.length === 0) {
      throw new NotFoundException(`Secret not found: ${key}`)
    }

    const current = records[0]!
    const metadata = this.getJsonRecord(current.metadata)

    return {
      name: key,
      type: this.getString(metadata.type) ?? this.fromPrismaSecretKind(current.kind),
      scopes: this.getStringArray(metadata.scopes),
      consumers: this.getStringArray(metadata.consumers),
      algorithm: this.getString(metadata.algorithm) ?? this.getDefaultSecretAlgorithm(current.kind),
      currentVersion: current.version,
      status: current.status.toLowerCase(),
      lastRotatedAt: (current.rotatedAt ?? current.createdAt).toISOString(),
      expiresAt: current.expiresAt?.toISOString() ?? null,
      fingerprint: this.getString(metadata.fingerprint) ?? this.buildFingerprint(current.reference),
      provider: current.provider,
      scopeType: current.scopeType,
      versions: [...records]
        .sort((left, right) => left.version - right.version)
        .map((record) => {
          const versionMetadata = this.getJsonRecord(record.metadata)
          return {
            version: record.version,
            fingerprint: this.getString(versionMetadata.fingerprint) ?? this.buildFingerprint(record.reference),
            createdAt: record.createdAt.toISOString(),
            expiresAt: record.expiresAt?.toISOString() ?? null,
            rotatedBy: this.getString(versionMetadata.rotatedBy) ?? 'unknown'
          }
        })
    }
  }

  private toStaticSecretMetadata(secret: SecretRecord) {
    return {
      name: secret.name,
      type: secret.type,
      scopes: secret.scopes,
      consumers: secret.consumers,
      algorithm: secret.algorithm,
      currentVersion: secret.currentVersion,
      status: secret.status,
      lastRotatedAt: secret.lastRotatedAt,
      expiresAt: secret.expiresAt,
      fingerprint: secret.versions.at(-1)?.fingerprint ?? 'sha256:unknown',
      source: 'in-memory',
      versions: secret.versions.map((version) => ({
        version: version.version,
        fingerprint: version.fingerprint,
        createdAt: version.createdAt,
        expiresAt: version.expiresAt,
        rotatedBy: version.rotatedBy
      }))
    }
  }

  private toCertificateMetadata(certificate: CertificateRecord, expiringWithinDays: number) {
    const now = Date.now()
    const expiresAt = Date.parse(certificate.expiresAt)
    const expiringAt = now + expiringWithinDays * 24 * 60 * 60 * 1000
    const status = expiresAt < now ? 'expired' : expiresAt <= expiringAt ? 'expiring-soon' : 'active'

    return {
      name: certificate.name,
      secretName: certificate.secretName,
      format: certificate.format,
      scopes: certificate.scopes,
      consumers: certificate.consumers,
      domains: certificate.domains,
      issuer: certificate.issuer,
      autoRenew: certificate.autoRenew,
      issuedAt: certificate.issuedAt,
      expiresAt: certificate.expiresAt,
      lastValidatedAt: certificate.lastValidatedAt,
      rotatedBy: certificate.rotatedBy,
      status
    }
  }

  private toPrismaSecretKind(secretType: SecretRecord['type']) {
    switch (secretType) {
      case 'webhook-signing':
        return SecretKind.WEBHOOK_SECRET
      case 'certificate':
        return SecretKind.CERTIFICATE
      case 'api-key':
      default:
        return SecretKind.API_KEY
    }
  }

  private fromPrismaSecretKind(kind?: SecretKind) {
    switch (kind) {
      case SecretKind.WEBHOOK_SECRET:
        return 'webhook-signing'
      case SecretKind.CERTIFICATE:
        return 'certificate'
      case SecretKind.API_KEY:
      default:
        return 'api-key'
    }
  }

  private getDefaultSecretAlgorithm(kind: SecretKind) {
    switch (kind) {
      case SecretKind.WEBHOOK_SECRET:
        return 'hmac-sha256'
      case SecretKind.CERTIFICATE:
        return 'sha256-fingerprint'
      case SecretKind.API_KEY:
      default:
        return 'sha256-fingerprint'
    }
  }

  private groupByKey<T extends { key: string }>(records: T[]) {
    const grouped = new Map<string, T[]>()
    for (const record of records) {
      const bucket = grouped.get(record.key)
      if (bucket) {
        bucket.push(record)
      } else {
        grouped.set(record.key, [record])
      }
    }

    return [...grouped.entries()]
  }

  private getJsonRecord(value: unknown) {
    return this.isRecord(value) ? value : {}
  }

  private getString(value: unknown) {
    return typeof value === 'string' ? value : undefined
  }

  private getStringArray(value: unknown) {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
  }

  private async recordGovernanceAudit(
    eventType: string,
    input: {
      tenantId?: string
      actorId?: string
      source?: string
      details: Record<string, unknown>
    }
  ) {
    await this.trustGovernanceService.recordAudit(eventType, input.details, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      source: input.source ?? 'configuration-governance',
      riskLevel: 'medium'
    })
  }

  private async handleApprovalExecutionFailure(
    approval: GovernanceApprovalSnapshot,
    actorId: string | undefined,
    failureStatus: string,
    error: unknown,
    details?: Record<string, unknown>
  ) {
    const failureReason = error instanceof Error ? error.message : 'Unknown execution failure'
    const failedApproval = await markGovernanceApprovalExecutionFailed(this.prisma, {
      approvalTicket: approval.ticket ?? '',
      failedBy: actorId ?? 'configuration-governance',
      expectedVersion: approval.version ?? undefined,
      failureStatus,
      failureReason,
      summary: details
    })

    await this.recordGovernanceAudit('foundation.approval.execution-failed', {
      tenantId: failedApproval.summary?.tenantId ? String(failedApproval.summary.tenantId) : undefined,
      actorId: actorId ?? 'configuration-governance',
      source: 'configuration-governance',
      details: {
        approvalTicket: failedApproval.ticket,
        operation: failedApproval.operation,
        resourceType: failedApproval.resourceType,
        resourceKey: failedApproval.resourceKey,
        failureStatus,
        failureReason,
        ...(details ?? {})
      }
    })
  }

  private buildGovernanceMetadata(
    operation: string,
    input: {
      resource: string
      action: string
      requiredRoles: string[]
      requiredPermissions: string[]
      approvalRequired: boolean
      requestedBy?: string
      ticket?: string
      status?: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'SUPERSEDED'
      approvalRecord?: GovernanceApprovalSnapshot
    }
  ) {
    return {
      operation,
      rbac: {
        resource: input.resource,
        action: input.action,
        requiredRoles: input.requiredRoles,
        requiredPermissions: input.requiredPermissions
      },
      approval: {
        required: input.approvalRequired,
        approvalId: input.approvalRecord?.approvalId ?? null,
        version: input.approvalRecord?.version ?? null,
        requestedBy: input.approvalRecord?.requestedBy ?? input.requestedBy ?? null,
        ticket: input.approvalRecord?.ticket ?? input.ticket ?? null,
        status: input.approvalRecord?.status ?? (input.approvalRequired ? (input.status ?? 'PENDING') : 'NOT_REQUIRED'),
        submitted: input.approvalRecord?.submitted ?? Boolean(input.ticket),
        persisted: input.approvalRecord?.persisted ?? false,
        decidedBy: input.approvalRecord?.decidedBy ?? null,
        decidedAt: input.approvalRecord?.decidedAt ?? null,
        updatedAt: input.approvalRecord?.updatedAt ?? null,
        execution: input.approvalRecord?.execution ?? {
          attempts: 0,
          executed: false,
          executionStatus: null,
          executedAt: null,
          executedBy: null,
          lastFailure: null
        }
      }
    }
  }

  private buildResourceKey(...parts: Array<string | null | undefined>) {
    return parts.filter((part): part is string => Boolean(part)).join(':')
  }

  private isConfigurationApproval(operation?: string, resourceType?: string) {
    return (
      (operation === 'config-entry.write' ||
        operation === 'feature-flag.write' ||
        operation === 'secret.register' ||
        operation === 'secret.rotate') &&
      (resourceType === 'config-entry' || resourceType === 'feature-flag' || resourceType === 'secret')
    )
  }

  private toInputJsonValue(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue
  }
}

function buildCountMap(values: string[]) {
  return values.reduce<Record<string, number>>((result, value) => {
    result[value] = (result[value] ?? 0) + 1
    return result
  }, {})
}
