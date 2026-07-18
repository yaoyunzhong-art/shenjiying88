import 'reflect-metadata'
import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'vitest'
import { DomainResolutionService } from './domain-resolution.service'
import type { PrismaService } from '../../prisma/prisma.service'
import type { DomainMapping } from './custom-domain.entity'

function createMapping(overrides: Partial<DomainMapping> = {}): DomainMapping {
  return {
    id: 'dom-001',
    scopeType: 'TENANT',
    tenantId: 'tenant-demo',
    domain: 'tenant-demo.example.com',
    verificationToken: 'token-001',
    verificationHost: '_verify.tenant-demo.example.com',
    status: 'active',
    verificationFailCount: 0,
    createdAt: '2026-07-18T00:00:00.000Z',
    updatedAt: '2026-07-18T00:00:00.000Z',
    createdBy: 'user-001',
    ...overrides,
  }
}

const originalNodeEnv = process.env.NODE_ENV

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv
})

describe('DomainResolutionService', () => {
  it('resolveHost 归一化处理大小写、端口和 x-forwarded-host 列表', () => {
    const service = new DomainResolutionService()
    service.upsertFromMapping(createMapping({ domain: 'tenant-demo.example.com' }))

    const resolved = service.resolveHost('Tenant-Demo.Example.com:443, proxy.internal')
    assert.deepEqual(resolved, {
      tenantId: 'tenant-demo',
      brandId: undefined,
      storeId: undefined,
    })
  })

  it('upsertFromMapping 为主域名建立 primaryDomain 索引', () => {
    const service = new DomainResolutionService()
    service.upsertFromMapping(
      createMapping({
        scopeType: 'BRAND',
        brandId: 'brand-demo',
        domain: 'brand-demo.example.com',
        isPrimary: true,
      }),
    )

    assert.equal(
      service.findPrimaryDomain({
        scopeType: 'BRAND',
        tenantId: 'tenant-demo',
        brandId: 'brand-demo',
      }),
      'brand-demo.example.com',
    )
  })

  it('非主域名不会覆盖 primaryDomain 索引', () => {
    const service = new DomainResolutionService()
    service.upsertFromMapping(
      createMapping({
        scopeType: 'STORE',
        brandId: 'brand-demo',
        storeId: 'store-001',
        domain: 'store-primary.example.com',
        isPrimary: true,
      }),
    )
    service.upsertFromMapping(
      createMapping({
        id: 'dom-002',
        scopeType: 'STORE',
        brandId: 'brand-demo',
        storeId: 'store-001',
        domain: 'store-secondary.example.com',
        isPrimary: false,
      }),
    )

    assert.equal(
      service.findPrimaryDomain({
        scopeType: 'STORE',
        tenantId: 'tenant-demo',
        brandId: 'brand-demo',
        storeId: 'store-001',
      }),
      'store-primary.example.com',
    )
  })

  it('inactive 映射会清理 host 与 primaryDomain 索引', () => {
    const service = new DomainResolutionService()
    service.upsertFromMapping(createMapping({ domain: 'tenant-primary.example.com', isPrimary: true }))
    service.upsertFromMapping(
      createMapping({
        domain: 'tenant-primary.example.com',
        isPrimary: true,
        status: 'disabled',
      }),
    )

    assert.equal(service.resolveHost('tenant-primary.example.com'), null)
    assert.equal(
      service.findPrimaryDomain({
        scopeType: 'TENANT',
        tenantId: 'tenant-demo',
      }),
      null,
    )
  })

  it('removeHost 按归一化 host 删除 primaryDomain 索引', () => {
    const service = new DomainResolutionService()
    service.upsertFromMapping(
      createMapping({
        scopeType: 'TENANT',
        domain: 'tenant-remove.example.com',
        isPrimary: true,
      }),
    )

    service.removeHost('Tenant-Remove.Example.com:443')

    assert.equal(service.countHosts(), 0)
    assert.equal(
      service.findPrimaryDomain({
        scopeType: 'TENANT',
        tenantId: 'tenant-demo',
      }),
      null,
    )
  })

  it('onModuleInit 从持久层加载 active 域名和主域名索引', async () => {
    process.env.NODE_ENV = 'development'
    const prisma = {
      customDomain: {
        findMany: async () => [
          {
            domain: 'Loaded-Tenant.Example.com',
            scopeType: 'TENANT',
            tenantId: 'tenant-loaded',
            brandId: null,
            storeId: null,
            isPrimary: true,
          },
          {
            domain: 'loaded-brand.example.com',
            scopeType: 'BRAND',
            tenantId: 'tenant-loaded',
            brandId: 'brand-loaded',
            storeId: null,
            isPrimary: false,
          },
        ],
      },
    } as unknown as PrismaService

    const service = new DomainResolutionService(prisma)
    await service.onModuleInit()

    assert.deepEqual(service.resolveHost('loaded-tenant.example.com'), {
      tenantId: 'tenant-loaded',
      brandId: undefined,
      storeId: undefined,
    })
    assert.deepEqual(service.resolveHost('loaded-brand.example.com'), {
      tenantId: 'tenant-loaded',
      brandId: 'brand-loaded',
      storeId: undefined,
    })
    assert.equal(
      service.findPrimaryDomain({
        scopeType: 'TENANT',
        tenantId: 'tenant-loaded',
      }),
      'loaded-tenant.example.com',
    )
  })
})
