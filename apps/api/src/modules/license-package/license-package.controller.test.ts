import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [license-package] [D] controller spec 补全
 *
 * LicensePackageController 单元测试
 * - 路由元数据验证
 * - mock service 业务正例/反例/边界
 * - 使用手动 import 避免 TypeORM 装饰器触发
 */

import assert from 'node:assert/strict'
import { LicensePackageController } from './license-package.controller'

describe('LicensePackageController', () => {
  const mockService = {
    create: vi.fn().mockResolvedValue({ id: 'pkg-001', name: '测试套餐', price: 2999, duration: 12, durationUnit: 'month', isActive: true }),
    findAll: vi.fn().mockResolvedValue({ list: [{ id: 'pkg-001', name: '测试套餐' }], total: 1, page: 1, pageSize: 10 }),
    findOne: vi.fn((id: string) => {
      if (id === 'not-found') return Promise.reject(new Error('套餐不存在'))
      return Promise.resolve({ id, name: '测试套餐', price: 2999, isActive: true })
    }),
    update: vi.fn().mockResolvedValue({ id: 'pkg-001', name: '已更新', price: 3999 }),
    remove: vi.fn().mockResolvedValue(undefined),
    assignToLicense: vi.fn().mockResolvedValue(undefined),
    getLicensesByPackage: vi.fn().mockResolvedValue([{ id: 'lic-001', tenantId: 't-001' }]),
  }

  let controller: LicensePackageController

  beforeEach(() => {
    vi.clearAllMocks()
    controller = new LicensePackageController(mockService as any)
  })

  describe('route metadata', () => {
    it('controller path: api/license-packages', () => {
      const path = Reflect.getMetadata('path', LicensePackageController)
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

    it('assignToLicense route: POST', () => {
      const method = Reflect.getMetadata('method', controller.assignToLicense)
      assert.equal(method, 1) // POST
    })

    it('getLicensesByPackage route: GET', () => {
      const method = Reflect.getMetadata('method', controller.getLicensesByPackage)
      assert.equal(method, 0) // GET
    })
  })

  describe('POST /api/license-packages (create)', () => {
    it('正例: 创建套餐', async () => {
      const dto = { name: '企业版', price: 2999, duration: 12, durationUnit: 'month' as const }
      const result = await controller.create(dto as any)
      assert.ok(result)
      assert.equal(result.id, 'pkg-001')
      assert.equal(mockService.create.mock.calls[0][0].name, '企业版')
    })

    it('反例: 创建时 service 抛出错误应传播', async () => {
      mockService.create.mockRejectedValueOnce(new Error('套餐名称已存在'))
      try {
        await controller.create({ name: '重复套餐', price: 1999, duration: 6, durationUnit: 'month' } as any)
        assert.fail('should throw')
      } catch (e: any) {
        assert.ok(e.message.includes('套餐名称已存在'))
      }
    })

    it('边界: 创建最小套餐（价格为0的免费套餐）', async () => {
      mockService.create.mockResolvedValueOnce({ id: 'pkg-free', name: '免费版', price: 0, duration: 30, durationUnit: 'day' })
      const result = await controller.create({ name: '免费版', price: 0, duration: 30, durationUnit: 'day' } as any)
      assert.equal(result.price, 0)
    })
  })

  describe('GET /api/license-packages (findAll)', () => {
    it('正例: 分页列表默认参数', async () => {
      const result = await controller.findAll({} as any)
      assert.ok(Array.isArray(result.list))
      assert.equal(result.total, 1)
      assert.equal(mockService.findAll.mock.calls[0][0].page, undefined)
    })

    it('正例: 带关键词搜索', async () => {
      mockService.findAll.mockResolvedValueOnce({ list: [{ id: 'pkg-002', name: '高级版' }], total: 1, page: 1, pageSize: 10 })
      const result = await controller.findAll({ keyword: '高级' } as any)
      assert.equal(result.list[0].name, '高级版')
      assert.equal(mockService.findAll.mock.calls[0][0].keyword, '高级')
    })

    it('边界: 空列表返回', async () => {
      mockService.findAll.mockResolvedValueOnce({ list: [], total: 0, page: 1, pageSize: 10 })
      const result = await controller.findAll({} as any)
      assert.equal(result.list.length, 0)
      assert.equal(result.total, 0)
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

    it('边界: ID 为特殊字符', async () => {
      mockService.findOne.mockResolvedValueOnce({ id: 'pkg@special', name: '特殊ID套餐' })
      const result = await controller.findOne('pkg@special')
      assert.equal(result.id, 'pkg@special')
    })
  })

  describe('PUT /api/license-packages/:id (update)', () => {
    it('正例: 更新套餐名称和价格', async () => {
      const result = await controller.update('pkg-001', { name: '已更新' } as any)
      assert.equal(result.name, '已更新')
    })

    it('反例: 更新时 service 抛异常', async () => {
      mockService.update.mockRejectedValueOnce(new Error('该套餐已被使用，不能修改价格'))
      try {
        await controller.update('pkg-001', { price: 9999 } as any)
        assert.fail('should throw')
      } catch (e: any) {
        assert.ok(e.message.includes('不能修改价格'))
      }
    })
  })

  describe('DELETE /api/license-packages/:id (remove)', () => {
    it('正例: 删除返回 void', async () => {
      const result = await controller.remove('pkg-001')
      assert.equal(result, undefined)
    })

    it('反例: 删除已删除的套餐应抛异常', async () => {
      mockService.remove.mockRejectedValueOnce(new Error('套餐不存在'))
      try {
        await controller.remove('pkg-deleted')
        assert.fail('should throw')
      } catch (e: any) {
        assert.ok(e.message.includes('套餐不存在'))
      }
    })
  })

  describe('POST /api/license-packages/:id/assign (assignToLicense)', () => {
    it('正例: 分配套餐到 License', async () => {
      await controller.assignToLicense('pkg-001', { licenseId: 'lic-001', remark: '续费' } as any)
      assert.ok(true)
      assert.equal(mockService.assignToLicense.mock.calls[0][0], 'pkg-001')
    })

    it('反例: 分配时 service 抛异常', async () => {
      mockService.assignToLicense.mockRejectedValueOnce(new Error('该套餐未启用'))
      try {
        await controller.assignToLicense('pkg-disabled', { licenseId: 'lic-002' } as any)
        assert.fail('should throw')
      } catch (e: any) {
        assert.ok(e.message.includes('未启用'))
      }
    })
  })

  describe('GET /api/license-packages/:id/licenses (getLicensesByPackage)', () => {
    it('正例: 返回 License 列表', async () => {
      const result = await controller.getLicensesByPackage('pkg-001')
      assert.ok(Array.isArray(result))
      assert.equal(result[0].id, 'lic-001')
    })

    it('边界: 没有关联的 License 返回空数组', async () => {
      mockService.getLicensesByPackage.mockResolvedValueOnce([])
      const result = await controller.getLicensesByPackage('pkg-unused')
      assert.equal(result.length, 0)
    })
  })
})
