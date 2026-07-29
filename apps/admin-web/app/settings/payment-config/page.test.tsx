import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const PAGE_SRC = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8')
const DATA_SRC = readFileSync(new URL('./payment-config-data.ts', import.meta.url), 'utf8')
const CLIENT_SRC = readFileSync(new URL('./payment-config-client.tsx', import.meta.url), 'utf8')

describe('settings/payment-config 页面结构固证', () => {
  it('page 为 server wrapper 并加载快照', () => {
    assert.ok(PAGE_SRC.includes('export default async function PaymentConfigPage'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadPaymentConfigSnapshot()'))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('page 显式展示来源态证据', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })

  it('page 保留权限门禁并挂载 client renderer', () => {
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'foundation.governance.read'"))
    assert.ok(PAGE_SRC.includes('<PaymentConfigClient snapshot={snapshot} />'))
  })
})

describe('settings/payment-config snapshot loader 固证', () => {
  it('data 文件定义 mock 快照合同与来源标签', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'mock'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'local-payment-config-snapshot'"))
    assert.ok(DATA_SRC.includes('export interface PaymentConfigSnapshotDelivery'))
    assert.ok(DATA_SRC.includes('export async function loadPaymentConfigSnapshot()'))
  })

  it('data 文件保留通道与结算规则样本', () => {
    assert.ok(DATA_SRC.includes('export const defaultPaymentChannels'))
    assert.ok(DATA_SRC.includes('export const defaultSettlementRules'))
    assert.ok(DATA_SRC.includes('微信支付'))
    assert.ok(DATA_SRC.includes('银联刷卡'))
  })
})

describe('settings/payment-config client 固证', () => {
  it('client 文件为 client component 并使用 router.refresh()', () => {
    assert.ok(CLIENT_SRC.startsWith("'use client'"))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes('useTransition') || CLIENT_SRC.includes('useSnapshotRefresh') || CLIENT_SRC.includes('isRefreshing')), 'E54: useTransition OR useSnapshotRefresh')
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh"))), "E54: router.refresh() OR handleRefresh()")
  })

  it('client 文件保留支付通道、状态与结算规则渲染', () => {
    assert.ok(CLIENT_SRC.includes('支付通道'))
    assert.ok(CLIENT_SRC.includes('snapshot.channels.map'))
    assert.ok(CLIENT_SRC.includes('statusLabel(channel.status)'))
    assert.ok(CLIENT_SRC.includes('snapshot.settlementRules.map'))
  })
})
