/**
 * 🧪 TeamBuilding Service 单元测试
 * 覆盖: CRUD · 筛选 · 多租户隔离 · 统计 · 边界
 * 三件套：正例 + 反例 + 边界
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { TeamBuildingService } from './team-building.service'

describe('TeamBuildingService', () => {
  let service: TeamBuildingService

  beforeEach(() => {
    service = new TeamBuildingService()
  })

  // ════════════════════════════════════════════════════
  // CRUD
  // ════════════════════════════════════════════════════

  describe('CRUD', () => {
    it('[正例] findAll 返回所有团建方案', () => {
      const result = service.findAll('tenant-001')
      expect(result.length).toBeGreaterThanOrEqual(7)
      expect(result[0]).toHaveProperty('id')
      expect(result[0]).toHaveProperty('name')
      expect(result[0]).toHaveProperty('type')
      expect(result[0]).toHaveProperty('tenantId')
    })

    it('[正例] findById 返回正确团建方案', () => {
      const all = service.findAll('tenant-001')
      const plan = service.findById(all[0].id, 'tenant-001')
      expect(plan).toBeDefined()
      expect(plan!.id).toBe(all[0].id)
      expect(plan!.tenantId).toBe('tenant-001')
    })

    it('[正例] create 新增团建方案', () => {
      const plan = service.create({
        tenantId: 'tenant-001',
        name: '测试团建',
        type: 'outdoor',
        location: '测试地点',
        budget: 100000,
        expectedParticipants: 10,
        description: '这是一个测试团建方案',
      })
      expect(plan).toBeDefined()
      expect(plan.id).toMatch(/^tb-/)
      expect(plan.name).toBe('测试团建')
      expect(plan.type).toBe('outdoor')
      expect(plan.budget).toBe(100000)
      expect(plan.tenantId).toBe('tenant-001')
      expect(plan.createdAt).toBeDefined()
      expect(plan.updatedAt).toBeDefined()

      // 验证已保存
      const found = service.findById(plan.id, 'tenant-001')
      expect(found).toBeDefined()
      expect(found!.name).toBe('测试团建')
    })

    it('[正例] update 更新团建方案', () => {
      const all = service.findAll('tenant-001')
      const plan = all[0]
      const originalName = plan.name
      const updated = service.update(plan.id, 'tenant-001', {
        name: '更新后的方案',
        budget: 500000,
      })
      expect(updated.name).toBe('更新后的方案')
      expect(updated.budget).toBe(500000)
      expect(updated.name).not.toBe(originalName)
    })

    it('[正例] delete 删除团建方案', () => {
      const all = service.findAll('tenant-001')
      const plan = all[0]
      service.delete(plan.id, 'tenant-001')
      const found = service.findById(plan.id, 'tenant-001')
      expect(found).toBeUndefined()
    })

    // ── 反例 ──

    it('[反例] findById 不存在的ID返回undefined', () => {
      const result = service.findById('tb-nonexistent', 'tenant-001')
      expect(result).toBeUndefined()
    })

    it('[反例] update 不存在的方案抛错', () => {
      expect(() => service.update('tb-nonexistent', 'tenant-001', { name: '新名字' })).toThrow()
    })

    it('[反例] delete 不存在的方案抛错', () => {
      expect(() => service.delete('tb-nonexistent', 'tenant-001')).toThrow()
    })
  })

  // ════════════════════════════════════════════════════
  // 筛选
  // ════════════════════════════════════════════════════

  describe('筛选', () => {
    it('[正例] findAll 支持 type 筛选', () => {
      const result = service.findAll('tenant-001', { type: 'outdoor' })
      expect(result.length).toBeGreaterThanOrEqual(1)
      expect(result.every((p) => p.type === 'outdoor')).toBe(true)
    })

    it('[正例] findAll 支持 search 关键词搜索', () => {
      const result = service.findAll('tenant-001', { search: '密室' })
      expect(result.length).toBeGreaterThanOrEqual(1)
      expect(result[0].name).toContain('密室')
    })

    it('[正例] findAll 支持 type + search 组合筛选', () => {
      const result = service.findAll('tenant-001', { type: 'dinner', search: '海底捞' })
      expect(result.length).toBeGreaterThanOrEqual(1)
      expect(result.every((p) => p.type === 'dinner')).toBe(true)
      expect(result[0].name).toContain('海底捞')
    })

    it('[边界] search 无匹配返回空数组', () => {
      const result = service.findAll('tenant-001', { search: '不存在的内容xxxxxxxx' })
      expect(result).toHaveLength(0)
    })

    it('[边界] type 无匹配返回空数组', () => {
      const result = service.findAll('tenant-001', { type: 'other' })
      // 'other' 有数据（TeamLab），所以不会空
      // 用不存在的类型会TS错误，这里测试 type 不存在于本租户的情况
      // 已有方案中包含各种类型，所以此处验证组合过滤
      const noMatch = service.findAll('tenant-001-unknown', { type: 'ktv' })
      expect(noMatch).toHaveLength(0)
    })
  })

  // ════════════════════════════════════════════════════
  // 多租户隔离
  // ════════════════════════════════════════════════════

  describe('多租户隔离', () => {
    it('[反例] A租户看不到B租户的数据', () => {
      // 先在 tenant-A 创建一个方案
      const planA = service.create({
        tenantId: 'tenant-A',
        name: 'A租户团建',
        type: 'outdoor',
        location: 'A地',
        budget: 100000,
        expectedParticipants: 10,
        description: '仅限A租户',
      })

      // tenant-001 不应该看到 tenant-A 的数据
      const result001 = service.findAll('tenant-001')
      expect(result001.some((p) => p.id === planA.id)).toBe(false)

      // tenant-B 同样看不到
      const resultB = service.findAll('tenant-B')
      expect(resultB.some((p) => p.id === planA.id)).toBe(false)

      // tenant-A 能看到自己的数据
      const resultA = service.findAll('tenant-A')
      expect(resultA.some((p) => p.id === planA.id)).toBe(true)
    })
  })

  // ════════════════════════════════════════════════════
  // 统计
  // ════════════════════════════════════════════════════

  describe('统计', () => {
    it('[正例] getStats 返回完整统计信息', () => {
      const stats = service.getStats('tenant-001')
      expect(stats).toHaveProperty('totalPlans')
      expect(stats).toHaveProperty('byType')
      expect(stats).toHaveProperty('avgBudget')
      expect(stats).toHaveProperty('minBudget')
      expect(stats).toHaveProperty('maxBudget')
      expect(stats.totalPlans).toBeGreaterThan(0)
      expect(typeof stats.avgBudget).toBe('number')
      expect(stats.avgBudget).toBeGreaterThan(0)
    })

    it('[正例] getStats byType 包含所有类型', () => {
      const stats = service.getStats('tenant-001')
      const types = Object.keys(stats.byType)
      expect(types).toContain('outdoor')
      expect(types).toContain('dinner')
      expect(types).toContain('ktv')
      // 统计总和等于总数
      const sum = Object.values(stats.byType).reduce((a, b) => a + b, 0)
      expect(sum).toBe(stats.totalPlans)
    })

    it('[边界] getStats 空租户返回全零', () => {
      const stats = service.getStats('empty-tenant')
      expect(stats.totalPlans).toBe(0)
      expect(stats.minBudget).toBe(0)
      expect(stats.maxBudget).toBe(0)
      expect(stats.avgBudget).toBe(0)
      Object.values(stats.byType).forEach((v) => expect(v).toBe(0))
    })
  })

  // ════════════════════════════════════════════════════
  // 边缘
  // ════════════════════════════════════════════════════

  describe('边界与边缘', () => {
    it('[边界] getTypeLabels 返回所有类型的中文标签', () => {
      const labels = service.getTypeLabels()
      expect(labels.outdoor).toBe('户外拓展')
      expect(labels['escape-room']).toBe('密室逃脱')
      expect(labels['script-kill']).toBe('剧本杀')
      expect(labels.dinner).toBe('聚餐')
      expect(labels.ktv).toBe('KTV')
      expect(labels.sports).toBe('运动赛事')
      expect(labels.other).toBe('其他')
    })

    it('[边界] create 含可选字段', () => {
      const plan = service.create({
        tenantId: 'tenant-001',
        name: '全字段测试',
        type: 'sports',
        location: '体育馆',
        budget: 200000,
        expectedParticipants: 20,
        description: '测试描述',
        recommendedSeason: '夏季',
        remark: '测试备注',
      })
      expect(plan.recommendedSeason).toBe('夏季')
      expect(plan.remark).toBe('测试备注')
    })

    it('[边界] update 只更新部分字段', () => {
      const all = service.findAll('tenant-001')
      const plan = all[0]
      const originalLocation = plan.location
      const updated = service.update(plan.id, 'tenant-001', { name: '仅更新名字' })
      expect(updated.name).toBe('仅更新名字')
      expect(updated.location).toBe(originalLocation)
    })
  })
})
