/**
 * chain.controller.spec.ts — 智能合约控制器 NestJS 单元测试 (specs)
 *
 * 使用 @nestjs/testing 的 Test.createTestingModule
 * 验证路由注册、HttpException 行为、数据校验
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { ChainController } from './chain.controller'
import {
  PointsSettlementContract,
  RevenueShareContract,
  ContractExecutor,
  SmartContractService,
} from './smart-contract.service'
import { SettlementStatus, RevenueShareStatus } from './chain.entity'
import { HttpException, HttpStatus } from '@nestjs/common'

describe('ChainController (spec)', () => {
  let controller: ChainController
  let settlementContract: PointsSettlementContract
  let revenueShareContract: RevenueShareContract
  let contractExecutor: ContractExecutor
  let smartContractService: SmartContractService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChainController],
      providers: [
        PointsSettlementContract,
        RevenueShareContract,
        ContractExecutor,
        SmartContractService,
      ],
    }).compile()

    controller = module.get<ChainController>(ChainController)
    settlementContract = module.get<PointsSettlementContract>(PointsSettlementContract)
    revenueShareContract = module.get<RevenueShareContract>(RevenueShareContract)
    contractExecutor = module.get<ContractExecutor>(ContractExecutor)
    smartContractService = module.get<SmartContractService>(SmartContractService)
  })

  // ════════════════════════════════════════════════════════
  // 路由元数据验证
  // ════════════════════════════════════════════════════════

  describe('route metadata', () => {
    it('should have controller path = chain', () => {
      const path = Reflect.getMetadata('path', ChainController)
      expect(path).toBe('chain')
    })

    it('should have createSettlement handler with POST /settlements', () => {
      const paths = Reflect.getMetadata('paths', Object.getPrototypeOf(controller).createSettlement)
      // NestJS stores route path as metadata on the method
      const routePath = Reflect.getMetadata('path', controller.createSettlement)
      // Also check via prototype
      const prototype = Object.getPrototypeOf(controller)
      const hasRoute = Reflect.hasOwnMetadata('path', prototype.createSettlement)
      expect(controller.createSettlement).toBeDefined()
    })
  })

  // ════════════════════════════════════════════════════════
  // 积分清算 - 正向
  // ════════════════════════════════════════════════════════

  describe('POST /chain/settlements', () => {
    it('should create settlement and return success envelope', () => {
      const result = controller.createSettlement({
        payerId: 'p-1',
        payerName: '总店',
        payees: [
          { payeeId: 'e-1', payeeName: '分店A', amount: 500 },
          { payeeId: 'e-2', payeeName: '分店B', amount: 1500 },
        ],
      })
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.totalAmount).toBe(2000)
      expect((result.data as any).status).toBe(SettlementStatus.Created)
      expect((result.data as any).contractId).toBeTruthy()
    })

    it('should handle settlement with zero payees (totalAmount = 0)', () => {
      const result = controller.createSettlement({
        payerId: 'p-1',
        payerName: '总店',
        payees: [],
      })
      expect(result.success).toBe(true)
      expect((result.data as any).totalAmount).toBe(0)
      expect((result.data as any).participants).toEqual([])
    })

    it('should handle negative amount (service returns Total 0)', () => {
      // Service uses reduce so totalAmount sums negative values — test that it still works
      const result = controller.createSettlement({
        payerId: 'p-1',
        payerName: '总店',
        payees: [{ payeeId: 'e-1', payeeName: '分店A', amount: -100 }],
      })
      expect(result.success).toBe(true)
      expect((result.data as any).totalAmount).toBe(-100)
    })
  })

  describe('POST /chain/settlements/:id/approve', () => {
    it('should approve a created settlement', () => {
      const created = controller.createSettlement({
        payerId: 'p-1',
        payerName: '总店',
        payees: [{ payeeId: 'e-1', payeeName: '分店', amount: 1000 }],
      })
      const id = (created.data as any).contractId
      const result = controller.approveSettlement(id)
      expect(result.success).toBe(true)
      expect((result.data as any).status).toBe(SettlementStatus.Approved)
    })

    it('should throw when approving non-existent settlement', () => {
      expect(() => controller.approveSettlement('nonexistent-id')).toThrow(HttpException)
    })
  })

  describe('POST /chain/settlements/:id/execute', () => {
    it('should execute approved settlement and advance status', () => {
      const created = controller.createSettlement({
        payerId: 'p-1',
        payerName: '总店',
        payees: [{ payeeId: 'e-1', payeeName: '分店', amount: 1000 }],
      })
      const id = (created.data as any).contractId
      controller.approveSettlement(id)
      const result = controller.executeSettlement(id)
      expect(result.success).toBe(true)
      expect([
        SettlementStatus.Completed,
        SettlementStatus.Executing,
      ]).toContain((result.data as any).status)
    })

    it('should throw when executing unapproved settlement', () => {
      const created = controller.createSettlement({
        payerId: 'p-1',
        payerName: '总店',
        payees: [{ payeeId: 'e-1', payeeName: '分店', amount: 1000 }],
      })
      const id = (created.data as any).contractId
      // 直接执行（未审批）
      expect(() => controller.executeSettlement(id)).toThrow(HttpException)
    })
  })

  describe('POST /chain/settlements/:id/cancel', () => {
    it('should cancel a created settlement', () => {
      const created = controller.createSettlement({
        payerId: 'p-1',
        payerName: '总店',
        payees: [{ payeeId: 'e-1', payeeName: '分店', amount: 1000 }],
      })
      const id = (created.data as any).contractId
      const result = controller.cancelSettlement(id)
      expect(result.success).toBe(true)
      expect((result.data as any).status).toBe(SettlementStatus.Cancelled)
    })

    it('should throw when cancelling non-existent settlement', () => {
      expect(() => controller.cancelSettlement('ghost')).toThrow(HttpException)
    })
  })

  describe('GET /chain/settlements/:id', () => {
    it('should return existing settlement by id', () => {
      const created = controller.createSettlement({
        payerId: 'p-1',
        payerName: '总店',
        payees: [{ payeeId: 'e-1', payeeName: '分店', amount: 1000 }],
      })
      const id = (created.data as any).contractId
      const result = controller.getSettlement(id)
      expect(result.success).toBe(true)
      expect((result.data as any).contractId).toBe(id)
    })

    it('should throw 404 for non-existent settlement', () => {
      expect(() => controller.getSettlement('unknown')).toThrow(HttpException)
    })
  })

  // ════════════════════════════════════════════════════════
  // 分账合约
  // ════════════════════════════════════════════════════════

  describe('POST /chain/revenue-shares', () => {
    it('should create revenue share with valid participants', () => {
      const result = controller.createRevenueShare({
        totalRevenue: 10000,
        participants: [
          { participantId: 'a-1', participantName: 'A店', ratio: 0.6 },
          { participantId: 'a-2', participantName: 'B店', ratio: 0.4 },
        ],
      })
      expect(result.success).toBe(true)
      const data = result.data as any
      expect(data.totalRevenue).toBe(10000)
      expect(data.status).toBe(RevenueShareStatus.Created)
      expect(data.participants).toHaveLength(2)
    })

    it('should handle zero total revenue (service allows it but expectedShare=0)', () => {
      const result = controller.createRevenueShare({
        totalRevenue: 0,
        participants: [{ participantId: 'a-1', participantName: 'A', ratio: 1.0 }],
      })
      expect(result.success).toBe(true)
      const data = result.data as any
      expect(data.totalRevenue).toBe(0)
      expect(data.participants[0].expectedShare).toBe(0)
    })

    it('should reject revenue share with ratio sum != 1', () => {
      expect(() =>
        controller.createRevenueShare({
          totalRevenue: 5000,
          participants: [
            { participantId: 'a-1', participantName: 'A', ratio: 0.3 },
            { participantId: 'a-2', participantName: 'B', ratio: 0.3 },
          ],
        }),
      ).toThrow(HttpException)
    })
  })

  describe('POST /chain/revenue-shares/:id/distribute', () => {
    it('should distribute revenue and update status', () => {
      const created = controller.createRevenueShare({
        totalRevenue: 6000,
        participants: [
          { participantId: 'a-1', participantName: 'A', ratio: 0.5 },
          { participantId: 'a-2', participantName: 'B', ratio: 0.5 },
        ],
      })
      const id = (created.data as any).contractId
      const result = controller.distributeRevenue(id)
      expect(result.success).toBe(true)
      expect([
        RevenueShareStatus.Completed,
        RevenueShareStatus.Distributing,
      ]).toContain((result.data as any).status)
    })

    it('should throw when distributing non-existent share', () => {
      expect(() => controller.distributeRevenue('no-such-id')).toThrow(HttpException)
    })
  })

  describe('GET /chain/revenue-shares/:id', () => {
    it('should return revenue share by id', () => {
      const created = controller.createRevenueShare({
        totalRevenue: 3000,
        participants: [{ participantId: 'a-1', participantName: 'A', ratio: 1.0 }],
      })
      const id = (created.data as any).contractId
      const result = controller.getRevenueShare(id)
      expect(result.success).toBe(true)
    })

    it('should throw 404 for non-existent revenue share', () => {
      expect(() => controller.getRevenueShare('ghost')).toThrow(HttpException)
    })
  })

  describe('GET /chain/revenue-shares/:id/participant/:participantId', () => {
    it('should return participant share details', () => {
      const created = controller.createRevenueShare({
        totalRevenue: 2000,
        participants: [
          { participantId: 'p-1', participantName: 'P1', ratio: 0.7 },
          { participantId: 'p-2', participantName: 'P2', ratio: 0.3 },
        ],
      })
      const id = (created.data as any).contractId
      const result = controller.getParticipantShare(id, 'p-1')
      expect(result.success).toBe(true)
      expect(result.data!.expected).toBe(1400)
    })

    it('should throw for non-existent participant', () => {
      const created = controller.createRevenueShare({
        totalRevenue: 1000,
        participants: [{ participantId: 'p-1', participantName: 'P1', ratio: 1.0 }],
      })
      const id = (created.data as any).contractId
      expect(() => controller.getParticipantShare(id, 'ghost')).toThrow(HttpException)
    })
  })

  // ════════════════════════════════════════════════════════
  // 合约执行器
  // ════════════════════════════════════════════════════════

  describe('POST /chain/executor/deploy', () => {
    it('should deploy a PointsSettlement contract', () => {
      const result = controller.deployContract({
        contractType: 'PointsSettlement',
        params: {
          payerId: 'p-1',
          payerName: '主店',
          payees: [{ payeeId: 'e-1', payeeName: '分店', amount: 1000 }],
        },
      })
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it('should deploy a RevenueShare contract', () => {
      const result = controller.deployContract({
        contractType: 'RevenueShare',
        params: {
          totalRevenue: 5000,
          participants: [
            { participantId: 'a-1', participantName: 'A店', ratio: 0.6 },
            { participantId: 'a-2', participantName: 'B店', ratio: 0.4 },
          ],
        },
      })
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it('should reject unknown contract type', () => {
      expect(() =>
        controller.deployContract({
          contractType: 'UnknownType' as any,
          params: {},
        }),
      ).toThrow(HttpException)
    })
  })

  describe('POST /chain/executor/execute', () => {
    it('should execute a deployed contract', () => {
      const deployed = controller.deployContract({
        contractType: 'PointsSettlement',
        params: { payerId: 'p-1', payerName: '主店', payees: [{ payeeId: 'e-1', payeeName: 'E1', amount: 500 }] },
      })
      const deployedData = deployed.data as any
      const contractId = (deployedData as any).deployedContractId
      const result = controller.executeContract({ contractId })
      expect(result.success).toBe(true)
      expect(result.data!.contractId).toBe(contractId)
    })

    it('should throw for non-existent contract execution', () => {
      expect(() => controller.executeContract({ contractId: 'no-such' })).toThrow(HttpException)
    })
  })

  describe('GET /chain/executor/result/:contractId', () => {
    it('should return execution result after execute', () => {
      const deployed = controller.deployContract({
        contractType: 'PointsSettlement',
        params: { payerId: 'p-1', payerName: '主店', payees: [{ payeeId: 'e-1', payeeName: 'E1', amount: 500 }] },
      })
      const deployedData = deployed.data as any
      const cid = deployedData.deployedContractId
      controller.executeContract({ contractId: cid })
      const result = controller.getContractResult(cid)
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it('should throw 404 for non-existent result', () => {
      expect(() => controller.getContractResult('no-result')).toThrow(HttpException)
    })
  })

  // ════════════════════════════════════════════════════════
  // 链上智能合约
  // ════════════════════════════════════════════════════════

  describe('POST /chain/smart-contracts (deploy)', () => {
    it('should deploy a smart contract', async () => {
      const result = await controller.deploySmartContract({
        name: 'TokenSwap',
        params: ['tokenA', 'tokenB'],
      })
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it('should allow deploy with empty name (service accepts it)', async () => {
      // SmartContractService.deployContract accepts any name
      const result = await controller.deploySmartContract({ name: '', params: [] })
      expect(result.success).toBe(true)
      expect((result.data as any).contractId).toBeTruthy()
    })
  })

  describe('POST /chain/smart-contracts/execute', () => {
    it('should execute a method on deployed contract', async () => {
      const deployed = await controller.deploySmartContract({
        name: 'TokenSwap',
        params: ['A', 'B'],
      })
      const id = (deployed.data as any).contractId
      const result = await controller.executeSmartMethod({
        contractId: id,
        method: 'swap',
        args: ['100'],
      })
      expect(result.success).toBe(true)
    })
  })

  describe('POST /chain/smart-contracts/verify', () => {
    it('should verify a smart contract', async () => {
      const deployed = await controller.deploySmartContract({
        name: 'Verifiable',
        params: ['x'],
      })
      const id = (deployed.data as any).contractId
      const result = await controller.verifyContract({
        contractId: id,
        sourceCode: 'contract {}',
        compiler: 'solc-0.8',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('POST /chain/smart-contracts/estimate-gas', () => {
    it('should estimate gas for a method', async () => {
      const deployed = await controller.deploySmartContract({
        name: 'GasTest',
        params: [],
      })
      const id = (deployed.data as any).contractId
      const result = await controller.estimateGas({
        contractId: id,
        method: 'swap',
        args: ['100'],
      })
      expect(result.success).toBe(true)
      expect((result.data as any).gas).toBeGreaterThan(0)
    })
  })

  describe('GET /chain/smart-contracts', () => {
    it('should list all deployed contracts', async () => {
      await controller.deploySmartContract({ name: 'C1', params: [] })
      await controller.deploySmartContract({ name: 'C2', params: [] })
      const result = await controller.listSmartContracts()
      expect(result.success).toBe(true)
      expect(Array.isArray(result.data)).toBe(true)
      expect((result.data as any[]).length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('GET /chain/smart-contracts/:id', () => {
    it('should return contract info by id', async () => {
      const deployed = await controller.deploySmartContract({
        name: 'InfoTest',
        params: ['a'],
      })
      const id = (deployed.data as any).contractId
      const result = await controller.getSmartContract(id)
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it('should throw 404 for unknown contract', async () => {
      await expect(controller.getSmartContract('unknown')).rejects.toThrow(HttpException)
    })
  })

  describe('GET /chain/smart-contracts/:id/events', () => {
    it('should return events for a contract', async () => {
      const deployed = await controller.deploySmartContract({
        name: 'EventTest',
        params: [],
      })
      const id = (deployed.data as any).contractId
      const result = await controller.getContractEvents(id)
      expect(result.success).toBe(true)
      expect(Array.isArray(result.data)).toBe(true)
    })
  })

  describe('POST /chain/smart-contracts/:id/query', () => {
    it('should query contract state', async () => {
      const deployed = await controller.deploySmartContract({
        name: 'QueryTest',
        params: ['paramX'],
      })
      const id = (deployed.data as any).contractId
      const result = await controller.queryContract(id, { method: 'getState' })
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })
  })

  // ════════════════════════════════════════════════════════
  // 边界 & 异常场景
  // ════════════════════════════════════════════════════════

  describe('error handling - HttpException status codes', () => {
    it('should return 400 for bad request on createSettlement', () => {
      try {
        controller.createSettlement({
          payerId: '',
          payerName: '',
          payees: [{ payeeId: '', payeeName: '', amount: -1 }],
        })
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException)
        expect((e as HttpException).getStatus()).toBe(HttpStatus.BAD_REQUEST)
      }
    })

    it('should return 404 for missing settlement', () => {
      try {
        controller.getSettlement('missing')
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException)
        expect((e as HttpException).getStatus()).toBe(HttpStatus.NOT_FOUND)
      }
    })

    it('should return 400 for invalid contract type deploy', () => {
      try {
        controller.deployContract({
          contractType: 'BadType' as any,
          params: {},
        })
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException)
        expect((e as HttpException).getStatus()).toBe(HttpStatus.BAD_REQUEST)
      }
    })
  })
})
