import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'

// ESM import of the service under test
import { ConfigurationGovernanceService } from './configuration-governance.service'
import type { FoundationGovernanceBaseline } from '@m5/types'

// light mock for service tests — we test the in-memory config + feature flags logic

type GovernanceApprovalSnapshot = {
  approvalId: string
  ticket: string
  operation: string
  resourceType: string
  resourceKey: string
  requestedBy?: string | null
  status: string
  version?: number | null
  submitted?: boolean
  persisted?: boolean
  decidedBy?: string | null
  decidedAt?: string | null
  updatedAt?: string | null
  requestPayload?: unknown
  summary?: Record<string, unknown>
  execution?: {
    attempts: number
    executed: boolean
    executionStatus: string | null
    executedAt: string | null
    executedBy: string | null
    lastFailure: string | null
  }
}

function createTrustGovernanceMock() {
  const auditRecords: unknown[] = []
  return {
    auditRecords,
    getAuditRecords: async () => auditRecords,
    summarizeAuditRecords: async () => ({ total: auditRecords.length, byAction: {} }),
    recordAudit: async () => {
      auditRecords.push({ recordedAt: new Date().toISOString() })
    }
  }
}

function createConfigurationPrismaMock() {
  const configEntries: Array<{
    id: string
    namespace: string
    key: string
    valueType: string
    scopeType: string
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
    revisions: Array<{
      version: number
      changedBy: string
      changeReason?: string | null
      snapshot: unknown
      createdAt: Date
    }>
    updatedAt: Date
    createdAt: Date
  }> = []

  const featureFlags: Array<{
    id: string
    key: string
    name: string
    scopeType: string
    tenantId: string | null
    brandId: string | null
    storeId: string | null
    marketProfileId: string | null
    status: string
    strategy: string
    enabled: boolean
    percentage: number | null
    allowList: string[]
    conditions: unknown
    startsAt: Date | null
    endsAt: Date | null
    metadata: unknown
    updatedAt: Date
    createdAt: Date
  }> = []

  const secretAssets: Array<{
    id: string
    key: string
    kind: string
    provider: string
    scopeType: string
    tenantId: string | null
    brandId: string | null
    storeId: string | null
    integrationAppId: string | null
    version: number
    reference: string
    encryptedPayload: string | null
    metadata: unknown
    expiresAt: Date | null
    rotatedAt: Date
    status: string
  }> = []

  const governanceApprovals: GovernanceApprovalSnapshot[] = []

  return {
    configEntries,
    featureFlags,
    secretAssets,
    governanceApprovals,
    configEntry: {
      findMany: async (query?: { where?: { namespace?: string; key?: string; OR?: unknown[] }; include?: unknown; orderBy?: unknown[] }) => {
        const entries = query?.where?.OR
          ? configEntries.filter((entry) =>
              (query.where!.OR as Array<Record<string, unknown>>).some((clause) => {
                if (clause.scopeType === 'PLATFORM') return true
                if (clause.tenantId) return entry.tenantId === clause.tenantId
                if (clause.brandId) return entry.brandId === clause.brandId
                if (clause.storeId) return entry.storeId === clause.storeId
                return false
              })
            )
          : configEntries

        return entries
          .filter((entry) => !query?.where?.namespace || entry.namespace === query.where.namespace)
          .filter((entry) => !query?.where?.key || entry.key === query.where.key)
      },
      findFirst: async (query: { where: Record<string, unknown> }) =>
        configEntries.find((entry) =>
          Object.entries(query.where).every(([key, value]) => {
            if (value === null) return (entry as Record<string, unknown>)[key] === null
            return (entry as Record<string, unknown>)[key] === value
          })
        ) ?? null,
      findUnique: async (query: { where: { id: string }; include?: unknown }) =>
        configEntries.find((entry) => entry.id === query.where.id) ?? null,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const entry = {
          id: `cfg-${configEntries.length + 1}`,
          namespace: data.namespace as string,
          key: data.key as string,
          valueType: data.valueType as string,
          scopeType: data.scopeType as string,
          tenantId: (data.tenantId as string) ?? null,
          brandId: (data.brandId as string) ?? null,
          storeId: (data.storeId as string) ?? null,
          marketProfileId: (data.marketProfileId as string) ?? null,
          portalSiteId: (data.portalSiteId as string) ?? null,
          version: data.version as number,
          value: data.value,
          schemaRef: (data.schemaRef as string) ?? null,
          tags: (data.tags as string[]) ?? [],
          status: (data.status as string) ?? 'ACTIVE',
          createdBy: (data.createdBy as string) ?? null,
          revisions: (data.revisions as { create: StoredRevision })
            ? [{
                ...((data.revisions as { create: StoredRevision }).create),
                createdAt: new Date()
              }]
            : [],
          updatedAt: new Date(),
          createdAt: new Date()
        }
        configEntries.push(entry)
        return entry
      },
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const idx = configEntries.findIndex((entry) => entry.id === where.id)
        if (idx === -1) throw new Error(`Config entry not found: ${where.id}`)
        const existing = configEntries[idx]
        configEntries[idx] = {
          ...existing,
          version: data.version as number,
          value: data.value,
          schemaRef: (data.schemaRef as string) ?? existing.schemaRef,
          tags: (data.tags as string[]) ?? existing.tags,
          status: (data.status as string) ?? existing.status,
          createdBy: (data.createdBy as string) ?? existing.createdBy,
          revisions: [
            ...existing.revisions,
            {
              version: data.version as number,
              changedBy: ((data.revisions as { create?: { changedBy: string; changeReason?: string; snapshot: unknown } }).create ?? { changedBy: 'foundation-console', changeReason: undefined, snapshot: undefined })
                .changedBy ?? 'foundation-console',
              changeReason: ((data.revisions as { create?: { changedBy: string; changeReason?: string; snapshot: unknown } }).create ?? { changedBy: '', changeReason: null, snapshot: undefined })
                .changeReason ?? null,
              snapshot: ((data.revisions as { create?: { changedBy: string; changeReason?: string; snapshot: unknown } }).create ?? { changedBy: '', changeReason: null, snapshot: undefined })
                .snapshot,
              createdAt: new Date()
            }
          ],
          updatedAt: new Date()
        }
        return configEntries[idx]
      }
    },
    featureFlag: {
      findMany: async (query?: { where?: { key?: string }; orderBy?: unknown[]; select?: unknown; distinct?: string[] }) => {
        if (query?.where?.key) {
          return featureFlags.filter((flag) => flag.key === query.where!.key)
        }
        return featureFlags
      },
      findFirst: async (query: { where: Record<string, unknown> }) =>
        featureFlags.find((flag) =>
          Object.entries(query.where).every(([key, value]) => {
            if (value === null) return (flag as Record<string, unknown>)[key] === null
            return (flag as Record<string, unknown>)[key] === value
          })
        ) ?? null,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const flag = {
          id: `ff-${featureFlags.length + 1}`,
          key: data.key as string,
          name: data.name as string,
          scopeType: data.scopeType as string,
          tenantId: (data.tenantId as string) ?? null,
          brandId: (data.brandId as string) ?? null,
          storeId: (data.storeId as string) ?? null,
          marketProfileId: (data.marketProfileId as string) ?? null,
          status: data.status as string,
          strategy: data.strategy as string,
          enabled: data.enabled as boolean,
          percentage: (data.percentage as number) ?? null,
          allowList: (data.allowList as string[]) ?? [],
          conditions: data.conditions ?? null,
          startsAt: (data.startsAt as Date) ?? null,
          endsAt: (data.endsAt as Date) ?? null,
          metadata: data.metadata,
          updatedAt: new Date(),
          createdAt: new Date()
        }
        featureFlags.push(flag)
        return flag
      },
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const idx = featureFlags.findIndex((flag) => flag.id === where.id)
        if (idx === -1) throw new Error(`Feature flag not found: ${where.id}`)
        featureFlags[idx] = {
          ...featureFlags[idx],
          name: data.name as string,
          status: data.status as string,
          strategy: data.strategy as string,
          enabled: data.enabled as boolean,
          percentage: (data.percentage as number) ?? featureFlags[idx].percentage,
          allowList: (data.allowList as string[]) ?? featureFlags[idx].allowList,
          conditions: data.conditions ?? featureFlags[idx].conditions,
          startsAt: (data.startsAt as Date) ?? featureFlags[idx].startsAt,
          endsAt: (data.endsAt as Date) ?? featureFlags[idx].endsAt,
          metadata: data.metadata,
          updatedAt: new Date()
        }
        return featureFlags[idx]
      }
    },
    secretAsset: {
      findMany: async (query?: { where?: { key?: string }; orderBy?: unknown[] }) => {
        if (query?.where?.key) {
          return secretAssets.filter((asset) => asset.key === query!.where!.key)
        }
        return secretAssets
      },
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const asset = {
          id: `sec-${secretAssets.length + 1}`,
          key: data.key as string,
          kind: data.kind as string,
          provider: data.provider as string,
          scopeType: data.scopeType as string,
          tenantId: (data.tenantId as string) ?? null,
          brandId: (data.brandId as string) ?? null,
          storeId: (data.storeId as string) ?? null,
          integrationAppId: (data.integrationAppId as string) ?? null,
          version: data.version as number,
          reference: data.reference as string,
          encryptedPayload: (data.encryptedPayload as string) ?? null,
          metadata: data.metadata,
          expiresAt: (data.expiresAt as Date) ?? null,
          rotatedAt: (data.rotatedAt as Date) ?? new Date(),
          status: (data.status as string) ?? 'ACTIVE'
        }
        secretAssets.push(asset)
        return asset
      }
    },
    governanceApproval: {
      findMany: async () => governanceApprovals,
      findFirst: async (query: { where: { ticket: string } }) =>
        governanceApprovals.find((ap) => ap.ticket === query.where.ticket) ?? null
    },
    $transaction: async (operations: Array<Record<string, unknown>>) => {
      for (const op of operations) {
        if (op.create) {
          governanceApprovals.push(op.create as GovernanceApprovalSnapshot)
        } else if (op.update) {
          const updateObj = op.update as { where: { id: string }; data: Record<string, unknown> }
          const idx = governanceApprovals.findIndex((ap) => ap.approvalId === updateObj.where.id)
          if (idx >= 0) {
            governanceApprovals[idx] = { ...governanceApprovals[idx], ...updateObj.data } as GovernanceApprovalSnapshot
          }
        }
      }
      return operations
    }
  }
}

interface StoredRevision {
  version: number
  changedBy: string
  changeReason?: string | null
  snapshot: unknown
  createdAt: Date
}

// ---------------------------------------------------------------------------
// Helper — build a service instance with mocked dependencies
// ---------------------------------------------------------------------------

function createService() {
  const prisma = createConfigurationPrismaMock() as never
  const trust = createTrustGovernanceMock() as never
  return new ConfigurationGovernanceService(prisma, trust)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

it('resolveConfigSnapshot returns a snapshot for default tenant context', async () => {
  const service = createService()
  const snapshot = await service.resolveConfigSnapshot({
    tenantId: 'tenant-demo',
    brandId: 'brand-default',
    storeId: 'store-default'
  })

  assert.ok(snapshot, 'snapshot should exist')
  assert.ok(
    typeof snapshot.snapshotId === 'string',
    `snapshotId should be a string but got ${typeof snapshot.snapshotId}`
  )
  assert.ok(Array.isArray(snapshot.scopeChain), 'scopeChain should be an array')
  assert.ok(snapshot.config, 'config should exist')
  assert.ok(Array.isArray(snapshot.featureFlags), 'featureFlags should be an array')
  assert.ok(snapshot.featureFlags.length > 0, 'featureFlags should not be empty')
  assert.ok(typeof snapshot.checksum === 'string', 'checksum should be a string')
})

it('getFeatureFlags returns in-memory flags for empty persisted data', async () => {
  const service = createService()
  const flags = await service.getFeatureFlags({
    tenantId: 'tenant-demo',
    brandId: 'brand-default',
    storeId: 'store-default'
  })

  assert.ok(Array.isArray(flags), 'flags should be an array')
  assert.ok(flags.length >= 3, 'expected at least 3 in-memory flags')
  flags.forEach((flag: Record<string, unknown>) => {
    assert.ok(typeof flag.key === 'string', `flag.key should be string, got ${typeof flag.key}`)
    assert.ok(typeof flag.enabled === 'boolean', `flag.enabled should be boolean, got ${typeof flag.enabled}`)
    assert.ok(typeof flag.source === 'string', `flag.source should be string, got ${typeof flag.source}`)
  })
})

it('getFeatureFlags evaluates premium tenant to enabled for new-checkout', async () => {
  const service = createService()
  const flags = await service.getFeatureFlags({
    tenantId: 'tenant-premium',
    brandId: 'brand-default',
    storeId: 'store-default'
  })

  const checkoutFlag = flags.find((flag: Record<string, unknown>) => flag.key === 'new-checkout')
  assert.ok(checkoutFlag, 'new-checkout flag should exist')
  assert.equal(checkoutFlag.enabled, true, 'new-checkout should be enabled for tenant-premium')
  assert.equal(checkoutFlag.source, 'in-memory')
})

it('getFeatureFlags evaluates unknown tenant to default flag values', async () => {
  const service = createService()
  const flags = await service.getFeatureFlags({
    tenantId: 'tenant-unknown',
    brandId: 'brand-default',
    storeId: 'store-default'
  })

  const checkoutFlag = flags.find((flag: Record<string, unknown>) => flag.key === 'new-checkout')
  assert.ok(checkoutFlag, 'new-checkout flag should exist')
  assert.equal(checkoutFlag.enabled, false, 'new-checkout should be disabled for unknown tenant (default)')

  const aiFlag = flags.find((flag: Record<string, unknown>) => flag.key === 'ai-order-review')
  assert.ok(aiFlag, 'ai-order-review flag should exist')
  assert.equal(aiFlag.enabled, true, 'ai-order-review should default to enabled')
})

it('getManagementMetadata returns governance metadata entries', () => {
  const service = createService()
  const metadata = service.getManagementMetadata()

  assert.ok(Array.isArray(metadata), 'metadata should be an array')
  assert.ok(metadata.length >= 3, 'expected at least 3 management metadata entries')

  const operations = metadata.map((m: Record<string, unknown>) => m.operation)
  assert.ok(operations.includes('config-entry.write'), 'should include config-entry.write')
  assert.ok(operations.includes('feature-flag.write'), 'should include feature-flag.write')
  assert.ok(operations.includes('secret.register'), 'should include secret.register')

  metadata.forEach((entry: Record<string, unknown>) => {
    assert.ok(typeof entry.operation === 'string')
    assert.ok(entry.rbac, 'should have rbac')
    assert.ok(entry.approval, 'should have approval')
  })
})

it('saveConfigEntry creates a new entry with governance metadata', async () => {
  const service = createService()
  const result = await service.saveConfigEntry({
    namespace: 'checkout',
    key: 'guest-checkout',
    valueType: 'BOOLEAN',
    scopeType: 'TENANT',
    tenantId: 'tenant-demo',
    value: true,
    tags: ['ecommerce', 'checkout'],
    changedBy: 'ops-admin',
    changeReason: 'Enable guest checkout for testing'
  })

  assert.equal(result.status, 'created', 'should have status "created"')
  assert.ok(result.entry, 'should return entry')
  assert.equal(result.entry.namespace, 'checkout')
  assert.equal(result.entry.key, 'guest-checkout')
  assert.equal(result.entry.version, 1)
  assert.equal(result.entry.status, 'ACTIVE')
  assert.deepStrictEqual(result.entry.value, true)
  assert.ok(result.governance, 'should include governance metadata')
  assert.equal(result.governance.operation, 'config-entry.write')
})

it('saveConfigEntry updates existing entry and increments version', async () => {
  const service = createService()

  // first create
  await service.saveConfigEntry({
    namespace: 'checkout',
    key: 'guest-checkout',
    valueType: 'BOOLEAN',
    scopeType: 'TENANT',
    tenantId: 'tenant-demo',
    value: true,
    changedBy: 'ops-admin',
    changeReason: 'Initial creation'
  })

  // then update
  const result = await service.saveConfigEntry({
    namespace: 'checkout',
    key: 'guest-checkout',
    valueType: 'BOOLEAN',
    scopeType: 'TENANT',
    tenantId: 'tenant-demo',
    value: false,
    changedBy: 'ops-admin',
    changeReason: 'Disable guest checkout'
  })

  assert.equal(result.status, 'updated', 'should have status "updated"')
  assert.equal(result.entry.version, 2, 'version should increment to 2')
  assert.deepStrictEqual(result.entry.value, false, 'value should be updated to false')
})

it('saveFeatureFlag creates a new flag', async () => {
  const service = createService()
  const result = await service.saveFeatureFlag({
    key: 'experimental-ui',
    name: 'Experimental UI',
    scopeType: 'PLATFORM',
    status: 'ACTIVE',
    strategy: 'ALL',
    enabled: false,
    percentage: 10,
    description: 'Enable experimental UI features',
    note: 'For internal testing only'
  })

  assert.equal(result.status, 'created', 'should have status "created"')
  assert.ok(result.record, 'should return record')
  assert.equal(result.record.key, 'experimental-ui')
  assert.equal(result.record.enabled, false)
  assert.ok(result.record, `record should exist: ${JSON.stringify(result.record)}`)
  assert.ok(result.governance, 'should include governance metadata')
})

it('getSecretMetadata returns combined persisted and in-memory secrets', async () => {
  const service = createService()
  const secrets = await service.getSecretMetadata()

  assert.ok(Array.isArray(secrets), 'secrets should be an array')
  assert.ok(secrets.length >= 2, 'expected at least 2 in-memory secrets')

  const lytSecret = secrets.find((secret: Record<string, unknown>) => secret.name === 'lyt-webhook-signing-secret')
  assert.ok(lytSecret, 'lyt-webhook-signing-secret should exist')
  assert.equal(lytSecret.currentVersion, 2)

  const paySecret = secrets.find((secret: Record<string, unknown>) => secret.name === 'payment-provider-api-key')
  assert.ok(paySecret, 'payment-provider-api-key should exist')
  assert.equal(paySecret.status, 'rotation-due')
})

it('getSecretMetadata throws NotFoundException for unknown secret', async () => {
  const service = createService()

  await assert.rejects(
    () => service.getSecretMetadata('non-existent-secret'),
    (err: Error) => err.name === 'NotFoundException'
  )
})

it('getCertificateMetadata returns certificate records', async () => {
  const service = createService()
  const certificates = await service.getCertificateMetadata()

  assert.ok(Array.isArray(certificates), 'certificates should be an array')
  assert.ok(certificates.length >= 2, 'expected at least 2 certificates')

  const lytCert = certificates.find((cert: Record<string, unknown>) => cert.name === 'lyt-callback-cert')
  assert.ok(lytCert, 'lyt-callback-cert should exist')
  assert.equal(lytCert.autoRenew, true)
})

it('getCertificateDetail returns a specific certificate', async () => {
  const service = createService()
  const cert = await service.getCertificateDetail('payment-gateway-client-cert', {})

  assert.ok(cert, 'certificate should exist')
  assert.equal(cert.name, 'payment-gateway-client-cert')
  assert.equal(cert.format, 'PFX')
  assert.equal(cert.autoRenew, false)
})

it('getCertificateDetail throws NotFoundException for unknown certificate', async () => {
  const service = createService()

  await assert.rejects(
    () => service.getCertificateDetail('non-existent-cert', {}),
    (err: Error) => err.name === 'NotFoundException'
  )
})

it('getSecretsCertificatePosture returns posture snapshot', async () => {
  const service = createService()
  const posture = await service.getSecretsCertificatePosture()

  assert.ok(posture, 'posture should exist')
  assert.ok(typeof posture.generatedAt === 'string', 'should have generatedAt')
  assert.ok(posture.secrets, 'should have secrets')
  assert.ok(posture.certificates, 'should have certificates')
  assert.ok(posture.attention, 'should have attention')
  assert.ok(Array.isArray(posture.attention.secrets), 'attention.secrets should be an array')
  assert.ok(Array.isArray(posture.attention.certificates), 'attention.certificates should be an array')
})

it('getGovernanceBaselines returns baseline entries', () => {
  const service = createService()
  const baselines = service.getGovernanceBaselines()

  assert.ok(Array.isArray(baselines), 'baselines should be an array')
  assert.ok(baselines.length >= 2, 'expected at least 2 baselines')

  baselines.forEach((baseline: FoundationGovernanceBaseline) => {
    assert.ok(typeof baseline.key === 'string')
    assert.ok(typeof baseline.name === 'string')
    assert.ok(typeof baseline.summary === 'string')
    assert.ok(Array.isArray(baseline.controls))
    assert.ok(Array.isArray(baseline.evidence))
    assert.equal(baseline.ownerModule, 'configuration-governance')
  })
})

it('getDescriptor returns module descriptor', () => {
  const service = createService()
  const descriptor = service.getDescriptor()

  assert.equal(descriptor.key, 'configuration-governance')
  assert.equal(descriptor.name, 'Configuration Governance Module')
  assert.ok(descriptor.capabilities, 'should have capabilities')
  assert.ok(descriptor.capabilities.length >= 3, 'expected at least 3 capabilities')
})

it('getOperationsOverview returns combined overview', async () => {
  const service = createService()
  const overview = await service.getOperationsOverview() as { generatedAt: string; configuration: { entries: unknown; featureFlags: unknown; secrets: unknown; certificates: unknown }; posture: unknown }

  assert.ok(overview, 'overview should exist')
  assert.ok(typeof overview.generatedAt === 'string', 'should have generatedAt')
  assert.ok(overview.configuration, 'should have configuration')
  assert.ok(overview.configuration.entries, 'should have entries')
  assert.ok(overview.configuration.featureFlags, 'should have featureFlags')
  assert.ok(overview.configuration.secrets, 'should have secrets')
  assert.ok(overview.configuration.certificates, 'should have certificates')
  assert.ok(overview.posture, 'should have posture')
})
