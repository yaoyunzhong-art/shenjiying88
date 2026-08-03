import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { AiRecommendController } from './ai-recommend.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, AiRecommendController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, AiRecommendController)

describe('AiRecommendController metadata', () => {
  const readHandlers = [
    AiRecommendController.prototype.getPopular,
    AiRecommendController.prototype.getPersonalized,
    AiRecommendController.prototype.getRecommendations,
    AiRecommendController.prototype.generateRecommendations,
    AiRecommendController.prototype.getStrategies,
    AiRecommendController.prototype.getStrategy,
    AiRecommendController.prototype.getProfile,
  ]

  const writeHandlers = [
    AiRecommendController.prototype.createStrategy,
    AiRecommendController.prototype.updateStrategy,
    AiRecommendController.prototype.enableStrategy,
    AiRecommendController.prototype.disableStrategy,
    AiRecommendController.prototype.updateProfile,
    AiRecommendController.prototype.recordScore,
    AiRecommendController.prototype.recordInteraction,
    AiRecommendController.prototype.recordConversion,
  ]

  it('all routes should require tenant scope', () => {
    ;[...readHandlers, ...writeHandlers].forEach((handler) => {
      assert.deepEqual(resolveTenantScope(handler), {})
    })
  })

  it('read routes should reuse foundation.governance.read', () => {
    readHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['foundation.governance.read'])
    })
  })

  it('write routes should reuse foundation.governance.write', () => {
    writeHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['foundation.governance.write'])
    })
  })
})
