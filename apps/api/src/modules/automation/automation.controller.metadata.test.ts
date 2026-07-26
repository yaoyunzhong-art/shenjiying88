import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

import { AutomationController } from './automation.controller'

describe('AutomationController metadata', () => {
  it('controller should keep api/automation path', () => {
    assert.equal(Reflect.getMetadata('path', AutomationController), 'api/automation')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [AutomationController.prototype.listRules, 0, 'rules'],
      [AutomationController.prototype.getRule, 0, 'rules/:id'],
      [AutomationController.prototype.createRule, 1, 'rules'],
      [AutomationController.prototype.evaluateRule, 1, 'rules/:id/evaluate'],
      [AutomationController.prototype.createWorkflow, 1, 'workflows'],
      [AutomationController.prototype.getWorkflow, 0, 'workflows/:id'],
      [AutomationController.prototype.updateWorkflow, 2, 'workflows/:id'],
      [AutomationController.prototype.listJobs, 0, 'jobs'],
      [AutomationController.prototype.createJob, 1, 'jobs'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
