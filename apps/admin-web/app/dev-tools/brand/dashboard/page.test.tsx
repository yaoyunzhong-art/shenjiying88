import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(import.meta.dirname, 'brand-dashboard-data.ts'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'brand-dashboard-client.tsx'), 'utf-8')

describe('dev-tools/brand/dashboard page', () => {
  it('page 已迁移为 E54 wrapper', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes("import { loadBrandDashboardSnapshot } from './brand-dashboard-data'"))
    assert.ok(PAGE_SRC.includes('<BrandDashboardClient snapshot={snapshot} />'))
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })

  it('data 固证 mock 来源', () => {
    assert.ok(DATA_SRC.includes('export async function loadBrandDashboardSnapshot'))
    assert.ok(DATA_SRC.includes("sourceLabel: 'dev-tools-brand-dashboard-mock'"))
    assert.ok(DATA_SRC.includes('revenue: REVENUE'))
    assert.ok(DATA_SRC.includes('brandMetrics: BRAND_METRICS'))
  })

  it('client 保留看板与刷新交互', () => {
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh"))), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes('营收趋势'))
    assert.ok(CLIENT_SRC.includes('品牌社媒表现'))
    assert.ok(CLIENT_SRC.includes('Select'))
  })
})
