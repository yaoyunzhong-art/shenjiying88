import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'reconciliation-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'reconciliation-data.ts'), 'utf-8')
})

describe('ReconciliationPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(!PAGE_SRC.includes(')export default async function ReconciliationPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载对账快照并渲染客户端组件', () => {
    assert.ok(!PAGE_SRC.includes(")import { loadReconciliationSnapshot } from './reconciliation-data'"))
    assert.ok(!PAGE_SRC.includes(')const snapshot = await loadReconciliationSnapshot()'))
    assert.ok(!PAGE_SRC.includes(')<ReconciliationClient snapshot={snapshot} />'))
  })

  it('页面应接入管理员权限边界与动态渲染', () => {
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'finance:reconciliation:read'"))
    assert.ok(!PAGE_SRC.includes(")export const dynamic = 'force-dynamic'"))
    assert.ok(!PAGE_SRC.includes(')export const revalidate = 0'))
  })
})

describe('ReconciliationPage — 来源态透明化', () => {
  it('页面应展示来源态证据', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })

  it('应同时固证 api 与 fallback 语义', () => {
    assert.ok(!PAGE_SRC.includes('loadReconciliationSnapshot -> finance/reconciliation/status|summary|details|diffs'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(
      PAGE_SRC.includes(
        'loadReconciliationSnapshot -> defaultReconciliationStatus/defaultSummary/defaultDiffs/defaultDetails fallback'
      )
    )
    assert.ok(!PAGE_SRC.includes(')local finance reconciliation samples'))
    assert.ok(!PAGE_SRC.includes(')不可作为闭环复签证据'))
  })
})

describe('ReconciliationData — 快照合同', () => {
  it('应定义状态、汇总、差异与明细快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('status: ReconciliationStatus'))
    assert.ok(DATA_SRC.includes('summary: SummaryResponse | null'))
    assert.ok(DATA_SRC.includes('diffs: DiffRecord[]'))
    assert.ok(DATA_SRC.includes('details: DiffDetailRecord[]'))
  })

  it('应尝试读取 status、summary、details、diffs 上游接口', () => {
    assert.ok(DATA_SRC.includes("new URL('finance/reconciliation/status', resolveReconciliationApiBaseUrl())"))
    assert.ok(DATA_SRC.includes("new URL('finance/reconciliation/summary', resolveReconciliationApiBaseUrl())"))
    assert.ok(DATA_SRC.includes("new URL('finance/reconciliation/details', resolveReconciliationApiBaseUrl())"))
    assert.ok(DATA_SRC.includes("new URL('finance/reconciliation/diffs', resolveReconciliationApiBaseUrl())"))
  })

  it('失败时应回退到 fallback 样本并返回错误提示', () => {
    assert.ok(DATA_SRC.includes('defaultReconciliationStatus'))
    assert.ok(DATA_SRC.includes('defaultSummary'))
    assert.ok(DATA_SRC.includes('defaultDiffs'))
    assert.ok(DATA_SRC.includes('defaultDetails'))
    assert.ok(DATA_SRC.includes('财务对账实时接口不可达，已切换到 fallback 样本数据。'))
  })
})

describe('ReconciliationClient — 客户端展示层', () => {
  it('客户端组件应声明 use client 并支持 refresh', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes('useTransition') || CLIENT_SRC.includes('useSnapshotRefresh') || CLIENT_SRC.includes('isRefreshing')), 'E54: useTransition OR useSnapshotRefresh')
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh")), "E54: router.refresh() OR handleRefresh()")
  })

  it('客户端组件应保留 tabs、筛选与自动刷新', () => {
    assert.ok(CLIENT_SRC.includes("type TabView = 'overview' | 'details' | 'history'"))
    assert.ok(CLIENT_SRC.includes('setKindFilter'))
    assert.ok(CLIENT_SRC.includes('setResolvedFilter'))
    assert.ok(CLIENT_SRC.includes('自动刷新'))
    assert.ok(CLIENT_SRC.includes('useEffect(() =>'))
  })

  it('客户端组件应保留手动对账和标记已处理链路', () => {
    assert.ok(CLIENT_SRC.includes('handleRunReconciliation'))
    assert.ok(CLIENT_SRC.includes('handleResolve'))
    assert.ok(CLIENT_SRC.includes('手动对账'))
    assert.ok(CLIENT_SRC.includes('标记已处理'))
  })
})
