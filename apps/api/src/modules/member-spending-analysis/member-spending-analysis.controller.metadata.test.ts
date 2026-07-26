import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { MemberSpendingAnalysisController } from './member-spending-analysis.controller'

describe('MemberSpendingAnalysisController metadata', () => {
  it('controller should keep member-spending path', () => {
    assert.equal(Reflect.getMetadata('path', MemberSpendingAnalysisController), 'member-spending')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [MemberSpendingAnalysisController.prototype.list, 0, '/'],
      [MemberSpendingAnalysisController.prototype.getSummary, 0, 'summary'],
      [MemberSpendingAnalysisController.prototype.getMember, 0, ':memberId'],
      [MemberSpendingAnalysisController.prototype.create, 1, '/'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
