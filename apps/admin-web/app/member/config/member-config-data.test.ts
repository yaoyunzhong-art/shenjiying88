import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'

import {
  DEFAULT_MEMBER_CONFIG,
  loadMemberConfigSnapshot,
} from './member-config-data'

const originalFetch = globalThis.fetch
const originalApiBaseUrl = process.env.M5_API_BASE_URL

afterEach(() => {
  globalThis.fetch = originalFetch
  if (originalApiBaseUrl === undefined) {
    delete process.env.M5_API_BASE_URL
  } else {
    process.env.M5_API_BASE_URL = originalApiBaseUrl
  }
})

describe('member-config-data', () => {
  it('优先映射真实 API 配置与最近变更记录', async () => {
    process.env.M5_API_BASE_URL = 'http://config-service'

    const calls: string[] = []
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input)
      calls.push(url)

      if (url === 'http://config-service/api/member/config') {
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              config: {
                points: { earnRate: 2, redeemRate: 80, enabled: true, expiryDays: 180 },
                levels: {
                  thresholds: {
                    BRONZE: 0,
                    SILVER: 800,
                    GOLD: 3000,
                    PLATINUM: 12000,
                    DIAMOND: 60000,
                  },
                },
                lifecycle: { dormantDays: 60, churnedDays: 150 },
                phoneUniqueScope: 'tenant',
                crossTenantEnabled: false,
              },
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      }

      if (url === 'http://config-service/api/member/config/history?limit=1') {
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              history: [
                {
                  changeId: 'cfg-20260726-1',
                  changedBy: 'ops-admin',
                  changedAt: '2026-07-26T11:45:00.000Z',
                  reason: 'campaign tuning',
                },
              ],
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      }

      return new Response('not found', { status: 404 })
    }) as typeof fetch

    const snapshot = await loadMemberConfigSnapshot()

    assert.equal(snapshot.deliveryMode, 'api')
    assert.equal(snapshot.sourceLabel, 'member-config-api')
    assert.equal(snapshot.config.points.earnRate, 2)
    assert.equal(snapshot.config.phoneUniqueScope, 'tenant')
    assert.equal(snapshot.historyCount, 1)
    assert.equal(snapshot.lastChangedBy, 'ops-admin')
    assert.equal(snapshot.lastChangedAt, '2026-07-26T11:45:00.000Z')
    assert.equal(snapshot.error, undefined)
    assert.deepEqual(calls, [
      'http://config-service/api/member/config',
      'http://config-service/api/member/config/history?limit=1',
    ])
  })

  it('接口失败时应回退到 fallback 配置并保留来源态错误', async () => {
    process.env.M5_API_BASE_URL = 'http://config-service'
    globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch

    const snapshot = await loadMemberConfigSnapshot()

    assert.equal(snapshot.deliveryMode, 'fallback')
    assert.equal(snapshot.sourceLabel, 'member-config-fallback')
    assert.deepEqual(snapshot.config, DEFAULT_MEMBER_CONFIG)
    assert.equal(snapshot.lastChangedBy, 'system-bootstrap')
    assert.ok(snapshot.error?.includes('fallback'))
  })
})
