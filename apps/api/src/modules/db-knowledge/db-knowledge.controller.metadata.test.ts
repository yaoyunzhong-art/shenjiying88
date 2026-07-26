import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { DbKnowledgeController } from './db-knowledge.controller'

describe('DbKnowledgeController metadata', () => {
  it('controller should keep db-knowledge path', () => {
    assert.equal(Reflect.getMetadata('path', DbKnowledgeController), 'db-knowledge')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [DbKnowledgeController.prototype.status, 0, 'status'],
      [DbKnowledgeController.prototype.search, 0, 'search'],
      [DbKnowledgeController.prototype.getDocumentsByKind, 0, 'documents/:kind'],
      [DbKnowledgeController.prototype.getExperts, 0, 'experts'],
      [DbKnowledgeController.prototype.getRecentPulses, 0, 'pulses'],
      [DbKnowledgeController.prototype.getActivePhases, 0, 'phases'],
      [DbKnowledgeController.prototype.getPatterns, 0, 'patterns'],
      [DbKnowledgeController.prototype.getVenuesByCity, 0, 'venues'],
      [DbKnowledgeController.prototype.getTodayBrief, 0, 'brief/today'],
      [DbKnowledgeController.prototype.logSearch, 1, 'search/log'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
