import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  type ConfigurationCertificateMetadata,
  type ConfigurationConfigEntry,
  type ConfigurationFeatureFlag,
  type ConfigurationGovernanceMetadataEntry,
  type ConfigurationOverview,
  type ConfigurationSecretMetadata,
  buildConfigurationHref
} from '@m5/types'
import {
  CERTIFICATE_STATUS_LABEL,
  CERTIFICATE_STATUS_VARIANT,
  SECRET_STATUS_LABEL,
  SECRET_STATUS_VARIANT,
  featureFlagStatusLabel,
  loadConfigurationGovernanceSnapshot,
  summarizeCertificate,
  summarizeConfigEntry,
  summarizeSecret
} from './configuration-view-model'

const SAMPLE_OVERVIEW: ConfigurationOverview = {
  generatedAt: '2026-06-14T08:00:00.000Z',
  approvals: {},
  audits: {},
  configuration: {
    entries: {
      total: 2,
      active: 2,
      namespaces: { 'feature.gates': 2 },
      items: [
        {
          id: 'cfg-1',
          key: 'checkout.experimental',
          namespace: 'feature.gates',
          value: true,
          valueType: 'boolean',
          scopeType: 'PLATFORM',
          status: 'ACTIVE',
          version: 3,
          updatedAt: '2026-06-14T07:50:00.000Z'
        },
        {
          id: 'cfg-2',
          key: 'order.timeout',
          namespace: 'feature.gates',
          value: 30,
          valueType: 'number',
          scopeType: 'TENANT',
          status: 'ACTIVE',
          version: 1,
          updatedAt: '2026-06-14T07:00:00.000Z'
        }
      ]
    },
    featureFlags: {
      total: 1,
      enabled: 1,
      active: 1,
      byStrategy: { boolean: 1 },
      items: [
        {
          key: 'checkout.experimental',
          name: '结账实验',
          enabled: true,
          reason: 'tenant-rollout',
          rolloutPercentage: 100,
          source: 'persisted'
        }
      ]
    },
    secrets: {
      total: 1,
      persisted: 1,
      static: 0,
      rotationDue: 0,
      expired: 0,
      items: [
        {
          name: 'jwt.signing',
          status: 'active',
          version: 4,
          consumers: ['member-service', 'foundation'],
          expiresAt: '2026-09-14T00:00:00.000Z'
        }
      ]
    },
    certificates: {
      total: 1,
      autoRenew: 1,
      expiringSoon: 0,
      expired: 0,
      items: [
        {
          name: 'm5-tls',
          status: 'active',
          expiresAt: '2026-12-31T00:00:00.000Z',
          autoRenew: true,
          issuer: 'm5-internal'
        }
      ]
    }
  },
  posture: {
    generatedAt: '2026-06-14T08:00:00.000Z',
    secrets: { total: 1, rotationDue: 0, expired: 0, sharedConsumers: 1 },
    certificates: { total: 1, expiringSoon: 0, expired: 0, autoRenewDisabled: 0 },
    attention: { secrets: [], certificates: [] }
  },
  scopeChain: [
    {
      scopeType: 'PLATFORM',
      tenantId: 'tenant-demo',
      brandId: 'brand-demo',
      storeId: 'store-001',
      marketCode: 'cn-mainland'
    }
  ]
}

const SAMPLE_MANAGEMENT_METADATA: ConfigurationGovernanceMetadataEntry[] = [
  {
    operation: 'secret.rotate',
    rbac: {
      resource: 'secret',
      action: 'rotate',
      requiredRoles: ['SUPER_ADMIN', 'SECURITY_ADMIN'],
      requiredPermissions: ['foundation.secret.rotate']
    },
    approval: {
      required: true,
      approvalId: null,
      version: null,
      requestedBy: null,
      ticket: null,
      status: 'PENDING',
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
        executedBy: null
      }
    }
  },
  {
    operation: 'feature-flag.toggle',
    rbac: {
      resource: 'feature-flag',
      action: 'toggle',
      requiredRoles: ['TENANT_ADMIN'],
      requiredPermissions: ['foundation.feature-flag.manage']
    },
    approval: {
      required: false,
      approvalId: null,
      version: null,
      requestedBy: null,
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
        executedBy: null
      }
    }
  }
]

describe('configuration-view-model', () => {
  test('buildConfigurationHref omits empty query', () => {
    assert.equal(buildConfigurationHref(), '/configuration')
  })

  test('buildConfigurationHref includes tenantId/brandId/storeId/marketCode', () => {
    assert.equal(
      buildConfigurationHref({ tenantId: 't1', brandId: 'b1', storeId: 's1', marketCode: 'cn-mainland' }),
      '/configuration?tenantId=t1&brandId=b1&storeId=s1&marketCode=cn-mainland'
    )
  })

  test('buildConfigurationHref includes only tenantId', () => {
    assert.equal(
      buildConfigurationHref({ tenantId: 't1' }),
      '/configuration?tenantId=t1'
    )
  })

  test('buildConfigurationHref includes only marketCode', () => {
    assert.equal(
      buildConfigurationHref({ marketCode: 'hk-mainland' }),
      '/configuration?marketCode=hk-mainland'
    )
  })

  test('featureFlagStatusLabel flips with enabled', () => {
    const enabled = featureFlagStatusLabel({ key: 'a', enabled: true } as ConfigurationFeatureFlag)
    const disabled = featureFlagStatusLabel({ key: 'a', enabled: false } as ConfigurationFeatureFlag)
    assert.equal(enabled, '启用')
    assert.equal(disabled, '关闭')
  })

  test('featureFlagStatusLabel handles null/undefined', () => {
    assert.equal(featureFlagStatusLabel(null), '关闭')
    assert.equal(featureFlagStatusLabel(undefined), '关闭')
  })

  test('featureFlagStatusLabel handles flag with enabled=false', () => {
    const flag: ConfigurationFeatureFlag = { key: 'test', name: 'Test', enabled: false, reason: 'manual', rolloutPercentage: 0, source: 'persisted' }
    assert.equal(featureFlagStatusLabel(flag), '关闭')
  })

  test('featureFlagStatusLabel handles flag with enabled=true', () => {
    const flag: ConfigurationFeatureFlag = { key: 'test2', name: 'Test2', enabled: true, reason: 'rollout', rolloutPercentage: 50, source: 'persisted' }
    assert.equal(featureFlagStatusLabel(flag), '启用')
  })

  test('summarize helpers cover primitive/string/object/null/undefined cases', () => {
    const objEntry = {
      id: 'cfg-3',
      key: 'foo.bar',
      value: { nested: true, deep: { arr: [1, 2] } },
      scopeType: 'PLATFORM',
      updatedAt: '2026-06-14T07:00:00.000Z'
    } as ConfigurationConfigEntry
    const nullEntry = {
      id: 'cfg-4',
      key: 'foo.null',
      value: null,
      scopeType: 'PLATFORM',
      updatedAt: '2026-06-14T07:00:00.000Z'
    } as ConfigurationConfigEntry
    const stringEntry = {
      id: 'cfg-5',
      key: 'foo.bar.name',
      value: 'hello-world',
      scopeType: 'TENANT',
      updatedAt: '2026-06-14T07:00:00.000Z'
    } as ConfigurationConfigEntry
    const numberEntry = {
      id: 'cfg-6',
      key: 'foo.timeout',
      value: 5000,
      scopeType: 'TENANT',
      updatedAt: '2026-06-14T07:00:00.000Z'
    } as ConfigurationConfigEntry
    assert.equal(summarizeConfigEntry(objEntry), JSON.stringify({ nested: true, deep: { arr: [1, 2] } }))
    assert.equal(summarizeConfigEntry(nullEntry), '—')
    assert.equal(summarizeConfigEntry(stringEntry), 'hello-world')
    assert.equal(summarizeConfigEntry(numberEntry), '5000')
    assert.equal(summarizeSecret({ name: 's', consumers: ['a', 'b'] } as ConfigurationSecretMetadata), 's · 消费者 a, b')
    assert.equal(summarizeCertificate({ name: 'c', issuer: 'm5-internal', status: 'active', expiresAt: 'x' } as ConfigurationCertificateMetadata), 'c · m5-internal')
  })

  test('summarizeSecret handles no consumers', () => {
    const noConsumer: ConfigurationSecretMetadata = { name: 'api-key', status: 'active', version: 1, consumers: [], expiresAt: '2027-01-01T00:00:00.000Z' }
    assert.equal(summarizeSecret(noConsumer), 'api-key')
  })

  test('summarizeSecret handles single consumer', () => {
    const singleConsumer: ConfigurationSecretMetadata = { name: 'db-password', status: 'active', version: 2, consumers: ['order-service'], expiresAt: '2027-06-01T00:00:00.000Z' }
    assert.equal(summarizeSecret(singleConsumer), 'db-password · 消费者 order-service')
  })

  test('summarizeCertificate handles no issuer', () => {
    const noIssuer: ConfigurationCertificateMetadata = { name: 'self-signed', status: 'active', expiresAt: '2027-12-31T00:00:00.000Z', autoRenew: false, issuer: '' }
    assert.equal(summarizeCertificate(noIssuer), 'self-signed')
  })

  test('summarizeCertificate handles rotation-due status', () => {
    const rotationSecret: ConfigurationSecretMetadata = { name: 'expiring-key', status: 'rotation-due', version: 3, consumers: ['svc-a'], expiresAt: '2026-07-01T00:00:00.000Z' }
    assert.equal(summarizeSecret(rotationSecret), 'expiring-key · 消费者 svc-a')
  })

  test('status label/variant maps cover common keys', () => {
    assert.equal(SECRET_STATUS_LABEL['rotation-due'], '待轮换')
    assert.equal(SECRET_STATUS_VARIANT['expired'], 'danger')
    assert.equal(CERTIFICATE_STATUS_LABEL['expiring-soon'], '即将到期')
    assert.equal(CERTIFICATE_STATUS_VARIANT['active'], 'success')
  })

  test('SECRET_STATUS_LABEL covers all known statuses', () => {
    assert.equal(SECRET_STATUS_LABEL['active'], '正常')
    assert.equal(SECRET_STATUS_LABEL['rotation-due'], '待轮换')
    assert.equal(SECRET_STATUS_LABEL['expired'], '已过期')
  })

  test('SECRET_STATUS_VARIANT covers all variants', () => {
    assert.equal(SECRET_STATUS_VARIANT['active'], 'success')
    assert.equal(SECRET_STATUS_VARIANT['rotation-due'], 'warning')
    assert.equal(SECRET_STATUS_VARIANT['expired'], 'danger')
  })

  test('CERTIFICATE_STATUS_LABEL covers all statuses', () => {
    assert.equal(CERTIFICATE_STATUS_LABEL['active'], '有效')
    assert.equal(CERTIFICATE_STATUS_LABEL['expiring-soon'], '即将到期')
    assert.equal(CERTIFICATE_STATUS_LABEL['expired'], '已过期')
  })

  test('CERTIFICATE_STATUS_VARIANT covers all variants', () => {
    assert.equal(CERTIFICATE_STATUS_VARIANT['active'], 'success')
    assert.equal(CERTIFICATE_STATUS_VARIANT['expiring-soon'], 'warning')
    assert.equal(CERTIFICATE_STATUS_VARIANT['expired'], 'danger')
  })

  test('loadConfigurationGovernanceSnapshot returns fallback when fetch fails', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch
    try {
      const snapshot = await loadConfigurationGovernanceSnapshot({ tenantId: 't1' })
      assert.equal(snapshot.deliveryMode, 'fallback')
      assert.equal(snapshot.overview.configuration.entries.total, 0)
      assert.equal(snapshot.overview.posture.secrets.total, 0)
      assert.deepEqual(snapshot.managementMetadata, [])
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  test('loadConfigurationGovernanceSnapshot returns API delivery when SDK returns overview', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
      const headers = init?.headers as Record<string, string> | undefined
      assert.equal(headers?.['x-actor-id'], 'admin-configuration-governance')
      assert.equal(headers?.['x-actor-roles'], 'TENANT_ADMIN,OPERATIONS')
      assert.equal(headers?.['x-actor-permissions'], 'foundation.governance.read')
      if (url.includes('/management-metadata')) {
        return new Response(JSON.stringify({ code: 'OK', message: '', data: SAMPLE_MANAGEMENT_METADATA }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      }
      return new Response(JSON.stringify({ code: 'OK', message: '', data: SAMPLE_OVERVIEW }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch
    try {
      const snapshot = await loadConfigurationGovernanceSnapshot({ tenantId: 'tenant-demo' })
      assert.equal(snapshot.deliveryMode, 'api')
      assert.equal(snapshot.overview.configuration.featureFlags.total, 1)
      assert.equal(snapshot.overview.configuration.featureFlags.items[0]?.key, 'checkout.experimental')
      assert.equal(snapshot.overview.posture.secrets.sharedConsumers, 1)
      assert.equal(snapshot.managementMetadata[0]?.operation, 'secret.rotate')
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  test('loadConfigurationGovernanceSnapshot returns multiple management metadata items', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
      if (url.includes('/management-metadata')) {
        return new Response(JSON.stringify({ code: 'OK', message: '', data: SAMPLE_MANAGEMENT_METADATA }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      }
      return new Response(JSON.stringify({ code: 'OK', message: '', data: SAMPLE_OVERVIEW }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch
    try {
      const snapshot = await loadConfigurationGovernanceSnapshot({ tenantId: 'tenant-demo' })
      assert.equal(snapshot.managementMetadata.length, 2)
      assert.equal(snapshot.managementMetadata[1]?.operation, 'feature-flag.toggle')
      assert.equal(snapshot.managementMetadata[1]?.approval.required, false)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  test('loadConfigurationGovernanceSnapshot fallback when management-metadata fails', async () => {
    const originalFetch = globalThis.fetch
    let managementMetadataFailed = false
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
      if (url.includes('/management-metadata')) {
        managementMetadataFailed = true
        throw new Error('management metadata endpoint down')
      }
      return new Response(JSON.stringify({ code: 'OK', message: '', data: SAMPLE_OVERVIEW }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch
    try {
      const snapshot = await loadConfigurationGovernanceSnapshot({ tenantId: 'tenant-demo' })
      assert.equal(snapshot.deliveryMode, 'api')
      assert.equal(snapshot.managementMetadata.length, 0)
      assert(managementMetadataFailed)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  test('loadConfigurationGovernanceSnapshot includes scope chain in overview', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async () => {
      return new Response(JSON.stringify({ code: 'OK', message: '', data: SAMPLE_OVERVIEW }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch
    try {
      const snapshot = await loadConfigurationGovernanceSnapshot({ tenantId: 'tenant-demo' })
      assert.equal(snapshot.overview.scopeChain.length, 1)
      assert.equal(snapshot.overview.scopeChain[0]?.scopeType, 'PLATFORM')
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  test('loadConfigurationGovernanceSnapshot with brandId/storeId query', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async () => {
      return new Response(JSON.stringify({ code: 'OK', message: '', data: SAMPLE_OVERVIEW }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch
    try {
      const snapshot = await loadConfigurationGovernanceSnapshot({ tenantId: 'tenant-demo', brandId: 'brand-demo', storeId: 'store-001' })
      assert.equal(snapshot.deliveryMode, 'api')
      assert.equal(snapshot.query.brandId, 'brand-demo')
      assert.equal(snapshot.query.storeId, 'store-001')
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  test('summarizeConfigEntry handles boolean value', () => {
    const boolEntry = { id: 'cfg-bool', key: 'flag.enabled', value: false, scopeType: 'PLATFORM', updatedAt: '2026-06-14T08:00:00.000Z' } as ConfigurationConfigEntry
    assert.equal(summarizeConfigEntry(boolEntry), 'false')
  })

  test('loadConfigurationGovernanceSnapshot fallback has empty posture', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async () => { throw new Error('fetch error') }) as typeof fetch
    try {
      const snapshot = await loadConfigurationGovernanceSnapshot({ tenantId: 't1' })
      assert.equal(snapshot.deliveryMode, 'fallback')
      assert.equal(snapshot.overview.posture.secrets.total, 0)
      assert.equal(snapshot.overview.posture.certificates.total, 0)
      assert.equal(snapshot.overview.posture.attention.secrets.length, 0)
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
