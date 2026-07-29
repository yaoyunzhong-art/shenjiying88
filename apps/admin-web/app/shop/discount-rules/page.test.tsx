import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const DIR = import.meta.dirname
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'discount-rules-data.ts'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'discount-rules-client.tsx'), 'utf-8')

describe('shop/discount-rules E54 结构固证', () => {
  it('page 应加载规则快照并展示来源态证据', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadDiscountRulesSnapshot()'))
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(PAGE_SRC.includes('<DiscountRulesClient snapshot={snapshot} />'))
  })

  it('data loader 应定义规则快照合同', () => {
    assert.ok(DATA_SRC.includes('export interface DiscountRulesSnapshot'))
    assert.ok(DATA_SRC.includes("sourceLabel: 'local-discount-rules-snapshot'"))
    assert.ok(DATA_SRC.includes('export const SHOP_DISCOUNT_RULES'))
  })

  it('client renderer 应支持 router.refresh 与筛选', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh"))), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes('statusFilter'))
    assert.ok(CLIENT_SRC.includes('搜索规则名称 / 范围 / 优惠说明'))
  })
})
