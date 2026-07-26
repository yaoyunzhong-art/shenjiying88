import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

import { SandboxController } from './sandbox.controller'

describe('SandboxController metadata', () => {
  it('controller should keep sandbox path', () => {
    assert.equal(Reflect.getMetadata('path', SandboxController), 'sandbox')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [SandboxController.prototype.createSandbox, 1, '/'],
      [SandboxController.prototype.destroySandbox, 1, ':id/destroy'],
      [SandboxController.prototype.getSandboxStatus, 0, ':id/status'],
      [SandboxController.prototype.executeCode, 1, ':id/execute'],
      [SandboxController.prototype.resetSandbox, 1, ':id/reset'],
      [SandboxController.prototype.listSandboxes, 0, '/'],
      [SandboxController.prototype.getSandbox, 0, ':id'],
      [SandboxController.prototype.publishApp, 1, 'isv/apps'],
      [SandboxController.prototype.listApps, 0, 'isv/apps'],
      [SandboxController.prototype.installApp, 1, 'isv/apps/:id/install'],
      [SandboxController.prototype.uninstallApp, 1, 'isv/apps/:id/uninstall'],
      [SandboxController.prototype.rateApp, 1, 'isv/apps/:id/rate'],
      [SandboxController.prototype.getApp, 0, 'isv/apps/:id'],
      [SandboxController.prototype.listInstalls, 0, 'isv/apps/:id/installs'],
      [SandboxController.prototype.generateSDK, 1, 'isv/apps/:id/sdk/generate'],
      [SandboxController.prototype.getSDKDownloadURL, 0, 'isv/apps/:id/sdk/download'],
      [SandboxController.prototype.listSDKLanguages, 0, 'isv/sdk/languages'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
