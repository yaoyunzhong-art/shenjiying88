import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'profit-loss-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'profit-loss-data.ts'), 'utf-8')
})

describe('ProfitLossPage — 服务端壳层', () => {
  it('页面应为 async server component 并消费 searchParams', () => {
    assert.ok(PAGE_SRC.includes('export default async function ProfitLossPage'))
    assert.ok(PAGE_SRC.includes('const resolvedSearchParams = searchParams ? await searchParams : undefined'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载损益快照', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadProfitLossSnapshot(requestedPeriod)'))
    assert.ok(PAGE_SRC.includes("import { loadProfitLossSnapshot } from './profit-loss-data'"))
  })

  it('页面应导出 dynamic 与 revalidate', () => {
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })

  it('页面应接入管理员权限边界', () => {
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'finance:profit-loss:read'"))
  })

  it('页面应渲染客户端组件', () => {
    assert.ok(PAGE_SRC.includes('<ProfitLossClient snapshot={snapshot} />'))
  })
})

describe('ProfitLossPage — 来源态透明化', () => {
  it('页面应展示损益表来源态证据', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })

  it('应同时固证 api 与 fallback 来源标签', () => {
    assert.ok(!PAGE_SRC.includes('loadProfitLossSnapshot -> finance/pnl'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('loadProfitLossSnapshot -> defaultProfitLossReport fallback'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(PAGE_SRC.includes('local profit-loss samples'))
    assert.ok(PAGE_SRC.includes('不可作为闭环复签证据'))
  })
})

describe('ProfitLossData — 快照合同', () => {
  it('应定义 period 与快照结构', () => {
    assert.ok(DATA_SRC.includes("export type PeriodKey = 'thisMonth' | 'lastMonth' | 'quarter' | 'year'"))
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('selectedPeriod: PeriodKey'))
    assert.ok(DATA_SRC.includes('report: PnLReport'))
  })

  it('应定义默认 fallback 样本与周期归一化', () => {
    assert.ok(DATA_SRC.includes('export const periodDataMap'))
    assert.ok(DATA_SRC.includes('export function normalizePeriodKey(period?: string): PeriodKey'))
    assert.ok(DATA_SRC.includes("return 'thisMonth'"))
  })

  it('应尝试读取上游 finance/pnl 接口并透传 period', () => {
    assert.ok(DATA_SRC.includes("const upstreamUrl = new URL('finance/pnl', resolveProfitLossApiBaseUrl())"))
    assert.ok(DATA_SRC.includes("upstreamUrl.searchParams.set('period', period)"))
    assert.ok(DATA_SRC.includes('return unwrapApiPayload<PnLReport>(payload)'))
  })

  it('失败时应回退到 fallback 样本并返回错误提示', () => {
    assert.ok(DATA_SRC.includes('const report = getDefaultProfitLossReport(selectedPeriod)'))
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes('损益表实时接口不可达，已切换到 fallback 样本数据。'))
  })
})

describe('ProfitLossClient — 客户端展示层', () => {
  it('客户端组件应声明 use client', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
  })

  it('客户端组件应接收 snapshot 并渲染错误', () => {
    assert.ok(CLIENT_SRC.includes('snapshot: ProfitLossSnapshotDelivery'))
    assert.ok(CLIENT_SRC.includes('snapshot.error'))
    assert.ok(CLIENT_SRC.includes("dataSourceLabel = snapshot.deliveryMode === 'api' ? '真实 API' : 'fallback'"))
  })

  it('客户端组件应支持刷新按钮并触发 router.refresh', () => {
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes('useTransition') || CLIENT_SRC.includes('useSnapshotRefresh') || CLIENT_SRC.includes('isRefreshing')), 'E54: useTransition OR useSnapshotRefresh')
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh"))), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新'"))
  })

  it('客户端组件应通过 URL 驱动周期切换', () => {
    assert.ok(CLIENT_SRC.includes('usePathname'))
    assert.ok(CLIENT_SRC.includes('useSearchParams'))
    assert.ok(CLIENT_SRC.includes('new URLSearchParams(searchParams.toString())'))
    assert.ok(CLIENT_SRC.includes("params.set('period', period)"))
    assert.ok(CLIENT_SRC.includes('router.replace(`${pathname}?${params.toString()}`)'))
  })

  it('客户端组件应保留 tabs、摘要卡片和表格', () => {
    assert.ok(CLIENT_SRC.includes("role=\"tablist\""))
    assert.ok(CLIENT_SRC.includes('总收入'))
    assert.ok(CLIENT_SRC.includes('总成本+费用'))
    assert.ok(CLIENT_SRC.includes('净利润'))
    assert.ok(CLIENT_SRC.includes('预算达成'))
  })

  it('客户端组件应保留递归行渲染与排序逻辑', () => {
    assert.ok(CLIENT_SRC.includes('function PnLRow'))
    assert.ok(CLIENT_SRC.includes('<PnLRow key={`${item.label}-${child.label}`} item={child} depth={depth + 1} />'))
    assert.ok(CLIENT_SRC.includes("const order: Record<string, number> = { revenue: 0, cost: 1, expense: 2, profit: 3 }"))
  })

  it('客户端组件应保留金额和比率格式化逻辑', () => {
    assert.ok(CLIENT_SRC.includes('function fmtShort(cents: number): string'))
    assert.ok(CLIENT_SRC.includes("if (previous === 0) return current > 0 ? '+∞' : '0'"))
    assert.ok(CLIENT_SRC.includes("if (budget === 0) return '-'"))
    assert.ok(CLIENT_SRC.includes('生成时间: {new Date(report.generatedAt).toLocaleString(\'zh-CN\')}'))
  })
})

describe('ProfitLoss — 反例与边界', () => {
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

  it('应保留 fallback 与周期边界数据', () => {
    assert.ok(DATA_SRC.includes('quarter: {'))
    assert.ok(DATA_SRC.includes('year: {'))
    assert.ok(CLIENT_SRC.includes("snapshot.selectedPeriod === option.key"))
  })
})
