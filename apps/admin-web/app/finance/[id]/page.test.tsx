import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'finance-detail-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'finance-detail-data.ts'), 'utf-8')
})

describe('FinanceDetailPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function FinanceDetailPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应解析 params 并加载支付详情快照', () => {
    assert.ok(PAGE_SRC.includes('params: Promise<{ id: string }>'))
    assert.ok(PAGE_SRC.includes('const { id } = await params'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadFinanceDetailSnapshot(id)'))
    assert.ok(PAGE_SRC.includes("import { loadFinanceDetailSnapshot } from './finance-detail-data'"))
  })

  it('页面应导出 dynamic 与 revalidate', () => {
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })

  it('页面应接入管理员权限边界', () => {
    assert.ok(PAGE_SRC.includes('AdminPermissionGate'))
    assert.ok(PAGE_SRC.includes("requiredPermission: 'finance:id:read'"))
  })
})

describe('FinanceDetailPage — 来源态透明化', () => {
  it('页面应展示支付详情来源态证据', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'))
    assert.ok(PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'))
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'))
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'))
    assert.ok(PAGE_SRC.includes('来源标签: {snapshot.sourceLabel}'))
  })

  it('应同时固证 api 与 fallback 来源标签', () => {
    assert.ok(PAGE_SRC.includes('loadFinanceDetailSnapshot -> loadFinanceSnapshot -> api/finance/payments + api/finance/refunds'))
    assert.ok(PAGE_SRC.includes('loadFinanceDetailSnapshot -> defaultPayments/defaultRefunds fallback'))
    assert.ok(PAGE_SRC.includes('local finance detail samples'))
    assert.ok(PAGE_SRC.includes('不可作为闭环复签证据'))
  })
})

describe('FinanceDetailData — 快照合同', () => {
  it('应定义 api|fallback 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('payment: PaymentDetail'))
    assert.ok(DATA_SRC.includes('refunds: RefundRecord[]'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
    assert.ok(DATA_SRC.includes('sourceLabel: string'))
  })

  it('应基于 finance 列表快照构造详情快照', () => {
    assert.ok(DATA_SRC.includes('loadFinanceSnapshot'))
    assert.ok(DATA_SRC.includes('snapshot.payments.find((item) => item.id === normalizedId)'))
    assert.ok(DATA_SRC.includes('snapshot.refunds.filter((item) => item.paymentId === normalizedId)'))
  })

  it('应定义 fallback 样本与错误提示', () => {
    assert.ok(DATA_SRC.includes('FALLBACK_PAYMENT_OVERRIDES'))
    assert.ok(DATA_SRC.includes('defaultPayments/defaultRefunds fallback'))
    assert.ok(DATA_SRC.includes('支付详情实时接口不可达或未命中记录，已切换到 fallback 样本数据。'))
  })
})

describe('FinanceDetailClient — 客户端展示层', () => {
  it('客户端组件应声明 use client', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
  })

  it('客户端组件应接收 snapshot 并同步本地状态', () => {
    assert.ok(CLIENT_SRC.includes('snapshot: FinanceDetailSnapshotDelivery'))
    assert.ok(CLIENT_SRC.includes('useEffect(() => {'))
    assert.ok(CLIENT_SRC.includes('setPayment(snapshot.payment)'))
    assert.ok(CLIENT_SRC.includes('setRefunds(snapshot.refunds)'))
  })

  it('客户端组件应支持刷新按钮并触发 router.refresh', () => {
    assert.ok(CLIENT_SRC.includes('useRouter'))
    assert.ok(CLIENT_SRC.includes('useTransition'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新快照'"))
  })

  it('客户端组件应保留状态流转、编辑和删除操作', () => {
    assert.ok(CLIENT_SRC.includes('STATUS_TRANSITIONS'))
    assert.ok(CLIENT_SRC.includes('setConfirmAction'))
    assert.ok(CLIENT_SRC.includes('handleSave'))
    assert.ok(CLIENT_SRC.includes("router.push('/finance')"))
  })

  it('客户端组件应渲染错误提示、退款列表与空态', () => {
    assert.ok(CLIENT_SRC.includes('snapshot.error'))
    assert.ok(CLIENT_SRC.includes('关联退款'))
    assert.ok(CLIENT_SRC.includes('暂无退款记录'))
    assert.ok(CLIENT_SRC.includes('.map((refund) => ('))
  })
})

describe('FinanceDetail — 反例与边界', () => {
  it('源码中不应出现 describe.skip', () => {
    assert.ok(!PAGE_SRC.includes('describe.skip'))
    assert.ok(!CLIENT_SRC.includes('describe.skip'))
    assert.ok(!DATA_SRC.includes('describe.skip'))
  })

  it('源码中不应出现 as any', () => {
    assert.ok(!PAGE_SRC.includes('as any'))
    assert.ok(!CLIENT_SRC.includes('as any'))
    assert.ok(!DATA_SRC.includes('as any'))
  })

  it('客户端应处理无效日期与空退款边界', () => {
    assert.ok(CLIENT_SRC.includes('Number.isNaN(parsed.getTime())'))
    assert.ok(CLIENT_SRC.includes('refunds.length > 0'))
    assert.ok(CLIENT_SRC.includes('暂无退款记录'))
  })
})
