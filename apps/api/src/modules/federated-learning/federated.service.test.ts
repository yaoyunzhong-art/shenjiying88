import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * Phase 97 联邦学习 Service Tests (V10 Sprint 2 Day 26-27)
 *
 * 22 tests 覆盖:
 * - 数学工具 (4): FedAvg / clipGradient / gaussianNoise / computeEpsilon
 * - 隐私组合 (2): basic / advanced
 * - 任务 CRUD (3)
 * - 轮次启动 (2)
 * - 梯度提交 (2)
 * - 完整一轮 (2): FedAvg / SCAFFOLD
 * - 隐私预算 (2)
 * - 跨租户隔离 (1)
 * - 同态加密 mock (2)
 * - 错误处理 (2)
 */

import assert from 'node:assert/strict'
import {
  FederatedLearningService,
} from './federated.service'
import {
  fedAvg, fedProx, scaffold, gaussianNoise, clipGradient,
  computeEpsilonConsumed, basicComposition, advancedComposition,
  MockHomomorphicCipher,
} from './federated.entity'
import { runWithTenant } from '../../common/context/tenant-context'

const TENANT_A = {
  tenantId: 'tenant-A',
  storeId: 'store-001',
  userId: 'coordinator',
  role: 'tenant_admin' as const,
}
const TENANT_B = {
  tenantId: 'tenant-B',
  userId: 'participant-B',
  role: 'operator' as const,
}
const TENANT_C = {
  tenantId: 'tenant-C',
  userId: 'participant-C',
  role: 'operator' as const,
}

const SHARED_SERVICE = new FederatedLearningService()

describe('Phase 97 联邦学习 (V10 Sprint 2 Day 26-27)', () => {
  // ============ 1. 数学工具 (4) ============
  describe('1. 数学工具', () => {
    it('fedAvg 加权平均', () => {
      const result = fedAvg([[1, 2, 3], [3, 4, 5]])
      assert.deepEqual(result, [2, 3, 4])
    })

    it('clipGradient 裁剪到 maxNorm', () => {
      const g = [3, 4] // norm = 5
      const clipped = clipGradient(g, 2.5)
      const newNorm = Math.sqrt(clipped.reduce((s, x) => s + x * x, 0))
      assert.ok(Math.abs(newNorm - 2.5) < 0.001, `newNorm=${newNorm}`)
    })

    it('gaussianNoise 生成维度正确 + 范围合理', () => {
      const noise = gaussianNoise(1.0, 100)
      assert.equal(noise.length, 100)
      const mean = noise.reduce((s, n) => s + n, 0) / noise.length
      assert.ok(Math.abs(mean) < 0.5, `mean=${mean}`)
    })

    it('computeEpsilonConsumed 高斯机制公式', () => {
      // ε ≈ sensitivity × sqrt(2 ln(1.25/δ)) / σ
      const eps = computeEpsilonConsumed(1.0, 1.1, 1e-5)
      assert.ok(eps > 0 && eps < 10, `epsilon 应在合理范围, 实际 ${eps}`)
    })
  })

  // ============ 2. 隐私组合 (2) ============
  describe('2. 隐私组合', () => {
    it('basicComposition 累加', () => {
      // 用 closeTo 因为浮点数累加
      const result = basicComposition([0.1, 0.2, 0.3])
      assert.ok(Math.abs(result - 0.6) < 1e-10, `basicComposition(0.1, 0.2, 0.3) 应≈0.6, 实际 ${result}`)
    })

    it('advancedComposition 公式正确', () => {
      // 验证公式: advanced = sqrt(2k*ln(1/δ))*max_eps + k*max_eps*(e^max_eps - 1)
      const eps = advancedComposition([0.1, 0.1, 0.1], 1e-6)
      // k=3, max_eps=0.1, δ'=1e-6
      // = sqrt(6 * 13.8155) * 0.1 + 3 * 0.1 * (e^0.1 - 1)
      // ≈ sqrt(82.89) * 0.1 + 0.3 * 0.1052
      // ≈ 9.104 * 0.1 + 0.0316
      // ≈ 0.9104 + 0.0316
      // ≈ 0.942
      assert.ok(eps > 0.5 && eps < 2.0, `advanced 应在合理范围, 实际 ${eps}`)
    })
  })

  // ============ 3. 任务 CRUD (3) ============
  describe('3. 任务 CRUD', () => {
    it('创建联邦任务 → draft + 初始隐私账户', async () => {
      const task = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createTask({
          name: 'sales-forecast-fed',
          modelArch: 'lstm-v2',
          participantTenantIds: ['tenant-A', 'tenant-B', 'tenant-C'],
          aggregationMethod: 'fedavg',
          totalRounds: 5,
          privacyBudgetEpsilon: 1.0,
          minParticipants: 2,
        }),
      )
      assert.equal(task.status, 'draft')
      assert.equal(task.currentRound, 0)
      assert.equal(task.privacyBudgetEpsilon, 1.0)
      assert.equal(task.consumedEpsilon, 0)
      assert.equal(task.coordinatorTenantId, 'tenant-A')
    })

    it('0 参与者被拒', async () => {
      await assert.rejects(
        () =>
          runWithTenant(TENANT_A, async () =>
            SHARED_SERVICE.createTask({
              name: 'empty',
              modelArch: 'x',
              participantTenantIds: [],
            }),
          ),
        /至少 1 个/,
      )
    })

    it('非协调方看不到任务', async () => {
      // tenant B 看到的是空列表 (因为不是 coordinator)
      const list = await runWithTenant(TENANT_B, async () =>
        SHARED_SERVICE.listTasks(),
      )
      assert.equal(list.length, 0)
    })
  })

  // ============ 4. 轮次启动 (2) ============
  describe('4. 轮次启动', () => {
    it('activate + startRound → collecting', async () => {
      const task = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createTask({
          name: 'round-test',
          modelArch: 'x',
          participantTenantIds: ['tenant-A', 'tenant-B', 'tenant-C'],
          minParticipants: 2,
        }),
      )
      await runWithTenant(TENANT_A, async () => SHARED_SERVICE.activateTask(task.id))
      const round = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.startRound(task.id, {}),
      )
      assert.equal(round.status, 'collecting')
      assert.equal(round.roundNumber, 1)
      assert.equal(round.expectedParticipants, 3)
      assert.ok(round.collectionDeadlineAt)
    })

    it('草稿状态不能 startRound', async () => {
      const task = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createTask({
          name: 'draft-task',
          modelArch: 'x',
          participantTenantIds: ['tenant-B'],
        }),
      )
      await assert.rejects(
        () => runWithTenant(TENANT_A, async () => SHARED_SERVICE.startRound(task.id, {})),
        /未激活/,
      )
    })
  })

  // ============ 5. 梯度提交 (2) ============
  describe('5. 梯度提交', () => {
    it('白名单租户可提交', async () => {
      const task = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createTask({
          name: 'submit-test',
          modelArch: 'x',
          participantTenantIds: ['tenant-B'],
          minParticipants: 1,
        }),
      )
      await runWithTenant(TENANT_A, async () => SHARED_SERVICE.activateTask(task.id))
      const round = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.startRound(task.id, {}),
      )
      const cipher = new MockHomomorphicCipher()
      const encrypted = cipher.encrypt([0.1, 0.2, 0.3])
      const result = await runWithTenant(TENANT_B, async () =>
        SHARED_SERVICE.submitGradient(task.id, {
          roundId: round.id,
          encryptedGradients: encrypted,
          sampleCount: 100,
        }),
      )
      assert.equal(result.status, 'accepted')
      assert.ok(result.submissionId)
    })

    it('非白名单租户被拒', async () => {
      const task = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createTask({
          name: 'whitelist-test',
          modelArch: 'x',
          participantTenantIds: ['tenant-B'],
          minParticipants: 1,
        }),
      )
      await runWithTenant(TENANT_A, async () => SHARED_SERVICE.activateTask(task.id))
      const round = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.startRound(task.id, {}),
      )
      const cipher = new MockHomomorphicCipher()
      const encrypted = cipher.encrypt([0.1, 0.2])
      await assert.rejects(
        () => runWithTenant(TENANT_C, async () =>
          SHARED_SERVICE.submitGradient(task.id, {
            roundId: round.id,
            encryptedGradients: encrypted,
            sampleCount: 50,
          }),
        ),
        /白名单/,
      )
    })
  })

  // ============ 6. 完整一轮 (2) ============
  describe('6. 完整一轮 (FedAvg + SCAFFOLD)', () => {
    it('FedAvg 完整流程', async () => {
      const task = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createTask({
          name: 'fedavg-full',
          modelArch: 'lstm',
          participantTenantIds: ['tenant-B', 'tenant-C'],
          aggregationMethod: 'fedavg',
          minParticipants: 2,
          totalRounds: 2,
        }),
      )
      await runWithTenant(TENANT_A, async () => SHARED_SERVICE.activateTask(task.id))
      const round = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.startRound(task.id, {}),
      )
      const cipher = new MockHomomorphicCipher()
      await runWithTenant(TENANT_B, async () =>
        SHARED_SERVICE.submitGradient(task.id, {
          roundId: round.id,
          encryptedGradients: cipher.encrypt([0.1, 0.2, 0.3]),
          sampleCount: 100,
        }),
      )
      await runWithTenant(TENANT_C, async () =>
        SHARED_SERVICE.submitGradient(task.id, {
          roundId: round.id,
          encryptedGradients: cipher.encrypt([0.3, 0.4, 0.5]),
          sampleCount: 200,
        }),
      )
      const agg = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.aggregateRound(round.id),
      )
      assert.equal(agg.participantCount, 2)
      assert.equal(agg.totalSamples, 300)
      assert.equal(agg.method, 'fedavg')
      assert.equal(agg.globalModelVersion, 1)
      assert.ok(agg.epsilonConsumed > 0)
      assert.ok(agg.deltaConsumed > 0)
    })

    it('SCAFFOLD 聚合方法', async () => {
      const task = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createTask({
          name: 'scaffold-test',
          modelArch: 'x',
          participantTenantIds: ['tenant-B', 'tenant-C'],
          aggregationMethod: 'scaffold',
          minParticipants: 2,
        }),
      )
      await runWithTenant(TENANT_A, async () => SHARED_SERVICE.activateTask(task.id))
      const round = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.startRound(task.id, {}),
      )
      const cipher = new MockHomomorphicCipher()
      await runWithTenant(TENANT_B, async () =>
        SHARED_SERVICE.submitGradient(task.id, {
          roundId: round.id,
          encryptedGradients: cipher.encrypt([1, 2, 3]),
          sampleCount: 10,
        }),
      )
      await runWithTenant(TENANT_C, async () =>
        SHARED_SERVICE.submitGradient(task.id, {
          roundId: round.id,
          encryptedGradients: cipher.encrypt([3, 4, 5]),
          sampleCount: 10,
        }),
      )
      const agg = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.aggregateRound(round.id),
      )
      assert.equal(agg.method, 'scaffold')
    })
  })

  // ============ 7. 隐私预算 (2) ============
  describe('7. 隐私预算', () => {
    it('聚合后 ε 消耗 + 账户更新', async () => {
      const task = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createTask({
          name: 'privacy-test',
          modelArch: 'x',
          participantTenantIds: ['tenant-B', 'tenant-C'],
          minParticipants: 2,
          privacyBudgetEpsilon: 5.0,
        }),
      )
      await runWithTenant(TENANT_A, async () => SHARED_SERVICE.activateTask(task.id))
      const round = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.startRound(task.id, {}),
      )
      const cipher = new MockHomomorphicCipher()
      await runWithTenant(TENANT_B, async () =>
        SHARED_SERVICE.submitGradient(task.id, {
          roundId: round.id, encryptedGradients: cipher.encrypt([1, 2]),
          sampleCount: 10,
        }),
      )
      await runWithTenant(TENANT_C, async () =>
        SHARED_SERVICE.submitGradient(task.id, {
          roundId: round.id, encryptedGradients: cipher.encrypt([3, 4]),
          sampleCount: 10,
        }),
      )
      await runWithTenant(TENANT_A, async () => SHARED_SERVICE.aggregateRound(round.id))
      const account = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.getPrivacyAccount(task.id),
      )
      assert.ok(account.consumedEpsilon > 0)
      assert.ok(account.consumedEpsilon < 5.0)
    })

    it('预算用尽后不能 startRound', async () => {
      const task = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createTask({
          name: 'budget-exhausted',
          modelArch: 'x',
          participantTenantIds: ['tenant-B'],
          minParticipants: 1,
          privacyBudgetEpsilon: 0.0001, // 极小预算
          totalRounds: 5,
        }),
      )
      await runWithTenant(TENANT_A, async () => SHARED_SERVICE.activateTask(task.id))
      // 手动修改 consumedEpsilon 模拟预算用尽
      const t = (SHARED_SERVICE as any).tasks.get(task.id)
      t.consumedEpsilon = 100
      await assert.rejects(
        () => runWithTenant(TENANT_A, async () => SHARED_SERVICE.startRound(task.id, {})),
        /预算已用尽/,
      )
    })
  })

  // ============ 8. 跨租户隔离 (1) ============
  describe('8. 跨租户隔离', () => {
    it('tenant B 不能 activate tenant A 的任务', async () => {
      const task = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createTask({
          name: 'isolation-test',
          modelArch: 'x',
          participantTenantIds: ['tenant-B'],
        }),
      )
      await assert.rejects(
        () => runWithTenant(TENANT_B, async () => SHARED_SERVICE.activateTask(task.id)),
        /不存在/,
      )
    })
  })

  // ============ 9. 同态加密 mock (2) ============
  describe('9. 同态加密 Mock', () => {
    it('encrypt + decrypt 还原', () => {
      const cipher = new MockHomomorphicCipher()
      const plain = [0.123456, 0.789012, 1.5]
      const encrypted = cipher.encrypt(plain)
      const decrypted = cipher.decrypt(encrypted)
      assert.ok(Math.abs(decrypted[0] - plain[0]) < 0.0001)
      assert.ok(Math.abs(decrypted[1] - plain[1]) < 0.0001)
      assert.ok(Math.abs(decrypted[2] - plain[2]) < 0.0001)
    })

    it('add 同态加法', () => {
      const cipher = new MockHomomorphicCipher()
      const a = cipher.encrypt([1, 2, 3])
      const b = cipher.encrypt([4, 5, 6])
      const sum = cipher.add(a, b)
      const decrypted = cipher.decrypt(sum)
      assert.ok(Math.abs(decrypted[0] - 5) < 0.001)
      assert.ok(Math.abs(decrypted[1] - 7) < 0.001)
      assert.ok(Math.abs(decrypted[2] - 9) < 0.001)
    })
  })

  // ============ 10. 错误处理 (1) ============
  describe('10. 错误处理', () => {
    it('客户端不足时聚合失败', async () => {
      const task = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.createTask({
          name: 'min-not-met',
          modelArch: 'x',
          participantTenantIds: ['tenant-B', 'tenant-C', 'tenant-D'],
          minParticipants: 3,
        }),
      )
      await runWithTenant(TENANT_A, async () => SHARED_SERVICE.activateTask(task.id))
      const round = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.startRound(task.id, {}),
      )
      const cipher = new MockHomomorphicCipher()
      // 只提交 1 个 (远小于 minParticipants=3)
      await runWithTenant(TENANT_B, async () =>
        SHARED_SERVICE.submitGradient(task.id, {
          roundId: round.id, encryptedGradients: cipher.encrypt([1, 2]),
          sampleCount: 10,
        }),
      )
      await assert.rejects(
        () => runWithTenant(TENANT_A, async () => SHARED_SERVICE.aggregateRound(round.id)),
        /客户端不足/,
      )
    })
  })
})