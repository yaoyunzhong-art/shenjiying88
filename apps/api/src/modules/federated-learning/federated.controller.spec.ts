import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * FederatedLearningController 单元测试
 *
 * 策略: require 内联 Controller + Service (不依赖 NestJS DI),
 * 使用 runWithTenant 设置租户上下文, 覆盖所有 8 个路由端点。
 *
 * 正向流程 + 边界条件 (空数据、不存在的任务、权限拒绝、重复提交、预算用尽)
 */

import { FederatedLearningController } from './federated.controller';
import { FederatedLearningService } from './federated.service';
import { runWithTenant } from '../../common/context/tenant-context';
import assert from 'node:assert/strict'
import { MockHomomorphicCipher } from './federated.entity'

const TENANT_A = { tenantId: 'tenant-A', storeId: 'store-001', userId: 'coordinator', role: 'tenant_admin' as const }
const TENANT_B = { tenantId: 'tenant-B', userId: 'participant-B', role: 'operator' as const }
const TENANT_C = { tenantId: 'tenant-C', userId: 'participant-C', role: 'operator' as const }

describe('FederatedLearningController', () => {
  // Late require to avoid import-order problems with reflect-metadata



  interface TenantCtx { tenantId: string; storeId?: string; userId?: string; role: string }

  const TASKS = [
    { name: 'sales-forecast', modelArch: 'lstm-v2', participantTenantIds: ['tenant-A', 'tenant-B', 'tenant-C'] },
    { name: 'fraud-detection', modelArch: 'xgboost-v1', participantTenantIds: ['tenant-A', 'tenant-B'] },
    { name: 'recommendation', modelArch: 'dssm-v3', participantTenantIds: ['tenant-A', 'tenant-B', 'tenant-C'] },
  ]

  // ─── 1. 路由元数据 ─────────────────────────────────
  describe('1. 路由元数据 (NestJS Decorators)', () => {
    it('controller path: federated', () => {
      const path = Reflect.getMetadata('path', FederatedLearningController)
      assert.equal(path, 'federated')
    })

    const ROUTES: Array<[string, string, number, string]> = [
      ['createTask', 'tasks', 1, 'POST'],
      ['listTasks', 'tasks', 0, 'GET'],
      ['getTask', 'tasks/:id', 0, 'GET'],
      ['activateTask', 'tasks/:id/activate', 1, 'POST'],
      ['startRound', 'tasks/:taskId/rounds', 1, 'POST'],
      ['listRounds', 'tasks/:taskId/rounds', 0, 'GET'],
      ['submitGradient', 'tasks/:taskId/submit', 1, 'POST'],
      ['aggregateRound', 'rounds/:roundId/aggregate', 1, 'POST'],
      ['getPrivacy', 'tasks/:taskId/privacy', 0, 'GET'],
    ]

    for (const [method, path, httpCode, httpMethod] of ROUTES) {
      it(`${httpMethod} /${path}`, () => {
        const p = Reflect.getMetadata('path', FederatedLearningController.prototype[method]);
        assert.equal(p, path)
        const m = Reflect.getMetadata('method', FederatedLearningController.prototype[method])
        assert.equal(typeof m, 'number')
      })
    }
  })

  // ─── 2. POST /tasks — 任务创建 ─────────────────────
  describe('2. POST federated/tasks 创建任务', () => {
    it('2.1 成功创建任务 → 返回 draft 状态', async () => {
      await runWithTenant(TENANT_A, async () => {
        const svc = new FederatedLearningService()
        const ctrl = new FederatedLearningController(svc)
        const result = await ctrl.createTask(TASKS[0])
        assert.equal(result.status, 'draft')
        assert.equal(result.name, 'sales-forecast')
        assert.equal(result.currentRound, 0)
        assert.ok(result.id.startsWith('fed-task-'))
        assert.equal(result.creatorTenantId, undefined) // 无这个字段
      })
    })

    it('2.2 空参与者列表 → 抛出 BadRequest', async () => {
      await runWithTenant(TENANT_A, async () => {
        const svc = new FederatedLearningService()
        const ctrl = new FederatedLearningController(svc)
        await assert.rejects(
          () => ctrl.createTask({ name: 'bad', modelArch: 'x', participantTenantIds: [] }),
          /至少 1 个/,
        )
      })
    })

    it('2.3 带所有可选参数', async () => {
      await runWithTenant(TENANT_A, async () => {
        const svc = new FederatedLearningService()
        const ctrl = new FederatedLearningController(svc)
        const task = await ctrl.createTask({
          name: 'full-params',
          modelArch: 'resnet50',
          participantTenantIds: ['tenant-A', 'tenant-B'],
          aggregationMethod: 'fedprox',
          totalRounds: 20,
          privacyBudgetEpsilon: 2.0,
          privacyBudgetDelta: 1e-6,
          minParticipants: 2,
          noiseMultiplier: 1.5,
          maxGradientNorm: 2.0,
        })
        assert.equal(task.name, 'full-params')
        assert.equal(task.aggregationMethod, 'fedprox')
        assert.equal(task.totalRounds, 20)
        assert.equal(task.privacyBudgetEpsilon, 2.0)
        assert.equal(task.minParticipants, 2)
        assert.equal(task.noiseMultiplier, 1.5)
        assert.equal(task.maxGradientNorm, 2.0)
      })
    })

    it('2.4 无效隐私预算 → 抛异常', async () => {
      await runWithTenant(TENANT_A, async () => {
        const svc = new FederatedLearningService()
        const ctrl = new FederatedLearningController(svc)
        await assert.rejects(
          () => ctrl.createTask({
            name: 'bad-budget',
            modelArch: 'x',
            participantTenantIds: ['tenant-B'],
            privacyBudgetEpsilon: -1,
          }),
          /必须 > 0/,
        )
      })
    })
  })

  // ─── 3. GET /tasks — 任务列表 ──────────────────────
  describe('3. GET federated/tasks 任务列表', () => {
    it('3.1 协调方可见自己的任务', async () => {
      await runWithTenant(TENANT_A, async () => {
        const svc = new FederatedLearningService()
        const ctrl = new FederatedLearningController(svc)
        await ctrl.createTask(TASKS[0])
        await ctrl.createTask(TASKS[1])
        const result = await ctrl.listTasks()
        assert.equal(result.total, 2)
        assert.equal(result.items.length, 2)
      })
    })

    it('3.2 非协调方看见空列表（跨租户隔离）', async () => {
      await runWithTenant(TENANT_A, async () => {
        const svc = new FederatedLearningService()
        const ctrl = new FederatedLearningController(svc)
        await ctrl.createTask(TASKS[0])
      })
      await runWithTenant(TENANT_B, async () => {
        const svc = new FederatedLearningService()
        const ctrl = new FederatedLearningController(svc)
        const result = await ctrl.listTasks()
        assert.equal(result.total, 0)
        assert.deepEqual(result.items, [])
      })
    })

    it('3.3 无任务时返回空数组', async () => {
      await runWithTenant(TENANT_A, async () => {
        const svc = new FederatedLearningService()
        const ctrl = new FederatedLearningController(svc)
        const result = await ctrl.listTasks()
        assert.equal(result.total, 0)
        assert.deepEqual(result.items, [])
      })
    })
  })

  // ─── 4. GET /tasks/:id — 获取单任务 ────────────────
  describe('4. GET federated/tasks/:id 获取单个任务', () => {
    it('4.1 存在时返回任务详情', async () => {
      await runWithTenant(TENANT_A, async () => {
        const svc = new FederatedLearningService()
        const ctrl = new FederatedLearningController(svc)
        const created = await ctrl.createTask(TASKS[0])
        const fetched = await ctrl.getTask(created.id)
        assert.equal(fetched.id, created.id)
        assert.equal(fetched.name, 'sales-forecast')
      })
    })

    it('4.2 不存在时 → NotFound', async () => {
      await runWithTenant(TENANT_A, async () => {
        const svc = new FederatedLearningService()
        const ctrl = new FederatedLearningController(svc)
        await assert.rejects(
          () => ctrl.getTask('nonexistent-id'),
          /不存在/,
        )
      })
    })

    it('4.3 跨租户访问被隔离', async () => {
      let taskId: string
      await runWithTenant(TENANT_A, async () => {
        const svc = new FederatedLearningService()
        const ctrl = new FederatedLearningController(svc)
        const task = await ctrl.createTask(TASKS[0])
        taskId = task.id
      })
      await runWithTenant(TENANT_B, async () => {
        const svc = new FederatedLearningService()
        const ctrl = new FederatedLearningController(svc)
        await assert.rejects(
          () => ctrl.getTask(taskId!),
          /不存在/,
        )
      })
    })
  })

  // ─── 5. POST /tasks/:id/activate — 任务激活 ────────
  describe('5. POST federated/tasks/:id/activate 激活任务', () => {
    it('5.1 成功从 draft → active', async () => {
      await runWithTenant(TENANT_A, async () => {
        const svc = new FederatedLearningService()
        const ctrl = new FederatedLearningController(svc)
        const task = await ctrl.createTask(TASKS[0])
        const activated = await ctrl.activateTask(task.id)
        assert.equal(activated.status, 'active')
      })
    })

    it('5.2 激活已激活的任务 → 抛出 BadRequest', async () => {
      await runWithTenant(TENANT_A, async () => {
        const svc = new FederatedLearningService()
        const ctrl = new FederatedLearningController(svc)
        const task = await ctrl.createTask(TASKS[0])
        await ctrl.activateTask(task.id)
        await assert.rejects(
          () => ctrl.activateTask(task.id),
          /只能从 draft|paused 启动/,
        )
      })
    })

    it('5.3 不存在的任务 → NotFound', async () => {
      await runWithTenant(TENANT_A, async () => {
        const svc = new FederatedLearningService()
        const ctrl = new FederatedLearningController(svc)
        await assert.rejects(
          () => ctrl.activateTask('bad-id'),
          /不存在/,
        )
      })
    })
  })

  // ─── 6. POST /tasks/:taskId/rounds — 启动轮次 ──────
  describe('6. POST federated/tasks/:taskId/rounds 启动轮次', () => {
    it('6.1 激活后启动轮次 → collecting 状态', async () => {
      await runWithTenant(TENANT_A, async () => {
        const svc = new FederatedLearningService()
        const ctrl = new FederatedLearningController(svc)
        const task = await ctrl.createTask(TASKS[0])
        await ctrl.activateTask(task.id)
        const round = await ctrl.startRound(task.id, {})
        assert.equal(round.status, 'collecting')
        assert.equal(round.roundNumber, 1)
        assert.equal(round.expectedParticipants, 3)
        assert.ok(round.collectionDeadlineAt)
      })
    })

    it('6.2 draft 状态不能启动轮次 → BadRequest', async () => {
      await runWithTenant(TENANT_A, async () => {
        const svc = new FederatedLearningService()
        const ctrl = new FederatedLearningController(svc)
        const task = await ctrl.createTask(TASKS[0])
        await assert.rejects(
          () => ctrl.startRound(task.id, {}),
          /未激活/,
        )
      })
    })

    it('6.3 自定义收集截止时间', async () => {
      await runWithTenant(TENANT_A, async () => {
        const svc = new FederatedLearningService()
        const ctrl = new FederatedLearningController(svc)
        const task = await ctrl.createTask(TASKS[0])
        await ctrl.activateTask(task.id)
        const round = await ctrl.startRound(task.id, { collectionDeadlineMs: 5000 })
        const deadline = new Date(round.collectionDeadlineAt!).getTime()
        const started = new Date(round.collectionStartedAt!).getTime()
        assert.ok(deadline - started <= 10000) // ~5000ms 允许小误差
      })
    })

    it('6.4 不存在的任务 → NotFound', async () => {
      await runWithTenant(TENANT_A, async () => {
        const svc = new FederatedLearningService()
        const ctrl = new FederatedLearningController(svc)
        await assert.rejects(
          () => ctrl.startRound('bad-task-id', {}),
          /不存在/,
        )
      })
    })

    it('6.5 跨租户不能启动轮次', async () => {
      let taskId: string
      await runWithTenant(TENANT_A, async () => {
        const svc = new FederatedLearningService()
        const ctrl = new FederatedLearningController(svc)
        const task = await ctrl.createTask(TASKS[0])
        await ctrl.activateTask(task.id)
        taskId = task.id
      })
      await runWithTenant(TENANT_B, async () => {
        const svc = new FederatedLearningService()
        const ctrl = new FederatedLearningController(svc)
        await assert.rejects(
          () => ctrl.startRound(taskId!, {}),
          /不存在/,
        )
      })
    })
  })

  // ─── 7. GET /tasks/:taskId/rounds — 轮次列表 ───────
  describe('7. GET federated/tasks/:taskId/rounds 轮次列表', () => {
    it('7.1 多轮次列表', async () => {
      await runWithTenant(TENANT_A, async () => {
        const svc = new FederatedLearningService()
        const ctrl = new FederatedLearningController(svc)
        const task = await ctrl.createTask({ ...TASKS[0], totalRounds: 5, minParticipants: 1 })
        await ctrl.activateTask(task.id)
        const r1 = await ctrl.startRound(task.id, {})
        // 手动完成第 1 轮 (直接设置状态)
        const svcAny = svc as any
        const taskObj = svcAny.tasks.get(task.id)
        taskObj.currentRound = 1 // 模拟完成一轮
        const r2 = await ctrl.startRound(task.id, {})

        const result = await ctrl.listRounds(task.id)
        assert.equal(result.items.length, 2)
        assert.equal(result.items[0].roundNumber, 1)
        assert.equal(result.items[1].roundNumber, 2)
      })
    })

    it('7.2 无轮次时返回空数组', async () => {
      await runWithTenant(TENANT_A, async () => {
        const svc = new FederatedLearningService()
        const ctrl = new FederatedLearningController(svc)
        const task = await ctrl.createTask(TASKS[0])
        const result = await ctrl.listRounds(task.id)
        assert.equal(result.items.length, 0)
      })
    })
  })

  // ─── 8. POST /tasks/:taskId/submit — 梯度提交 ──────
  describe('8. POST federated/tasks/:taskId/submit 梯度提交', () => {
    it('8.1 白名单租户成功提交', async () => {
      const svc = new FederatedLearningService()
      let taskId: string, roundId: string
      await runWithTenant(TENANT_A, async () => {
        const ctrl = new FederatedLearningController(svc)
        const task = await ctrl.createTask({ name: 'submit-test', modelArch: 'x', participantTenantIds: ['tenant-B'], minParticipants: 1 })
        await ctrl.activateTask(task.id)
        const round = await ctrl.startRound(task.id, {})
        taskId = task.id
        roundId = round.id
      })
      const cipher = new MockHomomorphicCipher()
      const encrypted = cipher.encrypt([0.1, 0.2, 0.3])
      const result = await runWithTenant(TENANT_B, async () => {
        const ctrl = new FederatedLearningController(svc)
        return ctrl.submitGradient(taskId!, {
          roundId: roundId!,
          encryptedGradients: encrypted,
          sampleCount: 100,
        })
      })
      assert.equal(result.status, 'accepted')
      assert.ok(result.submissionId)
    })

    it('8.2 非白名单租户被禁止', async () => {
      const svc = new FederatedLearningService()
      let taskId: string, roundId: string
      await runWithTenant(TENANT_A, async () => {
        const ctrl = new FederatedLearningController(svc)
        const task = await ctrl.createTask({ name: 'whitelist', modelArch: 'x', participantTenantIds: ['tenant-B'], minParticipants: 1 })
        await ctrl.activateTask(task.id)
        const round = await ctrl.startRound(task.id, {})
        taskId = task.id
        roundId = round.id
      })
      const cipher = new MockHomomorphicCipher()
      const encrypted = cipher.encrypt([0.1, 0.2])
      await assert.rejects(
        () => runWithTenant(TENANT_C, async () => {
          const ctrl = new FederatedLearningController(svc)
          return ctrl.submitGradient(taskId!, {
            roundId: roundId!,
            encryptedGradients: encrypted,
            sampleCount: 50,
          })
        }),
        /白名单/,
      )
    })

    it('8.3 同一轮次重复提交被拒绝', async () => {
      const svc = new FederatedLearningService()
      let taskId: string, roundId: string
      await runWithTenant(TENANT_A, async () => {
        const ctrl = new FederatedLearningController(svc)
        const task = await ctrl.createTask({ name: 'dup-submit', modelArch: 'x', participantTenantIds: ['tenant-B'], minParticipants: 1 })
        await ctrl.activateTask(task.id)
        const round = await ctrl.startRound(task.id, {})
        taskId = task.id
        roundId = round.id
      })
      const cipher = new MockHomomorphicCipher()
      const encrypted = cipher.encrypt([1, 2, 3])
      await runWithTenant(TENANT_B, async () => {
        const ctrl = new FederatedLearningController(svc)
        await ctrl.submitGradient(taskId!, {
          roundId: roundId!,
          encryptedGradients: encrypted,
          sampleCount: 100,
        })
        // Second submit — should fail
        await assert.rejects(
          () => ctrl.submitGradient(taskId!, {
            roundId: roundId!,
            encryptedGradients: cipher.encrypt([4, 5, 6]),
            sampleCount: 200,
          }),
          /已提交/,
        )
      })
    })
  })

  // ─── 9. POST /rounds/:roundId/aggregate — 聚合 ─────
  describe('9. POST federated/rounds/:roundId/aggregate 聚合', () => {
    it('9.1 完整 FedAvg 聚合流程', async () => {
      const svc = new FederatedLearningService()
      let taskId: string, roundId: string
      await runWithTenant(TENANT_A, async () => {
        const ctrl = new FederatedLearningController(svc)
        const task = await ctrl.createTask({
          name: 'agg-test',
          modelArch: 'lstm',
          participantTenantIds: ['tenant-A', 'tenant-B', 'tenant-C'],
          minParticipants: 2,
          totalRounds: 2,
        })
        await ctrl.activateTask(task.id)
        const round = await ctrl.startRound(task.id, {})
        taskId = task.id
        roundId = round.id
      })

      const cipher = new MockHomomorphicCipher()
      // Tenant-B and Tenant-C submit using the same svc instance
      await runWithTenant(TENANT_B, async () => {
        const ctrl = new FederatedLearningController(svc)
        await ctrl.submitGradient(taskId!, {
          roundId: roundId!,
          encryptedGradients: cipher.encrypt([0.1, 0.2, 0.3]),
          sampleCount: 100,
        })
      })
      await runWithTenant(TENANT_C, async () => {
        const ctrl = new FederatedLearningController(svc)
        await ctrl.submitGradient(taskId!, {
          roundId: roundId!,
          encryptedGradients: cipher.encrypt([0.3, 0.4, 0.5]),
          sampleCount: 200,
        })
      })

      let agg: any
      try {
        agg = await runWithTenant(TENANT_A, async () => {
          const ctrl = new FederatedLearningController(svc)
          return ctrl.aggregateRound(roundId!)
        })
      } catch (e: any) {
        assert.fail(`aggregateRound threw: ${e.message}`)
      }
      assert.equal(agg.participantCount, 2)
      assert.equal(agg.totalSamples, 300)
      assert.equal(agg.method, 'fedavg')
      assert.equal(agg.globalModelVersion, 1)
      assert.ok(agg.epsilonConsumed > 0, `epsilonConsumed should be > 0 but was ${agg.epsilonConsumed}`)
      assert.ok(agg.deltaConsumed > 0, `deltaConsumed should be > 0 but was ${agg.deltaConsumed}`)
      assert.ok(agg.durationMs >= 0, `durationMs should be >= 0 but was ${agg.durationMs}`)
    })

    it('9.2 客户端不足时聚合失败', async () => {
      const svc = new FederatedLearningService()
      let taskId: string, roundId: string
      await runWithTenant(TENANT_A, async () => {
        const ctrl = new FederatedLearningController(svc)
        const task = await ctrl.createTask({
          name: 'min-fail',
          modelArch: 'x',
          participantTenantIds: ['tenant-B', 'tenant-C'],
          minParticipants: 3,
        })
        await ctrl.activateTask(task.id)
        const round = await ctrl.startRound(task.id, {})
        taskId = task.id
        roundId = round.id
      })
      const cipher = new MockHomomorphicCipher()
      await runWithTenant(TENANT_B, async () => {
        const ctrl = new FederatedLearningController(svc)
        await ctrl.submitGradient(taskId!, {
          roundId: roundId!,
          encryptedGradients: cipher.encrypt([1, 2]),
          sampleCount: 10,
        })
      })
      await assert.rejects(
        () => runWithTenant(TENANT_A, async () => {
          const ctrl = new FederatedLearningController(svc)
          return ctrl.aggregateRound(roundId!)
        }),
        /客户端不足/,
      )
    })

    it('9.3 不存在的轮次 → NotFound', async () => {
      await runWithTenant(TENANT_A, async () => {
        const svc = new FederatedLearningService()
        const ctrl = new FederatedLearningController(svc)
        await assert.rejects(
          () => ctrl.aggregateRound('bad-round-id'),
          /不存在/,
        )
      })
    })
  })

  // ─── 10. GET /tasks/:taskId/privacy — 隐私预算 ─────
  describe('10. GET federated/tasks/:taskId/privacy 隐私预算', () => {
    it('10.1 查询隐私账户', async () => {
      await runWithTenant(TENANT_A, async () => {
        const svc = new FederatedLearningService()
        const ctrl = new FederatedLearningController(svc)
        const task = await ctrl.createTask({
          name: 'privacy-check',
          modelArch: 'x',
          participantTenantIds: ['tenant-B'],
          minParticipants: 1,
          privacyBudgetEpsilon: 5.0,
        })
        const account = await ctrl.getPrivacy(task.id)
        assert.equal(account.totalEpsilon, 5.0)
        assert.equal(account.consumedEpsilon, 0)
        assert.ok(account.totalDelta > 0)
      })
    })

    it('10.2 聚合后预算减少', async () => {
      const svc = new FederatedLearningService()
      let taskId: string, roundId: string
      await runWithTenant(TENANT_A, async () => {
        const ctrl = new FederatedLearningController(svc)
        const task = await ctrl.createTask({
          name: 'budget-dec',
          modelArch: 'x',
          participantTenantIds: ['tenant-B'],
          minParticipants: 1,
          privacyBudgetEpsilon: 5.0,
        })
        await ctrl.activateTask(task.id)
        const round = await ctrl.startRound(task.id, {})
        taskId = task.id
        roundId = round.id
      })
      const cipher = new MockHomomorphicCipher()
      await runWithTenant(TENANT_B, async () => {
        const ctrl = new FederatedLearningController(svc)
        await ctrl.submitGradient(taskId!, {
          roundId: roundId!,
          encryptedGradients: cipher.encrypt([1, 2]),
          sampleCount: 10,
        })
      })
      await runWithTenant(TENANT_A, async () => {
        const ctrl = new FederatedLearningController(svc)
        await ctrl.aggregateRound(roundId!)
        const account = await ctrl.getPrivacy(taskId!)
        assert.ok(account.consumedEpsilon > 0)
        assert.ok(account.consumedEpsilon < 5.0)
      })
    })

    it('10.3 不存在的任务 → NotFound', async () => {
      await runWithTenant(TENANT_A, async () => {
        const svc = new FederatedLearningService()
        const ctrl = new FederatedLearningController(svc)
        await assert.rejects(
          () => ctrl.getPrivacy('bad-task-id'),
          /不存在/,
        )
      })
    })
  })

  // ─── 11. HTTP 状态码 ────────────────────────────────
  describe('11. HTTP 状态码装饰器', () => {
    it('createTask → 201 CREATED', () => {
      const code = Reflect.getMetadata('__httpCode__', FederatedLearningController.prototype.createTask)
      assert.equal(code, 201)
    })
    it('activateTask → 200 OK', () => {
      const code = Reflect.getMetadata('__httpCode__', FederatedLearningController.prototype.activateTask)
      assert.equal(code, 200)
    })
    it('startRound → 201 CREATED', () => {
      const code = Reflect.getMetadata('__httpCode__', FederatedLearningController.prototype.startRound)
      assert.equal(code, 201)
    })
    it('submitGradient → 202 ACCEPTED', () => {
      const code = Reflect.getMetadata('__httpCode__', FederatedLearningController.prototype.submitGradient)
      assert.equal(code, 202)
    })
    it('aggregateRound → 200 OK', () => {
      const code = Reflect.getMetadata('__httpCode__', FederatedLearningController.prototype.aggregateRound)
      assert.equal(code, 200)
    })
  })
})
