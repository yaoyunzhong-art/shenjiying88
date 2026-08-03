import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

import { TerminalController } from './terminal.controller'

describe('TerminalController metadata', () => {
  it('controller should keep terminal path', () => {
    assert.equal(Reflect.getMetadata('path', TerminalController), 'terminal')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [TerminalController.prototype.registerTerminal, 1, 'register'],
      [TerminalController.prototype.reportHeartbeat, 1, ':id/heartbeat'],
      [TerminalController.prototype.getTerminalStatus, 0, ':id/status'],
      [TerminalController.prototype.bindTerminal, 1, 'bind'],
      [TerminalController.prototype.unbindTerminal, 1, 'unbind'],
      [TerminalController.prototype.getTerminalBindings, 0, ':id/bindings'],
      [TerminalController.prototype.verifyBinding, 1, ':id/verify-binding'],
      [TerminalController.prototype.detectOffline, 1, 'detect-offline'],
      [TerminalController.prototype.getOfflineTerminals, 0, 'offline'],
      [TerminalController.prototype.recoverTerminal, 1, ':id/recover'],
      [TerminalController.prototype.checkTerminalReady, 0, ':id/ready'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
