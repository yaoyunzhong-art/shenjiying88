import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'ai-decision-stats-data.ts'), 'utf-8')
})

describe('AiDecisionStatsPage — snapshot page 壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function AiDecisionStatsPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载统计快照并导出动态配置', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadAiDecisionStatsSnapshot()'))
    assert.ok(PAGE_SRC.includes("import {"))
    assert.ok(PAGE_SRC.includes('loadAiDecisionStatsSnapshot'))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })

  it('页面应接入管理员权限边界', () => {
    assert.ok(PAGE_SRC.includes('AdminPermissionGate'))
    assert.ok(PAGE_SRC.includes("requiredPermission: 'ai-decision:read'"))
  })
})

describe('AiDecisionStatsPage — 来源态透明化', () => {
  it('页面应展示 AI 决策统计来源态证据', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('控制面来源:'))
    assert.ok(PAGE_SRC.includes('{sourceEvidence.controlPlaneSource}'))
    assert.ok(PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'))
    assert.ok(PAGE_SRC.includes('刷新路径:'))
    assert.ok(PAGE_SRC.includes('{sourceEvidence.refreshPath}'))
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'))
  })

  it('页面应显式标记 mock 快照不可复签', () => {
    assert.ok(PAGE_SRC.includes('loadAiDecisionStatsSnapshot -> MOCK_RULES'))
    assert.ok(PAGE_SRC.includes('local AI decision sample stats'))
    assert.ok(PAGE_SRC.includes('不可作为闭环复签证据'))
  })
})

describe('AiDecisionStatsData — 快照合同', () => {
  it('应定义 mock 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'mock'"))
    assert.ok(DATA_SRC.includes('rules: RuleStat[]'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应定义统计样本与图表配置', () => {
    assert.ok(DATA_SRC.includes('export const MOCK_RULES'))
    assert.ok(DATA_SRC.includes('动态定价规则'))
    assert.ok(DATA_SRC.includes('套餐推荐 (混合)'))
    assert.ok(DATA_SRC.includes('export const SEGMENTS'))
    assert.ok(DATA_SRC.includes('RESULT_COLORS'))
    assert.ok(DATA_SRC.includes('SOURCE_COLORS'))
  })

  it('应提供统计聚合与图表切片函数', () => {
    assert.ok(DATA_SRC.includes('export function computeStats('))
    assert.ok(DATA_SRC.includes('export function computeAiDecisionSummary('))
    assert.ok(DATA_SRC.includes('export function buildResultSlices('))
    assert.ok(DATA_SRC.includes('export function buildSourceSlices('))
    assert.ok(DATA_SRC.includes('export function sortRulesByLift('))
  })

  it('应提供首屏 snapshot loader', () => {
    assert.ok(DATA_SRC.includes('export async function loadAiDecisionStatsSnapshot()'))
    assert.ok(DATA_SRC.includes("deliveryMode: 'mock'"))
    assert.ok(DATA_SRC.includes('generatedAt: getLatestGeneratedAt(MOCK_RULES)'))
  })
})

describe('AiDecisionStatsPage — 渲染结构', () => {
  it('页面应保留统计卡、图表和排行表', () => {
    assert.ok(PAGE_SRC.includes('总执行次数'))
    assert.ok(PAGE_SRC.includes('综合成功率'))
    assert.ok(PAGE_SRC.includes('AI 决策总数'))
    assert.ok(PAGE_SRC.includes('决策结果分布'))
    assert.ok(PAGE_SRC.includes('决策来源构成'))
    assert.ok(PAGE_SRC.includes('规则效果排行 (按提升率)'))
  })

  it('页面应消费聚合结果而不是在页面内 useState/useMemo', () => {
    assert.ok(!PAGE_SRC.includes('useState'))
    assert.ok(!PAGE_SRC.includes('useMemo'))
    assert.ok(PAGE_SRC.includes('const stats = computeStats(snapshot.rules)'))
    assert.ok(PAGE_SRC.includes('const aiSummary = computeAiDecisionSummary(snapshot.rules)'))
  })
})

describe('AiDecisionStats — 反例与边界', () => {
  it('源码中不应出现 describe.skip', () => {
    assert.ok(!PAGE_SRC.includes('describe.skip'))
    assert.ok(!DATA_SRC.includes('describe.skip'))
  })

  it('源码中不应出现 as any', () => {
    assert.ok(!PAGE_SRC.includes('as any'))
    assert.ok(!DATA_SRC.includes('as any'))
  })
})
