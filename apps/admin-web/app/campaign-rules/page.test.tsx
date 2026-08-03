import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'campaign-rules-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'campaign-rules-data.ts'), 'utf-8')
})

describe('CampaignRulesPage — 服务端壳层', () => {
  it('页面应加载快照并渲染客户端组件', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadCampaignRulesSnapshot()'))
    assert.ok(PAGE_SRC.includes("import CampaignRulesClient from './campaign-rules-client'"))
    assert.ok(PAGE_SRC.includes('<CampaignRulesClient snapshot={snapshot} />'))
  })

  it('页面应固证来源态证据', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })
})

describe('CampaignRulesData — 快照合同', () => {
  it('应定义 snapshot 合同与默认样本', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'snapshot'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'local-campaign-rules-snapshot'"))
    assert.ok(DATA_SRC.includes('export const defaultCampaignRules'))
    assert.ok(DATA_SRC.includes('满200减30'))
    assert.ok(DATA_SRC.includes('新会员首单返券'))
  })

  it('应提供统计与加载函数', () => {
    assert.ok(DATA_SRC.includes('export function computeCampaignRuleStats'))
    assert.ok(DATA_SRC.includes('export async function loadCampaignRulesSnapshot'))
  })
})

describe('CampaignRulesClient — 客户端渲染层', () => {
  it('应声明 use client 并支持 router.refresh()', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes('useTransition') || CLIENT_SRC.includes('useSnapshotRefresh') || CLIENT_SRC.includes('isRefreshing')), 'E54: useTransition OR useSnapshotRefresh')
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh")), "E54: router.refresh() OR handleRefresh()")
  })

  it('应保留筛选和演练动作', () => {
    assert.ok(CLIENT_SRC.includes('typeFilter'))
    assert.ok(CLIENT_SRC.includes('statusFilter'))
    assert.ok(CLIENT_SRC.includes('handleToggle'))
    assert.ok(CLIENT_SRC.includes('handleClone'))
    assert.ok(CLIENT_SRC.includes('创建本地草稿'))
  })
})
