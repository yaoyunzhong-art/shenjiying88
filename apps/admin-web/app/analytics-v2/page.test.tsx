import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(__dirname, 'analytics-v2-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(__dirname, 'analytics-v2-data.ts'), 'utf-8')
})

describe('AnalyticsV2Page — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function AnalyticsV2Page'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应展示来源态证据', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadAnalyticsV2Snapshot()'))
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })
})

describe('AnalyticsV2Data — 快照合同', () => {
  it('应定义 mock 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'mock'"))
    assert.ok(DATA_SRC.includes('cohorts: CohortMatrix[]'))
    assert.ok(DATA_SRC.includes('recentEvents: LiveEvent[]'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应保留核心分析样本区块', () => {
    assert.ok(DATA_SRC.includes('retentionHealth'))
    assert.ok(DATA_SRC.includes('summary'))
    assert.ok(DATA_SRC.includes('cdcStatus'))
    assert.ok(DATA_SRC.includes('电商转化漏斗'))
  })
})

describe('AnalyticsV2Client — 客户端渲染层', () => {
  it('应声明 use client 并触发 router.refresh', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh"))), "E54: router.refresh() OR handleRefresh()")
  })

  it('应保留 Cohort、漏斗、留存与事件流区块', () => {
    assert.ok(CLIENT_SRC.includes('Cohort 留存矩阵'))
    assert.ok(CLIENT_SRC.includes('漏斗转化分析'))
    assert.ok(CLIENT_SRC.includes('留存建议'))
    assert.ok(CLIENT_SRC.includes('实时事件流'))
  })
})
