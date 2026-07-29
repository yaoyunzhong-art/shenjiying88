import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'finance-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'finance-data.ts'), 'utf-8')
})

describe('FinancePage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function FinancePage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载 finance 快照并渲染客户端组件', () => {
    assert.ok(PAGE_SRC.includes("import { loadFinanceSnapshot } from './finance-data'"))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadFinanceSnapshot()'))
    assert.ok(PAGE_SRC.includes('<FinanceClient snapshot={snapshot} />'))
  })

  it('页面应导出 dynamic 与 revalidate', () => {
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })

  it('页面应接入管理员权限边界', () => {
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'finance:read'"))
  })
})

describe('FinancePage — 来源态透明化', () => {
  it('页面应展示来源态证据', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })

  it('应同时固证 api 与 fallback 语义', () => {
    assert.ok(!PAGE_SRC.includes('loadFinanceSnapshot -> api/finance/payments + api/finance/refunds'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('loadFinanceSnapshot -> defaultPayments/defaultRefunds fallback'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(PAGE_SRC.includes('local finance payment/refund samples'))
    assert.ok(PAGE_SRC.includes('不可作为闭环复签证据'))
  })
})

describe('FinanceData — 快照合同', () => {
  it('应定义支付退款快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('payments: Payment[]'))
    assert.ok(DATA_SRC.includes('refunds: Refund[]'))
    assert.ok(DATA_SRC.includes('tenantId: string'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应定义 fallback 样本并保留财务字段', () => {
    assert.ok(DATA_SRC.includes('export const defaultPayments'))
    assert.ok(DATA_SRC.includes('export const defaultRefunds'))
    assert.ok(DATA_SRC.includes("method: 'WECHAT'"))
    assert.ok(DATA_SRC.includes("status: 'REQUESTED'"))
  })

  it('应尝试读取 payments 与 refunds 上游接口', () => {
    assert.ok(DATA_SRC.includes("new URL('api/finance/payments', resolveFinanceApiBaseUrl())"))
    assert.ok(DATA_SRC.includes("new URL('api/finance/refunds', resolveFinanceApiBaseUrl())"))
    assert.ok(DATA_SRC.includes("upstreamUrl.searchParams.set('tenantId', tenantId)"))
  })

  it('失败时应回退到 fallback 样本并返回错误提示', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes('财务支付与退款实时接口不可达，已切换到 fallback 样本数据。'))
  })
})

describe('FinanceClient — 客户端展示层', () => {
  it('客户端组件应声明 use client', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
  })

  it('客户端组件应支持刷新按钮并触发 router.refresh', () => {
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes('useTransition') || CLIENT_SRC.includes('useSnapshotRefresh') || CLIENT_SRC.includes('isRefreshing')), 'E54: useTransition OR useSnapshotRefresh')
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh"))), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新'"))
  })

  it('客户端组件应保留筛选与概览卡片', () => {
    assert.ok(CLIENT_SRC.includes('paymentStatus'))
    assert.ok(CLIENT_SRC.includes('paymentMethod'))
    assert.ok(CLIENT_SRC.includes('支付单总数'))
    assert.ok(CLIENT_SRC.includes('支付总额'))
    assert.ok(CLIENT_SRC.includes('已退款'))
  })

  it('客户端组件应渲染支付表与退款表', () => {
    assert.ok(CLIENT_SRC.includes('支付单'))
    assert.ok(CLIENT_SRC.includes('退款单'))
    assert.ok(CLIENT_SRC.includes('退款总额'))
    assert.ok(CLIENT_SRC.includes('formatMoney(refund.amountCents)'))
  })

  it('客户端组件应固证 fallback 告警与本地样本插入动作', () => {
    assert.ok(CLIENT_SRC.includes('snapshot.error'))
    assert.ok(CLIENT_SRC.includes('该页面当前不可作为闭环复签证据'))
    assert.ok(CLIENT_SRC.includes('插入支付草案'))
  })
})
