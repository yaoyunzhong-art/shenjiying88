import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { EmpowerCardController } from './empower-card.controller'
import { TENANT_OPTIONAL_KEY } from '../agent/tenant-guard.decorator'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'
import { IS_PUBLIC_KEY } from '../foundation/identity-access/public.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, EmpowerCardController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, EmpowerCardController)

describe('EmpowerCardController metadata', () => {
  const readHandlers = [
    EmpowerCardController.prototype.list,
    EmpowerCardController.prototype.getById,
  ]

  const searchHandlers = [
    EmpowerCardController.prototype.search,
    EmpowerCardController.prototype.matchForDispatch,
  ]

  it('controller should keep empower-cards path and stay protected by default', () => {
    assert.equal(Reflect.getMetadata('path', EmpowerCardController), 'empower-cards')
    assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, EmpowerCardController), undefined)
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [EmpowerCardController.prototype.create, 1, '/'],
      [EmpowerCardController.prototype.list, 0, '/'],
      [EmpowerCardController.prototype.healthCheck, 0, 'health'],
      [EmpowerCardController.prototype.getById, 0, ':id'],
      [EmpowerCardController.prototype.search, 1, 'search'],
      [EmpowerCardController.prototype.matchForDispatch, 1, 'match'],
      [EmpowerCardController.prototype.recordQuote, 1, ':id/quote'],
      [EmpowerCardController.prototype.applyDecay, 1, 'decay'],
      [EmpowerCardController.prototype.getTodayScore, 0, 'stats/today'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })

  it('protected routes should require tenant scope', () => {
    ;[
      EmpowerCardController.prototype.create,
      EmpowerCardController.prototype.list,
      EmpowerCardController.prototype.getById,
      EmpowerCardController.prototype.search,
      EmpowerCardController.prototype.matchForDispatch,
      EmpowerCardController.prototype.recordQuote,
      EmpowerCardController.prototype.applyDecay,
      EmpowerCardController.prototype.getTodayScore,
    ].forEach((handler) => {
      assert.deepEqual(resolveTenantScope(handler), {})
    })
  })

  it('read routes should reuse card:read', () => {
    readHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['card:read'])
    })
  })

  it('create route should reuse card:create', () => {
    assert.deepEqual(
      Reflect.getMetadata(PERMISSIONS_METADATA_KEY, EmpowerCardController.prototype.create),
      ['card:create'],
    )
  })

  it('search routes should reuse card:search', () => {
    searchHandlers.forEach((handler) => {
      assert.deepEqual(Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler), ['card:search'])
    })
  })

  it('quote, decay and stats routes should reuse dedicated permissions', () => {
    assert.deepEqual(
      Reflect.getMetadata(PERMISSIONS_METADATA_KEY, EmpowerCardController.prototype.recordQuote),
      ['card:quote'],
    )
    assert.deepEqual(
      Reflect.getMetadata(PERMISSIONS_METADATA_KEY, EmpowerCardController.prototype.applyDecay),
      ['card:decay'],
    )
    assert.deepEqual(
      Reflect.getMetadata(PERMISSIONS_METADATA_KEY, EmpowerCardController.prototype.getTodayScore),
      ['card:stats'],
    )
  })

  it('health route should stay public and tenant-optional without protected metadata', () => {
    const handler = EmpowerCardController.prototype.healthCheck
    assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, handler), true)
    assert.equal(Reflect.getMetadata(TENANT_OPTIONAL_KEY, handler), true)
    assert.equal(Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler), undefined)
    assert.equal(Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler), undefined)
  })
})
