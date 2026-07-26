import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { RetrievalHealthController } from './health.controller'

describe('RetrievalHealthController metadata', () => {
  it('controller should keep api/retrieval path', () => {
    assert.equal(Reflect.getMetadata('path', RetrievalHealthController), 'api/retrieval')
  })

  it('health route should keep GET metadata', () => {
    assert.equal(Reflect.getMetadata('method', RetrievalHealthController.prototype.health), 0)
    assert.equal(Reflect.getMetadata('path', RetrievalHealthController.prototype.health), 'health')
  })
})
