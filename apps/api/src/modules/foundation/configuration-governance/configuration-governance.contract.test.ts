import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { ConfigurationGovernanceService } from './configuration-governance.service'

type StoredRevision = {
  version: number
  changedBy: string
  changeReason?: string | null
  snapshot: unknown
  createdAt: Date
}

type StoredConfigEntry = {
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
  revisions: StoredRevision[]
  createdAt: Date
  updatedAt: Date
}

function createConfigurationPrismaMock() {
  const entries: StoredConfigEntry[] = []

  const prisma = {
    configEntry: {
      findFirst: async ({
        where
      }: {
        where: {
          namespace: string
          key: string
          scopeType: string
          tenantId?: string | null
          brandId?: string | null
          storeId?: string | null
          marketProfileId?: string | null
          portalSiteId?: string | null
        }
      }) =>
        entries.find(
          (entry) =>
            entry.namespace === where.namespace &&
            entry.key === where.key &&
            entry.scopeType === where.scopeType &&
            entry.tenantId === (where.tenantId ?? null) &&
            entry.brandId === (where.brandId ?? null) &&
            entry.storeId === (where.storeId ?? null) &&
            entry.marketProfileId === (where.marketProfileId ?? null) &&
            entry.portalSiteId === (where.portalSiteId ?? null)
        ) ?? null,
      create: async ({
        data
      }: {
        data: {
          namespace: string
          key: string
          valueType: string
          scopeType: string
          tenantId?: string | null
          brandId?: string | null
          storeId?: string | null
          marketProfileId?: string | null
          portalSiteId?: string | null
          version: number
          value: unknown
          schemaRef?: string
          tags: string[]
          status: string
          createdBy: string
          revisions: {
            create: {
              version: number
              changedBy: string
              changeReason?: string
              snapshot: unknown
            }
          }
        }
      }) => {
        const now = new Date()
        const entry: StoredConfigEntry = {
          id: `cfg_${entries.length + 1}`,
          namespace: data.namespace,
          key: data.key,
          valueType: data.valueType,
          scopeType: data.scopeType,
          tenantId: data.tenantId ?? null,
          brandId: data.brandId ?? null,
          storeId: data.storeId ?? null,
          marketProfileId: data.marketProfileId ?? null,
          portalSiteId: data.portalSiteId ?? null,
          version: data.version,
          value: data.value,
          schemaRef: data.schemaRef ?? null,
          tags: data.tags,
          status: data.status,
          createdBy: data.createdBy,
          revisions: [
            {
              ...data.revisions.create,
              createdAt: now
            }
          ],
          createdAt: now,
          updatedAt: now
        }
        entries.push(entry)
        return entry
      },
      update: async ({
        where,
        data
      }: {
        where: { id: string }
        data: {
          valueType: string
          version: number
          value: unknown
          schemaRef?: string
          tags: string[]
          status: string
          createdBy: string | null
          revisions: {
            create: {
              version: number
              changedBy: string
              changeReason?: string
              snapshot: unknown
            }
          }
        }
      }) => {
        const entry = entries.find((item) => item.id === where.id)
        if (!entry) {
          throw new Error(`Config entry not found: ${where.id}`)
        }

        const now = new Date()
        entry.valueType = data.valueType
        entry.version = data.version
        entry.value = data.value
        entry.schemaRef = data.schemaRef ?? null
        entry.tags = data.tags
        entry.status = data.status
        entry.createdBy = data.createdBy
        entry.updatedAt = now
        entry.revisions.unshift({
          ...data.revisions.create,
          createdAt: now
        })
        return entry
      },
      findUnique: async ({
        where
      }: {
        where: { id: string }
      }) => {
        const entry = entries.find((item) => item.id === where.id)
        return entry
          ? {
              ...entry,
              revisions: [...entry.revisions]
            }
          : null
      }
    }
  }

  return {
    prisma,
    entries
  }
}

it('contract: config entry persists versioned revisions on update', async () => {
  const { prisma, entries } = createConfigurationPrismaMock()
  const audits: string[] = []
  const service = new ConfigurationGovernanceService(prisma as never, {
    recordAudit: async (eventType: string) => {
      audits.push(eventType)
      return {
        auditId: `audit_${audits.length}`,
        eventType
      }
    }
  } as never)

  const created = await service.saveConfigEntry({
    namespace: 'checkout',
    key: 'paymentChannels',
    valueType: 'JSON',
    scopeType: 'TENANT',
    tenantId: 'tenant-demo',
    value: {
      channels: ['wechat-pay', 'alipay']
    },
    tags: ['checkout', 'payments'],
    changedBy: 'tester-1',
    changeReason: 'seed'
  })

  const updated = await service.saveConfigEntry({
    namespace: 'checkout',
    key: 'paymentChannels',
    valueType: 'JSON',
    scopeType: 'TENANT',
    tenantId: 'tenant-demo',
    value: {
      channels: ['wechat-pay', 'alipay', 'stripe']
    },
    tags: ['checkout', 'payments', 'intl'],
    changedBy: 'tester-2',
    changeReason: 'enable-stripe'
  })

  assert.equal(created.status, 'created')
  assert.equal(updated.status, 'updated')
  assert.equal(entries.length, 1)
  assert.equal(entries[0]?.version, 2)
  assert.deepEqual(entries[0]?.revisions.map((revision) => revision.version), [2, 1])
  assert.equal(updated.entry.version, 2)
  assert.equal(updated.entry.revisions[0]?.changedBy, 'tester-2')
  assert.deepEqual(audits, ['foundation.config-entry.created', 'foundation.config-entry.updated'])
  assert.deepEqual(updated.entry.value, {
    channels: ['wechat-pay', 'alipay', 'stripe']
  })
})
