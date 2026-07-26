import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { KnowledgeController } from './knowledge.controller'

describe('KnowledgeController metadata', () => {
  it('controller should keep knowledge path', () => {
    assert.equal(Reflect.getMetadata('path', KnowledgeController), 'knowledge')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [KnowledgeController.prototype.indexDocument, 1, 'index'],
      [KnowledgeController.prototype.query, 1, 'query'],
      [KnowledgeController.prototype.suggest, 1, 'suggest'],
      [KnowledgeController.prototype.getStats, 0, 'stats'],
      [KnowledgeController.prototype.listDocuments, 0, 'documents'],
      [KnowledgeController.prototype.listDocumentsByKind, 0, 'documents/by-kind/:kind'],
      [KnowledgeController.prototype.getDocument, 0, 'documents/:id'],
      [KnowledgeController.prototype.deleteDocument, 3, 'documents/:id'],
      [KnowledgeController.prototype.resetIndex, 1, 'reset'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
