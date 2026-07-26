import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

import { D3Controller } from './d3.controller'

describe('D3Controller metadata', () => {
  it('controller should keep ai/d3 path', () => {
    assert.equal(Reflect.getMetadata('path', D3Controller), 'ai/d3')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [D3Controller.prototype.getRecommendations, 0, 'recommendations'],
      [D3Controller.prototype.postRecommendations, 1, 'recommendations'],
      [D3Controller.prototype.getTrendingByQuery, 0, 'trending'],
      [D3Controller.prototype.getTrendingByParam, 0, 'trending/:type'],
      [D3Controller.prototype.getPersonalPicks, 0, 'personal-picks'],
      [D3Controller.prototype.postPersonalPicks, 1, 'personal-picks'],
      [D3Controller.prototype.applyFilters, 1, 'filters'],
      [D3Controller.prototype.scoreItems, 1, 'score'],
      [D3Controller.prototype.getExplanation, 1, 'explain'],
      [D3Controller.prototype.explainItem, 1, 'items/:itemId/explain'],
      [D3Controller.prototype.getDeliveries, 0, 'deliveries'],
      [D3Controller.prototype.postDeliveries, 1, 'deliveries'],
      [D3Controller.prototype.deliverDelivery, 1, 'deliveries/:deliveryId/deliver'],
      [D3Controller.prototype.markDelivered, 1, 'deliveries/mark'],
      [D3Controller.prototype.getChannel, 1, 'channel'],
      [D3Controller.prototype.collaborateFilter, 0, 'collaborate'],
      [D3Controller.prototype.itemBasedFilter, 0, 'similar-items/:itemId'],
      [D3Controller.prototype.coldStartNewUser, 0, 'cold-start'],
      [D3Controller.prototype.coldStartNewItem, 1, 'cold-start/new-item'],
      [D3Controller.prototype.ensembleScore, 0, 'ensemble'],
      [D3Controller.prototype.modelEvaluate, 0, 'evaluate'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
