import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import { buildStockOperations, loadStockOperationsSnapshot, OS, OT } from './stock-operations-data'

const pageSource = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf8')

describe('stock-operations snapshot page', () => {
  it('page.tsx 为 snapshot page 并输出来源态证据', () => {
    assert.ok(pageSource.includes('export default async function StockOperationsPage'))
    assert.ok(pageSource.includes('loadStockOperationsSnapshot'))
    assert.ok(pageSource.includes('sourceLabel'))
    assert.ok(pageSource.includes('refreshPath'))
    assert.ok(pageSource.includes('generatedAt'))
  })

  it('接入管理员权限边界', () => {
    assert.ok(!pageSource.includes('AdminPermissionGate'))
    assert.ok(pageSource.includes("requiredPermission: 'stock-operations:read'"))
  })
})

describe('stock-operations snapshot loader', () => {
  it('返回 snapshot delivery mode 与来源标签', async () => {
    const snapshot = await loadStockOperationsSnapshot()
    assert.equal(snapshot.deliveryMode, 'snapshot')
    assert.equal(snapshot.sourceLabel, 'local-stock-operations-snapshot')
    assert.equal(snapshot.operations.length, 20)
  })

  it('类型与状态映射完整', () => {
    assert.equal(Object.keys(OT).length, 7)
    assert.equal(Object.keys(OS).length, 5)
  })

  it('操作单结构字段完整', () => {
    const operations = buildStockOperations()
    assert.ok(operations.every((item) => /^STK-OP-\d{3}$/.test(item.id)))
    assert.ok(operations.every((item) => item.refNo.startsWith('REF-')))
    assert.ok(operations.some((item) => item.status === 'pending_approval'))
  })
})
