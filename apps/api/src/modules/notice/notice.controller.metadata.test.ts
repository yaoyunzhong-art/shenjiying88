import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { NoticeController } from './notice.controller'

describe('NoticeController metadata', () => {
  it('controller should keep notices path', () => {
    assert.equal(Reflect.getMetadata('path', NoticeController), 'notices')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [NoticeController.prototype.create, 1, '/'],
      [NoticeController.prototype.list, 0, '/'],
      [NoticeController.prototype.listPublished, 0, 'published'],
      [NoticeController.prototype.getById, 0, ':id'],
      [NoticeController.prototype.update, 4, ':id'],
      [NoticeController.prototype.delete, 3, ':id'],
      [NoticeController.prototype.publish, 1, ':id/publish'],
      [NoticeController.prototype.archive, 1, ':id/archive'],
      [NoticeController.prototype.markRead, 1, ':id/read'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
