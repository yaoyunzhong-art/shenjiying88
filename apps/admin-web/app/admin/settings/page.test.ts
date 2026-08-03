import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  DEFAULT_MAIL_PROVIDERS,
  DEFAULT_PAYMENT_CHANNELS,
  DEFAULT_SECURITY_POLICIES,
  DEFAULT_SMS_PROVIDERS,
  loadAdminSettingsSnapshot,
} from './admin-settings-data'

describe('admin/settings snapshot', () => {
  it('应返回 fallback 快照并保留来源标签', async () => {
    const snapshot = await loadAdminSettingsSnapshot()
    assert.equal(snapshot.deliveryMode, 'fallback')
    assert.equal(snapshot.sourceLabel, 'admin-settings-fallback')
    assert.ok(snapshot.generatedAt.length > 0)
  })

  it('应统计启用的服务与策略数量', async () => {
    const snapshot = await loadAdminSettingsSnapshot()
    assert.equal(snapshot.stats.smsEnabled, DEFAULT_SMS_PROVIDERS.filter((item) => item.enabled).length)
    assert.equal(
      snapshot.stats.mailEnabled,
      DEFAULT_MAIL_PROVIDERS.filter((item) => item.enabled).length,
    )
    assert.equal(
      snapshot.stats.paymentEnabled,
      DEFAULT_PAYMENT_CHANNELS.filter((item) => item.enabled).length,
    )
    assert.equal(
      snapshot.stats.securityEnabled,
      DEFAULT_SECURITY_POLICIES.filter((item) => item.enabled).length,
    )
  })

  it('应保留系统信息与治理备注', async () => {
    const snapshot = await loadAdminSettingsSnapshot()
    assert.equal(snapshot.systemInfo.environment, 'production')
    assert.ok(snapshot.governanceNotes.length >= 3)
    assert.ok(snapshot.error?.includes('fallback 样本'))
  })
})
