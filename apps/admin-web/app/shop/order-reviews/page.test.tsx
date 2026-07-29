import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const DIR = import.meta.dirname
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'order-reviews-data.ts'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'order-reviews-client.tsx'), 'utf-8')

describe('shop/order-reviews E54 结构固证', () => {
  it('page 应加载评价快照并展示来源态证据', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadOrderReviewsSnapshot()'))
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(PAGE_SRC.includes('<OrderReviewsClient snapshot={snapshot} />'))
  })

  it('data loader 应定义评价快照合同', () => {
    assert.ok(DATA_SRC.includes('export interface OrderReviewsSnapshot'))
    assert.ok(DATA_SRC.includes("sourceLabel: 'local-order-reviews-snapshot'"))
    assert.ok(DATA_SRC.includes('export const ORDER_REVIEW_RECORDS'))
  })

  it('client renderer 应支持 router.refresh 与回复动作', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh")), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes('handleReply'))
    assert.ok(CLIENT_SRC.includes('隐藏评价'))
  })
})
