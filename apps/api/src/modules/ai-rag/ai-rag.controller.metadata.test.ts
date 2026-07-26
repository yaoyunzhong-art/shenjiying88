import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

import { AiRagController } from './ai-rag.controller'

describe('AiRagController metadata', () => {
  it('controller should keep ai-rag path', () => {
    assert.equal(Reflect.getMetadata('path', AiRagController), 'ai-rag')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [AiRagController.prototype.createDocument, 1, 'documents'],
      [AiRagController.prototype.listDocuments, 0, 'documents/:collection'],
      [AiRagController.prototype.getDocument, 0, 'documents/:collection/:docId'],
      [AiRagController.prototype.updateDocument, 2, 'documents/:collection/:docId'],
      [AiRagController.prototype.deleteDocument, 3, 'documents/:collection/:docId'],
      [AiRagController.prototype.getCollectionStats, 0, 'documents/:collection/stats'],
      [AiRagController.prototype.query, 1, 'query'],
      [AiRagController.prototype.chat, 1, 'chat'],
      [AiRagController.prototype.retrieve, 1, 'retrieve'],
      [AiRagController.prototype.getRagStats, 0, 'stats/:collection'],
      [AiRagController.prototype.generateProductScript, 1, 'scripts/product'],
      [AiRagController.prototype.generateObjectionScript, 1, 'scripts/objection'],
      [AiRagController.prototype.generateFollowUp, 1, 'scripts/follow-up'],
      [AiRagController.prototype.localizeScript, 1, 'scripts/localize'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
