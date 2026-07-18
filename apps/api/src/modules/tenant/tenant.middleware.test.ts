import { it } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { TenantMiddleware } from './tenant.middleware'

function makeReq(headers: Record<string, string> = {}): Record<string, any> {
  const headerMap = new Map(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]))
  return {
    header(name: string) {
      return headerMap.get(name.toLowerCase()) ?? undefined
    },
    params: {} as Record<string, string>,
    originalUrl: '/api/test',
    url: '/api/test',
    method: 'GET',
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' }
  } as Record<string, any>
}

it('TenantMiddleware use() sets default tenantContext', () => {
  const middleware = new TenantMiddleware()
  const req = makeReq()
  let nextCalled = false
  const res = {} as any

  middleware.use(req, res, () => {
    nextCalled = true
  })

  assert.equal(nextCalled, true)
  assert.ok(req.tenantContext)
  assert.equal(req.tenantContext.tenantId, 'tenant-demo')
  assert.equal(req.tenantContext.marketCode, 'us-default')
  assert.equal(req.tenantContext.brandId, undefined)
  assert.equal(req.tenantContext.storeId, undefined)
})

it('TenantMiddleware use() reads tenantContext from headers', () => {
  const middleware = new TenantMiddleware()
  const req = makeReq({
    'x-tenant-id': 'tenant-custom',
    'x-brand-id': 'brand-custom',
    'x-store-id': 'store-custom',
    'x-market-code': 'zh-cn'
  })
  const res = {} as any

  middleware.use(req, res, () => {})

  assert.equal(req.tenantContext.tenantId, 'tenant-custom')
  assert.equal(req.tenantContext.brandId, 'brand-custom')
  assert.equal(req.tenantContext.storeId, 'store-custom')
  assert.equal(req.tenantContext.marketCode, 'zh-cn')
})

it('TenantMiddleware use() resolves tenantContext from host before headers', () => {
  const middleware = new TenantMiddleware({
    resolveHost(host: string) {
      if (host === 'brand.example.com') {
        return {
          tenantId: 'tenant-host',
          brandId: 'brand-host',
          storeId: 'store-host',
        }
      }
      return null
    },
  } as any)
  const req = makeReq({
    host: 'brand.example.com',
    'x-tenant-id': 'tenant-header',
    'x-brand-id': 'brand-header',
    'x-store-id': 'store-header',
  })
  const res = {} as any

  middleware.use(req, res, () => {})

  assert.equal(req.tenantContext.tenantId, 'tenant-host')
  assert.equal(req.tenantContext.brandId, 'brand-host')
  assert.equal(req.tenantContext.storeId, 'store-host')
})

it('TenantMiddleware use() reads x-forwarded-host before host', () => {
  const middleware = new TenantMiddleware({
    resolveHost(host: string) {
      if (host === 'forwarded.example.com') {
        return {
          tenantId: 'tenant-forwarded',
          brandId: 'brand-forwarded',
        }
      }
      return null
    },
  } as any)
  const req = makeReq({
    host: 'ignored.example.com',
    'x-forwarded-host': 'forwarded.example.com',
  })
  const res = {} as any

  middleware.use(req, res, () => {})

  assert.equal(req.tenantContext.tenantId, 'tenant-forwarded')
  assert.equal(req.tenantContext.brandId, 'brand-forwarded')
})

it('TenantMiddleware use() trims whitespace from header values', () => {
  const middleware = new TenantMiddleware()
  const req = makeReq({
    'x-tenant-id': '  tenant-trimmed  ',
    'x-market-code': '  jp  '
  })
  const res = {} as any

  middleware.use(req, res, () => {})

  assert.equal(req.tenantContext.tenantId, 'tenant-trimmed')
  assert.equal(req.tenantContext.marketCode, 'jp')
})

it('TenantMiddleware use() sets governanceContext with requestId', () => {
  const middleware = new TenantMiddleware()
  const req = makeReq({
    'x-request-id': 'custom-request-id-123'
  })
  const res = {} as any

  middleware.use(req, res, () => {})

  assert.ok(req.governanceContext)
  assert.equal(req.governanceContext.requestId, 'custom-request-id-123')
  assert.equal(typeof req.governanceContext.startedAt, 'number')
  assert.ok(req.governanceContext.startedAt > 0)
})

it('TenantMiddleware use() generates randomUUID for governanceContext when x-request-id missing', () => {
  const middleware = new TenantMiddleware()
  const req = makeReq({})
  const res = {} as any

  middleware.use(req, res, () => {})

  assert.ok(req.governanceContext)
  assert.ok(req.governanceContext.requestId)
  assert.ok(req.governanceContext.requestId.length > 30)
})

it('TenantMiddleware use() builds actorContext from x-actor header (JSON)', () => {
  const middleware = new TenantMiddleware()
  const actor = {
    actorId: 'json-actor-1',
    actorType: 'brand-user',
    actorName: 'JSON User',
    tenantId: 'json-tenant',
    brandId: 'json-brand',
    storeId: 'json-store'
  }
  const req = makeReq({ 'x-actor': JSON.stringify(actor) })
  const res = {} as any

  middleware.use(req, res, () => {})

  assert.ok(req.actorContext)
  assert.equal(req.actorContext?.actorId, 'json-actor-1')
  assert.equal(req.actorContext?.actorType, 'brand-user')
  assert.equal(req.actorContext?.actorName, 'JSON User')
  assert.equal(req.actorContext?.tenantId, 'json-tenant')
  assert.equal(req.actorContext?.brandId, 'json-brand')
  assert.equal(req.actorContext?.storeId, 'json-store')
  assert.equal(req.actorContext?.authenticated, true)
  assert.equal(req.actorContext?.source, 'headers')
})

it('TenantMiddleware use() builds actorContext from x-actor header (plain id)', () => {
  const middleware = new TenantMiddleware()
  const req = makeReq({ 'x-actor': 'plain-actor-id' })
  const res = {} as any

  middleware.use(req, res, () => {})

  assert.ok(req.actorContext)
  assert.equal(req.actorContext?.actorId, 'plain-actor-id')
  assert.equal(req.actorContext?.actorType, 'tenant-user')
  assert.equal(req.actorContext?.authenticated, true)
})

it('TenantMiddleware use() builds actorContext from x-actor-id and individual headers', () => {
  const middleware = new TenantMiddleware()
  const req = makeReq({
    'x-actor-id': 'actor-direct',
    'x-actor-type': 'employee-user',
    'x-actor-name': 'Direct User',
    'x-actor-tenant-id': 'direct-tenant',
    'x-roles': 'admin,editor',
    'x-permissions': 'tenant:read,tenant:write'
  })
  const res = {} as any

  middleware.use(req, res, () => {})

  assert.ok(req.actorContext)
  assert.equal(req.actorContext?.actorId, 'actor-direct')
  assert.equal(req.actorContext?.actorType, 'employee-user')
  assert.equal(req.actorContext?.actorName, 'Direct User')
  assert.equal(req.actorContext?.tenantId, 'direct-tenant')
  assert.deepStrictEqual(req.actorContext?.roles, ['admin', 'editor'])
  assert.deepStrictEqual(req.actorContext?.permissions, ['tenant:read', 'tenant:write'])
  assert.equal(req.actorContext?.authenticated, true)
})

it('TenantMiddleware use() deduplicates roles and permissions', () => {
  const middleware = new TenantMiddleware()
  const req = makeReq({
    'x-actor-id': 'actor-dedup',
    'x-roles': 'admin,admin,super-admin',
    'x-permissions': 'read,read,write'
  })
  const res = {} as any

  middleware.use(req, res, () => {})

  assert.deepStrictEqual(req.actorContext?.roles, ['admin', 'super-admin'])
  assert.deepStrictEqual(req.actorContext?.permissions, ['read', 'write'])
})

it('TenantMiddleware use() returns undefined actorContext when no identity headers', () => {
  const middleware = new TenantMiddleware()
  const req = makeReq({
    'x-tenant-id': 'tenant-no-actor'
    // no actor headers
  })
  const res = {} as any

  middleware.use(req, res, () => {})

  assert.equal(req.actorContext, undefined)
})

it('TenantMiddleware use() uses x-actor as fallback id when x-actor-id is missing', () => {
  const middleware = new TenantMiddleware()
  const req = makeReq({
    'x-actor': 'fallback-actor',
    'x-roles': 'viewer'
  })
  const res = {} as any

  middleware.use(req, res, () => {})

  assert.ok(req.actorContext)
  assert.equal(req.actorContext?.actorId, 'fallback-actor')
  assert.deepStrictEqual(req.actorContext?.roles, ['viewer'])
})

it('TenantMiddleware use() prefers x-actor-id over JSON x-actor actorId', () => {
  const middleware = new TenantMiddleware()
  const actor = { actorId: 'json-id', actorType: 'service-account' }
  const req = makeReq({
    'x-actor': JSON.stringify(actor),
    'x-actor-id': 'header-id-priority',
    'x-roles': 'bot'
  })
  const res = {} as any

  middleware.use(req, res, () => {})

  assert.ok(req.actorContext)
  // x-actor-id from dedicated header takes priority over JSON actorId
  assert.equal(req.actorContext?.actorId, 'header-id-priority')
  // actorType falls back to JSON payload
  assert.equal(req.actorContext?.actorType, 'service-account')
})

it('TenantMiddleware use() handles whitespace-only header values as undefined', () => {
  const middleware = new TenantMiddleware()
  const req = makeReq({
    'x-tenant-id': '   ',
    'x-brand-id': '  ',
    'x-market-code': '  '
  })
  const res = {} as any

  middleware.use(req, res, () => {})

  assert.equal(req.tenantContext.tenantId, 'tenant-demo')
  assert.equal(req.tenantContext.brandId, undefined)
  assert.equal(req.tenantContext.marketCode, 'us-default')
})

it('TenantMiddleware use() uses x-actor id field as fallback', () => {
  const middleware = new TenantMiddleware()
  const actor = { id: 'id-field', type: 'platform-user', name: 'Platform Actor' }
  const req = makeReq({
    'x-actor': JSON.stringify(actor),
    'x-actor-tenant-id': 'plat-tenant'
  })
  const res = {} as any

  middleware.use(req, res, () => {})

  assert.ok(req.actorContext)
  assert.equal(req.actorContext?.actorId, 'id-field')
  assert.equal(req.actorContext?.actorType, 'platform-user')  
  assert.equal(req.actorContext?.actorName, 'Platform Actor')
  assert.equal(req.actorContext?.tenantId, 'plat-tenant')
})

it('TenantMiddleware use() handles empty string x-actor', () => {
  const middleware = new TenantMiddleware()
  const req = makeReq({
    'x-actor': ''
  })
  const res = {} as any

  middleware.use(req, res, () => {})

  // empty x-actor returns {} from parseActorHeader, so no actorId
  assert.equal(req.actorContext, undefined)
})

it('TenantMiddleware use() supports x-role and x-permission as singular aliases', () => {
  const middleware = new TenantMiddleware()
  const req = makeReq({
    'x-actor-id': 'sing-alias',
    'x-role': 'admin',
    'x-permission': 'tenant:*'
  })
  const res = {} as any

  middleware.use(req, res, () => {})

  assert.deepStrictEqual(req.actorContext?.roles, ['admin'])
  assert.deepStrictEqual(req.actorContext?.permissions, ['tenant:*'])
})
