import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * license-package.controller.test.ts
 *
 * LicensePackageController 单元测试 —— 验证路由元数据 + mock service 行为。
 * 使用手动构造 controller 避免 require 触发 TypeORM 装饰器。
 */

import assert from 'node:assert/strict'
describe('LicensePackageController', () => {
  const mockService = {
    create: () => Promise.resolve({ id: 'pkg-001', name: '测试套餐', price: 2999 }),
    findAll: () => Promise.resolve({ list: [{ id: 'pkg-001', name: '测试套餐' }], total: 1, page: 1, pageSize: 10 }),
    findOne: (id: string) => {
      if (id === 'not-found') return Promise.reject(new Error('套餐不存在'))
      return Promise.resolve({ id, name: '测试套餐', price: 2999 })
    },
    update: () => Promise.resolve({ id: 'pkg-001', name: '已更新', price: 3999 }),
    remove: () => Promise.resolve(),
    assignToLicense: () => Promise.resolve(),
    getLicensesByPackage: () => Promise.resolve([{ id: 'lic-001', tenantId: 't-001' }]),
  }

  let controller: any

  beforeEach(() => {
    // 手动构建，避免 require 链触发 TypeORM 装饰器
    const { LicensePackageController } = require('./license-package.controller')
    controller = new LicensePackageController(mockService as any)
  })

  describe('route metadata', () => {
    it('controller path: api/license-packages', () => {
      const path = Reflect.getMetadata('path', require('./license-package.controller').LicensePackageController)
      assert.equal(path, 'api/license-packages')
    })

    it('create route: POST', () => {
      const method = Reflect.getMetadata('method', controller.create)
      assert.equal(method, 1) // POST
    })

    it('findAll route: GET', () => {
      const method = Reflect.getMetadata('method', controller.findAll)
      assert.equal(method, 0) // GET
    })

    it('findOne route: GET', () => {
      const method = Reflect.getMetadata('method', controller.findOne)
      assert.equal(method, 0) // GET
    })

    it('update route: PUT', () => {
      const method = Reflect.getMetadata('method', controller.update)
      assert.equal(method, 2) // PUT
    })

    it('remove route: DELETE', () => {
      const method = Reflect.getMetadata('method', controller.remove)
      assert.equal(method, 3) // DELETE
    })
  })

  describe('POST /api/license-packages (create)', () => {
    it('正例: 创建套餐', async () => {
      const result = await controller.create({ name: '企业版', price: 2999, duration: 12, durationUnit: 'month' })
      assert.ok(result)
      assert.equal(result.id, 'pkg-001')
    })
  })

  describe('GET /api/license-packages (findAll)', () => {
    it('正例: 分页列表', async () => {
      const result = await controller.findAll({ page: 1, pageSize: 10 })
      assert.ok(Array.isArray(result.list))
      assert.equal(result.total, 1)
    })
  })

  describe('GET /api/license-packages/:id (findOne)', () => {
    it('正例: 按 ID 查询', async () => {
      const result = await controller.findOne('pkg-001')
      assert.equal(result.id, 'pkg-001')
    })

    it('反例: 不存在抛异常', async () => {
      await assert.rejects(
        () => controller.findOne('not-found'),
        /套餐不存在/
      )
    })
  })

  describe('PUT /api/license-packages/:id (update)', () => {
    it('正例: 更新套餐', async () => {
      const result = await controller.update('pkg-001', { name: '已更新' })
      assert.equal(result.name, '已更新')
    })
  })

  describe('DELETE /api/license-packages/:id (remove)', () => {
    it('正例: 删除返回 void', async () => {
      const result = await controller.remove('pkg-001')
      assert.equal(result, undefined)
    })
  })

  describe('POST /api/license-packages/:id/assign (assignToLicense)', () => {
    it('正例: 分配套餐到 License', async () => {
      await controller.assignToLicense('pkg-001', { licenseId: 'lic-001', remark: '续费' })
      assert.ok(true)
    })
  })

  describe('GET /api/license-packages/:id/licenses (getLicensesByPackage)', () => {
    it('正例: 返回 License 列表', async () => {
      const result = await controller.getLicensesByPackage('pkg-001')
      assert.ok(Array.isArray(result))
      assert.equal(result[0].id, 'lic-001')
    })
  })
})
