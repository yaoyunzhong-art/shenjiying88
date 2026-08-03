import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'

import {
  computeSecurityScore,
  filterHistory,
  loginAdmin,
  loadLoginPageSnapshot,
  validatePasswordPolicy,
} from './login-data'

const originalFetch = globalThis.fetch

beforeEach(() => {
  globalThis.fetch = originalFetch
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('Login snapshot contract', () => {
  it('应在存在真实认证头时返回 api 快照', async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input)
      assert.ok(url.includes('/auth/me'))
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            userId: 'api-user-001',
            tenantId: 'tenant-live',
            email: 'admin@sportsant.net',
            roles: ['TENANT_ADMIN'],
            permissions: ['dashboard:read', 'security:read'],
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    }) as typeof fetch

    const snapshot = await loadLoginPageSnapshot({
      requestHeaders: new Headers({ authorization: 'Bearer live-token' }),
    })
    assert.equal(snapshot.deliveryMode, 'api')
    assert.equal(snapshot.sourceLabel, 'login-api-live')
    assert.ok(snapshot.controlPlaneSource.includes('auth/me'))
    assert.equal(snapshot.currentUser?.userId, 'api-user-001')
  })

  it('无认证头时应返回 fallback 快照与安全 bootstrap 证据', async () => {
    const snapshot = await loadLoginPageSnapshot()
    assert.equal(snapshot.deliveryMode, 'fallback')
    assert.equal(snapshot.sourceLabel, 'login-local-snapshot')
    assert.ok(snapshot.controlPlaneSource.includes('adminWebBootstrap'))
    assert.ok(snapshot.bootstrap.revalidateOn.length > 0)
  })

  it('安全评分应正确计算成功率与独立 IP', async () => {
    const snapshot = await loadLoginPageSnapshot()
    const score = computeSecurityScore(snapshot.history)
    assert.equal(score.total, 8)
    assert.equal(score.success, 5)
    assert.equal(score.fail, 3)
    assert.equal(score.uniqueIPs, 6)
  })

  it('密码策略应校验大小写与数字', () => {
    assert.equal(validatePasswordPolicy('Admin123').valid, true)
    assert.equal(validatePasswordPolicy('admin123').valid, false)
    assert.equal(validatePasswordPolicy('ADMIN123').valid, false)
    assert.equal(validatePasswordPolicy('AdminOnly').valid, false)
  })

  it('历史过滤应支持失败筛选与关键字搜索', async () => {
    const snapshot = await loadLoginPageSnapshot()
    const filtered = filterHistory(snapshot.history, 'operator', true)
    assert.equal(filtered.length, 2)
    assert.ok(filtered.every((entry) => entry.success === false))
  })

  it('登录动作应优先调用真实认证 API', async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input)
      assert.ok(url.includes('/auth/login/password'))
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            user: {
              userId: 'api-user-001',
              tenantId: 'tenant-live',
              email: 'admin@sportsant.net',
              roles: ['TENANT_ADMIN'],
              permissions: ['dashboard:read'],
            },
            accessToken: 'api-access-token',
            refreshToken: 'api-refresh-token',
            expiresIn: 3600,
            tokenType: 'Bearer',
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    }) as typeof fetch

    const result = await loginAdmin('admin@sportsant.net', 'Admin123')
    assert.equal(result.deliveryMode, 'api')
    assert.equal(result.token, 'api-access-token')
    assert.equal(result.userId, 'api-user-001')
  })

  it('登录动作在 demo 凭据且 API 失败时应回退到 fallback/mock', async () => {
    globalThis.fetch = (async () => {
      throw new Error('auth down')
    }) as typeof fetch

    const result = await loginAdmin('admin', 'admin123')
    assert.equal(result.deliveryMode, 'fallback')
    assert.equal(result.role, 'super_admin')
    assert.ok(result.permissions.includes('dashboard:read'))
  })
})
