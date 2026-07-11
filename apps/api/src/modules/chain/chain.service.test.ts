/**
 * chain.service.test.ts — ChainService 单元测试
 *
 * 覆盖：
 *  - 积分清算：创建/审批/执行/取消/查询
 *  - 分账：创建/分发/查询/历史
 *  - 合约执行器：部署/执行/查询结果
 *  - 链上合约：部署/执行/查询/列举/验证/Gas/事件
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ChainService } from './chain.service'
import {
  PointsSettlementContract,
  RevenueShareContract,
  ContractExecutor,
  SmartContractService,
  resetSmartContractTestState,
} from './smart-contract.service'
import type { CreateSettlementDto, CreateRevenueShareDto } from './chain.service'

describe('ChainService', () => {
  let service: ChainService

  beforeEach(() => {
    resetSmartContractTestState()
    service = new ChainService(
      new PointsSettlementContract(),
      new RevenueShareContract(),
      new ContractExecutor(),
      new SmartContractService(),
    )
  })

  // ── 积分清算 ──────────────────────────────────────────

  describe('积分清算', () => {
    const settlementDto: CreateSettlementDto = {
      payerId: 'payer_1',
      payerName: '公司A',
      payees: [
        { payeeId: 'payee_1', payeeName: '供货商B', amount: 500 },
        { payeeId: 'payee_2', payeeName: '供货商C', amount: 300 },
      ],
    }

    it('正例: 创建结算合约成功', () => {
      const res = service.createSettlement(settlementDto)
      expect(res.success).toBe(true)
      expect(res.data).toBeDefined()
      const contract = res.data!
      expect(contract.contractId).toMatch(/^sc-/)
      expect(contract.participants).toHaveLength(2)
      expect(contract.totalAmount).toBe(800)
    })

    it('正例: 审批 -> 执行 -> 完成流程', () => {
      const { data: created } = service.createSettlement(settlementDto)
      const contractId = created!.contractId

      const approved = service.approveSettlement(contractId)
      expect(approved.success).toBe(true)

      const executed = service.executeSettlement(contractId)
      expect(executed.success).toBe(true)
      expect(executed.data!.status).toBe('Completed')
    })

    it('反例: 未审批直接执行报错', () => {
      const { data: created } = service.createSettlement(settlementDto)
      const executed = service.executeSettlement(created!.contractId)
      expect(executed.success).toBe(false)
      expect(executed.error).toContain('must be Approved')
    })

    it('正例: 取消已创建的合约', () => {
      const { data: created } = service.createSettlement(settlementDto)
      const cancelled = service.cancelSettlement(created!.contractId)
      expect(cancelled.success).toBe(true)
      expect(cancelled.data!.status).toBe('Cancelled')
    })

    it('反例: 取消不存在的合约', () => {
      const res = service.cancelSettlement('nonexistent')
      expect(res.success).toBe(false)
      expect(res.error).toBeDefined()
    })

    it('正例: 查询结算合约', () => {
      const { data: created } = service.createSettlement(settlementDto)
      const query = service.getSettlement(created!.contractId)
      expect(query.success).toBe(true)
      expect(query.data).not.toBeNull()
      expect(query.data!.contractId).toBe(created!.contractId)
    })

    it('边界: 查询不存在的合约返回空', () => {
      const res = service.getSettlement('noop')
      expect(res.success).toBe(true)
      expect(res.data).toBeUndefined()
    })
  })

  // ── 分账 ──────────────────────────────────────────────

  describe('分账', () => {
    const revenueShareDto: CreateRevenueShareDto = {
      totalRevenue: 10000,
      participants: [
        { participantId: 'p1', participantName: '合伙人甲', ratio: 0.5 },
        { participantId: 'p2', participantName: '合伙人乙', ratio: 0.3 },
        { participantId: 'p3', participantName: '合伙人丙', ratio: 0.2 },
      ],
    }

    it('正例: 创建分账合约成功', () => {
      const res = service.createRevenueShare(revenueShareDto)
      expect(res.success).toBe(true)
      expect(res.data!.contractId).toMatch(/^rs-/)
      expect(res.data!.participants).toHaveLength(3)
    })

    it('正例: 分发分账', () => {
      const { data: created } = service.createRevenueShare(revenueShareDto)
      const distributed = service.distributeRevenue(created!.contractId)
      expect(distributed.success).toBe(true)
      expect(distributed.data!.status).toBe('Completed')
    })

    it('正例: 查询参与者分账', () => {
      const { data: created } = service.createRevenueShare(revenueShareDto)
      service.distributeRevenue(created!.contractId)
      const share = service.getParticipantShare(created!.contractId, 'p1')
      expect(share.success).toBe(true)
      expect(share.data!.expected).toBe(5000)
      expect(share.data!.distributed).toBe(true)
    })

    it('正例: 查询分账历史', () => {
      const { data: created } = service.createRevenueShare(revenueShareDto)
      service.distributeRevenue(created!.contractId)
      const history = service.getShareHistory(created!.contractId)
      expect(history.success).toBe(true)
      expect(history.data!.length).toBe(3)
    })

    it('反例: 比例不等于1时创建失败', () => {
      const badDto: CreateRevenueShareDto = {
        totalRevenue: 1000,
        participants: [
          { participantId: 'p1', participantName: 'A', ratio: 0.6 },
          { participantId: 'p2', participantName: 'B', ratio: 0.2 },
        ],
      }
      const res = service.createRevenueShare(badDto)
      expect(res.success).toBe(false)
      expect(res.error).toContain('sum to 1.0')
    })
  })

  // ── 合约执行器 ──────────────────────────────────────────

  describe('合约执行器', () => {
    it('正例: 部署积分清算合约', () => {
      const res = service.deployContract('PointsSettlement', {
        payerId: 'payer_1',
        payerName: '公司A',
        payees: [{ payeeId: 'payee_1', payeeName: '供货商B', amount: 100 }],
      })
      expect(res.success).toBe(true)
      expect(res.data!.deployedContractId).toBeDefined()
      expect(res.data!.contractType).toBe('PointsSettlement')
    })

    it('正例: 部署并执行合约', () => {
      const { data: deployed } = service.deployContract('PointsSettlement', {
        payerId: 'payer_1',
        payerName: '公司A',
        payees: [{ payeeId: 'payee_1', payeeName: '供货商B', amount: 100 }],
      })
      const executed = service.executeContract(deployed!.deployedContractId)
      expect(executed.success).toBe(true)
      expect(executed.data!.success).toBe(true)
    })

    it('反例: 执行不存在的合约报错', () => {
      const res = service.executeContract('nonexistent')
      expect(res.success).toBe(false)
      expect(res.error).toBeDefined()
    })

    it('正例: 查询执行结果', () => {
      const { data: deployed } = service.deployContract('RevenueShare', {
        totalRevenue: 5000,
        participants: [
          { participantId: 'p1', participantName: 'A', ratio: 1.0 },
        ],
      })
      service.executeContract(deployed!.deployedContractId)
      const result = service.getExecutionResult(deployed!.deployedContractId)
      expect(result.success).toBe(true)
      expect(result.data).not.toBeNull()
    })
  })

  // ── 链上合约操作 ──────────────────────────────────────

  describe('链上合约操作', () => {
    it('正例: 部署智能合约', async () => {
      const res = await service.deploySmartContract('PointsSettlement', ['arg1'])
      expect(res.success).toBe(true)
      expect(res.data!.contractId).toBeDefined()
      expect(res.data!.address).toMatch(/^0x/)
    })

    it('正例: 执行智能合约', async () => {
      const { data: deployed } = await service.deploySmartContract('RevenueShare', [])
      const executed = await service.executeSmartContract(deployed!.contractId, 'distribute', [])
      expect(executed.success).toBe(true)
      expect(executed.data!.success).toBe(true)
    })

    it('反例: 执行不存在合约报错', async () => {
      const res = await service.executeSmartContract('noop', 'run', [])
      expect(res.success).toBe(false)
      expect(res.error).toContain('not found')
    })

    it('正例: 查询合约信息', async () => {
      const { data: deployed } = await service.deploySmartContract('MyContract', ['p1'])
      const info = await service.getSmartContractInfo(deployed!.contractId)
      expect(info.success).toBe(true)
      expect(info.data!.name).toBe('MyContract')
    })

    it('正例: 列举所有合约', async () => {
      await service.deploySmartContract('C1', [])
      await service.deploySmartContract('C2', [])
      const list = await service.listSmartContracts()
      expect(list.success).toBe(true)
      expect(list.data!.length).toBe(2)
    })

    it('正例: 验证合约', async () => {
      const { data: deployed } = await service.deploySmartContract('Test', [])
      const verified = await service.verifySmartContract(deployed!.contractId, 'source', 'solc')
      expect(verified.success).toBe(true)
      expect(verified.data!.verified).toBe(true)
    })

    it('正例: 估算 Gas', async () => {
      const { data: deployed } = await service.deploySmartContract('GasTest', [])
      const gas = await service.estimateGas(deployed!.contractId, 'transfer', ['100'])
      expect(gas.success).toBe(true)
      expect(gas.data).toBeGreaterThan(0)
    })

    it('正例: 获取合约事件', async () => {
      const { data: deployed } = await service.deploySmartContract('EventTest', [])
      const events = await service.getContractEvents(deployed!.contractId)
      expect(events.success).toBe(true)
      expect(Array.isArray(events.data)).toBe(true)
    })

    it('正例: querySmartContract', async () => {
      const { data: deployed } = await service.deploySmartContract('QueryTest', [])
      const query = await service.querySmartContract(deployed!.contractId, 'getState')
      expect(query.success).toBe(true)
    })

    it('反例: 查询不存在的合约', async () => {
      const res = await service.getSmartContractInfo('noop')
      expect(res.success).toBe(false)
      expect(res.error).toContain('not found')
    })
  })

  // ── 端点流程集成 ──────────────────────────────────────

  describe('集成场景', () => {
    it('正例: 完整结算 -> 审计流程', () => {
      // 创建结算
      const { data: created } = service.createSettlement({
        payerId: 'player_x',
        payerName: '玩家X',
        payees: [{ payeeId: 'shop', payeeName: '商店', amount: 200 }],
      })
      expect(created).toBeDefined()

      // 审批通过
      const approved = service.approveSettlement(created!.contractId)
      expect(approved.success).toBe(true)

      // 执行
      const executed = service.executeSettlement(created!.contractId)
      expect(executed.success).toBe(true)
      expect(executed.data!.status).toBe('Completed')

      // 查询确认
      const query = service.getSettlement(created!.contractId)
      expect(query.data!.status).toBe('Completed')
    })

    it('正例: 分账查询历史完整', () => {
      const { data: created } = service.createRevenueShare({
        totalRevenue: 6000,
        participants: [
          { participantId: 'a', participantName: 'A', ratio: 0.5 },
          { participantId: 'b', participantName: 'B', ratio: 0.5 },
        ],
      })
      service.distributeRevenue(created!.contractId)
      const history = service.getShareHistory(created!.contractId)
      expect(history.data!.length).toBe(2)
      expect(history.data!.every(h => h.amount > 0)).toBe(true)
    })
  })
})
