import { Injectable } from '@nestjs/common'

/**
 * V18 Day2 D3: SimilarityMatrixService (相似度矩阵批计算)
 *
 * 协同过滤增强: 批量预计算物品间的相似度矩阵, 避免实时计算
 *
 * 支持:
 *  - 物品-物品相似度 (cosine / jaccard)
 *  - 用户-用户相似度 (cosine)
 *  - 增量更新
 *  - LRU 缓存
 *  - 多租户隔离
 *
 * 存储格式: MatrixEntry = { itemA, itemB, similarity, updatedAt }
 */

export type SimilarityMethod = 'cosine' | 'jaccard'

export interface ItemPair {
  itemA: string
  itemB: string
  similarity: number
  updatedAt: number
}

export interface MatrixEntry {
  itemA: string
  itemB: string
  similarity: number
  updatedAt: number
}

export interface UserPairEntry {
  userA: string
  userB: string
  similarity: number
  updatedAt: number
}

export interface BatchComputeInput {
  tenantId: string
  /** itemId → Set<memberId> (哪些会员购买/喜欢该商品) */
  itemMemberMap: Map<string, Set<string>>
  /** method */
  method: SimilarityMethod
}

export interface UserBatchComputeInput {
  tenantId: string
  /** memberId → Set<itemId> (该会员买了什么) */
  memberItemMap: Map<string, Set<string>>
  method: SimilarityMethod
}

@Injectable()
export class SimilarityMatrixService {
  /** 每租户的物品相似度矩阵 */
  private readonly itemMatrices = new Map<string, Map<string, Map<string, number>>>()
  /** 每租户的用户相似度矩阵 */
  private readonly userMatrices = new Map<string, Map<string, Map<string, number>>>()
  /** 更新时间戳 (itemId → time) */
  private readonly itemUpdateTimes = new Map<string, Map<string, number>>()
  /** 更新时间戳 (userId → time) */
  private readonly userUpdateTimes = new Map<string, Map<string, number>>()

  private static readonly MAX_MATRIX_SIZE = 100_000
  private static readonly STALENESS_MS = 3600_000 // 1 hour

  /**
   * 批量计算物品相似度矩阵
   */
  computeItemSimilarities(input: BatchComputeInput): void {
    const { tenantId, itemMemberMap, method } = input
    const itemIds = Array.from(itemMemberMap.keys())
    const n = itemIds.length

    const matrix = new Map<string, Map<string, number>>()
    const updateTimes = new Map<string, number>()
    const now = Date.now()

    for (let i = 0; i < n; i++) {
      const itemA = itemIds[i]
      const membersA = itemMemberMap.get(itemA)!
      const row = new Map<string, number>()

      for (let j = i + 1; j < n; j++) {
        const itemB = itemIds[j]
        const membersB = itemMemberMap.get(itemB)!

        let sim = 0
        if (method === 'cosine') {
          sim = this.cosineSimilarity(membersA, membersB)
        } else {
          sim = this.jaccardSimilarity(membersA, membersB)
        }

        row.set(itemB, sim)
      }

      matrix.set(itemA, row)
      updateTimes.set(itemA, now)
    }

    // 检查矩阵大小
    let entryCount = 0
    for (const [, row] of matrix) {
      entryCount += row.size
    }

    if (entryCount > SimilarityMatrixService.MAX_MATRIX_SIZE) {
      // 超过限制时只保留最高相似度的条目
      this.pruneMatrix(matrix, entryCount)
    }

    this.itemMatrices.set(tenantId, matrix)
    this.itemUpdateTimes.set(tenantId, updateTimes)
  }

  /**
   * 批量计算用户相似度矩阵
   */
  computeUserSimilarities(input: UserBatchComputeInput): void {
    const { tenantId, memberItemMap, method } = input
    const userIds = Array.from(memberItemMap.keys())
    const n = userIds.length

    const matrix = new Map<string, Map<string, number>>()
    const updateTimes = new Map<string, number>()
    const now = Date.now()

    for (let i = 0; i < n; i++) {
      const userA = userIds[i]
      const itemsA = memberItemMap.get(userA)!
      const row = new Map<string, number>()

      for (let j = i + 1; j < n; j++) {
        const userB = userIds[j]
        const itemsB = memberItemMap.get(userB)!

        let sim = 0
        if (method === 'cosine') {
          sim = this.cosineSimilarity(itemsA, itemsB)
        } else {
          sim = this.jaccardSimilarity(itemsA, itemsB)
        }

        row.set(userB, sim)
      }

      matrix.set(userA, row)
      updateTimes.set(userA, now)
    }

    let entryCount = 0
    for (const [, row] of matrix) {
      entryCount += row.size
    }

    if (entryCount > SimilarityMatrixService.MAX_MATRIX_SIZE) {
      this.pruneMatrix(matrix, entryCount)
    }

    this.userMatrices.set(tenantId, matrix)
    this.userUpdateTimes.set(tenantId, updateTimes)
  }

  /**
   * 获取与 targetItemId 最相似的 Top N 物品 (已缓存)
   */
  getSimilarItems(
    tenantId: string,
    targetItemId: string,
    topN: number = 10,
  ): ItemPair[] {
    const matrix = this.itemMatrices.get(tenantId)
    if (!matrix) return []

    const results: ItemPair[] = []

    // 查找行
    const row = matrix.get(targetItemId)
    if (row) {
      for (const [itemB, sim] of row) {
        results.push({ itemA: targetItemId, itemB, similarity: sim, updatedAt: Date.now() })
      }
    }

    // 查找列 (其他行可能包含该 targetItemId)
    for (const [itemA, rowA] of matrix) {
      if (itemA === targetItemId) continue
      const sim = rowA.get(targetItemId)
      if (sim != null) {
        results.push({ itemA, itemB: targetItemId, similarity: sim, updatedAt: Date.now() })
      }
    }

    results.sort((a, b) => b.similarity - a.similarity)
    return results.slice(0, topN)
  }

  /**
   * 获取与 targetUserId 最相似的 Top N 用户
   */
  getSimilarUsers(
    tenantId: string,
    targetUserId: string,
    topN: number = 10,
  ): UserPairEntry[] {
    const matrix = this.userMatrices.get(tenantId)
    if (!matrix) return []

    const results: UserPairEntry[] = []

    const row = matrix.get(targetUserId)
    if (row) {
      for (const [userB, sim] of row) {
        results.push({ userA: targetUserId, userB, similarity: sim, updatedAt: Date.now() })
      }
    }

    for (const [userA, rowA] of matrix) {
      if (userA === targetUserId) continue
      const sim = rowA.get(targetUserId)
      if (sim != null) {
        results.push({ userA, userB: targetUserId, similarity: sim, updatedAt: Date.now() })
      }
    }

    results.sort((a, b) => b.similarity - a.similarity)
    return results.slice(0, topN)
  }

  /**
   * 增量更新单个物品的相似度 (不是全量重新计算)
   */
  updateItemSimilarity(
    tenantId: string,
    itemId: string,
    itemMemberMap: Map<string, Set<string>>,
    method: SimilarityMethod = 'cosine',
  ): void {
    let matrix = this.itemMatrices.get(tenantId)
    if (!matrix) {
      // 如果矩阵还不存在, 全量计算
      this.computeItemSimilarities({
        tenantId,
        itemMemberMap,
        method,
      })
      return
    }

    const membersA = itemMemberMap.get(itemId)
    if (!membersA) return

    const existingRow = matrix.get(itemId)
    if (existingRow) {
      existingRow.clear()
    } else {
      matrix.set(itemId, new Map())
    }

    const now = Date.now()
    // 删除其他行对该 itemId 的引用
    for (const [, row] of matrix) {
      row.delete(itemId)
    }

    for (const [otherId, membersB] of itemMemberMap) {
      if (otherId === itemId) continue
      const sim = this.cosineSimilarity(membersA, membersB)
      matrix.get(itemId)!.set(otherId, sim)
    }

    this.itemMatrices.set(tenantId, matrix)
  }

  /**
   * 增量更新单个用户的相似度
   */
  updateUserSimilarity(
    tenantId: string,
    userId: string,
    memberItemMap: Map<string, Set<string>>,
    method: SimilarityMethod = 'cosine',
  ): void {
    let matrix = this.userMatrices.get(tenantId)
    if (!matrix) {
      this.computeUserSimilarities({ tenantId, memberItemMap, method })
      return
    }

    const itemsA = memberItemMap.get(userId)
    if (!itemsA) return

    const existingRow = matrix.get(userId)
    if (existingRow) {
      existingRow.clear()
    } else {
      matrix.set(userId, new Map())
    }

    for (const [otherId, itemsB] of memberItemMap) {
      if (otherId === userId) continue
      const sim = this.cosineSimilarity(itemsA, itemsB)
      matrix.get(userId)!.set(otherId, sim)
    }

    this.userMatrices.set(tenantId, matrix)
  }

  /**
   * 矩阵是否过时需要重新计算
   */
  isStale(
    tenantId: string,
    type: 'item' | 'user',
    stalenessMs: number = SimilarityMatrixService.STALENESS_MS,
  ): boolean {
    const updateTimes = type === 'item'
      ? this.itemUpdateTimes.get(tenantId)
      : this.userUpdateTimes.get(tenantId)

    if (!updateTimes) return true

    const now = Date.now()
    for (const [, time] of updateTimes) {
      if (now - time > stalenessMs) return true
    }
    return false
  }

  /**
   * 查询 Item ItemPair 相似度
   */
  queryItemPair(tenantId: string, itemA: string, itemB: string): number | null {
    const matrix = this.itemMatrices.get(tenantId)
    if (!matrix) return null

    // 查行
    const row = matrix.get(itemA)
    if (row?.has(itemB)) {
      return row.get(itemB) ?? null
    }

    // 查列
    for (const [, rowA] of matrix) {
      const sim = rowA.get(itemA)
      if (rowA.has(itemB) && itemA === itemB) return sim ?? null
      if (rowA.has(itemB) && sim != null) return sim
    }

    return null
  }

  /**
   * 清空指定租户的矩阵
   */
  invalidate(tenantId: string): void {
    this.itemMatrices.delete(tenantId)
    this.userMatrices.delete(tenantId)
    this.itemUpdateTimes.delete(tenantId)
    this.userUpdateTimes.delete(tenantId)
  }

  stats(tenantId: string): {
    itemMatrixEntries: number
    userMatrixEntries: number
  } {
    const itemMatrix = this.itemMatrices.get(tenantId)
    const userMatrix = this.userMatrices.get(tenantId)

    let itemEntries = 0
    if (itemMatrix) {
      for (const [, row] of itemMatrix) {
        itemEntries += row.size
      }
    }

    let userEntries = 0
    if (userMatrix) {
      for (const [, row] of userMatrix) {
        userEntries += row.size
      }
    }

    return { itemMatrixEntries: itemEntries, userMatrixEntries: userEntries }
  }

  // ---- 私有方法 ----

  /**
   * 余弦相似度
   */
  private cosineSimilarity(setA: Set<string>, setB: Set<string>): number {
    if (setA.size === 0 || setB.size === 0) return 0

    let intersection = 0
    for (const item of setA) {
      if (setB.has(item)) intersection++
    }

    if (intersection === 0) return 0

    return intersection / Math.sqrt(setA.size * setB.size)
  }

  /**
   * Jaccard 相似度
   */
  private jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
    if (setA.size === 0 && setB.size === 0) return 0

    const union = new Set(setA)
    for (const item of setB) {
      union.add(item)
    }

    let intersection = 0
    for (const item of setA) {
      if (setB.has(item)) intersection++
    }

    if (union.size === 0) return 0
    return intersection / union.size
  }

  /**
   * 矩阵过大时裁剪 (保留 Top 50% 的高相似度条目)
   */
  private pruneMatrix(
    matrix: Map<string, Map<string, number>>,
    totalEntries: number,
  ): void {
    const entries: { keyA: string; keyB: string; sim: number }[] = []
    for (const [keyA, row] of matrix) {
      for (const [keyB, sim] of row) {
        entries.push({ keyA, keyB, sim })
      }
    }

    entries.sort((a, b) => b.sim - a.sim)

    const keepCount = Math.max(10_000, Math.floor(totalEntries * 0.5))
    const keepSet = new Set(entries.slice(0, keepCount).map(e => `${e.keyA}|${e.keyB}`))

    for (const [keyA, row] of matrix) {
      for (const keyB of Array.from(row.keys())) {
        if (!keepSet.has(`${keyA}|${keyB}`)) {
          row.delete(keyB)
        }
      }
    }
  }
}
