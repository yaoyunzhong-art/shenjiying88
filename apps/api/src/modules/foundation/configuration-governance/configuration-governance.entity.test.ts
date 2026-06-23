import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  ConfigEntryStatus,
  FeatureFlagState,
  SecretKind,
  SecretProviderKind,
  ConfigLayer,
  type ConfigFragment,
  type FeatureFlagDefinition,
  type FeatureFlagRule,
  type FeatureFlagEvaluation,
  type ConfigEntryResult,
  type SecretRecord,
  type SecretVersionRecord,
  type CertificateRecord,
  type ConfigSnapshot,
  type ConfigSnapshotContext,
  type SecretsCertificatePosture,
  type AttentionItem,
  type ConfigurationGovernanceResult,
  type GovernanceMetadata,
  type GovernanceBaseline,
  type ModuleCapability,
  type FoundationModuleDescriptor
} from './configuration-governance.entity'

describe('configuration-governance entity - ConfigEntryStatus', () => {
  test('三个状态值', () => {
    assert.equal(ConfigEntryStatus.ACTIVE, 'ACTIVE')
    assert.equal(ConfigEntryStatus.DRAFT, 'DRAFT')
    assert.equal(ConfigEntryStatus.ARCHIVED, 'ARCHIVED')
  })
})

describe('configuration-governance entity - FeatureFlagState', () => {
  test('四个状态值', () => {
    assert.equal(FeatureFlagState.DRAFT, 'DRAFT')
    assert.equal(FeatureFlagState.ACTIVE, 'ACTIVE')
    assert.equal(FeatureFlagState.PAUSED, 'PAUSED')
    assert.equal(FeatureFlagState.ARCHIVED, 'ARCHIVED')
  })
})

describe('configuration-governance entity - SecretKind', () => {
  test('三种密钥类型', () => {
    assert.equal(SecretKind.ApiKey, 'api-key')
    assert.equal(SecretKind.WebhookSigning, 'webhook-signing')
    assert.equal(SecretKind.Certificate, 'certificate')
  })
})

describe('configuration-governance entity - SecretProviderKind', () => {
  test('四种供应商', () => {
    assert.equal(SecretProviderKind.DATABASE, 'DATABASE')
    assert.equal(SecretProviderKind.VAULT, 'VAULT')
    assert.equal(SecretProviderKind.KMS, 'KMS')
    assert.equal(SecretProviderKind.EXTERNAL, 'EXTERNAL')
  })
})

describe('configuration-governance entity - ConfigLayer', () => {
  test('五层配置', () => {
    assert.equal(ConfigLayer.Platform, 'platform')
    assert.equal(ConfigLayer.Market, 'market')
    assert.equal(ConfigLayer.Tenant, 'tenant')
    assert.equal(ConfigLayer.Brand, 'brand')
    assert.equal(ConfigLayer.Store, 'store')
  })
})

describe('configuration-governance entity - ConfigFragment type', () => {
  test('符合 ConfigFragment 结构 - 完整', () => {
    const fragment: ConfigFragment = {
      locale: 'zh-CN',
      currency: 'CNY',
      timezone: 'Asia/Shanghai',
      loginPolicy: {
        mfaRequired: true,
        sessionTtlMinutes: 480,
        allowedLoginMethods: ['password', 'sms-otp']
      },
      notifications: {
        emailProvider: 'aliyun-mail',
        smsProvider: 'aliyun-sms',
        digestWindow: '08:00-09:00'
      },
      checkout: {
        allowGuestCheckout: false,
        paymentChannels: ['wechat-pay', 'alipay']
      }
    }
    assert.equal(fragment.locale, 'zh-CN')
    assert.equal(fragment.currency, 'CNY')
    assert.equal(fragment.timezone, 'Asia/Shanghai')
    assert.equal(fragment.loginPolicy!.mfaRequired, true)
    assert.equal(fragment.notifications!.digestWindow, '08:00-09:00')
    assert.deepEqual(fragment.checkout!.paymentChannels, ['wechat-pay', 'alipay'])
  })

  test('符合 ConfigFragment 结构 - 部分', () => {
    const fragment: ConfigFragment = {
      locale: 'en-SG',
      currency: 'SGD'
    }
    assert.equal(fragment.locale, 'en-SG')
    assert.equal(fragment.currency, 'SGD')
    assert.equal(fragment.loginPolicy, undefined)
    assert.equal(fragment.notifications, undefined)
  })
})

describe('configuration-governance entity - FeatureFlagDefinition type', () => {
  test('符合 FeatureFlagDefinition 结构', () => {
    const flag: FeatureFlagDefinition = {
      key: 'new-checkout',
      name: '新版结账',
      description: '按租户灰度的新结账流程',
      defaultEnabled: false,
      rules: [
        {
          scope: { tenantId: 'tenant-premium' },
          enabled: true,
          rolloutPercentage: 100,
          note: 'premium 租户全量开启'
        }
      ]
    }
    assert.equal(flag.key, 'new-checkout')
    assert.equal(flag.defaultEnabled, false)
    assert.equal(flag.rules.length, 1)
    assert.equal(flag.rules[0].rolloutPercentage, 100)
  })

  test('FeatureFlagDefinition - 多规则', () => {
    const rules: FeatureFlagRule[] = [
      { scope: { tenantId: 't1' }, enabled: true, rolloutPercentage: 20, note: '小流量' },
      { scope: { brandId: 'b1' }, enabled: true, rolloutPercentage: 50, note: '半量' },
      { scope: { storeId: 's1' }, enabled: true, rolloutPercentage: 100, note: '全量回归' }
    ]
    const flag: FeatureFlagDefinition = {
      key: 'ai-order-review',
      name: 'AI 订单审核',
      description: 'AI 辅助审核高风险订单',
      defaultEnabled: false,
      rules
    }
    assert.equal(flag.rules.length, 3)
    assert.equal(flag.rules[2].rolloutPercentage, 100)
  })
})

describe('configuration-governance entity - FeatureFlagEvaluation type', () => {
  test('符合 FeatureFlagEvaluation 结构 - in-memory 来源', () => {
    const evalResult: FeatureFlagEvaluation = {
      key: 'new-checkout',
      name: '新版结账',
      description: '按租户灰度的新结账流程',
      enabled: true,
      reason: 'premium 租户全量开启',
      matchedScope: { tenantId: 'tenant-premium' },
      rolloutPercentage: 100,
      subjectKey: 'tenant-premium:brand-default:store-default',
      source: 'in-memory'
    }
    assert.equal(evalResult.key, 'new-checkout')
    assert.equal(evalResult.enabled, true)
    assert.equal(evalResult.source, 'in-memory')
  })

  test('符合 FeatureFlagEvaluation 结构 - persisted 来源', () => {
    const evalResult: FeatureFlagEvaluation = {
      key: 'member-import-v2',
      name: '会员导入 V2',
      description: '新版导入处理链',
      enabled: false,
      reason: 'default-policy',
      matchedScope: null,
      rolloutPercentage: 0,
      subjectKey: 'tenant-default:brand-default:store-default',
      source: 'persisted'
    }
    assert.equal(evalResult.key, 'member-import-v2')
    assert.equal(evalResult.enabled, false)
    assert.equal(evalResult.source, 'persisted')
    assert.equal(evalResult.matchedScope, null)
  })
})

describe('configuration-governance entity - ConfigEntryResult type', () => {
  test('符合 ConfigEntryResult 结构', () => {
    const entry: ConfigEntryResult = {
      id: 'entry-001',
      namespace: 'checkout',
      key: 'paymentChannels',
      valueType: 'JSON',
      scopeType: 'TENANT' as any,
      tenantId: 'tenant-demo',
      brandId: null,
      storeId: null,
      marketProfileId: null,
      portalSiteId: null,
      version: 3,
      value: ['wechat-pay', 'alipay'],
      schemaRef: null,
      tags: ['payment', 'market'],
      status: 'ACTIVE',
      createdBy: 'admin',
      latestRevision: {
        version: 3,
        changedBy: 'admin',
        changeReason: '添加支付渠道',
        createdAt: '2026-06-20T10:00:00.000Z'
      },
      updatedAt: '2026-06-20T10:00:00.000Z'
    }
    assert.equal(entry.namespace, 'checkout')
    assert.equal(entry.key, 'paymentChannels')
    assert.equal(entry.version, 3)
    assert.equal(entry.status, 'ACTIVE')
    assert.deepEqual(entry.tags, ['payment', 'market'])
  })

  test('ConfigEntryResult - 无修订记录', () => {
    const entry: ConfigEntryResult = {
      id: 'entry-002',
      namespace: 'login',
      key: 'mfaRequired',
      valueType: 'BOOLEAN',
      scopeType: 'TENANT' as any,
      tenantId: 'tenant-demo',
      brandId: null,
      storeId: null,
      marketProfileId: null,
      portalSiteId: null,
      version: 1,
      value: true,
      schemaRef: null,
      tags: [],
      status: 'ACTIVE',
      createdBy: 'system',
      latestRevision: null,
      updatedAt: '2026-06-20T09:00:00.000Z'
    }
    assert.equal(entry.latestRevision, null)
    assert.equal(entry.version, 1)
  })
})

describe('configuration-governance entity - SecretRecord type', () => {
  test('符合 SecretRecord 结构', () => {
    const versions: SecretVersionRecord[] = [
      {
        version: 1,
        fingerprint: 'sha256:aaaa',
        createdAt: '2026-01-01T00:00:00.000Z',
        expiresAt: '2026-05-01T00:00:00.000Z',
        rotatedBy: 'bootstrap'
      },
      {
        version: 2,
        fingerprint: 'sha256:bbbb',
        createdAt: '2026-05-01T00:00:00.000Z',
        expiresAt: '2026-11-01T00:00:00.000Z',
        rotatedBy: 'ops-bot'
      }
    ]
    const secret: SecretRecord = {
      name: 'lyt-webhook-signing-secret',
      type: 'webhook-signing',
      scopes: ['integration-orchestration'],
      consumers: ['lyt-adapter'],
      algorithm: 'hmac-sha256',
      currentVersion: 2,
      status: 'active',
      lastRotatedAt: '2026-05-01T00:00:00.000Z',
      expiresAt: '2026-11-01T00:00:00.000Z',
      value: 'lyt-webhook-secret-v2',
      versions,
      source: 'in-memory'
    }
    assert.equal(secret.name, 'lyt-webhook-signing-secret')
    assert.equal(secret.type, 'webhook-signing')
    assert.equal(secret.currentVersion, 2)
    assert.equal(secret.status, 'active')
    assert.equal(secret.versions.length, 2)
  })

  test('SecretRecord - rotation-due', () => {
    const secret: SecretRecord = {
      name: 'payment-api-key',
      type: 'api-key',
      scopes: ['market'],
      consumers: ['market'],
      algorithm: 'sha256-fingerprint',
      currentVersion: 3,
      status: 'rotation-due',
      lastRotatedAt: '2026-01-10T04:00:00.000Z',
      expiresAt: '2026-07-10T04:00:00.000Z',
      value: 'pay-api-key-v3',
      versions: [
        {
          version: 3,
          fingerprint: 'sha256:cccc',
          createdAt: '2026-01-10T04:00:00.000Z',
          expiresAt: '2026-07-10T04:00:00.000Z',
          rotatedBy: 'admin'
        }
      ]
    }
    assert.equal(secret.status, 'rotation-due')
    assert.equal(secret.type, 'api-key')
  })
})

describe('configuration-governance entity - CertificateRecord type', () => {
  test('符合 CertificateRecord 结构', () => {
    const cert: CertificateRecord = {
      name: 'lyt-callback-cert',
      secretName: 'lyt-webhook-signing-secret',
      format: 'PEM',
      scopes: ['integration-orchestration'],
      consumers: ['lyt-adapter'],
      domains: ['callback.lyt.m5.local'],
      issuer: 'M5 Internal CA',
      autoRenew: true,
      issuedAt: '2026-04-01T00:00:00.000Z',
      expiresAt: '2026-08-30T00:00:00.000Z',
      lastValidatedAt: '2026-06-10T09:00:00.000Z',
      rotatedBy: 'ops-cert-bot',
      status: 'active'
    }
    assert.equal(cert.name, 'lyt-callback-cert')
    assert.equal(cert.format, 'PEM')
    assert.equal(cert.autoRenew, true)
    assert.equal(cert.domains.length, 1)
    assert.equal(cert.status, 'active')
  })

  test('CertificateRecord - expiring-soon', () => {
    const cert: CertificateRecord = {
      name: 'payment-gateway-cert',
      secretName: 'payment-provider-api-key',
      format: 'PFX',
      scopes: ['market'],
      consumers: ['market'],
      domains: ['payments-gateway.m5.local'],
      issuer: 'Partner CA',
      autoRenew: false,
      issuedAt: '2025-12-15T00:00:00.000Z',
      expiresAt: '2026-06-28T00:00:00.000Z',
      lastValidatedAt: '2026-06-11T08:00:00.000Z',
      rotatedBy: 'sec-admin',
      status: 'expiring-soon'
    }
    assert.equal(cert.status, 'expiring-soon')
    assert.equal(cert.autoRenew, false)
  })
})

describe('configuration-governance entity - ConfigSnapshot type', () => {
  test('符合 ConfigSnapshot 结构', () => {
    const context: ConfigSnapshotContext = {
      tenantId: 'tenant-demo',
      brandId: 'brand-premium',
      storeId: 'store-sh-001'
    }
    const snapshot: ConfigSnapshot = {
      snapshotId: 'snapshot::tenant-demo:brand-premium:store-sh-001',
      generatedAt: '2026-06-23T10:00:00.000Z',
      scopeChain: [ConfigLayer.Platform, ConfigLayer.Tenant, ConfigLayer.Brand],
      context,
      config: {
        locale: 'zh-CN',
        currency: 'CNY',
        timezone: 'Asia/Shanghai'
      },
      featureFlags: [],
      secrets: [],
      checksum: 'sha256:abc123'
    }
    assert.equal(snapshot.snapshotId.startsWith('snapshot'), true)
    assert.equal(snapshot.context.tenantId, 'tenant-demo')
    assert.equal(snapshot.scopeChain.length, 3)
    assert.equal(snapshot.checksum, 'sha256:abc123')
  })
})

describe('configuration-governance entity - SecretsCertificatePosture type', () => {
  test('符合 SecretsCertificatePosture 结构', () => {
    const attentionItems: AttentionItem[] = [
      { type: 'secret', key: 'payment-api-key', status: 'rotation-due', expiresAt: '2026-07-10T04:00:00.000Z' },
      { type: 'certificate', key: 'payment-gateway-cert', status: 'expiring-soon', expiresAt: '2026-06-28T00:00:00.000Z', linkedSecret: 'payment-provider-api-key' }
    ]
    const posture: SecretsCertificatePosture = {
      generatedAt: '2026-06-23T10:00:00.000Z',
      secrets: { total: 5, rotationDue: 1, expired: 0, sharedConsumers: 2 },
      certificates: { total: 3, expiringSoon: 1, expired: 0, autoRenewDisabled: 1 },
      attention: attentionItems
    }
    assert.equal(posture.secrets.total, 5)
    assert.equal(posture.secrets.rotationDue, 1)
    assert.equal(posture.certificates.expiringSoon, 1)
    assert.equal(posture.attention.length, 2)
    assert.equal(posture.attention[0].type, 'secret')
    assert.equal(posture.attention[1].linkedSecret, 'payment-provider-api-key')
  })
})

describe('configuration-governance entity - ConfigurationGovernanceResult type', () => {
  test('符合 ConfigurationGovernanceResult 结构 - 配置创建', () => {
    const result: ConfigurationGovernanceResult = {
      status: 'created',
      entry: {
        id: 'entry-001',
        namespace: 'checkout',
        key: 'paymentChannels',
        valueType: 'JSON',
        scopeType: 'TENANT' as any,
        tenantId: 'tenant-demo',
        brandId: null,
        storeId: null,
        marketProfileId: null,
        portalSiteId: null,
        version: 1,
        value: ['wechat-pay'],
        schemaRef: null,
        tags: [],
        status: 'ACTIVE',
        createdBy: 'admin',
        latestRevision: {
          version: 1,
          changedBy: 'admin',
          changeReason: '初始化',
          createdAt: '2026-06-23T10:00:00.000Z'
        },
        updatedAt: '2026-06-23T10:00:00.000Z'
      }
    }
    assert.equal(result.status, 'created')
    assert.equal(result.entry!.namespace, 'checkout')
  })

  test('符合 ConfigurationGovernanceResult 结构 - 秘密轮换', () => {
    const result: ConfigurationGovernanceResult = {
      status: 'rotated',
      secretName: 'lyt-webhook-signing-secret'
    }
    assert.equal(result.status, 'rotated')
    assert.equal(result.secretName, 'lyt-webhook-signing-secret')
  })
})

describe('configuration-governance entity - GovernanceMetadata type', () => {
  test('符合 GovernanceMetadata 结构', () => {
    const meta: GovernanceMetadata = {
      operation: 'config-entry.write',
      rbac: {
        resource: 'config-entry',
        action: 'write',
        requiredRoles: ['SUPER_ADMIN', 'TENANT_ADMIN'],
        requiredPermissions: ['foundation.config.write']
      },
      approval: {
        required: false,
        approvalId: null,
        version: null,
        requestedBy: 'admin',
        ticket: null,
        status: 'NOT_REQUIRED',
        submitted: false,
        persisted: false,
        decidedBy: null,
        decidedAt: null,
        updatedAt: null,
        execution: {
          attempts: 0,
          executed: false,
          executionStatus: null,
          executedAt: null,
          executedBy: null,
          lastFailure: null
        }
      }
    }
    assert.equal(meta.operation, 'config-entry.write')
    assert.equal(meta.rbac.resource, 'config-entry')
    assert.equal(meta.approval.required, false)
  })

  test('GovernanceMetadata - 审批已通过', () => {
    const meta: GovernanceMetadata = {
      operation: 'secret.rotate',
      rbac: {
        resource: 'secret',
        action: 'rotate',
        requiredRoles: ['SUPER_ADMIN', 'SECURITY_ADMIN'],
        requiredPermissions: ['foundation.secret.rotate']
      },
      approval: {
        required: true,
        approvalId: 'approval-001',
        version: 2,
        requestedBy: 'sec-admin',
        ticket: 'TICKET-ROTATE-001',
        status: 'APPROVED',
        submitted: true,
        persisted: true,
        decidedBy: 'super-admin',
        decidedAt: '2026-06-23T09:30:00.000Z',
        updatedAt: '2026-06-23T09:30:00.000Z',
        execution: {
          attempts: 1,
          executed: true,
          executionStatus: 'rotated',
          executedAt: '2026-06-23T09:35:00.000Z',
          executedBy: 'ops-bot',
          lastFailure: null
        }
      }
    }
    assert.equal(meta.approval.status, 'APPROVED')
    assert.equal(meta.approval.execution.executed, true)
  })
})

describe('configuration-governance entity - GovernanceBaseline type', () => {
  test('符合 GovernanceBaseline 结构', () => {
    const baseline: GovernanceBaseline = {
      key: 'secrets-certificate-rotation',
      name: 'Secrets 与证书轮换',
      ownerModule: 'configuration-governance',
      summary: '通过版本化凭证、到期告警和灰度切换避免生产中断',
      controls: [
        '敏感凭证只保存引用或密文',
        '轮换支持双版本并行与回滚',
        '证书到期前生成告警并安排演练'
      ],
      evidence: ['docs/operations-governance-baseline.md', 'docs/operations-runbook-template.md']
    }
    assert.equal(baseline.key, 'secrets-certificate-rotation')
    assert.equal(baseline.controls.length, 3)
    assert.equal(baseline.evidence.length, 2)
  })
})

describe('configuration-governance entity - ModuleCapability type', () => {
  test('符合 ModuleCapability 结构', () => {
    const cap: ModuleCapability = {
      key: 'config-center',
      name: '配置中心入口',
      responsibilities: ['统一承载市场配置与规则', '记录版本和继承链'],
      entrypoints: ['ConfigurationGovernanceService.resolveConfigSnapshot'],
      consumers: ['market', 'portal', 'workbench'],
      status: 'active'
    }
    assert.equal(cap.key, 'config-center')
    assert.equal(cap.status, 'active')
    assert.equal(cap.consumers.length, 3)
  })
})

describe('configuration-governance entity - FoundationModuleDescriptor type', () => {
  test('符合 FoundationModuleDescriptor 结构', () => {
    const desc: FoundationModuleDescriptor = {
      key: 'configuration-governance',
      name: 'Configuration Governance Module',
      purpose: '统一配置中心、secrets/证书治理和 Feature Flag',
      inboundContracts: ['Tenant / brand / store scope'],
      outboundContracts: ['Resolved configuration snapshot'],
      capabilities: [
        {
          key: 'config-center',
          name: '配置中心',
          responsibilities: ['统一承载配置'],
          entrypoints: ['resolveConfigSnapshot'],
          consumers: ['market'],
          status: 'active'
        }
      ]
    }
    assert.equal(desc.key, 'configuration-governance')
    assert.equal(desc.capabilities.length, 1)
    assert.equal(desc.capabilities[0].status, 'active')
  })
})
