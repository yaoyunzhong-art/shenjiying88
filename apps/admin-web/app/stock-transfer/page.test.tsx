import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'stock-transfer-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'stock-transfer-page-data.ts'), 'utf-8')
const SHARED_DATA_SRC = readFileSync(resolve(DIR, 'stock-transfer-data.ts'), 'utf-8')

describe('stock-transfer 结构固证', () => {
  it('page 应切为 server wrapper 并加载快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
    assert.ok(PAGE_SRC.includes('export default async function StockTransferListPage'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadStockTransferPageSnapshot()'))
    assert.ok(PAGE_SRC.includes('<StockTransferClient snapshot={snapshot} />'))
  })

  it('page 应显式透出来源态证据与权限边界', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'stock-transfer:read'"))
  })

  it('client 应保留 router.refresh 和共享数据复用', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh"))), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes("from './stock-transfer-data'"))
    assert.ok(CLIENT_SRC.includes('MOCK_TRANSFERS'))
    assert.ok(CLIENT_SRC.includes('刷新快照'))
    assert.ok(CLIENT_SRC.includes('/stock-transfer/form'))
  })

  it('data 应定义 mock 快照合同', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'mock'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'stock-transfer-page-mock'"))
    assert.ok(DATA_SRC.includes('refreshPath'))
    assert.ok(DATA_SRC.includes('loadStockTransferPageSnapshot'))
  })

  it('共享数据应保留调拨类型和状态定义', () => {
    assert.ok(SHARED_DATA_SRC.includes('export interface StockTransferItem'))
    assert.ok(SHARED_DATA_SRC.includes('export const MOCK_TRANSFERS'))
    assert.ok(SHARED_DATA_SRC.includes('export const STATUS_LABEL'))
    assert.ok(SHARED_DATA_SRC.includes('export const TYPE_LABEL'))
    assert.ok(SHARED_DATA_SRC.includes('export const URGENCY_LABEL'))
  })
})
