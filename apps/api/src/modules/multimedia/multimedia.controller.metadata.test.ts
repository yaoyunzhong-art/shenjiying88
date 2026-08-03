import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { MultimediaController } from './multimedia.controller'

describe('MultimediaController metadata', () => {
  it('controller should keep multimedia path', () => {
    assert.equal(Reflect.getMetadata('path', MultimediaController), 'multimedia')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [MultimediaController.prototype.createAsset, 1, 'assets'],
      [MultimediaController.prototype.completeUpload, 1, 'assets/:id/complete'],
      [MultimediaController.prototype.listAssets, 0, 'assets'],
      [MultimediaController.prototype.getAsset, 0, 'assets/:id'],
      [MultimediaController.prototype.deleteAsset, 3, 'assets/:id'],
      [MultimediaController.prototype.createVariant, 1, 'assets/:id/variants'],
      [MultimediaController.prototype.listVariants, 0, 'assets/:id/variants'],
      [MultimediaController.prototype.signedUrl, 1, 'assets/:id/signed-url'],
      [MultimediaController.prototype.addBackend, 1, 'storage-backends'],
      [MultimediaController.prototype.listBackends, 0, 'storage-backends'],
      [MultimediaController.prototype.deleteBackend, 3, 'storage-backends/:id'],
      [MultimediaController.prototype.stats, 0, 'stats'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
