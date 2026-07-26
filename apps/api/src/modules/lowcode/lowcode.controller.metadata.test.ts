import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { LowcodeController } from './lowcode.controller'

describe('LowcodeController metadata', () => {
  it('controller should keep api/lowcode/admin path', () => {
    assert.equal(Reflect.getMetadata('path', LowcodeController), 'api/lowcode/admin')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [LowcodeController.prototype.createTemplate, 1, 'templates'],
      [LowcodeController.prototype.listTemplates, 0, 'templates'],
      [LowcodeController.prototype.getTemplate, 0, 'templates/:id'],
      [LowcodeController.prototype.updateTemplate, 2, 'templates/:id'],
      [LowcodeController.prototype.deleteTemplate, 3, 'templates/:id'],
      [LowcodeController.prototype.createSnapshot, 1, 'snapshots'],
      [LowcodeController.prototype.listSnapshots, 0, 'snapshots/:pageId'],
      [LowcodeController.prototype.registerComponent, 1, 'components'],
      [LowcodeController.prototype.listComponents, 0, 'components'],
      [LowcodeController.prototype.exportPage, 0, 'pages/:id/export'],
      [LowcodeController.prototype.importPage, 1, 'pages/import'],
      [LowcodeController.prototype.getDashboardStats, 0, 'dashboard'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
