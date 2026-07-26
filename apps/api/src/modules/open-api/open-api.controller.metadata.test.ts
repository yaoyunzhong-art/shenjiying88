import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { OpenApiController } from './open-api.controller'

describe('OpenApiController metadata', () => {
  it('controller should keep open path', () => {
    assert.equal(Reflect.getMetadata('path', OpenApiController), 'open')
  })

  it('auth, verify, sync and command routes should keep POST metadata', () => {
    const cases = [
      [OpenApiController.prototype.authenticate, 'auth'],
      [OpenApiController.prototype.verify, 'verify'],
      [OpenApiController.prototype.sync, 'sync'],
      [OpenApiController.prototype.command, 'command'],
    ] as const

    cases.forEach(([handler, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), 1)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })

  it('client listing route should keep GET metadata', () => {
    assert.equal(Reflect.getMetadata('method', OpenApiController.prototype.listClients), 0)
    assert.equal(Reflect.getMetadata('path', OpenApiController.prototype.listClients), 'clients')
  })
})
