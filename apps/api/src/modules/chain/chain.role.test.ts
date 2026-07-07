import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
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
import { ChainAuditService } from './chain-audit.service'
import { SettlementStatus, RevenueShareStatus } from './chain.entity'

// ── 8 角色定义 ──
const ROLES = {
  TenantAdmin: '👔店长',
  Reception: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
}

// ── 辅助函数 ──

function makeChainController(): ChainController {
  const settlement = new PointsSettlementContract()
  const revenue = new RevenueShareContract()
  const executor = new ContractExecutor()
  const smartContract = new SmartContractService()
  return new ChainController(settlement, revenue, executor, smartContract)
}

function makeAuditService(): ChainAuditService {
  return new ChainAuditService()
}

// ──────────── 👔 店长：查看链上审计记录 ────────────
describe(`${ROLES.TenantAdmin} chain 角色测试`, () => {
  let ctrl: ChainController
  let auditService: ChainAuditService

  beforeEach(() => {
    resetSmartContractTestState()
    ctrl = makeChainController()
    auditService = makeAuditService()
  })

  it('店长可以查看积分清算合约详情（正常流程）', () => {
    const createResult = ctrl.createSettlement({
      payerId: 'payer-store-001',
      payerName: '门店A',
      payees: [
        { payeeId: 'payee-emp-001', payeeName: '员工张三', amount: 500 },
        { payeeId: 'payee-emp-002', payeeName: '员工李四', amount: 300 },
      ],
    })
    assert.equal(createResult.success, true)
    const contractId = (createResult.data as any).contractId

    const getResult = ctrl.getSettlement(contractId)
    assert.equal(getResult.success, true)
    const contract = getResult.data as any
    assert.equal(contract.payerId, 'payer-store-001')
    assert.equal(contract.totalAmount, 800)
    assert.equal(contract.status, SettlementStatus.Created)
  })

  it('店长可以查看分账合约详情（正常流程）', () => {
    const createResult = ctrl.createRevenueShare({
      totalRevenue: 10000,
      participants: [
        { participantId: 'p1', participantName: '合作方A', ratio: 0.6 },
        { participantId: 'p2', participantName: '合作方B', ratio: 0.4 },
      ],
    })
    assert.equal(createResult.success, true)
    const contractId = (createResult.data as any).contractId

    const getResult = ctrl.getRevenueShare(contractId)
    assert.equal(getResult.success, true)
    const contract = getResult.data as any
    assert.equal(contract.totalRevenue, 10000)
    assert.equal(contract.status, RevenueShareStatus.Created)
  })

  it('店长可以查看审计跟踪记录（正常流程）', () => {
    const trail = auditService.createAuditTrail('tx-chain-001', 'settlement.create', 'admin', {
      amount: 1000,
      timestamp: Date.now(),
    })
    assert.equal(trail.transactionId, 'tx-chain-001')

    const result = auditService.verifyAuditTrail(trail.id)
    assert.equal(result.verified, true)

    const fetched = auditService.getAuditTrail(trail.id)
    assert.equal(fetched?.id, trail.id)
  })

  it('店长可以导出审计合规报告（正常流程）', () => {
    auditService.createAuditTrail('tx-chain-002', 'settlement.execute', 'admin', { amount: 2000 })
    const report = auditService.exportAuditReport('admin', Date.now() - 3600000, Date.now())
    assert.ok(report.includes('审计报告'))
    assert.ok(report.includes('admin'))
  })

  it('店长查询不存在的合约应报错（边界）', () => {
    assert.throws(
      () => ctrl.getSettlement('nonexistent-contract'),
      /not found/i,
    )
  })

  it('店长查询不存在的分账合约应报错（边界）', () => {
    assert.throws(
      () => ctrl.getRevenueShare('nonexistent-revenue'),
      /not found/i,
    )
  })
})

// ──────────── 🔧 安监：安全审计 ────────────
describe(`${ROLES.Safety} chain 角色测试`, () => {
  let ctrl: ChainController
  let auditService: ChainAuditService

  beforeEach(() => {
    resetSmartContractTestState()
    ctrl = makeChainController()
    auditService = makeAuditService()
  })

  it('安监可以验证链上审计跟踪的真实性（正常流程）', () => {
    const trail = auditService.createAuditTrail('tx-sec-001', 'settlement.create', 'safety-inspector', {
      operation: 'create_settlement',
      amount: 5000,
    })
    const verifyResult = auditService.verifyAuditTrail(trail.id)
    assert.equal(verifyResult.verified, true)
  })

  it('安监可以查询审计日志并按用户过滤（正常流程）', () => {
    auditService.createAuditTrail('tx-sec-002', 'settlement.create', 'user-a', {})
    auditService.createAuditTrail('tx-sec-003', 'settlement.approve', 'user-b', {})
    auditService.createAuditTrail('tx-sec-004', 'settlement.create', 'user-a', {})

    const userALogs = auditService.queryAuditTrails({ userId: 'user-a' })
    assert.equal(userALogs.length, 2)

    const userBLogs = auditService.queryAuditTrails({ userId: 'user-b' })
    assert.equal(userBLogs.length, 1)
  })

  it('安监可以对异常操作发出告警（正常流程）', () => {
    // 模拟快速连续操作触发异常告警
    auditService.createAuditTrail('tx-sec-005', 'settlement.execute', 'suspicious-user', {})
    auditService.createAuditTrail('tx-sec-006', 'settlement.execute', 'suspicious-user', {})

    const alert = auditService.alertOnAnomaly('suspicious-user')
    assert.ok(alert)
    assert.equal(alert.userId, 'suspicious-user')
    assert.ok(alert.reason)
  })

  it('安监查询不存在的审计跟踪应返回未验证（边界）', () => {
    const result = auditService.verifyAuditTrail('nonexistent-trail')
    assert.equal(result.verified, false)
  })

  it('安监查看合约执行结果用于审计验证（正常流程）', () => {
    // 使用合约执行器部署并执行，这样才能通过 getContractResult 查询
    const deployResult = ctrl.deployContract({
      contractType: 'PointsSettlement',
      params: {
        payerId: 'payer-sec',
        payerName: '安全审计门店',
        payees: [{ payeeId: 'payee-sec', payeeName: '收款方', amount: 1000 }],
      },
    })
    assert.equal(deployResult.success, true)
    const contractId = (deployResult.data as any).deployedContractId
    assert.ok(contractId)

    // 先通过 executor 执行合约
    const executeResp = ctrl.executeContract({ contractId })
    assert.equal(executeResp.success, true)

    const result = ctrl.getContractResult(contractId)
    assert.equal(result.success, true)
    assert.ok(result.data)
  })
})

// ──────────── 🎯 运行专员：运行监控 ────────────
describe(`${ROLES.Ops} chain 角色测试`, () => {
  let ctrl: ChainController
  let auditService: ChainAuditService

  beforeEach(() => {
    resetSmartContractTestState()
    ctrl = makeChainController()
    auditService = makeAuditService()
  })

  it('运行专员可以创建并执行积分清算合约（正常流程）', () => {
    const createResult = ctrl.createSettlement({
      payerId: 'payer-ops',
      payerName: '运营门店',
      payees: [{ payeeId: 'payee-ops', payeeName: '运营收款', amount: 3000 }],
    })
    assert.equal(createResult.success, true)
    const contractId = (createResult.data as any).contractId

    const approveResult = ctrl.approveSettlement(contractId)
    assert.equal(approveResult.success, true)
    assert.equal((approveResult.data as any).status, SettlementStatus.Approved)

    const execResult = ctrl.executeSettlement(contractId)
    assert.equal(execResult.success, true)
    assert.equal((execResult.data as any).status, SettlementStatus.Completed)
  })

  it('运行专员可以部署合约执行器（正常流程）', () => {
    const deployResult = ctrl.deployContract({
      contractType: 'PointsSettlement',
      params: { payerId: 'payer-ops', payerName: '运营', payees: [{ payeeId: 'p1', payeeName: 'p1', amount: 100 }] },
    })
    assert.equal(deployResult.success, true)
    assert.ok(deployResult.data)
    assert.ok((deployResult.data as any).deployedContractId)
  })

  it('运行专员可以创建分账合约并分配收益（正常流程）', () => {
    const createResult = ctrl.createRevenueShare({
      totalRevenue: 50000,
      participants: [
        { participantId: 'p1', participantName: '运营A', ratio: 0.5 },
        { participantId: 'p2', participantName: '运营B', ratio: 0.3 },
        { participantId: 'p3', participantName: '运营C', ratio: 0.2 },
      ],
    })
    assert.equal(createResult.success, true)
    const contractId = (createResult.data as any).contractId

    const distResult = ctrl.distributeRevenue(contractId)
    assert.equal(distResult.success, true)
    assert.equal((distResult.data as any).status, RevenueShareStatus.Completed)
  })

  it('运行专员可以查看分账历史记录（正常流程）', () => {
    const createResult = ctrl.createRevenueShare({
      totalRevenue: 10000,
      participants: [{ participantId: 'p-ops', participantName: '运营方', ratio: 1.0 }],
    })
    const contractId = (createResult.data as any).contractId
    ctrl.distributeRevenue(contractId)

    const historyResult = ctrl.getShareHistory(contractId)
    assert.equal(historyResult.success, true)
    assert.ok(Array.isArray(historyResult.data))
    assert.ok((historyResult.data as any[]).length > 0)
  })

  it('运行专员可以查看参与者的分账金额（正常流程）', () => {
    const createResult = ctrl.createRevenueShare({
      totalRevenue: 20000,
      participants: [
        { participantId: 'staff-a', participantName: '员工A', ratio: 0.6 },
        { participantId: 'staff-b', participantName: '员工B', ratio: 0.4 },
      ],
    })
    const contractId = (createResult.data as any).contractId
    ctrl.distributeRevenue(contractId)

    const shareResult = ctrl.getParticipantShare(contractId, 'staff-a')
    assert.equal(shareResult.success, true)
    assert.equal((shareResult.data as any).expected, 12000)
    assert.equal((shareResult.data as any).distributed, true)
  })
})

// ──────────── 👥 HR：操作日志 ────────────
describe(`${ROLES.HR} chain 角色测试`, () => {
  let auditService: ChainAuditService

  beforeEach(() => {
    auditService = makeAuditService()
  })

  it('HR 可以创建操作日志记录（正常流程）', () => {
    const trail = auditService.createAuditTrail('tx-hr-001', 'employee.role.change', 'hr-user', {
      employee: '张三',
      fromRole: '前台',
      toRole: '导玩员',
      timestamp: Date.now(),
    })
    assert.equal(trail.transactionId, 'tx-hr-001')
    assert.equal(trail.action, 'employee.role.change')
    assert.equal(trail.userId, 'hr-user')
    assert.ok(trail.metadata)
  })

  it('HR 可以查询所有操作日志列表（正常流程）', () => {
    auditService.createAuditTrail('tx-hr-002', 'employee.create', 'hr-user', {})
    auditService.createAuditTrail('tx-hr-003', 'employee.update', 'hr-user', {})
    auditService.createAuditTrail('tx-hr-004', 'employee.delete', 'hr-user', {})

    const allTrails = auditService.listAuditTrails()
    assert.equal(allTrails.length, 3)
  })

  it('HR 可以按用户过滤操作日志（正常流程）', () => {
    auditService.createAuditTrail('tx-hr-005', 'employee.create', 'hr-zhang', {})
    auditService.createAuditTrail('tx-hr-006', 'employee.create', 'hr-li', {})
    auditService.createAuditTrail('tx-hr-007', 'employee.update', 'hr-zhang', {})

    const zhangLogs = auditService.queryAuditTrails({ userId: 'hr-zhang' })
    assert.equal(zhangLogs.length, 2)

    const liLogs = auditService.queryAuditTrails({ userId: 'hr-li' })
    assert.equal(liLogs.length, 1)
  })

  it('HR 可以验证操作日志的完整性（正常流程）', () => {
    const trail = auditService.createAuditTrail('tx-hr-008', 'employee.create', 'hr-user', {})
    const verifyResult = auditService.verifyAuditTrail(trail.id)
    assert.equal(verifyResult.verified, true)
  })

  it('HR 查询不存在操作日志返回未验证（边界）', () => {
    const result = auditService.verifyAuditTrail('nonexistent')
    assert.equal(result.verified, false)
  })

  it('HR 可以导出操作日志审计报告（正常流程）', () => {
    auditService.createAuditTrail('tx-hr-009', 'employee.create', 'hr-user', {})
    const report = auditService.exportAuditReport('hr-user', Date.now() - 86400000, Date.now())
    assert.ok(report.includes('审计报告'))
    assert.ok(report.includes('hr-user'))
  })
})

// ──────────── 🛒 前台：交易记录查询 ────────────
describe(`${ROLES.Reception} chain 角色测试`, () => {
  let ctrl: ChainController

  beforeEach(() => {
    resetSmartContractTestState()
    ctrl = makeChainController()
  })

  it('前台可以查询积分清算合约状态（正常流程）', () => {
    const createResult = ctrl.createSettlement({
      payerId: 'payer-reception',
      payerName: '前台门店',
      payees: [{ payeeId: 'payee-rec', payeeName: '收款方', amount: 500 }],
    })
    assert.equal(createResult.success, true)
    const contractId = (createResult.data as any).contractId

    const getResult = ctrl.getSettlement(contractId)
    assert.equal(getResult.success, true)
    assert.equal((getResult.data as any).status, SettlementStatus.Created)
  })

  it('前台可以查询分账合约参与者的分配金额（正常流程）', () => {
    const createResult = ctrl.createRevenueShare({
      totalRevenue: 30000,
      participants: [
        { participantId: 'rec-a', participantName: '前台A', ratio: 0.5 },
        { participantId: 'rec-b', participantName: '前台B', ratio: 0.5 },
      ],
    })
    const contractId = (createResult.data as any).contractId
    ctrl.distributeRevenue(contractId)

    const shareAResult = ctrl.getParticipantShare(contractId, 'rec-a')
    assert.equal(shareAResult.success, true)
    assert.equal((shareAResult.data as any).expected, 15000)

    const shareBResult = ctrl.getParticipantShare(contractId, 'rec-b')
    assert.equal(shareBResult.success, true)
    assert.equal((shareBResult.data as any).expected, 15000)
  })

  it('前台可以查看合约执行结果（正常流程）', () => {
    // 使用合约执行器部署合约
    const deployResult = ctrl.deployContract({
      contractType: 'PointsSettlement',
      params: {
        payerId: 'payer-rec',
        payerName: '前台',
        payees: [{ payeeId: 'payee-rec', payeeName: '收款', amount: 2000 }],
      },
    })
    assert.equal(deployResult.success, true)
    const contractId = (deployResult.data as any).deployedContractId

    // 通过执行器执行
    const executeResp = ctrl.executeContract({ contractId })
    assert.equal(executeResp.success, true)

    const result = ctrl.getContractResult(contractId)
    assert.equal(result.success, true)
    assert.ok(result.data)
    const execResult: any = result.data
    assert.equal(execResult.contractId, contractId)
    assert.equal(execResult.success, true)
  })

  it('前台查询不存在的合约结果应报错（边界）', () => {
    assert.throws(
      () => ctrl.getContractResult('nonexistent-result'),
      /not found/i,
    )
  })

  it('前台可以查看分账历史（正常流程）', () => {
    const createResult = ctrl.createRevenueShare({
      totalRevenue: 5000,
      participants: [{ participantId: 'rec-c', participantName: '前台C', ratio: 1.0 }],
    })
    const contractId = (createResult.data as any).contractId
    ctrl.distributeRevenue(contractId)

    const historyResult = ctrl.getShareHistory(contractId)
    assert.equal(historyResult.success, true)
    assert.ok((historyResult.data as any[]).length > 0)
  })
})

// ──────────── 🎮 导玩员：游戏合约与设备积分 ────────────
describe(`${ROLES.Guide} chain 角色测试`, () => {
  let ctrl: ChainController

  beforeEach(() => {
    resetSmartContractTestState()
    ctrl = makeChainController()
  })

  it('导玩员可以创建游戏设备积分清算合约（正常流程）', () => {
    const createResult = ctrl.createSettlement({
      payerId: 'game-store',
      payerName: '游戏厅A',
      payees: [
        { payeeId: 'machine-001', payeeName: '赛车区-机台1', amount: 1200 },
        { payeeId: 'machine-002', payeeName: '射击区-机台2', amount: 800 },
      ],
    })
    assert.equal(createResult.success, true)
    const contract = createResult.data as any
    assert.equal(contract.totalAmount, 2000)
    assert.equal(contract.participants.length, 2)
  })

  it('导玩员审核积分清算并执行（正常流程）', () => {
    const createResult = ctrl.createSettlement({
      payerId: 'game-store',
      payerName: '游戏厅B',
      payees: [{ payeeId: 'machine-arcade', payeeName: '街机区', amount: 1500 }],
    })
    const contractId = (createResult.data as any).contractId

    const approveResult = ctrl.approveSettlement(contractId)
    assert.equal(approveResult.success, true)
    assert.equal((approveResult.data as any).status, SettlementStatus.Approved)

    const execResult = ctrl.executeSettlement(contractId)
    assert.equal(execResult.success, true)
    assert.equal((execResult.data as any).status, SettlementStatus.Completed)
  })

  it('导玩员无法执行未审批的合约（权限边界）', () => {
    const createResult = ctrl.createSettlement({
      payerId: 'game-store',
      payerName: '游戏厅C',
      payees: [{ payeeId: 'machine-dance', payeeName: '跳舞机', amount: 600 }],
    })
    const contractId = (createResult.data as any).contractId

    assert.throws(
      () => ctrl.executeSettlement(contractId),
      /must be Approved/i,
    )
  })

  it('导玩员查询不存在设备的合约结果应报错（边界）', () => {
    assert.throws(
      () => ctrl.getSettlement('nonexistent-machine'),
      /not found/i,
    )
  })
})

// ──────────── 🤝 团建：团队分账与协作 ────────────
describe(`${ROLES.Teambuilding} chain 角色测试`, () => {
  let ctrl: ChainController

  beforeEach(() => {
    resetSmartContractTestState()
    ctrl = makeChainController()
  })

  it('团建协调员可以为团建活动创建分账合约（正常流程）', () => {
    const createResult = ctrl.createRevenueShare({
      totalRevenue: 30000,
      participants: [
        { participantId: 'team-a', participantName: '战队A', ratio: 0.4 },
        { participantId: 'team-b', participantName: '战队B', ratio: 0.35 },
        { participantId: 'organizer', participantName: '团建组织方', ratio: 0.25 },
      ],
    })
    assert.equal(createResult.success, true)
    const contract = createResult.data as any
    assert.equal(contract.participants.length, 3)
    assert.equal(contract.status, RevenueShareStatus.Created)
  })

  it('团建协调员可以查看各团队分账详情（正常流程）', () => {
    const createResult = ctrl.createRevenueShare({
      totalRevenue: 20000,
      participants: [
        { participantId: 'red-team', participantName: '红队', ratio: 0.5 },
        { participantId: 'blue-team', participantName: '蓝队', ratio: 0.5 },
      ],
    })
    const contractId = (createResult.data as any).contractId
    ctrl.distributeRevenue(contractId)

    const redShare = ctrl.getParticipantShare(contractId, 'red-team')
    assert.equal(redShare.success, true)
    assert.equal((redShare.data as any).expected, 10000)
    assert.equal((redShare.data as any).distributed, true)

    const blueShare = ctrl.getParticipantShare(contractId, 'blue-team')
    assert.equal(blueShare.success, true)
    assert.equal((blueShare.data as any).expected, 10000)
  })

  it('团建协调员可以查看分账历史记录（正常流程）', () => {
    const createResult = ctrl.createRevenueShare({
      totalRevenue: 5000,
      participants: [{ participantId: 'group-1', participantName: '团建一组', ratio: 1.0 }],
    })
    const contractId = (createResult.data as any).contractId
    ctrl.distributeRevenue(contractId)

    const historyResult = ctrl.getShareHistory(contractId)
    assert.equal(historyResult.success, true)
    assert.ok(Array.isArray(historyResult.data))
  })

  it('团建协调员查看不存在分账合约应报错（边界）', () => {
    assert.throws(
      () => ctrl.getRevenueShare('nonexistent-teambuilding'),
      /not found/i,
    )
  })

  it('团建分账比例不等 1 应报错（边界）', () => {
    assert.throws(
      () => ctrl.createRevenueShare({
        totalRevenue: 10000,
        participants: [{ participantId: 'only-one', participantName: '单一方', ratio: 0.5 }],
      }),
      /must sum to 1/i,
    )
  })
})

// ──────────── 📢 营销：活动收益分配与智能合约 ────────────
describe(`${ROLES.Marketing} chain 角色测试`, () => {
  let ctrl: ChainController

  beforeEach(() => {
    resetSmartContractTestState()
    ctrl = makeChainController()
  })

  it('营销经理可以为活动收益创建分账合约（正常流程）', () => {
    const createResult = ctrl.createRevenueShare({
      totalRevenue: 100000,
      participants: [
        { participantId: 'channel-wx', participantName: '微信渠道', ratio: 0.3 },
        { participantId: 'channel-dy', participantName: '抖音渠道', ratio: 0.3 },
        { participantId: 'channel-xhs', participantName: '小红书渠道', ratio: 0.2 },
        { participantId: 'store-own', participantName: '门店自营', ratio: 0.2 },
      ],
    })
    assert.equal(createResult.success, true)
    const contract = createResult.data as any
    assert.equal(contract.participants.length, 4)
    assert.equal(contract.totalRevenue, 100000)
  })

  it('营销经理可以分配活动收益（正常流程）', () => {
    const createResult = ctrl.createRevenueShare({
      totalRevenue: 50000,
      participants: [
        { participantId: 'campaign-a', participantName: '夏日促销', ratio: 0.6 },
        { participantId: 'campaign-b', participantName: '会员活动', ratio: 0.4 },
      ],
    })
    const contractId = (createResult.data as any).contractId

    const distResult = ctrl.distributeRevenue(contractId)
    assert.equal(distResult.success, true)
    assert.equal((distResult.data as any).status, RevenueShareStatus.Completed)
  })

  it('营销经理可以通过合约执行器部署智能合约（正常流程）', () => {
    const deployResult = ctrl.deployContract({
      contractType: 'RevenueShare',
      params: {
        totalRevenue: 20000,
        participants: [
          { participantId: 'campaign-c', participantName: '国庆活动', ratio: 0.5 },
          { participantId: 'campaign-d', participantName: '双11活动', ratio: 0.5 },
        ],
      },
    })
    assert.equal(deployResult.success, true)
    assert.ok(deployResult.data)
    assert.ok((deployResult.data as any).deployedContractId)
  })

  it('营销经理查看不存在分账合约的参与者份额应报错（边界）', () => {
    const createResult = ctrl.createRevenueShare({
      totalRevenue: 10000,
      participants: [{ participantId: 'real-partner', participantName: '已有合作方', ratio: 1.0 }],
    })
    const contractId = (createResult.data as any).contractId

    assert.throws(
      () => ctrl.getParticipantShare(contractId, 'unknown-partner'),
      /not found/i,
    )
  })
})

