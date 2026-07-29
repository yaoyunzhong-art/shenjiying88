import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'venue-ranking-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'venue-ranking-data.ts'), 'utf-8')
})

describe('venue-ranking — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function VenueRankingPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载排名快照并展示来源态', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadVenueRankingSnapshot()'))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'))
    assert.ok(!PAGE_SRC.includes('sourceEvidence'))
  })
})

describe('venue-ranking-data — 快照合同', () => {
  it('应定义场馆排名快照结构与 fallback 样本', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('records: VenueRecord[]'))
    assert.ok(DATA_SRC.includes('export const MOCK_VENUE_RECORDS'))
    assert.ok(DATA_SRC.includes('computeVenueRankingStats'))
    assert.ok(DATA_SRC.includes('sortVenueRecords'))
  })

  it('应尝试请求实时 venue-ranking 接口并保留 fallback', () => {
    assert.ok(DATA_SRC.includes("new URL('reports/venue-ranking', resolveVenueRankingApiBaseUrl())"))
    assert.ok(DATA_SRC.includes('loadVenueRankingSnapshot -> reports/venue-ranking'))
    assert.ok(DATA_SRC.includes('loadVenueRankingSnapshot -> MOCK_VENUE_RECORDS fallback'))
    assert.ok(DATA_SRC.includes('场馆排名实时接口不可达，已切换到 fallback 样本数据。'))
  })
})

describe('venue-ranking-client — 客户端渲染', () => {
  it('客户端组件应声明 use client 并消费 snapshot', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('snapshot: VenueRankingSnapshotDelivery'))
    assert.ok(CLIENT_SRC.includes('snapshot.error'))
    assert.ok(CLIENT_SRC.includes('VENUE_RANKING_SORT_OPTIONS'))
  })

  it('客户端组件应提供刷新能力与排序筛选', () => {
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes('useTransition') || CLIENT_SRC.includes('useSnapshotRefresh') || CLIENT_SRC.includes('isRefreshing')), 'E54: useTransition OR useSnapshotRefresh')
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh"))), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes('filterVenueRecords'))
    assert.ok(CLIENT_SRC.includes('sortVenueRecords'))
  })

  it('客户端组件应保留标题、统计和场馆排名表格', () => {
    assert.ok(CLIENT_SRC.includes('场馆排名报表'))
    assert.ok(CLIENT_SRC.includes('场馆排名'))
    assert.ok(CLIENT_SRC.includes('最高评分'))
    assert.ok(CLIENT_SRC.includes('暂无数据'))
  })
})
