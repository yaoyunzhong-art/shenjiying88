import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

import { ChampionController } from './champion.controller'

describe('ChampionController metadata', () => {
  it('controller should keep champions path', () => {
    assert.equal(Reflect.getMetadata('path', ChampionController), 'champions')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [ChampionController.prototype.registerChampion, 1, '/'],
      [ChampionController.prototype.recordContribution, 1, 'contribution'],
      [ChampionController.prototype.listChampions, 0, '/'],
      [ChampionController.prototype.getRanking, 0, 'ranking'],
      [ChampionController.prototype.getDecisionTimeline, 0, 'timeline'],
      [ChampionController.prototype.getKnowledgeMap, 0, 'knowledge-map'],
      [ChampionController.prototype.getChampion, 0, ':id'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
