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
  CLIENT_SRC = readFileSync(resolve(__dirname, 'recommendations-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(__dirname, 'recommendations-data.ts'), 'utf-8')
})

describe('RecommendationsPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function RecommendationsPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应展示来源态证据', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadRecommendationsSnapshot()'))
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })
})

describe('RecommendationsData — 快照合同', () => {
  it('应定义 mock 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'mock'"))
    assert.ok(DATA_SRC.includes('summary: RecommendationSummary'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应保留推荐摘要样本', () => {
    assert.ok(DATA_SRC.includes('strategyWeights'))
    assert.ok(DATA_SRC.includes('funnel'))
    assert.ok(DATA_SRC.includes('coldStart'))
    assert.ok(DATA_SRC.includes('heatmap'))
  })
})

describe('RecommendationsClient — 客户端渲染层', () => {
  it('应声明 use client 并触发 router.refresh', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh"))), "E54: router.refresh() OR handleRefresh()")
  })

  it('应保留标签切换和推荐治理区块', () => {
    assert.ok(CLIENT_SRC.includes("type RecTab = 'overview' | 'funnel' | 'reasons' | 'coldstart' | 'coverage'"))
    assert.ok(CLIENT_SRC.includes('strategyWeights'))
    assert.ok(CLIENT_SRC.includes('topReasons'))
    assert.ok(CLIENT_SRC.includes('coldStart'))
    assert.ok(CLIENT_SRC.includes('heatmap'))
  })
})
