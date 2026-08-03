import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { SalaryController } from './salary.controller'

describe('SalaryController metadata', () => {
  it('controller should keep salary path', () => {
    assert.equal(Reflect.getMetadata('path', SalaryController), 'salary')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [SalaryController.prototype.calculatePayroll, 1, 'calculate'],
      [SalaryController.prototype.submitPayroll, 1, 'submit/:id'],
      [SalaryController.prototype.getPayroll, 0, ':id'],
      [SalaryController.prototype.listPayrolls, 0, 'list'],
      [SalaryController.prototype.deletePayroll, 3, ':id'],
      [SalaryController.prototype.approvePayroll, 1, 'approve/:id'],
      [SalaryController.prototype.payPayroll, 1, 'pay/:id'],
      [SalaryController.prototype.cancelPayroll, 1, 'cancel/:id'],
      [SalaryController.prototype.getSummary, 0, 'summary'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
