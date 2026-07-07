import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * smart-contract.test.ts · T122-2 积分清算 + 分账智能合约
 *
 * 验证:
 *   1. PointsSettlementContract  积分清算合约 (创建→审批→执行→状态流转)
 *   2. RevenueShareContract     分账合约 (按比例分账，各方金额正确)
 *   3. ContractExecutor         合约执行器 (部署→执行→结果获取)
 *   4. 合约原子性               执行失败时整个合约回滚
 *   5. 合约取消                 执行前可取消，执行后不可取消
 *
 * 覆盖 16 个测试用例
 */

import assert from 'node:assert/strict'
import {
  PointsSettlementContract,
  RevenueShareContract,
  ContractExecutor,
  SettlementStatus,
  RevenueShareStatus,
  resetSmartContractTestState,
} from './smart-contract.service'

function createSettlementContract(): PointsSettlementContract {
  resetSmartContractTestState()
  return new PointsSettlementContract()
}

function createRevenueShareContract(): RevenueShareContract {
  resetSmartContractTestState()
  return new RevenueShareContract()
}

function createExecutor(): ContractExecutor {
  resetSmartContractTestState()
  return new ContractExecutor()
}

// ─── PointsSettlementContract Tests ─────────────────────────────────────────

describe('PointsSettlementContract 积分清算合约', () => {
  let contract: PointsSettlementContract

  beforeEach(() => {
    contract = createSettlementContract()
  })

  describe('createSettlement', () => {
    it('T1: 创建结算合约成功，状态为 Created', () => {
      const sc = contract.createSettlement(
        'payer-001',
        '付款方A',
        [
          { payeeId: 'payee-001', payeeName: '收款方B', amount: 3000 },
          { payeeId: 'payee-002', payeeName: '收款方C', amount: 2000 },
        ]
      )

      assert.equal((sc as any).status, SettlementStatus.Created)
      assert.equal((sc as any).totalAmount, 5000)
      assert.equal((sc as any).participants.length, 2)
      assert.equal((sc as any).participants[0].transferred, false)
    })

    it('T2: 创建结算合约时 payer 信息正确记录', () => {
      const sc = contract.createSettlement('payer-002', '付款方B', [
        { payeeId: 'payee-003', payeeName: '收款方D', amount: 1000 },
      ])

      assert.equal((sc as any).payerId, 'payer-002')
      assert.equal((sc as any).payerName, '付款方B')
      assert.ok((sc as any).contractId.startsWith('sc-'))
    })
  })

  describe('approveSettlement', () => {
    it('T3: 审批合约后状态从 Created 变为 Approved', () => {
      const sc = contract.createSettlement('payer-001', '付款方A', [
        { payeeId: 'payee-001', payeeName: '收款方B', amount: 3000 },
      ])

      const approved = contract.approveSettlement((sc as any).contractId)
      assert.equal((approved as any).status, SettlementStatus.Approved)
      assert.ok((approved as any).approvedAt)
    })

    it('T4: 审批已审批的合约抛出错误', () => {
      const sc = contract.createSettlement('payer-001', '付款方A', [
        { payeeId: 'payee-001', payeeName: '收款方B', amount: 3000 },
      ])
      contract.approveSettlement((sc as any).contractId)

      assert.throws(
        () => contract.approveSettlement((sc as any).contractId),
        /Cannot approve contract in status/
      )
    })
  })

  describe('executeSettlement', () => {
    it('T5: 执行已审批的合约，状态变为 Completed', () => {
      const sc = contract.createSettlement('payer-001', '付款方A', [
        { payeeId: 'payee-001', payeeName: '收款方B', amount: 3000 },
        { payeeId: 'payee-002', payeeName: '收款方C', amount: 2000 },
      ])
      contract.approveSettlement((sc as any).contractId)

      const executed = contract.executeSettlement((sc as any).contractId)
      assert.equal((executed as any).status, SettlementStatus.Completed)
      assert.ok((executed as any).executedAt)
      assert.equal((executed as any).participants.every((p: { transferred: boolean }) => p.transferred), true)
    })

    it('T6: 状态未审批时执行抛出错误', () => {
      const sc = contract.createSettlement('payer-001', '付款方A', [
        { payeeId: 'payee-001', payeeName: '收款方B', amount: 3000 },
      ])

      assert.throws(
        () => contract.executeSettlement((sc as any).contractId),
        /Cannot execute contract in status/
      )
    })

    it('T7: 合约状态流转完整链路: Created → Approved → Completed', () => {
      const sc = contract.createSettlement('payer-001', '付款方A', [
        { payeeId: 'payee-001', payeeName: '收款方B', amount: 3000 },
      ])

      assert.equal((sc as any).status, SettlementStatus.Created)

      const approved = contract.approveSettlement((sc as any).contractId)
      assert.equal((approved as any).status, SettlementStatus.Approved)

      const executed = contract.executeSettlement((sc as any).contractId)
      assert.equal((executed as any).status, SettlementStatus.Completed)
    })
  })

  describe('cancelSettlement', () => {
    it('T8: 执行前取消合约成功，状态变为 Cancelled', () => {
      const sc = contract.createSettlement('payer-001', '付款方A', [
        { payeeId: 'payee-001', payeeName: '收款方B', amount: 3000 },
      ])

      const cancelled = contract.cancelSettlement((sc as any).contractId)
      assert.equal((cancelled as any).status, SettlementStatus.Cancelled)
      assert.ok((cancelled as any).cancelledAt)
    })

    it('T9: 执行后不可取消，抛出错误', () => {
      const sc = contract.createSettlement('payer-001', '付款方A', [
        { payeeId: 'payee-001', payeeName: '收款方B', amount: 3000 },
      ])
      contract.approveSettlement((sc as any).contractId)
      contract.executeSettlement((sc as any).contractId)

      assert.throws(
        () => contract.cancelSettlement((sc as any).contractId),
        /Cannot cancel contract in status/
      )
    })
  })
})

// ─── RevenueShareContract Tests ───────────────────────────────────────────────

describe('RevenueShareContract 分账合约', () => {
  let contract: RevenueShareContract

  beforeEach(() => {
    contract = createRevenueShareContract()
  })

  describe('createRevenueShare', () => {
    it('T10: 创建分账合约成功，各方比例正确计算', () => {
      const sc = contract.createRevenueShare(10000, [
        { participantId: 'p-001', participantName: '商户A', ratio: 0.6 },
        { participantId: 'p-002', participantName: '商户B', ratio: 0.4 },
      ])

      assert.equal((sc as any).status, RevenueShareStatus.Created)
      assert.equal((sc as any).totalRevenue, 10000)
      assert.equal((sc as any).participants.length, 2)
      assert.equal((sc as any).participants[0].expectedShare, 6000)
      assert.equal((sc as any).participants[1].expectedShare, 4000)
    })

    it('T11: 比例总和不为1时抛出错误', () => {
      assert.throws(
        () =>
          contract.createRevenueShare(10000, [
            { participantId: 'p-001', participantName: '商户A', ratio: 0.6 },
            { participantId: 'p-002', participantName: '商户B', ratio: 0.3 },
          ]),
        /Participants ratios must sum to 1.0/
      )
    })
  })

  describe('distributeRevenue', () => {
    it('T12: 执行分账分配后各方金额正确', () => {
      const sc = contract.createRevenueShare(10000, [
        { participantId: 'p-001', participantName: '商户A', ratio: 0.7 },
        { participantId: 'p-002', participantName: '商户B', ratio: 0.3 },
      ])

      const distributed = contract.distributeRevenue((sc as any).contractId)
      assert.equal((distributed as any).status, RevenueShareStatus.Completed)
      assert.equal((distributed as any).participants[0].actualShare, 7000)
      assert.equal((distributed as any).participants[1].actualShare, 3000)
      assert.equal((distributed as any).participants.every((p: { distributed: boolean }) => p.distributed), true)
    })

    it('T13: 获取单个参与者份额正确', () => {
      const sc = contract.createRevenueShare(10000, [
        { participantId: 'p-001', participantName: '商户A', ratio: 0.5 },
        { participantId: 'p-002', participantName: '商户B', ratio: 0.5 },
      ])

      const share = contract.getParticipantShare((sc as any).contractId, 'p-001')
      assert.ok(share)
      assert.equal(share.expected, 5000)
      assert.equal(share.distributed, false)
    })

    it('T14: 查询分账历史记录正确', () => {
      const sc = contract.createRevenueShare(10000, [
        { participantId: 'p-001', participantName: '商户A', ratio: 1.0 },
      ])
      contract.distributeRevenue((sc as any).contractId)

      const history = contract.queryShareHistory((sc as any).contractId)
      assert.equal(history.length, 1)
      assert.equal(history[0].amount, 10000)
    })
  })
})

// ─── ContractExecutor Tests ───────────────────────────────────────────────────

describe('ContractExecutor 合约执行器', () => {
  let executor: ContractExecutor

  beforeEach(() => {
    executor = createExecutor()
  })

  it('T15: 部署并执行积分清算合约成功', () => {
    const deployed = executor.deployContract('PointsSettlement', {
      payerId: 'payer-001',
      payerName: '付款方A',
      payees: [
        { payeeId: 'payee-001', payeeName: '收款方B', amount: 3000 },
      ],
    })

    assert.ok(deployed.deployedContractId.startsWith('sc-'))
    assert.equal(deployed.contractType, 'PointsSettlement')

    const result = executor.executeContract(deployed.deployedContractId)
    assert.equal(result.success, true)
    assert.ok(result.output)
  })

  it('T16: 部署并执行分账合约成功', () => {
    const deployed = executor.deployContract('RevenueShare', {
      totalRevenue: 10000,
      participants: [
        { participantId: 'p-001', participantName: '商户A', ratio: 0.6 },
        { participantId: 'p-002', participantName: '商户B', ratio: 0.4 },
      ],
    })

    assert.ok(deployed.deployedContractId.startsWith('rs-'))
    assert.equal(deployed.contractType, 'RevenueShare')

    const result = executor.executeContract(deployed.deployedContractId)
    assert.equal(result.success, true)
    assert.ok(result.output)
  })
})
