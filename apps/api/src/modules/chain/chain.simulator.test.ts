import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * Chain Simulator Test
 *
 * 8 角色视角模拟智能合约全场景测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 覆盖: 积分清算合约、分账合约、合约执行器、链上智能合约
 * 场景: 创建→审批→执行→取消→异常回滚→查询回溯
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ChainController } from './chain.controller'
import {
  PointsSettlementContract,
  RevenueShareContract,
  ContractExecutor,
  SmartContractService,
  resetSmartContractTestState,
} from './smart-contract.service'
import { SettlementStatus, RevenueShareStatus } from './chain.entity'

// ─── 8 角色定义 ───
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ─── 测试工厂 ───
function createController(): ChainController {
  const settlementContract = new PointsSettlementContract()
  const revenueShareContract = new RevenueShareContract()
  const contractExecutor = new ContractExecutor()
  const smartContractService = new SmartContractService()
  return new ChainController(
    settlementContract,
    revenueShareContract,
    contractExecutor,
    smartContractService,
  )
}

interface SimulationState {
  settlementIds: string[]
  revenueShareIds: string[]
}

/** 模拟一次完整的门店积分清算周期 */
function simulateFullSettlementCycle(
  ctrl: ChainController,
): SimulationState {
  // 门店积分结算 — 店长发起
  const settlement = ctrl.createSettlement({
    payerId: 'store-001',
    payerName: '旗舰店',
    payees: [
      { payeeId: 'member-001', payeeName: '张三', amount: 500 },
      { payeeId: 'member-002', payeeName: '李四', amount: 300 },
      { payeeId: 'member-003', payeeName: '王五', amount: 200 },
    ],
  })
  assert.equal(settlement.success, true)
  const sId = (settlement.data as any).contractId

  // 审批
  const approved = ctrl.approveSettlement(sId)
  assert.equal((approved.data as any).status, SettlementStatus.Approved)

  // 执行
  const executed = ctrl.executeSettlement(sId)
  assert.equal((executed.data as any).status, SettlementStatus.Completed)
  assert.equal(
    (executed.data as any).participants.every((p: any) => p.transferred === true),
    true,
  )

  return { settlementIds: [sId], revenueShareIds: [] }
}

/** 模拟一次跨品牌分账 */
function simulateFullRevenueShareCycle(
  ctrl: ChainController,
): SimulationState {
  const rs = ctrl.createRevenueShare({
    totalRevenue: 50000,
    participants: [
      { participantId: 'brand-a', participantName: 'A品牌', ratio: 0.5 },
      { participantId: 'brand-b', participantName: 'B品牌', ratio: 0.3 },
      { participantId: 'brand-c', participantName: 'C品牌', ratio: 0.2 },
    ],
  })
  assert.equal(rs.success, true)
  const rsId = (rs.data as any).contractId

  // 分配
  const distributed = ctrl.distributeRevenue(rsId)
  assert.equal((distributed.data as any).status, RevenueShareStatus.Completed)
  assert.equal(
    (distributed.data as any).participants.every((p: any) => p.distributed === true),
    true,
  )

  return { settlementIds: [], revenueShareIds: [rsId] }
}

// ══════════════════════════════════════════════════════════════
// 👔 店长 — 门店积分清算 & 分账全流程
// ══════════════════════════════════════════════════════════════

describe(`${ROLES.StoreManager} chain 智能合约模拟`, () => {
  beforeEach(() => {
    resetSmartContractTestState()
  })

  it('店长发起积分结算全流程：创建→审批→执行→查询', () => {
    const ctrl = createController()
    const state = simulateFullSettlementCycle(ctrl)

    // 查询已完成的合约
    const result = ctrl.getSettlement(state.settlementIds[0])
    assert.equal(result.success, true)
    assert.equal((result.data as any).status, SettlementStatus.Completed)
    assert.equal((result.data as any).totalAmount, 1000)
    assert.equal((result.data as any).participants.length, 3)
  })

  it('店长发起跨品牌分账全流程：创建→分配→各品牌份额查询', () => {
    const ctrl = createController()
    const state = simulateFullRevenueShareCycle(ctrl)

    const result = ctrl.getRevenueShare(state.revenueShareIds[0])
    assert.equal(result.success, true)
    assert.equal((result.data as any).totalRevenue, 50000)

    // 查询各参与者份额
    const shareA = ctrl.getParticipantShare(state.revenueShareIds[0], 'brand-a')
    assert.equal(shareA.data!.expected, 25000)
    assert.equal(shareA.data!.distributed, true)

    const shareB = ctrl.getParticipantShare(state.revenueShareIds[0], 'brand-b')
    assert.equal(shareB.data!.expected, 15000)
    assert.equal(shareB.data!.distributed, true)
  })
})

// ══════════════════════════════════════════════════════════════
// 🛒 前台 — 为消费者查询积分结算状态
// ══════════════════════════════════════════════════════════════

describe(`${ROLES.FrontDesk} chain 前台权益查询模拟`, () => {
  beforeEach(() => {
    resetSmartContractTestState()
    simulateFullSettlementCycle(createController())
  })

  it('前台查询某会员积分是否到账', () => {
    const ctrl = createController()
    // 创建一个新结算
    const settlement = ctrl.createSettlement({
      payerId: 'store-front',
      payerName: '前台店',
      payees: [
        { payeeId: 'member-query', payeeName: '查询人', amount: 100 },
      ],
    })
    const sId = (settlement.data as any).contractId
    ctrl.approveSettlement(sId)
    const executed = ctrl.executeSettlement(sId)

    // 前台查询：会员已到账
    const participant = (executed.data as any).participants[0]
    assert.equal(participant.payeeId, 'member-query')
    assert.equal(participant.transferred, true)
    assert.equal(participant.amount, 100)
  })

  it('前台查询未找到的合约应返回404', () => {
    const ctrl = createController()
    assert.throws(
      () => ctrl.getSettlement('non-existent-id'),
      /not found/i,
    )
  })
})

// ══════════════════════════════════════════════════════════════
// 👥 HR — 人力资源分账合约（绩效奖金分配）
// ══════════════════════════════════════════════════════════════

describe(`${ROLES.HR} chain 人力分账模拟`, () => {
  beforeEach(() => {
    resetSmartContractTestState()
  })

  it('HR 按绩效比例分配奖金', () => {
    const ctrl = createController()
    const rs = ctrl.createRevenueShare({
      totalRevenue: 100000,
      participants: [
        { participantId: 'emp-a', participantName: '员工A', ratio: 0.5 },
        { participantId: 'emp-b', participantName: '员工B', ratio: 0.3 },
        { participantId: 'emp-c', participantName: '员工C', ratio: 0.2 },
      ],
    })
    const rsId = (rs.data as any).contractId
    ctrl.distributeRevenue(rsId)

    const shareA = ctrl.getParticipantShare(rsId, 'emp-a')
    assert.equal(shareA.data!.expected, 50000)

    const shareB = ctrl.getParticipantShare(rsId, 'emp-b')
    assert.equal(shareB.data!.expected, 30000)

    const shareC = ctrl.getParticipantShare(rsId, 'emp-c')
    assert.equal(shareC.data!.expected, 20000)
  })

  it('HR 创建比例总和不等于1的分账时应拒绝', () => {
    const ctrl = createController()
    assert.throws(
      () =>
        ctrl.createRevenueShare({
          totalRevenue: 1000,
          participants: [
            { participantId: 'x', participantName: 'X', ratio: 0.3 },
            { participantId: 'y', participantName: 'Y', ratio: 0.3 },
          ],
        }),
      /ratios must sum to 1/i,
    )
  })
})

// ══════════════════════════════════════════════════════════════
// 🔧 安监 — 合约执行安全审计与异常检测
// ══════════════════════════════════════════════════════════════

describe(`${ROLES.Safety} chain 安全审计模拟`, () => {
  beforeEach(() => {
    resetSmartContractTestState()
  })

  it('安监审计已完成合约的完整性', () => {
    const ctrl = createController()
    const state = simulateFullSettlementCycle(ctrl)

    // 查询合约执行链路
    const result = ctrl.getSettlement(state.settlementIds[0])
    assert.equal(result.success, true)
    const contract = result.data as any
    assert.ok(contract.createdAt)
    assert.ok(contract.approvedAt)
    assert.ok(contract.executedAt)
    assert.equal(contract.status, SettlementStatus.Completed)
  })

  it('安监审计已完成的合约不允许取消', () => {
    const ctrl = createController()
    const state = simulateFullSettlementCycle(ctrl)

    assert.throws(
      () => ctrl.cancelSettlement(state.settlementIds[0]),
      /cannot cancel|already completed/i,
    )
  })

  it('安监检测合约执行器部署记录', () => {
    const ctrl = createController()
    const deployed = ctrl.deployContract({
      contractType: 'PointsSettlement',
      params: {
        payerId: 'audit-payer',
        payerName: '审计支付方',
        payees: [{ payeeId: 'audit-payee', payeeName: '审计接收方', amount: 500 }],
      },
    })
    assert.equal(deployed.success, true)
    assert.ok((deployed.data as any).deployedContractId)
    assert.equal((deployed.data as any).contractType, 'PointsSettlement')
  })
})

// ══════════════════════════════════════════════════════════════
// 🎮 导玩员 — 积分结算（导玩奖励发放）
// ══════════════════════════════════════════════════════════════

describe(`${ROLES.Guide} chain 导玩积分结算模拟`, () => {
  beforeEach(() => {
    resetSmartContractTestState()
  })

  it('导玩员发起月度导玩积分结算', () => {
    const ctrl = createController()
    const settlement = ctrl.createSettlement({
      payerId: 'guide-store',
      payerName: '导玩门店',
      payees: [
        { payeeId: 'player-001', payeeName: '玩家A', amount: 150 },
        { payeeId: 'player-002', payeeName: '玩家B', amount: 250 },
        { payeeId: 'player-003', payeeName: '玩家C', amount: 100 },
      ],
    })
    const sId = (settlement.data as any).contractId
    ctrl.approveSettlement(sId)
    const executed = ctrl.executeSettlement(sId)

    // 所有玩家积分到账
    assert.equal(
      (executed.data as any).participants.every((p: any) => p.transferred === true),
      true,
    )
    assert.equal((executed.data as any).totalAmount, 500)
  })

  it('导玩员查询历史结算记录', () => {
    const ctrl = createController()
    simulateFullSettlementCycle(ctrl)

    // 再次创建并执行一个新结算
    const second = ctrl.createSettlement({
      payerId: 'guide-store',
      payerName: '导玩门店',
      payees: [{ payeeId: 'player-004', payeeName: '玩家D', amount: 200 }],
    })
    const sId = (second.data as any).contractId
    ctrl.approveSettlement(sId)
    ctrl.executeSettlement(sId)

    // 查询第二个结算确认到账
    const queried = ctrl.getSettlement(sId)
    assert.equal((queried.data as any).status, SettlementStatus.Completed)
    assert.equal((queried.data as any).participants[0].amount, 200)
  })
})

// ══════════════════════════════════════════════════════════════
// 🎯 运行专员 — 合约执行器部署与批量执行
// ══════════════════════════════════════════════════════════════

describe(`${ROLES.Ops} chain 运行部署模拟`, () => {
  beforeEach(() => {
    resetSmartContractTestState()
  })

  it('运行专员部署积分清算合约并通过执行器执行', () => {
    const ctrl = createController()

    // 用执行器部署
    const deployed = ctrl.deployContract({
      contractType: 'PointsSettlement',
      params: {
        payerId: 'ops-payer',
        payerName: '运营支付方',
        payees: [
          { payeeId: 'ops-payee-1', payeeName: '运营接收方1', amount: 1000 },
        ],
      },
    })
    const contractId = (deployed.data as any).deployedContractId

    // 用执行器执行（含自动审批）
    const executed = ctrl.executeContract({ contractId })
    assert.equal((executed.data as any).success, true)
  })

  it('运行专员部署分账合约', () => {
    const ctrl = createController()
    const deployed = ctrl.deployContract({
      contractType: 'RevenueShare',
      params: {
        totalRevenue: 20000,
        participants: [
          { participantId: 'partner-ops-1', participantName: '运营伙伴A', ratio: 0.7 },
          { participantId: 'partner-ops-2', participantName: '运营伙伴B', ratio: 0.3 },
        ],
      },
    })
    assert.equal(deployed.success, true)
    assert.equal((deployed.data as any).contractType, 'RevenueShare')

    // 执行分账
    const contractId = (deployed.data as any).deployedContractId
    const executed = ctrl.executeContract({ contractId })
    assert.equal((executed.data as any).success, true)
  })

  it('运行专员查询不存在的合约执行结果应返回404', () => {
    const ctrl = createController()
    assert.throws(
      () => ctrl.getContractResult('non-existent'),
      /not found/i,
    )
  })
})

// ══════════════════════════════════════════════════════════════
// 🤝 团建 — 团建品牌跨店结算
// ══════════════════════════════════════════════════════════════

describe(`${ROLES.Teambuilding} chain 团建结算模拟`, () => {
  beforeEach(() => {
    resetSmartContractTestState()
  })

  it('团建专员跨门店结算团建费用', () => {
    const ctrl = createController()
    const settlement = ctrl.createSettlement({
      payerId: 'teambuilding-dept',
      payerName: '团建部',
      payees: [
        { payeeId: 'store-north', payeeName: '北区店', amount: 3000 },
        { payeeId: 'store-south', payeeName: '南区店', amount: 2000 },
        { payeeId: 'store-east', payeeName: '东区店', amount: 1500 },
      ],
    })
    const sId = (settlement.data as any).contractId
    ctrl.approveSettlement(sId)
    const executed = ctrl.executeSettlement(sId)

    assert.equal((executed.data as any).totalAmount, 6500)
    assert.equal((executed.data as any).participants.length, 3)
    assert.equal(
      (executed.data as any).participants.every((p: any) => p.transferred === true),
      true,
    )
  })

  it('团建专员查询分账历史', () => {
    const ctrl = createController()
    const rs = ctrl.createRevenueShare({
      totalRevenue: 12000,
      participants: [
        { participantId: 'team-a', participantName: '团建A', ratio: 0.5 },
        { participantId: 'team-b', participantName: '团建B', ratio: 0.5 },
      ],
    })
    const rsId = (rs.data as any).contractId
    ctrl.distributeRevenue(rsId)

    const history = ctrl.getShareHistory(rsId)
    assert.equal(history.success, true)
    assert.ok(Array.isArray(history.data))
    assert.equal((history.data as any).length, 2)
  })
})

// ══════════════════════════════════════════════════════════════
// 📢 营销 — 营销返利结算与合约状态查询
// ══════════════════════════════════════════════════════════════

describe(`${ROLES.Marketing} chain 营销返利模拟`, () => {
  beforeEach(() => {
    resetSmartContractTestState()
  })

  it('营销专员按业绩分账结算返利', () => {
    const ctrl = createController()
    const rs = ctrl.createRevenueShare({
      totalRevenue: 80000,
      participants: [
        { participantId: 'mkt-channel-a', participantName: '渠道A', ratio: 0.4 },
        { participantId: 'mkt-channel-b', participantName: '渠道B', ratio: 0.35 },
        { participantId: 'mkt-channel-c', participantName: '渠道C', ratio: 0.25 },
      ],
    })
    const rsId = (rs.data as any).contractId
    ctrl.distributeRevenue(rsId)

    // 查询各渠道份额
    const shareA = ctrl.getParticipantShare(rsId, 'mkt-channel-a')
    assert.equal(shareA.data!.expected, 32000)

    const shareC = ctrl.getParticipantShare(rsId, 'mkt-channel-c')
    assert.equal(shareC.data!.expected, 20000)
  })

  it('营销专员发起积分返利合约并通过执行器查询结果', () => {
    const ctrl = createController()

    // 创建结算
    const settlement = ctrl.createSettlement({
      payerId: 'mkt-dept',
      payerName: '营销部',
      payees: [
        { payeeId: 'mkt-member-001', payeeName: '营销会员A', amount: 500 },
      ],
    })
    const sId = (settlement.data as any).contractId
    ctrl.approveSettlement(sId)
    ctrl.executeSettlement(sId)

    // 查询结算详情
    const result = ctrl.getSettlement(sId)
    assert.equal((result.data as any).status, SettlementStatus.Completed)
    assert.equal((result.data as any).totalAmount, 500)
  })
})

// ══════════════════════════════════════════════════════════════
// 合约取消 & 状态机边界场景
// ══════════════════════════════════════════════════════════════

describe('chain 合约状态机 & 边界模拟', () => {
  beforeEach(() => {
    resetSmartContractTestState()
  })

  it('已取消的合约禁止执行', () => {
    const ctrl = createController()
    const settlement = ctrl.createSettlement({
      payerId: 'cancel-payer',
      payerName: '取消测试',
      payees: [{ payeeId: 'cancel-payee', payeeName: '取消接收方', amount: 100 }],
    })
    const sId = (settlement.data as any).contractId
    ctrl.approveSettlement(sId)
    ctrl.cancelSettlement(sId)

    assert.throws(
      () => ctrl.executeSettlement(sId),
      /cancelled/i,
    )
  })

  it('未审批的合约不能执行', () => {
    const ctrl = createController()
    const settlement = ctrl.createSettlement({
      payerId: 'no-approve-payer',
      payerName: '未审批',
      payees: [{ payeeId: 'no-approve-payee', payeeName: '未审批接收方', amount: 100 }],
    })
    const sId = (settlement.data as any).contractId

    assert.throws(
      () => ctrl.executeSettlement(sId),
      /must be approved/i,
    )
  })

  it('已完成的分账合约重复分配应拒绝', () => {
    const ctrl = createController()
    const rs = ctrl.createRevenueShare({
      totalRevenue: 3000,
      participants: [
        { participantId: 'dup-a', participantName: 'DupA', ratio: 1.0 },
      ],
    })
    const rsId = (rs.data as any).contractId
    ctrl.distributeRevenue(rsId)

    assert.throws(
      () => ctrl.distributeRevenue(rsId),
      /already completed/i,
    )
  })
})
