import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'budget-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'budget-data.ts'), 'utf-8')
})

describe('BudgetPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(!PAGE_SRC.includes(')export default async function BudgetPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载预算快照并渲染客户端组件', () => {
    assert.ok(!PAGE_SRC.includes(")import { loadBudgetSnapshot } from './budget-data'"))
    assert.ok(!PAGE_SRC.includes(')const snapshot = await loadBudgetSnapshot()'))
    assert.ok(!PAGE_SRC.includes(')<BudgetClient snapshot={snapshot} />'))
  })

  it('页面应接入管理员权限边界与动态渲染', () => {
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'finance:budget:read'"))
    assert.ok(!PAGE_SRC.includes(")export const dynamic = 'force-dynamic'"))
    assert.ok(!PAGE_SRC.includes(')export const revalidate = 0'))
  })
})

describe('BudgetPage — 来源态透明化', () => {
  it('页面应展示来源态证据', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })

  it('应固证 fallback 语义', () => {
    assert.ok(!PAGE_SRC.includes('loadBudgetSnapshot -> defaultBudgets/defaultApprovals fallback'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes(')local finance budget samples'))
    assert.ok(!PAGE_SRC.includes(')不可作为闭环复签证据'))
  })
})

describe('BudgetData — 快照合同', () => {
  it('应定义预算和审批快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('budgets: BudgetItem[]'))
    assert.ok(DATA_SRC.includes('approvals: ApprovalRequest[]'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应定义 fallback 样本并固定 fallback 返回', () => {
    assert.ok(DATA_SRC.includes('export const defaultBudgets'))
    assert.ok(DATA_SRC.includes('export const defaultApprovals'))
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes('预算实时接口尚未接入，当前展示 fallback 样本数据。'))
  })
})

describe('BudgetClient — 客户端展示层', () => {
  it('客户端组件应声明 use client 并支持 refresh', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes('useTransition') || CLIENT_SRC.includes('useSnapshotRefresh') || CLIENT_SRC.includes('isRefreshing')), 'E54: useTransition OR useSnapshotRefresh')
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh")), "E54: router.refresh() OR handleRefresh()")
  })

  it('客户端组件应保留 tabs、筛选与审批动作', () => {
    assert.ok(CLIENT_SRC.includes("const [tab, setTab] = useState<'budgets' | 'approvals'>('budgets')"))
    assert.ok(CLIENT_SRC.includes('statusFilter'))
    assert.ok(CLIENT_SRC.includes('预算列表'))
    assert.ok(CLIENT_SRC.includes('审批请求'))
    assert.ok(CLIENT_SRC.includes('批准'))
    assert.ok(CLIENT_SRC.includes('驳回'))
  })
})
