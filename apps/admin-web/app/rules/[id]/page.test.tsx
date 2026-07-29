import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'rule-detail-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'rule-detail-data.ts'), 'utf-8')
})

describe('RuleDetailPage — 服务端壳层', () => {
  it('应为 async server component 并加载快照', () => {
    assert.ok(PAGE_SRC.includes('export default async function RuleDetailPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadRuleDetailSnapshot(id)'))
    assert.ok(PAGE_SRC.includes("import RuleDetailClient from './rule-detail-client'"))
  })

  it('应渲染权限门禁、来源态证据和客户端组件', () => {
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'rules:id:read'"))
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'))
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'))
    assert.ok(PAGE_SRC.includes('<RuleDetailClient snapshot={snapshot} />'))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })
})

describe('RuleDetailData — 快照合同', () => {
  it('应定义 mock 快照合同与加载器', () => {
    assert.ok(DATA_SRC.includes("sourceLabel: 'rules-detail-mock'"))
    assert.ok(DATA_SRC.includes('export interface RuleDetailSnapshotDelivery'))
    assert.ok(DATA_SRC.includes('export function buildRuleDetail'))
    assert.ok(DATA_SRC.includes('export async function loadRuleDetailSnapshot'))
  })

  it('应保留规则约束、信号和时间线样本', () => {
    assert.ok(DATA_SRC.includes('guardrails: string[]'))
    assert.ok(DATA_SRC.includes('recentSignals: string[]'))
    assert.ok(DATA_SRC.includes('timeline: RuleTimelineItem[]'))
    assert.ok(DATA_SRC.includes('信用评分规则'))
  })
})

describe('RuleDetailClient — 客户端渲染层', () => {
  it('应声明 use client 并支持 router.refresh', () => {
    assert.ok(CLIENT_SRC.includes('"use client"'))
    assert.ok(CLIENT_SRC.includes('useRouter'))
    assert.ok(CLIENT_SRC.includes('useTransition'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
  })

  it('应保留规则配置、近期信号和时间线区块', () => {
    assert.ok(CLIENT_SRC.includes('规则配置'))
    assert.ok(CLIENT_SRC.includes('防呆约束'))
    assert.ok(CLIENT_SRC.includes('近期信号'))
    assert.ok(CLIENT_SRC.includes('时间线'))
  })
})
