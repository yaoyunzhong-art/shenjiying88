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
})
