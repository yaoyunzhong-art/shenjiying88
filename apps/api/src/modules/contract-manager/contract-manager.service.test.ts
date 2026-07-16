import { describe, it, beforeEach, afterEach } from 'vitest'
/**
 * 🐜 自动: [contract-manager] service 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ContractManagerService } from './contract-manager.service'
import { ContractStatus, ContractType } from './contract-manager.entity'

describe('ContractManagerService', () => {
  let service: ContractManagerService

  const TENANT = 'tenant-001'

  beforeEach(() => {
    service = new ContractManagerService()
  })

  afterEach(() => {
    service.resetContractStoresForTests()
  })

  function createTestContract(overrides?: Partial<Parameters<ContractManagerService['createContract']>[0]>) {
    return service.createContract({
      tenantId: TENANT,
      name: '测试合同',
      type: ContractType.Service,
      partyA: '甲方公司',
      partyB: '乙方公司',
      amount: 100000,
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-12-31T23:59:59.000Z',
      ...overrides,
    })
  }

  // ── CRUD ──

  describe('createContract', () => {
    it('should create a contract with DRAFT status', () => {
      const c = createTestContract()
      assert.equal(c.name, '测试合同')
      assert.equal(c.type, ContractType.Service)
      assert.equal(c.status, ContractStatus.Draft)
      assert.equal(c.tenantId, TENANT)
      assert.ok(c.id.startsWith('contract-'))
      assert.ok(c.contractNo.startsWith('CT'))
      assert.ok(c.createdAt)
    })
  })

  describe('getContract', () => {
    it('should return contract by id', () => {
      const c = createTestContract()
      const found = service.getContract(c.id, TENANT)
      assert.ok(found)
      assert.equal(found?.id, c.id)
    })

    it('should return undefined for non-existent contract', () => {
      assert.equal(service.getContract('nonexistent', TENANT), undefined)
    })

    it('should return undefined for wrong tenant', () => {
      const c = createTestContract()
      assert.equal(service.getContract(c.id, 'other-tenant'), undefined)
    })
  })

  describe('listContracts', () => {
    it('should list all contracts for tenant', () => {
      createTestContract({ name: '合同一' })
      createTestContract({ name: '合同二' })
      assert.equal(service.listContracts(TENANT).length, 2)
    })

    it('should filter by status', () => {
      const c1 = createTestContract({ name: '草稿合同' })
      service.updateContractStatus(c1.id, ContractStatus.Active, TENANT)
      createTestContract({ name: '草稿合同二' })

      const active = service.listContracts(TENANT, { status: ContractStatus.Active })
      assert.equal(active.length, 1)
    })

    it('should filter by type', () => {
      createTestContract({ name: '服务合同', type: ContractType.Service })
      createTestContract({ name: '采购合同', type: ContractType.Purchase })

      const purchase = service.listContracts(TENANT, { type: ContractType.Purchase })
      assert.equal(purchase.length, 1)
    })

    it('should search by name or contractNo', () => {
      createTestContract({ name: '采购框架协议' })
      const c2 = createTestContract({ name: '租赁合同' })

      const found = service.listContracts(TENANT, { search: '租赁' })
      assert.equal(found.length, 1)
      assert.equal(found[0].name, '租赁合同')

      const foundByNo = service.listContracts(TENANT, { search: c2.contractNo.slice(0, 6) })
      assert.equal(foundByNo.length, 1)
    })

    it('should not return contracts from other tenants', () => {
      createTestContract({ tenantId: TENANT })
      createTestContract({ tenantId: 'other-tenant' })
      assert.equal(service.listContracts(TENANT).length, 1)
    })
  })

  describe('updateContract', () => {
    it('should update contract fields', () => {
      const c = createTestContract()
      const updated = service.updateContract(c.id, TENANT, {
        name: '更新合同名',
        amount: 200000,
      })
      assert.equal(updated.name, '更新合同名')
      assert.equal(updated.amount, 200000)
      assert.ok(updated.updatedAt > c.updatedAt)
    })

    it('should throw on non-existent contract', () => {
      assert.throws(() => {
        service.updateContract('nonexistent', TENANT, { name: 'test' })
      }, /Contract not found/)
    })
  })

  describe('updateContractStatus', () => {
    it('should update contract status', () => {
      const c = createTestContract()
      const updated = service.updateContractStatus(c.id, ContractStatus.Active, TENANT)
      assert.equal(updated.status, ContractStatus.Active)
      assert.ok(updated.updatedAt > c.updatedAt)
    })

    it('should set signedDate when signing for first time', () => {
      const c = createTestContract()
      const updated = service.updateContractStatus(c.id, ContractStatus.Signed, TENANT)
      assert.equal(updated.status, ContractStatus.Signed)
      assert.ok(updated.signedDate)
    })

    it('should throw on non-existent contract', () => {
      assert.throws(() => {
        service.updateContractStatus('nonexistent', ContractStatus.Active, TENANT)
      }, /Contract not found/)
    })
  })

  // ── Clauses ──

  describe('addClause / listClauses', () => {
    it('should add and list clauses in sort order', () => {
      const c = createTestContract()
      service.addClause({ contractId: c.id, title: '第二条', content: '内容二', sortOrder: 2 })
      service.addClause({ contractId: c.id, title: '第一条', content: '内容一', sortOrder: 1 })

      const clauses = service.listClauses(c.id)
      assert.equal(clauses.length, 2)
      assert.equal(clauses[0].sortOrder, 1)
      assert.equal(clauses[1].sortOrder, 2)
    })

    it('should return empty array for contract with no clauses', () => {
      const c = createTestContract()
      assert.deepStrictEqual(service.listClauses(c.id), [])
    })
  })

  describe('updateClause', () => {
    it('should update clause content', () => {
      const c = createTestContract()
      const clause = service.addClause({ contractId: c.id, title: 'Title', content: 'Old', sortOrder: 1 })

      const updated = service.updateClause(clause.id, { content: 'New content' })
      assert.equal(updated.content, 'New content')
    })

    it('should throw on non-existent clause', () => {
      assert.throws(() => {
        service.updateClause('nonexistent', { title: 'test' })
      }, /Clause not found/)
    })
  })

  describe('deleteClause', () => {
    it('should delete a clause', () => {
      const c = createTestContract()
      const clause = service.addClause({ contractId: c.id, title: 'T', content: 'C', sortOrder: 1 })
      service.deleteClause(clause.id)

      assert.deepStrictEqual(service.listClauses(c.id), [])
    })

    it('should throw on non-existent clause', () => {
      assert.throws(() => {
        service.deleteClause('nonexistent')
      }, /Clause not found/)
    })
  })

  // ── Expiry Tracking ──

  describe('getExpiringContracts', () => {
    it('should return active contracts ending within range', () => {
      createTestContract({
        name: '即将到期',
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      })
      service.updateContractStatus(
        service.listContracts(TENANT).find((c) => c.name === '即将到期')!.id,
        ContractStatus.Active,
        TENANT,
      )

      const expiring = service.getExpiringContracts(TENANT, 30)
      assert.equal(expiring.length, 1)
      assert.equal(expiring[0].name, '即将到期')
    })

    it('should return empty if no contracts expiring', () => {
      createTestContract({
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2027-12-31T23:59:59.000Z',
      })
      service.updateContractStatus(
        service.listContracts(TENANT)[0].id,
        ContractStatus.Active,
        TENANT,
      )

      assert.deepStrictEqual(service.getExpiringContracts(TENANT, 1), [])
    })
  })

  describe('getExpiredContracts', () => {
    it('should return expired contracts', () => {
      createTestContract({
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2025-01-01T00:00:00.000Z',
      })
      service.updateContractStatus(
        service.listContracts(TENANT)[0].id,
        ContractStatus.Expired,
        TENANT,
      )

      const expired = service.getExpiredContracts(TENANT)
      assert.equal(expired.length, 1)
    })
  })

  // ── Seed ──

  describe('seedMockData', () => {
    it('should seed 16 contracts with clauses', () => {
      service.seedMockData(TENANT)
      const contracts = service.listContracts(TENANT)
      assert.equal(contracts.length, 16)

      // Some contracts should have clauses
      const firstContract = contracts.find((c) => c.name === '2026年度采购框架协议')
      assert.ok(firstContract)
      const clauses = service.listClauses(firstContract!.id)
      assert.ok(clauses.length >= 3)

      // Should have some expired contracts
      const expired = service.getExpiredContracts(TENANT)
      assert.ok(expired.length > 0)
    })
  })
})
