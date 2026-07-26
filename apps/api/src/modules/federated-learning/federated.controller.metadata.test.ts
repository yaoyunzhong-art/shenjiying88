// @ts-nocheck
import 'reflect-metadata'
import { beforeAll, describe, it } from 'vitest'
import assert from 'node:assert/strict'

describe('FederatedLearningController metadata', () => {
  let FederatedLearningController: any

  beforeAll(async () => {
    ;({ FederatedLearningController } = await import('./federated.controller.ts'))
  })

  it('controller should keep federated path', () => {
    assert.equal(Reflect.getMetadata('path', FederatedLearningController), 'federated')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [FederatedLearningController.prototype.createTask, 'tasks'],
      [FederatedLearningController.prototype.listTasks, 'tasks'],
      [FederatedLearningController.prototype.getTask, 'tasks/:id'],
      [FederatedLearningController.prototype.activateTask, 'tasks/:id/activate'],
      [FederatedLearningController.prototype.startRound, 'tasks/:taskId/rounds'],
      [FederatedLearningController.prototype.listRounds, 'tasks/:taskId/rounds'],
      [FederatedLearningController.prototype.submitGradient, 'tasks/:taskId/submit'],
      [FederatedLearningController.prototype.aggregateRound, 'rounds/:roundId/aggregate'],
      [FederatedLearningController.prototype.getPrivacy, 'tasks/:taskId/privacy'],
    ] as const

    cases.forEach(([handler, path]) => {
      assert.equal(Reflect.getMetadata('path', handler), path)
      assert.ok(typeof Reflect.getMetadata('method', handler) === 'number')
    })
  })
})
