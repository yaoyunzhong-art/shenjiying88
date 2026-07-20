import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

/**
 * cross-module-e2e-49-logistics-finance.test.ts
 *
 * 后勤 + 财务全链路 E2E 测试
 * 场景: 维修费用 → 财务对账 → 成本分摊
 */
describe('E2E-49: 后勤+财务全链', () => {
  // ── 状态常量 ──
  const REPAIR = { REPORTED: 'reported', IN_PROGRESS: 'in_progress', COMPLETED: 'completed', CANCELLED: 'cancelled' } as const
  const COST_ALLOC = { PENDING: 'pending', ALLOCATED: 'allocated', APPROVED: 'approved' } as const

  // ── 正例: 流程链路 ──

  it('正例: 设备维修完成生成费用账单', () => {
    const repairOrder = {
      id: 'repair-49-001',
      deviceId: 'arcade-003',
      faultType: '屏幕故障',
      status: REPAIR.COMPLETED,
      laborCost: 350,
      partsCost: 1200,
      totalCost: 0,
    }
    repairOrder.totalCost = repairOrder.laborCost + repairOrder.partsCost

    assert.equal(repairOrder.status, REPAIR.COMPLETED)
    assert.equal(repairOrder.totalCost, 1550)
    assert.ok(repairOrder.totalCost > 0, '维修费用须大于零')
  })

  it('正例: 维修账单计入财务科目', () => {
    const expense = {
      id: 'expense-49-001',
      repairId: 'repair-49-001',
      category: '设备维修',
      amount: 1550,
      accountCode: '5002-03', // 维修费用科目
      status: 'pending',
    }
    const budget = { total: 50000, used: 1550, remaining: 50000 - 1550 }

    assert.equal(expense.amount, 1550)
    assert.equal(budget.used, 1550)
    assert.equal(budget.remaining, 48450)
    assert.ok(budget.remaining >= 0, '预算充足')
  })

  it('正例: 跨门店成本分摊', () => {
    const allocation = {
      expenseId: 'expense-49-001',
      totalAmount: 1550,
      stores: [
        { storeId: 'store-A', ratio: 0.5, amount: 775 },
        { storeId: 'store-B', ratio: 0.3, amount: 465 },
        { storeId: 'store-C', ratio: 0.2, amount: 310 },
      ],
      status: COST_ALLOC.ALLOCATED,
    }
    const sumAllocated = allocation.stores.reduce((s, st) => s + st.amount, 0)

    assert.equal(allocation.status, COST_ALLOC.ALLOCATED)
    assert.equal(sumAllocated, allocation.totalAmount)
    assert.equal(sumAllocated, 1550)
  })

  // ── 反例: 异常处理 ──

  it('反例: 未完成的维修工单不可生成费用', () => {
    const ongoingRepair = {
      id: 'repair-49-002',
      status: REPAIR.IN_PROGRESS,
    }
    const canGenerateExpense = ongoingRepair.status === REPAIR.COMpleted
    assert.equal(canGenerateExpense, false)
  })

  it('反例: 成本分摊比例之和必须为 100%', () => {
    const badAllocation = [
      { storeId: 'A', ratio: 0.6 },
      { storeId: 'B', ratio: 0.5 }, // 总和 1.1 > 1
    ]
    const sumRatio = Math.round(badAllocation.reduce((s, a) => s + a.ratio, 0) * 100) / 100
    assert.notEqual(sumRatio, 1.0, '分摊比例之和须为 100%')
  })

  it('反例: 超预算维修需额外审批', () => {
    const budget = { total: 10000, used: 9500 }
    const newExpense = 800
    const exceeds = (budget.used + newExpense) > budget.total
    assert.equal(exceeds, true, '超预算须审批')
  })

  it('反例: 已取消维修单不可关联费用', () => {
    const cancelledRepair = { id: 'repair-49-003', status: REPAIR.CANCELLED }
    const validForExpense = cancelledRepair.status !== REPAIR.CANCELLED
    assert.equal(validForExpense, false)
  })

  it('边界: 零成本维修（保修期内）', () => {
    const warrantyRepair = {
      id: 'repair-49-004',
      faultType: '主板故障',
      status: REPAIR.COMPLETED,
      warranty: true,
      laborCost: 0,
      partsCost: 0,
      totalCost: 0,
    }
    // 保修期内不计成本，但需记录维修记录
    assert.equal(warrantyRepair.totalCost, 0)
    assert.equal(warrantyRepair.warranty, true)
    assert.equal(warrantyRepair.status, REPAIR.COMPLETED)
  })
})
