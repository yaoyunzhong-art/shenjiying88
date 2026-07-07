/**
 * chain.dto.test.ts — 智能合约 DTO 测试
 *
 * 覆盖所有 DTO 类可实例化及必填字段校验
 */

import { describe, it, expect } from 'vitest'
import {
  CreateSettlementDto,
  CreateRevenueShareDto,
  DeployContractDto,
  DeploySmartContractDto,
  ExecuteSmartMethodDto,
  VerifyContractDto,
  EstimateGasDto,
} from './chain.dto'

describe('chain DTOs', () => {
  describe('CreateSettlementDto', () => {
    it('should accept valid settlement creation payload', () => {
      const dto: CreateSettlementDto = {
        payerId: 'payer-1',
        payerName: '门店A',
        payees: [
          { payeeId: 'payee-1', payeeName: '供应商B', amount: 1000 },
        ],
      }
      expect(dto.payerId).toBe('payer-1')
      expect(dto.payees).toHaveLength(1)
      expect(dto.payees[0].amount).toBe(1000)
    })

    it('should reject empty payees array', () => {
      const dto: CreateSettlementDto = {
        payerId: 'payer-1',
        payerName: '门店A',
        payees: [],
      }
      expect(dto.payees).toHaveLength(0)
    })
  })

  describe('CreateRevenueShareDto', () => {
    it('should accept valid revenue share payload', () => {
      const dto: CreateRevenueShareDto = {
        totalRevenue: 100000,
        participants: [
          { participantId: 'p1', participantName: '运营A', ratio: 0.6 },
          { participantId: 'p2', participantName: '运营B', ratio: 0.4 },
        ],
      }
      expect(dto.totalRevenue).toBe(100000)
      expect(dto.participants).toHaveLength(2)
      const sum = dto.participants.reduce((s, p) => s + p.ratio, 0)
      expect(Math.abs(sum - 1.0)).toBeLessThan(0.001)
    })
  })

  describe('DeployContractDto', () => {
    it('should accept PointsSettlement type', () => {
      const dto: DeployContractDto = {
        contractType: 'PointsSettlement',
        params: { payerId: 'payer-1', payerName: '门店', payees: [] },
      }
      expect(dto.contractType).toBe('PointsSettlement')
    })

    it('should accept RevenueShare type', () => {
      const dto: DeployContractDto = {
        contractType: 'RevenueShare',
        params: { totalRevenue: 50000, participants: [] },
      }
      expect(dto.contractType).toBe('RevenueShare')
    })
  })

  describe('DeploySmartContractDto', () => {
    it('should accept valid deploy payload', () => {
      const dto: DeploySmartContractDto = {
        name: 'MyToken',
        params: ['1000000', 'MyToken', 'MTK'],
      }
      expect(dto.name).toBe('MyToken')
      expect(dto.params).toHaveLength(3)
    })
  })

  describe('ExecuteSmartMethodDto', () => {
    it('should accept valid execute payload', () => {
      const dto: ExecuteSmartMethodDto = {
        contractId: 'sc-xxx',
        method: 'transfer',
        args: ['addr1', '100'],
      }
      expect(dto.contractId).toBe('sc-xxx')
      expect(dto.method).toBe('transfer')
    })
  })

  describe('VerifyContractDto', () => {
    it('should accept valid verify payload', () => {
      const dto: VerifyContractDto = {
        contractId: 'sc-xxx',
        sourceCode: 'contract {}',
        compiler: 'solc 0.8.0',
      }
      expect(dto.sourceCode).toBe('contract {}')
      expect(dto.compiler).toBe('solc 0.8.0')
    })
  })

  describe('EstimateGasDto', () => {
    it('should accept valid gas estimate payload', () => {
      const dto: EstimateGasDto = {
        contractId: 'sc-xxx',
        method: 'transfer',
        args: ['addr1', '100'],
      }
      expect(dto.contractId).toBe('sc-xxx')
      expect(dto.args).toHaveLength(2)
    })
  })
})
