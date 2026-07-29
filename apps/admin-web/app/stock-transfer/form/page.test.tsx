import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'stock-transfer-form-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'stock-transfer-form-data.ts'), 'utf-8')

describe('stock-transfer/form 结构固证', () => {
  it('page 应切为 server wrapper 并加载快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
    assert.ok(PAGE_SRC.includes('export default async function StockTransferFormPage'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadStockTransferFormSnapshot()'))
    assert.ok(PAGE_SRC.includes('<StockTransferFormClient snapshot={snapshot} />'))
  })

  it('page 应显式透出来源态证据与权限边界', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'))
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'))
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'stock-transfer:form:read'"))
  })

  it('client 应保留 router.refresh 和表单交互', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes('handleSubmit'))
    assert.ok(CLIENT_SRC.includes('提交调拨'))
    assert.ok(CLIENT_SRC.includes('snapshot.stores.map'))
  })

  it('data 应定义 mock 快照合同与门店选项', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'mock'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'stock-transfer-form-mock'"))
    assert.ok(DATA_SRC.includes('STORE_OPTIONS'))
    assert.ok(DATA_SRC.includes('stores: STORE_OPTIONS'))
    assert.ok(DATA_SRC.includes('loadStockTransferFormSnapshot'))
  })
})
