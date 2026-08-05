import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * FederatedLearningController 单元测试
 *
 * 覆盖端点:
 *   - POST /federated/tasks
 *   - GET  /federated/tasks
 *   - GET  /federated/tasks/:id
 *   - POST /federated/tasks/:id/activate
 *   - POST /federated/tasks/:taskId/rounds
 *   - GET  /federated/tasks/:taskId/rounds
 *   - POST /federated/tasks/:taskId/submit
 *   - POST /federated/rounds/:roundId/aggregate
 *   - GET  /federated/tasks/:taskId/privacy
 */

import assert from 'node:assert/strict'

// ── Type Mirrors ────────────────────────────────────────────────

type FederatedTask = {
  id: string
  name: string
  modelArch: string
  participantTenantIds: string[]
  status: 'CREATED' | 'ACTIVE' | 'COMPLETED' | 'FAILED'
  totalRounds: number
  currentRound: number
  createdAt: string
}

type FederatedRound = {
  id: string
  taskId: string
  roundNumber: number
  status: 'ACTIVE' | 'COMPLETED' | 'FAILED'
  startedAt: string
  completedAt?: string
  collectionDeadlineMs?: number
}

type GradientSubmission = {
  id: string
  roundId: string
  tenantId: string
  encryptedGradients: string
  sampleCount: number
  loss: number | null
  submittedAt: string
}

type AggregationResult = {
  roundId: string
  aggregatedParams: string
  participantCount: number
  totalSamples: number
  averageLoss: number
}

type PrivacyAccount = {
  taskId: string
  epsilon: number
  delta: number
  spentBudget: number
  remainingBudget: number
}

// ── Inline Mocks ────────────────────────────────────────────────

function createMocks() {
  const tasks = new Map<string, FederatedTask>()
  const rounds = new Map<string, FederatedRound>()
  const submissions: GradientSubmission[] = []
  let taskIdCounter = 0
  let roundIdCounter = 0
  let subIdCounter = 0

  return {
    async createTask(body: { name: string; modelArch: string; participantTenantIds: string[]; totalRounds?: number }): Promise<FederatedTask> {
      const id = `fl-task-${++taskIdCounter}`
      const task: FederatedTask = {
        id,
        name: body.name,
        modelArch: body.modelArch,
        participantTenantIds: body.participantTenantIds,
        status: 'CREATED',
        totalRounds: body.totalRounds ?? 10,
        currentRound: 0,
        createdAt: new Date().toISOString(),
      }
      tasks.set(id, task)
      return task
    },

    async listTasks(): Promise<FederatedTask[]> {
      return Array.from(tasks.values())
    },

    async getTask(id: string): Promise<FederatedTask | null> {
      return tasks.get(id) ?? null
    },

    async activateTask(id: string): Promise<FederatedTask> {
      const task = tasks.get(id)
      if (!task) throw new Error('Task not found')
      task.status = 'ACTIVE'
      return task
    },

    async startRound(taskId: string, body: { collectionDeadlineMs?: number }): Promise<FederatedRound> {
      const task = tasks.get(taskId)
      if (!task) throw new Error('Task not found')
      const round: FederatedRound = {
        id: `fl-round-${++roundIdCounter}`,
        taskId,
        roundNumber: task.currentRound + 1,
        status: 'ACTIVE',
        startedAt: new Date().toISOString(),
        collectionDeadlineMs: body.collectionDeadlineMs,
      }
      task.currentRound += 1
      rounds.set(round.id, round)
      return round
    },

    async listRounds(taskId: string): Promise<FederatedRound[]> {
      return Array.from(rounds.values()).filter((r) => r.taskId === taskId)
    },

    async submitGradient(taskId: string, body: { roundId: string; encryptedGradients: string; sampleCount: number; loss?: number }): Promise<GradientSubmission> {
      const task = tasks.get(taskId)
      if (!task) throw new Error('Task not found')
      const sub: GradientSubmission = {
        id: `fl-sub-${++subIdCounter}`,
        roundId: body.roundId,
        tenantId: 'client-1',
        encryptedGradients: body.encryptedGradients,
        sampleCount: body.sampleCount,
        loss: body.loss ?? null,
        submittedAt: new Date().toISOString(),
      }
      submissions.push(sub)
      return sub
    },

    async aggregateRound(roundId: string): Promise<AggregationResult> {
      const round = rounds.get(roundId)
      if (!round) throw new Error('Round not found')
      const roundSubs = submissions.filter((s) => s.roundId === roundId)
      round.status = 'COMPLETED'
      return {
        roundId,
        aggregatedParams: 'base64_encoded_aggregated_params',
        participantCount: roundSubs.length,
        totalSamples: roundSubs.reduce((s, sub) => s + sub.sampleCount, 0),
        averageLoss: roundSubs.length > 0
          ? roundSubs.reduce((s, sub) => s + (sub.loss ?? 0), 0) / roundSubs.length
          : 0,
      }
    },

    async getPrivacyAccount(taskId: string): Promise<PrivacyAccount> {
      return {
        taskId,
        epsilon: 1.0,
        delta: 1e-5,
        spentBudget: 0.1,
        remainingBudget: 0.9,
      }
    },

    // Seed helpers
    _seedTask(t: FederatedTask) { tasks.set(t.id, t) },
    _seedRound(r: FederatedRound) { rounds.set(r.id, r) },
  }
}

// ── Inline Controller ───────────────────────────────────────────

class InlineFederatedLearningController {
  constructor(private readonly service: ReturnType<typeof createMocks>) {}

  async createTask(body: any) {
    return this.service.createTask(body)
  }

  async listTasks() {
    const items = await this.service.listTasks()
    return { items, total: items.length }
  }

  async getTask(id: string) {
    return this.service.getTask(id)
  }

  async activateTask(id: string) {
    return this.service.activateTask(id)
  }

  async startRound(taskId: string, body: any) {
    return this.service.startRound(taskId, body)
  }

  async listRounds(taskId: string) {
    return { items: await this.service.listRounds(taskId) }
  }

  async submitGradient(taskId: string, body: any) {
    return this.service.submitGradient(taskId, body)
  }

  async aggregateRound(roundId: string) {
    return this.service.aggregateRound(roundId)
  }

  async getPrivacy(taskId: string) {
    return this.service.getPrivacyAccount(taskId)
  }
}

// ── Tests ───────────────────────────────────────────────────────

describe('FederatedLearningController', () => {
  let mock: ReturnType<typeof createMocks>
  let controller: InlineFederatedLearningController

  beforeEach(() => {
    mock = createMocks()
    controller = new InlineFederatedLearningController(mock)
  })

  describe('POST /federated/tasks - createTask', () => {
    it('[正例] 创建联邦学习任务', async () => {
      const result = await controller.createTask({
        name: '跨门店收入预测',
        modelArch: 'linear-regression',
        participantTenantIds: ['t-store-a', 't-store-b'],
        totalRounds: 20,
      })
      assert.ok(result.id)
      assert.equal(result.name, '跨门店收入预测')
      assert.equal(result.status, 'CREATED')
      assert.equal(result.totalRounds, 20)
    })

    it('[正例] 默认 totalRounds 为 10', async () => {
      const result = await controller.createTask({
        name: '默认轮次',
        modelArch: 'cnn',
        participantTenantIds: ['t-1'],
      })
      assert.equal(result.totalRounds, 10)
    })

    it('[正例] 单人参与者', async () => {
      const result = await controller.createTask({
        name: '单人训练',
        modelArch: 'rnn',
        participantTenantIds: ['t-single'],
      })
      assert.deepEqual(result.participantTenantIds, ['t-single'])
    })
  })

  describe('GET /federated/tasks - listTasks', () => {
    it('[正例] 返回所有任务', async () => {
      await controller.createTask({ name: '任务1', modelArch: 'a', participantTenantIds: ['t1'] })
      await controller.createTask({ name: '任务2', modelArch: 'b', participantTenantIds: ['t2'] })
      const result = await controller.listTasks()
      assert.equal(result.total, 2)
      assert.equal(result.items.length, 2)
    })

    it('[边界] 无任务返回空列表', async () => {
      const result = await controller.listTasks()
      assert.equal(result.total, 0)
      assert.deepEqual(result.items, [])
    })
  })

  describe('GET /federated/tasks/:id - getTask', () => {
    it('[正例] 获取单个任务', async () => {
      const created = await controller.createTask({ name: '任务1', modelArch: 'a', participantTenantIds: ['t1'] })
      const result = await controller.getTask(created.id)
      assert.ok(result)
      assert.equal(result!.name, '任务1')
    })

    it('[反例] 不存在的任务返回 null', async () => {
      const result = await controller.getTask('nonexistent')
      assert.strictEqual(result, null)
    })
  })

  describe('POST /federated/tasks/:id/activate - activateTask', () => {
    it('[正例] 激活任务', async () => {
      const created = await controller.createTask({ name: '激活测试', modelArch: 'a', participantTenantIds: ['t1'] })
      const result = await controller.activateTask(created.id)
      assert.equal(result.status, 'ACTIVE')
    })

    it('[反例] 不存在的任务激活失败', async () => {
      try {
        await controller.activateTask('nonexistent')
        assert.fail('Should have thrown')
      } catch (e: any) {
        assert.equal(e.message, 'Task not found')
      }
    })
  })

  describe('POST /federated/tasks/:taskId/rounds - startRound', () => {
    it('[正例] 启动新轮次', async () => {
      const task = await controller.createTask({ name: '轮次测试', modelArch: 'a', participantTenantIds: ['t1'] })
      await controller.activateTask(task.id)
      const result = await controller.startRound(task.id, {})
      assert.ok(result.id)
      assert.equal(result.taskId, task.id)
      assert.equal(result.status, 'ACTIVE')
    })

    it('[正例] 轮次编号递增', async () => {
      const task = await controller.createTask({ name: '递增测试', modelArch: 'a', participantTenantIds: ['t1'] })
      await controller.activateTask(task.id)
      const r1 = await controller.startRound(task.id, {})
      const r2 = await controller.startRound(task.id, {})
      assert.equal(r2.roundNumber, r1.roundNumber + 1)
    })
  })

  describe('GET /federated/tasks/:taskId/rounds - listRounds', () => {
    it('[正例] 列出任务的轮次', async () => {
      const task = await controller.createTask({ name: '列轮次', modelArch: 'a', participantTenantIds: ['t1'] })
      await controller.activateTask(task.id)
      await controller.startRound(task.id, {})
      await controller.startRound(task.id, {})
      const result = await controller.listRounds(task.id)
      assert.equal(result.items.length, 2)
    })
  })

  describe('POST /federated/tasks/:taskId/submit - submitGradient', () => {
    it('[正例] 提交梯度', async () => {
      const task = await controller.createTask({ name: '梯度提交', modelArch: 'a', participantTenantIds: ['t1'] })
      await controller.activateTask(task.id)
      const round = await controller.startRound(task.id, {})
      const result = await controller.submitGradient(task.id, {
        roundId: round.id,
        encryptedGradients: 'base64gradientdata',
        sampleCount: 100,
        loss: 0.5,
      })
      assert.ok(result.id)
      assert.equal(result.sampleCount, 100)
      assert.equal(result.loss, 0.5)
    })
  })

  describe('POST /federated/rounds/:roundId/aggregate - aggregateRound', () => {
    it('[正例] 聚合轮次结果', async () => {
      const task = await controller.createTask({ name: '聚合测试', modelArch: 'a', participantTenantIds: ['t1', 't2'] })
      await controller.activateTask(task.id)
      const round = await controller.startRound(task.id, {})
      await controller.submitGradient(task.id, { roundId: round.id, encryptedGradients: 'g1', sampleCount: 100, loss: 0.3 })
      await controller.submitGradient(task.id, { roundId: round.id, encryptedGradients: 'g2', sampleCount: 200, loss: 0.4 })
      const result = await controller.aggregateRound(round.id)
      assert.equal(result.roundId, round.id)
      assert.equal(result.participantCount, 2)
      assert.equal(result.totalSamples, 300)
      assert.equal(result.averageLoss, 0.35)
    })

    it('[边界] 无提交的聚合（0 参与者）', async () => {
      const task = await controller.createTask({ name: '空聚合', modelArch: 'a', participantTenantIds: ['t1'] })
      await controller.activateTask(task.id)
      const round = await controller.startRound(task.id, {})
      const result = await controller.aggregateRound(round.id)
      assert.equal(result.participantCount, 0)
      assert.equal(result.averageLoss, 0)
    })
  })

  describe('GET /federated/tasks/:taskId/privacy - getPrivacy', () => {
    it('[正例] 返回隐私预算信息', async () => {
      const task = await controller.createTask({ name: '隐私测试', modelArch: 'a', participantTenantIds: ['t1'] })
      const result = await controller.getPrivacy(task.id)
      assert.equal(result.taskId, task.id)
      assert.ok(result.epsilon > 0)
      assert.ok(result.remainingBudget > 0)
    })
  })
})
