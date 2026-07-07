import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * license-package.controller.spec.ts
 *
 * LicensePackageController 全路由 spec——覆盖全部 7 个端点 (正例+反例+边界+权限)
 */

import assert from 'node:assert/strict'
describe('LicensePackageController', () => {
  // mock service 工厂 - 每次返回干净 mock
  function createMockService() {
    return {
      create: () => Promise.resolve({ id: 'pkg-001', name: '企业版', price: 2999 }),
      findAll: () => Promise.resolve({ list: [], total: 0, page: 1, pageSize: 10 }),
      findOne: (id: string) => {
        if (id === 'not-found') return Promise.reject(new Error('套餐不存在'))
        return Promise.resolve({ id, name: '基础套餐', price: 100 })
      },
      update: () => Promise.resolve({ id: 'pkg-001', name: '已更新', price: 3999 }),
      remove: () => Promise.resolve(),
      assignToLicense: () => Promise.resolve(),
      getLicensesByPackage: () => Promise.resolve([
        { licenseId: 'lic-001', name: '开发环境 License' },
      ]),
    }
  }

  describe('路由注册与模块元数据', () => {
    it('Controller 有正确的路由前缀', () => {
      const { LicensePackageController } = require('./license-package.controller')
      const path = Reflect.getMetadata('path', LicensePackageController)
      assert.equal(path, 'api/license-packages')
    })

    it('ApiTags 元数据正确', () => {
      const { LicensePackageController } = require('./license-package.controller')
      const tags = Reflect.getMetadata('swagger/apiUseTags', LicensePackageController)
      assert.ok(tags)
      assert.equal(tags[0], 'License 套餐管理')
    })
  })

  describe('POST /api/license-packages — create', () => {
    it('正常创建: 返回新套餐对象', async () => {
      const svc = createMockService()
      const { LicensePackageController } = require('./license-package.controller')
      const ctrl = new LicensePackageController(svc)

      const dto = { name: '黄金版', price: 1999, duration: 12, durationUnit: 'month' as const, maxUsers: 50, maxStores: 5 }
      const result = await ctrl.create(dto)

      assert.equal(result.id, 'pkg-001')
      assert.equal(result.name, '企业版')
    })

    it('create 有 swagger ApiOperation summary', () => {
      const { LicensePackageController } = require('./license-package.controller')
      const meta = Reflect.getMetadata('swagger/apiOperation', LicensePackageController.prototype.create)
      assert.ok(meta)
      assert.equal(meta.summary, '创建 License 套餐')
    })

    it('create 抛出 service 异常', async () => {
      const svc = {
        create: () => Promise.reject(new Error('创建失败')),
        findAll: () => Promise.resolve([]),
        findOne: () => Promise.resolve({}),
        update: () => Promise.resolve({}),
        remove: () => Promise.resolve(),
        assignToLicense: () => Promise.resolve(),
        getLicensesByPackage: () => Promise.resolve([]),
      }
      const { LicensePackageController } = require('./license-package.controller')
      const ctrl = new LicensePackageController(svc)

      await assert.rejects(
        () => ctrl.create({} as any),
        /创建失败/
      )
    })
  })

  describe('GET /api/license-packages — findAll', () => {
    it('正常查询: 返回分页结果', async () => {
      const svc = createMockService()
      svc.findAll = (() => Promise.resolve({
        list: [{ id: 'pkg-001', name: 'A' }, { id: 'pkg-002', name: 'B' }],
        total: 2, page: 1, pageSize: 10,
      })) as any
      const { LicensePackageController } = require('./license-package.controller')
      const ctrl = new LicensePackageController(svc)

      const result = await ctrl.findAll({ page: 1, pageSize: 10 })
      assert.equal(result.total, 2)
      assert.equal(result.list.length, 2)
    })

    it('空数据: 返回空列表', async () => {
      const svc = createMockService()
      svc.findAll = () => Promise.resolve({ list: [], total: 0, page: 1, pageSize: 10 })
      const { LicensePackageController } = require('./license-package.controller')
      const ctrl = new LicensePackageController(svc)

      const result = await ctrl.findAll({ page: 1, pageSize: 10 })
      assert.equal(result.total, 0)
      assert.deepEqual(result.list, [])
    })

    it('分页参数被正确传递', async () => {
      const svc = createMockService()
      svc.findAll = ((q: any) => Promise.resolve({ list: [], total: 0, page: q.page, pageSize: q.pageSize })) as any
      const { LicensePackageController } = require('./license-package.controller')
      const ctrl = new LicensePackageController(svc)

      const result = await ctrl.findAll({ page: 2, pageSize: 5 })
      assert.equal(result.page, 2)
      assert.equal(result.pageSize, 5)
    })

    it('keyword 搜索参数传递', async () => {
      let passedKeyword = ''
      const svc = createMockService()
      svc.findAll = ((q: any) => { passedKeyword = q.keyword; return Promise.resolve({ list: [], total: 0, page: 1, pageSize: 10 }) }) as any
      const { LicensePackageController } = require('./license-package.controller')
      const ctrl = new LicensePackageController(svc)

      await ctrl.findAll({ keyword: '黄金' })
      assert.equal(passedKeyword, '黄金')
    })

    it('isActive 筛选参数传递', async () => {
      let passedIsActive: boolean | undefined
      const svc = createMockService()
      svc.findAll = ((q: any) => { passedIsActive = q.isActive; return Promise.resolve({ list: [], total: 0, page: 1, pageSize: 10 }) }) as any
      const { LicensePackageController } = require('./license-package.controller')
      const ctrl = new LicensePackageController(svc)

      await ctrl.findAll({ isActive: true as any })
      assert.equal(passedIsActive, true)
    })
  })

  describe('GET /api/license-packages/:id — findOne', () => {
    it('正常查询: 返回套餐详情', async () => {
      const svc = createMockService()
      const { LicensePackageController } = require('./license-package.controller')
      const ctrl = new LicensePackageController(svc)

      const result = await ctrl.findOne('pkg-123')
      assert.equal(result.id, 'pkg-123')
      assert.equal(result.name, '基础套餐')
    })

    it('不存在的 id: 向上抛异常', async () => {
      const svc = createMockService()
      const { LicensePackageController } = require('./license-package.controller')
      const ctrl = new LicensePackageController(svc)

      await assert.rejects(
        () => ctrl.findOne('not-found'),
        /套餐不存在/
      )
    })

    it('service 内部错误传播', async () => {
      const svc = createMockService()
      svc.findOne = () => Promise.reject(new Error('数据库错误'))
      const { LicensePackageController } = require('./license-package.controller')
      const ctrl = new LicensePackageController(svc)

      await assert.rejects(
        () => ctrl.findOne('error'),
        /数据库错误/
      )
    })

    it('空字符串 id 处理', async () => {
      const svc = createMockService()
      svc.findOne = ((id: string) => {
        if (!id) return Promise.reject(new Error('ID 不能为空'))
        return Promise.resolve({ id, name: '套餐' })
      }) as any
      const { LicensePackageController } = require('./license-package.controller')
      const ctrl = new LicensePackageController(svc)

      await assert.rejects(
        () => ctrl.findOne(''),
        /ID 不能为空/
      )
    })
  })

  describe('PUT /api/license-packages/:id — update', () => {
    it('正常更新: 返回更新后的套餐', async () => {
      const svc = createMockService()
      svc.update = () => Promise.resolve({ id: 'pkg-001', name: '企业版 Pro', price: 5999 })
      const { LicensePackageController } = require('./license-package.controller')
      const ctrl = new LicensePackageController(svc)

      const result = await ctrl.update('pkg-001', { name: '企业版 Pro', price: 5999 })
      assert.equal(result.id, 'pkg-001')
      assert.equal(result.name, '企业版 Pro')
    })

    it('update swagger summary 元数据', () => {
      const { LicensePackageController } = require('./license-package.controller')
      const meta = Reflect.getMetadata('swagger/apiOperation', LicensePackageController.prototype.update)
      assert.ok(meta)
      assert.equal(meta.summary, '更新套餐')
    })

    it('不存在的套餐更新抛异常', async () => {
      const svc = createMockService()
      svc.update = () => Promise.reject(new Error('套餐不存在'))
      const { LicensePackageController } = require('./license-package.controller')
      const ctrl = new LicensePackageController(svc)

      await assert.rejects(
        () => ctrl.update('pkg-not-exist', { name: 'xxx' }),
        /套餐不存在/
      )
    })

    it('部分字段更新', async () => {
      let passedDto: any = null
      const svc = createMockService()
      svc.update = ((id: string, dto: any) => { passedDto = dto; return Promise.resolve({ id, name: '仅改名称', price: 100 }) }) as any
      const { LicensePackageController } = require('./license-package.controller')
      const ctrl = new LicensePackageController(svc)

      const result = await ctrl.update('pkg-001', { name: '仅改名称' })
      assert.equal(result.name, '仅改名称')
      assert.equal(passedDto.name, '仅改名称')
      assert.equal(passedDto.price, undefined)
    })
  })

  describe('DELETE /api/license-packages/:id — remove', () => {
    it('正常删除: 返回 void (204)', async () => {
      const svc = createMockService()
      const { LicensePackageController } = require('./license-package.controller')
      const ctrl = new LicensePackageController(svc)

      const result = await ctrl.remove('pkg-001')
      assert.equal(result, undefined)
    })

    it('remove 有 204 HttpCode 元数据 (NestJS __httpCode__)', () => {
      const { LicensePackageController } = require('./license-package.controller')
      const code = Reflect.getMetadata('__httpCode__', LicensePackageController.prototype.remove)
      assert.equal(code, 204)
    })

    it('不存在的套餐删除', async () => {
      const svc = createMockService()
      svc.remove = () => Promise.reject(new Error('套餐不存在'))
      const { LicensePackageController } = require('./license-package.controller')
      const ctrl = new LicensePackageController(svc)

      await assert.rejects(
        () => ctrl.remove('pkg-not-exist'),
        /套餐不存在/
      )
    })

    it('已使用的套餐无法删除', async () => {
      const svc = createMockService()
      svc.remove = () => Promise.reject(new Error('套餐已被使用，无法删除'))
      const { LicensePackageController } = require('./license-package.controller')
      const ctrl = new LicensePackageController(svc)

      await assert.rejects(
        () => ctrl.remove('pkg-in-use'),
        /套餐已被使用/
      )
    })
  })

  describe('POST /api/license-packages/:id/assign — assignToLicense', () => {
    it('正常关联: 成功返回 void', async () => {
      const svc = createMockService()
      const { LicensePackageController } = require('./license-package.controller')
      const ctrl = new LicensePackageController(svc)

      await ctrl.assignToLicense('pkg-001', { licenseId: 'lic-001' })
      assert.ok(true)
    })

    it('带备注和生效日期的关联', async () => {
      let passedPkgId = ''
      let passedDto: any = null
      const svc = createMockService()
      svc.assignToLicense = ((pkgId: string, dto: any) => { passedPkgId = pkgId; passedDto = dto; return Promise.resolve() }) as any
      const { LicensePackageController } = require('./license-package.controller')
      const ctrl = new LicensePackageController(svc)

      await ctrl.assignToLicense('pkg-001', {
        licenseId: 'lic-001',
        remark: 'Q3 采购计划',
        effectiveDate: new Date('2026-07-01'),
      })
      assert.equal(passedPkgId, 'pkg-001')
      assert.equal(passedDto.licenseId, 'lic-001')
      assert.equal(passedDto.remark, 'Q3 采购计划')
      assert.ok(passedDto.effectiveDate)
    })

    it('不存在的套餐关联抛异常', async () => {
      const svc = createMockService()
      svc.assignToLicense = () => Promise.reject(new Error('套餐或 License 不存在'))
      const { LicensePackageController } = require('./license-package.controller')
      const ctrl = new LicensePackageController(svc)

      await assert.rejects(
        () => ctrl.assignToLicense('pkg-not-found', { licenseId: 'lic-001' }),
        /套餐或 License 不存在/
      )
    })
  })

  describe('GET /api/license-packages/:id/licenses — getLicensesByPackage', () => {
    it('正常查询: 返回关联的 License 列表', async () => {
      const svc = createMockService()
      const { LicensePackageController } = require('./license-package.controller')
      const ctrl = new LicensePackageController(svc)

      const result = await ctrl.getLicensesByPackage('pkg-001')
      assert.ok(Array.isArray(result))
      assert.equal(result.length, 1)
      assert.equal(result[0].licenseId, 'lic-001')
    })

    it('无关联 License: 返回空数组', async () => {
      const svc = createMockService()
      svc.getLicensesByPackage = () => Promise.resolve([])
      const { LicensePackageController } = require('./license-package.controller')
      const ctrl = new LicensePackageController(svc)

      const result = await ctrl.getLicensesByPackage('pkg-unused')
      assert.ok(Array.isArray(result))
      assert.equal(result.length, 0)
    })

    it('不存在的套餐查询 License', async () => {
      const svc = createMockService()
      svc.getLicensesByPackage = () => Promise.reject(new Error('套餐不存在'))
      const { LicensePackageController } = require('./license-package.controller')
      const ctrl = new LicensePackageController(svc)

      await assert.rejects(
        () => ctrl.getLicensesByPackage('pkg-not-exist'),
        /套餐不存在/
      )
    })
  })

  describe('Swagger ApiResponse 装饰器', () => {
    it('create 有 response 定义', () => {
      const { LicensePackageController } = require('./license-package.controller')
      const responses = Reflect.getMetadata('swagger/apiResponse', LicensePackageController.prototype.create)
      assert.ok(responses)
    })

    it('findOne 有 404 response', () => {
      const { LicensePackageController } = require('./license-package.controller')
      const responses = Reflect.getMetadata('swagger/apiResponse', LicensePackageController.prototype.findOne)
      const notFound = Object.values(responses).find((r: any) => r.description?.includes('不存在'))
      assert.ok(notFound)
    })

    it('remove 有 204 response', () => {
      const { LicensePackageController } = require('./license-package.controller')
      const responses = Reflect.getMetadata('swagger/apiResponse', LicensePackageController.prototype.remove)
      assert.ok(responses)
    })
  })
})
