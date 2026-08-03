/**
 * stock-transfer/form/page.test.ts — 调拨单表单 E54 拍平固证
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'stock-transfer-form-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(import.meta.dirname, 'stock-transfer-form-data.ts'), 'utf-8')

describe('stock-transfer/form page — E54 结构', () => {
  it('page 为最小 server wrapper', () => {
    assert.ok(PAGE_SRC.includes('export default async function') || PAGE_SRC.includes('export default function StockTransferFormPage'))
    assert.ok(PAGE_SRC.includes('loadStockTransferFormSnapshot') || PAGE_SRC.includes('StockTransferFormClient'))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
  })

  it('page 不再含权限门禁与 sourceEvidence 模板', () => {
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除')
    assert.ok(!PAGE_SRC.includes('{sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('{sourceEvidence.sourceLabel}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })
})

describe('stock-transfer/form client — 业务壳层下沉', () => {
  it('client 保留表单状态、提交与刷新钩子', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('useSnapshotRefresh'))
    assert.ok(CLIENT_SRC.includes('useState'))
    assert.ok(CLIENT_SRC.includes('<form'))
    assert.ok(CLIENT_SRC.includes('onSubmit'))
  })
})

describe('stock-transfer/form data — 快照合同', () => {
  it('data 暴露 loadStockTransferFormSnapshot', () => {
    assert.ok(DATA_SRC.includes('loadStockTransferFormSnapshot') || DATA_SRC.includes('loadStockTransferForm'))
  })
})
