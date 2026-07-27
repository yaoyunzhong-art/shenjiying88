import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const DIR = import.meta.dirname
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'shop-inventory-data.ts'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'shop-inventory-client.tsx'), 'utf-8')

describe('shop/inventory E54 结构固证', () => {
  it('page 应加载库存快照并展示来源态证据', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadShopInventorySnapshot()'))
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('<ShopInventoryClient snapshot={snapshot} />'))
  })

  it('data loader 应定义库存快照合同', () => {
    assert.ok(DATA_SRC.includes('export interface ShopInventorySnapshot'))
    assert.ok(DATA_SRC.includes("sourceLabel: 'local-shop-inventory-snapshot'"))
    assert.ok(DATA_SRC.includes('export const SHOP_INVENTORY_ITEMS'))
  })

  it('client renderer 应支持 router.refresh 与补货动作', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes('handleRestock'))
    assert.ok(CLIENT_SRC.includes('补货 +20'))
  })
})
