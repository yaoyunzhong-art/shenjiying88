import { describe, it, beforeEach, afterEach } from 'vitest'
/**
 * 🐜 自动: [contract-manager] controller 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ContractManagerController } from './contract-manager.controller'
import { ContractManagerService } from './contract-manager.service'
import { ContractStatus, ContractType } from './contract-manager.entity'

describe('ContractManagerController', () => {
  let controller: InstanceType<typeof ContractManagerController>
  let service: InstanceType<typeof ContractManagerService>

  const TENANT = { tenantId: 'tenant-001' }

  beforeEach(() => {
    service = new ContractManagerService()
    controller = new ContractManagerController(service)
  })

  afterEach(() => {
    service.resetContractStoresForTests()
  })

  // ── Route metadata ──

  describe('route metadata', () => {
    it('controller path should be contracts', () => {
      const path = Reflect.getMetadata('path', ContractManagerController)
      assert.equal(path, 'contracts')
    })

    it('createContract should be POST /', () => {
      const method = Reflect.getMetadata('method', ContractManagerController.prototype.createContract)
      const path = Reflect.getMetadata('path', ContractManagerController.prototype.createContract)
      assert.equal(method, 1) // POST
      assert.equal(path, '/')
    })

    it('listContracts should be GET /', () => {
      const method = Reflect.getMetadata('method', ContractManagerController.prototype.listContracts)
      const path = Reflect.getMetadata('path', ContractManagerController.prototype.listContracts)
      assert.equal(method, 0) // GET
      assert.equal(path, '/')
    })

    it('getContract should be GET /:contractId', () => {
      const method = Reflect.getMetadata('method', ContractManagerController.prototype.getContract)
      const path = Reflect.getMetadata('path', ContractManagerController.prototype.getContract)
      assert.equal(method, 0)
      assert.equal(path, ':contractId')
    })

    it('updateContract should be PATCH /:contractId', () => {
      const method = Reflect.getMetadata('method', ContractManagerController.prototype.updateContract)
      const path = Reflect.getMetadata('path', ContractManagerController.prototype.updateContract)
      assert.equal(method, 4) // PATCH
      assert.equal(path, ':contractId')
    })

    it('updateContractStatus should be PATCH /:contractId/status', () => {
      const method = Reflect.getMetadata('method', ContractManagerController.prototype.updateContractStatus)
      const path = Reflect.getMetadata('path', ContractManagerController.prototype.updateContractStatus)
      assert.equal(method, 4)
      assert.equal(path, ':contractId/status')
    })

    it('getExpiringContracts should be GET /analysis/expiring', () => {
      const method = Reflect.getMetadata('method', ContractManagerController.prototype.getExpiringContracts)
      const path = Reflect.getMetadata('path', ContractManagerController.prototype.getExpiringContracts)
      assert.equal(method, 0)
      assert.equal(path, 'analysis/expiring')
    })

    it('addClause should be POST /:contractId/clauses', () => {
      const method = Reflect.getMetadata('method', ContractManagerController.prototype.addClause)
      const path = Reflect.getMetadata('path', ContractManagerController.prototype.addClause)
      assert.equal(method, 1) // POST
      assert.equal(path, ':contractId/clauses')
    })

    it('listClauses should be GET /:contractId/clauses', () => {
      const method = Reflect.getMetadata('method', ContractManagerController.prototype.listClauses)
      const path = Reflect.getMetadata('path', ContractManagerController.prototype.listClauses)
      assert.equal(method, 0) // GET
      assert.equal(path, ':contractId/clauses')
    })

    it('bulkAddClauses should be POST /:contractId/clauses/bulk', () => {
      const method = Reflect.getMetadata('method', ContractManagerController.prototype.bulkAddClauses)
      const path = Reflect.getMetadata('path', ContractManagerController.prototype.bulkAddClauses)
      assert.equal(method, 1)
      assert.equal(path, ':contractId/clauses/bulk')
    })

    it('updateClause should be PATCH /clauses/:clauseId', () => {
      const method = Reflect.getMetadata('method', ContractManagerController.prototype.updateClause)
      const path = Reflect.getMetadata('path', ContractManagerController.prototype.updateClause)
      assert.equal(method, 4)
      assert.equal(path, 'clauses/:clauseId')
    })

    it('deleteClause should be DELETE /clauses/:clauseId', () => {
      const method = Reflect.getMetadata('method', ContractManagerController.prototype.deleteClause)
      const path = Reflect.getMetadata('path', ContractManagerController.prototype.deleteClause)
      assert.equal(method, 3) // DELETE
      assert.equal(path, 'clauses/:clauseId')
    })

    it('seedMockData should be POST /seed', () => {
      const method = Reflect.getMetadata('method', ContractManagerController.prototype.seedMockData)
      const path = Reflect.getMetadata('path', ContractManagerController.prototype.seedMockData)
      assert.equal(method, 1) // POST
      assert.equal(path, 'seed')
    })
  })

  // ── Controller Logic ──

  describe('createContract', () => {
    it('should create contract via controller', () => {
      const c = controller.createContract(TENANT, {
        name: '新合同',
        type: ContractType.Service,
        partyA: 'A公司',
        partyB: 'B公司',
        amount: 50000,
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-12-31T23:59:59.000Z',
      })

      assert.equal(c.name, '新合同')
      assert.equal(c.status, ContractStatus.Draft)
    })
  })

  describe('listContracts', () => {
    it('should list contracts', () => {
      controller.createContract(TENANT, {
        name: 'C1', type: ContractType.Service, partyA: 'A', partyB: 'B',
        amount: 100, startDate: '2026-01-01T00:00:00.000Z', endDate: '2026-12-31T23:59:59.000Z',
      })
      controller.createContract(TENANT, {
        name: 'C2', type: ContractType.Purchase, partyA: 'A', partyB: 'B',
        amount: 200, startDate: '2026-01-01T00:00:00.000Z', endDate: '2026-12-31T23:59:59.000Z',
      })

      assert.equal(controller.listContracts(TENANT, {}).length, 2)
    })
  })

  describe('getContract', () => {
    it('should get contract by id', () => {
      const c = controller.createContract(TENANT, {
        name: 'Test', type: ContractType.Lease, partyA: 'A', partyB: 'B',
        amount: 100, startDate: '2026-01-01T00:00:00.000Z', endDate: '2026-12-31T23:59:59.000Z',
      })

      const found = controller.getContract(TENANT, c.id)
      assert.equal(found.id, c.id)
    })

    it('should throw on non-existent contract', () => {
      assert.throws(() => {
        controller.getContract(TENANT, 'nonexistent')
      }, /Contract not found/)
    })
  })

  describe('updateContract', () => {
    it('should update contract', () => {
      const c = controller.createContract(TENANT, {
        name: 'Old Name', type: ContractType.Service, partyA: 'A', partyB: 'B',
        amount: 100, startDate: '2026-01-01T00:00:00.000Z', endDate: '2026-12-31T23:59:59.000Z',
      })

      const updated = controller.updateContract(TENANT, c.id, { name: 'New Name' })
      assert.equal(updated.name, 'New Name')
    })
  })

  describe('updateContractStatus', () => {
    it('should update status', () => {
      const c = controller.createContract(TENANT, {
        name: 'Test', type: ContractType.Service, partyA: 'A', partyB: 'B',
        amount: 100, startDate: '2026-01-01T00:00:00.000Z', endDate: '2026-12-31T23:59:59.000Z',
      })

      const updated = controller.updateContractStatus(TENANT, c.id, { status: ContractStatus.Active })
      assert.equal(updated.status, ContractStatus.Active)
    })
  })

  describe('Clauses', () => {
    it('should add, list, update, and delete clauses', () => {
      const c = controller.createContract(TENANT, {
        name: 'Test', type: ContractType.Service, partyA: 'A', partyB: 'B',
        amount: 100, startDate: '2026-01-01T00:00:00.000Z', endDate: '2026-12-31T23:59:59.000Z',
      })

      // Add
      const clause = controller.addClause(TENANT, c.id, {
        title: '条款一', content: '内容', sortOrder: 1,
      })
      assert.equal(clause.title, '条款一')

      // List
      const clauses = controller.listClauses(TENANT, c.id)
      assert.equal(clauses.length, 1)

      // Update
      const updated = controller.updateClause(clause.id, { content: '新内容' })
      assert.equal(updated.content, '新内容')

      // Delete
      const deleteResult = controller.deleteClause(clause.id)
      assert.equal(deleteResult, undefined)
    })

    it('should throw on non-existent contract for adding clauses', () => {
      assert.throws(() => {
        controller.addClause(TENANT, 'nonexistent', { title: 'T', content: 'C', sortOrder: 1 })
      }, /Contract not found/)
    })
  })

  describe('bulkAddClauses', () => {
    it('should add multiple clauses at once', () => {
      const c = controller.createContract(TENANT, {
        name: 'Test', type: ContractType.Service, partyA: 'A', partyB: 'B',
        amount: 100, startDate: '2026-01-01T00:00:00.000Z', endDate: '2026-12-31T23:59:59.000Z',
      })

      const result = controller.bulkAddClauses(TENANT, c.id, {
        clauses: [
          { title: '第一条', content: '内容一', sortOrder: 1 },
          { title: '第二条', content: '内容二', sortOrder: 2 },
        ],
      })
      assert.equal(result.length, 2)
    })
  })

  describe('seedMockData', () => {
    it('should seed mock data', () => {
      const result = controller.seedMockData(TENANT)
      assert.deepStrictEqual(result, { message: 'Mock contract data seeded' })

      const list = controller.listContracts(TENANT, {})
      assert.equal(list.length, 16)
    })
  })
})
