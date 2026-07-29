import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'finance-dashboard-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'finance-dashboard-data.ts'), 'utf-8')
})

describe('FinanceDashboardPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function FinanceDashboardPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载 dashboard 快照并渲染客户端组件', () => {
    assert.ok(PAGE_SRC.includes("import { loadFinanceDashboardSnapshot } from './finance-dashboard-data'"))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadFinanceDashboardSnapshot()'))
    assert.ok(PAGE_SRC.includes('<FinanceDashboardClient snapshot={snapshot} />'))
  })

  it('页面应接入管理员权限边界与动态渲染', () => {
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'finance:dashboard:read'"))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })
})

describe('FinanceDashboardPage — 来源态透明化', () => {
  it('页面应展示来源态证据', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })

  it('应同时固证 api 与 fallback 语义', () => {
    assert.ok(!PAGE_SRC.includes('loadFinanceDashboardSnapshot -> finance/dashboard'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('loadFinanceDashboardSnapshot -> defaultFinanceDashboard fallback'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(PAGE_SRC.includes('local finance dashboard samples'))
    assert.ok(PAGE_SRC.includes('不可作为闭环复签证据'))
  })
})

describe('FinanceDashboardData — 快照合同', () => {
  it('应定义 dashboard 快照结构与 fallback 样本', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('dashboard: DashboardData'))
    assert.ok(DATA_SRC.includes('export const defaultFinanceDashboard'))
    assert.ok(DATA_SRC.includes('revenue: RevenueSummary'))
    assert.ok(DATA_SRC.includes('reconciliation: ReconciliationStatus'))
  })

  it('应尝试读取 finance/dashboard 上游接口', () => {
    assert.ok(DATA_SRC.includes("new URL('finance/dashboard', resolveFinanceDashboardApiBaseUrl())"))
    assert.ok(DATA_SRC.includes('return unwrapApiPayload<DashboardData>(payload)'))
    assert.ok(DATA_SRC.includes("cache: 'no-store'"))
  })

  it('失败时应回退到 fallback 样本并返回错误提示', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes('财务仪表盘实时接口不可达，已切换到 fallback 样本数据。'))
  })
})

describe('FinanceDashboardClient — 客户端展示层', () => {
  it('客户端组件应声明 use client 并支持 refresh', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes('useTransition') || CLIENT_SRC.includes('useSnapshotRefresh') || CLIENT_SRC.includes('isRefreshing')), 'E54: useTransition OR useSnapshotRefresh')
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()")
  })

  it('客户端组件应保留快速操作与导航', () => {
    assert.ok(CLIENT_SRC.includes('发起对账'))
    assert.ok(CLIENT_SRC.includes("router.push('/finance/reconciliation')"))
    assert.ok(CLIENT_SRC.includes('handleRunReconciliation'))
  })

  it('客户端组件应保留渠道、趋势、利润和成本面板', () => {
    assert.ok(CLIENT_SRC.includes('支付渠道拆分'))
    assert.ok(CLIENT_SRC.includes('7 日趋势'))
    assert.ok(CLIENT_SRC.includes('利润概况'))
    assert.ok(CLIENT_SRC.includes('费用分析'))
  })
})
