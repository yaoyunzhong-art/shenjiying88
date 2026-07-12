/**
 * 🐜 chain 角色扩展测试
 *
 * 从 8 角色视角覆盖积分清算、分账合约、合约执行器扩展场景
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  PointsSettlementContract,
  RevenueShareContract,
  ContractExecutor,
  SmartContractService,
  resetSmartContractTestState,
  SettlementStatus,
  RevenueShareStatus,
} from './smart-contract.service'

function setup() {
  const settlement = new PointsSettlementContract()
  const revenue = new RevenueShareContract()
  const executor = new ContractExecutor()
  const smart = new SmartContractService()
  return { settlement, revenue, executor, smart }
}

describe('👔店长 chain 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { resetSmartContractTestState(); svc = setup() })

  it('创建积分清算合约 -> 数据包含 totalAmount 和 status', () => {
    const c = svc.settlement.createSettlement('payer1', '门店A', [
      { payeeId: 'e1', payeeName: '员工1', amount: 1000 },
    ]) as unknown as { totalAmount: number; status: SettlementStatus }
    expect(c.totalAmount).toBe(1000)
    expect(c.status).toBe(SettlementStatus.Created)
  })

  it('查询不存在的合约返回 null', () => {
    expect(svc.settlement.getContractState('no-such')).toBeUndefined()
  })
})

describe('🛒前台 chain 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { resetSmartContractTestState(); svc = setup() })

  it('创建分账合约', () => {
    const c = svc.revenue.createRevenueShare(10000, [
      { participantId: 'p1', participantName: '商家A', ratio: 0.6 },
      { participantId: 'p2', participantName: '商家B', ratio: 0.4 },
    ]) as unknown as { participants: unknown[]; status: RevenueShareStatus }
    expect(c.participants).toHaveLength(2)
    expect(c.status).toBe(RevenueShareStatus.Created)
  })
})

describe('🔧安监 chain 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { resetSmartContractTestState(); svc = setup() })

  it('创建并取消积分清算', () => {
    const c = svc.settlement.createSettlement('p', '门店', [
      { payeeId: 'e', payeeName: '员工', amount: 500 },
    ]) as unknown as { contractId: string; status: SettlementStatus }
    const cancelled = svc.settlement.cancelSettlement(c.contractId) as unknown as { status: SettlementStatus }
    expect(cancelled.status).toBe(SettlementStatus.Cancelled)
  })

  it('取消已完成的合约应抛错', () => {
    const c = svc.settlement.createSettlement('p', '门店', [
      { payeeId: 'e', payeeName: '员工', amount: 100 },
    ]) as unknown as { contractId: string }
    svc.settlement.approveSettlement(c.contractId)
    svc.settlement.executeSettlement(c.contractId)
    expect(() => svc.settlement.cancelSettlement(c.contractId)).toThrow()
  })
})

describe('🎯运行专员 chain 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { resetSmartContractTestState(); svc = setup() })

  it('创建→审批→执行清算完整流程：状态流转正确', () => {
    const c = svc.settlement.createSettlement('p', '门店', [
      { payeeId: 'e', payeeName: '员工', amount: 2000 },
    ]) as unknown as { contractId: string }
    const approved = svc.settlement.approveSettlement(c.contractId) as unknown as { status: SettlementStatus }
    expect(approved.status).toBe(SettlementStatus.Approved)
    const executed = svc.settlement.executeSettlement(c.contractId) as unknown as { status: SettlementStatus }
    expect(executed.status).toBe(SettlementStatus.Completed)
  })

  it('分账合约分配收入后参与者应有 actualShare', () => {
    const c = svc.revenue.createRevenueShare(10000, [
      { participantId: 'a', participantName: 'A', ratio: 0.7 },
      { participantId: 'b', participantName: 'B', ratio: 0.3 },
    ]) as unknown as { contractId: string }
    const dist = svc.revenue.distributeRevenue(c.contractId) as unknown as {
      status: RevenueShareStatus; participants: Array<{ actualShare: number }>
    }
    expect(dist.status).toBe(RevenueShareStatus.Completed)
    expect(dist.participants[0].actualShare).toBe(7000)
    expect(dist.participants[1].actualShare).toBe(3000)
  })
})

describe('🤝团建 chain 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { resetSmartContractTestState(); svc = setup() })

  it('查询参与者分账份额', () => {
    const c = svc.revenue.createRevenueShare(5000, [
      { participantId: 'x', participantName: 'X', ratio: 1.0 },
    ]) as unknown as { contractId: string }
    svc.revenue.distributeRevenue(c.contractId)
    const share = svc.revenue.getParticipantShare(c.contractId, 'x')
    expect(share).not.toBeNull()
    expect(share!.expected).toBe(5000)
  })

  it('分账历史记录可追溯', () => {
    const c = svc.revenue.createRevenueShare(3000, [
      { participantId: 't', participantName: '团建', ratio: 1.0 },
    ]) as unknown as { contractId: string }
    svc.revenue.distributeRevenue(c.contractId)
    const history = svc.revenue.queryShareHistory(c.contractId)
    expect(history).toHaveLength(1)
    expect(history[0].amount).toBe(3000)
  })
})

describe('📢营销 chain 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { resetSmartContractTestState(); svc = setup() })

  it('智能合约部署和查询', async () => {
    const deployed = await svc.smart.deployContract('积分合约', ['param1']) as unknown as { contractId: string }
    expect(deployed.contractId).toBeDefined()
    const info = await svc.smart.getContractInfo(deployed.contractId)
    expect(info).toBeDefined()
  })

  it('智能合约列表包含所有部署的合约', async () => {
    await svc.smart.deployContract('C1', [])
    await svc.smart.deployContract('C2', [])
    const list = await svc.smart.listContracts()
    expect(list.length).toBeGreaterThanOrEqual(2)
  })

  it('估算 gas 消耗为正数', async () => {
    const d = await svc.smart.deployContract('测试合约', ['a']) as unknown as { contractId: string }
    const gas = await svc.smart.estimateGas(d.contractId, 'transfer', ['100'])
    expect(gas).toBeGreaterThan(0)
  })

  it('查询合约事件返回数组', async () => {
    const d = await svc.smart.deployContract('事件合约', []) as unknown as { contractId: string }
    const events = await svc.smart.getContractEvents(d.contractId)
    expect(Array.isArray(events)).toBe(true)
  })
})
