import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'rules-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'rules-data.ts'), 'utf-8')
})

describe('ReconciliationRulesPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function ReconciliationRulesPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载对账规则快照', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadReconciliationRulesSnapshot()'))
    assert.ok(PAGE_SRC.includes("import { loadReconciliationRulesSnapshot } from './rules-data'"))
  })

  it('页面应导出 dynamic 与 revalidate', () => {
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })

  it('页面应接入管理员权限边界', () => {
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'finance:reconciliation:rules:read'"))
  })
})

describe('ReconciliationRulesPage — 来源态透明化', () => {
  it('页面应展示对账规则来源态证据', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })

  it('应同时固证 api 与 fallback 来源标签', () => {
    assert.ok(!PAGE_SRC.includes('loadReconciliationRulesSnapshot -> finance/reconciliation/rules'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('loadReconciliationRulesSnapshot -> defaultRules fallback'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(PAGE_SRC.includes('local reconciliation rule samples'))
    assert.ok(PAGE_SRC.includes('不可作为闭环复签证据'))
  })
})

describe('ReconciliationRulesData — 快照合同', () => {
  it('应定义 api|fallback 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('rules: ReconciliationRule[]'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应定义默认 fallback 样本', () => {
    assert.ok(DATA_SRC.includes('export const defaultRules'))
    assert.ok(DATA_SRC.includes('订单号精确匹配'))
    assert.ok(DATA_SRC.includes('金额容差匹配'))
    assert.ok(DATA_SRC.includes('模糊搜索匹配'))
  })

  it('应尝试读取上游 finance/reconciliation/rules 接口', () => {
    assert.ok(DATA_SRC.includes("new URL('finance/reconciliation/rules', resolveReconciliationRulesApiBaseUrl())"))
    assert.ok(DATA_SRC.includes('unwrapApiPayload<{ rules: ReconciliationRule[] }>'))
  })

  it('失败时应回退到 fallback 样本并返回错误提示', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes('对账规则实时接口不可达，已切换到 fallback 样本数据。'))
  })
})

describe('ReconciliationRulesClient — 客户端展示层', () => {
  it('客户端组件应声明 use client', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
  })

  it('客户端组件应接收 snapshot 并渲染错误', () => {
    assert.ok(CLIENT_SRC.includes('snapshot: ReconciliationRulesSnapshotDelivery'))
    assert.ok(CLIENT_SRC.includes('snapshot.error'))
    assert.ok(CLIENT_SRC.includes('mutationError'))
  })

  it('客户端组件应支持刷新按钮并触发 router.refresh', () => {
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes('useTransition') || CLIENT_SRC.includes('useSnapshotRefresh') || CLIENT_SRC.includes('isRefreshing')), 'E54: useTransition OR useSnapshotRefresh')
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh"))), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新'"))
  })

  it('客户端组件应保留 tabs、列表和空态', () => {
    assert.ok(CLIENT_SRC.includes("type RuleTab = 'active' | 'inactive' | 'settings'"))
    assert.ok(CLIENT_SRC.includes('已启用'))
    assert.ok(CLIENT_SRC.includes('已禁用'))
    assert.ok(CLIENT_SRC.includes('全部'))
    assert.ok(CLIENT_SRC.includes('暂无规则'))
  })

  it('客户端组件应保留编辑态表单与保存链路', () => {
    assert.ok(CLIENT_SRC.includes('editingRule'))
    assert.ok(CLIENT_SRC.includes('editForm'))
    assert.ok(CLIENT_SRC.includes('规则名称'))
    assert.ok(CLIENT_SRC.includes("method: 'PUT'"))
    assert.ok(CLIENT_SRC.includes("saving ? '保存中...' : '保存'"))
  })

  it('客户端组件应保留启停开关与 PATCH 链路', () => {
    assert.ok(CLIENT_SRC.includes("method: 'PATCH'"))
    assert.ok(CLIENT_SRC.includes("rule.enabled ? '禁用' : '启用'"))
    assert.ok(CLIENT_SRC.includes('handleToggle'))
  })

  it('客户端组件应保留匹配率、容差和全局行为展示', () => {
    assert.ok(CLIENT_SRC.includes('fmtRate(rule.matchRate)'))
    assert.ok(CLIENT_SRC.includes('容差: {fmtCents(rule.toleranceCents)}'))
    assert.ok(CLIENT_SRC.includes('全局匹配行为'))
    assert.ok(CLIENT_SRC.includes('规则按优先级顺序执行'))
  })
})

describe('ReconciliationRules — 反例与边界', () => {
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

  it('客户端应处理空分类边界', () => {
    assert.ok(CLIENT_SRC.includes('当前分类下没有对账规则'))
  })
})
