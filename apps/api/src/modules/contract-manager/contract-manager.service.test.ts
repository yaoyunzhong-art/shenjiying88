/**
 * contract-manager.service.spec.ts — 合同管理服务 V23 全覆盖测试
 *
 * 覆盖:
 *   - Contract CRUD (create / getContract / listContracts / updateContract / updateContractStatus)
 *   - Clause CRUD (addClause / listClauses / updateClause / deleteClause)
 *   - getExpiringContracts / getExpiredContracts
 *   - seedMockData / resetContractStoresForTests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ContractManagerService } from './contract-manager.service'
import { ContractStatus, ContractType } from './contract-manager.entity'

describe('ContractManagerService', () => {
  let service: ContractManagerService

  beforeEach(() => {
    service = new ContractManagerService()
    service.resetContractStoresForTests()
  })

  // ── Contract CRUD ────────────────────────────────────────────────────────

  describe('Contract CRUD', () => {
    const baseInput = () => ({
      tenantId: 't1',
      name: '测试采购合同',
      type: ContractType.Purchase,
      partyA: '甲方公司',
      partyB: '乙方公司',
      amount: 100000,
      startDate: '2026-08-01T00:00:00.000Z',
      endDate: '2026-12-31T23:59:59.000Z',
    })

    it('正例: createContract 应创建草稿合同', () => {
      const c = service.createContract(baseInput())
      expect(c.id).toMatch(/^contract-/)
      expect(c.contractNo).toMatch(/^CT/)
      expect(c.status).toBe(ContractStatus.Draft)
    })

    it('正例: getContract 应返回指定合同', () => {
      const c = service.createContract(baseInput())
      const got = service.getContract(c.id, 't1')
      expect(got).toBeTruthy()
      expect(got!.name).toBe('测试采购合同')
    })

    it('边缘: getContract 跨租户应返回 undefined', () => {
      const c = service.createContract(baseInput())
      expect(service.getContract(c.id, 't2')).toBeUndefined()
    })

    it('正例: listContracts 支持多条件筛选', () => {
      service.createContract(baseInput())
      service.createContract({ ...baseInput(), name: '销售合同', type: ContractType.Sale })
      const purchases = service.listContracts('t1', { type: ContractType.Purchase })
      expect(purchases).toHaveLength(1)
    })

    it('正例: listContracts 支持关键词搜索', () => {
      service.createContract(baseInput())
      const results = service.listContracts('t1', { search: '采购' })
      expect(results.length).toBeGreaterThanOrEqual(1)
    })

    it('正例: updateContract 应部分更新', () => {
      const c = service.createContract(baseInput())
      const updated = service.updateContract(c.id, 't1', { name: '新名称', amount: 200000 })
      expect(updated.name).toBe('新名称')
      expect(updated.amount).toBe(200000)
    })

    it('正例: updateContractStatus 应更新状态', () => {
      const c = service.createContract(baseInput())
      const signed = service.updateContractStatus(c.id, ContractStatus.Signed, 't1')
      expect(signed.status).toBe(ContractStatus.Signed)
      expect(signed.signedDate).toBeTruthy()
    })

    it('异常: 更新不存合同应抛错', () => {
      expect(() => service.updateContract('nonexistent', 't1', { name: 'n' })).toThrow()
    })
  })

  // ── Clause CRUD ──────────────────────────────────────────────────────────

  describe('Clause CRUD', () => {
    it('正例: addClause 应添加条款', () => {
      const c = service.createContract({
        tenantId: 't1', name: 'test', type: ContractType.Purchase,
        partyA: 'A', partyB: 'B', amount: 1000,
        startDate: '2026-08-01', endDate: '2026-12-31',
      })
      const clause = service.addClause({
        contractId: c.id, title: '付款条款', content: '月结30天', sortOrder: 1,
      })
      expect(clause.id).toMatch(/^clause-/)
      expect(clause.title).toBe('付款条款')
    })

    it('正例: listClauses 应按 sortOrder 排序', () => {
      const c = service.createContract({
        tenantId: 't1', name: 'test', type: ContractType.Purchase,
        partyA: 'A', partyB: 'B', amount: 1000,
        startDate: '2026-08-01', endDate: '2026-12-31',
      })
      service.addClause({ contractId: c.id, title: 'Z', content: 'z', sortOrder: 2 })
      service.addClause({ contractId: c.id, title: 'A', content: 'a', sortOrder: 1 })
      const clauses = service.listClauses(c.id)
      expect(clauses).toHaveLength(2)
      expect(clauses[0].title).toBe('A')
      expect(clauses[1].title).toBe('Z')
    })

    it('正例: updateClause 应部分更新', () => {
      const c = service.createContract({
        tenantId: 't1', name: 'test', type: ContractType.Purchase,
        partyA: 'A', partyB: 'B', amount: 1000,
        startDate: '2026-08-01', endDate: '2026-12-31',
      })
      const clause = service.addClause({ contractId: c.id, title: '旧标题', content: '旧内容', sortOrder: 1 })
      const updated = service.updateClause(clause.id, { title: '新标题' })
      expect(updated.title).toBe('新标题')
    })

    it('正例: deleteClause 应删除条款', () => {
      const c = service.createContract({
        tenantId: 't1', name: 'test', type: ContractType.Purchase,
        partyA: 'A', partyB: 'B', amount: 1000,
        startDate: '2026-08-01', endDate: '2026-12-31',
      })
      const clause = service.addClause({ contractId: c.id, title: 'T', content: 'c', sortOrder: 1 })
      service.deleteClause(clause.id)
      expect(service.listClauses(c.id)).toHaveLength(0)
    })
  })

  // ── Expiry Tracking ──────────────────────────────────────────────────────

  describe('Expiry Tracking', () => {
    it('正例: getExpiringContracts 应返回即将到期合同', () => {
      service.seedMockData('t1')
      const expiring = service.getExpiringContracts('t1', 90)
      expect(expiring.length).toBeGreaterThan(0)
    })

    it('正例: getExpiredContracts 应返回已过期合同', () => {
      service.seedMockData('t1')
      const expired = service.getExpiredContracts('t1')
      expect(expired.length).toBeGreaterThan(0)
    })
  })

  // ── Mock Data ────────────────────────────────────────────────────────────

  describe('Mock Data', () => {
    it('正例: seedMockData 应填充 10+ 合同', () => {
      service.seedMockData('t1')
      const contracts = service.listContracts('t1')
      expect(contracts.length).toBeGreaterThan(10)
    })

    it('正例: resetContractStoresForTests 应清空', () => {
      service.seedMockData('t1')
      service.resetContractStoresForTests()
      expect(service.listContracts('t1')).toHaveLength(0)
    })
  })
})
