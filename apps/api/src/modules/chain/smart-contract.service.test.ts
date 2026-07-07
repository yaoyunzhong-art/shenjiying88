import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { SmartContractService } from './smart-contract.service'

describe('SmartContractService', () => {
  let service: SmartContractService

  beforeEach(() => {
    service = new SmartContractService()
  })

  describe('deployContract', () => {
    it('should deploy a smart contract', async () => {
      const result = await service.deployContract('MyContract', ['param1', 'param2'])
      expect(result.contractId).toBeDefined()
      expect(result.address).toContain('0x')
    })
  })

  describe('executeContract', () => {
    it('should execute contract method', async () => {
      const deployed = await service.deployContract('MyContract', ['param1'])
      const result = await service.executeContract(deployed.contractId, 'setValue', ['newValue'])
      expect(result.success).toBe(true)
    })

    it('should throw error for non-existent contract', async () => {
      await expect(
        service.executeContract('nonexistent', 'method', [])
      ).rejects.toThrow()
    })
  })

  describe('queryContract', () => {
    it('should query contract state', async () => {
      const deployed = await service.deployContract('MyContract', ['param1'])
      await service.executeContract(deployed.contractId, 'setValue', ['newValue'])
      const state = await service.queryContract(deployed.contractId, 'getValue')
      expect(state).toBeDefined()
    })
  })

  describe('getContractInfo', () => {
    it('should return contract info', async () => {
      const deployed = await service.deployContract('MyContract', ['param1'])
      const info = await service.getContractInfo(deployed.contractId)
      expect(info.name).toBe('MyContract')
      expect(info.address).toContain('0x')
    })

    it('should throw error for non-existent contract', async () => {
      await expect(service.getContractInfo('nonexistent')).rejects.toThrow()
    })
  })

  describe('listContracts', () => {
    it('should list all contracts', async () => {
      await service.deployContract('Contract1', ['p1'])
      await service.deployContract('Contract2', ['p2'])
      const contracts = await service.listContracts()
      expect(contracts.length).toBe(2)
    })
  })

  describe('verifyContract', () => {
    it('should verify contract source', async () => {
      const deployed = await service.deployContract('MyContract', ['param1'])
      const result = await service.verifyContract(deployed.contractId, 'source code', 'compiler version')
      expect(result.verified).toBe(true)
    })
  })

  describe('estimateGas', () => {
    it('should estimate gas for transaction', async () => {
      const deployed = await service.deployContract('MyContract', ['param1'])
      const gas = await service.estimateGas(deployed.contractId, 'setValue', ['newValue'])
      expect(gas).toBeGreaterThan(0)
    })
  })

  describe('getContractEvents', () => {
    it('should return contract events', async () => {
      const deployed = await service.deployContract('MyContract', ['param1'])
      const events = await service.getContractEvents(deployed.contractId)
      expect(Array.isArray(events)).toBe(true)
    })
  })
})
