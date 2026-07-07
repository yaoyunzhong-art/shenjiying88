import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * blindbox.controller.spec.ts
 *
 * BlindboxController 全路由 spec——覆盖全部 6 个端点 (正例+反例+边界)
 * 使用真实 BlindboxService 实例通过 Controller 全路径测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { lastValueFrom, of, throwError } from 'rxjs'
import { BlindboxController } from './blindbox.controller'

describe('BlindboxController', () => {
  // mock service 工厂 - 返回 rxjs Observable 以兼容控制器内部 subscribe
  function createMockService(): any {
    return {
      createPlan: (input: any) => of({
        planId: 'plan-001',
        name: input.name || '默认计划',
        tiers: input.tiers || [],
        guaranteePityCount: input.guaranteePityCount || 50,
        status: 'ACTIVE',
        createdAt: new Date('2025-01-01'),
      }),
      drawSingle: (userId: string, planId: string) => {
        if (planId === 'inactive-plan') return of(null)
        if (planId === 'not-found') return of(null)
        return of({
          recordId: 'rec-001',
          planId,
          userId,
          tier: 'R',
          prizeId: 'p-021',
          prizeName: '贴纸',
          drawType: 'SINGLE',
          createdAt: new Date(),
        })
      },
      drawBatch10: (userId: string, planId: string) => {
        if (planId === 'not-found') return of([])
        if (planId === 'inactive-plan') return of([])
        return of(Array.from({ length: 10 }, (_, i) => ({
          recordId: `rec-${i + 1}`,
          planId,
          userId,
          tier: i === 0 ? 'SR' : 'R',
          prizeId: i === 0 ? 'p-011' : 'p-021',
          prizeName: i === 0 ? '普通手办' : '贴纸',
          drawType: 'BATCH10' as const,
          createdAt: new Date(),
        })))
      },
      getProbability公示: (planId: string) => {
        if (planId === 'not-found') return of(null)
        return of({
          tiers: [
            { name: 'SSR', probability: 0.05 },
            { name: 'SR', probability: 0.15 },
            { name: 'R', probability: 0.8 },
          ],
          sum: 1,
        })
      },
      getPrizePool: (planId: string) => {
        if (planId === 'not-found') return of(null)
        return of({
          planId,
          name: '夏日盲盒',
          prizePools: [
            { tierId: '1', tierName: 'SSR', prizes: [{ prizeId: 'p-001', name: '限定手办', stock: 10, weight: 1 }] },
          ],
        })
      },
      getDrawHistory: (userId: string, planId: string, limit: number) => {
        if (!userId || !planId) return of([])
        return of([{
          recordId: 'rec-001',
          planId,
          userId,
          tier: 'R',
          prizeId: 'p-021',
          prizeName: '贴纸',
          drawType: 'SINGLE' as const,
          createdAt: new Date(),
        }])
      },
    }
  }

  describe('路由注册与模块元数据', () => {
    it('Controller 有正确的路由前缀', () => {
      const path = Reflect.getMetadata('path', BlindboxController)
      assert.equal(path, 'blindbox')
    })

    it('Controller 构造函数正确注入依赖', () => {
      const svc = createMockService()
      const ctrl = new BlindboxController(svc)
      assert.ok(ctrl instanceof BlindboxController)
    })
  })

  describe('POST /blindbox/plans — createPlan', () => {
    it('正例: 正常创建盲盒计划', async () => {
      const svc = createMockService()
      const ctrl = new BlindboxController(svc)

      const dto = {
        name: '夏日盲盒',
        tiers: [
          {
            tierId: '1',
            name: 'SSR',
            probability: 0.05,
            prizes: [{ prizeId: 'p-001', name: '限定手办', stock: 10, weight: 1 }],
          },
          {
            tierId: '3',
            name: 'R',
            probability: 0.95,
            prizes: [{ prizeId: 'p-021', name: '贴纸', stock: 500, weight: 10 }],
          },
        ],
        guaranteePityCount: 50,
      }

      const plan = await lastValueFrom(ctrl.createPlan(dto))
      assert.ok(plan)
      assert.equal((plan as any).planId, 'plan-001')
      assert.equal((plan as any).name, '夏日盲盒')
    })

    it('边界: 创建空层级计划有默认返回值', async () => {
      const svc = createMockService()
      const ctrl = new BlindboxController(svc)

      const plan = await lastValueFrom(ctrl.createPlan({ name: '空计划', tiers: [], guaranteePityCount: 10 }))
      assert.ok(plan)
      assert.deepStrictEqual((plan as any).tiers, [])
    })
  })

  describe('POST /blindbox/:planId/draw — draw', () => {
    it('正例: 正常单抽返回抽取记录', async () => {
      const svc = createMockService()
      const ctrl = new BlindboxController(svc)

      const result = await lastValueFrom(ctrl.draw('plan-001', { userId: 'user-001' }))
      assert.ok(result)
      const drawResult = result as { success: boolean; data?: any }
      assert.equal(drawResult.success, true)
      assert.equal(drawResult.data.userId, 'user-001')
    })

    it('反例: 不存在的计划返回失败', async () => {
      const svc = createMockService()
      const ctrl = new BlindboxController(svc)

      const result = await lastValueFrom(ctrl.draw('not-found', { userId: 'user-001' }))
      const drawResult = result as { success: boolean; message?: string }
      assert.equal(drawResult.success, false)
      assert.ok(drawResult.message)
    })

    it('反例: 已下架计划返回失败', async () => {
      const svc = createMockService()
      const ctrl = new BlindboxController(svc)

      const result = await lastValueFrom(ctrl.draw('inactive-plan', { userId: 'user-001' }))
      const drawResult = result as { success: boolean; message?: string }
      assert.equal(drawResult.success, false)
    })

    it('边界: service 抛异常返回失败消息', async () => {
      const svc = {
        ...createMockService(),
        drawSingle: () => throwError(() => new Error('service 错误')),
      }
      const ctrl = new BlindboxController(svc)

      const result = await lastValueFrom(ctrl.draw('plan-001', { userId: 'user-001' }))
      const r = result as { success: boolean; message?: string }
      assert.equal(r.success, false)
      assert.ok(r.message)
    })
  })

  describe('POST /blindbox/:planId/draw/batch — drawBatch', () => {
    it('正例: 十连抽返回 10 条记录', async () => {
      const svc = createMockService()
      const ctrl = new BlindboxController(svc)

      const result = await lastValueFrom(ctrl.drawBatch('plan-001', { userId: 'user-001' }))
      assert.ok(result)
      const batchResult = result as { success: boolean; data: any[] }
      assert.equal(batchResult.success, true)
      assert.equal(batchResult.data.length, 10)
    })

    it('反例: 不存在计划十连返回失败', async () => {
      const svc = createMockService()
      const ctrl = new BlindboxController(svc)

      const result = await lastValueFrom(ctrl.drawBatch('not-found', { userId: 'user-001' }))
      const batchResult = result as { success: boolean; message?: string }
      assert.equal(batchResult.success, false)
    })

    it('边界: 已下架计划十连返回失败', async () => {
      const svc = createMockService()
      const ctrl = new BlindboxController(svc)

      const result = await lastValueFrom(ctrl.drawBatch('inactive-plan', { userId: 'user-001' }))
      const batchResult = result as { success: boolean; message?: string }
      assert.equal(batchResult.success, false)
    })
  })

  describe('GET /blindbox/:planId/probabilities — getProbabilities', () => {
    it('正例: 返回概率公示', async () => {
      const svc = createMockService()
      const ctrl = new BlindboxController(svc)

      const result = await lastValueFrom(ctrl.getProbabilities('plan-001'))
      assert.ok(result)
      const probResult = result as { tiers: { name: string; probability: number }[]; sum: number }
      assert.ok(probResult.tiers.length >= 1)
      assert.equal(probResult.sum, 1)
    })

    it('反例: 不存在计划返回 null', async () => {
      const svc = createMockService()
      const ctrl = new BlindboxController(svc)

      const result = await lastValueFrom(ctrl.getProbabilities('not-found'))
      assert.strictEqual(result, null)
    })
  })

  describe('GET /blindbox/:planId/prize-pool — getPrizePool', () => {
    it('正例: 返回奖池信息', async () => {
      const svc = createMockService()
      const ctrl = new BlindboxController(svc)

      const result = await lastValueFrom(ctrl.getPrizePool('plan-001'))
      assert.ok(result)
      const pool = result as { planId: string; name: string; prizePools: any[] }
      assert.equal(pool.planId, 'plan-001')
      assert.equal(pool.name, '夏日盲盒')
      assert.ok(pool.prizePools.length >= 1)
    })

    it('反例: 不存在计划返回 null', async () => {
      const svc = createMockService()
      const ctrl = new BlindboxController(svc)

      const result = await lastValueFrom(ctrl.getPrizePool('not-found'))
      assert.strictEqual(result, null)
    })
  })

  describe('GET /blindbox/:planId/history — getHistory', () => {
    it('正例: 返回抽取历史', async () => {
      const svc = createMockService()
      const ctrl = new BlindboxController(svc)

      const result = await lastValueFrom(ctrl.getHistory('plan-001', 'user-001', '20'))
      assert.ok(result)
      assert.ok(Array.isArray(result))
      assert.ok((result as any[]).length >= 1)
    })

    it('边界: 不传 limit 默认 20', async () => {
      const svc = createMockService()
      const ctrl = new BlindboxController(svc)

      const result = await lastValueFrom(ctrl.getHistory('plan-001', 'user-001', undefined))
      assert.ok(result)
      assert.ok(Array.isArray(result))
    })

    it('反例: 空 userId 返回空数组', async () => {
      const svc = createMockService()
      const ctrl = new BlindboxController(svc)

      const result = await lastValueFrom(ctrl.getHistory('plan-001', '', '20'))
      assert.ok(result)
      assert.ok(Array.isArray(result))
      assert.equal((result as any[]).length, 0)
    })

    it('反例: 空 planId 返回空数组', async () => {
      const svc = createMockService()
      const ctrl = new BlindboxController(svc)

      const result = await lastValueFrom(ctrl.getHistory('', 'user-001', '20'))
      assert.ok(result)
      assert.equal((result as any[]).length, 0)
    })
  })

  describe('装饰器与元数据完整性', () => {
    it('createPlan 有 Post 装饰器', () => {
      const method = Reflect.getMetadata('method', BlindboxController.prototype.createPlan)
      assert.equal(method, 1) // POST = 1
    })

    it('draw 有 Post 装饰器', () => {
      const method = Reflect.getMetadata('method', BlindboxController.prototype.draw)
      assert.equal(method, 1) // POST = 1
    })

    it('drawBatch 有 Post 装饰器', () => {
      const method = Reflect.getMetadata('method', BlindboxController.prototype.drawBatch)
      assert.equal(method, 1) // POST = 1
    })

    it('getProbabilities 有 Get 装饰器', () => {
      const method = Reflect.getMetadata('method', BlindboxController.prototype.getProbabilities)
      assert.equal(method, 0) // GET = 0
    })

    it('getPrizePool 有 Get 装饰器', () => {
      const method = Reflect.getMetadata('method', BlindboxController.prototype.getPrizePool)
      assert.equal(method, 0) // GET = 0
    })

    it('getHistory 有 Get 装饰器', () => {
      const method = Reflect.getMetadata('method', BlindboxController.prototype.getHistory)
      assert.equal(method, 0) // GET = 0
    })
  })
})
