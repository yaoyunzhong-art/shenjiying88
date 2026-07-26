import assert from 'node:assert/strict'
import test from 'node:test'
import {
  headersToRecord,
  pickForwardedRequestHeaders,
  resolveServerRequestContext,
  summarizeForwardedHeaders,
  summarizeRequestScope,
} from './server-request-context'

test('pickForwardedRequestHeaders 仅透传允许的上下文头', () => {
  const headers = pickForwardedRequestHeaders({
    authorization: 'Bearer token',
    'x-tenant-id': 'tenant-real',
    'x-request-id': 'req-001',
    'x-custom-secret': 'nope',
  })

  assert.equal(headers.authorization, 'Bearer token')
  assert.equal(headers['x-tenant-id'], 'tenant-real')
  assert.equal(headers['x-request-id'], 'req-001')
  assert.equal(headers['x-custom-secret'], undefined)
})

test('resolveServerRequestContext 优先使用透传租户并保留请求级 actor 头', () => {
  const resolved = resolveServerRequestContext({
    requestHeaders: {
      'x-tenant-id': 'tenant-live',
      'x-brand-id': 'brand-live',
      'x-store-id': 'store-live',
      'x-market-code': 'jp-east',
      'x-request-id': 'req-live',
      'x-actor-id': 'actor-live',
      'x-actor-authenticated': 'true',
      'x-actor-roles': 'TENANT_ADMIN',
    },
    fallbackScope: {
      tenantId: 'tenant-demo',
      brandId: 'brand-demo',
      storeId: 'store-demo',
      marketCode: 'cn-mainland',
    },
    actorFallback: {
      actorId: 'fallback-actor',
      actorName: 'Fallback Actor',
      roles: ['TENANT_ADMIN'],
      permissions: ['foundation.governance.read'],
    },
  })

  assert.equal(resolved.scope.tenantId, 'tenant-live')
  assert.equal(resolved.scope.brandId, 'brand-live')
  assert.equal(resolved.scope.storeId, 'store-live')
  assert.equal(resolved.scope.marketCode, 'jp-east')
  assert.equal(resolved.evidence.actorHeadersMode, 'forwarded')
  assert.equal(resolved.headers['x-actor-id'], 'actor-live')
  assert.equal(resolved.headers['x-request-id'], 'req-live')
})

test('resolveServerRequestContext 缺少 actor 头时回退到 workspace actor', () => {
  const resolved = resolveServerRequestContext({
    requestHeaders: {
      authorization: 'Bearer test',
      'x-tenant-id': 'tenant-live',
    },
    fallbackScope: {
      tenantId: 'tenant-demo',
      brandId: 'brand-demo',
      storeId: 'store-demo',
      marketCode: 'cn-mainland',
    },
    actorFallback: {
      actorId: 'workspace-actor',
      actorName: 'Workspace Actor',
      roles: ['TENANT_ADMIN'],
      permissions: ['notification:read'],
    },
  })

  assert.equal(resolved.evidence.actorHeadersMode, 'workspace-fallback')
  assert.equal(resolved.headers.authorization, 'Bearer test')
  assert.equal(resolved.headers['x-tenant-id'], 'tenant-live')
  assert.equal(resolved.headers['x-actor-id'], 'workspace-actor')
  assert.equal(resolved.headers['x-actor-permissions'], 'notification:read')
})

test('headersToRecord 与摘要 helper 保持稳定输出', () => {
  const record = headersToRecord(
    new Headers([
      ['x-brand-id', 'brand-001'],
      ['x-tenant-id', 'tenant-001'],
    ])
  )

  assert.equal(record['x-brand-id'], 'brand-001')
  assert.equal(record['x-tenant-id'], 'tenant-001')
  assert.equal(
    summarizeForwardedHeaders({
      'x-tenant-id': 'tenant-001',
      authorization: 'Bearer token',
    }),
    'authorization, x-tenant-id'
  )
  assert.equal(
    summarizeRequestScope({
      tenantId: 'tenant-001',
      brandId: 'brand-001',
      storeId: 'store-001',
      marketCode: 'cn-mainland',
    }),
    'tenant=tenant-001 · brand=brand-001 · store=store-001 · market=cn-mainland'
  )
})
