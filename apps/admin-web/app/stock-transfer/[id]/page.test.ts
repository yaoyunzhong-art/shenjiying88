import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  findStockTransferById,
  loadStockTransferDetailSnapshot,
} from './stock-transfer-detail-data'

describe('Stock transfer detail snapshot contract', () => {
  it('应返回 mock 详情快照与来源态证据', async () => {
    const snapshot = await loadStockTransferDetailSnapshot('t1')
    assert.equal(snapshot.deliveryMode, 'mock')
    assert.equal(snapshot.sourceLabel, 'stock-transfer-detail-mock')
    assert.equal(snapshot.transfer?.id, 't1')
    assert.ok(snapshot.refreshPath.includes('loadStockTransferDetailSnapshot'))
    assert.ok(snapshot.controlPlaneSource.includes('findStockTransferById'))
  })

  it('已知调拨单样本应保留状态与类型信息', () => {
    const transfer = findStockTransferById('t5')
    assert.equal(transfer?.status, 'shipped')
    assert.equal(transfer?.type, 'supply')
    assert.equal(transfer?.sourceStoreName, '中央仓库-华南')
  })

  it('未知调拨单 id 应返回空快照记录', async () => {
    const snapshot = await loadStockTransferDetailSnapshot('missing-id')
    assert.equal(snapshot.transfer, null)
    assert.ok(snapshot.note.includes('未命中调拨单'))
  })
})
