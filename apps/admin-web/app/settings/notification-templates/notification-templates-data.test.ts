import assert from 'node:assert/strict'
import test from 'node:test'
import { loadNotificationTemplatesSnapshot } from './notification-templates-data'

test('loadNotificationTemplatesSnapshot 透传租户/请求头并保留通知模板合同字段', async () => {
  const originalFetch = globalThis.fetch
  let capturedHeaders: Headers | undefined

  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    capturedHeaders = new Headers(init?.headers)
    return new Response(
      JSON.stringify({
        success: true,
        data: [
          {
            id: 'tpl-live-1',
            code: 'order_confirmed',
            channel: 'sms',
            scopeType: 'STORE',
            tenantId: 'tenant-live',
            brandId: 'brand-live',
            storeId: 'store-live',
            marketCode: 'jp-east',
            locale: 'ja-JP',
            titleTemplate: '注文確認',
            bodyTemplate: '注文 {orderId} を確認しました',
            variables: ['orderId'],
            enabled: true,
            createdAt: '2026-07-27T08:00:00.000Z',
            updatedAt: '2026-07-27T09:30:00.000Z',
          },
        ],
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }
    )
  }) as typeof fetch

  try {
    const snapshot = await loadNotificationTemplatesSnapshot({
      headers: {
        authorization: 'Bearer notification-token',
        'x-tenant-id': 'tenant-live',
        'x-brand-id': 'brand-live',
        'x-store-id': 'store-live',
        'x-market-code': 'jp-east',
        'x-request-id': 'req-notification-live',
      },
    })

    assert.equal(snapshot.deliveryMode, 'api')
    assert.equal(snapshot.generatedAt, '2026-07-27T09:30:00.000Z')
    assert.equal(snapshot.requestContext.tenantId, 'tenant-live')
    assert.equal(snapshot.requestContext.requestId, 'req-notification-live')
    assert.equal(snapshot.requestContext.actorHeadersMode, 'workspace-fallback')
    assert.equal(capturedHeaders?.get('authorization'), 'Bearer notification-token')
    assert.equal(capturedHeaders?.get('x-tenant-id'), 'tenant-live')
    assert.equal(
      capturedHeaders?.get('x-actor-id'),
      'admin-notification-templates-workspace'
    )

    const template = snapshot.templates[0]
    assert.equal(template?.scopeType, 'STORE')
    assert.equal(template?.scopeLabel, '门店')
    assert.equal(template?.locale, 'ja-JP')
    assert.equal(template?.tenantId, 'tenant-live')
    assert.equal(template?.brandId, 'brand-live')
    assert.equal(template?.storeId, 'store-live')
    assert.equal(template?.marketCode, 'jp-east')
    assert.equal(template?.channelCode, 'sms')
    assert.equal(template?.version, null)
    assert.equal(template?.createdAt, '2026-07-27T08:00:00.000Z')
    assert.equal(template?.updatedAt, '2026-07-27T09:30:00.000Z')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('loadNotificationTemplatesSnapshot fallback 保留诊断信息与请求上下文', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = (async () => {
    throw new Error('upstream timeout')
  }) as typeof fetch

  try {
    const snapshot = await loadNotificationTemplatesSnapshot({
      headers: {
        'x-tenant-id': 'tenant-fallback',
        'x-request-id': 'req-fallback',
      },
    })

    assert.equal(snapshot.deliveryMode, 'fallback')
    assert.equal(snapshot.requestContext.tenantId, 'tenant-fallback')
    assert.equal(snapshot.requestContext.requestId, 'req-fallback')
    assert.equal(snapshot.requestContext.actorHeadersMode, 'workspace-fallback')
    assert.ok(snapshot.error?.includes('upstream timeout'))
    assert.ok(snapshot.templates.length > 0)
  } finally {
    globalThis.fetch = originalFetch
  }
})
