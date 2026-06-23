/**
 * 🐜 自动: [tournament] [D] module 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'

describe('TournamentModule', () => {
  test('should be defined', () => {
    // Use require to avoid tsx esbuild decorator transform issues
    const { TournamentModule } = require('./tournament.module')
    const module = new TournamentModule()
    assert.ok(module instanceof TournamentModule)
  })

  test('should have correct module metadata', () => {
    const { TournamentModule } = require('./tournament.module')
    const { TournamentController } = require('./tournament.controller')
    const { TournamentService } = require('./tournament.service')

    const controllers = Reflect.getMetadata('controllers', TournamentModule)
    const providers = Reflect.getMetadata('providers', TournamentModule)
    const exports = Reflect.getMetadata('exports', TournamentModule)

    assert.ok(controllers)
    assert.ok(providers)
    assert.ok(exports)

    assert.ok(controllers.includes(TournamentController))
    assert.ok(providers.includes(TournamentService))
    assert.ok(exports.includes(TournamentService))
  })
})
