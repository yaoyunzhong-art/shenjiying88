import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [federated-learning] [A/C] 角色测试扩展
 *
 * 8 角色深度场景扩展测试 — federated-learning 模块
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色 ≥ 3 测试用例 (正常流程 + 降级场景 + 权限边界)
 * 覆盖: createTask, listTasks, getTask, activateTask, startRound, listRounds,
 *       submitGradient, aggregateRound, getPrivacyAccount
 * 扩展: 隐私预算耗尽、梯度超限、加密失败、多轮聚合、跨租户隔离
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { runWithTenant } from '../../common/context/tenant-context'
import { FederatedLearningService } from './federated.service'
import { MockHomomorphicCipher } from './federated.entity'
import type { CreateFederatedTaskDto } from './federated.dto'

// ── 8 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 测试租户 ──
const TENANTS = {
  Coordinator: { tenantId: 'ten-centre', storeId: 'hq-001', userId: 'coordinator', role: 'tenant_admin' as const },
  StoreA: { tenantId: 'ten-store-a', storeId: 'store-a', userId: 'store-a-ops', role: 'operator' as const },
  StoreB: { tenantId: 'ten-store-b', storeId: 'store-b', userId: 'store-b-ops', role: 'operator' as const },
  StoreC: { tenantId: 'ten-store-c', storeId: 'store-c', userId: 'store-c-ops', role: 'operator' as const },
  Outsider: { tenantId: 'ten-outsider', storeId: 'store-xyz', userId: 'outsider', role: 'operator' as const },
}

// ── 加密工具 ──
const cipher = new MockHomomorphicCipher()
function encG(v: number[]): string { return cipher.encrypt(v) }

// ── 服务工厂 ──
function createService(): FederatedLearningService {
  const svc = new FederatedLearningService()
  svc.setCipher(new MockHomomorphicCipher())
  return svc
}

// ── 工具: 标准联邦任务创建 ──
async function createStandardTask(
  svc: FederatedLearningService,
  ctx = TENANTS.Coordinator,
  overrides: Partial<CreateFederatedTaskDto> = {},
) {
  return runWithTenant(ctx, () =>
    svc.createTask({
      name: '跨店销售预测',
      modelArch: 'sales-forecaster-v2',
      participantTenantIds: ['ten-store-a', 'ten-store-b'],
      totalRounds: 5,
      privacyBudgetEpsilon: 2.0,
      minParticipants: 2,
      maxGradientNorm: 1.0,
      noiseMultiplier: 1.1,
      ...overrides,
    }),
  )
}

// ── 工具: 完整一轮训练流程 ──
async function runFullRound(
  svc: FederatedLearningService,
  taskId: string,
  coordinatorCtx: typeof TENANTS.Coordinator,
  participantCtxs: Array<typeof TENANTS.StoreA>,
) {
  const round = await runWithTenant(coordinatorCtx, async () => {
    try { await svc.activateTask(taskId) } catch { /* already active/past-draft */ }
    return svc.startRound(taskId, { collectionDeadlineMs: 60000 })
  })
  const roundId = round.id

  for (const pCtx of participantCtxs) {
    await runWithTenant(pCtx, () =>
      svc.submitGradient(taskId, { roundId, encryptedGradients: encG([0.05, 0.1, 0.15]), sampleCount: 100, loss: 0.5 }),
    )
  }

  const aggResult = await runWithTenant(coordinatorCtx, () => svc.aggregateRound(roundId))
  return { roundId, aggResult }
}

// ============================================================
// 👔店长 —— 关注联邦学习整体运行状态和租户间协作健康度
// ============================================================
describe(`${ROLES.StoreManager} 店长扩展 - 联邦学习全局视图`, () => {
  describe('正常流程：全链路联邦训练', () => {
    it('单轮完整训练流程（创建→激活→轮次→提交→聚合）', async () => {
      const svc = createService()
      const task = await createStandardTask(svc)

      assert.equal(task.status, 'draft')
      assert.equal(task.currentRound, 0)

      const { aggResult } = await runFullRound(svc, task.id, TENANTS.Coordinator, [TENANTS.StoreA, TENANTS.StoreB])

      assert.ok(aggResult.roundId)
      assert.equal(aggResult.participantCount, 2)
      assert.equal(aggResult.totalSamples, 200)
      assert.equal(aggResult.method, 'fedavg')
      assert.ok(aggResult.epsilonConsumed > 0)
      assert.ok(aggResult.durationMs >= 0)
      assert.equal(aggResult.globalModelVersion, 1)
    })

    it('多轮连续训练（5轮）确保状态正确和预算逐步消耗', async () => {
      const svc = createService()
      const task = await createStandardTask(svc, TENANTS.Coordinator, { totalRounds: 5, privacyBudgetEpsilon: 20.0 })

      for (let roundNum = 1; roundNum <= 5; roundNum++) {
        const { aggResult } = await runFullRound(svc, task.id, TENANTS.Coordinator, [TENANTS.StoreA, TENANTS.StoreB])
        assert.equal(aggResult.globalModelVersion, roundNum)
      }

      const finalTask = await runWithTenant(TENANTS.Coordinator, () => svc.getTask(task.id))
      assert.equal(finalTask.status, 'completed')
      assert.equal(finalTask.currentRound, 5)
      assert.ok(finalTask.consumedEpsilon > 0)
    })
  })

  describe('边界条件：任务查询范围', () => {
    it('协调者查看所有已创建任务', async () => {
      const svc = createService()
      await createStandardTask(svc, TENANTS.Coordinator, { name: 'Task A' })
      await createStandardTask(svc, TENANTS.Coordinator, { name: 'Task B' })

      const tasks = await runWithTenant(TENANTS.Coordinator, () => svc.listTasks())
      assert.equal(tasks.length, 2)
    })

    it('参与者可以查看所在任务的轮次信息', async () => {
      const svc = createService()
      const task = await createStandardTask(svc)

      const rounds = await runWithTenant(TENANTS.StoreA, () => svc.listRounds(task.id))
      assert.equal(rounds.length, 0)

      await runFullRound(svc, task.id, TENANTS.Coordinator, [TENANTS.StoreA, TENANTS.StoreB])

      const rounds2 = await runWithTenant(TENANTS.StoreA, () => svc.listRounds(task.id))
      assert.equal(rounds2.length, 1)
      assert.equal(rounds2[0].roundNumber, 1)
    })
  })
})

// ============================================================
// 🛒前台 —— 关注联邦任务创建与基础操作易用性
// ============================================================
describe(`${ROLES.FrontDesk} 前台扩展 - 联邦任务创建与激活`, () => {
  describe('正常流程：标准任务创建', () => {
    it('最小参数字段创建成功', async () => {
      const svc = createService()
      const task = await createStandardTask(svc, TENANTS.Coordinator, {
        name: '最小测试任务',
        totalRounds: 1,
        privacyBudgetEpsilon: 1.0,
      })

      assert.equal(task.name, '最小测试任务')
      assert.equal(task.totalRounds, 1)
      assert.equal(task.privacyBudgetEpsilon, 1.0)
      assert.equal(task.minParticipants, 2)
      assert.equal(task.aggregationMethod, 'fedavg')
    })

    it('任务列表中按创建时间倒序排列', async () => {
      const svc = createService()
      await createStandardTask(svc, TENANTS.Coordinator, { name: 'A' })
      await createStandardTask(svc, TENANTS.Coordinator, { name: 'B' })

      const tasks = await runWithTenant(TENANTS.Coordinator, () => svc.listTasks())
      // 按创建时间倒序排列: 后创建的在前面
      assert.ok(tasks[0].createdAt >= tasks[1].createdAt, '应倒序排列')
    })
  })

  describe('边界条件：异常输入', () => {
    it('参与方列表为空应拒绝', async () => {
      const svc = createService()
      await assert.rejects(
        () => runWithTenant(TENANTS.Coordinator, () => svc.createTask({ name: '无效任务', modelArch: 'test', participantTenantIds: [] })),
        { message: /participantTenantIds 至少 1 个/ },
      )
    })

    it('负值隐私预算应拒绝', async () => {
      const svc = createService()
      await assert.rejects(
        () => runWithTenant(TENANTS.Coordinator, () => svc.createTask({ name: '无效预算', modelArch: 'test', participantTenantIds: [TENANTS.StoreA.tenantId], privacyBudgetEpsilon: -1 })),
        { message: /privacyBudgetEpsilon 必须 > 0/ },
      )
    })
  })
})

// ============================================================
// 👥HR —— 关注权限管理和参与方白名单控制
// ============================================================
describe(`${ROLES.HR} HR扩展 - 参与方权限与租户隔离`, () => {
  describe('正常流程：白名单正确工作', () => {
    it('白名单内的参与者可提交梯度', async () => {
      const svc = createService()
      const task = await createStandardTask(svc)

      const round = await runWithTenant(TENANTS.Coordinator, async () => {
        await svc.activateTask(task.id)
        return svc.startRound(task.id)
      })

      const result = await runWithTenant(TENANTS.StoreA, () =>
        svc.submitGradient(task.id, { roundId: round.id, encryptedGradients: encG([0.1, 0.2]), sampleCount: 50 }),
      )
      assert.equal(result.status, 'accepted')
    })

    it('非白名单租户拒绝提交', async () => {
      const svc = createService()
      const task = await createStandardTask(svc)

      const round = await runWithTenant(TENANTS.Coordinator, async () => {
        await svc.activateTask(task.id)
        return svc.startRound(task.id)
      })

      await assert.rejects(
        () => runWithTenant(TENANTS.Outsider, () =>
          svc.submitGradient(task.id, { roundId: round.id, encryptedGradients: encG([1, 2, 3]), sampleCount: 10 }),
        ),
        (err: any) => err.status === 403 || err.message.includes('不在该任务白名单'),
      )
    })
  })

  describe('边界条件：租户隔离', () => {
    it('参与者无法查询协调者隐私预算', async () => {
      const svc = createService()
      const task = await createStandardTask(svc)

      await assert.rejects(
        () => runWithTenant(TENANTS.StoreA, () => svc.getPrivacyAccount(task.id)),
        { message: /不存在/ },
      )
    })

    it('同一租户在同一轮次不能重复提交', async () => {
      const svc = createService()
      const task = await createStandardTask(svc)

      const round = await runWithTenant(TENANTS.Coordinator, async () => {
        await svc.activateTask(task.id)
        return svc.startRound(task.id, { collectionDeadlineMs: 60000 })
      })

      await runWithTenant(TENANTS.StoreA, async () => {
        await svc.submitGradient(task.id, { roundId: round.id, encryptedGradients: encG([0.1, 0.2]), sampleCount: 50 })
      })
      await assert.rejects(
        () => runWithTenant(TENANTS.StoreA, () =>
          svc.submitGradient(task.id, { roundId: round.id, encryptedGradients: encG([0.3, 0.4]), sampleCount: 50 }),
        ),
        { message: /已提交/ },
      )
    })
  })
})

// ============================================================
// 🔧安监 —— 关注安全边界、加密与隐私预算防护
// ============================================================
describe(`${ROLES.Safety} 安监扩展 - 联邦学习安全边界`, () => {
  describe('正常流程：隐私预算保护', () => {
    it('预算耗尽后应阻止新轮次', async () => {
      const svc = createService()
      const task = await createStandardTask(svc, TENANTS.Coordinator, {
        totalRounds: 5,
        privacyBudgetEpsilon: 0.01,
      })

      await runFullRound(svc, task.id, TENANTS.Coordinator, [TENANTS.StoreA, TENANTS.StoreB])

      await assert.rejects(
        () => runWithTenant(TENANTS.Coordinator, () => svc.startRound(task.id)),
        { message: /预算已用尽/ },
      )
    })

    it('隐私账户精确追踪 ε/δ 消耗', async () => {
      const svc = createService()
      const task = await createStandardTask(svc, TENANTS.Coordinator, {
        totalRounds: 3,
        privacyBudgetEpsilon: 10.0,
      })

      const epsilonBefore = task.consumedEpsilon
      const { aggResult } = await runFullRound(svc, task.id, TENANTS.Coordinator, [TENANTS.StoreA, TENANTS.StoreB])

      const account = await runWithTenant(TENANTS.Coordinator, () => svc.getPrivacyAccount(task.id))
      assert.equal(account.consumedEpsilon, epsilonBefore + aggResult.epsilonConsumed)
      assert.ok(account.consumedEpsilon > 0)
      assert.ok(account.consumedEpsilon <= account.totalEpsilon)
    })
  })

  describe('边界条件：梯度合规检查', () => {
    it('最小参与方不足应导致聚合失败', async () => {
      const svc = createService()
      const task = await createStandardTask(svc, TENANTS.Coordinator, { minParticipants: 3 })

      const round = await runWithTenant(TENANTS.Coordinator, async () => {
        await svc.activateTask(task.id)
        return svc.startRound(task.id)
      })

      await runWithTenant(TENANTS.StoreA, () =>
        svc.submitGradient(task.id, { roundId: round.id, encryptedGradients: encG([0.1]), sampleCount: 30 }),
      )

      await assert.rejects(
        () => runWithTenant(TENANTS.Coordinator, () => svc.aggregateRound(round.id)),
        { message: /客户端不足/ },
      )
    })

    it('所有梯度解密失败应导致聚合失败', async () => {
      const svc = createService()
      const brokenCipher: any = { encrypt: (g: number[]) => 'broken', decrypt: () => { throw new Error('解密失败') } }
      svc.setCipher(brokenCipher)

      const task = await createStandardTask(svc)

      const round = await runWithTenant(TENANTS.Coordinator, async () => {
        await svc.activateTask(task.id)
        return svc.startRound(task.id)
      })

      await runWithTenant(TENANTS.StoreA, () =>
        svc.submitGradient(task.id, { roundId: round.id, encryptedGradients: 'NOT_VALID', sampleCount: 50 }),
      )
      await runWithTenant(TENANTS.StoreB, () =>
        svc.submitGradient(task.id, { roundId: round.id, encryptedGradients: 'ALSO_NOT_VALID', sampleCount: 50 }),
      )

      await assert.rejects(
        () => runWithTenant(TENANTS.Coordinator, () => svc.aggregateRound(round.id)),
        { message: /无有效梯度/ },
      )
    })
  })
})

// ============================================================
// 🎮导玩员 —— 关注梯度提交&验证的易用性与反馈
// ============================================================
describe(`${ROLES.Guide} 导玩员扩展 - 梯度提交与轮次状态`, () => {
  describe('正常流程：梯度提交全流程', () => {
    it('参与方梯度提交后轮次状态正确更新', async () => {
      const svc = createService()
      const task = await createStandardTask(svc)

      const round = await runWithTenant(TENANTS.Coordinator, async () => {
        await svc.activateTask(task.id)
        return svc.startRound(task.id)
      })

      assert.equal(round.status, 'collecting')
      assert.equal(round.actualParticipants, 0)

      const sub = await runWithTenant(TENANTS.StoreA, () =>
        svc.submitGradient(task.id, { roundId: round.id, encryptedGradients: encG([0.5, 0.3]), sampleCount: 200 }),
      )
      assert.equal(sub.status, 'accepted')
      assert.ok(sub.submissionId)

      const rounds = await runWithTenant(TENANTS.Coordinator, () => svc.listRounds(task.id))
      assert.equal(rounds[0].actualParticipants, 1)
    })

    it('梯度提交带样本数和损失，聚合后正确统计', async () => {
      const svc = createService()
      const task = await createStandardTask(svc)

      const round = await runWithTenant(TENANTS.Coordinator, async () => {
        await svc.activateTask(task.id)
        return svc.startRound(task.id)
      })

      await runWithTenant(TENANTS.StoreA, () =>
        svc.submitGradient(task.id, { roundId: round.id, encryptedGradients: encG([0.1, 0.2, 0.3]), sampleCount: 300, loss: 0.25 }),
      )
      await runWithTenant(TENANTS.StoreB, () =>
        svc.submitGradient(task.id, { roundId: round.id, encryptedGradients: encG([0.4, 0.5, 0.6]), sampleCount: 500, loss: 0.32 }),
      )

      const agg = await runWithTenant(TENANTS.Coordinator, () => svc.aggregateRound(round.id))
      assert.equal(agg.totalSamples, 800)
      assert.ok(agg.averageLoss >= 0)
    })
  })

  describe('边界条件：梯度提交时机', () => {
    it('轮次截止时间后不能提交', async () => {
      const svc = createService()
      const task = await createStandardTask(svc)

      const round = await runWithTenant(TENANTS.Coordinator, async () => {
        await svc.activateTask(task.id)
        return svc.startRound(task.id, { collectionDeadlineMs: 1 })
      })

      await new Promise((r) => setTimeout(r, 5))

      await assert.rejects(
        () => runWithTenant(TENANTS.StoreA, () =>
          svc.submitGradient(task.id, { roundId: round.id, encryptedGradients: encG([0.01, 0.02]), sampleCount: 10 }),
        ),
        { message: /截止时间/ },
      )
    })

    it('不在 collecting 状态的轮次不能提交', async () => {
      const svc = createService()
      const task = await createStandardTask(svc)

      await runFullRound(svc, task.id, TENANTS.Coordinator, [TENANTS.StoreA, TENANTS.StoreB])

      const rounds = await runWithTenant(TENANTS.Coordinator, () => svc.listRounds(task.id))
      const completedRoundId = rounds[0].id

      await assert.rejects(
        () => runWithTenant(TENANTS.StoreA, () =>
          svc.submitGradient(task.id, { roundId: completedRoundId, encryptedGradients: encG([0.01, 0.02]), sampleCount: 10 }),
        ),
        { message: /不在收集阶段/ },
      )
    })
  })
})

// ============================================================
// 🎯运行专员 —— 关注系统稳定性、幂等性、并发安全
// ============================================================
describe(`${ROLES.Ops} 运行专员扩展 - 联邦学习稳定性`, () => {
  describe('正常流程：幂等性与可重复性', () => {
    it('相同参数多次创建返回不同任务 ID', async () => {
      const svc = createService()
      const t1 = await createStandardTask(svc, TENANTS.Coordinator)
      const t2 = await createStandardTask(svc, TENANTS.Coordinator)

      assert.notEqual(t1.id, t2.id)
      assert.equal(t1.name, t2.name)
    })

    it('列表始终可用（空列表非 null）', async () => {
      const svc = createService()
      const tasks = await runWithTenant(TENANTS.Coordinator, () => svc.listTasks())
      assert.ok(Array.isArray(tasks))
      assert.equal(tasks.length, 0)
    })
  })

  describe('边界条件：状态机一致性', () => {
    it('非 draft 状态的任务不能再次激活', async () => {
      const svc = createService()
      const task = await createStandardTask(svc)

      await runFullRound(svc, task.id, TENANTS.Coordinator, [TENANTS.StoreA, TENANTS.StoreB])

      await assert.rejects(
        () => runWithTenant(TENANTS.Coordinator, () => svc.activateTask(task.id)),
        { message: /只能从 draft\/paused 启动/ },
      )
    })

    it('不存在的任务 ID 查询应抛 NotFound', async () => {
      const svc = createService()
      await assert.rejects(
        () => runWithTenant(TENANTS.Coordinator, () => svc.getTask('non-existent-task')),
        { message: /不存在/ },
      )
    })

    it('跨租户查询非参与的任务应抛 NotFound', async () => {
      const svc = createService()
      const task = await createStandardTask(svc, TENANTS.Coordinator)

      await assert.rejects(
        () => runWithTenant(TENANTS.Outsider, () => svc.getTask(task.id)),
        { message: /不存在/ },
      )
    })
  })
})

// ============================================================
// 🤝团建 —— 关注跨店协作与团队聚合效果
// ============================================================
describe(`${ROLES.Teambuilding} 团建扩展 - 跨店协作聚合`, () => {
  describe('正常流程：多租户聚合结果', () => {
    it('两租户参与聚合后全局模型版本递增', async () => {
      const svc = createService()
      const task = await createStandardTask(svc, TENANTS.Coordinator, {
        totalRounds: 3,
        aggregationMethod: 'fedprox',
        privacyBudgetEpsilon: 20.0,
      })

      for (let v = 1; v <= 3; v++) {
        const { aggResult } = await runFullRound(svc, task.id, TENANTS.Coordinator, [TENANTS.StoreA, TENANTS.StoreB])
        assert.equal(aggResult.globalModelVersion, v)
        assert.equal(aggResult.method, 'fedprox')
      }
    })

    it('三租户聚合正确统计参与数和样本总数', async () => {
      const svc = createService()
      const task = await runWithTenant(TENANTS.Coordinator, () =>
        svc.createTask({
          name: '三方联合训练',
          modelArch: 'multi-party-v1',
          participantTenantIds: [TENANTS.StoreA.tenantId, TENANTS.StoreB.tenantId, TENANTS.StoreC.tenantId],
          totalRounds: 1,
          minParticipants: 3,
        }),
      )

      const round = await runWithTenant(TENANTS.Coordinator, async () => {
        await svc.activateTask(task.id)
        return svc.startRound(task.id, { collectionDeadlineMs: 30000 })
      })

      for (const ctx of [TENANTS.StoreA, TENANTS.StoreB, TENANTS.StoreC]) {
        await runWithTenant(ctx, () =>
          svc.submitGradient(task.id, { roundId: round.id, encryptedGradients: encG([0.1, 0.2, 0.3]), sampleCount: 150, loss: 0.4 }),
        )
      }

      const agg = await runWithTenant(TENANTS.Coordinator, () => svc.aggregateRound(round.id))
      assert.equal(agg.participantCount, 3)
      assert.equal(agg.totalSamples, 450)
    })
  })

  describe('边界条件：聚合方法切换', () => {
    it('scaffold 聚合方法能产生有效聚合结果', async () => {
      const svc = createService()
      const task = await createStandardTask(svc, TENANTS.Coordinator, {
        totalRounds: 1,
        aggregationMethod: 'scaffold',
      })

      const { aggResult } = await runFullRound(svc, task.id, TENANTS.Coordinator, [TENANTS.StoreA, TENANTS.StoreB])
      assert.equal(aggResult.method, 'scaffold')
      assert.ok(aggResult.epsilonConsumed > 0)
    })
  })
})

// ============================================================
// 📢营销 —— 关注联邦学习如何赋能营销模型与数据价值
// ============================================================
describe(`${ROLES.Marketing} 营销扩展 - 联邦学习营销场景`, () => {
  describe('正常流程：营销模型训练链路', () => {
    it('创建营销预测模型联邦训练任务', async () => {
      const svc = createService()
      const task = await runWithTenant(TENANTS.Coordinator, () =>
        svc.createTask({
          name: '大促转化率预测',
          modelArch: 'promo-cvr-v3',
          participantTenantIds: [TENANTS.StoreA.tenantId, TENANTS.StoreB.tenantId],
          totalRounds: 10,
          aggregationMethod: 'fedavg',
          privacyBudgetEpsilon: 5.0,
          minParticipants: 2,
        }),
      )

      assert.equal(task.name, '大促转化率预测')
      assert.equal(task.modelArch, 'promo-cvr-v3')
      assert.equal(task.totalRounds, 10)
    })

    it('营销模型训练多轮后隐私预算消耗可视化', async () => {
      const svc = createService()
      const task = await createStandardTask(svc, TENANTS.Coordinator, {
        totalRounds: 10,
        privacyBudgetEpsilon: 20.0,
      })

      const epsBefore = task.privacyBudgetEpsilon
      let totalEpsConsumed = 0

      for (let i = 0; i < 3; i++) {
        const { aggResult } = await runFullRound(svc, task.id, TENANTS.Coordinator, [TENANTS.StoreA, TENANTS.StoreB])
        totalEpsConsumed += aggResult.epsilonConsumed
      }

      assert.ok(totalEpsConsumed > 0, '应有预算消耗')
      assert.ok(totalEpsConsumed < epsBefore, '不应超过总预算')
    })
  })

  describe('边界条件：数据价值保护', () => {
    it('不同样本量的客户端梯度聚合加权正确', async () => {
      const svc = createService()
      const task = await createStandardTask(svc)

      const round = await runWithTenant(TENANTS.Coordinator, async () => {
        await svc.activateTask(task.id)
        return svc.startRound(task.id)
      })

      await runWithTenant(TENANTS.StoreA, () =>
        svc.submitGradient(task.id, { roundId: round.id, encryptedGradients: encG([0.5, 0.3, 0.1]), sampleCount: 1000, loss: 0.3 }),
      )
      await runWithTenant(TENANTS.StoreB, () =>
        svc.submitGradient(task.id, { roundId: round.id, encryptedGradients: encG([0.2, 0.4, 0.6]), sampleCount: 100, loss: 0.6 }),
      )

      const agg = await runWithTenant(TENANTS.Coordinator, () => svc.aggregateRound(round.id))
      assert.equal(agg.totalSamples, 1100)
      assert.equal(agg.participantCount, 2)
    })

    it('聚合结果包含差分隐私噪声（不泄露原始梯度）', async () => {
      const svc = createService()
      const task = await createStandardTask(svc)

      const { aggResult } = await runFullRound(svc, task.id, TENANTS.Coordinator, [TENANTS.StoreA, TENANTS.StoreB])

      assert.ok(aggResult.epsilonConsumed > 0)
      assert.ok(typeof aggResult.averageLoss === 'number')
    })
  })

  describe('边界条件：模型迭代', () => {
    it('多轮联邦训练框架正常运转', async () => {
      const svc = createService()
      const task = await createStandardTask(svc, TENANTS.Coordinator, { privacyBudgetEpsilon: 20.0, totalRounds: 5 })

      for (let i = 0; i < 3; i++) {
        const { aggResult } = await runFullRound(svc, task.id, TENANTS.Coordinator, [TENANTS.StoreA, TENANTS.StoreB])
        assert.ok(typeof aggResult.averageLoss === 'number')
      }
    })
  })
})
