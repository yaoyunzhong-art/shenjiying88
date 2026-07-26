import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  computeSecurityScore,
  filterHistory,
  loadLoginPageSnapshot,
  mockLoginApi,
  validatePasswordPolicy,
} from './login-data'

describe('Login snapshot contract', () => {
  it('应返回 fallback 快照与安全 bootstrap 证据', async () => {
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

  it('mock 登录接口应在正确账号密码下返回 session 载荷', async () => {
    const result = await mockLoginApi('admin', 'admin123')
    assert.equal(result.role, 'super_admin')
    assert.ok(result.permissions.includes('dashboard:read'))
  })
})
