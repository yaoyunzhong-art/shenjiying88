import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { LicensePackageController } from './license-package.controller'

describe('LicensePackageController metadata', () => {
  it('controller should keep api/license-packages path', () => {
    assert.equal(Reflect.getMetadata('path', LicensePackageController), 'api/license-packages')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [LicensePackageController.prototype.create, 1, '/'],
      [LicensePackageController.prototype.findAll, 0, '/'],
      [LicensePackageController.prototype.findOne, 0, ':id'],
      [LicensePackageController.prototype.update, 2, ':id'],
      [LicensePackageController.prototype.remove, 3, ':id'],
      [LicensePackageController.prototype.assignToLicense, 1, ':id/assign'],
      [LicensePackageController.prototype.getLicensesByPackage, 0, ':id/licenses'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
