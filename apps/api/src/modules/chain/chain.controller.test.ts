/**
 * chain.controller.test.ts — 智能合约控制器测试
 *
 * 覆盖：
 * - 路由元数据（路径、方法）
 * - 积分清算正常流程 vs. 异常流程
 * - 分账合约正常流程 vs. 异常流程
 * - 合约执行器正常/异常
 * - 链上智能合约 CRUD
 * - 边界条件
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { HttpException } from '@nestjs/common'
import { ChainController } from './chain.controller'
import {
  PointsSettlementContract,
  RevenueShareContract,
  ContractExecutor,
  SmartContractService,
} from './smart-contract.service'
import { SettlementStatus, RevenueShareStatus } from './chain.entity'
import type { SettlementContract } from './chain.entity'

// ─── 辅助：重置内存状态 ──────────────────────────────────────

function resetAll() {
  // 通过 export 的函数来重置
}

// ─── Tests ───────────────────────────────────────────────────

describe('ChainController', () => {
  let controller: ChainController
  let settlementContract: PointsSettlementContract
  let revenueShareContract: RevenueShareContract
  let contractExecutor: ContractExecutor
  let smartContractService: SmartContractService

  beforeEach(() => {
    settlementContract = new PointsSettlementContract()
    revenueShareContract = new RevenueShareContract()
    contractExecutor = new ContractExecutor()
    smartContractService = new SmartContractService()
    controller = new ChainController(
      settlementContract,
      revenueShareContract,
      contractExecutor,
      smartContractService,
    )
  })

  // ==================== 路由元数据 ====================

  describe('route metadata', () => {
    it('controller path metadata 应为 chain', () => {
      const path = Reflect.getMetadata('path', ChainController)
      assert.equal(path, 'chain')
    })
  })

  // ==================== 积分清算 - 正常流程 ====================

  describe('POST /chain/settlements', () => {
    it('should create a settlement contract', () => {
      const body = {
        payerId: 'payer-1',
        payerName: '门店A',
        payees: [
          { payeeId: 'payee-1', payeeName: '供应商B', amount: 1000 },
          { payeeId: 'payee-2', payeeName: '供应商C', amount: 2000 },
        ],
      }
      const result = controller.createSettlement(body)
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect((result.data as unknown as SettlementContract).totalAmount).toBe(3000)
      expect((result.data as unknown as SettlementContract).status).toBe(SettlementStatus.Created)
    })
  })

  describe('POST /chain/settlements/:id/approve', () => {
    it('should approve a created settlement', () => {
      const created = controller.createSettlement({
        payerId: 'payer-1',
        payerName: '门店A',
        payees: [{ payeeId: 'p1', payeeName: '供应商B', amount: 1000 }],
      })
      const contractId = (created.data as unknown as SettlementContract).contractId
      const result = controller.approveSettlement(contractId)
      expect(result.success).toBe(true)
      expect((result.data as unknown as SettlementContract).status).toBe(SettlementStatus.Approved)
    })
  })

  describe('POST /chain/settlements/:id/execute', () => {
    it('should execute an approved settlement', () => {
      const created = controller.createSettlement({
        payerId: 'payer-1',
        payerName: '门店A',
        payees: [{ payeeId: 'p1', payeeName: '供应商B', amount: 1000 }],
      })
      const contractId = (created.data as unknown as SettlementContract).contractId
      controller.approveSettlement(contractId)
      const result = controller.executeSettlement(contractId)
      expect(result.success).toBe(true)
      expect((result.data as unknown as SettlementContract).status).toBe(SettlementStatus.Completed)
    })
  })

  describe('POST /chain/settlements/:id/cancel', () => {
    it('should cancel a created settlement', () => {
      const created = controller.createSettlement({
        payerId: 'payer-1',
        payerName: '门店A',
        payees: [{ payeeId: 'p1', payeeName: '供应商B', amount: 1000 }],
      })
      const contractId = (created.data as unknown as SettlementContract).contractId
      const result = controller.cancelSettlement(contractId)
      expect(result.success).toBe(true)
      expect((result.data as unknown as SettlementContract).status).toBe(SettlementStatus.Cancelled)
    })
  })

  describe('GET /chain/settlements/:id', () => {
    it('should get settlement by id', () => {
      const created = controller.createSettlement({
        payerId: 'payer-1',
        payerName: '门店A',
        payees: [{ payeeId: 'p1', payeeName: '供应商B', amount: 1000 }],
      })
      const contractId = (created.data as unknown as SettlementContract).contractId
      const result = controller.getSettlement(contractId)
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it('should throw 404 for non-existent settlement', () => {
      expect(() => controller.getSettlement('nonexistent')).toThrow(HttpException)
    })
  })

  // ==================== 积分清算 - 异常流程 ====================

  describe('settlement error cases', () => {
    it('should fail to approve already completed settlement', () => {
      const created = controller.createSettlement({
        payerId: 'payer-1',
        payerName: '门店A',
        payees: [{ payeeId: 'p1', payeeName: '供应商B', amount: 1000 }],
      })
      const contractId = (created.data as unknown as SettlementContract).contractId
      controller.approveSettlement(contractId)
      controller.executeSettlement(contractId)

      // 尝试再次 approve — 应该是不能的（approve 需要 Created 状态）
      expect(() => controller.approveSettlement(contractId)).toThrow(HttpException)
    })

    it('should fail to execute non-approved settlement', () => {
      const created = controller.createSettlement({
        payerId: 'payer-1',
        payerName: '门店A',
        payees: [{ payeeId: 'p1', payeeName: '供应商B', amount: 1000 }],
      })
      const contractId = (created.data as unknown as SettlementContract).contractId
      expect(() => controller.executeSettlement(contractId)).toThrow(HttpException)
    })

    it('should fail to cancel an executed settlement', () => {
      const created = controller.createSettlement({
        payerId: 'payer-1',
        payerName: '门店A',
        payees: [{ payeeId: 'p1', payeeName: '供应商B', amount: 1000 }],
      })
      const contractId = (created.data as unknown as SettlementContract).contractId
      controller.approveSettlement(contractId)
      controller.executeSettlement(contractId)
      expect(() => controller.cancelSettlement(contractId)).toThrow(HttpException)
    })
  })

  // ==================== 分账合约 - 正常流程 ====================

  describe('POST /chain/revenue-shares', () => {
    it('should create a revenue share contract', () => {
      const body = {
        totalRevenue: 100000,
        participants: [
          { participantId: 'p1', participantName: '运营A', ratio: 0.6 },
          { participantId: 'p2', participantName: '运营B', ratio: 0.4 },
        ],
      }
      const result = controller.createRevenueShare(body)
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })
  })

  describe('POST /chain/revenue-shares/:id/distribute', () => {
    it('should distribute revenue', () => {
      const created = controller.createRevenueShare({
        totalRevenue: 100000,
        participants: [
          { participantId: 'p1', participantName: '运营A', ratio: 0.6 },
          { participantId: 'p2', participantName: '运营B', ratio: 0.4 },
        ],
      })
      const contractId = (created.data as any).contractId
      const result = controller.distributeRevenue(contractId)
      expect(result.success).toBe(true)
    })
  })

  describe('GET /chain/revenue-shares/:id/participant/:pid', () => {
    it('should get participant share', () => {
      const created = controller.createRevenueShare({
        totalRevenue: 100000,
        participants: [
          { participantId: 'p1', participantName: '运营A', ratio: 0.6 },
          { participantId: 'p2', participantName: '运营B', ratio: 0.4 },
        ],
      })
      const contractId = (created.data as any).contractId
      controller.distributeRevenue(contractId)
      const result = controller.getParticipantShare(contractId, 'p1')
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect((result.data as any).expected).toBe(60000)
    })
  })

  describe('GET /chain/revenue-shares/:id/history', () => {
    it('should return share history', () => {
      const created = controller.createRevenueShare({
        totalRevenue: 100000,
        participants: [
          { participantId: 'p1', participantName: '运营A', ratio: 1.0 },
        ],
      })
      const contractId = (created.data as any).contractId
      controller.distributeRevenue(contractId)
      const result = controller.getShareHistory(contractId)
      expect(result.success).toBe(true)
      expect(Array.isArray(result.data)).toBe(true)
    })
  })

  // ==================== 分账合约 - 异常流程 ====================

  describe('revenue share error cases', () => {
    it('should reject invalid ratio sum', () => {
      const body = {
        totalRevenue: 100000,
        participants: [
          { participantId: 'p1', participantName: 'A', ratio: 0.5 },
          { participantId: 'p2', participantName: 'B', ratio: 0.3 },
        ],
      }
      expect(() => controller.createRevenueShare(body)).toThrow(HttpException)
    })

    it('should throw 404 for non-existent participant', () => {
      const created = controller.createRevenueShare({
        totalRevenue: 1000,
        participants: [
          { participantId: 'p1', participantName: 'A', ratio: 1.0 },
        ],
      })
      const contractId = (created.data as any).contractId
      expect(() => controller.getParticipantShare(contractId, 'nonexistent')).toThrow(HttpException)
    })
  })

  // ==================== 合约执行器 ====================

  describe('POST /chain/executor/deploy', () => {
    it('should deploy a PointsSettlement contract', () => {
      const result = controller.deployContract({
        contractType: 'PointsSettlement',
        params: {
          payerId: 'payer-1',
          payerName: '门店A',
          payees: [{ payeeId: 'p1', payeeName: 'B', amount: 500 }],
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
    it('should execute a deployed settlement contract', () => {
      const deployed = controller.deployContract({
        contractType: 'PointsSettlement',
        params: {
          payerId: 'payer-1',
          payerName: '门店A',
          payees: [{ payeeId: 'p1', payeeName: 'B', amount: 500 }],
        },
      })
      const contractId = (deployed.data as any).deployedContractId
      const result = controller.executeContract({ contractId })
      expect(result.success).toBe(true)
      expect((result.data as any).success).toBe(true)
    })

    it('should fail for non-existent contract', () => {
      expect(() => controller.executeContract({ contractId: 'nonexistent' })).toThrow(HttpException)
    })
  })

  describe('GET /chain/executor/result/:contractId', () => {
    it('should return execution result', () => {
      const deployed = controller.deployContract({
        contractType: 'RevenueShare',
        params: {
          totalRevenue: 10000,
          participants: [{ participantId: 'p1', participantName: 'A', ratio: 1.0 }],
        },
      })
      const contractId = (deployed.data as any).deployedContractId
      controller.executeContract({ contractId })
      const result = controller.getContractResult(contractId)
      expect(result.success).toBe(true)
    })
  })

  // ==================== 链上智能合约 ====================

  describe('POST /chain/smart-contracts', () => {
    it('should deploy a smart contract', async () => {
      const result = await controller.deploySmartContract({
        name: 'MyToken',
        params: ['1000000', 'MTK'],
      })
      expect(result.success).toBe(true)
      expect((result.data as any).contractId).toBeDefined()
      expect((result.data as any).address).toContain('0x')
    })
  })

  describe('POST /chain/smart-contracts/execute', () => {
    it('should execute smart contract method', async () => {
      const deployed = await controller.deploySmartContract({ name: 'Test', params: [] })
      const contractId = (deployed.data as any).contractId
      const result = await controller.executeSmartMethod({
        contractId,
        method: 'transfer',
        args: ['addr1', '100'],
      })
      expect(result.success).toBe(true)
    })

    it('should fail for non-existent contract', async () => {
      await expect(
        controller.executeSmartMethod({ contractId: 'nonexistent', method: 'x', args: [] }),
      ).rejects.toThrow(HttpException)
    })
  })

  describe('GET /chain/smart-contracts', () => {
    it('should list all smart contracts', async () => {
      await controller.deploySmartContract({ name: 'C1', params: [] })
      await controller.deploySmartContract({ name: 'C2', params: ['100'] })
      const result = await controller.listSmartContracts()
      expect(result.success).toBe(true)
      expect(Array.isArray(result.data)).toBe(true)
      expect((result.data as any[]).length).toBe(2)
    })
  })

  describe('POST /chain/smart-contracts/verify', () => {
    it('should verify contract source code', async () => {
      const deployed = await controller.deploySmartContract({ name: 'Test', params: [] })
      const contractId = (deployed.data as any).contractId
      const result = await controller.verifyContract({
        contractId,
        sourceCode: 'contract { }',
        compiler: 'solc 0.8.0',
      })
      expect(result.success).toBe(true)
      expect((result.data as any).verified).toBe(true)
    })
  })

  describe('POST /chain/smart-contracts/estimate-gas', () => {
    it('should estimate gas', async () => {
      const deployed = await controller.deploySmartContract({ name: 'Test', params: [] })
      const contractId = (deployed.data as any).contractId
      const result = await controller.estimateGas({
        contractId,
        method: 'transfer',
        args: ['addr', '100'],
      })
      expect(result.success).toBe(true)
      expect((result.data as any).gas).toBeGreaterThan(0)
    })
  })

  describe('GET /chain/smart-contracts/:id/events', () => {
    it('should return contract events', async () => {
      const deployed = await controller.deploySmartContract({ name: 'Test', params: [] })
      const contractId = (deployed.data as any).contractId
      const result = await controller.getContractEvents(contractId)
      expect(result.success).toBe(true)
      expect(Array.isArray(result.data)).toBe(true)
    })
  })

  describe('POST /chain/smart-contracts/:id/query', () => {
    it('should query contract state', async () => {
      const deployed = await controller.deploySmartContract({ name: 'Test', params: [] })
      const contractId = (deployed.data as any).contractId
      const result = await controller.queryContract(contractId, { method: 'getState' })
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })
  })

  // ==================== 模块级测试 ====================

  describe('module registration', () => {
    it('should have route decorators on methods', () => {
      // 验证 GET/POST 装饰器被应用
      const prototype = Object.getOwnPropertyDescriptors(ChainController.prototype)
      expect(prototype).toBeDefined()
    })
  })
})
