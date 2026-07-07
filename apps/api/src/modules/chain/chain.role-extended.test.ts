import { describe, it, expect, beforeEach } from 'vitest'
import {
  PointsSettlementContract,
  RevenueShareContract,
  ContractExecutor,
  SmartContractService,
} from './smart-contract.service'

/**
 * 🐜 [chain] 角色扩展测试
 * 覆盖积分清算、分账合约、合约执行器的边界场景
 */

function setup() {
  const settlement = new PointsSettlementContract()
  const revenue = new RevenueShareContract()
  const executor = new ContractExecutor(settlement, revenue)
  const smart = new SmartContractService()
  return { settlement, revenue, executor, smart }
}

describe('👔店长 chain 扩展测试', () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('创建积分清算合约', () => {
    const c = svc.settlement.createSettlement('payer1', '门店A', [
      { payeeId: 'e1', payeeName: '员工1', amount: 1000 },
    ])
    expect(c.totalAmount).toBe(1000)
    expect(c.status).toBe('Created')
  })

  it('查询不存在的合约返回 null', () => {
    expect(svc.settlement.getContractState('no-such')).toBeNull()
  })
})

describe('🛒前台 chain 扩展测试', () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('创建分账合约', () => {
    const c = svc.revenue.createRevenueShare(10000, [
      { participantId: 'p1', participantName: '商家A', ratio: 0.6 },
      { participantId: 'p2', participantName: '商家B', ratio: 0.4 },
    ])
    expect(c.participants).toHaveLength(2)
    expect(c.status).toBe('Created')
  })
})

describe('🔧安监 chain 扩展测试', () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('创建并取消积分清算', () => {
    const c = svc.settlement.createSettlement('p', '门店', [{ payeeId: 'e', payeeName: '员工', amount: 500 }])
    const cancelled = svc.settlement.cancelSettlement(c.contractId)
    expect(cancelled.status).toBe('Cancelled')
  })
})

describe('🎯运行专员 chain 扩展测试', () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('创建→审批→执行清算完整流程', () => {
    const c = svc.settlement.createSettlement('p', '门店', [{ payeeId: 'e', payeeName: '员工', amount: 2000 }])
    const approved = svc.settlement.approveSettlement(c.contractId)
    expect(approved.status).toBe('Approved')
    const executed = svc.settlement.executeSettlement(c.contractId)
    expect(executed.status).toBe('Completed')
  })

  it('分账合约分配收入', () => {
    const c = svc.revenue.createRevenueShare(10000, [
      { participantId: 'a', participantName: 'A', ratio: 0.7 },
      { participantId: 'b', participantName: 'B', ratio: 0.3 },
    ])
    const dist = svc.revenue.distributeRevenue(c.contractId)
    expect(dist.status).toBe('Completed')
    expect(dist.participants[0].actualShare).toBe(7000)
    expect(dist.participants[1].actualShare).toBe(3000)
  })
})

describe('🤝团建 chain 扩展测试', () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('查询参与者分账份额', () => {
    const c = svc.revenue.createRevenueShare(5000, [
      { participantId: 'x', participantName: 'X', ratio: 1.0 },
    ])
    svc.revenue.distributeRevenue(c.contractId)
    const share = svc.revenue.getParticipantShare(c.contractId, 'x')
    expect(share).not.toBeNull()
    expect(share!.expected).toBe(5000)
  })
})

describe('📢营销 chain 扩展测试', () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('智能合约部署和查询', async () => {
    const deployed = await svc.smart.deployContract('积分合约', ['param1'])
    expect(deployed.contractId).toBeDefined()
    const info = await svc.smart.getContractInfo(deployed.contractId)
    expect(info).toBeDefined()
  })

  it('智能合约列表', async () => {
    await svc.smart.deployContract('C1', [])
    await svc.smart.deployContract('C2', [])
    const list = await svc.smart.listContracts()
    expect(list.length).toBeGreaterThanOrEqual(2)
  })

  it('估算 gas 消耗', async () => {
    const d = await svc.smart.deployContract('测试合约', ['a'])
    const gas = await svc.smart.estimateGas(d.contractId, 'transfer', ['100'])
    expect(gas).toBeGreaterThan(0)
  })

  it('查询合约事件', async () => {
    const d = await svc.smart.deployContract('事件合约', [])
    const events = await svc.smart.getContractEvents(d.contractId)
    expect(Array.isArray(events)).toBe(true)
  })
})
