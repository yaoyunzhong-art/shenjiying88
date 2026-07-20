/**
 * purchase-order.controller.test.ts — P-37 采购订单流转 Controller 测试
 *
 * 验证 PurchaseOrderController 端点路由是否正确转发到 PurchaseOrderService。
 */

import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { PurchaseOrderController } from './purchase-order.controller'

function createController() {
  const orderService = {
    getOrderHistory: (...args: unknown[]) => ({ kind: 'getOrderHistory', args }),
    getTimeline: (...args: unknown[]) => ({ kind: 'getTimeline', args }),
    getBatchSummary: (...args: unknown[]) => ({ kind: 'getBatchSummary', args }),
    batchApprove: (...args: unknown[]) => ({ kind: 'batchApprove', args }),
  }

  return new PurchaseOrderController(orderService as never)
}

const tenantContext = {
  tenantId: 'tenant-001',
  brandId: 'brand-001',
  storeId: 'store-001'
}

describe('PurchaseOrderController', () => {
  it('getOrderHistory 转发到 orderService', () => {
    const controller = createController()
    const result = controller.getOrderHistory('po-1', tenantContext) as unknown as { args: unknown[] }

    assert.equal(result.kind, 'getOrderHistory')
    assert.equal(result.args[0], 'po-1')
    assert.deepEqual(result.args[1], tenantContext)
  })

  it('getOrderTimeline 转发到 orderService', () => {
    const controller = createController()
    const result = controller.getOrderTimeline('po-1', tenantContext) as unknown as { args: unknown[] }

    assert.equal(result.kind, 'getTimeline')
    assert.equal(result.args[0], 'po-1')
  })

  it('getBatchSummary 转发到 orderService', () => {
    const controller = createController()
    const result = controller.getBatchSummary(
      tenantContext, { orderIds: ['po-1', 'po-2'] }
    ) as unknown as { args: unknown[] }

    assert.equal(result.kind, 'getBatchSummary')
    assert.deepEqual(result.args[0], ['po-1', 'po-2'])
  })

  it('batchApprove 转发到 orderService', () => {
    const controller = createController()
    const result = controller.batchApprove(
      tenantContext,
      { orderIds: ['po-1', 'po-2'], approverId: 'admin', approverName: 'Admin', comment: 'batch ok' }
    ) as unknown as { args: unknown[] }

    assert.equal(result.kind, 'batchApprove')
    assert.deepEqual(result.args[2], {
      approverId: 'admin',
      approverName: 'Admin',
      comment: 'batch ok'
    })
  })
})
