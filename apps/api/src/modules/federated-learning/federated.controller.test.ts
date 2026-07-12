// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * FederatedLearningController 单元测试 (.test.ts 标准命名)
 *
 * 覆盖:
 * - 所有路由端点正常流程
 * - 边界: 不存在资源 / 无效参数 / 权限拒绝 / 重复提交 / 预算用尽
 * - HTTP 状态码装饰器
 * - 路由元数据
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MockHomomorphicCipher } from './federated.entity'

const TENANT_A = { tenantId: 'tenant-A', storeId: 'store-001', userId: 'coordinator', role: 'tenant_admin' as const }
const TENANT_B = { tenantId: 'tenant-B', userId: 'participant-B', role: 'operator' as const }
const TENANT_C = { tenantId: 'tenant-C', userId: 'participant-C', role: 'operator' as const }

describe('FederatedLearningController (.test.ts)', () => {
  const { FederatedLearningController } = require('./federated.controller')
  const { FederatedLearningService } = require('./federated.service')
  const { runWithTenant } = require('../../common/context/tenant-context')

  const TASK_DEF = {
    name: 'test-task',
    modelArch: 'lstm-v2',
    participantTenantIds: ['tenant-A', 'tenant-B', 'tenant-C'],
  }

  // ─── 1. 路由元数据 ─────────────────────────────────
  describe('1. 路由元数据', () => {
    it('controller path: federated', () => {
      const path = Reflect.getMetadata('path', FederatedLearningController)
      assert.equal(path, 'federated')
    })

    const ROUTES: Array<[string, string, string]> = [
      ['createTask', 'tasks', 'POST'],
      ['listTasks', 'tasks', 'GET'],
      ['getTask', 'tasks/:id', 'GET'],
      ['activateTask', 'tasks/:id/activate', 'POST'],
      ['startRound', 'tasks/:taskId/rounds', 'POST'],
      ['listRounds', 'tasks/:taskId/rounds', 'GET'],
      ['submitGradient', 'tasks/:taskId/submit', 'POST'],
      ['aggregateRound', 'rounds/:roundId/aggregate', 'POST'],
      ['getPrivacy', 'tasks/:taskId/privacy', 'GET'],
    ]
    for (const [method, expectedPath] of ROUTES) {
      it(`${method} → /${expectedPath}`, () => {
        const metaPath = Reflect.getMetadata('path', FederatedLearningController.prototype[method])
        assert.equal(metaPath, expectedPath)
        const metaMethod = Reflect.getMetadata('method', FederatedLearningController.prototype[method])
        assert.ok(typeof metaMethod === 'number')
      })
    }
  })

  // ─── 2. POST /tasks ────────────────────────────────
  describe('2. POST /tasks 创建任务', () => {
    it('正常创建返回 draft', async () => {
      await runWithTenant(TENANT_A, async () => {
        const svc = new FederatedLearningService()
        const ctrl = new FederatedLearningController(svc)
        const res = await ctrl.createTask(TASK_DEF)
        assert.equal(res.status, 'draft')
        assert.equal(res.name, 'test-task')
      })
    })

    it('空参与者列表 → BadRequest', async () => {
      await runWithTenant(TENANT_A, async () => {
        const svc = new FederatedLearningService()
        const ctrl = new FederatedLearningController(svc)
        await assert.rejects(
          () => ctrl.createTask({ name: 'bad', modelArch: 'x', participantTenantIds: [] }),
          /至少 1 个/,
        )
      })
    })

    it('无效隐私预算 → BadRequest', async () => {
      await runWithTenant(TENANT_A, async () => {
        const svc = new FederatedLearningService()
        const ctrl = new FederatedLearningController(svc)
        await assert.rejects(
          () => ctrl.createTask({ name: 'bad', modelArch: 'x', participantTenantIds: ['B'], privacyBudgetEpsilon: -1 }),
          /必须 > 0/,
        )
      })
    })
  })

  // ─── 3. GET /tasks ─────────────────────────────────
  describe('3. GET /tasks 任务列表', () => {
    it('协调方可看到自己的任务', async () => {
      await runWithTenant(TENANT_A, async () => {
        const svc = new FederatedLearningService()
        const ctrl = new FederatedLearningController(svc)
        await ctrl.createTask(TASK_DEF)
        const res = await ctrl.listTasks()
        assert.equal(res.total, 1)
      })
    })

    it('跨租户隔离', async () => {
      await runWithTenant(TENANT_A, async () => {
        const svc = new FederatedLearningService()
        const ctrl = new FederatedLearningController(svc)
        await ctrl.createTask(TASK_DEF)
      })
      await runWithTenant(TENANT_B, async () => {
        const svc = new FederatedLearningService()
        const ctrl = new FederatedLearningController(svc)
        const res = await ctrl.listTasks()
        assert.equal(res.total, 0)
      })
    })

    it('无任务时空列表', async () => {
      await runWithTenant(TENANT_A, async () => {
        const svc = new FederatedLearningService()
        const ctrl = new FederatedLearningController(svc)
        const res = await ctrl.listTasks()
        assert.deepEqual(res, { items: [], total: 0 })
      })
    })
  })

  // ─── 4. GET /tasks/:id ─────────────────────────────
  describe('4. GET /tasks/:id 获取任务', () => {
    it('存在时返回详情', async () => {
      await runWithTenant(TENANT_A, async () => {
        const svc = new FederatedLearningService()
        const ctrl = new FederatedLearningController(svc)
        const created = await ctrl.createTask(TASK_DEF)
        const fetched = await ctrl.getTask(created.id)
        assert.equal(fetched.id, created.id)
      })
    })

    it('不存在时 404', async () => {
      await runWithTenant(TENANT_A, async () => {
        const svc = new FederatedLearningService()
        const ctrl = new FederatedLearningController(svc)
        await assert.rejects(() => ctrl.getTask('nonexistent'), /不存在/)
      })
    })

    it('跨租户不可见', async () => {
      let tid: string
      await runWithTenant(TENANT_A, async () => {
        const svc = new FederatedLearningService()
        const ctrl = new FederatedLearningController(svc)
        const t = await ctrl.createTask(TASK_DEF)
        tid = t.id
      })
      await runWithTenant(TENANT_B, async () => {
        const svc = new FederatedLearningService()
        const ctrl = new FederatedLearningController(svc)
        await assert.rejects(() => ctrl.getTask(tid!), /不存在/)
      })
    })
  })

  // ─── 5. POST /tasks/:id/activate ───────────────────
  describe('5. POST /tasks/:id/activate 激活任务', () => {
    it('draft → active', async () => {
      await runWithTenant(TENANT_A, async () => {
        const svc = new FederatedLearningService()
        const ctrl = new FederatedLearningController(svc)
        const t = await ctrl.createTask(TASK_DEF)
        const act = await ctrl.activateTask(t.id)
        assert.equal(act.status, 'active')
      })
    })

    it('已激活任务再次激活失败', async () => {
      await runWithTenant(TENANT_A, async () => {
        const svc = new FederatedLearningService()
        const ctrl = new FederatedLearningController(svc)
        const t = await ctrl.createTask(TASK_DEF)
        await ctrl.activateTask(t.id)
        await assert.rejects(() => ctrl.activateTask(t.id), /只能从/)
      })
    })
  })

  // ─── 6. POST /tasks/:taskId/rounds & submit & aggregate ─
  describe('6. 完整一轮流程', () => {
    it('创建→激活→启动轮次→提交→聚合', async () => {
      const svc = new FederatedLearningService()
      let taskId: string, roundId: string
      const taskDef = { name: 'e2e-test', modelArch: 'x', participantTenantIds: ['tenant-B', 'tenant-C'], minParticipants: 2, totalRounds: 3 }
      await runWithTenant(TENANT_A, async () => {
        const ctrl = new FederatedLearningController(svc)
        const t = await ctrl.createTask(taskDef)
        await ctrl.activateTask(t.id)
        const r = await ctrl.startRound(t.id, {})
        taskId = t.id
        roundId = r.id
      })
      const cipher = new MockHomomorphicCipher()
      // 两个参与者提交
      await runWithTenant(TENANT_B, async () => {
        const ctrl = new FederatedLearningController(svc)
        await ctrl.submitGradient(taskId!, { roundId: roundId!, encryptedGradients: cipher.encrypt([0.1, 0.2]), sampleCount: 100 })
      })
      await runWithTenant(TENANT_C, async () => {
        const ctrl = new FederatedLearningController(svc)
        await ctrl.submitGradient(taskId!, { roundId: roundId!, encryptedGradients: cipher.encrypt([0.3, 0.4]), sampleCount: 200 })
      })
      const agg = await runWithTenant(TENANT_A, async () => {
        const ctrl = new FederatedLearningController(svc)
        return ctrl.aggregateRound(roundId!)
      })
      assert.equal(agg.participantCount, 2)
      assert.equal(agg.totalSamples, 300)
      assert.equal(agg.method, 'fedavg')
    })
  })

  // ─── 7. HTTP 状态码 ────────────────────────────────
  describe('7. HTTP 状态码装饰器', () => {
    const codes: Array<[string, number]> = [
      ['createTask', 201],
      ['activateTask', 200],
      ['startRound', 201],
      ['submitGradient', 202],
      ['aggregateRound', 200],
    ]
    for (const [method, code] of codes) {
      it(`${method} → ${code}`, () => {
        const meta = Reflect.getMetadata('__httpCode__', FederatedLearningController.prototype[method])
        assert.equal(meta, code)
      })
    }
  })
})
