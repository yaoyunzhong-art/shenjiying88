import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { LowcodePageController } from './lowcode-page.controller'

describe('LowcodePageController metadata', () => {
  it('controller should keep api/lowcode path', () => {
    assert.equal(Reflect.getMetadata('path', LowcodePageController), 'api/lowcode')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [LowcodePageController.prototype.createPage, 1, 'pages'],
      [LowcodePageController.prototype.getPage, 0, 'pages/:id'],
      [LowcodePageController.prototype.updatePage, 2, 'pages/:id'],
      [LowcodePageController.prototype.removePage, 3, 'pages/:id'],
      [LowcodePageController.prototype.publishPage, 1, 'pages/:id/publish'],
      [LowcodePageController.prototype.renderPage, 0, 'pages/:id/render'],
      [LowcodePageController.prototype.addComponent, 1, 'pages/:pageId/components'],
      [LowcodePageController.prototype.updateComponent, 2, 'pages/:pageId/components/:componentId'],
      [LowcodePageController.prototype.removeComponent, 3, 'pages/:pageId/components/:componentId'],
      [LowcodePageController.prototype.getTemplate, 0, 'templates/:id'],
      [LowcodePageController.prototype.recordMetric, 1, 'metrics'],
      [LowcodePageController.prototype.getMetricTrend, 0, 'metrics/:name/trend'],
      [LowcodePageController.prototype.getAlertHistory, 0, 'alerts'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
