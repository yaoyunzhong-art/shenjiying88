import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { HrPerformanceController } from './hr-performance.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'
import { IS_PUBLIC_KEY } from '../foundation/identity-access/public.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, HrPerformanceController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, HrPerformanceController)

describe('HrPerformanceController metadata', () => {
  const readHandlers = [
    HrPerformanceController.prototype.findAllTemplates,
    HrPerformanceController.prototype.findTemplateById,
    HrPerformanceController.prototype.findEvaluations,
    HrPerformanceController.prototype.findEvaluationById,
    HrPerformanceController.prototype.findInterviews,
    HrPerformanceController.prototype.findAllStarEmployees,
    HrPerformanceController.prototype.getPerformanceStats,
  ]

  const writeHandlers = [
    HrPerformanceController.prototype.createTemplate,
    HrPerformanceController.prototype.createEvaluation,
    HrPerformanceController.prototype.updateEvaluation,
    HrPerformanceController.prototype.createInterview,
    HrPerformanceController.prototype.createStarEmployee,
  ]

  it('controller should no longer stay public', () => {
    assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, HrPerformanceController), undefined)
  })

  it('all routes should require tenant scope', () => {
    ;[...readHandlers, ...writeHandlers].forEach((handler) => {
      assert.deepEqual(resolveTenantScope(handler), {})
    })
  })

  it('read routes should reuse staff:read', () => {
    readHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['staff:read'])
    })
  })

  it('write routes should reuse staff:*', () => {
    writeHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['staff:*'])
    })
  })
})
