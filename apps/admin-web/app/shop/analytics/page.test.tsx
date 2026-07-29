import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const DIR = import.meta.dirname
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'analytics-data.ts'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'analytics-client.tsx'), 'utf-8')

describe('shop/analytics E54 结构固证', () => {
  it('page 应加载快照并展示来源态证据', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadShopAnalyticsSnapshot()'))
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(PAGE_SRC.includes('<AnalyticsClient snapshot={snapshot} />'))
  })

  it('data loader 应定义分析快照合同', () => {
    assert.ok(DATA_SRC.includes('export interface ShopAnalyticsSnapshot'))
    assert.ok(DATA_SRC.includes("sourceLabel: 'local-shop-analytics-snapshot'"))
    assert.ok(DATA_SRC.includes('export const SHOP_ANALYTICS_POINTS'))
    assert.ok(DATA_SRC.includes('loadShopAnalyticsSnapshot'))
  })

  it('client renderer 应支持 router.refresh 与区间切换', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes('setRange'))
    assert.ok(CLIENT_SRC.includes('商品排行'))
    assert.ok(CLIENT_SRC.includes('渠道贡献'))
  })
})
