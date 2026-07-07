import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [finance] AI 记账 + 自动对账 + 分账测试 (T111-1)
 *
 * 覆盖:
 *   - AIBookingService: scanReceipt, classifyTransaction, autoMatchToAccount,
 *     createBookingEntry, suggestCategories
 *   - AutoReconciliationService: reconcileStatement, findDiscrepancies,
 *     autoMatchPair, flagSuspicious, generateReconciliationReport
 *   - SplitBillService: splitByRatio, splitByFixedAmount, handleReturnRefund
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  AIBookingService,
  AutoReconciliationService,
  SplitBillService,
  TransactionType,
  TransactionCategory,
  type RawTransaction,
  type Account,
  type BankStatementItem,
  type SystemRecord
} from './finance-ai-booking.service'

// ─── Test Helpers ────────────────────────────────────────────────────────────

function makeAIBookingService(): AIBookingService {
  return new AIBookingService()
}

function makeReconciliationService(): AutoReconciliationService {
  return new AutoReconciliationService()
}

function makeSplitBillService(): SplitBillService {
  return new SplitBillService()
}

// ─── AIBookingService Tests ─────────────────────────────────────────────────

describe('[AIBookingService] scanReceipt', () => {
  it('scanReceipt 成功提取小票信息', async () => {
    const svc = makeAIBookingService()
    const result = await svc.scanReceipt('https://example.com/receipt.jpg')

    assert.ok(result.merchantName.length > 0, '应提取到商户名')
    assert.ok(result.amount > 0, '应提取到金额')
    assert.ok(result.date, '应提取到日期')
    assert.ok(Array.isArray(result.items), '应提取到商品列表')
    assert.ok(result.rawText.length > 0, '应保留原始文本')
  })

  it('scanReceipt 对不同 URL 返回不同交易类型', async () => {
    const svc = makeAIBookingService()
    const receipt1 = await svc.scanReceipt('https://example.com/type1.jpg')
    const receipt2 = await svc.scanReceipt('https://example.com/type2.jpg')

    // 不同 URL 应该产生不同结果
    assert.ok(
      receipt1.merchantName !== receipt2.merchantName ||
      receipt1.amount !== receipt2.amount ||
      receipt1.transactionType !== receipt2.transactionType
    )
  })
})

describe('[AIBookingService] classifyTransaction', () => {
  it('收入关键词正确分类为收入', () => {
    const svc = makeAIBookingService()
    const tx: RawTransaction = {
      id: 'tx-1',
      amount: 1000,
      date: new Date().toISOString(),
      description: '销售收入',
      type: TransactionType.Income
    }
    assert.equal(svc.classifyTransaction(tx), TransactionType.Income)
  })

  it('退款关键词正确分类为退款', () => {
    const svc = makeAIBookingService()
    const tx: RawTransaction = {
      id: 'tx-2',
      amount: -200,
      date: new Date().toISOString(),
      description: '客户退款',
      type: TransactionType.Refund
    }
    assert.equal(svc.classifyTransaction(tx), TransactionType.Refund)
  })

  it('无关键词时金额正数归类为收入', () => {
    const svc = makeAIBookingService()
    const tx: RawTransaction = {
      id: 'tx-3',
      amount: 500,
      date: new Date().toISOString(),
      description: 'random transaction',
      type: TransactionType.Expense
    }
    assert.equal(svc.classifyTransaction(tx), TransactionType.Income)
  })
})

describe('[AIBookingService] autoMatchToAccount', () => {
  const accounts: Account[] = [
    { id: 'bank-1', name: '对公账户', type: 'bank', balance: 10000 },
    { id: 'cash-1', name: '现金账户', type: 'cash', balance: 5000 },
    { id: 'wechat-1', name: '微信账户', type: 'wechat', balance: 3000 }
  ]

  it('收入交易匹配银行账户', () => {
    const svc = makeAIBookingService()
    const tx: RawTransaction = {
      id: 'tx-1',
      amount: 1000,
      date: new Date().toISOString(),
      description: '收入',
      type: TransactionType.Income
    }
    const matched = svc.autoMatchToAccount(tx, accounts)
    assert.equal(matched?.type, 'bank')
  })

  it('支出交易匹配现金或微信账户', () => {
    const svc = makeAIBookingService()
    const tx: RawTransaction = {
      id: 'tx-2',
      amount: -500,
      date: new Date().toISOString(),
      description: '采购',
      type: TransactionType.Expense
    }
    const matched = svc.autoMatchToAccount(tx, accounts)
    assert.ok(matched?.type === 'cash' || matched?.type === 'wechat')
  })

  it('空账户列表返回 null', () => {
    const svc = makeAIBookingService()
    const tx: RawTransaction = {
      id: 'tx-3',
      amount: 100,
      date: new Date().toISOString(),
      description: 'test',
      type: TransactionType.Income
    }
    assert.equal(svc.autoMatchToAccount(tx, []), null)
  })
})

describe('[AIBookingService] createBookingEntry', () => {
  it('成功创建记账凭证', async () => {
    const svc = makeAIBookingService()
    const tx: RawTransaction = {
      id: 'tx-booking-1',
      amount: 200,
      date: new Date().toISOString(),
      description: '测试记账',
      type: TransactionType.Expense,
      category: TransactionCategory.Food
    }
    const entry = await svc.createBookingEntry(tx)

    assert.ok(entry.id.startsWith('booking-'))
    assert.equal(entry.transactionId, tx.id)
    assert.equal(entry.amount, tx.amount)
    assert.equal(entry.type, tx.type)
    assert.equal(entry.category, tx.category)
    assert.ok(entry.confidence > 0 && entry.confidence <= 1)
  })
})

describe('[AIBookingService] suggestCategories', () => {
  it('食物关键词返回 FOOD 类别', () => {
    const svc = makeAIBookingService()
    const tx: RawTransaction = {
      id: 'tx-1',
      amount: 50,
      date: new Date().toISOString(),
      description: '餐厅午餐',
      type: TransactionType.Expense
    }
    const suggestions = svc.suggestCategories(tx)
    assert.ok(suggestions.includes(TransactionCategory.Food))
  })

  it('饮品关键词返回 BEVERAGE 类别', () => {
    const svc = makeAIBookingService()
    const tx: RawTransaction = {
      id: 'tx-2',
      amount: 30,
      date: new Date().toISOString(),
      description: '购买咖啡',
      type: TransactionType.Expense
    }
    const suggestions = svc.suggestCategories(tx)
    assert.ok(suggestions.includes(TransactionCategory.Beverage))
  })

  it('无匹配关键词默认返回 OTHER', () => {
    const svc = makeAIBookingService()
    const tx: RawTransaction = {
      id: 'tx-3',
      amount: 100,
      date: new Date().toISOString(),
      description: 'xyz123',
      type: TransactionType.Income
    }
    const suggestions = svc.suggestCategories(tx)
    assert.ok(suggestions.includes(TransactionCategory.Other))
  })
})

// ─── AutoReconciliationService Tests ────────────────────────────────────────

describe('[AutoReconciliationService] reconcileStatement', () => {
  it('完全匹配项自动配对', async () => {
    const svc = makeReconciliationService()
    const bankStatement: BankStatementItem[] = [
      { id: 'bank-1', amount: 100, date: '2024-01-15', description: 'Payment' },
      { id: 'bank-2', amount: 200, date: '2024-01-16', description: 'Payment' }
    ]
    const records: SystemRecord[] = [
      { id: 'sys-1', amount: 100, date: '2024-01-15', description: 'Order 1' },
      { id: 'sys-2', amount: 200, date: '2024-01-16', description: 'Order 2' }
    ]

    const result = await svc.reconcileStatement(bankStatement, records)

    assert.equal(result.matched.length, 2, '应有 2 个匹配项')
    assert.equal(result.discrepancies.length, 0, '应无差异项')
  })

  it('缺失项被标记为差异', async () => {
    const svc = makeReconciliationService()
    const bankStatement: BankStatementItem[] = [
      { id: 'bank-1', amount: 100, date: '2024-01-15', description: 'Payment' }
    ]
    const records: SystemRecord[] = [] // 空系统记录

    const result = await svc.reconcileStatement(bankStatement, records)

    assert.equal(result.matched.length, 0, '应无匹配项')
    assert.ok(result.discrepancies.length > 0, '应有差异项')
    assert.equal(result.discrepancies[0].type, 'missing_in_system')
  })
})

describe('[AutoReconciliationService] findDiscrepancies', () => {
  it('金额不匹配被识别为差异', () => {
    const svc = makeReconciliationService()
    const statement: BankStatementItem[] = [
      { id: 'bank-1', amount: 100, date: '2024-01-15', description: 'Payment' }
    ]
    const records: SystemRecord[] = [
      { id: 'sys-1', amount: 90, date: '2024-01-15', description: 'Order 1' }
    ]

    const discrepancies = svc.findDiscrepancies(statement, records)

    assert.ok(discrepancies.length > 0, '应识别出差异')
  })

  it('日期不匹配被识别为差异', () => {
    const svc = makeReconciliationService()
    const statement: BankStatementItem[] = [
      { id: 'bank-1', amount: 100, date: '2024-01-15', description: 'Payment' }
    ]
    const records: SystemRecord[] = [
      { id: 'sys-1', amount: 100, date: '2024-01-20', description: 'Order 1' }
    ]

    const discrepancies = svc.findDiscrepancies(statement, records)

    assert.ok(discrepancies.length > 0, '应识别出日期差异')
  })
})

describe('[AutoReconciliationService] autoMatchPair', () => {
  it('精确匹配返回满分', () => {
    const svc = makeReconciliationService()
    const bankTx: BankStatementItem = {
      id: 'bank-1',
      amount: 100,
      date: '2024-01-15',
      description: 'Payment'
    }
    const systemRecords: SystemRecord[] = [
      { id: 'sys-1', amount: 100, date: '2024-01-15', description: 'Order 1' }
    ]

    const match = svc.autoMatchPair(bankTx, systemRecords, new Set())

    assert.ok(match, '应找到匹配')
    assert.equal(match!.matchScore, 1.0, '精确匹配应为满分')
  })

  it('无匹配时返回 null', () => {
    const svc = makeReconciliationService()
    const bankTx: BankStatementItem = {
      id: 'bank-1',
      amount: 999,
      date: '2024-01-15',
      description: 'Unknown'
    }
    const systemRecords: SystemRecord[] = [
      { id: 'sys-1', amount: 100, date: '2024-01-15', description: 'Order 1' }
    ]

    const match = svc.autoMatchPair(bankTx, systemRecords, new Set())

    assert.equal(match, null, '金额差异大应无匹配')
  })
})

describe('[AutoReconciliationService] flagSuspicious', () => {
  it('大额整数交易被标记为可疑', () => {
    const svc = makeReconciliationService()
    const matched = [
      {
        bankTx: { id: 'bank-1', amount: 10000, date: '2024-01-15T03:00:00Z', description: 'Suspicious' },
        systemTx: { id: 'sys-1', amount: 10000, date: '2024-01-15', description: 'Order' },
        matchScore: 1.0,
        matchedAt: new Date().toISOString()
      }
    ]

    const suspicious = svc.flagSuspicious(matched)

    assert.equal(suspicious.length, 1, '大额整数交易应被标记')
  })

  it('凌晨交易被标记为可疑', () => {
    const svc = makeReconciliationService()
    const matched = [
      {
        bankTx: { id: 'bank-2', amount: 500, date: '2024-01-15T18:30:00Z', description: 'Night' },
        systemTx: { id: 'sys-2', amount: 500, date: '2024-01-15', description: 'Order' },
        matchScore: 1.0,
        matchedAt: new Date().toISOString()
      }
    ]

    const suspicious = svc.flagSuspicious(matched)

    assert.equal(suspicious.length, 1, '凌晨交易应被标记')
  })

  it('正常交易不被标记', () => {
    const svc = makeReconciliationService()
    const matched = [
      {
        bankTx: { id: 'bank-3', amount: 500, date: '2024-01-15T10:00:00Z', description: 'Normal' },
        systemTx: { id: 'sys-3', amount: 500, date: '2024-01-15', description: 'Order' },
        matchScore: 0.9,
        matchedAt: new Date().toISOString()
      }
    ]

    const suspicious = svc.flagSuspicious(matched)

    assert.equal(suspicious.length, 0, '正常交易不应被标记')
  })
})

describe('[AutoReconciliationService] generateReconciliationReport', () => {
  it('生成对账报告包含统计数据', async () => {
    const svc = makeReconciliationService()

    // 先建立一些匹配和差异
    await svc.reconcileStatement(
      [{ id: 'bank-1', amount: 100, date: '2024-01-15', description: 'P1' }],
      [{ id: 'sys-1', amount: 100, date: '2024-01-15', description: 'O1' }]
    )

    const report = await svc.generateReconciliationReport('recon-001')

    assert.ok(report.id.startsWith('report-'))
    assert.equal(report.reconciliationId, 'recon-001')
    assert.ok(report.matchedCount >= 0)
    assert.ok(report.discrepancyCount >= 0)
    assert.ok(report.suspiciousCount >= 0)
    assert.ok(report.generatedAt.length > 0)
  })
})

// ─── SplitBillService Tests ─────────────────────────────────────────────────

describe('[SplitBillService] splitByRatio', () => {
  it('按比例分账正确计算', () => {
    const svc = makeSplitBillService()
    const parties = [
      { id: 'party-A', name: 'A方' },
      { id: 'party-B', name: 'B方' },
      { id: 'party-C', name: 'C方' }
    ]

    const result = svc.splitByRatio(1000, [0.5, 0.3, 0.2], parties)

    assert.equal(result.totalAmount, 1000)
    assert.equal(result.splits.length, 3)
    assert.equal(result.splits[0].amount, 500)
    assert.equal(result.splits[1].amount, 300)
    assert.equal(result.splits[2].amount, 200)
    assert.equal(result.status, 'ACTIVE')
  })

  it('比例和不为 1 抛出错误', () => {
    const svc = makeSplitBillService()
    const parties = [{ id: 'A', name: 'A方' }, { id: 'B', name: 'B方' }]

    assert.throws(
      () => svc.splitByRatio(1000, [0.6, 0.3], parties),
      /Ratios must sum to 1/
    )
  })

  it('分账后各方金额之和等于总额', () => {
    const svc = makeSplitBillService()
    const parties = [
      { id: 'party-1', name: '商家' },
      { id: 'party-2', name: '平台' }
    ]

    const result = svc.splitByRatio(333.33, [0.6, 0.4], parties)
    const sum = result.splits.reduce((acc, s) => acc + s.amount, 0)

    assert.ok(Math.abs(sum - 333.33) < 0.1, '分账总和应约等于原金额')
  })
})

describe('[SplitBillService] splitByFixedAmount', () => {
  it('按固定金额分账正确', () => {
    const svc = makeSplitBillService()
    const parties = [
      { id: 'party-A', name: 'A方' },
      { id: 'party-B', name: 'B方' }
    ]

    const result = svc.splitByFixedAmount(1000, [700, 300], parties)

    assert.equal(result.totalAmount, 1000)
    assert.equal(result.splits[0].amount, 700)
    assert.equal(result.splits[1].amount, 300)
    assert.equal(result.splits[0].fixedAmount, 700)
  })

  it('固定金额与总额不匹配抛出错误', () => {
    const svc = makeSplitBillService()
    const parties = [{ id: 'A', name: 'A方' }, { id: 'B', name: 'B方' }]

    assert.throws(
      () => svc.splitByFixedAmount(1000, [600, 300], parties),
      /must equal total/
    )
  })
})

describe('[SplitBillService] handleReturnRefund', () => {
  it('退货时按原比例扣减分账', () => {
    const svc = makeSplitBillService()
    const parties = [
      { id: 'party-A', name: 'A方' },
      { id: 'party-B', name: 'B方' }
    ]

    // 1000 元，按 60%/40% 分账
    const split = svc.splitByRatio(1000, [0.6, 0.4], parties)
    assert.equal(split.splits[0].amount, 600)
    assert.equal(split.splits[1].amount, 400)

    // 退货 100 元，按原比例扣减
    const updated = svc.handleReturnRefund(split.id, 100)

    assert.equal(updated.returnedAmount, 100)
    assert.equal(updated.status, 'PARTIAL_RETURN')
    // A 方应扣减 60 元（100 * 0.6）
    // B 方应扣减 40 元（100 * 0.4）
    assert.ok(updated.splits[0].returnedAmount > 0)
    assert.ok(updated.splits[1].returnedAmount > 0)
  })

  it('全额退货后状态变为 FULLY_RETURNED', () => {
    const svc = makeSplitBillService()
    const parties = [
      { id: 'party-A', name: 'A方' },
      { id: 'party-B', name: 'B方' }
    ]

    const split = svc.splitByRatio(100, [0.5, 0.5], parties)
    const updated = svc.handleReturnRefund(split.id, 100)

    assert.ok(updated.returnedAmount >= 99.9)
    assert.equal(updated.status, 'FULLY_RETURNED')
  })

  it('退货金额超出可退金额抛出错误', () => {
    const svc = makeSplitBillService()
    const parties = [{ id: 'A', name: 'A方' }, { id: 'B', name: 'B方' }]

    const split = svc.splitByRatio(100, [0.5, 0.5], parties)

    assert.throws(
      () => svc.handleReturnRefund(split.id, 150), // 超出总额
      /Invalid return amount/
    )
  })

  it('重复全额退货抛出错误', () => {
    const svc = makeSplitBillService()
    const parties = [{ id: 'A', name: 'A方' }, { id: 'B', name: 'B方' }]

    const split = svc.splitByRatio(100, [0.5, 0.5], parties)
    svc.handleReturnRefund(split.id, 100)

    assert.throws(
      () => svc.handleReturnRefund(split.id, 50),
      /already been fully returned/
    )
  })

  it('部分退货后再次退货累加扣减', () => {
    const svc = makeSplitBillService()
    const parties = [
      { id: 'party-A', name: 'A方' },
      { id: 'party-B', name: 'B方' }
    ]

    const split = svc.splitByRatio(200, [0.7, 0.3], parties)

    // 第一次退货 50 元
    const first = svc.handleReturnRefund(split.id, 50)
    assert.equal(first.returnedAmount, 50)

    // 第二次退货 30 元
    const second = svc.handleReturnRefund(split.id, 30)
    assert.equal(second.returnedAmount, 80)

    assert.equal(second.status, 'PARTIAL_RETURN')
  })
})
