import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { InventoryPurchaseController } from './inventory-purchase.controller'

function createController() {
  const purchaseService = {
    addNote: (...args: unknown[]) => ({ kind: 'addNote', args }),
    createReturn: (...args: unknown[]) => ({ kind: 'createReturn', args }),
    approveReturn: (...args: unknown[]) => ({ kind: 'approveReturn', args }),
    inspectReturn: (...args: unknown[]) => ({ kind: 'inspectReturn', args }),
    rejectReturn: (...args: unknown[]) => ({ kind: 'rejectReturn', args }),
    refundReturn: (...args: unknown[]) => ({ kind: 'refundReturn', args }),
    exchangeReturn: (...args: unknown[]) => ({ kind: 'exchangeReturn', args }),
    closeReturn: (...args: unknown[]) => ({ kind: 'closeReturn', args }),
    recordPayment: (...args: unknown[]) => ({ kind: 'recordPayment', args })
  }
  const orderService = {
    createWithHistory: (...args: unknown[]) => ({ kind: 'createWithHistory', args }),
    submitWithHistory: (...args: unknown[]) => ({ kind: 'submitWithHistory', args }),
    approveWithHistory: (...args: unknown[]) => ({ kind: 'approveWithHistory', args }),
    rejectWithHistory: (...args: unknown[]) => ({ kind: 'rejectWithHistory', args }),
    placeWithHistory: (...args: unknown[]) => ({ kind: 'placeWithHistory', args }),
    cancelWithHistory: (...args: unknown[]) => ({ kind: 'cancelWithHistory', args }),
    receiveWithHistory: (...args: unknown[]) => ({ kind: 'receiveWithHistory', args }),
    batchApprove: (...args: unknown[]) => ({ kind: 'batchApprove', args })
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

describe('inventory purchase controller actor binding', () => {
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
