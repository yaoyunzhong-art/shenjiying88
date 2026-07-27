import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'geo-locations-data.ts'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'geo-locations-client.tsx'), 'utf-8')

describe('seo/geo-locations 结构固证', () => {
  it('page 应为 server wrapper 并加载 geo 快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('loadGeoLocationsSnapshot'))
    assert.ok(PAGE_SRC.includes('<GeoLocationsClient snapshot={snapshot} />'))
    assert.ok(PAGE_SRC.includes("requiredPermission: 'dashboard:read'"))
  })

  it('page 应显式透出来源态证据', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'))
    assert.ok(PAGE_SRC.includes('控制面来源:'))
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'))
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'))
  })

  it('data loader 应定义 geo 快照合同与城市统计', () => {
    assert.ok(DATA_SRC.includes('export interface GeoLocationsSnapshotDelivery'))
    assert.ok(DATA_SRC.includes('GEO_ROWS'))
    assert.ok(DATA_SRC.includes('cityCount'))
    assert.ok(DATA_SRC.includes('coverageTier'))
    assert.ok(DATA_SRC.includes('loadGeoLocationsSnapshot'))
  })

  it('client renderer 应保留搜索、城市筛选、经纬度格式化与刷新能力', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes('搜索城市/商圈/地标...'))
    assert.ok(CLIENT_SRC.includes('全部城市'))
    assert.ok(CLIENT_SRC.includes('row.lat.toFixed(4)'))
    assert.ok(CLIENT_SRC.includes('row.lng.toFixed(4)'))
  })
})
