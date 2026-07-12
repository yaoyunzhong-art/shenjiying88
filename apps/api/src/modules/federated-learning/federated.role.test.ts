// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [federated-learning] [C] 角色测试
 * 
 * 8 角色视角的联邦学习模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MockHomomorphicCipher } from './federated.entity'
import { runWithTenant } from '../../common/context/tenant-context'

// ── 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 租户上下文 ──
const TENANTS = {
  Coordinator: { tenantId: 'ten-centre', storeId: 'hq-001', userId: 'coordinator', role: 'tenant_admin' as const },
  ParticipantA: { tenantId: 'ten-store-a', userId: 'store-a-ops', role: 'operator' as const },
  ParticipantB: { tenantId: 'ten-store-b', userId: 'store-b-ops', role: 'operator' as const },
  NonParticipant: { tenantId: 'ten-outsider', userId: 'outsider', role: 'operator' as const },
}

// ── 服务工厂（每次新实例，避免测试间污染） ──
function createFreshService() {
  const { FederatedLearningService } = require('./federated.service')
  return new FederatedLearningService()
}

function createController(service: any) {
  const { FederatedLearningController } = require('./federated.controller')
  return new FederatedLearningController(service)
}

const cipher = new MockHomomorphicCipher()

// ── 👔店长 ──
describe(`${ROLES.StoreManager} 联邦学习 角色测试`, () => {
  it('店长发起跨门店联合训练任务（新建）', async () => {
    const svc = createFreshService()
    const result = await runWithTenant(TENANTS.Coordinator, async () => {
      const ctrl = createController(svc)
      return ctrl.createTask({
        name: 'store-sales-forecast',
        modelArch: 'lstm-v2',
        participantTenantIds: ['ten-store-a', 'ten-store-b'],
        aggregationMethod: 'fedavg',
        totalRounds: 10,
        minParticipants: 2,
      })
    })
    assert.equal(result.status, 'draft')
    assert.equal(result.name, 'store-sales-forecast')
    assert.equal(result.participantTenantIds.length, 2)
    assert.equal(result.coordinatorTenantId, 'ten-centre')
  })

  it('店长查看所有已创建的联邦任务（管理视角）', async () => {
    const svc = createFreshService()
    await runWithTenant(TENANTS.Coordinator, async () => {
      const ctrl = createController(svc)
      await ctrl.createTask({ name: 'task-1', modelArch: 'm1', participantTenantIds: ['ten-store-a'] })
      await ctrl.createTask({ name: 'task-2', modelArch: 'm2', participantTenantIds: ['ten-store-b'] })
    })
    await runWithTenant(TENANTS.Coordinator, async () => {
      const ctrl = createController(svc)
      const list = await ctrl.listTasks()
      assert.equal(list.total, 2)
      assert.ok(list.items.every((t: any) => t.coordinatorTenantId === 'ten-centre'))
    })
  })

  it('店长无法看到其他协调者的任务（跨门店隔离）', async () => {
    const svc = createFreshService()
    await runWithTenant(TENANTS.Coordinator, async () => {
      const ctrl = createController(svc)
      await ctrl.createTask({ name: 'my-task', modelArch: 'm1', participantTenantIds: ['ten-store-a'] })
    })
    await runWithTenant(TENANTS.ParticipantA, async () => {
      const ctrl = createController(svc)
      const list = await ctrl.listTasks()
      assert.equal(list.total, 0)
    })
  })
})

// ── 🛒前台 ──
describe(`${ROLES.FrontDesk} 联邦学习 角色测试`, () => {
  it('前台作为参与方提交门店本地梯度（正常参与）', async () => {
    const svc = createFreshService()
    let taskId: string, roundId: string
    await runWithTenant(TENANTS.Coordinator, async () => {
      const ctrl = createController(svc)
      const task = await ctrl.createTask({
        name: 'counter-pred',
        modelArch: 'linear-v1',
        participantTenantIds: ['ten-store-a'],
        minParticipants: 1,
      })
      await ctrl.activateTask(task.id)
      const round = await ctrl.startRound(task.id, {})
      taskId = task.id
      roundId = round.id
    })
    const result = await runWithTenant(TENANTS.ParticipantA, async () => {
      const ctrl = createController(svc)
      return ctrl.submitGradient(taskId!, {
        roundId: roundId!,
        encryptedGradients: cipher.encrypt([0.05, 0.1, 0.15]),
        sampleCount: 50,
      })
    })
    assert.equal(result.status, 'accepted')
    assert.ok(result.submissionId)
  })

  it('前台未在白名单时无法提交梯度（权限边界）', async () => {
    const svc = createFreshService()
    let taskId: string, roundId: string
    await runWithTenant(TENANTS.Coordinator, async () => {
      const ctrl = createController(svc)
      const task = await ctrl.createTask({
        name: 'whitelist-only',
        modelArch: 'x',
        participantTenantIds: ['ten-store-a'],
        minParticipants: 1,
      })
      await ctrl.activateTask(task.id)
      const round = await ctrl.startRound(task.id, {})
      taskId = task.id
      roundId = round.id
    })
    await assert.rejects(
      () => runWithTenant(TENANTS.NonParticipant, async () => {
        const ctrl = createController(svc)
        return ctrl.submitGradient(taskId!, {
          roundId: roundId!,
          encryptedGradients: cipher.encrypt([1, 2, 3]),
          sampleCount: 100,
        })
      }),
      /白名单/,
    )
  })

  it('前台同一轮次不能重复提交', async () => {
    const svc = createFreshService()
    let taskId: string, roundId: string
    await runWithTenant(TENANTS.Coordinator, async () => {
      const ctrl = createController(svc)
      const task = await ctrl.createTask({
        name: 'no-dup-submit',
        modelArch: 'x',
        participantTenantIds: ['ten-store-a'],
        minParticipants: 1,
      })
      await ctrl.activateTask(task.id)
      const round = await ctrl.startRound(task.id, {})
      taskId = task.id
      roundId = round.id
    })
    await runWithTenant(TENANTS.ParticipantA, async () => {
      const ctrl = createController(svc)
      await ctrl.submitGradient(taskId!, {
        roundId: roundId!,
        encryptedGradients: cipher.encrypt([1, 2]),
        sampleCount: 10,
      })
      await assert.rejects(
        () => ctrl.submitGradient(taskId!, {
          roundId: roundId!,
          encryptedGradients: cipher.encrypt([4, 5]),
          sampleCount: 20,
        }),
        /已提交/,
      )
    })
  })
})

// ── 👥HR ──
describe(`${ROLES.HR} 联邦学习 角色测试`, () => {
  it('HR 查看门店参与联邦训练的合规情况（总轮次/当前进度）', async () => {
    const svc = createFreshService()
    await runWithTenant(TENANTS.Coordinator, async () => {
      const ctrl = createController(svc)
      const task = await ctrl.createTask({
        name: 'compliance-audit',
        modelArch: 'audit-v1',
        participantTenantIds: ['ten-store-a', 'ten-store-b'],
        totalRounds: 5,
        minParticipants: 2,
      })
      const t = await ctrl.getTask(task.id)
      assert.equal(t.totalRounds, 5)
      assert.equal(t.currentRound, 0)
      assert.equal(t.consumedEpsilon, 0)
    })
  })

  it('HR 查看联邦任务的隐私预算合规情况', async () => {
    const svc = createFreshService()
    await runWithTenant(TENANTS.Coordinator, async () => {
      const ctrl = createController(svc)
      const task = await ctrl.createTask({
        name: 'privacy-compliance',
        modelArch: 'dp-v1',
        participantTenantIds: ['ten-store-a'],
        privacyBudgetEpsilon: 2.0,
        minParticipants: 1,
      })
      const account = await ctrl.getPrivacy(task.id)
      assert.equal(account.totalEpsilon, 2.0)
      assert.equal(account.consumedEpsilon, 0)
      assert.ok(account.totalDelta > 0)
    })
  })

  it('HR 越权访问其他协调者的隐私数据被拒绝', async () => {
    const svc = createFreshService()
    let taskId: string
    await runWithTenant(TENANTS.Coordinator, async () => {
      const ctrl = createController(svc)
      const task = await ctrl.createTask({
        name: 'private-task',
        modelArch: 'x',
        participantTenantIds: ['ten-store-a'],
      })
      taskId = task.id
    })
    await assert.rejects(
      () => runWithTenant(TENANTS.ParticipantA, async () => {
        const ctrl = createController(svc)
        return ctrl.getPrivacy(taskId!)
      }),
      /不存在/,
    )
  })
})

// ── 🔧安监 ──
describe(`${ROLES.Security} 联邦学习 角色测试`, () => {
  it('安监验证非白名单门店的梯度提交被拦截', async () => {
    const svc = createFreshService()
    let taskId: string, roundId: string
    await runWithTenant(TENANTS.Coordinator, async () => {
      const ctrl = createController(svc)
      const task = await ctrl.createTask({
        name: 'security-whitelist',
        modelArch: 'secure-v1',
        participantTenantIds: ['ten-store-a'],
        minParticipants: 1,
      })
      await ctrl.activateTask(task.id)
      const round = await ctrl.startRound(task.id, {})
      taskId = task.id
      roundId = round.id
    })
    await assert.rejects(
      () => runWithTenant(TENANTS.ParticipantB, async () => {
        const ctrl = createController(svc)
        return ctrl.submitGradient(taskId!, {
          roundId: roundId!,
          encryptedGradients: cipher.encrypt([0.5, 0.5]),
          sampleCount: 10,
        })
      }),
      /白名单/,
    )
  })

  it('安监验证聚合轮次客户端不足时失败（防止数据量不足导致偏差）', async () => {
    const svc = createFreshService()
    let taskId: string, roundId: string
    await runWithTenant(TENANTS.Coordinator, async () => {
      const ctrl = createController(svc)
      const task = await ctrl.createTask({
        name: 'min-clients-check',
        modelArch: 'x',
        participantTenantIds: ['ten-store-a', 'ten-store-b'],
        minParticipants: 3,
      })
      await ctrl.activateTask(task.id)
      const round = await ctrl.startRound(task.id, {})
      taskId = task.id
      roundId = round.id
    })
    // 只提交 1 个，minParticipants=3
    await runWithTenant(TENANTS.ParticipantA, async () => {
      const ctrl = createController(svc)
      await ctrl.submitGradient(taskId!, {
        roundId: roundId!,
        encryptedGradients: cipher.encrypt([1, 2]),
        sampleCount: 10,
      })
    })
    await assert.rejects(
      () => runWithTenant(TENANTS.Coordinator, async () => {
        const ctrl = createController(svc)
        return ctrl.aggregateRound(roundId!)
      }),
      /客户端不足/,
    )
  })

  it('安监验证过期轮次（deadline 过去后）拒绝新提交', async () => {
    const svc = createFreshService()
    let taskId: string, roundId: string
    await runWithTenant(TENANTS.Coordinator, async () => {
      const ctrl = createController(svc)
      const task = await ctrl.createTask({
        name: 'deadline-check',
        modelArch: 'x',
        participantTenantIds: ['ten-store-a'],
        minParticipants: 1,
      })
      await ctrl.activateTask(task.id)
      // 收集截止时间为 1ms —— 极短
      const round = await ctrl.startRound(task.id, { collectionDeadlineMs: 1 })
      taskId = task.id
      roundId = round.id
    })
    // 等 20ms 让截止时间过期
    await new Promise((r) => setTimeout(r, 20))
    await assert.rejects(
      () => runWithTenant(TENANTS.ParticipantA, async () => {
        const ctrl = createController(svc)
        return ctrl.submitGradient(taskId!, {
          roundId: roundId!,
          encryptedGradients: cipher.encrypt([0.1, 0.2]),
          sampleCount: 50,
        })
      }),
      /截止时间/,
    )
  })
})

// ── 🎮导玩员 ──
describe(`${ROLES.Guide} 联邦学习 角色测试`, () => {
  it('导玩员查看自己门店参与联邦训练的任务轮次进度', async () => {
    const svc = createFreshService()
    let taskId: string
    await runWithTenant(TENANTS.Coordinator, async () => {
      const ctrl = createController(svc)
      const task = await ctrl.createTask({
        name: 'game-recommend',
        modelArch: 'dssm-v3',
        participantTenantIds: ['ten-store-a', 'ten-store-b'],
        minParticipants: 2,
        totalRounds: 3,
      })
      await ctrl.activateTask(task.id)
      taskId = task.id
      const r1 = await ctrl.startRound(task.id, {})
      // 模拟第 1 轮完成
      const anySvc = svc as any
      anySvc.tasks.get(task.id).currentRound = 1
      await ctrl.startRound(task.id, {})
    })
    await runWithTenant(TENANTS.ParticipantA, async () => {
      const ctrl = createController(svc)
      const rounds = await ctrl.listRounds(taskId!)
      assert.equal(rounds.items.length, 2)
      assert.equal(rounds.items[0].roundNumber, 1)
      assert.equal(rounds.items[1].roundNumber, 2)
    })
  })

  it('导玩员尝试访问不存在的任务 → NotFound', async () => {
    await runWithTenant(TENANTS.ParticipantA, async () => {
      const svc = createFreshService()
      const ctrl = createController(svc)
      await assert.rejects(
        () => ctrl.getTask('nonexistent-task'),
        /不存在/,
      )
    })
  })
})

// ── 🎯运行专员 ──
describe(`${ROLES.Operations} 联邦学习 角色测试`, () => {
  it('运行专员激活联邦任务并启动第一轮', async () => {
    const svc = createFreshService()
    await runWithTenant(TENANTS.Coordinator, async () => {
      const ctrl = createController(svc)
      const task = await ctrl.createTask({
        name: 'ops-activation',
        modelArch: 'lstm-v2',
        participantTenantIds: ['ten-store-a', 'ten-store-b'],
        minParticipants: 2,
      })
      const activated = await ctrl.activateTask(task.id)
      assert.equal(activated.status, 'active')
      const round = await ctrl.startRound(task.id, {})
      assert.equal(round.status, 'collecting')
      assert.equal(round.roundNumber, 1)
    })
  })

  it('运行专员执行完整一轮联邦聚合（多门店数据）', async () => {
    const svc = createFreshService()
    let taskId: string, roundId: string
    await runWithTenant(TENANTS.Coordinator, async () => {
      const ctrl = createController(svc)
      const task = await ctrl.createTask({
        name: 'full-round-ops',
        modelArch: 'linear-v1',
        participantTenantIds: ['ten-store-a', 'ten-store-b'],
        aggregationMethod: 'fedavg',
        minParticipants: 2,
      })
      await ctrl.activateTask(task.id)
      const round = await ctrl.startRound(task.id, {})
      taskId = task.id
      roundId = round.id
    })
    await runWithTenant(TENANTS.ParticipantA, async () => {
      const ctrl = createController(svc)
      await ctrl.submitGradient(taskId!, {
        roundId: roundId!,
        encryptedGradients: cipher.encrypt([0.1, 0.2]),
        sampleCount: 100,
      })
    })
    await runWithTenant(TENANTS.ParticipantB, async () => {
      const ctrl = createController(svc)
      await ctrl.submitGradient(taskId!, {
        roundId: roundId!,
        encryptedGradients: cipher.encrypt([0.3, 0.4]),
        sampleCount: 200,
      })
    })
    const agg = await runWithTenant(TENANTS.Coordinator, async () => {
      const ctrl = createController(svc)
      return ctrl.aggregateRound(roundId!)
    })
    assert.equal(agg.participantCount, 2)
    assert.equal(agg.totalSamples, 300)
    assert.equal(agg.globalModelVersion, 1)
    assert.ok(agg.epsilonConsumed > 0)
  })

  it('运行专员尝试激活已激活的任务 → BadRequest', async () => {
    const svc = createFreshService()
    await runWithTenant(TENANTS.Coordinator, async () => {
      const ctrl = createController(svc)
      const task = await ctrl.createTask({
        name: 'double-activate',
        modelArch: 'x',
        participantTenantIds: ['ten-store-a'],
      })
      await ctrl.activateTask(task.id)
      await assert.rejects(
        () => ctrl.activateTask(task.id),
        /只能从 draft|paused 启动/,
      )
    })
  })
})

// ── 🤝团建 ──
describe(`${ROLES.Teambuilding} 联邦学习 角色测试`, () => {
  it('团建专员查看各门店在联邦训练中的参与状态', async () => {
    const svc = createFreshService()
    await runWithTenant(TENANTS.Coordinator, async () => {
      const ctrl = createController(svc)
      const task = await ctrl.createTask({
        name: 'team-building-model',
        modelArch: 'svm-v1',
        participantTenantIds: ['ten-store-a', 'ten-store-b'],
        minParticipants: 2,
        totalRounds: 3,
      })
      const t = await ctrl.getTask(task.id)
      assert.equal(t.status, 'draft')
      assert.equal(t.participantTenantIds.length, 2)
      assert.equal(t.currentRound, 0)
    })
  })

  it('团建专员无法启动不是自己协调的任务', async () => {
    const svc = createFreshService()
    let taskId: string
    await runWithTenant(TENANTS.Coordinator, async () => {
      const ctrl = createController(svc)
      const task = await ctrl.createTask({
        name: 'team-only-task',
        modelArch: 'x',
        participantTenantIds: ['ten-store-a'],
      })
      taskId = task.id
    })
    await assert.rejects(
      () => runWithTenant(TENANTS.ParticipantA, async () => {
        const ctrl = createController(svc)
        return ctrl.activateTask(taskId!)
      }),
      /不存在/,
    )
  })

  it('团建专员尝试越权聚合其他门店的联邦轮次 → NotFound', async () => {
    const svc = createFreshService()
    let roundId: string
    await runWithTenant(TENANTS.Coordinator, async () => {
      const ctrl = createController(svc)
      const task = await ctrl.createTask({
        name: 'cross-tenant-agg',
        modelArch: 'x',
        participantTenantIds: ['ten-store-a'],
        minParticipants: 1,
      })
      await ctrl.activateTask(task.id)
      const round = await ctrl.startRound(task.id, {})
      roundId = round.id
    })
    await assert.rejects(
      () => runWithTenant(TENANTS.ParticipantB, async () => {
        const ctrl = createController(svc)
        return ctrl.aggregateRound(roundId!)
      }),
      /不存在/,
    )
  })
})

// ── 📢营销 ──
describe(`${ROLES.Marketing} 联邦学习 角色测试`, () => {
  it('营销专员创建跨门店的销售预测联邦任务', async () => {
    const svc = createFreshService()
    await runWithTenant(TENANTS.Coordinator, async () => {
      const ctrl = createController(svc)
      const task = await ctrl.createTask({
        name: 'cross-store-sales-predict',
        modelArch: 'transformer-v1',
        participantTenantIds: ['ten-store-a', 'ten-store-b'],
        aggregationMethod: 'fedprox',
        totalRounds: 20,
        privacyBudgetEpsilon: 1.0,
        minParticipants: 2,
      })
      assert.equal(task.name, 'cross-store-sales-predict')
      assert.equal(task.aggregationMethod, 'fedprox')
      assert.equal(task.totalRounds, 20)
      assert.equal(task.privacyBudgetEpsilon, 1.0)
    })
  })

  it('营销专员查看联邦训练后的隐私预算消耗', async () => {
    const svc = createFreshService()
    let taskId: string, roundId: string
    await runWithTenant(TENANTS.Coordinator, async () => {
      const ctrl = createController(svc)
      const task = await ctrl.createTask({
        name: 'marketing-budget-check',
        modelArch: 'lr-v1',
        participantTenantIds: ['ten-store-a'],
        minParticipants: 1,
        privacyBudgetEpsilon: 3.0,
        noiseMultiplier: 5.0,
      })
      await ctrl.activateTask(task.id)
      const round = await ctrl.startRound(task.id, {})
      taskId = task.id
      roundId = round.id
    })
    await runWithTenant(TENANTS.ParticipantA, async () => {
      const ctrl = createController(svc)
      await ctrl.submitGradient(taskId!, {
        roundId: roundId!,
        encryptedGradients: cipher.encrypt([0.2, 0.3]),
        sampleCount: 100,
      })
    })
    await runWithTenant(TENANTS.Coordinator, async () => {
      const ctrl = createController(svc)
      const agg = await ctrl.aggregateRound(roundId!)
      assert.ok(agg.epsilonConsumed > 0)
      const account = await ctrl.getPrivacy(taskId!)
      assert.equal(account.totalEpsilon, 3.0)
      assert.ok(account.consumedEpsilon > 0)
      assert.ok(account.consumedEpsilon < 3.0)
    })
  })

  it('营销专员创建含全部可选参数的联邦任务（全配置）', async () => {
    const svc = createFreshService()
    await runWithTenant(TENANTS.Coordinator, async () => {
      const ctrl = createController(svc)
      const task = await ctrl.createTask({
        name: 'full-config-marketing',
        modelArch: 'deepfm-v2',
        participantTenantIds: ['ten-store-a', 'ten-store-b'],
        aggregationMethod: 'scaffold',
        totalRounds: 50,
        privacyBudgetEpsilon: 5.0,
        privacyBudgetDelta: 1e-6,
        minParticipants: 3,
        noiseMultiplier: 2.0,
        maxGradientNorm: 5.0,
      })
      assert.equal(task.name, 'full-config-marketing')
      assert.equal(task.aggregationMethod, 'scaffold')
      assert.equal(task.totalRounds, 50)
      assert.equal(task.privacyBudgetEpsilon, 5.0)
      assert.equal(task.minParticipants, 3)
      assert.equal(task.noiseMultiplier, 2.0)
      assert.equal(task.maxGradientNorm, 5.0)
    })
  })
})
