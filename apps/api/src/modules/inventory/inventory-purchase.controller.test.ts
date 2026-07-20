import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { InventoryPurchaseController } from './inventory-purchase.controller'

function createController(mockPurchaseService?: Record<string, unknown>, mockOrderService?: Record<string, unknown>) {
  const purchaseService = mockPurchaseService ?? {
    addNote: (...args: unknown[]) => ({ kind: 'addNote', args }),
    getNotes: (...args: unknown[]) => ({ kind: 'getNotes', args }),
    createReturn: (...args: unknown[]) => ({ kind: 'createReturn', args }),
    approveReturn: (...args: unknown[]) => ({ kind: 'approveReturn', args }),
    inspectReturn: (...args: unknown[]) => ({ kind: 'inspectReturn', args }),
    rejectReturn: (...args: unknown[]) => ({ kind: 'rejectReturn', args }),
    refundReturn: (...args: unknown[]) => ({ kind: 'refundReturn', args }),
    exchangeReturn: (...args: unknown[]) => ({ kind: 'exchangeReturn', args }),
    closeReturn: (...args: unknown[]) => ({ kind: 'closeReturn', args }),
    completeReturn: (...args: unknown[]) => ({ kind: 'completeReturn', args }),
    recordPayment: (...args: unknown[]) => ({ kind: 'recordPayment', args }),
    getPayments: (...args: unknown[]) => ({ kind: 'getPayments', args }),
    listPurchaseOrders: (...args: unknown[]) => ({ kind: 'listPurchaseOrders', args }),
    getPurchaseOrder: (...args: unknown[]) => ({ kind: 'getPurchaseOrder', args }),
    updatePurchaseOrder: (...args: unknown[]) => ({ kind: 'updatePurchaseOrder', args }),
    deletePurchaseOrder: (...args: unknown[]) => ({ kind: 'deletePurchaseOrder', args }),
    createSupplier: (...args: unknown[]) => ({ kind: 'createSupplier', args }),
    listSuppliers: (...args: unknown[]) => ({ kind: 'listSuppliers', args }),
    getSupplier: (...args: unknown[]) => ({ kind: 'getSupplier', args }),
    updateSupplier: (...args: unknown[]) => ({ kind: 'updateSupplier', args }),
    getPurchaseStats: (...args: unknown[]) => ({ kind: 'getPurchaseStats', args }),
    getAlerts: (...args: unknown[]) => ({ kind: 'getAlerts', args }),
  }
  const orderService = mockOrderService ?? {
    createWithHistory: (...args: unknown[]) => ({ kind: 'createWithHistory', args }),
    submitWithHistory: (...args: unknown[]) => ({ kind: 'submitWithHistory', args }),
    approveWithHistory: (...args: unknown[]) => ({ kind: 'approveWithHistory', args }),
    rejectWithHistory: (...args: unknown[]) => ({ kind: 'rejectWithHistory', args }),
    placeWithHistory: (...args: unknown[]) => ({ kind: 'placeWithHistory', args }),
    cancelWithHistory: (...args: unknown[]) => ({ kind: 'cancelWithHistory', args }),
    receiveWithHistory: (...args: unknown[]) => ({ kind: 'receiveWithHistory', args }),
    getOrderHistory: (...args: unknown[]) => ({ kind: 'getOrderHistory', args }),
    getTimeline: (...args: unknown[]) => ({ kind: 'getTimeline', args }),
    getBatchSummary: (...args: unknown[]) => ({ kind: 'getBatchSummary', args }),
    batchApprove: (...args: unknown[]) => ({ kind: 'batchApprove', args }),
  }

  return new InventoryPurchaseController(purchaseService as never, orderService as never)
}

const tenantContext = {
  tenantId: 'tenant-001',
  brandId: 'brand-001',
  storeId: 'store-001'
}

const actorContext = {
  actorId: 'actor-001',
  actorType: 'employee-user',
  actorName: '采购审批员',
  roles: ['OPERATIONS'],
  permissions: ['inventory.purchase.write'],
  authenticated: true,
  source: 'headers' as const
}

describe('InventoryPurchaseController', () => {
  describe('actor binding', () => {
    it('createPurchaseOrder 优先绑定当前 actor 到 createdBy', () => {
      const controller = createController()
      const result = controller.createPurchaseOrder(
        tenantContext,
        actorContext,
        {
          supplierName: '供应商A',
          items: [{ productId: 'prod-1', productName: '测试商品', sku: 'SKU-1', quantity: 2, unitPrice: 10 }],
          createdBy: 'body-user'
        }
      ) as unknown as { args: unknown[] }

      assert.equal((result.args[1] as { createdBy: string }).createdBy, '采购审批员')
    })

    it('approveOrder 优先使用当前 actor 覆盖 body approver 字段', () => {
      const controller = createController()
      const result = controller.approveOrder(
        'order-1',
        tenantContext,
        actorContext,
        { approverId: 'body-approver', approverName: 'body-name', comment: 'ok' }
      ) as unknown as { args: unknown[] }

      assert.deepEqual(result.args[2], {
        approverId: 'actor-001',
        approverName: '采购审批员',
        comment: 'ok'
      })
    })

    it('addNote 优先使用当前 actor 作为作者', () => {
      const controller = createController()
      const result = controller.addNote(
        'order-1',
        tenantContext,
        actorContext,
        { content: '补记一条备注', authorId: 'body-author', authorName: 'body-name' }
      ) as unknown as { args: unknown[] }

      assert.deepEqual(result.args[2], {
        content: '补记一条备注',
        authorId: 'actor-001',
        authorName: '采购审批员'
      })
    })

    it('refundReturn 在缺失 actor 时保留原始 body 操作者', () => {
      const controller = createController()
      const result = controller.refundReturn(
        'return-1',
        tenantContext,
        undefined,
        { operatorId: 'body-operator', operatorName: 'body-name', comment: 'manual refund' }
      ) as unknown as { args: unknown[] }

      assert.deepEqual(result.args[2], {
        operatorId: 'body-operator',
        operatorName: 'body-name',
        comment: 'manual refund'
      })
    })
  })

  describe('purchase order CRUD', () => {
    it('listPurchaseOrders 转发到 purchaseService', () => {
      const controller = createController()
      const result = controller.listPurchaseOrders(
        tenantContext,
        { status: 'DRAFT', limit: 10 }
      ) as unknown as { args: unknown[] }

      assert.equal(result.kind, 'listPurchaseOrders')
      assert.deepEqual(result.args[0], tenantContext)
    })

    it('getPurchaseOrder 转发到 purchaseService', () => {
      const controller = createController()
      const result = controller.getPurchaseOrder('po-1', tenantContext) as unknown as { args: unknown[] }

      assert.equal(result.kind, 'getPurchaseOrder')
      assert.equal(result.args[0], 'po-1')
    })

    it('updatePurchaseOrder 转发到 purchaseService', () => {
      const controller = createController()
      const result = controller.updatePurchaseOrder('po-1', tenantContext, {
        supplierName: '新供应商',
        paymentPlan: 'NET30'
      }) as unknown as { args: unknown[] }

      assert.equal(result.kind, 'updatePurchaseOrder')
      assert.equal(result.args[1], tenantContext)
    })

    it('deletePurchaseOrder 转发到 purchaseService', () => {
      const controller = createController()
      const result = controller.deletePurchaseOrder('po-1', tenantContext)

      assert.deepEqual(result, { success: true, message: 'Purchase order po-1 deleted' })
    })
  })

  describe('approval workflow routing', () => {
    it('submitForApproval 转发到 orderService.submitWithHistory', () => {
      const controller = createController()
      const result = controller.submitForApproval(
        'po-1', tenantContext, actorContext, {}
      ) as unknown as { args: unknown[] }

      assert.equal(result.kind, 'submitWithHistory')
      assert.equal(result.args[0], 'po-1')
    })

    it('rejectOrder 转发到 orderService.rejectWithHistory', () => {
      const controller = createController()
      const result = controller.rejectOrder(
        'po-1', tenantContext, actorContext,
        { approverId: 'body-id', approverName: 'body-name', comment: '价格过高' }
      ) as unknown as { args: unknown[] }

      assert.equal(result.kind, 'rejectWithHistory')
      assert.deepEqual(result.args[2], {
        approverId: 'actor-001',
        approverName: '采购审批员',
        comment: '价格过高'
      })
    })

    it('placeOrder 转发到 orderService.placeWithHistory', () => {
      const controller = createController()
      const result = controller.placeOrder(
        'po-1', tenantContext, actorContext, { placedBy: 'body-user' }
      ) as unknown as { args: unknown[] }

      assert.equal(result.kind, 'placeWithHistory')
    })

    it('cancelOrder 转发到 orderService.cancelWithHistory', () => {
      const controller = createController()
      const result = controller.cancelOrder(
        'po-1', tenantContext, actorContext, { cancelledBy: 'user', reason: '取消' }
      ) as unknown as { args: unknown[] }

      assert.equal(result.kind, 'cancelWithHistory')
    })
  })

  describe('payments routing', () => {
    it('recordPayment 转发到 purchaseService', () => {
      const controller = createController()
      const result = controller.recordPayment(
        tenantContext, actorContext,
        { purchaseOrderId: 'po-1', amount: 1000, paymentMethod: 'BANK_TRANSFER' }
      ) as unknown as { args: unknown[] }

      assert.equal(result.kind, 'recordPayment')
    })

    it('getPayments 转发到 purchaseService', () => {
      const controller = createController()
      const result = controller.getPayments('po-1', tenantContext) as unknown as { args: unknown[] }

      assert.equal(result.kind, 'getPayments')
      assert.equal(result.args[0], 'po-1')
    })
  })

  describe('notes routing', () => {
    it('getNotes 转发到 purchaseService', () => {
      const controller = createController()
      const result = controller.getNotes('po-1', tenantContext) as unknown as { args: unknown[] }

      assert.equal(result.kind, 'getNotes')
    })
  })

  describe('returns routing', () => {
    it('createReturn 转发到 purchaseService', () => {
      const controller = createController()
      const result = controller.createReturn(
        tenantContext, actorContext,
        { purchaseOrderId: 'po-1', items: [{ productId: 'p1', quantity: 1, unitPrice: 100, reason: 'DAMAGED' }] }
      ) as unknown as { args: unknown[] }

      assert.equal(result.kind, 'createReturn')
    })

    it('approveReturn 转发到 purchaseService', () => {
      const controller = createController()
      const result = controller.approveReturn(
        'ret-1', tenantContext, actorContext,
        { approverId: 'body-id', approverName: 'body-name' }
      ) as unknown as { args: unknown[] }

      assert.equal(result.kind, 'approveReturn')
    })

    it('inspectReturn 转发到 purchaseService', () => {
      const controller = createController()
      const result = controller.inspectReturn(
        'ret-1', tenantContext, actorContext,
        { inspectorId: 'body-id', inspectorName: 'body-name' }
      ) as unknown as { args: unknown[] }

      assert.equal(result.kind, 'inspectReturn')
    })

    it('rejectReturn 转发到 purchaseService', () => {
      const controller = createController()
      const result = controller.rejectReturn(
        'ret-1', tenantContext, actorContext,
        { reviewerId: 'body-id', reviewerName: 'body-name', comment: '不符合条件' }
      ) as unknown as { args: unknown[] }

      assert.equal(result.kind, 'rejectReturn')
    })

    it('exchangeReturn 转发到 purchaseService', () => {
      const controller = createController()
      const result = controller.exchangeReturn(
        'ret-1', tenantContext, actorContext, { operatorName: 'ops' }
      ) as unknown as { args: unknown[] }

      assert.equal(result.kind, 'exchangeReturn')
    })

    it('closeReturn 转发到 purchaseService', () => {
      const controller = createController()
      const result = controller.closeReturn(
        'ret-1', tenantContext, actorContext, {}
      ) as unknown as { args: unknown[] }

      assert.equal(result.kind, 'closeReturn')
    })

    it('completeReturn 转发到 purchaseService.closeReturn', () => {
      const controller = createController()
      const result = controller.completeReturn('ret-1', tenantContext) as unknown as { args: unknown[] }

      assert.equal(result.kind, 'completeReturn')
    })
  })

  describe('suppliers routing', () => {
    it('createSupplier 转发到 purchaseService', () => {
      const controller = createController()
      const result = controller.createSupplier(
        tenantContext,
        { code: 'SUP001', name: '供应商' }
      ) as unknown as { args: unknown[] }

      assert.equal(result.kind, 'createSupplier')
    })

    it('listSuppliers 转发到 purchaseService', () => {
      const controller = createController()
      const result = controller.listSuppliers(tenantContext, {}) as unknown as { args: unknown[] }

      assert.equal(result.kind, 'listSuppliers')
    })

    it('getSupplier 转发到 purchaseService', () => {
      const controller = createController()
      const result = controller.getSupplier('supp-1', tenantContext) as unknown as { args: unknown[] }

      assert.equal(result.kind, 'getSupplier')
    })

    it('updateSupplier 转发到 purchaseService', () => {
      const controller = createController()
      const result = controller.updateSupplier(
        'supp-1', tenantContext, { name: '新名称', status: 'INACTIVE' }
      ) as unknown as { args: unknown[] }

      assert.equal(result.kind, 'updateSupplier')
    })
  })

  describe('stats & alerts', () => {
    it('getStats 转发到 purchaseService', () => {
      const controller = createController()
      const result = controller.getStats(tenantContext) as unknown as { args: unknown[] }

      assert.equal(result.kind, 'getPurchaseStats')
    })

    it('getAlerts 转发到 purchaseService', () => {
      const controller = createController()
      const result = controller.getAlerts(tenantContext) as unknown as { args: unknown[] }

      assert.equal(result.kind, 'getAlerts')
    })
  })

  describe('order history & timeline', () => {
    it('getOrderHistory 转发到 orderService', () => {
      const controller = createController()
      const result = controller.getOrderHistory('po-1', tenantContext) as unknown as { args: unknown[] }

      assert.equal(result.kind, 'getOrderHistory')
    })

    it('getOrderTimeline 转发到 orderService', () => {
      const controller = createController()
      const result = controller.getOrderTimeline('po-1', tenantContext) as unknown as { args: unknown[] }

      assert.equal(result.kind, 'getTimeline')
    })

    it('getBatchSummary 转发到 orderService', () => {
      const controller = createController()
      const result = controller.getBatchSummary(
        tenantContext, { orderIds: ['po-1', 'po-2'] }
      ) as unknown as { args: unknown[] }

      assert.equal(result.kind, 'getBatchSummary')
    })

    it('batchApprove 转发到 orderService', () => {
      const controller = createController()
      const result = controller.batchApprove(
        tenantContext, actorContext,
        { orderIds: ['po-1', 'po-2'], approverId: 'body-id', approverName: 'body-name' }
      ) as unknown as { args: unknown[] }

      assert.equal(result.kind, 'batchApprove')
    })
  })

  describe('receive order', () => {
    it('receiveOrder 转发到 orderService', () => {
      const controller = createController()
      const result = controller.receiveOrder(
        'po-1', tenantContext, actorContext,
        { items: [{ productId: 'p1', receivedQuantity: 10, damagedQuantity: 0 }] }
      ) as unknown as { args: unknown[] }

      assert.equal(result.kind, 'receiveWithHistory')
    })
  })
})
