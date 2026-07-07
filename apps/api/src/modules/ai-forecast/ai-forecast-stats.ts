/**
 * ai-forecast-stats.ts
 *
 * AI 预测模块的统计纯函数 helpers (无依赖, 跨 service 复用).
 *
 * 由来: ai-forecast.service.ts 604 行里 4 类数值计算模板重复 19+ 次:
 *   - 移动平均 (slice + reduce / window): 4 处 (calcMovingAverage 私有 + 3 处 inline)
 *   - 总体标准差 (slice + Math.pow + Math.sqrt / n): 2 处 inline
 *   - 保留 2 位小数 (Math.round(x * 100) / 100): 7 处 inline
 *   - 销售历史 + mock init: 6+4 = 10 行 inline (见 ai-forecast-history.ts)
 *
 * 集中后: 3 个纯函数 + 1 个封装 helper, 1 处定义跨 service (DemandForecast /
 * InventoryOptimizer / TransferRecommendation) 复用;
 * 任何调整 (如把总体标准差改样本标准差 / 把 2 位小数改 3 位) 1 处生效.
 */

/**
 * 移动平均: 取 sales 最后 window 个元素的算术平均.
 * 用法: movingAverage([10, 20, 30, 40, 50], 3) → 40  (30+40+50)/3
 *
 * 行为契约:
 *   - window > sales.length: 取全部 (slice 不会越界)
 *   - sales.length === 0: 返回 0 (避免 NaN)
 *   - window <= 0: 返回 0 (避免越界)
 */
export function movingAverage(sales: number[], window: number): number {
  if (window <= 0 || sales.length === 0) return 0
  const slice = sales.slice(-window)
  return slice.reduce((a, b) => a + b, 0) / slice.length
}

/**
 * 总体标准差 (population standard deviation, 除以 n).
 * 用法: standardDeviation([1, 2, 3, 4, 5], 3) → sqrt(((1-3)² + ... + (5-3)²) / 5)
 *
 * 行为契约 (与原 inline 行为字节一致):
 *   - variance = Σ(x - mean)² / n (总体方差, 不是样本方差 / (n-1))
 *   - stdDev = Math.sqrt(variance)
 *   - sales.length === 0: 返回 0 (避免 NaN)
 *
 * 注: ai-forecast.service.ts 原代码对 14 天数据用 / 14 (总体方差),
 *     与统计学更常用的 / (n-1) (Bessel 校正) 不一致, 这里保持原行为.
 */
export function standardDeviation(sales: number[], mean: number): number {
  if (sales.length === 0) return 0
  const variance = sales.reduce((acc, sale) => acc + Math.pow(sale - mean, 2), 0) / sales.length
  return Math.sqrt(variance)
}

/**
 * 保留 2 位小数: Math.round(x * 100) / 100.
 * 用法: round2(1.23456) → 1.23, round2(1.235) → 1.24
 *
 * 行为契约:
 *   - 输入 NaN: 返回 NaN
 *   - 输入 Infinity: 返回 Infinity
 *   - 输入 0: 返回 0
 */
export function round2(x: number): number {
  return Math.round(x * 100) / 100
}
