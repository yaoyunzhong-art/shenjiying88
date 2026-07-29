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

describe('FinanceRulesPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function FinanceRulesPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载财务规则快照', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadFinanceRulesSnapshot()'))
    assert.ok(PAGE_SRC.includes("import { loadFinanceRulesSnapshot } from './rules-data'"))
  })

  it('页面应导出 dynamic 与 revalidate', () => {
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })

  it('页面应接入管理员权限边界', () => {
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'finance:rules:read'"))
  })

  it('页面应渲染客户端组件', () => {
    assert.ok(PAGE_SRC.includes('<FinanceRulesClient snapshot={snapshot} />'))
  })
})

describe('FinanceRulesPage — 来源态透明化', () => {
  it('页面应展示财务规则来源态证据', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })

  it('应同时固证 api 与 fallback 来源标签', () => {
    assert.ok(!PAGE_SRC.includes('loadFinanceRulesSnapshot -> finance/rules'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('loadFinanceRulesSnapshot -> defaultFinanceRules fallback'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(PAGE_SRC.includes('local finance rule samples'))
    assert.ok(PAGE_SRC.includes('不可作为闭环复签证据'))
  })
})

describe('FinanceRulesData — 快照合同', () => {
  it('应定义 api|fallback 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('rules: FinanceRule[]'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应定义默认 fallback 样本', () => {
    assert.ok(DATA_SRC.includes('export const defaultFinanceRules'))
    assert.ok(DATA_SRC.includes('对账 — 订单号精确匹配'))
    assert.ok(DATA_SRC.includes('审批 — 大额人工审核'))
    assert.ok(DATA_SRC.includes('结算 — 分账规则'))
  })

  it('应尝试读取上游 finance/rules 接口', () => {
    assert.ok(DATA_SRC.includes("new URL('finance/rules', resolveFinanceRulesApiBaseUrl())"))
    assert.ok(DATA_SRC.includes('unwrapApiPayload<{ rules: FinanceRule[] }>'))
  })

  it('失败时应回退到 fallback 样本并返回错误提示', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes('财务规则实时接口不可达，已切换到 fallback 样本数据。'))
  })
})

describe('FinanceRulesClient — 客户端展示层', () => {
  it('客户端组件应声明 use client', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
  })

  it('客户端组件应接收 snapshot 并渲染错误', () => {
    assert.ok(CLIENT_SRC.includes('snapshot: FinanceRulesSnapshotDelivery'))
    assert.ok(CLIENT_SRC.includes('snapshot.error'))
    assert.ok(CLIENT_SRC.includes('mutationError'))
  })

  it('客户端组件应支持刷新按钮并触发 router.refresh', () => {
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok(CLIENT_SRC.includes('useTransition'))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新'"))
  })

  it('客户端组件应保留 tabs、模块筛选与空态', () => {
    assert.ok(CLIENT_SRC.includes("type ViewMode = 'active' | 'inactive' | 'all'"))
    assert.ok(CLIENT_SRC.includes('全部模块'))
    assert.ok(CLIENT_SRC.includes('已启用'))
    assert.ok(CLIENT_SRC.includes('已禁用'))
    assert.ok(CLIENT_SRC.includes('暂无规则'))
  })

  it('客户端组件应保留编辑态表单与保存链路', () => {
    assert.ok(CLIENT_SRC.includes('editingId'))
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

  it('客户端组件应保留新建模态框与 POST 链路', () => {
    assert.ok(CLIENT_SRC.includes('showCreateModal'))
    assert.ok(CLIENT_SRC.includes('新建财务规则'))
    assert.ok(CLIENT_SRC.includes("method: 'POST'"))
    assert.ok(CLIENT_SRC.includes("saving ? '创建中...' : '创建'"))
  })

  it('客户端组件应保留应用率、容差和执行策略展示', () => {
    assert.ok(CLIENT_SRC.includes('formatPercent(rule.applyRate)'))
    assert.ok(CLIENT_SRC.includes('容差: {formatMoney(rule.toleranceCents)}'))
    assert.ok(CLIENT_SRC.includes('规则执行策略'))
    assert.ok(CLIENT_SRC.includes('财务规则按模块分组'))
  })
})

describe('FinanceRules — 反例与边界', () => {
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

  it('客户端应保留 applyRate 为 null 的边界处理', () => {
    assert.ok(DATA_SRC.includes('applyRate?: number | null'))
    assert.ok(CLIENT_SRC.includes('rule.applyRate != null'))
  })
})
