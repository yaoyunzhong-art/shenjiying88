import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { ChainController } from './chain.controller'

describe('ChainController metadata', () => {
  it('controller should keep chain path', () => {
    assert.equal(Reflect.getMetadata('path', ChainController), 'chain')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [ChainController.prototype.createSettlement, 1, 'settlements'],
      [ChainController.prototype.approveSettlement, 1, 'settlements/:id/approve'],
      [ChainController.prototype.executeSettlement, 1, 'settlements/:id/execute'],
      [ChainController.prototype.cancelSettlement, 1, 'settlements/:id/cancel'],
      [ChainController.prototype.getSettlement, 0, 'settlements/:id'],
      [ChainController.prototype.createRevenueShare, 1, 'revenue-shares'],
      [ChainController.prototype.distributeRevenue, 1, 'revenue-shares/:id/distribute'],
      [ChainController.prototype.getRevenueShare, 0, 'revenue-shares/:id'],
      [ChainController.prototype.getParticipantShare, 0, 'revenue-shares/:id/participant/:participantId'],
      [ChainController.prototype.getShareHistory, 0, 'revenue-shares/:id/history'],
      [ChainController.prototype.deployContract, 1, 'executor/deploy'],
      [ChainController.prototype.executeContract, 1, 'executor/execute'],
      [ChainController.prototype.getContractResult, 0, 'executor/result/:contractId'],
      [ChainController.prototype.deploySmartContract, 1, 'smart-contracts'],
      [ChainController.prototype.executeSmartMethod, 1, 'smart-contracts/execute'],
      [ChainController.prototype.getSmartContract, 0, 'smart-contracts/:id'],
      [ChainController.prototype.listSmartContracts, 0, 'smart-contracts'],
      [ChainController.prototype.verifyContract, 1, 'smart-contracts/verify'],
      [ChainController.prototype.estimateGas, 1, 'smart-contracts/estimate-gas'],
      [ChainController.prototype.getContractEvents, 0, 'smart-contracts/:id/events'],
      [ChainController.prototype.queryContract, 1, 'smart-contracts/:id/query'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
