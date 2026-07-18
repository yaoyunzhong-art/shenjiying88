import 'reflect-metadata'
import assert from 'node:assert/strict'
import { afterAll, beforeAll, describe, it } from 'vitest'
import { ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { runWithTenant } from '../../common/context/tenant-context'
import { CustomDomainController } from './custom-domain.controller'
import { CustomDomainService } from './custom-domain.service'
import { buildVerificationValue } from './custom-domain.entity'

describe('CustomDomain HTTP E2E', () => {
  let app: any
  let customDomainService: CustomDomainService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CustomDomainController],
      providers: [CustomDomainService],
    }).compile()

    customDomainService = moduleRef.get(CustomDomainService)
    app = moduleRef.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    app.useGlobalInterceptors(new ResponseInterceptor())
    app.use((req: any, _res: any, next: any) => {
      runWithTenant(
        {
          tenantId: req.header('x-tenant-id') ?? 'tenant-http',
          brandId: req.header('x-brand-id') as string | undefined,
          storeId: req.header('x-store-id') as string | undefined,
          userId: req.header('x-user-id') ?? 'user-http',
          role: (req.header('x-role') as any) ?? 'tenant_admin',
        },
        () => next(),
      )
    })
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('POST /saas/domain 创建域名', async () => {
    const res = await request(app.getHttpServer())
      .post('/saas/domain')
      .set('x-tenant-id', 'tenant-http-create')
      .send({ domain: 'http-create.example.io' })
      .expect(201)

    assert.equal(res.body.success, true)
    assert.equal(res.body.data.domain, 'http-create.example.io')
    assert.equal(res.body.data.status, 'pending_verification')
  })

  it('POST /saas/domain 对空域名返回 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/saas/domain')
      .set('x-tenant-id', 'tenant-http-invalid')
      .send({ domain: '' })
      .expect(400)

    assert.ok(Array.isArray(res.body.message))
    assert.ok(res.body.message.some((message: string) => message.includes('domain')))
  })

  it('GET /saas/domain 返回当前租户可见域名', async () => {
    await request(app.getHttpServer())
      .post('/saas/domain')
      .set('x-tenant-id', 'tenant-http-list')
      .send({ domain: 'http-list.example.io' })
      .expect(201)

    const res = await request(app.getHttpServer())
      .get('/saas/domain')
      .set('x-tenant-id', 'tenant-http-list')
      .expect(200)

    assert.equal(res.body.success, true)
    assert.ok(Array.isArray(res.body.data.items))
    assert.ok(res.body.data.items.some((item: { domain: string }) => item.domain === 'http-list.example.io'))
    assert.equal(res.body.data.page, 1)
    assert.equal(res.body.data.pageSize, 10)
    assert.equal(res.body.data.sortBy, 'createdAt')
    assert.equal(res.body.data.sortOrder, 'desc')
  })

  it('GET /saas/domain 支持 status + keyword + sort + pageSize 查询管理面', async () => {
    const headers = {
      'x-tenant-id': 'tenant-http-query',
      'x-brand-id': 'brand-http-query',
      'x-role': 'brand_admin',
    }

    const active = await request(app.getHttpServer())
      .post('/saas/domain')
      .set(headers)
      .send({ domain: 'brand-query-active.example.io' })
      .expect(201)

    await request(app.getHttpServer())
      .post('/saas/domain')
      .set(headers)
      .send({ domain: 'brand-query-pending.example.io' })
      .expect(201)

    customDomainService.setDnsTxtOverride(active.body.data.verificationHost, [
      buildVerificationValue(active.body.data.verificationToken),
    ])

    await request(app.getHttpServer())
      .post(`/saas/domain/${active.body.data.id}/verify`)
      .set(headers)
      .expect(200)

    const res = await request(app.getHttpServer())
      .get('/saas/domain')
      .set(headers)
      .query({
        status: 'active',
        scopeType: 'BRAND',
        keyword: 'query-active',
        sortBy: 'domain',
        sortOrder: 'asc',
        page: 1,
        pageSize: 1,
      })
      .expect(200)

    assert.equal(res.body.data.total >= 1, true)
    assert.equal(res.body.data.items.length, 1)
    assert.equal(res.body.data.items[0].status, 'active')
    assert.equal(res.body.data.page, 1)
    assert.equal(res.body.data.pageSize, 1)
    assert.equal(res.body.data.totalPages >= 1, true)
    assert.equal(typeof res.body.data.hasNextPage, 'boolean')
    assert.equal(res.body.data.hasPreviousPage, false)
    assert.equal(res.body.data.sortBy, 'domain')
    assert.equal(res.body.data.sortOrder, 'asc')
  })

  it('GET /saas/domain 第二页返回 hasPreviousPage=true', async () => {
    const headers = {
      'x-tenant-id': 'tenant-http-sort',
    }

    await request(app.getHttpServer())
      .post('/saas/domain')
      .set(headers)
      .send({ domain: 'sort-zulu.example.io' })
      .expect(201)

    await request(app.getHttpServer())
      .post('/saas/domain')
      .set(headers)
      .send({ domain: 'sort-alpha.example.io' })
      .expect(201)

    const res = await request(app.getHttpServer())
      .get('/saas/domain')
      .set(headers)
      .query({ keyword: 'sort-', sortBy: 'domain', sortOrder: 'asc', page: 2, pageSize: 1 })
      .expect(200)

    assert.equal(res.body.data.page, 2)
    assert.equal(res.body.data.pageSize, 1)
    assert.equal(res.body.data.hasPreviousPage, true)
    assert.equal(res.body.data.totalPages >= 2, true)
  })

  it('GET /saas/domain/resolve/host 通过 query 解析 host', async () => {
    const create = await request(app.getHttpServer())
      .post('/saas/domain')
      .set('x-tenant-id', 'tenant-http-resolve')
      .send({ domain: 'resolve-http.example.io' })
      .expect(201)

    customDomainService.setDnsTxtOverride(create.body.data.verificationHost, [
      buildVerificationValue(create.body.data.verificationToken),
    ])

    await request(app.getHttpServer())
      .post(`/saas/domain/${create.body.data.id}/verify`)
      .set('x-tenant-id', 'tenant-http-resolve')
      .expect(200)

    const res = await request(app.getHttpServer())
      .get('/saas/domain/resolve/host')
      .query({ host: 'resolve-http.example.io' })
      .expect(200)

    assert.equal(res.body.data.host, 'resolve-http.example.io')
    assert.equal(res.body.data.tenantId, 'tenant-http-resolve')
    assert.equal(res.body.data.resolved, true)
  })

  it('POST /saas/domain/:id/primary 切换主域名并回写 isPrimary', async () => {
    const headers = {
      'x-tenant-id': 'tenant-http-primary',
    }

    const first = await request(app.getHttpServer())
      .post('/saas/domain')
      .set(headers)
      .send({ domain: 'primary-first.example.io' })
      .expect(201)
    const second = await request(app.getHttpServer())
      .post('/saas/domain')
      .set(headers)
      .send({ domain: 'primary-second.example.io' })
      .expect(201)

    customDomainService.setDnsTxtOverride(first.body.data.verificationHost, [
      buildVerificationValue(first.body.data.verificationToken),
    ])
    customDomainService.setDnsTxtOverride(second.body.data.verificationHost, [
      buildVerificationValue(second.body.data.verificationToken),
    ])

    await request(app.getHttpServer())
      .post(`/saas/domain/${first.body.data.id}/verify`)
      .set(headers)
      .expect(200)
    await request(app.getHttpServer())
      .post(`/saas/domain/${second.body.data.id}/verify`)
      .set(headers)
      .expect(200)

    const switched = await request(app.getHttpServer())
      .post(`/saas/domain/${second.body.data.id}/primary`)
      .set(headers)
      .expect(200)
    const list = await request(app.getHttpServer())
      .get('/saas/domain')
      .set(headers)
      .query({ keyword: 'primary-', sortBy: 'domain', sortOrder: 'asc', page: 1, pageSize: 10 })
      .expect(200)

    assert.equal(switched.body.data.isPrimary, true)
    assert.equal(list.body.data.items.filter((item: { isPrimary?: boolean }) => item.isPrimary).length, 1)
    assert.equal(
      list.body.data.items.find((item: { domain: string }) => item.domain === 'primary-second.example.io')
        ?.isPrimary,
      true,
    )
  })

  it('DELETE 当前 primary 后 Host 解析回退为 unresolved', async () => {
    const headers = {
      'x-tenant-id': 'tenant-http-remove-primary',
    }

    const created = await request(app.getHttpServer())
      .post('/saas/domain')
      .set(headers)
      .send({ domain: 'remove-primary.example.io' })
      .expect(201)

    customDomainService.setDnsTxtOverride(created.body.data.verificationHost, [
      buildVerificationValue(created.body.data.verificationToken),
    ])

    await request(app.getHttpServer())
      .post(`/saas/domain/${created.body.data.id}/verify`)
      .set(headers)
      .expect(200)
    await request(app.getHttpServer())
      .post(`/saas/domain/${created.body.data.id}/primary`)
      .set(headers)
      .expect(200)
    await request(app.getHttpServer())
      .delete(`/saas/domain/${created.body.data.id}`)
      .set(headers)
      .expect(204)

    const resolved = await request(app.getHttpServer())
      .get('/saas/domain/resolve/host')
      .query({ host: 'remove-primary.example.io' })
      .expect(200)
    const list = await request(app.getHttpServer())
      .get('/saas/domain')
      .set(headers)
      .query({ keyword: 'remove-primary', page: 1, pageSize: 10 })
      .expect(200)

    assert.equal(resolved.body.data.resolved, false)
    assert.equal(resolved.body.data.tenantId, null)
    assert.equal(list.body.data.items.length, 0)
  })

  it('GET /saas/domain/primary/current 返回当前主域名，删除后重选可读到新主域名', async () => {
    const headers = {
      'x-tenant-id': 'tenant-http-current',
    }

    const first = await request(app.getHttpServer())
      .post('/saas/domain')
      .set(headers)
      .send({ domain: 'current-first.example.io' })
      .expect(201)
    const second = await request(app.getHttpServer())
      .post('/saas/domain')
      .set(headers)
      .send({ domain: 'current-second.example.io' })
      .expect(201)

    customDomainService.setDnsTxtOverride(first.body.data.verificationHost, [
      buildVerificationValue(first.body.data.verificationToken),
    ])
    customDomainService.setDnsTxtOverride(second.body.data.verificationHost, [
      buildVerificationValue(second.body.data.verificationToken),
    ])

    await request(app.getHttpServer()).post(`/saas/domain/${first.body.data.id}/verify`).set(headers).expect(200)
    await request(app.getHttpServer()).post(`/saas/domain/${second.body.data.id}/verify`).set(headers).expect(200)
    await request(app.getHttpServer()).post(`/saas/domain/${first.body.data.id}/primary`).set(headers).expect(200)

    const current = await request(app.getHttpServer())
      .get('/saas/domain/primary/current')
      .set(headers)
      .expect(200)

    await request(app.getHttpServer())
      .delete(`/saas/domain/${first.body.data.id}`)
      .set(headers)
      .expect(204)

    const afterRemove = await request(app.getHttpServer())
      .get('/saas/domain/primary/current')
      .set(headers)
      .expect(200)

    await request(app.getHttpServer())
      .post(`/saas/domain/${second.body.data.id}/primary`)
      .set(headers)
      .expect(200)

    const afterReselect = await request(app.getHttpServer())
      .get('/saas/domain/primary/current')
      .set(headers)
      .expect(200)

    assert.equal(current.body.data.resolved, true)
    assert.equal(current.body.data.item.domain, 'current-first.example.io')
    assert.equal(afterRemove.body.data.resolved, false)
    assert.equal(afterRemove.body.data.item, null)
    assert.equal(afterReselect.body.data.resolved, true)
    assert.equal(afterReselect.body.data.item.domain, 'current-second.example.io')
  })

  it('POST /saas/domain/primary/batch/current 支持批量查询 tenant/brand/store 主域名', async () => {
    const tenantHeaders = {
      'x-tenant-id': 'tenant-http-batch',
      'x-user-id': 'tenant-batch-admin',
      'x-role': 'tenant_admin',
    }
    const brandHeaders = {
      'x-tenant-id': 'tenant-http-batch',
      'x-brand-id': 'brand-http-batch',
      'x-user-id': 'brand-batch-admin',
      'x-role': 'brand_admin',
    }
    const storeHeaders = {
      'x-tenant-id': 'tenant-http-batch',
      'x-brand-id': 'brand-http-batch',
      'x-store-id': 'store-http-batch',
      'x-user-id': 'store-batch-admin',
      'x-role': 'store_admin',
    }

    const tenantDomain = await request(app.getHttpServer())
      .post('/saas/domain')
      .set(tenantHeaders)
      .send({ domain: 'batch-http-tenant.example.io' })
      .expect(201)
    const brandDomain = await request(app.getHttpServer())
      .post('/saas/domain')
      .set(brandHeaders)
      .send({ domain: 'batch-http-brand.example.io' })
      .expect(201)
    const storeDomain = await request(app.getHttpServer())
      .post('/saas/domain')
      .set(storeHeaders)
      .send({ domain: 'batch-http-store.example.io' })
      .expect(201)

    customDomainService.setDnsTxtOverride(tenantDomain.body.data.verificationHost, [
      buildVerificationValue(tenantDomain.body.data.verificationToken),
    ])
    customDomainService.setDnsTxtOverride(brandDomain.body.data.verificationHost, [
      buildVerificationValue(brandDomain.body.data.verificationToken),
    ])
    customDomainService.setDnsTxtOverride(storeDomain.body.data.verificationHost, [
      buildVerificationValue(storeDomain.body.data.verificationToken),
    ])

    await request(app.getHttpServer())
      .post(`/saas/domain/${tenantDomain.body.data.id}/verify`)
      .set(tenantHeaders)
      .expect(200)
    await request(app.getHttpServer())
      .post(`/saas/domain/${brandDomain.body.data.id}/verify`)
      .set(brandHeaders)
      .expect(200)
    await request(app.getHttpServer())
      .post(`/saas/domain/${storeDomain.body.data.id}/verify`)
      .set(storeHeaders)
      .expect(200)
    await request(app.getHttpServer())
      .post(`/saas/domain/${tenantDomain.body.data.id}/primary`)
      .set(tenantHeaders)
      .expect(200)
    await request(app.getHttpServer())
      .post(`/saas/domain/${brandDomain.body.data.id}/primary`)
      .set(brandHeaders)
      .expect(200)
    await request(app.getHttpServer())
      .post(`/saas/domain/${storeDomain.body.data.id}/primary`)
      .set(storeHeaders)
      .expect(200)

    const batch = await request(app.getHttpServer())
      .post('/saas/domain/primary/batch/current')
      .set(tenantHeaders)
      .send({
        items: [
          { scopeType: 'TENANT' },
          { scopeType: 'BRAND', brandId: 'brand-http-batch' },
          { scopeType: 'STORE', brandId: 'brand-http-batch', storeId: 'store-http-batch' },
        ],
      })
      .expect(200)

    assert.equal(batch.body.data.items.length, 3)
    assert.equal(batch.body.data.items[0].item.domain, 'batch-http-tenant.example.io')
    assert.equal(batch.body.data.items[1].item.domain, 'batch-http-brand.example.io')
    assert.equal(batch.body.data.items[2].item.domain, 'batch-http-store.example.io')
  })

  it('GET /saas/domain/governance/active-without-primary 返回治理视图', async () => {
    const headers = {
      'x-tenant-id': 'tenant-http-governance',
      'x-brand-id': 'brand-http-governance',
      'x-user-id': 'brand-http-governance-admin',
      'x-role': 'brand_admin',
    }

    const first = await request(app.getHttpServer())
      .post('/saas/domain')
      .set(headers)
      .send({ domain: 'governance-http-a.example.io' })
      .expect(201)
    const second = await request(app.getHttpServer())
      .post('/saas/domain')
      .set(headers)
      .send({ domain: 'governance-http-b.example.io' })
      .expect(201)

    customDomainService.setDnsTxtOverride(first.body.data.verificationHost, [
      buildVerificationValue(first.body.data.verificationToken),
    ])
    customDomainService.setDnsTxtOverride(second.body.data.verificationHost, [
      buildVerificationValue(second.body.data.verificationToken),
    ])

    await request(app.getHttpServer())
      .post(`/saas/domain/${first.body.data.id}/verify`)
      .set(headers)
      .expect(200)
    await request(app.getHttpServer())
      .post(`/saas/domain/${second.body.data.id}/verify`)
      .set(headers)
      .expect(200)

    const governance = await request(app.getHttpServer())
      .get('/saas/domain/governance/active-without-primary')
      .set(headers)
      .expect(200)
    const currentBrandScope = (governance.body.data.items as Array<{
      scopeType: string
      brandId?: string
      activeCount: number
    }>).find((item) => item.scopeType === 'BRAND' && item.brandId === 'brand-http-governance')

    assert.equal(governance.body.data.total >= 1, true)
    assert.ok(currentBrandScope)
    assert.equal(currentBrandScope?.activeCount >= 2, true)
  })

  it('brand_admin 请求 STORE scope 批量主域名返回 403', async () => {
    const res = await request(app.getHttpServer())
      .post('/saas/domain/primary/batch/current')
      .set({
        'x-tenant-id': 'tenant-http-forbidden',
        'x-brand-id': 'brand-http-forbidden',
        'x-user-id': 'brand-http-forbidden-admin',
        'x-role': 'brand_admin',
      })
      .send({
        items: [
          { scopeType: 'STORE', brandId: 'brand-http-forbidden', storeId: 'store-http-forbidden' },
        ],
      })
      .expect(403)

    assert.ok(String(res.body.message).includes('brand_admin'))
  })
})
