import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const DIR = import.meta.dirname
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'fulfillment-data.ts'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'fulfillment-client.tsx'), 'utf-8')

describe('shop/fulfillment E54 结构固证', () => {
  it('page 应加载履约快照并展示来源态证据', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadFulfillmentSnapshot()'))
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(PAGE_SRC.includes('<FulfillmentClient snapshot={snapshot} />'))
  })

  it('data loader 应定义履约快照合同', () => {
    assert.ok(DATA_SRC.includes('export interface FulfillmentSnapshot'))
    assert.ok(DATA_SRC.includes("sourceLabel: 'local-fulfillment-snapshot'"))
    assert.ok(DATA_SRC.includes('export const FULFILLMENT_ORDERS'))
  })

  it('client renderer 应支持 router.refresh 与状态推进', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh"))), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes('handleAdvanceStatus'))
    assert.ok(CLIENT_SRC.includes('推进状态'))
  })
})
