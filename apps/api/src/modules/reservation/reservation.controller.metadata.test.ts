import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { ReservationController } from './reservation.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, ReservationController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, ReservationController)

describe('ReservationController metadata', () => {
  const readHandlers = [
    ReservationController.prototype.findAll,
    ReservationController.prototype.findOne,
    ReservationController.prototype.findByUser,
    ReservationController.prototype.findByResource,
    ReservationController.prototype.findByTimeRange,
    ReservationController.prototype.checkConflict,
  ]

  const writeHandlers = [
    ReservationController.prototype.createReservation,
    ReservationController.prototype.updateReservation,
    ReservationController.prototype.cancelReservation,
  ]

  it('all routes should require tenant scope', () => {
    ;[...readHandlers, ...writeHandlers].forEach((handler) => {
      assert.deepEqual(resolveTenantScope(handler), {})
    })
  })

  it('read routes should reuse store:read', () => {
    readHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['store:read'])
    })
  })

  it('write routes should reuse store:update', () => {
    writeHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['store:update'])
    })
  })
})
