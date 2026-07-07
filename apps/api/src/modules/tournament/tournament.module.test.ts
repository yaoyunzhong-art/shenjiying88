import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [tournament] [D] module 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { TournamentModule } from './tournament.module'
import { TournamentController } from './tournament.controller'
import { TournamentService } from './tournament.service'

describe('TournamentModule', () => {
  it('should be defined', () => {
    const module = new TournamentModule()
    assert.ok(module instanceof TournamentModule)
  })

  it('should have correct module metadata', () => {
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
