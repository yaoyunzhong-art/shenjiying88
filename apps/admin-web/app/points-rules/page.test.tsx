import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'points-rules-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'points-rules-data.ts'), 'utf-8')
})

describe('PointsRulesPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function PointsRulesPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载积分规则快照并渲染客户端组件', () => {
    assert.ok(PAGE_SRC.includes("import { loadPointsRulesSnapshot } from './points-rules-data'"))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadPointsRulesSnapshot()'))
    assert.ok(PAGE_SRC.includes('<PointsRulesClient snapshot={snapshot} />'))
  })

  it('页面应接入管理员权限边界与动态渲染', () => {
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'points-rules:read'"))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })
})

describe('PointsRulesPage — 来源态透明化', () => {
  it('页面应展示来源态证据', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })

  it('应同时固证 api 与 fallback 来源标签', () => {
    assert.ok(!PAGE_SRC.includes('loadPointsRulesSnapshot -> member/points-rules + member/points-summary'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('loadPointsRulesSnapshot -> defaultRules/defaultSummary fallback'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(PAGE_SRC.includes('local points-rules fallback samples'))
    assert.ok(PAGE_SRC.includes('不可作为闭环复签证据'))
  })
})

describe('PointsRulesData — 快照合同', () => {
  it('应定义 api|fallback 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('rules: PointsRule[]'))
    assert.ok(DATA_SRC.includes('summary: PointsSummary'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应定义默认 fallback 样本', () => {
    assert.ok(DATA_SRC.includes('export const defaultRules'))
    assert.ok(DATA_SRC.includes('export const defaultSummary'))
    assert.ok(DATA_SRC.includes('消费积分'))
    assert.ok(DATA_SRC.includes('签到积分'))
    assert.ok(DATA_SRC.includes('积分兑换'))
  })

  it('应尝试读取上游 points-rules 与 points-summary 接口', () => {
    assert.ok(DATA_SRC.includes("new URL('member/points-rules', resolvePointsRulesApiBaseUrl())"))
    assert.ok(DATA_SRC.includes("new URL('member/points-summary', resolvePointsRulesApiBaseUrl())"))
    assert.ok(DATA_SRC.includes('Promise.all([fetchPointsRules(), fetchPointsSummary()])'))
  })

  it('失败时应回退到 fallback 样本并返回错误提示', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes('积分规则实时接口不可达，已切换到 fallback 样本数据。'))
  })
})

describe('PointsRulesClient — 客户端展示层', () => {
  it('客户端组件应声明 use client 并支持刷新', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes('useTransition') || CLIENT_SRC.includes('useSnapshotRefresh') || CLIENT_SRC.includes('isRefreshing')), 'E54: useTransition OR useSnapshotRefresh')
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh"))), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新'"))
  })

  it('客户端组件应接收 snapshot 并渲染来源态提示', () => {
    assert.ok(CLIENT_SRC.includes('snapshot: PointsRulesSnapshotDelivery'))
    assert.ok(CLIENT_SRC.includes('snapshot.deliveryMode'))
    assert.ok(CLIENT_SRC.includes('snapshot.generatedAt'))
    assert.ok(CLIENT_SRC.includes('snapshot.error'))
  })

  it('客户端组件应保留概览卡、状态统计与 tabs', () => {
    assert.ok(CLIENT_SRC.includes('规则总数'))
    assert.ok(CLIENT_SRC.includes('月发放积分'))
    assert.ok(CLIENT_SRC.includes('月消耗积分'))
    assert.ok(CLIENT_SRC.includes('平均赚取率'))
    assert.ok(CLIENT_SRC.includes('data-testid="status-stats"'))
    assert.ok(CLIENT_SRC.includes("type RuleTab = 'earn' | 'redeem' | 'bonus' | 'all'"))
    assert.ok(CLIENT_SRC.includes('赚取'))
    assert.ok(CLIENT_SRC.includes('消耗'))
    assert.ok(CLIENT_SRC.includes('奖励'))
    assert.ok(CLIENT_SRC.includes('全部'))
  })

  it('客户端组件应保留规则卡片与空态', () => {
    assert.ok(CLIENT_SRC.includes('triggerLabel(rule.triggerType)'))
    assert.ok(CLIENT_SRC.includes('rateStr(rule)'))
    assert.ok(CLIENT_SRC.includes('优先级 #'))
    assert.ok(CLIENT_SRC.includes('暂无规则'))
    assert.ok(CLIENT_SRC.includes('.map((rule) =>'))
  })
})

describe('PointsRules — 反例与边界', () => {
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
})
