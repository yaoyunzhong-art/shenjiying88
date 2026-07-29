import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'promotions-adjustments-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'promotions-adjustments-data.ts'), 'utf-8')
})

describe('promotions-adjustments — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function PromotionsAdjustmentsPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载促销快照并展示来源态', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadPromotionsAdjustmentsSnapshot()'))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'))
    assert.ok(!PAGE_SRC.includes('sourceEvidence'))
  })
})

describe('promotions-adjustments-data — 快照合同', () => {
  it('应定义促销快照结构与 fallback 样本', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('records: PromotionAdjustmentRecord[]'))
    assert.ok(DATA_SRC.includes('export const MOCK_PROMOTION_ADJUSTMENT_RECORDS'))
    assert.ok(DATA_SRC.includes('computePromotionsAdjustmentsStats'))
    assert.ok(DATA_SRC.includes('filterPromotionAdjustmentRecords'))
  })

  it('应尝试请求实时 promotions-adjustments 接口并保留 fallback', () => {
    assert.ok(DATA_SRC.includes("new URL('reports/promotions-adjustments', resolvePromotionsAdjustmentsApiBaseUrl())"))
    assert.ok(DATA_SRC.includes('loadPromotionsAdjustmentsSnapshot -> reports/promotions-adjustments'))
    assert.ok(DATA_SRC.includes('loadPromotionsAdjustmentsSnapshot -> MOCK_PROMOTION_ADJUSTMENT_RECORDS fallback'))
    assert.ok(DATA_SRC.includes('促销调整实时接口不可达，已切换到 fallback 样本数据。'))
  })
})

describe('promotions-adjustments-client — 客户端渲染', () => {
  it('客户端组件应声明 use client 并消费 snapshot', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('snapshot: PromotionsAdjustmentsSnapshotDelivery'))
    assert.ok(CLIENT_SRC.includes('snapshot.error'))
    assert.ok(CLIENT_SRC.includes('PROMOTION_ADJUSTMENT_STATUSES'))
  })

  it('客户端组件应提供刷新能力与筛选', () => {
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes('useTransition') || CLIENT_SRC.includes('useSnapshotRefresh') || CLIENT_SRC.includes('isRefreshing')), 'E54: useTransition OR useSnapshotRefresh')
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh")), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes('filterPromotionAdjustmentRecords'))
    assert.ok(CLIENT_SRC.includes('搜索活动名称'))
  })

  it('客户端组件应保留标题、统计和活动列表', () => {
    assert.ok(CLIENT_SRC.includes('促销调整报表'))
    assert.ok(CLIENT_SRC.includes('进行中活动'))
    assert.ok(CLIENT_SRC.includes('活动列表'))
    assert.ok(CLIENT_SRC.includes('暂无数据'))
  })
})
