/**
 * OpenApiClient SDK test (V9 Art 3, V10 Day 5+6)
 */

import assert from 'node:assert/strict'
import { describe, it, before } from 'node:test'
import * as crypto from 'node:crypto'

const Module = require('module')

// ============ Mock fetch ============

const mockFetch = async (url: string, init?: any) => {
  const u = new URL(url)
  const path = u.pathname
  const method = init?.method ?? 'GET'
  const headers = init?.headers ?? {}
  const body = init?.body

  // 1. OAuth token endpoint
  if (path === '/open/auth/token' && method === 'POST') {
    const params = new URLSearchParams(body)
    const clientId = params.get('client_id')
    const clientSecret = params.get('client_secret')

    if (clientId !== 'cli-test' || clientSecret !== 'test-secret') {
      return new Response(JSON.stringify({ error: 'invalid_client' }), { status: 401 })
    }
    return new Response(JSON.stringify({
      access_token: 'at-fake-token',
      token_type: 'Bearer',
      expires_in: 3600,
      scope: ['sync:write', 'command:send'],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  // 2. HMAC 校验
  const sig = headers['X-HMAC-Signature']?.replace(/^sha256=/, '')
  const ts = headers['X-HMAC-Timestamp']
  if (!sig || !ts) return new Response('Missing HMAC', { status: 401 })
  if (Math.abs(Date.now() - parseInt(ts, 10)) > 5 * 60 * 1000) {
    return new Response('Expired', { status: 401 })
  }

  const bodyHash = crypto.createHash('sha256').update(body ?? '').digest('hex')
  const payload = `${method}\n${path}\n${ts}\n${bodyHash}`
  const expected = crypto.createHmac('sha256', 'test-hmac-secret').update(payload).digest('hex')
  if (sig !== expected) return new Response('Bad signature', { status: 401 })

  // 3. Sync endpoint
  if (path === '/open/sync' && method === 'POST') {
    const json = JSON.parse(body)
    return new Response(JSON.stringify({
      businessKey: json.businessKey,
      accepted: true,
      timestamp: new Date().toISOString(),
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  // 4. Command endpoint
  if (path === '/open/command' && method === 'POST') {
    const json = JSON.parse(body)
    return new Response(JSON.stringify({
      id: 'cmd-' + Date.now(),
      status: 'success',
      commandType: json.commandType,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: 42,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  return new Response('Not Found', { status: 404 })
}

const { OpenApiClient, createOpenApiClient } = require('./OpenApiClient')

describe('OpenApiClient SDK V10 Day 5+6', () => {
  let client: any

  before(() => {
    client = new OpenApiClient({
      baseUrl: 'http://test.local',
      clientId: 'cli-test',
      clientSecret: 'test-secret',
      hmacSecret: 'test-hmac-secret',
      fetch: mockFetch as any,
    })
  })

  it('createOpenApiClient factory works', () => {
    const c = createOpenApiClient({
      baseUrl: 'http://test',
      clientId: 'cli-x',
      clientSecret: 'sec',
      hmacSecret: 'hmac',
      fetch: mockFetch as any,
    })
    assert.ok(c instanceof OpenApiClient)
  })

  it('authenticate gets token', async () => {
    const token = await client.authenticate()
    assert.equal(token.accessToken, 'at-fake-token')
    assert.equal(token.tokenType, 'Bearer')
    assert.equal(token.expiresIn, 3600)
  })

  it('wrong credentials throw', async () => {
    const c = new OpenApiClient({
      baseUrl: 'http://test.local',
      clientId: 'cli-test',
      clientSecret: 'wrong',
      hmacSecret: 'test-hmac-secret',
      fetch: mockFetch as any,
    })
    await assert.rejects(() => c.authenticate())
  })

  it('sync sends businessKey', async () => {
    await client.authenticate()
    const res = await client.sync({ businessKey: 'order-123', data: { amount: 100 } })
    assert.equal(res.businessKey, 'order-123')
    assert.equal(res.accepted, true)
  })

  it('sync with idempotency key', async () => {
    await client.authenticate()
    const idemKey = 'idem-abc-123'
    const r1 = await client.sync({ businessKey: 'order-456', data: {} }, idemKey)
    const r2 = await client.sync({ businessKey: 'order-456', data: {} }, idemKey)
    assert.equal(r1.businessKey, r2.businessKey)
  })

  it('sendCommand posts command', async () => {
    await client.authenticate()
    const result = await client.sendCommand({
      commandType: 'print',
      targetDeviceId: 'device-1',
      params: { text: 'hello' },
      priority: 'normal',
    })
    assert.equal(result.commandType, 'print')
    assert.equal(result.status, 'success')
    assert.ok(result.durationMs !== undefined)
  })

  it('clearToken forces re-auth', async () => {
    client.clearToken()
    assert.equal(client.getToken(), null)
    await client.authenticate()
    assert.ok(client.getToken())
  })
})
