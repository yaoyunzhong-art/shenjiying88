import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { DECORATORS } from '@nestjs/swagger/dist/constants'
import { StoreController } from './store.controller'

describe('StoreController metadata', () => {
  it('controller should keep store path and swagger tags', () => {
    assert.equal(Reflect.getMetadata('path', StoreController), 'api/stores')
    assert.deepEqual(Reflect.getMetadata(DECORATORS.API_TAGS, StoreController), ['门店管理'])
  })

  it('routes should keep REST metadata and swagger summaries', () => {
    const cases = [
      [StoreController.prototype.list, 0, '/', '门店列表'],
      [StoreController.prototype.getById, 0, ':id', '门店详情'],
      [StoreController.prototype.create, 1, '/', '创建门店'],
      [StoreController.prototype.update, 2, ':id', '更新门店'],
      [StoreController.prototype.delete, 3, ':id', '删除门店'],
      [StoreController.prototype.getStats, 0, ':id/stats', '门店统计'],
    ] as const

    cases.forEach(([handler, method, path, summary]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
      assert.equal(Reflect.getMetadata(DECORATORS.API_OPERATION, handler)?.summary, summary)
    })
  })
})
