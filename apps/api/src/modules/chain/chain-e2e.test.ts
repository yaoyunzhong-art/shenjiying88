import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * Chain E2E 集成测试 (T124-3)
 *
 * 使用 vitest globals (describe/it)
 * 测试 Chain 模块端到端场景：
 * - 哈希链 → Merkle 验证全流程
 * - 积分清算合约 E2E
 * - 分账合约 E2E
 *
 * 落地：HEARTBEAT-65
 */

import assert from 'node:assert/strict'
import {
  HashChainService,
  MerkleTreeService,
  AuditLogService,
  MerkleProof,
} from './chain-audit.service'
import {
  PointsSettlementContract,
  RevenueShareContract,
  resetSmartContractTestState,
} from './smart-contract.service'

// ─────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────

function createHashChain() {
  return new HashChainService()
}

function createMerkleTree() {
  return new MerkleTreeService()
}

function createAuditLog() {
  return new AuditLogService(createHashChain(), createMerkleTree())
}

function createPointsSettlement() {
  return new PointsSettlementContract()
}

function createRevenueShare() {
  return new RevenueShareContract()
}

function createContractExecutor() {
  return new (class ContractExecutor { constructor(){} }) ()
}

// ─────────────────────────────────────────────────────────────
// 1. 哈希链 → Merkle 验证全流程 E2E (4 tests)
// ─────────────────────────────────────────────────────────────

describe('哈希链 → Merkle 验证全流程 E2E', () => {
  it('批量操作 → 哈希链追加 → 生成 Merkle 证明 → 验证通过', () => {
    const hashChain = createHashChain()
    const merkleTree = createMerkleTree()

    // Step 1: 批量追加记录到哈希链
    const record1 = hashChain.appendRecord('CREATE_ORDER', { orderId: 'ord-001', amount: 1000 })
    const record2 = hashChain.appendRecord('UPDATE_ORDER', { orderId: 'ord-001', status: 'paid' })
    const record3 = hashChain.appendRecord('CREATE_INVOICE', { orderId: 'ord-001', invoiceId: 'inv-001' })

    assert.equal(hashChain.getChainLength(), 3, '链长度应为3')

    // Step 2: 验证哈希链完整性
    const verifyResult = hashChain.verifyChain()
    assert.equal(verifyResult.valid, true, '哈希链应该验证通过')
    assert.equal(verifyResult.brokenAt, undefined, '不应该有破损位置')

    // Step 3: 收集所有交易 ID
    const transactions = [record1.id, record2.id, record3.id]

    // Step 4: 构建 Merkle 树
    const tree = merkleTree.buildTree(transactions)
    assert.ok(tree.length > 0, 'Merkle 树应该有节点')
    assert.ok(tree[tree.length - 1].length === 1, '根节点应该唯一')

    // Step 5: 获取 Merkle 根
    const merkleRoot = merkleTree.getMerkleRoot(transactions)
    assert.ok(merkleRoot, 'Merkle 根应该存在')
    assert.equal(merkleRoot!.length, 64, 'SHA-256 哈希长度应为64')

    // Step 6: 为每条记录生成 Merkle 证明
    const proof1 = merkleTree.generateProof(record1.id, transactions)
    const proof2 = merkleTree.generateProof(record2.id, transactions)
    const proof3 = merkleTree.generateProof(record3.id, transactions)

    assert.ok(proof1, '应为 record1 生成证明')
    assert.ok(proof2, '应为 record2 生成证明')
    assert.ok(proof3, '应为 record3 生成证明')

    // Step 7: 验证 Merkle 证明
    assert.equal(
      merkleTree.verifyProof(record1.id, proof1!.proof, proof1!.root),
      true,
      'record1 证明应该验证通过'
    )
    assert.equal(
      merkleTree.verifyProof(record2.id, proof2!.proof, proof2!.root),
      true,
      'record2 证明应该验证通过'
    )
    assert.equal(
      merkleTree.verifyProof(record3.id, proof3!.proof, proof3!.root),
      true,
      'record3 证明应该验证通过'
    )
  })

  it('哈希链防篡改验证', () => {
    const hashChain = createHashChain()

    // 追加记录
    hashChain.appendRecord('CREATE_USER', { userId: 'u1' })
    hashChain.appendRecord('UPDATE_USER', { userId: 'u1', name: 'Alice' })
    hashChain.appendRecord('DELETE_USER', { userId: 'u1' })

    // 验证原始链
    let result = hashChain.verifyChain()
    assert.equal(result.valid, true, '原始链应该验证通过')

    // 篡改中间记录
    const records = hashChain.getAllRecords()
    records[1].operation = 'TAMPERED_OP'

    // 验证篡改后链
    result = hashChain.verifyChain()
    assert.equal(result.valid, false, '篡改后链应该验证失败')
    assert.equal(result.brokenAt, 1, '破损位置应为1')
  })

  it('哈希链 previousHash 链接完整性', () => {
    const hashChain = createHashChain()

    // 追加多条记录
    const first = hashChain.appendRecord('FIRST')
    const second = hashChain.appendRecord('SECOND')
    const third = hashChain.appendRecord('THIRD')

    // 验证链接关系
    assert.equal(second.previousHash, first.hash, 'second.previousHash 应指向 first.hash')
    assert.equal(third.previousHash, second.hash, 'third.previousHash 应指向 second.hash')

    // 篡改链接
    const records = hashChain.getAllRecords()
    records[2].previousHash = 'invalid_hash'

    // 验证链接被破坏
    const result = hashChain.verifyChain()
    assert.equal(result.valid, false, '链接破坏后应该验证失败')
  })

  it('Merkle 证明对单笔交易验证', () => {
    const merkleTree = createMerkleTree()

    const transactions = ['tx-001', 'tx-002', 'tx-003', 'tx-004', 'tx-005']
    const tree = merkleTree.buildTree(transactions)
    const root = merkleTree.getMerkleRoot(transactions)!

    // 为每笔交易生成并验证证明
    for (const tx of transactions) {
      const proof = merkleTree.generateProof(tx, transactions)
      assert.ok(proof, `应为 ${tx} 生成证明`)

      const isValid = merkleTree.verifyProof(tx, proof!.proof, root)
      assert.equal(isValid, true, `${tx} 的证明应该验证通过`)
    }

    // 篡改交易后验证失败
    const tamperedProof: MerkleProof = {
      transactionId: 'tx-001',
      proof: merkleTree.generateProof('tx-001', transactions)!.proof,
      root,
    }
    tamperedProof.proof[0].hash = 'tampered_hash'

    const isValid = merkleTree.verifyProof('tx-001', tamperedProof.proof, root)
    assert.equal(isValid, false, '篡改后证明应该验证失败')
  })
})

// ─────────────────────────────────────────────────────────────
// 2. 积分清算合约 E2E (4 tests)
// ─────────────────────────────────────────────────────────────

describe('积分清算合约 E2E', () => {
  beforeEach(() => {
    // 重置智能合约状态
    resetSmartContractTestState()
  })

  it('创建合约 → 审批 → 执行 → 链上记录 → 验证完整性', () => {
    const settlement = createPointsSettlement()

    // Step 1: 创建清算合约
    const contract = settlement.createSettlement('payer-corp', 'Corp ABC', [
      { payeeId: 'member-001', payeeName: 'Alice', amount: 500 },
      { payeeId: 'member-002', payeeName: 'Bob', amount: 300 },
      { payeeId: 'member-003', payeeName: 'Charlie', amount: 200 },
    ])

    assert.ok((contract as any).contractId, '合约ID应该存在')
    assert.ok((contract as any).contractId.startsWith('sc-'), '合约ID格式应正确')
    assert.equal((contract as any).payerId, 'payer-corp')
    assert.equal((contract as any).totalAmount, 1000, '总金额应为1000')
    assert.equal((contract as any).status, 'Created', '初始状态应为Created')

    // Step 2: 审批合约
    const approved = settlement.approveSettlement((contract as any).contractId)
    assert.equal((approved as any).status, 'Approved', '审批后状态应为Approved')
    assert.ok((approved as any).approvedAt, '审批时间应该存在')

    // Step 3: 执行合约
    const executed = settlement.executeSettlement((contract as any).contractId)
    assert.equal((executed as any).status, 'Completed', '执行后状态应为Completed')
    assert.ok((executed as any).executedAt, '执行时间应该存在')

    // Step 4: 验证所有参与者转账成功
    assert.ok((executed as any).participants.every((p: { transferred: boolean }) => p.transferred === true), '所有参与者都应该转账成功')

    // Step 5: 查询链上记录
    const state = settlement.getContractState((contract as any).contractId)
    assert.ok(state, '应该能查询到合约状态')
    assert.equal((state as any).status, 'Completed', '合约状态应为Completed')
  })

  it('积分清算 → 原子性保证（全部成功或全部失败）', () => {
    const settlement = createPointsSettlement()

    // 创建合约
    const contract = settlement.createSettlement('payer-atom', 'Atomic Corp', [
      { payeeId: 'm-1', payeeName: 'User1', amount: 100 },
      { payeeId: 'm-2', payeeName: 'User2', amount: 100 },
    ])

    // 审批
    settlement.approveSettlement((contract as any).contractId)

    // 执行
    const executed = settlement.executeSettlement((contract as any).contractId)

    // 验证原子性：要么全部成功，要么全部失败
    const allTransferred = (executed as any).participants.every((p: { transferred: boolean }) => p.transferred === true)
    const noneTransferred = (executed as any).participants.every((p: { transferred: boolean }) => p.transferred === false)

    assert.ok(allTransferred || noneTransferred, '转账结果应满足原子性（全成功或全失败）')

    // 如果失败，状态应为 Failed
    if (!allTransferred) {
      assert.equal((executed as any).status, 'Failed', '部分失败时状态应为Failed')
      assert.ok((executed as any).failureReason, '应有失败原因')
    }
  })

  it('积分清算合约状态机转换', () => {
    const settlement = createPointsSettlement()

    // 创建 → 审批 → 执行 → 完成
    const contract = settlement.createSettlement('payer-sm', 'State Machine Corp', [
      { payeeId: 'm-sm', payeeName: 'User', amount: 100 },
    ])

    assert.equal((contract as any).status, 'Created')

    // Created → Approved
    const approved = settlement.approveSettlement((contract as any).contractId)
    assert.equal((approved as any).status, 'Approved')

    // Approved → Completed
    const completed = settlement.executeSettlement((contract as any).contractId)
    assert.equal((completed as any).status, 'Completed')

    // Completed 不可再次执行
    assert.throws(
      () => settlement.executeSettlement((contract as any).contractId),
      /already completed/i
    )
  })

  it('积分清算合约取消', () => {
    const settlement = createPointsSettlement()

    // 创建合约
    const contract = settlement.createSettlement('payer-cancel', 'Cancel Corp', [
      { payeeId: 'm-cancel', payeeName: 'User', amount: 100 },
    ])

    // 审批合约
    settlement.approveSettlement((contract as any).contractId)

    // 取消合约
    const cancelled = settlement.cancelSettlement((contract as any).contractId)
    assert.equal((cancelled as any).status, 'Cancelled', '取消后状态应为Cancelled')
    assert.ok((cancelled as any).cancelledAt, '取消时间应该存在')

    // 已取消的合约不可执行
    assert.throws(
      () => settlement.executeSettlement((contract as any).contractId),
      /cancelled/i
    )
  })
})

// ─────────────────────────────────────────────────────────────
// 3. 分账合约 E2E (4 tests)
// ─────────────────────────────────────────────────────────────

describe('分账合约 E2E', () => {
  beforeEach(() => {
    // 重置智能合约状态
    resetSmartContractTestState()
  })

  it('创建分账 → 分配 → 各方到账 → 链上可查询', () => {
    const revenueShare = createRevenueShare()

    // Step 1: 创建分账合约（总收益10000，分配比例 40%/30%/30%）
    const contract = revenueShare.createRevenueShare(10000, [
      { participantId: 'partner-a', participantName: 'Partner A', ratio: 0.4 },
      { participantId: 'partner-b', participantName: 'Partner B', ratio: 0.3 },
      { participantId: 'partner-c', participantName: 'Partner C', ratio: 0.3 },
    ])

    assert.ok((contract as any).contractId, '合约ID应该存在')
    assert.ok((contract as any).contractId.startsWith('rs-'), '分账合约ID格式应正确')
    assert.equal((contract as any).totalRevenue, 10000, '总收益应为10000')
    assert.equal((contract as any).status, 'Created', '初始状态应为Created')

    // Step 2: 验证分配比例计算
    assert.equal((contract as any).participants[0].expectedShare, 4000, 'Partner A 应得4000')
    assert.equal((contract as any).participants[1].expectedShare, 3000, 'Partner B 应得3000')
    assert.equal((contract as any).participants[2].expectedShare, 3000, 'Partner C 应得3000')

    // Step 3: 执行分账
    const distributed = revenueShare.distributeRevenue((contract as any).contractId)
    assert.equal((distributed as any).status, 'Completed', '分账后状态应为Completed')
    assert.ok((distributed as any).distributedAt, '分账时间应该存在')

    // Step 4: 验证各方到账
    assert.ok((distributed as any).participants.every((p: { distributed: boolean }) => p.distributed === true), '所有参与者都应该已分账')

    // Step 5: 链上查询分账结果
    const state = revenueShare.getContractState((contract as any).contractId)
    assert.ok(state, '应该能查询到合约状态')
    assert.equal((state as any).status, 'Completed', '合约状态应为Completed')

    // Step 6: 查询各方分账详情
    const shareA = revenueShare.getParticipantShare((contract as any).contractId, 'partner-a')
    assert.ok(shareA, '应能查询到 Partner A 的分账详情')
    assert.equal(shareA!.expected, 4000, '预期份额应为4000')
    assert.equal(shareA!.actual, 4000, '实际份额应为4000')
    assert.equal(shareA!.distributed, true, '应该已分账')
  })

  it('分账合约比例校验', () => {
    const revenueShare = createRevenueShare()

    // 比例总和不为1应抛出错误
    assert.throws(
      () =>
        revenueShare.createRevenueShare(10000, [
          { participantId: 'p1', participantName: 'P1', ratio: 0.5 },
          { participantId: 'p2', participantName: 'P2', ratio: 0.3 }, // 总和为0.8
        ]),
      /ratios must sum to 1.0/i
    )

    // 比例总和为1应成功
    const contract = revenueShare.createRevenueShare(5000, [
      { participantId: 'p1', participantName: 'P1', ratio: 0.6 },
      { participantId: 'p2', participantName: 'P2', ratio: 0.4 },
    ])
    assert.ok((contract as any).contractId, '比例正确时应创建成功')
  })

  it('分账历史可追溯', () => {
    const revenueShare = createRevenueShare()

    // 创建并执行分账
    const contract = revenueShare.createRevenueShare(10000, [
      { participantId: 'hist-a', participantName: 'Hist A', ratio: 0.5 },
      { participantId: 'hist-b', participantName: 'Hist B', ratio: 0.5 },
    ])

    revenueShare.distributeRevenue((contract as any).contractId)

    // 查询分账历史
    const history = revenueShare.queryShareHistory((contract as any).contractId)

    assert.ok(history.length > 0, '应有分账历史记录')
    assert.ok(history.every((h: any) => h.contractId === (contract as any).contractId), '历史记录contractId应匹配')

    // 验证历史记录包含必要字段
    const entry = history[0]
    assert.ok(entry.participantId, '应有参与者ID')
    assert.ok(entry.amount > 0, '分账金额应>0')
    assert.ok(entry.distributedAt, '应有分账时间')
  })

  it('分账合约执行幂等性', () => {
    const revenueShare = createRevenueShare()

    // 创建分账
    const contract = revenueShare.createRevenueShare(10000, [
      { participantId: 'idem-a', participantName: 'Idem A', ratio: 1.0 },
    ])

    // 第一次分账
    const first = revenueShare.distributeRevenue((contract as any).contractId)
    assert.equal((first as any).status, 'Completed', '第一次分账应成功')

    // 第二次分账应失败
    assert.throws(
      () => revenueShare.distributeRevenue((contract as any).contractId),
      /already completed/i
    )
  })
})
