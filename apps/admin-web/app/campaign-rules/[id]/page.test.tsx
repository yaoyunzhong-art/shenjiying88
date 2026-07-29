import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'campaign-rule-detail-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'campaign-rule-detail-data.ts'), 'utf-8')
})

describe('CampaignRuleDetailPage — 服务端壳层', () => {
  it('详情页应读取 params 并加载快照', () => {
    assert.ok(PAGE_SRC.includes('params: Promise<{ id: string }>'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadCampaignRuleDetailSnapshot(id)'))
    assert.ok(PAGE_SRC.includes('notFound()'))
  })

  it('详情页应展示来源态证据', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(PAGE_SRC.includes('CampaignRuleDetailClient snapshot={snapshot}'))
  })
})

describe('CampaignRuleDetailData — 快照合同', () => {
  it('应定义 detail snapshot 合同', () => {
    assert.ok(DATA_SRC.includes("sourceLabel: 'local-campaign-rule-detail-snapshot'"))
    assert.ok(DATA_SRC.includes('guardrails: string[]'))
    assert.ok(DATA_SRC.includes('timeline: CampaignRuleTimelineItem[]'))
    assert.ok(DATA_SRC.includes('export async function loadCampaignRuleDetailSnapshot'))
  })

  it('应包含默认详情样本', () => {
    assert.ok(DATA_SRC.includes('满200减30'))
    assert.ok(DATA_SRC.includes('新会员首单返券'))
    assert.ok(DATA_SRC.includes('marketing'))
    assert.ok(DATA_SRC.includes('formatBudget'))
  })
})

describe('CampaignRuleDetailClient — 客户端渲染层', () => {
  it('应声明 use client 并支持刷新', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok(CLIENT_SRC.includes('useTransition'))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()")
  })

  it('应保留演练动作与详情区块', () => {
    assert.ok(CLIENT_SRC.includes('handlePromote'))
    assert.ok(CLIENT_SRC.includes('handleArchive'))
    assert.ok(CLIENT_SRC.includes('防呆约束'))
    assert.ok(CLIENT_SRC.includes('近期信号'))
    assert.ok(CLIENT_SRC.includes('时间线'))
  })
})
