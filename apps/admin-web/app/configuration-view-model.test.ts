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

  test('featureFlagStatusLabel flips with enabled', () => {
    const enabled = featureFlagStatusLabel({ key: 'a', enabled: true } as ConfigurationFeatureFlag)
    const disabled = featureFlagStatusLabel({ key: 'a', enabled: false } as ConfigurationFeatureFlag)
    assert.equal(enabled, '启用')
    assert.equal(disabled, '关闭')
  })

  test('summarize helpers cover primitive/string/object cases', () => {
    const objEntry = {
      id: 'cfg-2',
      key: 'foo.bar',
      value: { nested: true },
      scopeType: 'PLATFORM',
      updatedAt: '2026-06-14T07:00:00.000Z'
    } as ConfigurationConfigEntry
    const nullEntry = {
      id: 'cfg-3',
      key: 'foo.null',
      value: null,
      scopeType: 'PLATFORM',
      updatedAt: '2026-06-14T07:00:00.000Z'
    } as ConfigurationConfigEntry
    assert.equal(summarizeConfigEntry(objEntry), JSON.stringify({ nested: true }))
    assert.equal(summarizeConfigEntry(nullEntry), '—')
    assert.equal(summarizeSecret({ name: 's', consumers: ['a', 'b'] } as ConfigurationSecretMetadata), 's · 消费者 a, b')
    assert.equal(summarizeCertificate({ name: 'c', issuer: 'm5-internal', status: 'active', expiresAt: 'x' } as ConfigurationCertificateMetadata), 'c · m5-internal')
  })

  test('status label/variant maps cover common keys', () => {
    assert.equal(SECRET_STATUS_LABEL['rotation-due'], '待轮换')
    assert.equal(SECRET_STATUS_VARIANT['expired'], 'danger')
    assert.equal(CERTIFICATE_STATUS_LABEL['expiring-soon'], '即将到期')
    assert.equal(CERTIFICATE_STATUS_VARIANT['active'], 'success')
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
      assert.equal(snapshot.deliveryMode, 'api')
      assert.equal(snapshot.overview.configuration.featureFlags.total, 1)
      assert.equal(snapshot.overview.configuration.featureFlags.items[0]?.key, 'checkout.experimental')
      assert.equal(snapshot.overview.posture.secrets.sharedConsumers, 1)
      assert.equal(snapshot.managementMetadata[0]?.operation, 'secret.rotate')
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
