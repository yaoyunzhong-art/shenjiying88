/**
 * Phase 97 联邦学习 Entity (V10 Sprint 2 Day 26)
 *
 * FederatedRound: 联合训练轮次 (每个 round 多租户提交本地梯度, 服务端聚合)
 * GradientSubmission: 客户端提交的加密梯度
 * PrivacyAccount: 差分隐私预算追踪 (epsilon/δ)
 * AggregationMethod: 聚合算法 (FedAvg / FedProx / SCAFFOLD)
 */

export type AggregationMethod = 'fedavg' | 'fedprox' | 'scaffold'

export type RoundStatus =
  | 'draft'             // 未启动
  | 'collecting'        // 收集客户端梯度中
  | 'aggregating'       // 聚合中
  | 'completed'         // 聚合完成
  | 'failed'            // 失败
  | 'cancelled'         // 取消

export type SubmissionStatus = 'pending' | 'submitted' | 'accepted' | 'rejected'

/**
 * 联邦任务 (一次跨租户的联合训练)
 */
export interface FederatedTask {
  id: string
  /** 任务名称 */
  name: string
  /** 模型架构描述 (例: 'sales-forecaster-v2') */
  modelArch: string
  /** 任务发起租户 (协调方) */
  coordinatorTenantId: string
  /** 参与租户白名单 */
  participantTenantIds: string[]
  /** 聚合方法 */
  aggregationMethod: AggregationMethod
  /** 总训练轮次 */
  totalRounds: number
  /** 当前已完成轮次 */
  currentRound: number
  /** 状态 */
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
  /** 差分隐私预算上限 (ε) */
  privacyBudgetEpsilon: number
  /** 差分隐私 δ 上限 */
  privacyBudgetDelta: number
  /** 已消耗的 ε */
  consumedEpsilon: number
  /** 已消耗的 δ */
  consumedDelta: number
  /** 最小参与客户端数 (低于此数则该轮次失败) */
  minParticipants: number
  /** 噪声乘子 (高斯噪声 stddev / sensitivity) */
  noiseMultiplier: number
  /** 每轮最大梯度范数 (clipping 阈值) */
  maxGradientNorm: number
  createdAt: string
  updatedAt: string
}

/**
 * 联合训练轮次
 */
export interface FederatedRound {
  id: string
  taskId: string
  /** 轮次序号 (从 1 开始) */
  roundNumber: number
  status: RoundStatus
  /** 全局模型版本 (聚合前) */
  globalModelVersion: number
  /** 全局模型版本 (聚合后) */
  nextModelVersion?: number
  /** 期望参与客户端数 */
  expectedParticipants: number
  /** 实际提交客户端数 */
  actualParticipants: number
  /** 收集开始时间 */
  collectionStartedAt?: string
  /** 收集截止时间 */
  collectionDeadlineAt?: string
  /** 聚合完成时间 */
  aggregatedAt?: string
  /** 该轮次消耗 ε */
  epsilonConsumed: number
  /** 聚合后的平均损失 (可选 metric) */
  aggregatedLoss?: number
  /** 失败原因 */
  failureReason?: string
  createdAt: string
  updatedAt: string
}

/**
 * 梯度提交记录
 */
export interface GradientSubmission {
  id: string
  roundId: string
  taskId: string
  /** 提交租户 */
  tenantId: string
  /** 数据样本数 (用于加权聚合) */
  sampleCount: number
  /** 加密梯度 (base64 编码, 可注入同态加密层) */
  encryptedGradients: string
  /** 加密随机噪声 (DP 噪声种子, 用于服务端审计) */
  noiseSeed: string
  /** 状态 */
  status: SubmissionStatus
  /** 提交时间 */
  submittedAt?: string
  /** 服务端接收时间 */
  receivedAt?: string
  /** 拒绝原因 */
  rejectionReason?: string
  createdAt: string
}

/**
 * 差分隐私账户 (每个 task 一个账户)
 */
export interface PrivacyAccount {
  taskId: string
  /** 总 ε 预算 */
  totalEpsilon: number
  /** 已消耗 ε */
  consumedEpsilon: number
  /** 总 δ 预算 */
  totalDelta: number
  /** 已消耗 δ */
  consumedDelta: number
  /** 隐私组合方法 (basic / advanced) */
  compositionMethod: 'basic' | 'advanced' | 'rdp'
  /** 最后更新时间 */
  updatedAt: string
}

/**
 * 联邦聚合结果
 */
export interface AggregationResult {
  roundId: string
  globalModelVersion: number
  /** 聚合后的梯度 (base64) */
  aggregatedGradients: string
  /** 参与客户端数 */
  participantCount: number
  /** 总样本数 */
  totalSamples: number
  /** 平均损失 */
  averageLoss: number
  /** 消耗的 ε */
  epsilonConsumed: number
  /** 消耗的 δ */
  deltaConsumed: number
  /** 聚合方法 */
  method: AggregationMethod
  /** 聚合耗时 (ms) */
  durationMs: number
}

// ============ 工具函数 ============

export function generateTaskId(): string {
  return `fed-task-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`
}
export function generateRoundId(): string {
  return `fed-rnd-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`
}
export function generateSubmissionId(): string {
  return `fed-sub-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`
}

/**
 * FedAvg 加权平均 (简化版: 假设权重均匀)
 * 实际生产: 权重 = sampleCount / totalSamples
 */
export function fedAvg(gradients: number[][]): number[] {
  if (gradients.length === 0) return []
  const dim = gradients[0].length
  const avg = new Array(dim).fill(0)
  for (const g of gradients) {
    for (let i = 0; i < dim; i++) avg[i] += g[i]
  }
  for (let i = 0; i < dim; i++) avg[i] /= gradients.length
  return avg
}

/**
 * FedProx: FedAvg + 近端项 (μ/2 ||w - w_global||^2)
 * 简化版: 退化为 FedAvg, 因为没有显式的 proximal term
 */
export function fedProx(gradients: number[][]): number[] {
  return fedAvg(gradients)
}

/**
 * SCAFFOLD: 控制变量修正
 * 简化版: 用 controlVariate 数组修正 (mock)
 */
export function scaffold(
  gradients: number[][],
  controlVariates: number[][] = [],
): number[] {
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

/**
 * 高斯噪声生成 (DP 噪声)
 */
export function gaussianNoise(stddev: number, dim: number): number[] {
  // Box-Muller transform
  const noise: number[] = []
  for (let i = 0; i < dim; i++) {
    const u1 = Math.random()
    const u2 = Math.random()
    const z = Math.sqrt(-2 * Math.log(u1 || 0.0001)) * Math.cos(2 * Math.PI * u2)
    noise.push(z * stddev)
  }
  return noise
}

/**
 * 梯度裁剪 (L2 norm clipping)
 */
export function clipGradient(gradients: number[], maxNorm: number): number[] {
  const norm = Math.sqrt(gradients.reduce((s, g) => s + g * g, 0))
  if (norm <= maxNorm) return gradients
  const scale = maxNorm / norm
  return gradients.map((g) => g * scale)
}

/**
 * 差分隐私消耗 (Gaussian mechanism: ε ≈ sensitivity × sqrt(2 ln(1.25/δ)) / σ)
 */
export function computeEpsilonConsumed(
  sensitivity: number,
  noiseStddev: number,
  delta: number,
): number {
  if (noiseStddev <= 0) return Infinity
  return (sensitivity * Math.sqrt(2 * Math.log(1.25 / delta))) / noiseStddev
}

/**
 * 基本组合 (basic composition): ε_total = Σ ε_i
 */
export function basicComposition(epsilons: number[]): number {
  return epsilons.reduce((s, e) => s + e, 0)
}

/**
 * 高级组合 (advanced composition, 简化版 Moment Accountant):
 * ε_total ≈ √(2k) ε_max + log(1/δ')  (RDP-based)
 * 这是经典 advanced composition, 当 ε_i 都较小时, 会比 basic 紧很多
 */
export function advancedComposition(epsilons: number[], deltaPrime: number): number {
  if (epsilons.length === 0) return 0
  const k = epsilons.length
  const maxEpsilon = Math.max(...epsilons)
  // advanced composition: ε' = √(2k ln(1/δ')) ε + k ε (e^ε - 1)
  const sqrtTerm = Math.sqrt(2 * k * Math.log(1 / deltaPrime))
  const expTerm = k * maxEpsilon * (Math.exp(maxEpsilon) - 1)
  return sqrtTerm * maxEpsilon + expTerm
}

/**
 * 同态加密抽象 (模拟 - 实际生产用 Paillier/BFV/CKKS)
 *
 * 注意: 这是简化版, 真正的 HE 库如 SEAL/PALISADE
 * 这里只演示加密/解密接口 + 加法同态性质
 */
export interface HomomorphicCipher {
  /** 加密向量 */
  encrypt(plaintext: number[]): string
  /** 解密向量 */
  decrypt(ciphertext: string): number[]
  /** 同态加法: E(a) + E(b) = E(a + b) */
  add(a: string, b: string): string
  /** 同态标量乘: k × E(a) = E(k × a) */
  scale(ciphertext: string, scalar: number): string
}

/**
 * Mock HE 实现 (XOR + 缩放 - 非真同态)
 * 实际生产需要替换为 Paillier (加法同态) 或 CKKS (近似同态)
 */
export class MockHomomorphicCipher implements HomomorphicCipher {
  private seed: number

  constructor(seed = 42) {
    this.seed = seed
  }

  encrypt(plaintext: number[]): string {
    // 量化: float → int
    const quantized = plaintext.map((p) => Math.round(p * 1e6))
    // 简单编码: 模拟加密 (实际生产用真实 HE 库)
    const payload = {
      v: quantized,
      s: this.seed,
      t: Date.now(),
    }
    return Buffer.from(JSON.stringify(payload)).toString('base64')
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
}