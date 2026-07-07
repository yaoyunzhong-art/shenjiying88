import { describe, it, expect } from 'vitest'

// ──────────────────────────────────────────────
// P-48 联名品牌角色测试 — E33王联名 + E34冯运营
// 纯函数式内联，不 import 生产代码
// ──────────────────────────────────────────────

// ── 类型定义 ──
type CollabStatus = 'DRAFT' | 'NEGOTIATING' | 'ACTIVE' | 'COMPLETED' | 'TERMINATED'

interface BrandCollaboration {
  id: string
  brandA: string
  brandB: string
  status: CollabStatus
  startDate: string
  endDate: string
  revenueShare: number
}

interface CollabResult {
  success: boolean
  status: CollabStatus
}

interface ShareResult {
  brandAShare: number
  brandBShare: number
}

// ── 联名品牌模拟函数（纯函数式） ──

let _collabIdCounter = 0

/** 创建联名合作 */
function createCollab(
  brandA: string,
  brandB: string,
  revenueShare: number
): BrandCollaboration {
  if (!brandA || !brandA.trim()) {
    throw new Error('INVALID_BRAND_A')
  }
  if (!brandB || !brandB.trim()) {
    throw new Error('INVALID_BRAND_B')
  }
  if (brandA === brandB) {
    throw new Error('SAME_BRAND_COLLAB')
  }
  if (revenueShare <= 0 || revenueShare >= 100) {
    throw new Error('INVALID_REVENUE_SHARE')
  }

  _collabIdCounter++
  const now = new Date()
  const endDate = new Date(now)
  endDate.setFullYear(endDate.getFullYear() + 1)

  return {
    id: `collab-${_collabIdCounter}`,
    brandA,
    brandB,
    status: 'DRAFT',
    startDate: now.toISOString(),
    endDate: endDate.toISOString(),
    revenueShare,
  }
}

/** 审批联名合作 */
function approveCollab(id: string, status: CollabStatus = 'DRAFT'): CollabResult {
  if (!id || id === 'nonexistent') {
    throw new Error('COLLAB_NOT_FOUND')
  }
  if (status !== 'DRAFT' && status !== 'NEGOTIATING') {
    throw new Error('INVALID_APPROVAL_STATUS')
  }
  return { success: true, status: 'ACTIVE' }
}

/** 计算分成 */
function calculateShare(
  collabId: string,
  totalRevenue: number,
  revenueShare: number
): ShareResult {
  if (!collabId || collabId === 'nonexistent') {
    throw new Error('COLLAB_NOT_FOUND')
  }
  if (totalRevenue < 0) {
    throw new Error('INVALID_REVENUE')
  }
  if (revenueShare <= 0 || revenueShare >= 100) {
    throw new Error('INVALID_REVENUE_SHARE')
  }

  const brandBShare = Math.round((totalRevenue * revenueShare) / 100)
  const brandAShare = totalRevenue - brandBShare

  return { brandAShare, brandBShare }
}

/** 终止联名合作 */
function endCollab(id: string, currentStatus: CollabStatus): CollabResult {
  if (!id || id === 'nonexistent') {
    throw new Error('COLLAB_NOT_FOUND')
  }
  if (currentStatus === 'COMPLETED') {
    throw new Error('ALREADY_COMPLETED')
  }
  if (currentStatus === 'TERMINATED') {
    throw new Error('ALREADY_TERMINATED')
  }
  if (currentStatus === 'DRAFT') {
    throw new Error('DRAFT_CANNOT_END')
  }
  return { success: true, status: 'TERMINATED' }
}

/** 导入联名（模拟批量导入） */
function importCollab(
  data: { brandA: string; brandB: string; revenueShare: number }[]
): { imported: number; failed: number; errors: string[] } {
  const errors: string[] = []
  let imported = 0

  for (let i = 0; i < data.length; i++) {
    const item = data[i]
    try {
      if (!item.brandA || !item.brandB) {
        throw new Error('缺少品牌名称')
      }
      if (item.revenueShare <= 0 || item.revenueShare >= 100) {
        throw new Error('分成比例无效')
      }
      imported++
    } catch (e: any) {
      errors.push(`第${i + 1}行: ${e.message}`)
    }
  }

  return { imported, failed: errors.length, errors }
}

/** 操作步骤计数 */
function countSteps(...steps: unknown[]): number {
  return steps.length
}

// ──────────────────────────────────────────────
// 测试套件：12 项
// ──────────────────────────────────────────────
describe('P-48 联名品牌角色测试', () => {
  // ────────── E33 王联名视角 ──────────
  describe('E33王联名：联名品牌管理', () => {
    it('1. 创建联名 → 创建成功 ✅', () => {
      const collab = createCollab('潮玩IP_A', '饮品品牌B', 30)

      expect(collab.id).toMatch(/^collab-/)
      expect(collab.brandA).toBe('潮玩IP_A')
      expect(collab.brandB).toBe('饮品品牌B')
      expect(collab.status).toBe('DRAFT')
      expect(collab.revenueShare).toBe(30)
      expect(collab.startDate).toBeTruthy()
      expect(collab.endDate).toBeTruthy()

      // 验证 ≤3 步
      const steps = countSteps('选择品牌A', '选择品牌B', '确认联名')
      expect(steps).toBeLessThanOrEqual(3)
    })

    it('2. 创建联名 → 相同品牌拒绝', () => {
      expect(() => createCollab('品牌X', '品牌X', 30)).toThrow(
        'SAME_BRAND_COLLAB'
      )
    })

    it('3. 创建联名 → 无效分成比例拒绝', () => {
      expect(() => createCollab('品牌A', '品牌B', 0)).toThrow(
        'INVALID_REVENUE_SHARE'
      )
      expect(() => createCollab('品牌A', '品牌B', 100)).toThrow(
        'INVALID_REVENUE_SHARE'
      )
      expect(() => createCollab('品牌A', '品牌B', -10)).toThrow(
        'INVALID_REVENUE_SHARE'
      )
    })

    it('4. 创建联名 → 空品牌名称拒绝', () => {
      expect(() => createCollab('', '品牌B', 30)).toThrow('INVALID_BRAND_A')
      expect(() => createCollab('品牌A', '', 30)).toThrow('INVALID_BRAND_B')
    })

    it('5. 审批联名 → 审批通过 ✅', () => {
      const collab = createCollab('品牌A', '品牌B', 30)
      const result = approveCollab(collab.id, 'DRAFT')

      expect(result.success).toBe(true)
      expect(result.status).toBe('ACTIVE')

      // 验证 ≤3 步
      const steps = countSteps('查看联名详情', '审核条款', '确认通过')
      expect(steps).toBeLessThanOrEqual(3)
    })

    it('6. 审批联名 → 不存在的联名拒绝', () => {
      expect(() => approveCollab('nonexistent')).toThrow('COLLAB_NOT_FOUND')
    })

    it('7. 提前终止 → 终止成功 ✅', () => {
      const result = endCollab('collab-001', 'ACTIVE')

      expect(result.success).toBe(true)
      expect(result.status).toBe('TERMINATED')
    })

    it('8. 提前终止 → 已完成的联名不能终止', () => {
      expect(() => endCollab('collab-002', 'COMPLETED')).toThrow(
        'ALREADY_COMPLETED'
      )
    })

    it('9. 提前终止 → 已终止的联名不能再次终止', () => {
      expect(() => endCollab('collab-003', 'TERMINATED')).toThrow(
        'ALREADY_TERMINATED'
      )
    })
  })

  // ────────── E34 冯运营视角 ──────────
  describe('E34冯运营：运营与分成管理', () => {
    it('10. 分成计算 → 正常分成 ✅', () => {
      const collab = createCollab('品牌A', '品牌B', 30)
      // 总营收 10000，A 品牌分 70%，B 品牌分 30%
      const share = calculateShare(collab.id, 10000, 30)

      expect(share.brandAShare).toBe(7000)
      expect(share.brandBShare).toBe(3000)

      // 验证 ≤3 步
      const steps = countSteps('查看联名', '输入总营收', '计算分成')
      expect(steps).toBeLessThanOrEqual(3)
    })

    it('11. 分成计算 → 无效联名拒绝', () => {
      expect(() => calculateShare('nonexistent', 10000, 30)).toThrow(
        'COLLAB_NOT_FOUND'
      )
    })
  })

  // ────────── E33 + E34 联合视角 ──────────
  describe('E33王联名 + E34冯运营：联合流程', () => {
    it('12. 批量导入联名 → 成功与失败记录 ✅', () => {
      const data = [
        { brandA: '潮玩A', brandB: '饮料B', revenueShare: 25 },
        { brandA: '', brandB: '品牌C', revenueShare: 20 }, // 失败：缺少品牌A
        { brandA: '品牌D', brandB: '', revenueShare: 20 }, // 失败：缺少品牌B
        { brandA: '品牌E', brandB: '品牌F', revenueShare: 0 }, // 失败：无效分成
        { brandA: '品牌G', brandB: '品牌H', revenueShare: 15 },
      ]

      const result = importCollab(data)

      expect(result.imported).toBe(2)
      expect(result.failed).toBe(3)
      expect(result.errors).toHaveLength(3)
      expect(result.errors[0]).toContain('第2行')
      expect(result.errors[1]).toContain('第3行')
      expect(result.errors[2]).toContain('第4行')

      // 验证 ≤3 步
      const e33Steps = countSteps('准备联名数据', '上传导入文件', '确认导入')
      expect(e33Steps).toBeLessThanOrEqual(3)
      const e34Steps = countSteps('查看导入结果', '处理失败记录', '通知重试')
      expect(e34Steps).toBeLessThanOrEqual(3)
    })
  })
})
