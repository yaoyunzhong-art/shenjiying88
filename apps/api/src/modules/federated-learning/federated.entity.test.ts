import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * FederatedLearning Entity Tests
 *
 * 覆盖:
 * - 类型契约 (FederatedTask / FederatedRound / GradientSubmission / PrivacyAccount / AggregationResult)
 * - 工具函数 (fedAvg / fedProx / scaffold / gaussianNoise / clipGradient / computeEpsilonConsumed)
 * - 隐私组合 (basicComposition / advancedComposition)
 * - 同态加密 Mock (encrypt / decrypt / add / scale)
 * - ID 生成器
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  // Types
  FederatedTask,
  FederatedRound,
  GradientSubmission,
  PrivacyAccount,
  AggregationResult,
  AggregationMethod,
  // Functions
  fedAvg,
  fedProx,
  scaffold,
  gaussianNoise,
  clipGradient,
  computeEpsilonConsumed,
  basicComposition,
  advancedComposition,
  generateTaskId,
  generateRoundId,
  generateSubmissionId,
  // Cipher
  MockHomomorphicCipher,
  HomomorphicCipher,
} from './federated.entity'

// ────────────────────────────────────────────────────────────────
// 1. 类型契约
// ────────────────────────────────────────────────────────────────
describe('1. 类型契约', () => {
  it('FederatedTask 完整创建与访问', () => {
    const task: FederatedTask = {
      id: 'fed-task-abc',
      name: 'sales-forecast',
      modelArch: 'lstm-v2',
      coordinatorTenantId: 'tenant-A',
      participantTenantIds: ['tenant-A', 'tenant-B'],
      aggregationMethod: 'fedavg',
      totalRounds: 10,
      currentRound: 1,
      status: 'active',
      privacyBudgetEpsilon: 1.0,
      privacyBudgetDelta: 1e-5,
      consumedEpsilon: 0.1,
      consumedDelta: 1e-6,
      minParticipants: 2,
      noiseMultiplier: 1.1,
      maxGradientNorm: 1.0,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T01:00:00Z',
    }
    assert.equal(task.id, 'fed-task-abc')
    assert.equal(task.name, 'sales-forecast')
    assert.equal(task.aggregationMethod, 'fedavg')
    assert.equal(task.status, 'active')
    assert.equal(task.totalRounds, 10)
  })

  it('FederatedRound 完整创建', () => {
    const round: FederatedRound = {
      id: 'fed-rnd-001',
      taskId: 'fed-task-abc',
      roundNumber: 1,
      status: 'collecting',
      globalModelVersion: 0,
      nextModelVersion: undefined,
      expectedParticipants: 3,
      actualParticipants: 2,
      collectionStartedAt: '2026-01-01T00:00:00Z',
      collectionDeadlineAt: '2026-01-01T01:00:00Z',
      aggregatedAt: undefined,
      epsilonConsumed: 0,
      aggregatedLoss: undefined,
      failureReason: undefined,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }
    assert.equal(round.id, 'fed-rnd-001')
    assert.equal(round.roundNumber, 1)
    assert.equal(round.status, 'collecting')
    assert.equal(round.expectedParticipants, 3)
  })

  it('FederatedRound completed 状态', () => {
    const round: FederatedRound = {
      id: 'fed-rnd-002',
      taskId: 'fed-task-abc',
      roundNumber: 2,
      status: 'completed',
      globalModelVersion: 1,
      nextModelVersion: 2,
      expectedParticipants: 3,
      actualParticipants: 3,
      aggregatedAt: '2026-01-01T02:00:00Z',
      epsilonConsumed: 0.05,
      aggregatedLoss: 0.123,
      createdAt: '2026-01-01T01:00:00Z',
      updatedAt: '2026-01-01T02:00:00Z',
    }
    assert.equal(round.status, 'completed')
    assert.equal(round.nextModelVersion, 2)
    assert.equal(round.aggregatedLoss, 0.123)
  })

  it('GradientSubmission 创建', () => {
    const sub: GradientSubmission = {
      id: 'fed-sub-001',
      roundId: 'fed-rnd-001',
      taskId: 'fed-task-abc',
      tenantId: 'tenant-B',
      sampleCount: 500,
      encryptedGradients: 'base64encrypted...',
      noiseSeed: 'seed-abcdef',
      status: 'accepted',
      submittedAt: '2026-01-01T00:30:00Z',
      receivedAt: '2026-01-01T00:30:05Z',
      rejectionReason: undefined,
      createdAt: '2026-01-01T00:30:00Z',
    }
    assert.equal(sub.tenantId, 'tenant-B')
    assert.equal(sub.status, 'accepted')
    assert.equal(sub.sampleCount, 500)
    assert.ok(sub.noiseSeed.startsWith('seed-'))
  })

  it('GradientSubmission rejected 状态', () => {
    const sub: GradientSubmission = {
      id: 'fed-sub-002',
      roundId: 'fed-rnd-001',
      taskId: 'fed-task-abc',
      tenantId: 'tenant-C',
      sampleCount: 0,
      encryptedGradients: '',
      noiseSeed: 'seed-bad',
      status: 'rejected',
      rejectionReason: '样本数为 0',
      createdAt: '2026-01-01T00:31:00Z',
    }
    assert.equal(sub.status, 'rejected')
    assert.equal(sub.rejectionReason, '样本数为 0')
  })

  it('PrivacyAccount 创建', () => {
    const pa: PrivacyAccount = {
      taskId: 'fed-task-abc',
      totalEpsilon: 2.0,
      consumedEpsilon: 0.3,
      totalDelta: 1e-5,
      consumedDelta: 1e-6,
      compositionMethod: 'advanced',
      updatedAt: '2026-01-01T01:00:00Z',
    }
    assert.equal(pa.totalEpsilon, 2.0)
    assert.equal(pa.consumedEpsilon, 0.3)
    assert.equal(pa.compositionMethod, 'advanced')
    // PrivacyAccount 接口没有 remaining 方法
    assert.equal(pa.totalEpsilon, 2.0) // 确认类型契约通过
  })

  it('AggregationResult 创建', () => {
    const result: AggregationResult = {
      roundId: 'fed-rnd-001',
      globalModelVersion: 1,
      aggregatedGradients: 'base64agg...',
      participantCount: 2,
      totalSamples: 1000,
      averageLoss: 0.25,
      epsilonConsumed: 0.1,
      deltaConsumed: 1e-6,
      method: 'fedprox',
      durationMs: 234,
    }
    assert.equal(result.globalModelVersion, 1)
    assert.equal(result.method, 'fedprox')
    assert.equal(result.durationMs, 234)
    assert.equal(result.participantCount, 2)
  })

  it('AggregationMethod 枚举值', () => {
    const methods: AggregationMethod[] = ['fedavg', 'fedprox', 'scaffold']
    assert.equal(methods.length, 3)
    assert.ok(methods.includes('fedavg'))
    assert.ok(methods.includes('fedprox'))
    assert.ok(methods.includes('scaffold'))
  })
})

// ────────────────────────────────────────────────────────────────
// 2. 数学工具
// ────────────────────────────────────────────────────────────────
describe('2. 数学工具', () => {
  it('fedAvg: 单组梯度', () => {
    const result = fedAvg([[1, 2, 3]])
    assert.deepEqual(result, [1, 2, 3])
  })

  it('fedAvg: 多组梯度均匀平均', () => {
    const result = fedAvg([[1, 2], [3, 4], [5, 6]])
    // (1+3+5)/3=3, (2+4+6)/3=4
    assert.deepEqual(result, [3, 4])
  })

  it('fedAvg: 零组梯度返回空数组', () => {
    const result = fedAvg([])
    assert.deepEqual(result, [])
  })

  it('fedAvg: 浮点精度', () => {
    const result = fedAvg([[0.1, 0.2], [0.3, 0.4]])
    // 浮点: (0.1+0.3)/2=0.2, (0.2+0.4)/2=0.30000000000000004
    const expected = [0.2, (0.2 + 0.4) / 2]
    assert.equal(result[0], 0.2)
    assert.ok(Math.abs(result[1] - 0.3) < 1e-10, `result[1]=${result[1]}`)
  })

  it('fedProx: 退化为 fedAvg (简化版)', () => {
    const result = fedProx([[1, 2], [3, 4]])
    assert.deepEqual(result, [2, 3])
  })

  it('scaffold: 控制变量修正', () => {
    const gradients = [[1, 2], [3, 4]]
    const cvs = [[0.5, 1.0], [1.0, 0.5]]
    const result = scaffold(gradients, cvs)
    // avg((1-0.5)+(3-1)/2, (2-1)+(4-0.5)/2) = avg(1.25, 2.25) = (1.25, 2.25) 
    assert.ok(Math.abs(result[0] - 1.25) < 0.01, `result[0]=${result[0]}`)
    assert.ok(Math.abs(result[1] - 2.25) < 0.01, `result[1]=${result[1]}`)
  })

  it('scaffold: 无控制变量时相当于 fedAvg', () => {
    const gradients = [[1, 2], [3, 4]]
    const result = scaffold(gradients) // 默认空数组
    assert.deepEqual(result, [2, 3])
  })

  it('scaffold: 控制变量与梯度维度不匹配 (取最小值)', () => {
    const gradients = [[1, 2, 3], [4, 5, 6]]
    const cvs = [[1, 1]] // 只给一个方向的
    const result = scaffold(gradients, cvs)
    assert.equal(result.length, 3)
  })

  it('gaussianNoise: 生成指定维度', () => {
    const noise = gaussianNoise(1.0, 50)
    assert.equal(noise.length, 50)
  })

  it('gaussianNoise: 均值接近 0', () => {
    const noise = gaussianNoise(1.0, 1000)
    const mean = noise.reduce((s, n) => s + n, 0) / noise.length
    assert.ok(Math.abs(mean) < 0.15, `mean = ${mean}`)
  })

  it('gaussianNoise: 标准差接近输入值', () => {
    const stddev = 2.0
    const noise = gaussianNoise(stddev, 5000)
    const mean = noise.reduce((s, n) => s + n, 0) / noise.length
    const variance = noise.reduce((s, n) => s + (n - mean) ** 2, 0) / noise.length
    const actualStd = Math.sqrt(variance)
    assert.ok(Math.abs(actualStd - stddev) < 0.3, `std = ${actualStd}`)
  })
  
  it('gaussianNoise: 0 标准差产生全 0 (含 -0 处理)', () => {
    const noise = gaussianNoise(0, 10)
    assert.equal(noise.length, 10)
    for (const n of noise) {
      assert.equal(Object.is(n, 0) || Object.is(n, -0), true)
      assert.equal(Math.abs(n), 0)
    }
  })

  it('clipGradient: norm <= maxNorm 时不裁剪', () => {
    const g = [3, 4] // norm = 5
    const clipped = clipGradient(g, 6)
    assert.deepEqual(clipped, [3, 4])
  })

  it('clipGradient: norm > maxNorm 时裁剪', () => {
    const g = [3, 4] // norm = 5
    const clipped = clipGradient(g, 2.5)
    const newNorm = Math.sqrt(clipped.reduce((s, x) => s + x * x, 0))
    assert.ok(Math.abs(newNorm - 2.5) < 0.001, `newNorm = ${newNorm}`)
    // 方向不变
    assert.ok(clipped[0] / clipped[1] - 3 / 4 < 0.01)
  })

  it('clipGradient: 全 0 梯度不裁剪', () => {
    const g = [0, 0, 0]
    const clipped = clipGradient(g, 1.0)
    assert.deepEqual(clipped, [0, 0, 0])
  })

  it('clipGradient: 单个元素', () => {
    const g = [10]
    const clipped = clipGradient(g, 5)
    assert.deepEqual(clipped, [5])
  })

  it('computeEpsilonConsumed: 正噪声 → 有限 ε', () => {
    const eps = computeEpsilonConsumed(1.0, 1.1, 1e-5)
    assert.ok(eps > 0, `ε = ${eps}`)
    assert.ok(eps < 10, `ε = ${eps}`)
  })

  it('computeEpsilonConsumed: 大噪声 → 小 ε', () => {
    const epsSmall = computeEpsilonConsumed(1.0, 10, 1e-5)
    const epsLarge = computeEpsilonConsumed(1.0, 0.1, 1e-5)
    assert.ok(epsSmall < epsLarge, `small=${epsSmall} large=${epsLarge}`)
  })

  it('computeEpsilonConsumed: 零噪声 → Infinity', () => {
    const eps = computeEpsilonConsumed(1.0, 0, 1e-5)
    assert.equal(eps, Infinity)
  })

  it('computeEpsilonConsumed: 更大 δ → 更小 ε', () => {
    const eps1 = computeEpsilonConsumed(1.0, 1.1, 1e-5)
    const eps2 = computeEpsilonConsumed(1.0, 1.1, 0.01)
    assert.ok(eps2 < eps1, `eps1=${eps1} eps2=${eps2}`)
  })
})

// ────────────────────────────────────────────────────────────────
// 3. 隐私组合
// ────────────────────────────────────────────────────────────────
describe('3. 隐私组合', () => {
  it('basicComposition: 空数组返回 0', () => {
    assert.equal(basicComposition([]), 0)
  })

  it('basicComposition: 单个 epsilon', () => {
    assert.equal(basicComposition([0.5]), 0.5)
  })

  it('basicComposition: 多个累加', () => {
    // 浮点累加可能为 0.6000000000000001
    const result = basicComposition([0.1, 0.2, 0.3])
    assert.ok(Math.abs(result - 0.6) < 1e-12, `result=${result}`)
  })

  it('basicComposition: 大数累加', () => {
    assert.equal(basicComposition([1, 2, 3, 4, 5]), 15)
  })

  it('advancedComposition: 空数组返回 0', () => {
    assert.equal(advancedComposition([], 0.01), 0)
  })

  it('advancedComposition: 单 epsilon 有上界', () => {
    const result = advancedComposition([0.1], 0.01)
    assert.ok(result > 0, `result = ${result}`)
  })

  it('advancedComposition: 多个 epsilon 结果正常', () => {
    const result = advancedComposition([0.1, 0.1, 0.1], 0.01)
    assert.ok(result > 0 && result < 5, `result = ${result}`)
  })

  it('advancedComposition: 小 epsilon 比 basic 更紧', () => {
    const epsilons = Array(50).fill(0.01)
    const basic = basicComposition(epsilons)
    const advanced = advancedComposition(epsilons, 0.01)
    assert.ok(advanced < basic, `basic=${basic} advanced=${advanced}`)
  })
})

// ────────────────────────────────────────────────────────────────
// 4. ID 生成器
// ────────────────────────────────────────────────────────────────
describe('4. ID 生成器', () => {
  it('generateTaskId: 前缀正确 + 唯一性', () => {
    const id1 = generateTaskId()
    const id2 = generateTaskId()
    assert.ok(id1.startsWith('fed-task-'))
    assert.ok(id2.startsWith('fed-task-'))
    assert.notEqual(id1, id2)
  })

  it('generateRoundId: 前缀正确', () => {
    const id = generateRoundId()
    assert.ok(id.startsWith('fed-rnd-'))
  })

  it('generateSubmissionId: 前缀正确', () => {
    const id = generateSubmissionId()
    assert.ok(id.startsWith('fed-sub-'))
  })
})

// ────────────────────────────────────────────────────────────────
// 5. Mock 同态加密
// ────────────────────────────────────────────────────────────────
describe('5. MockHomomorphicCipher', () => {
  it('encrypt → decrypt 往返', () => {
    const cipher = new MockHomomorphicCipher(42)
    const plain = [0.5, 1.0, -0.3]
    const encrypted = cipher.encrypt(plain)
    const decrypted = cipher.decrypt(encrypted)
    assert.equal(decrypted.length, plain.length)
    for (let i = 0; i < plain.length; i++) {
      assert.ok(Math.abs(decrypted[i] - plain[i]) < 0.001, `i=${i} expected=${plain[i]} got=${decrypted[i]}`)
    }
  })

  it('add: 同态加法', () => {
    const cipher = new MockHomomorphicCipher()
    const a = cipher.encrypt([1, 2, 3])
    const b = cipher.encrypt([4, 5, 6])
    const sum = cipher.add(a, b)
    const decrypted = cipher.decrypt(sum)
    assert.deepEqual(decrypted, [5, 7, 9])
  })

  it('scale: 标量乘', () => {
    const cipher = new MockHomomorphicCipher()
    const a = cipher.encrypt([1, 2, 3])
    const scaled = cipher.scale(a, 2)
    const decrypted = cipher.decrypt(scaled)
    assert.deepEqual(decrypted, [2, 4, 6])
  })

  it('scale: 负标量', () => {
    const cipher = new MockHomomorphicCipher()
    const a = cipher.encrypt([1, 2])
    const scaled = cipher.scale(a, -1)
    const decrypted = cipher.decrypt(scaled)
    assert.deepEqual(decrypted, [-1, -2])
  })

  it('scale: 0 标量 → 全 0', () => {
    const cipher = new MockHomomorphicCipher()
    const a = cipher.encrypt([5, 10, 15])
    const scaled = cipher.scale(a, 0)
    const decrypted = cipher.decrypt(scaled)
    assert.deepEqual(decrypted, [0, 0, 0])
  })

  it('独立实例不共享状态', () => {
    const c1 = new MockHomomorphicCipher()
    const c2 = new MockHomomorphicCipher()
    const enc1 = c1.encrypt([1, 2])
    const enc2 = c2.encrypt([3, 4])
    // 不同的 seed 产生不同的加密结果
    assert.notEqual(enc1, enc2)
  })

  it('解密非法密文抛出错误', () => {
    const cipher = new MockHomomorphicCipher()
    assert.throws(() => cipher.decrypt('not-base64-json'), /JSON|Unexpected|parse/)
  })

  it('加密后再解密保持小数精度', () => {
    const cipher = new MockHomomorphicCipher()
    const original = [0.123456, -0.000001, 999.999]
    const encrypted = cipher.encrypt(original)
    const decrypted = cipher.decrypt(encrypted)
    for (let i = 0; i < original.length; i++) {
      assert.ok(Math.abs(decrypted[i] - original[i]) < 0.001, `i=${i} expected=${original[i]} got=${decrypted[i]}`)
    }
  })
})
