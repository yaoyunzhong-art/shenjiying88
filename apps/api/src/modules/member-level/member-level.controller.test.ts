import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MemberLevelController } from './member-level.controller'
import { MemberLevelService } from './member-level.service'

describe('MemberLevelController', () => {

  let controller: InstanceType<typeof MemberLevelController>
  let service: InstanceType<typeof MemberLevelService>

  beforeEach(() => {
    service = new MemberLevelService()
    controller = new MemberLevelController(service)
  })

  describe('route metadata', () => {
    it('controller path metadata should be member-level', () => {
      const path = Reflect.getMetadata('path', MemberLevelController)
      assert.equal(path, 'member-level')
    })

    it('evaluate route should have POST method and evaluate path', () => {
      const method = Reflect.getMetadata('method', MemberLevelController.prototype.evaluate)
      const path = Reflect.getMetadata('path', MemberLevelController.prototype.evaluate)

      assert.equal(method, 1) // POST
      assert.equal(path, 'evaluate')
    })

    it('calculate route should have POST method and calculate path', () => {
      const method = Reflect.getMetadata('method', MemberLevelController.prototype.calculate)
      const path = Reflect.getMetadata('path', MemberLevelController.prototype.calculate)

      assert.equal(method, 1) // POST
      assert.equal(path, 'calculate')
    })

    it('batchEvaluate route should have POST method and batch path', () => {
      const method = Reflect.getMetadata('method', MemberLevelController.prototype.batchEvaluate)
      const path = Reflect.getMetadata('path', MemberLevelController.prototype.batchEvaluate)

      assert.equal(method, 1) // POST
      assert.equal(path, 'batch')
    })

    it('getConfig route should have GET method and config path', () => {
      const method = Reflect.getMetadata('method', MemberLevelController.prototype.getConfig)
      const path = Reflect.getMetadata('path', MemberLevelController.prototype.getConfig)

      assert.equal(method, 0) // GET
      assert.equal(path, 'config')
    })

    it('getUpgradePath route should have GET method and upgrade-path/:fromTier/:fromSub/:toTier/:toSub path', () => {
      const method = Reflect.getMetadata('method', MemberLevelController.prototype.getUpgradePath)
      const path = Reflect.getMetadata('path', MemberLevelController.prototype.getUpgradePath)

      assert.equal(method, 0) // GET
      assert.equal(path, 'upgrade-path/:fromTier/:fromSub/:toTier/:toSub')
    })
  })

  describe('controller methods - 正常流程', () => {
    it('evaluate should return success with level info', () => {
      const result = controller.evaluate({
        memberId: 'member-001',
        growthValue: 800,
        totalSpend: 2000,
        totalVisits: 12,
        tenantId: 'tenant-001'
      })

      assert.equal(result.success, true)
      assert.ok(result.data)
      assert.equal(result.data.currentTier, 'VIP')
      assert.equal(result.data.currentSub, 'L1')
    })

    it('calculate should return success for valid growthValue', async () => {
      const result = await controller.calculate({ growthValue: 5000 })

      assert.equal(result.success, true)
      assert.ok(result.data)
      assert.ok(result.data.currentTier)
    })

    it('batchEvaluate should return success with batch output', () => {
      const result = controller.batchEvaluate({
        items: [
          { input: { memberId: 'm1', growthValue: 0, totalSpend: 0, totalVisits: 0, tenantId: 't1' } },
          { input: { memberId: 'm2', growthValue: 4000, totalSpend: 10000, totalVisits: 60, tenantId: 't1' } }
        ]
      })

      assert.equal(result.success, true)
      assert.equal(result.data.totalEvaluated, 2)
    })

    it('getConfig should return all 18 level configs', () => {
      const result = controller.getConfig()

      assert.equal(result.success, true)
      assert.equal(result.data.tiers.length, 18)
    })

    it('getUpgradePath should return upgrade records', () => {
      const result = controller.getUpgradePath('REGULAR', 'L1', 'SVIP', 'L1')

      assert.equal(result.success, true)
      assert.ok(Array.isArray(result.data))
      assert.ok(result.data.length > 0)
    })
  })

  describe('controller methods - 边界条件', () => {
    it('calculate should throw for negative growthValue', async () => {
      let caught = false
      try {
        await controller.calculate({ growthValue: -1 })
      } catch (err: any) {
        caught = true
        assert.ok(err.message.includes('growthValue must be a non-negative number'))
      }
      assert.equal(caught, true)
    })

    it('getUpgradePath should throw for invalid tier', () => {
      let caught = false
      try {
        controller.getUpgradePath('INVALID', 'L1', 'VIP', 'L1')
      } catch (err: any) {
        caught = true
        assert.ok(err.message.includes('Invalid fromTier'))
      }
      assert.equal(caught, true)
    })

    it('getUpgradePath should throw for invalid sub', () => {
      let caught = false
      try {
        controller.getUpgradePath('REGULAR', 'L5', 'VIP', 'L1')
      } catch (err: any) {
        caught = true
        assert.ok(err.message.includes('Invalid fromSub'))
      }
      assert.equal(caught, true)
    })
  })
})
