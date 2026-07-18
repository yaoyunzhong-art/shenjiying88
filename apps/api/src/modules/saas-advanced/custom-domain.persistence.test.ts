import 'reflect-metadata'
import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'vitest'
import type { PrismaService } from '../../prisma/prisma.service'
import { runWithTenant } from '../../common/context/tenant-context'
import { CustomDomainService } from './custom-domain.service'
import { DomainResolutionService } from './domain-resolution.service'

type Row = {
  id: string
  scopeType: 'TENANT' | 'BRAND' | 'STORE'
  tenantId: string
  brandId: string | null
  storeId: string | null
  portalSiteId: string | null
  isPrimary: boolean
  domain: string
  verificationToken: string
  verificationHost: string
  status: string
  certificateProvider: string | null
  certificateNotAfter: Date | null
  certificateFingerprint: string | null
  lastVerifiedAt: Date | null
  verificationFailCount: number
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

const TENANT_CTX = {
  tenantId: 'tenant-persist',
  brandId: 'brand-persist',
  userId: 'user-persist',
  role: 'brand_admin' as const,
}

const STORE_CTX = {
  tenantId: 'tenant-persist',
  brandId: 'brand-persist',
  storeId: 'store-persist',
  userId: 'user-persist',
  role: 'store_admin' as const,
}
const TENANT_ROOT_CTX = {
  tenantId: 'tenant-persist',
  userId: 'tenant-root-user',
  role: 'tenant_admin' as const,
}

const originalNodeEnv = process.env.NODE_ENV

function createRow(overrides: Partial<Row> = {}): Row {
  return {
    id: 'dom-001',
    scopeType: 'BRAND',
    tenantId: 'tenant-persist',
    brandId: 'brand-persist',
    storeId: null,
    portalSiteId: null,
    isPrimary: false,
    domain: 'brand-persist.example.io',
    verificationToken: 'token-001',
    verificationHost: '_shenjiying-verify.brand-persist.example.io',
    status: 'ACTIVE',
    certificateProvider: null,
    certificateNotAfter: null,
    certificateFingerprint: null,
    lastVerifiedAt: null,
    verificationFailCount: 0,
    createdAt: new Date('2026-07-18T00:00:00.000Z'),
    updatedAt: new Date('2026-07-18T00:00:00.000Z'),
    createdBy: 'user-persist',
    ...overrides,
  }
}

function createPrisma(rows: Row[]): PrismaService {
  const customDomain = {
    findUnique: async ({ where }: { where: { domain: string } }) =>
      rows.find((row) => row.domain === where.domain) ?? null,
    create: async ({ data }: { data: Partial<Row> }) => {
      const row = createRow({
        id: `dom-${rows.length + 1}`,
        domain: data.domain!,
        scopeType: data.scopeType as Row['scopeType'],
        tenantId: data.tenantId!,
        brandId: data.brandId ?? null,
        storeId: data.storeId ?? null,
        verificationHost: data.verificationHost!,
        verificationToken: data.verificationToken!,
        status: 'PENDING_VERIFICATION',
        createdBy: data.createdBy!,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      rows.push(row)
      return row
    },
    findMany: async ({
      where,
      orderBy,
    }: {
      where?: {
        tenantId?: string
        scopeType?: Row['scopeType']
        brandId?: string | null
        storeId?: string | null
        status?: { in: string[] }
      }
      orderBy?: { createdAt: 'desc' | 'asc' }
    }) => {
      const filtered = rows.filter((row) => {
        if (where?.tenantId && row.tenantId !== where.tenantId) return false
        if (where?.scopeType && row.scopeType !== where.scopeType) return false
        if (where && 'brandId' in where && row.brandId !== (where.brandId ?? null)) return false
        if (where && 'storeId' in where && row.storeId !== (where.storeId ?? null)) return false
        if (where?.status && !where.status.in.includes(row.status)) return false
        return true
      })
      return filtered.sort((a, b) =>
        orderBy?.createdAt === 'asc'
          ? a.createdAt.getTime() - b.createdAt.getTime()
          : b.createdAt.getTime() - a.createdAt.getTime(),
      )
    },
    findFirst: async ({ where }: { where: { id: string; tenantId: string } }) =>
      rows.find((row) => row.id === where.id && row.tenantId === where.tenantId) ?? null,
    delete: async ({ where }: { where: { id: string } }) => {
      const index = rows.findIndex((row) => row.id === where.id)
      const [deleted] = rows.splice(index, 1)
      return deleted
    },
    update: async ({
      where,
      data,
    }: {
      where: { id: string }
      data: Partial<Row> & { status?: string; isPrimary?: boolean }
    }) => {
      const row = rows.find((candidate) => candidate.id === where.id)!
      Object.assign(row, data)
      row.updatedAt = new Date('2026-07-18T01:00:00.000Z')
      return row
    },
    updateMany: async ({
      where,
      data,
    }: {
      where: { tenantId?: string; scopeType?: Row['scopeType']; brandId?: string | null; storeId?: string | null }
      data: { isPrimary: boolean }
    }) => {
      let count = 0
      for (const row of rows) {
        if (where.tenantId && row.tenantId !== where.tenantId) continue
        if (where.scopeType && row.scopeType !== where.scopeType) continue
        if ('brandId' in where && row.brandId !== (where.brandId ?? null)) continue
        if ('storeId' in where && row.storeId !== (where.storeId ?? null)) continue
        row.isPrimary = data.isPrimary
        count += 1
      }
      return { count }
    },
  }

  return {
    customDomain,
  } as unknown as PrismaService
}

describe('CustomDomainService persistence branch', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'development'
  })

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv
  })

  it('listPage 在 persistence 分支返回真实 total 与分页结果', async () => {
    const rows = [
      createRow({ id: 'dom-1', domain: 'brand-beta.example.io', createdAt: new Date('2026-07-18T00:00:00.000Z') }),
      createRow({ id: 'dom-2', domain: 'brand-alpha.example.io', createdAt: new Date('2026-07-18T00:01:00.000Z') }),
    ]
    const service = new CustomDomainService(createPrisma(rows))

    const result = await runWithTenant(TENANT_CTX, () =>
      service.listPage({
        scopeType: 'BRAND',
        sortBy: 'domain',
        sortOrder: 'asc',
        page: 1,
        pageSize: 1,
      }),
    )

    assert.equal(result.items.length, 1)
    assert.equal(result.total, 2)
    assert.equal(result.totalPages, 2)
    assert.equal(result.hasNextPage, true)
    assert.equal(result.items[0].domain, 'brand-alpha.example.io')
  })

  it('setPrimary 在 persistence 分支会更新行并同步 DomainResolution', async () => {
    const rows = [
      createRow({ id: 'dom-1', domain: 'brand-old.example.io', isPrimary: true }),
      createRow({ id: 'dom-2', domain: 'brand-new.example.io', isPrimary: false }),
    ]
    const domainResolution = new DomainResolutionService()
    const service = new CustomDomainService(createPrisma(rows), domainResolution)

    const result = await runWithTenant(TENANT_CTX, () => service.setPrimary('dom-2'))

    assert.equal(result.isPrimary, true)
    assert.equal(rows.find((row) => row.id === 'dom-1')?.isPrimary, false)
    assert.equal(rows.find((row) => row.id === 'dom-2')?.isPrimary, true)
    assert.equal(
      domainResolution.findPrimaryDomain({
        scopeType: 'BRAND',
        tenantId: 'tenant-persist',
        brandId: 'brand-persist',
      }),
      'brand-new.example.io',
    )
  })

  it('remove 当前 primary 后 persistence 分支清空主域名索引', async () => {
    const rows = [
      createRow({ id: 'dom-1', domain: 'brand-remove.example.io', isPrimary: true }),
    ]
    const domainResolution = new DomainResolutionService()
    domainResolution.upsertFromMapping({
      id: 'dom-1',
      scopeType: 'BRAND',
      tenantId: 'tenant-persist',
      brandId: 'brand-persist',
      domain: 'brand-remove.example.io',
      verificationToken: 'token-001',
      verificationHost: '_verify.brand-remove.example.io',
      status: 'active',
      verificationFailCount: 0,
      createdAt: '2026-07-18T00:00:00.000Z',
      updatedAt: '2026-07-18T00:00:00.000Z',
      createdBy: 'user-persist',
      isPrimary: true,
    })
    const service = new CustomDomainService(createPrisma(rows), domainResolution)

    await runWithTenant(TENANT_CTX, () => service.remove('dom-1'))

    assert.equal(rows.length, 0)
    assert.equal(
      domainResolution.findPrimaryDomain({
        scopeType: 'BRAND',
        tenantId: 'tenant-persist',
        brandId: 'brand-persist',
      }),
      null,
    )
  })

  it('getCurrentPrimary 在 persistence 分支返回当前 brand primary，删除后可重选', async () => {
    const rows = [
      createRow({ id: 'dom-1', domain: 'brand-first.example.io', isPrimary: true }),
      createRow({ id: 'dom-2', domain: 'brand-second.example.io', isPrimary: false }),
    ]
    const domainResolution = new DomainResolutionService()
    const service = new CustomDomainService(createPrisma(rows), domainResolution)

    const current = await runWithTenant(TENANT_CTX, () =>
      service.getCurrentPrimary({ scopeType: 'BRAND', brandId: 'brand-persist' }),
    )
    await runWithTenant(TENANT_CTX, () => service.remove('dom-1'))
    const afterRemove = await runWithTenant(TENANT_CTX, () =>
      service.getCurrentPrimary({ scopeType: 'BRAND', brandId: 'brand-persist' }),
    )
    await runWithTenant(TENANT_CTX, () => service.setPrimary('dom-2'))
    const afterReselect = await runWithTenant(TENANT_CTX, () =>
      service.getCurrentPrimary({ scopeType: 'BRAND', brandId: 'brand-persist' }),
    )

    assert.equal(current?.domain, 'brand-first.example.io')
    assert.equal(afterRemove, null)
    assert.equal(afterReselect?.domain, 'brand-second.example.io')
    assert.equal(
      domainResolution.findPrimaryDomain({
        scopeType: 'BRAND',
        tenantId: 'tenant-persist',
        brandId: 'brand-persist',
      }),
      'brand-second.example.io',
    )
  })

  it('getCurrentPrimary 在 persistence 分支支持 store scope 查询与重选', async () => {
    const rows = [
      createRow({
        id: 'dom-1',
        scopeType: 'STORE',
        brandId: 'brand-persist',
        storeId: 'store-persist',
        domain: 'store-first.example.io',
        isPrimary: true,
      }),
      createRow({
        id: 'dom-2',
        scopeType: 'STORE',
        brandId: 'brand-persist',
        storeId: 'store-persist',
        domain: 'store-second.example.io',
        isPrimary: false,
      }),
    ]
    const domainResolution = new DomainResolutionService()
    const service = new CustomDomainService(createPrisma(rows), domainResolution)

    const current = await runWithTenant(STORE_CTX, () =>
      service.getCurrentPrimary({
        scopeType: 'STORE',
        brandId: 'brand-persist',
        storeId: 'store-persist',
      }),
    )
    await runWithTenant(STORE_CTX, () => service.remove('dom-1'))
    await runWithTenant(STORE_CTX, () => service.setPrimary('dom-2'))
    const afterReselect = await runWithTenant(STORE_CTX, () =>
      service.getCurrentPrimary({
        scopeType: 'STORE',
        brandId: 'brand-persist',
        storeId: 'store-persist',
      }),
    )

    assert.equal(current?.domain, 'store-first.example.io')
    assert.equal(afterReselect?.domain, 'store-second.example.io')
    assert.equal(
      domainResolution.findPrimaryDomain({
        scopeType: 'STORE',
        tenantId: 'tenant-persist',
        brandId: 'brand-persist',
        storeId: 'store-persist',
      }),
      'store-second.example.io',
    )
  })

  it('getCurrentPrimaryBatch 在 persistence 分支支持批量治理查询', async () => {
    const rows = [
      createRow({
        id: 'dom-tenant',
        scopeType: 'TENANT',
        brandId: null,
        domain: 'tenant-primary.example.io',
        isPrimary: true,
      }),
      createRow({
        id: 'dom-brand',
        scopeType: 'BRAND',
        brandId: 'brand-persist',
        domain: 'brand-primary.example.io',
        isPrimary: true,
      }),
      createRow({
        id: 'dom-store',
        scopeType: 'STORE',
        brandId: 'brand-persist',
        storeId: 'store-persist',
        domain: 'store-primary.example.io',
        isPrimary: true,
      }),
    ]
    const service = new CustomDomainService(createPrisma(rows))

    const batch = await runWithTenant(TENANT_ROOT_CTX, () =>
      service.getCurrentPrimaryBatch([
        { scopeType: 'TENANT' },
        { scopeType: 'BRAND', brandId: 'brand-persist' },
        { scopeType: 'STORE', brandId: 'brand-persist', storeId: 'store-persist' },
      ]),
    )

    assert.equal(batch.length, 3)
    assert.equal(batch[0].item?.domain, 'tenant-primary.example.io')
    assert.equal(batch[1].item?.domain, 'brand-primary.example.io')
    assert.equal(batch[2].item?.domain, 'store-primary.example.io')
  })

  it('listActiveWithoutPrimary 在 persistence 分支返回缺主域名 scope', async () => {
    const rows = [
      createRow({
        id: 'dom-1',
        scopeType: 'BRAND',
        brandId: 'brand-persist',
        domain: 'brand-governance-a.example.io',
        isPrimary: false,
      }),
      createRow({
        id: 'dom-2',
        scopeType: 'BRAND',
        brandId: 'brand-persist',
        domain: 'brand-governance-b.example.io',
        isPrimary: false,
      }),
    ]
    const service = new CustomDomainService(createPrisma(rows))

    const governance = await runWithTenant(TENANT_CTX, () => service.listActiveWithoutPrimary())

    assert.equal(governance.length, 1)
    assert.equal(governance[0].scopeType, 'BRAND')
    assert.equal(governance[0].activeCount, 2)
  })

  it('brand_admin 在 persistence 分支不可查询 STORE scope', async () => {
    const rows = [
      createRow({
        id: 'dom-1',
        scopeType: 'STORE',
        brandId: 'brand-persist',
        storeId: 'store-persist',
        domain: 'store-forbidden.example.io',
        isPrimary: true,
      }),
    ]
    const service = new CustomDomainService(createPrisma(rows))

    await assert.rejects(
      () =>
        runWithTenant(TENANT_CTX, () =>
          service.getCurrentPrimary({
            scopeType: 'STORE',
            brandId: 'brand-persist',
            storeId: 'store-persist',
          }),
        ),
      /brand_admin can only query BRAND scope domains/,
    )
  })
})
