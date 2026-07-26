import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { RetrievalController } from './retrieval.controller'

describe('RetrievalController metadata', () => {
  it('controller should keep api/retrieval path', () => {
    assert.equal(Reflect.getMetadata('path', RetrievalController), 'api/retrieval')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [RetrievalController.prototype.query, 1, 'query'],
      [RetrievalController.prototype.queryKnowledge, 1, 'query/knowledge'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
