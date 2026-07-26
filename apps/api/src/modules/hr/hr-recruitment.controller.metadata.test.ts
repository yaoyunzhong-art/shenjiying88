import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { HrRecruitmentController } from './hr-recruitment.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'
import { IS_PUBLIC_KEY } from '../foundation/identity-access/public.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, HrRecruitmentController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, HrRecruitmentController)

describe('HrRecruitmentController metadata', () => {
  const readHandlers = [
    HrRecruitmentController.prototype.findAllPositions,
    HrRecruitmentController.prototype.findPositionById,
    HrRecruitmentController.prototype.findCandidates,
    HrRecruitmentController.prototype.getRecruitmentStats,
    HrRecruitmentController.prototype.getOnboardingInfo,
  ]

  const writeHandlers = [
    HrRecruitmentController.prototype.createPosition,
    HrRecruitmentController.prototype.updatePosition,
    HrRecruitmentController.prototype.createCandidate,
    HrRecruitmentController.prototype.updateCandidateStatus,
    HrRecruitmentController.prototype.createReferral,
  ]

  it('controller should no longer stay public', () => {
    assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, HrRecruitmentController), undefined)
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
