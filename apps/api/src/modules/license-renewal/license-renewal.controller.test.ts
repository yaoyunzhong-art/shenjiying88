import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * Sprint 3 Phase 2 - License 续费管理 Controller 测试
 *
 * 注意: tsx(esbuild) 对 NestJS 参数装饰器支持有限,
 * 本文件使用 require 延时加载 + 验证路由元数据的方式测试 controller 结构。
 * 完整的 controller 集成测试需通过 e2e 测试覆盖。
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { LicenseRenewalController } from './license-renewal.controller'

describe('LicenseRenewalController', () => {
  // 通过 eval 动态加载 controller 文件, 避免 tsx 提前解析装饰器
  let ControllerClass: any
  let controller: any
  let service: any

  beforeEach(async () => {
    const { LicenseRenewalService } = await import('./license-renewal.service')
    ControllerClass = LicenseRenewalController
    service = new LicenseRenewalService()
    controller = new ControllerClass(service)
  })

  // ============ 路由元数据 ============

  describe('route metadata', () => {
    it('controller path should be license-renewal', () => {
      const path = Reflect.getMetadata('path', ControllerClass)
      assert.equal(path, 'license-renewal')
    })

    it('createRecord should have POST method and records path', () => {
      const method = Reflect.getMetadata('method', ControllerClass.prototype.createRecord)
      const path = Reflect.getMetadata('path', ControllerClass.prototype.createRecord)
      assert.equal(method, 1) // POST
      assert.equal(path, 'records')
    })

    it('listRecords should have GET method and records path', () => {
      const method = Reflect.getMetadata('method', ControllerClass.prototype.listRecords)
      const path = Reflect.getMetadata('path', ControllerClass.prototype.listRecords)
      assert.equal(method, 0) // GET
      assert.equal(path, 'records')
    })

    it('getRecord should have GET method with id param', () => {
      const method = Reflect.getMetadata('method', ControllerClass.prototype.getRecord)
      const path = Reflect.getMetadata('path', ControllerClass.prototype.getRecord)
      assert.equal(method, 0) // GET
      assert.equal(path, 'records/:id')
    })

    it('updateStatus should have PATCH method', () => {
      const method = Reflect.getMetadata('method', ControllerClass.prototype.updateStatus)
      const path = Reflect.getMetadata('path', ControllerClass.prototype.updateStatus)
      assert.equal(method, 2) // PATCH
      assert.equal(path, 'records/:id/status')
    })

    it('createNotification should have POST method', () => {
      const method = Reflect.getMetadata('method', ControllerClass.prototype.createNotification)
      const path = Reflect.getMetadata('path', ControllerClass.prototype.createNotification)
      assert.equal(method, 1) // POST
      assert.equal(path, 'notifications')
    })

    it('listNotifications should have GET method', () => {
      const method = Reflect.getMetadata('method', ControllerClass.prototype.listNotifications)
      const path = Reflect.getMetadata('path', ControllerClass.prototype.listNotifications)
      assert.equal(method, 0) // GET
      assert.equal(path, 'notifications')
    })

    it('getStats should have GET method', () => {
      const method = Reflect.getMetadata('method', ControllerClass.prototype.getStats)
      const path = Reflect.getMetadata('path', ControllerClass.prototype.getStats)
      assert.equal(method, 0) // GET
      assert.equal(path, 'stats')
    })
  })

  // ============ 续费记录端点 ============

  describe('createRecord', () => {
    it('should create pending record', async () => {
      const result = await controller.createRecord({
        licenseId: 'lic-new-1',
        tenantId: 'tenant-A',
        price: 1999,
      })

      assert.ok(result.id)
      assert.equal(result.status, 'pending')
      assert.equal(result.licenseId, 'lic-new-1')
    })

    it('should create success record with package info', async () => {
      const result = await controller.createRecord({
        licenseId: 'lic-new-2',
        tenantId: 'tenant-B',
        price: 3999,
        status: 'success',
        packageId: 'pkg-premium',
      })

      assert.equal(result.status, 'success')
      assert.equal(result.packageId, 'pkg-premium')
    })
  })

  describe('listRecords', () => {
    it('should list records with pagination', async () => {
      const result = await controller.listRecords({ page: 1, pageSize: 10 })

      assert.ok(Array.isArray(result.data))
      assert.ok(result.total >= 0)
      assert.equal(result.page, 1)
      assert.equal(result.pageSize, 10)
    })

    it('should filter by licenseId', async () => {
      const result = await controller.listRecords({
        page: 1,
        pageSize: 10,
        licenseId: 'lic-seed-paid',
      })

      assert.ok(result.data.every((r: any) => r.licenseId === 'lic-seed-paid'))
    })

    it('should filter by status', async () => {
      const result = await controller.listRecords({
        page: 1,
        pageSize: 10,
        status: 'success',
      })

      assert.ok(result.data.every((r: any) => r.status === 'success'))
    })

    it('should return empty for no results', async () => {
      const result = await controller.listRecords({
        page: 1,
        pageSize: 10,
        licenseId: 'lic-nonexistent',
      })

      assert.equal(result.data.length, 0)
      assert.equal(result.total, 0)
    })
  })

  describe('getRecord', () => {
    it('should get record by id', async () => {
      const result = await controller.getRecord('renewal-seed-1')

      assert.equal(result.id, 'renewal-seed-1')
      assert.equal(result.licenseId, 'lic-seed-paid')
    })

    it('should throw on non-existent id', async () => {
      await assert.rejects(
        () => controller.getRecord('non-existent'),
        (err: any) => err.name === 'NotFoundException'
      )
    })
  })

  describe('updateStatus', () => {
    it('should update to success', async () => {
      const result = await controller.updateStatus('renewal-seed-2', {
        status: 'success',
        paymentId: 'pay-001',
      })

      assert.equal(result.status, 'success')
      assert.equal(result.paymentId, 'pay-001')
    })

    it('should update to failed with error', async () => {
      const result = await controller.updateStatus('renewal-seed-2', {
        status: 'failed',
        errorMessage: '余额不足',
      })

      assert.equal(result.status, 'failed')
      assert.equal(result.errorMessage, '余额不足')
    })

    it('should throw on non-existent id', async () => {
      await assert.rejects(
        () => controller.updateStatus('non-existent', { status: 'success' }),
        (err: any) => err.name === 'NotFoundException'
      )
    })
  })

  describe('createNotification', () => {
    it('should create reminder notification', async () => {
      const result = await controller.createNotification({
        licenseId: 'lic-001',
        tenantId: 'tenant-A',
        type: 'reminder',
        reminderDays: 7,
        sentAt: new Date().toISOString(),
      })

      assert.equal(result.type, 'reminder')
      assert.equal(result.reminderDays, 7)
    })

    it('should create success notification', async () => {
      const result = await controller.createNotification({
        licenseId: 'lic-001',
        tenantId: 'tenant-A',
        type: 'success',
        sentAt: new Date().toISOString(),
      })

      assert.equal(result.type, 'success')
    })
  })

  describe('listNotifications', () => {
    it('should list all notifications', async () => {
      const result = await controller.listNotifications()

      assert.ok(result.total >= 0)
      assert.ok(Array.isArray(result.data))
    })

    it('should filter by licenseId', async () => {
      const result = await controller.listNotifications('lic-seed-paid')

      assert.ok(result.data.every((n: any) => n.licenseId === 'lic-seed-paid'))
    })
  })

  describe('getStats', () => {
    it('should return overall stats', async () => {
      const result = await controller.getStats()

      assert.ok(typeof result.totalRenewals === 'number')
      assert.ok(typeof result.successRate === 'number')
    })

    it('should return tenant-specific stats', async () => {
      const result = await controller.getStats('tenant-A')

      assert.ok(result.totalRenewals >= 0)
    })

    it('should return zeros for non-existent tenant', async () => {
      const result = await controller.getStats('tenant-ghost')

      assert.equal(result.totalRenewals, 0)
      assert.equal(result.totalRevenue, 0)
    })
  })
})
