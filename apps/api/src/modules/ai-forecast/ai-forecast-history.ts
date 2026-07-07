/**
 * ai-forecast-history.ts
 *
 * AI 预测模块的销售历史 mock 数据访问 helper.
 *
 * 由来: ai-forecast.service.ts 604 行里 3 service (DemandForecast / InventoryOptimizer /
 * TransferRecommendation) 6+5 = 10+ 行 inline 重复:
 *   - 6 处 `initMockData(productId, 'default-category')` (顶部)
 *   - 4 处 `productHistory.get(productId)!` (非空断言紧随其后)
 *   - 6 处的 `categoryId` 全部是死参数 'default-category' (sniff smell)
 *
 * 集中后: getOrInitProductHistory(productId) 一行完成 init + 取数据;
 * 6+4 = 10 行 → 1 行调用, 死参数 'default-category' 也消失 (统一在 helper 内 hardcode).
 */

import { productHistory, initMockData } from './ai-forecast.service'

export interface ProductHistory {
  dailySales: number[]
  categoryId: string
}

/**
 * 获取产品销售历史, 缺失则用 mock 数据初始化.
 *
 * 行为契约 (与原 inline 字节一致):
 *   - 第一次调用: 调用 initMockData 初始化 30 天销售历史
 *   - 后续调用: 直接从 productHistory map 取
 *   - 返回值总是不为 undefined (有 ! 强制断言字节等价)
 *
 * 死参数: 原代码 6 处调用都传 'default-category', helper 内部 hardcode,
 *         后续如需支持真实 categoryId, 升级为 getOrInitProductHistory(productId, categoryId?).
 */
export function getOrInitProductHistory(productId: string): ProductHistory {
  initMockData(productId, 'default-category')
  return productHistory.get(productId)!
}
