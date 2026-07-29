import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'admin-settings-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'admin-settings-data.ts'), 'utf-8')
})


describe('AdminSettingsData — 快照合同', () => {
  it('应定义 fallback 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'admin-settings-fallback'"))
    assert.ok(DATA_SRC.includes('systemInfo: SystemInfoSnapshot'))
    assert.ok(DATA_SRC.includes('smsProviders: SmsProviderSnapshot[]'))
    assert.ok(DATA_SRC.includes('mailProviders: MailProviderSnapshot[]'))
    assert.ok(DATA_SRC.includes('paymentChannels: PaymentChannelSnapshot[]'))
    assert.ok(DATA_SRC.includes('securityPolicies: SecurityPolicySnapshot[]'))
  })

  it('应保留全局设置 fallback 样本', () => {
    assert.ok(DATA_SRC.includes('神机营·运营管理系统'))
    assert.ok(DATA_SRC.includes('阿里云短信'))
    assert.ok(DATA_SRC.includes('SendCloud'))
    assert.ok(DATA_SRC.includes('微信支付'))
    assert.ok(DATA_SRC.includes('强制多因素认证'))
    assert.ok(DATA_SRC.includes('fallback 样本'))
  })
})

describe('AdminSettingsClient — 客户端渲染层', () => {
  it('客户端应声明 use client 并支持 router.refresh', () => {
    assert.ok(CLIENT_SRC.includes('"use client"'))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok(CLIENT_SRC.includes('useTransition'))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()")
  })

  it('客户端应保留系统信息、服务通道与安全策略视图', () => {
    assert.ok(CLIENT_SRC.includes('系统信息'))
    assert.ok(CLIENT_SRC.includes('短信服务配置'))
    assert.ok(CLIENT_SRC.includes('邮件服务配置'))
    assert.ok(CLIENT_SRC.includes('支付通道'))
    assert.ok(CLIENT_SRC.includes('安全策略'))
    assert.ok(CLIENT_SRC.includes('governanceNotes.map'))
  })
})
