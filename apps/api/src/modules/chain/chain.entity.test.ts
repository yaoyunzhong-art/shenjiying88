/**
 * chain.entity.test.ts — 智能合约实体测试
 *
 * 覆盖枚举值、接口形状、合约状态流转
 */

import { describe, it, expect } from 'vitest'
import {
  SettlementStatus,
  RevenueShareStatus,
} from './chain.entity'
import type {
  SettlementContract,
  RevenueShareContract as RevenueShareContractType,
  SmartContract,
  ContractExecutionResult,
  ShareHistoryEntry,
} from './chain.entity'

describe('chain entities', () => {
  describe('SettlementStatus', () => {
    it('should have all required statuses', () => {
      expect(SettlementStatus.Created).toBe('Created')
      expect(SettlementStatus.Approved).toBe('Approved')
      expect(SettlementStatus.Executing).toBe('Executing')
      expect(SettlementStatus.Completed).toBe('Completed')
      expect(SettlementStatus.Cancelled).toBe('Cancelled')
      expect(SettlementStatus.Failed).toBe('Failed')
    })
  })

  describe('RevenueShareStatus', () => {
    it('should have all required statuses', () => {
      expect(RevenueShareStatus.Created).toBe('Created')
      expect(RevenueShareStatus.Distributing).toBe('Distributing')
      expect(RevenueShareStatus.Completed).toBe('Completed')
      expect(RevenueShareStatus.PartialCompleted).toBe('PartialCompleted')
      expect(RevenueShareStatus.Cancelled).toBe('Cancelled')
    })
  })

  describe('SettlementContract interface', () => {
    it('should create a valid settlement contract object', () => {
      const contract: SettlementContract = {
        contractId: 'sc-test-1',
        payerId: 'payer-1',
        payerName: '门店A',
        participants: [
          { payeeId: 'payee-1', payeeName: '供应商B', amount: 1000, transferred: false },
        ],
        totalAmount: 1000,
        status: SettlementStatus.Created,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      }
      expect(contract.contractId).toBe('sc-test-1')
      expect(contract.totalAmount).toBe(1000)
      expect(contract.status).toBe(SettlementStatus.Created)
    })

    it('should allow optional approvedAt field', () => {
      const contract: SettlementContract = {
        contractId: 'sc-test-2',
        payerId: 'payer-1',
        payerName: '门店A',
        participants: [],
        totalAmount: 0,
        status: SettlementStatus.Approved,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        approvedAt: '2026-01-02T00:00:00Z',
      }
      expect(contract.approvedAt).toBeDefined()
    })

    it('should allow failureReason when status is Failed', () => {
      const contract: SettlementContract = {
        contractId: 'sc-fail-1',
        payerId: 'payer-1',
        payerName: '门店A',
        participants: [],
        totalAmount: 999999,
        status: SettlementStatus.Failed,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        failureReason: 'Insufficient balance',
      }
      expect(contract.failureReason).toBe('Insufficient balance')
      expect(contract.status).toBe(SettlementStatus.Failed)
    })

    it('should track participant transfer status', () => {
      const contract: SettlementContract = {
        contractId: 'sc-test-3',
        payerId: 'payer-1',
        payerName: '门店A',
        participants: [
          { payeeId: 'p1', payeeName: '参与方1', amount: 500, transferred: true },
          { payeeId: 'p2', payeeName: '参与方2', amount: 300, transferred: false },
        ],
        totalAmount: 800,
        status: SettlementStatus.Completed,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        executedAt: '2026-01-01T01:00:00Z',
      }
      expect(contract.participants[0].transferred).toBe(true)
      expect(contract.participants[1].transferred).toBe(false)
    })
  })

  describe('RevenueShareContract interface', () => {
    it('should create a valid revenue share contract object', () => {
      const contract: RevenueShareContractType = {
        contractId: 'rs-test-1',
        totalRevenue: 100000,
        participants: [
          { participantId: 'p1', participantName: '运营A', ratio: 0.6, expectedShare: 60000, actualShare: 0, distributed: false },
          { participantId: 'p2', participantName: '运营B', ratio: 0.4, expectedShare: 40000, actualShare: 0, distributed: false },
        ],
        status: RevenueShareStatus.Created,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      }
      expect(contract.totalRevenue).toBe(100000)
      expect(contract.participants).toHaveLength(2)
    })

    it('should update after distribution', () => {
      const contract: RevenueShareContractType = {
        contractId: 'rs-test-2',
        totalRevenue: 50000,
        participants: [
          { participantId: 'p1', participantName: '运营A', ratio: 1.0, expectedShare: 50000, actualShare: 50000, distributed: true },
        ],
        status: RevenueShareStatus.Completed,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        distributedAt: '2026-01-01T01:00:00Z',
      }
      expect(contract.participants[0].distributed).toBe(true)
      expect(contract.participants[0].actualShare).toBe(50000)
    })
  })

  describe('SmartContract interface', () => {
    it('should create a valid smart contract object', () => {
      const sc: SmartContract = {
        contractId: 'sc-block-1',
        name: 'MyToken',
        address: '0x1234567890abcdef',
        params: ['1000000', 'MTK'],
        deployedAt: '2026-01-01T00:00:00Z',
      }
      expect(sc.address).toContain('0x')
      expect(sc.params).toHaveLength(2)
    })
  })

  describe('ContractExecutionResult interface', () => {
    it('should capture successful execution', () => {
      const result: ContractExecutionResult = {
        contractId: 'sc-test-1',
        success: true,
        output: { status: 'Completed', totalAmount: 1000 },
        executedAt: '2026-01-01T01:00:00Z',
      }
      expect(result.success).toBe(true)
      expect(result.output).toBeDefined()
      expect(result.error).toBeUndefined()
    })

    it('should capture failed execution', () => {
      const result: ContractExecutionResult = {
        contractId: 'sc-test-fail',
        success: false,
        error: 'Insufficient balance',
        executedAt: '2026-01-01T01:00:00Z',
      }
      expect(result.success).toBe(false)
      expect(result.error).toBe('Insufficient balance')
    })
  })

  describe('ShareHistoryEntry interface', () => {
    it('should create a valid history entry', () => {
      const entry: ShareHistoryEntry = {
        contractId: 'rs-test-1',
        participantId: 'p1',
        participantName: '运营A',
        amount: 60000,
        distributedAt: '2026-01-01T01:00:00Z',
      }
      expect(entry.amount).toBe(60000)
      expect(entry.participantName).toBe('运营A')
    })
  })
})
