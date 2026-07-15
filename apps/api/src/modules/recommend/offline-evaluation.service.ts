import { Injectable } from '@nestjs/common'

/**
 * V18 Day2 D3: OfflineEvaluationService (离线评估)
 *
 * 推荐系统离线评估框架:
 *  - Recall@K / Precision@K
 *  - NDCG@K (归一化折损累积增益)
 *  - 离线测试数据集生成
 *  - A/B 测试框架接口
 *
 * 评估流程:
 *  1. 从历史数据生成 train/test 分割
 *  2. train 集训练/生成推荐
 *  3. 用 test 集计算评估指标
 */

// ---- 数据类型 ----

export interface GroundTruthItem {
  itemId: string
  relevance: number  // 0..1 (1 = 强相关, 0.5 = 中等, 0 = 不相关)
}

export interface RecommendationResult {
  itemId: string
  score: number
  rank: number  // 1-indexed
}

export interface EvalConfig {
  k: number          // top K
  relevanceThreshold: number  // 相关性阈值 (>= 此值被视为"命中")
}

export interface PrecisionRecallResult {
  precision: number  // Precision@K
  recall: number     // Recall@K
  f1Score: number    // F1-Score
  hitCount: number   // 命中数
  totalGroundTruth: number
  k: number
}

export interface NDCGResult {
  ndcg: number      // NDCG@K
  dcg: number       // DCG@K
  idealDcg: number  // IDCG@K
  k: number
}

export interface FullEvalResult {
  precisionRecall: PrecisionRecallResult
  ndcg: NDCGResult
  config: EvalConfig
  sampleSize: number  // 评估使用的样本数
  evaluatedAt: string
}

export interface TestDataSet {
  /** 用于训练的历史购买 (模拟推荐模型输入) */
  trainPurchases: { memberId: string; itemId: string; purchasedAt: string }[]
  /** 用于验证的真实购买 (ground truth) */
  testPurchases: { memberId: string; itemId: string; purchasedAt: string }[]
  /** 会员 ID 列表 */
  memberIds: string[]
  /** 商品列表 */
  itemIds: string[]
  /** 分割比例 */
  splitRatio: number
  createdAt: string
}

export interface ATestConfig {
  /** A/B 组名称 */
  name: string
  /** A/B 组描述 */
  description: string
  /** 流量分配 (百分比, 总和 100) */
  trafficPercent: number
  /** 启用的推荐策略 */
  enabledStrategies: string[]
  /** 策略参数 */
  params: Record<string, unknown>
  /** 是否启用 */
  enabled: boolean
}

export interface ATestResult {
  config: ATestConfig
  evalResult: FullEvalResult
  /** 用户覆盖数 */
  usersCovered: number
  /** 推荐平均曝光 */
  avgExposure: number
  /** 点击率 (模拟) */
  simulatedCtr: number
  startedAt: string
  completedAt: string
}

export interface ATestExperiment {
  id: string
  name: string
  description: string
  control: ATestConfig
  variant: ATestConfig
  startDate: string
  endDate?: string
  status: 'running' | 'completed' | 'cancelled'
  results?: {
    control: ATestResult
    variant: ATestResult
    winner: 'control' | 'variant' | 'tie'
  }
}

// ---- 服务 ----

@Injectable()
export class OfflineEvaluationService {
  static readonly DEFAULT_EVAL_CONFIG: EvalConfig = {
    k: 10,
    relevanceThreshold: 0.5,
  }

  // ============================================================
  // Precision / Recall
  // ============================================================

  /**
   * 计算 Precision@K 和 Recall@K
   */
  computePrecisionRecall(
    recommended: RecommendationResult[],
    groundTruth: GroundTruthItem[],
    config: EvalConfig = OfflineEvaluationService.DEFAULT_EVAL_CONFIG,
  ): PrecisionRecallResult {
    const k = Math.min(config.k, recommended.length)
    const topK = recommended.slice(0, k)

    // 构建 ground truth 查找表
    const gtMap = new Map<string, number>()
    for (const gt of groundTruth) {
      gtMap.set(gt.itemId, gt.relevance)
    }

    // 计算命中
    let hitCount = 0
    for (const r of topK) {
      const relevance = gtMap.get(r.itemId)
      if (relevance != null && relevance >= config.relevanceThreshold) {
        hitCount++
      }
    }

    const precision = k > 0 ? hitCount / k : 0
    const recall = groundTruth.length > 0
      ? hitCount / groundTruth.length
      : 0

    // F1 = 2 * precision * recall / (precision + recall)
    const f1Score = precision + recall > 0
      ? 2 * precision * recall / (precision + recall)
      : 0

    return {
      precision,
      recall,
      f1Score,
      hitCount,
      totalGroundTruth: groundTruth.length,
      k,
    }
  }

  // ============================================================
  // NDCG@K
  // ============================================================

  /**
   * 计算 NDCG@K (归一化折损累积增益)
   *
   * DCG@K = sum( (2^relev_i - 1) / log2(i + 1) )
   * IDCG@K = perfect ordering 的 DCG
   * NDCG@K = DCG / IDCG
   */
  computeNDCG(
    recommended: RecommendationResult[],
    groundTruth: GroundTruthItem[],
    config: EvalConfig = OfflineEvaluationService.DEFAULT_EVAL_CONFIG,
  ): NDCGResult {
    const k = Math.min(config.k, recommended.length)
    const topK = recommended.slice(0, k)

    // ground truth 查找表
    const gtMap = new Map<string, number>()
    for (const gt of groundTruth) {
      gtMap.set(gt.itemId, gt.relevance)
    }

    // DCG: 使用推荐列表的顺序
    let dcg = 0
    for (let i = 0; i < topK.length; i++) {
      const r = topK[i]
      const relevance = gtMap.get(r.itemId) ?? 0
      if (relevance >= config.relevanceThreshold) {
        dcg += (Math.pow(2, relevance) - 1) / Math.log2(i + 2)
      }
    }

    // IDCG: 最优排序下的 DCG (取 topK 中 ground truth relevance 降序)
    const idealRanks = topK
      .map(r => gtMap.get(r.itemId) ?? 0)
      .filter(v => v >= config.relevanceThreshold)
      .sort((a, b) => b - a)

    let idealDcg = 0
    for (let i = 0; i < idealRanks.length; i++) {
      idealDcg += (Math.pow(2, idealRanks[i]) - 1) / Math.log2(i + 2)
    }

    const ndcg = idealDcg > 0 ? dcg / idealDcg : 0

    return { ndcg, dcg, idealDcg, k }
  }

  // ============================================================
  // 完整评估
  // ============================================================

  /**
   * 完整评估 (Precision + Recall + NDCG)
   */
  evaluate(
    recommended: RecommendationResult[],
    groundTruth: GroundTruthItem[],
    config: EvalConfig = OfflineEvaluationService.DEFAULT_EVAL_CONFIG,
  ): FullEvalResult {
    const precisionRecall = this.computePrecisionRecall(recommended, groundTruth, config)
    const ndcg = this.computeNDCG(recommended, groundTruth, config)

    return {
      precisionRecall,
      ndcg,
      config,
      sampleSize: recommended.length,
      evaluatedAt: new Date().toISOString(),
    }
  }

  // ============================================================
  // 离线测试数据集生成
  // ============================================================

  /**
   * 生成 train/test 数据集
   *
   * @param purchases 完整的购买历史
   * @param splitRatio 训练集比例 (默认 0.8 = 80% train, 20% test)
   * @returns 分割后的数据集
   */
  generateTestDataSet(
    purchases: { memberId: string; itemId: string; purchasedAt: string }[],
    splitRatio: number = 0.8,
  ): TestDataSet {
    // 按 memberId 分组
    const memberGroups = new Map<string, typeof purchases>()
    const memberIdsSet = new Set<string>()
    const itemIdsSet = new Set<string>()

    for (const p of purchases) {
      const group = memberGroups.get(p.memberId) ?? []
      group.push(p)
      memberGroups.set(p.memberId, group)
      memberIdsSet.add(p.memberId)
      itemIdsSet.add(p.itemId)
    }

    const trainPurchases: typeof purchases = []
    const testPurchases: typeof purchases = []

    // 对每个会员, 按时间排序, 前 splitRatio 部分作为 train
    for (const [, group] of memberGroups) {
      const sorted = [...group].sort(
        (a, b) => a.purchasedAt.localeCompare(b.purchasedAt),
      )

      // 确保每个会员至少有 2 条才分割
      if (sorted.length < 2) {
        // 不足 2 条的会员全部归 train
        trainPurchases.push(...sorted)
        continue
      }

      const trainCount = Math.max(1, Math.round(sorted.length * splitRatio))
      trainPurchases.push(...sorted.slice(0, trainCount))
      testPurchases.push(...sorted.slice(trainCount))
    }

    return {
      trainPurchases,
      testPurchases,
      memberIds: Array.from(memberIdsSet),
      itemIds: Array.from(itemIdsSet),
      splitRatio,
      createdAt: new Date().toISOString(),
    }
  }

  /**
   * 从 test 购买数据生成 ground truth
   */
  buildGroundTruth(
    testPurchases: { memberId: string; itemId: string; purchasedAt: string }[],
    memberId?: string,
  ): GroundTruthItem[] {
    const filtered = memberId
      ? testPurchases.filter(p => p.memberId === memberId)
      : testPurchases

    const itemRelevance = new Map<string, number>()
    for (const p of filtered) {
      // 多次购买 = 更高相关性
      const cur = itemRelevance.get(p.itemId) ?? 0
      itemRelevance.set(p.itemId, cur + 1)
    }

    // 归一化 relevance 到 [0.5, 1.0]
    const maxCount = Math.max(1, ...itemRelevance.values())

    return Array.from(itemRelevance.entries()).map(([itemId, count]) => ({
      itemId,
      relevance: 0.5 + 0.5 * (count / maxCount),
    }))
  }

  // ============================================================
  // A/B 测试框架接口
  // ============================================================

  /**
   * 创建 A/B 实验配置
   */
  createExperiment(
    id: string,
    name: string,
    description: string,
    control: ATestConfig,
    variant: ATestConfig,
  ): ATestExperiment {
    // 验证流量分配
    const totalTraffic = (control.trafficPercent ?? 0) + (variant.trafficPercent ?? 0)
    if (Math.abs(totalTraffic - 100) > 0.01) {
      throw new Error(`A/B test traffic must sum to 100, got ${totalTraffic}`)
    }

    return {
      id,
      name,
      description,
      control,
      variant,
      startDate: new Date().toISOString(),
      status: 'running',
    }
  }

  /**
   * 模拟 A/B 测试结果
   */
  simulateATest(
    experiment: ATestExperiment,
    testData: TestDataSet,
    evaluateFn: (
      strategy: string,
      purchases: { memberId: string; itemId: string; purchasedAt: string }[],
    ) => FullEvalResult,
  ): ATestExperiment {
    const controlResult = evaluateFn('control', testData.trainPurchases)
    const variantResult = evaluateFn('variant', testData.trainPurchases)

    const controlMetrics = this.evaluate(
      this.simulateRecommendations(testData.testPurchases, controlResult),
      this.buildGroundTruth(testData.testPurchases),
    )

    const variantMetrics = this.evaluate(
      this.simulateRecommendations(testData.testPurchases, variantResult),
      this.buildGroundTruth(testData.testPurchases),
    )

    // 判断胜者
    let winner: 'control' | 'variant' | 'tie' = 'tie'
    const controlScore = controlMetrics.precisionRecall.f1Score + controlMetrics.ndcg.ndcg
    const variantScore = variantMetrics.precisionRecall.f1Score + variantMetrics.ndcg.ndcg

    if (variantScore > controlScore * 1.01) {
      winner = 'variant'
    } else if (controlScore > variantScore * 1.01) {
      winner = 'control'
    }

    return {
      ...experiment,
      status: 'completed',
      endDate: new Date().toISOString(),
      results: {
        control: {
          config: experiment.control,
          evalResult: controlMetrics,
          usersCovered: testData.memberIds.length,
          avgExposure: controlResultsAvgExposure(testData, experiment.control.params),
          simulatedCtr: simulateCTR(controlMetrics),
          startedAt: experiment.startDate,
          completedAt: new Date().toISOString(),
        },
        variant: {
          config: experiment.variant,
          evalResult: variantMetrics,
          usersCovered: testData.memberIds.length,
          avgExposure: controlResultsAvgExposure(testData, experiment.variant.params),
          simulatedCtr: simulateCTR(variantMetrics),
          startedAt: experiment.startDate,
          completedAt: new Date().toISOString(),
        },
        winner,
      },
    }
  }

  /**
   * 模拟推荐结果 (用于评估)
   */
  private simulateRecommendations(
    testPurchases: { memberId: string; itemId: string; purchasedAt: string }[],
    _evalResult: FullEvalResult,
  ): RecommendationResult[] {
    // 按商品出现频率排序作为推荐
    const frequency = new Map<string, number>()
    for (const p of testPurchases) {
      frequency.set(p.itemId, (frequency.get(p.itemId) ?? 0) + 1)
    }

    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([itemId, count], idx) => ({
        itemId,
        score: count / Math.max(1, testPurchases.length),
        rank: idx + 1,
      }))
  }
}

// ============================================================
// 辅助函数
// ============================================================

function controlResultsAvgExposure(
  testData: TestDataSet,
  _params: Record<string, unknown>,
): number {
  // 模拟平均曝光: 平均每个会员在 test 中有的购买数
  if (testData.memberIds.length === 0) return 0
  return testData.testPurchases.length / testData.memberIds.length
}

function simulateCTR(evalResult: FullEvalResult): number {
  // 使用 precision 和 recall 的组合作为 CTR 模拟值
  return evalResult.precisionRecall.precision * 0.4 +
    evalResult.precisionRecall.recall * 0.3 +
    evalResult.precisionRecall.f1Score * 0.3
}
