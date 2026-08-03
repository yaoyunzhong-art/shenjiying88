import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { ProbationTransferController } from './probation-transfer.controller'

describe('ProbationTransferController metadata', () => {
  it('controller should keep probation-transfers path', () => {
    assert.equal(Reflect.getMetadata('path', ProbationTransferController), 'probation-transfers')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [ProbationTransferController.prototype.createTransfer, 1, '/'],
      [ProbationTransferController.prototype.listTransfers, 0, '/'],
      [ProbationTransferController.prototype.getTransfer, 0, ':transferId'],
      [ProbationTransferController.prototype.approveTransfer, 4, ':transferId/approve'],
      [ProbationTransferController.prototype.getStats, 0, 'stats'],
      [ProbationTransferController.prototype.seedMockData, 1, 'seed'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
