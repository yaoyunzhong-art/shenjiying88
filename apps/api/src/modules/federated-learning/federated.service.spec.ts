/**
 * federated.service.spec.ts — 联邦学习 Service 深层单元测试
 *
 * 覆盖:
 *  - 聚合算法: FedAvg / FedProx / SCAFFOLD
 *  - DP 噪声: gaussianNoise / clipGradient / computeEpsilonConsumed
 *  - 隐私组合: basicComposition / advancedComposition
 *  - MockHomomorphicCipher: 加密/解密/同态加法/标量乘
 *  - 模拟 FederatedLearningService: 任务 CRUD / 轮次 / 梯度提交 / 聚合
 *  - 正例/反例/边界 ≥ 18 项
 *
 * 全部内联 mock，不依赖 NestJS DI。
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type {
  AggregationMethod,
  RoundStatus,
  SubmissionStatus,
  FederatedTask,
  FederatedRound,
  GradientSubmission,
  PrivacyAccount,
  MockHomomorphicCipher,
  HomomorphicCipher,
} from './federated.entity'

// ═══════════════════════════════════════════════════════════════
// 枚举常量
// ═══════════════════════════════════════════════════════════════

const AGGREGATION_METHODS: AggregationMethod[] = ['fedavg', 'fedprox', 'scaffold']

// ═══════════════════════════════════════════════════════════════
// mock 数据工厂
// ═══════════════════════════════════════════════════════════════

function mockGradient(length: number = 8): number[] {
  return Array.from({ length }, () => Math.random() * 2 - 1)
}

function mockGradients(count: number = 3, dim: number = 8): number[][] {
  return Array.from({ length: count }, () => mockGradient(dim))
}

function mockTask(overrides?: Partial<FederatedTask>): FederatedTask {
  return {
    id: `fed-task-test-${Math.random().toString(36).slice(2, 8)}`,
    name: '测试联邦任务',
    modelArch: 'test-model-v1',
    coordinatorTenantId: 'tenant-coord',
    participantTenantIds: ['tenant-a', 'tenant-b', 'tenant-c'],
    aggregationMethod: 'fedavg',
    totalRounds: 10,
    currentRound: 0,
    status: 'draft',
    privacyBudgetEpsilon: 1.0,
    privacyBudgetDelta: 1e-5,
    consumedEpsilon: 0,
    consumedDelta: 0,
    minParticipants: 2,
    noiseMultiplier: 1.1,
    maxGradientNorm: 1.0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

function mockRound(overrides?: Partial<FederatedRound>): FederatedRound {
  return {
    id: `fed-rnd-test-${Math.random().toString(36).slice(2, 8)}`,
    taskId: 'task-test',
    roundNumber: 1,
    status: 'collecting',
    globalModelVersion: 0,
    expectedParticipants: 3,
    actualParticipants: 0,
    epsilonConsumed: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

// ═══════════════════════════════════════════════════════════════
// 内联业务逻辑（从 federated.entity.ts 提取）
// ═══════════════════════════════════════════════════════════════

function inlineFedAvg(gradients: number[][]): number[] {
  if (gradients.length === 0) return []
  const dim = gradients[0].length
  const avg = new Array(dim).fill(0)
  for (const g of gradients) {
    for (let i = 0; i < dim; i++) avg[i] += g[i]
  }
  for (let i = 0; i < dim; i++) avg[i] /= gradients.length
  return avg
}

function inlineFedProx(gradients: number[][]): number[] {
  return inlineFedAvg(gradients)
}

function inlineScaffold(gradients: number[][], controlVariates: number[][] = []): number[] {
  if (gradients.length === 0) return []
  const dim = gradients[0].length
  const avg = new Array(dim).fill(0)
  for (let i = 0; i < gradients.length; i++) {
    const g = gradients[i]
    const cv = controlVariates[i] ?? new Array(dim).fill(0)
    for (let j = 0; j < dim; j++) avg[j] += g[j] - cv[j]
  }
  for (let j = 0; j < dim; j++) avg[j] /= gradients.length
  return avg
}

function inlineGaussianNoise(stddev: number, dim: number): number[] {
  const noise: number[] = []
  for (let i = 0; i < dim; i++) {
    const u1 = Math.random()
    const u2 = Math.random()
    const z = Math.sqrt(-2 * Math.log(u1 || 0.0001)) * Math.cos(2 * Math.PI * u2)
    noise.push(z * stddev)
  }
  return noise
}

function inlineClipGradient(gradients: number[], maxNorm: number): number[] {
  const norm = Math.sqrt(gradients.reduce((s, g) => s + g * g, 0))
  if (norm <= maxNorm) return gradients
  const scale = maxNorm / norm
  return gradients.map((g) => g * scale)
}

function inlineComputeEpsilonConsumed(sensitivity: number, noiseStddev: number, delta: number): number {
  if (noiseStddev <= 0) return Infinity
  return (sensitivity * Math.sqrt(2 * Math.log(1.25 / delta))) / noiseStddev
}

function inlineBasicComposition(epsilons: number[]): number {
  return epsilons.reduce((s, e) => s + e, 0)
}

function inlineAdvancedComposition(epsilons: number[], deltaPrime: number): number {
  if (epsilons.length === 0) return 0
  const k = epsilons.length
  const maxEpsilon = Math.max(...epsilons)
  const sqrtTerm = Math.sqrt(2 * k * Math.log(1 / deltaPrime))
  const expTerm = k * maxEpsilon * (Math.exp(maxEpsilon) - 1)
  return sqrtTerm * maxEpsilon + expTerm
}

// ═══════════════════════════════════════════════════════════════
// MockHomomorphicCipher 内联实现
// ═══════════════════════════════════════════════════════════════

class InlineMockCipher {
  private seed: number
  constructor(seed = 42) { this.seed = seed }

  encrypt(plaintext: number[]): string {
    const quantized = plaintext.map(p => Math.round(p * 1e6))
    return Buffer.from(JSON.stringify({ v: quantized, s: this.seed, t: Date.now() })).toString('base64')
  }

  decrypt(ciphertext: string): number[] {
    const payload = JSON.parse(Buffer.from(ciphertext, 'base64').toString('utf-8'))
    return payload.v.map((q: number) => q / 1e6)
  }

  add(a: string, b: string): string {
    const va = JSON.parse(Buffer.from(a, 'base64').toString('utf-8')).v
    const vb = JSON.parse(Buffer.from(b, 'base64').toString('utf-8')).v
    const sum = va.map((x: number, i: number) => x + vb[i])
    return Buffer.from(JSON.stringify({ v: sum, s: this.seed })).toString('base64')
  }

  scale(ciphertext: string, scalar: number): string {
    const payload = JSON.parse(Buffer.from(ciphertext, 'base64').toString('utf-8'))
    const scaled = payload.v.map((x: number) => Math.round(x * scalar))
    return Buffer.from(JSON.stringify({ v: scaled, s: this.seed })).toString('base64')
  }

  /** 生成随机梯度用于测试 */
  randomGradient(dim: number): number[] {
    return Array.from({ length: dim }, () => Math.random() * 2 - 1)
  }
}

// ═══════════════════════════════════════════════════════════════
// 聚合算法测试
// ═══════════════════════════════════════════════════════════════

describe('聚合算法 | fedAvg', () => {

  it('正例: 单梯度返回自身', () => {
    const g = [[1, 2, 3]]
    expect(inlineFedAvg(g)).toEqual([1, 2, 3])
  })

  it('正例: 两梯度平均值', () => {
    const gs = [[1, 2, 3], [3, 4, 5]]
    expect(inlineFedAvg(gs)).toEqual([2, 3, 4])
  })

  it('正例: 三梯度平均值', () => {
    const gs = [[0, 0], [2, 2], [4, 4]]
    expect(inlineFedAvg(gs)).toEqual([2, 2])
  })

  it('反例: 空数组返回空数组', () => {
    expect(inlineFedAvg([])).toEqual([])
  })

  it('边界: 大维度 (128) 正确', () => {
    const dim = 128
    const gs = Array.from({ length: 5 }, () => Array.from({ length: dim }, (_, i) => i))
    const avg = inlineFedAvg(gs)
    expect(avg).toHaveLength(dim)
    for (let i = 0; i < dim; i++) {
      expect(avg[i]).toBeCloseTo(i, 5)
    }
  })
})

describe('聚合算法 | fedProx', () => {
  it('正例: 与 fedAvg 一致', () => {
    const gs = [[1, 2], [3, 4]]
    expect(inlineFedProx(gs)).toEqual(inlineFedAvg(gs))
  })
})

describe('聚合算法 | scaffold', () => {
  it('正例: 无控制变量退化为 fedAvg', () => {
    const gs = [[1, 2], [3, 4]]
    expect(inlineScaffold(gs)).toEqual([2, 3])
  })

  it('正例: 有控制变量修正', () => {
    const gs = [[5, 5], [5, 5]]
    const cvs = [[1, 1], [1, 1]]
    const result = inlineScaffold(gs, cvs)
    // avg = ((5-1)+(5-1))/2 = 4
    expect(result).toEqual([4, 4])
  })

  it('边界: 控制变量不足用 0 补齐', () => {
    const gs = [[10, 10]]
    const cvs: number[][] = [] // no control variate
    const result = inlineScaffold(gs, cvs)
    // avg = (10 - 0) / 1 = 10
    expect(result).toEqual([10, 10])
  })

  it('反例: 空梯度返回空', () => {
    expect(inlineScaffold([])).toEqual([])
  })
})

// ═══════════════════════════════════════════════════════════════
// DP 工具测试
// ═══════════════════════════════════════════════════════════════

describe('DP | clipGradient', () => {
  it('正例: norm <= max 不裁剪', () => {
    const g = [0.3, 0.4]
    const clipped = inlineClipGradient(g, 1.0)
    expect(clipped).toEqual(g)
  })

  it('正例: norm > max 按比例缩放', () => {
    const g = [3, 4] // norm = 5
    const clipped = inlineClipGradient(g, 2)
    // scale = 2/5 = 0.4 → [1.2, 1.6]
    expect(clipped[0]).toBeCloseTo(1.2, 5)
    expect(clipped[1]).toBeCloseTo(1.6, 5)
  })

  it('边界: 零向量', () => {
    expect(inlineClipGradient([0, 0, 0], 1.0)).toEqual([0, 0, 0])
  })

  it('边界: maxNorm 极小', () => {
    const g = [10, 0]
    const clipped = inlineClipGradient(g, 1)
    const norm = Math.sqrt(clipped[0] ** 2 + clipped[1] ** 2)
    expect(norm).toBeCloseTo(1, 5)
  })
})

describe('DP | gaussianNoise', () => {
  it('正例: 返回正确维度', () => {
    const noise = inlineGaussianNoise(1.0, 5)
    expect(noise).toHaveLength(5)
  })

  it('正例: 噪声均值为 0 附近', () => {
    const noise = inlineGaussianNoise(1.0, 1000)
    const mean = noise.reduce((s, v) => s + v, 0) / noise.length
    expect(Math.abs(mean)).toBeLessThan(0.2)
  })

  it('正例: 大 stddev 产生更大幅度', () => {
    const n1 = inlineGaussianNoise(0.1, 100)
    const n2 = inlineGaussianNoise(10, 100)
    const std1 = Math.sqrt(n1.reduce((s, v) => s + v * v, 0) / n1.length)
    const std2 = Math.sqrt(n2.reduce((s, v) => s + v * v, 0) / n2.length)
    expect(std2).toBeGreaterThan(std1)
  })

  it('边界: dim=1 不抛错', () => {
    expect(() => inlineGaussianNoise(1, 1)).not.toThrow()
  })

  it('边界: stddev=0 返回全 0（近似）', () => {
    const noise = inlineGaussianNoise(0, 5)
    expect(noise).toHaveLength(5)
    // Box-Muller with stddev=0 => z * 0 = 0
    const allZero = noise.every(v => v === 0)
    expect(allZero).toBe(true)
  })
})

describe('DP | computeEpsilonConsumed', () => {
  it('正例: 标准参数计算正 epsilon', () => {
    const eps = inlineComputeEpsilonConsumed(1.0, 1.1, 1e-5)
    expect(eps).toBeGreaterThan(0)
    expect(eps).toBeLessThan(10)
  })

  it('正例: 更大的噪声 → 更小的 epsilon', () => {
    const eps1 = inlineComputeEpsilonConsumed(1.0, 0.5, 1e-5)
    const eps2 = inlineComputeEpsilonConsumed(1.0, 2.0, 1e-5)
    expect(eps2).toBeLessThan(eps1)
  })

  it('反例: noiseStddev <= 0 返回 Infinity', () => {
    expect(inlineComputeEpsilonConsumed(1.0, 0, 1e-5)).toBe(Infinity)
    expect(inlineComputeEpsilonConsumed(1.0, -1, 1e-5)).toBe(Infinity)
  })
})

describe('DP | 隐私组合', () => {
  it('正例: basicComposition 求和', () => {
    expect(inlineBasicComposition([0.1, 0.2, 0.3])).toBeCloseTo(0.6, 10)
  })

  it('边界: 空数组和为 0', () => {
    expect(inlineBasicComposition([])).toBe(0)
  })

  it('正例: advancedComposition 返回有限值', () => {
    const adv = inlineAdvancedComposition([0.1, 0.2], 1e-5)
    expect(adv).toBeGreaterThan(0)
    expect(adv).toBeLessThan(Infinity)
  })

  it('边界: advancedComposition 空数组返回 0', () => {
    expect(inlineAdvancedComposition([], 1e-5)).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════
// MockHomomorphicCipher 测试
// ═══════════════════════════════════════════════════════════════

describe('MockHomomorphicCipher', () => {
  let cipher: InlineMockCipher

  beforeEach(() => {
    cipher = new InlineMockCipher(42)
  })

  it('正例: encrypt/decrypt 往返一致', () => {
    const original = [0.5, -0.3, 0.1]
    const encrypted = cipher.encrypt(original)
    const decrypted = cipher.decrypt(encrypted)
    for (let i = 0; i < original.length; i++) {
      expect(decrypted[i]).toBeCloseTo(original[i], 4)
    }
  })

  it('正例: 加密结果 base64', () => {
    const enc = cipher.encrypt([1, 2, 3])
    expect(() => Buffer.from(enc, 'base64')).not.toThrow()
  })

  it('正例: 同态加法 E(a)+E(b) = E(a+b)', () => {
    const a = [1, 2, 3]
    const b = [4, 5, 6]
    const ea = cipher.encrypt(a)
    const eb = cipher.encrypt(b)
    const esum = cipher.add(ea, eb)
    const sum = cipher.decrypt(esum)
    expect(sum[0]).toBeCloseTo(5, 4)
    expect(sum[1]).toBeCloseTo(7, 4)
    expect(sum[2]).toBeCloseTo(9, 4)
  })

  it('正例: 同态标量乘 k×E(a) = E(k×a)', () => {
    const a = [2, 4, 6]
    const ea = cipher.encrypt(a)
    const esc = cipher.scale(ea, 0.5)
    const dec = cipher.decrypt(esc)
    expect(dec[0]).toBeCloseTo(1, 4)
    expect(dec[1]).toBeCloseTo(2, 4)
    expect(dec[2]).toBeCloseTo(3, 4)
  })

  it('边界: 加密空数组', () => {
    const enc = cipher.encrypt([])
    const dec = cipher.decrypt(enc)
    expect(dec).toEqual([])
  })

  it('边界: 负值加密解密', () => {
    const original = [-100, -0.001, 0]
    const dec = cipher.decrypt(cipher.encrypt(original))
    for (let i = 0; i < original.length; i++) {
      expect(dec[i]).toBeCloseTo(original[i], 3)
    }
  })
})

// ═══════════════════════════════════════════════════════════════
// 模拟 FederatedLearningService
// ═══════════════════════════════════════════════════════════════

class MockFederatedService {
  tasks = new Map<string, FederatedTask>()
  rounds = new Map<string, FederatedRound>()
  submissions = new Map<string, GradientSubmission>()
  submissionsByRound = new Map<string, Set<string>>()
  privacyAccounts = new Map<string, PrivacyAccount>()
  modelVersions = new Map<string, number>()
  cipher = new InlineMockCipher(42)
  currentTenantId = 'tenant-coord'

  // ── Helper ──

  private generateId(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`
  }

  // ── 任务 CRUD ──

  createTask(overrides?: Partial<FederatedTask>): FederatedTask {
    const task: FederatedTask = mockTask({
      participantTenantIds: ['tenant-a', 'tenant-b'],
      ...overrides,
    })
    this.tasks.set(task.id, task)
    this.privacyAccounts.set(task.id, {
      taskId: task.id,
      totalEpsilon: task.privacyBudgetEpsilon,
      consumedEpsilon: 0,
      totalDelta: task.privacyBudgetDelta,
      consumedDelta: 0,
      compositionMethod: 'basic',
      updatedAt: new Date().toISOString(),
    })
    this.modelVersions.set(task.id, 0)
    return task
  }

  getTask(id: string): FederatedTask | null {
    const t = this.tasks.get(id)
    if (!t || t.coordinatorTenantId !== this.currentTenantId) return null
    return t
  }

  activateTask(id: string): FederatedTask | null {
    const t = this.tasks.get(id)
    if (!t || t.coordinatorTenantId !== this.currentTenantId) return null
    if (t.status !== 'draft' && t.status !== 'paused') return null
    t.status = 'active'
    return t
  }

  // ── 轮次 ──

  startRound(taskId: string, deadlineMs: number = 3600000): FederatedRound | null {
    const task = this.tasks.get(taskId)
    if (!task || task.coordinatorTenantId !== this.currentTenantId) return null
    if (task.status !== 'active') return null
    if (task.currentRound >= task.totalRounds) return null
    if (task.consumedEpsilon >= task.privacyBudgetEpsilon) return null

    const nextRoundNum = task.currentRound + 1
    const round: FederatedRound = {
      id: this.generateId('fed-rnd'),
      taskId,
      roundNumber: nextRoundNum,
      status: 'collecting',
      globalModelVersion: this.modelVersions.get(taskId) ?? 0,
      expectedParticipants: task.participantTenantIds.length,
      actualParticipants: 0,
      epsilonConsumed: 0,
      collectionStartedAt: new Date().toISOString(),
      collectionDeadlineAt: new Date(Date.now() + deadlineMs).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.rounds.set(round.id, round)
    task.currentRound = nextRoundNum
    return round
  }

  // ── 梯度提交 ──

  submitGradient(taskId: string, roundId: string, tenantId: string, sampleCount: number): { submissionId: string; status: SubmissionStatus } | { error: string } {
    const task = this.tasks.get(taskId)
    if (!task) return { error: 'task not found' }
    if (!task.participantTenantIds.includes(tenantId)) return { error: 'forbidden' }
    const round = this.rounds.get(roundId)
    if (!round || round.taskId !== taskId) return { error: 'round not found' }
    if (round.status !== 'collecting') return { error: 'not collecting' }

    const dim = 8
    const grad = this.cipher.randomGradient(dim)
    const encrypted = this.cipher.encrypt(grad)
    const sub: GradientSubmission = {
      id: this.generateId('fed-sub'),
      roundId,
      taskId,
      tenantId,
      sampleCount,
      encryptedGradients: encrypted,
      noiseSeed: `seed-${Math.random().toString(36).slice(0, 8)}`,
      status: 'accepted' as SubmissionStatus,
      submittedAt: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
    this.submissions.set(sub.id, sub)
    if (!this.submissionsByRound.has(round.id)) this.submissionsByRound.set(round.id, new Set())
    this.submissionsByRound.get(round.id)!.add(sub.id)
    round.actualParticipants++
    return { submissionId: sub.id, status: sub.status }
  }

  // ── 聚合 ──

  aggregateRound(roundId: string): {
    success: boolean
    globalModelVersion?: number
    participantCount?: number
    epsilonConsumed?: number
    error?: string
  } {
    const round = this.rounds.get(roundId)
    if (!round) return { success: false, error: 'round not found' }
    const task = this.tasks.get(round.taskId)
    if (!task) return { success: false, error: 'task not found' }
    if (round.status !== 'collecting') return { success: false, error: 'not collecting' }
    if (round.actualParticipants < task.minParticipants) {
      round.status = 'failed'
      round.failureReason = `客户端不足 (${round.actualParticipants}/${task.minParticipants})`
      return { success: false, error: round.failureReason }
    }

    round.status = 'aggregating'

    const subIds = this.submissionsByRound.get(roundId) ?? new Set()
    const decrypted: number[][] = []
    let totalSamples = 0
    for (const id of subIds) {
      const sub = this.submissions.get(id)
      if (!sub || sub.status !== 'accepted') continue
      try {
        const grad = this.cipher.decrypt(sub.encryptedGradients)
        const clipped = inlineClipGradient(grad, task.maxGradientNorm)
        decrypted.push(clipped)
        totalSamples += sub.sampleCount
      } catch { /* skip */ }
    }

    if (decrypted.length === 0) {
      round.status = 'failed'
      round.failureReason = '无有效梯度'
      return { success: false, error: round.failureReason }
    }

    let agg: number[]
    if (task.aggregationMethod === 'fedprox') agg = inlineFedProx(decrypted)
    else if (task.aggregationMethod === 'scaffold') agg = inlineScaffold(decrypted)
    else agg = inlineFedAvg(decrypted)

    const noise = inlineGaussianNoise(task.noiseMultiplier, agg.length)
    agg = agg.map((g, i) => g + noise[i])

    const delta = task.privacyBudgetDelta / task.totalRounds
    const eps = inlineComputeEpsilonConsumed(task.maxGradientNorm, task.noiseMultiplier, delta)
    round.epsilonConsumed = eps

    const account = this.privacyAccounts.get(task.id)
    if (account) {
      account.consumedEpsilon += eps
      task.consumedEpsilon = account.consumedEpsilon
    }

    round.nextModelVersion = round.globalModelVersion + 1
    round.aggregatedAt = new Date().toISOString()
    round.status = 'completed'
    this.modelVersions.set(task.id, round.nextModelVersion!)

    if (task.currentRound >= task.totalRounds) task.status = 'completed'

    return {
      success: true,
      globalModelVersion: round.nextModelVersion!,
      participantCount: decrypted.length,
      epsilonConsumed: eps,
    }
  }

  // ── 隐私预算 ──

  getPrivacyAccount(taskId: string): PrivacyAccount | null {
    const task = this.tasks.get(taskId)
    if (!task || task.coordinatorTenantId !== this.currentTenantId) return null
    return this.privacyAccounts.get(taskId) ?? null
  }
}

// ═══════════════════════════════════════════════════════════════
// 模拟 FederatedLearningService 集成测试
// ═══════════════════════════════════════════════════════════════

describe('FederatedLearningService (Mock)', () => {
  let svc: MockFederatedService

  beforeEach(() => {
    svc = new MockFederatedService()
  })

  it('正例: createTask 返回任务并初始化隐私账户', () => {
    const task = svc.createTask()
    expect(task.id).toMatch(/^fed-task-/)
    expect(task.status).toBe('draft')
    const account = svc.privacyAccounts.get(task.id)
    expect(account).toBeDefined()
    expect(account!.totalEpsilon).toBe(1.0)
  })

  it('正例: activateTask 从 draft → active', () => {
    const task = svc.createTask()
    svc.activateTask(task.id)
    expect(svc.tasks.get(task.id)!.status).toBe('active')
  })

  it('反例: activateTask 不存在的任务返回 null', () => {
    expect(svc.activateTask('nonexistent')).toBeNull()
  })

  it('正例: startRound 创建收集阶段轮次', () => {
    const task = svc.createTask()
    svc.activateTask(task.id)
    const round = svc.startRound(task.id)
    expect(round).not.toBeNull()
    expect(round!.status).toBe('collecting')
    expect(round!.roundNumber).toBe(1)
    expect(round!.expectedParticipants).toBe(2)
  })

  it('反例: startRound 未激活任务返回 null', () => {
    const task = svc.createTask()
    expect(svc.startRound(task.id)).toBeNull()
  })

  it('反例: startRound 已耗尽预算返回 null', () => {
    const task = svc.createTask({ consumedEpsilon: 1.0, privacyBudgetEpsilon: 1.0 })
    svc.activateTask(task.id)
    expect(svc.startRound(task.id)).toBeNull()
  })

  it('正例: submitGradient 提交成功', () => {
    const task = svc.createTask()
    svc.activateTask(task.id)
    const round = svc.startRound(task.id)!
    const result = svc.submitGradient(task.id, round.id, 'tenant-a', 100)
    expect('submissionId' in result).toBe(true)
    if ('submissionId' in result) {
      expect(result.submissionId).toMatch(/^fed-sub-/)
    }
  })

  it('反例: submitGradient 不在白名单租户', () => {
    const task = svc.createTask()
    svc.activateTask(task.id)
    const round = svc.startRound(task.id)!
    const result = svc.submitGradient(task.id, round.id, 'unknown-tenant', 50)
    expect('error' in result).toBe(true)
    if ('error' in result) expect(result.error).toBe('forbidden')
  })

  it('反例: submitGradient 不存在的轮次', () => {
    const task = svc.createTask()
    svc.activateTask(task.id)
    const result = svc.submitGradient(task.id, 'bad-round', 'tenant-a', 50)
    expect('error' in result).toBe(true)
  })

  it('正例: aggregateRound 成功聚合', () => {
    const task = svc.createTask()
    svc.activateTask(task.id)
    const round = svc.startRound(task.id)!
    svc.submitGradient(task.id, round.id, 'tenant-a', 100)
    svc.submitGradient(task.id, round.id, 'tenant-b', 200)
    const result = svc.aggregateRound(round.id)
    expect(result.success).toBe(true)
    expect(result.globalModelVersion).toBe(1)
    expect(result.participantCount).toBe(2)
  })

  it('反例: aggregateRound 客户端不足', () => {
    const task = svc.createTask({ minParticipants: 3 })
    svc.activateTask(task.id)
    const round = svc.startRound(task.id)!
    svc.submitGradient(task.id, round.id, 'tenant-a', 100)
    // 只提交了 1 个, minParticipants=3
    const result = svc.aggregateRound(round.id)
    expect(result.success).toBe(false)
    if ('error' in result) expect(result.error).toContain('客户端不足')
  })

  it('反例: aggregateRound 不存在的轮次', () => {
    const result = svc.aggregateRound('nonexistent')
    expect(result.success).toBe(false)
  })

  it('正例: getPrivacyAccount 返回有效账户', () => {
    const task = svc.createTask()
    const account = svc.getPrivacyAccount(task.id)
    expect(account).not.toBeNull()
    expect(account!.consumedEpsilon).toBe(0)
  })

  it('反例: getPrivacyAccount 不存在返回 null', () => {
    expect(svc.getPrivacyAccount('nonexistent')).toBeNull()
  })

  it('正例: 完整任务生命周期: 创建→激活→多轮→完成', () => {
    const task = svc.createTask({ totalRounds: 3, minParticipants: 1, privacyBudgetEpsilon: 10 })
    svc.activateTask(task.id)

    for (let r = 0; r < 3; r++) {
      const round = svc.startRound(task.id)!
      expect(round).not.toBeNull()
      svc.submitGradient(task.id, round.id, 'tenant-a', 100)
      const agg = svc.aggregateRound(round.id)
      expect(agg.success).toBe(true)
    }

    expect(svc.tasks.get(task.id)!.status).toBe('completed')
    expect(svc.tasks.get(task.id)!.currentRound).toBe(3)
  })

  it('边界: 多租户提交后聚合', () => {
    const task = svc.createTask({
      participantTenantIds: ['tenant-a', 'tenant-b', 'tenant-c'],
      minParticipants: 3,
    })
    svc.activateTask(task.id)
    const round = svc.startRound(task.id)!
    svc.submitGradient(task.id, round.id, 'tenant-a', 50)
    svc.submitGradient(task.id, round.id, 'tenant-b', 100)
    svc.submitGradient(task.id, round.id, 'tenant-c', 150)
    const result = svc.aggregateRound(round.id)
    expect(result.success).toBe(true)
    expect(result.participantCount).toBe(3)
  })
})
