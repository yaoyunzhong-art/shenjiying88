import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { OssController } from './oss.controller'

describe('OssController metadata', () => {
  it('controller should keep oss path', () => {
    assert.equal(Reflect.getMetadata('path', OssController), 'oss')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [OssController.prototype.initUpload, 1, 'files/init-upload'],
      [OssController.prototype.completeUpload, 1, 'files/:id/complete'],
      [OssController.prototype.generateDownloadUrl, 1, 'files/:id/download-url'],
      [OssController.prototype.getFile, 0, 'files/:id'],
      [OssController.prototype.listFiles, 0, 'files'],
      [OssController.prototype.deleteFile, 3, 'files/:id'],
      [OssController.prototype.deleteFiles, 3, 'files'],
      [OssController.prototype.generateSignedUrl, 1, 'files/:id/signed-url'],
      [OssController.prototype.createBucket, 1, 'buckets'],
      [OssController.prototype.listBuckets, 0, 'buckets'],
      [OssController.prototype.getBucket, 0, 'buckets/:id'],
      [OssController.prototype.updateBucket, 4, 'buckets/:id'],
      [OssController.prototype.deleteBucket, 3, 'buckets/:id'],
      [OssController.prototype.getStats, 0, 'stats'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
