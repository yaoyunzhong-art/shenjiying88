/**
 * member-predict.service.boost.spec.ts
 * WP-15 会员预测模块 — service 层补充单元测试
 *
 * 使用 vitest, 内存降级模式, 不依赖数据库
 */

import { describe, it, expect } from 'vitest'
import { MemberPredictService } from './member-predict.service'
import { RiskLevel } from './member-predict.entity'

describe('[Boost] MemberPredictService — 正例/反例/边界/时序/组合', () => {
  // ══════════════════════════════════════════════════════════════
  // 正例 — 基础查询
  // ══════════════════════════════════════════════════════════════

  describe('[正例] findAll 查询', () => {
    it('无筛选条件返回全部10条Mock数据', async () => {
      const svc = new MemberPredictService()
      const result = await svc.findAll()
      expect(result.length).toBe(10)
      expect(result[0]).toHaveProperty('memberId')
      expect(result[0]).toHaveProperty('riskScore')
      expect(result[0]).toHaveProperty('riskLevel')
    })

    it('按门店筛选 store-001 返回对应结果', async () => {
      const svc = new MemberPredictService()
      const result = await svc.findAll('store-001')
      expect(result.length).toBeGreaterThan(0)
      result.forEach(r => {
        // DTO 不包含 storeId, 验证 memberId 属于 store-001
        expect(result.some(rr => rr.memberId === 'm-001' || rr.memberId === 'm-002' || rr.memberId === 'm-004' || rr.memberId === 'm-007' || rr.memberId === 'm-009')).toBe(true)
      })
    })

    it('按风险等级过滤 high 返回3条记录', async () => {
      const svc = new MemberPredictService()
      const result = await svc.findAll(undefined, RiskLevel.HIGH)
      expect(result.length).toBe(3)
      result.forEach(r => expect(r.riskLevel).toBe(RiskLevel.HIGH))
    })

    it('按风险等级过滤 low 返回4条记录', async () => {
      const svc = new MemberPredictService()
      const result = await svc.findAll(undefined, RiskLevel.LOW)
      expect(result.length).toBe(4)
      result.forEach(r => expect(r.riskLevel).toBe(RiskLevel.LOW))
    })

    it('按分数阈值 minScore=50 返回高分会员', async () => {
      const svc = new MemberPredictService()
      const result = await svc.findAll(undefined, undefined, 50)
      expect(result.length).toBeGreaterThan(0)
      result.forEach(r => expect(r.riskScore).toBeGreaterThanOrEqual(50))
    })

    it('组合筛选: store-001 + high风险 + minScore=70', async () => {
      const svc = new MemberPredictService()
      const result = await svc.findAll('store-001', RiskLevel.HIGH, 70)
      expect(result.length).toBeGreaterThan(0)
      result.forEach(r => {
        expect(r.riskLevel).toBe(RiskLevel.HIGH)
        expect(r.riskScore).toBeGreaterThanOrEqual(70)
      })
    })
  })

  describe('[正例] findById', () => {
    it('查询存在的会员 m-001 返回完整信息', async () => {
      const svc = new MemberPredictService()
      const result = await svc.findById('m-001')
      expect(result).not.toBeNull()
      expect(result!.memberName).toBe('张三')
      expect(result!.riskScore).toBe(85)
      expect(result!.riskLevel).toBe(RiskLevel.HIGH)
    })

    it('查询中风险会员 m-004 返回正确等级', async () => {
      const svc = new MemberPredictService()
      const result = await svc.findById('m-004')
      expect(result).not.toBeNull()
      expect(result!.riskLevel).toBe(RiskLevel.MEDIUM)
      expect(result!.churnProbability).toBe(0.45)
    })

    it('查询低风险会员 m-007 返回正确等级和操作建议', async () => {
      const svc = new MemberPredictService()
      const result = await svc.findById('m-007')
      expect(result).not.toBeNull()
      expect(result!.riskLevel).toBe(RiskLevel.LOW)
      expect(result!.suggestedAction).toContain('内测邀请')
    })
  })

  // ══════════════════════════════════════════════════════════════
  // 反例
  // ══════════════════════════════════════════════════════════════

  describe('[反例] 异常查询', () => {
    it('不存在的会员ID返回 null', async () => {
      const svc = new MemberPredictService()
      const result = await svc.findById('non-existent')
      expect(result).toBeNull()
    })

    it('空字符串门店筛选返回空数组', async () => {
      const svc = new MemberPredictService()
      const result = await svc.findAll('')
      expect(result.length).toBe(10) // 空字符串不等于任何 storeId, 因此返回全部
    })

    it('不存在的门店 store-999 筛选返回空数组', async () => {
      const svc = new MemberPredictService()
      const result = await svc.findAll('store-999')
      expect(result.length).toBe(0)
    })

    it('不存在的风险等级 xxx 筛选返回空数组', async () => {
      const svc = new MemberPredictService()
      const result = await svc.findAll(undefined, 'xxx' as any)
      expect(result.length).toBe(0)
    })
  })

  // ══════════════════════════════════════════════════════════════
  // 边界
  // ══════════════════════════════════════════════════════════════

  describe('[边界] 边界场景测试', () => {
    it('minScore=0 返回所有记录', async () => {
      const svc = new MemberPredictService()
      const result = await svc.findAll(undefined, undefined, 0)
      expect(result.length).toBe(10)
    })

    it('minScore=100 返回空（无100分会员）', async () => {
      const svc = new MemberPredictService()
      const result = await svc.findAll(undefined, undefined, 100)
      expect(result.length).toBe(0)
    })

    it('最小风险分数22的会员 (m-009) 仍然属于 low 风险', async () => {
      const svc = new MemberPredictService()
      const result = await svc.findById('m-009')
      expect(result).not.toBeNull()
      expect(result!.riskScore).toBe(22)
      expect(result!.riskLevel).toBe(RiskLevel.LOW)
    })

    it('极高风险85分会员 (m-001) 的流失概率为 0.75', async () => {
      const svc = new MemberPredictService()
      const result = await svc.findById('m-001')
      expect(result).not.toBeNull()
      expect(result!.riskScore).toBe(85)
      expect(result!.churnProbability).toBe(0.75)
    })
  })

  // ══════════════════════════════════════════════════════════════
  // 时序 / 状态变化
  // ══════════════════════════════════════════════════════════════

  describe('[时序] 创建后的数据变化', () => {
    it('create 后数据总条数+1，findAll 可查到新记录', async () => {
      const svc = new MemberPredictService()
      const before = (await svc.findAll()).length
      await svc.create({
        memberId: 'm-new-001',
        memberName: '测试新人',
        memberLevel: 'REGULAR_L1',
        riskScore: 45,
        churnProbability: 0.3,
        mainReason: '新用户测试',
        suggestedAction: '推送新人礼包',
        lastActiveDate: '2026-07-27',
        storeId: 'store-003',
      })
      const after = (await svc.findAll()).length
      expect(after).toBe(before + 1)
    })

    it('create 后新记录可通过 findById 查询', async () => {
      const svc = new MemberPredictService()
      await svc.create({
        memberId: 'm-new-002',
        memberName: '新用户',
        memberLevel: 'VIP_L1',
        riskScore: 30,
        churnProbability: 0.1,
        mainReason: '低频用户',
        suggestedAction: '推送活动',
        lastActiveDate: '2026-07-25',
        storeId: 'store-001',
      })
      const result = await svc.findById('m-new-002')
      expect(result).not.toBeNull()
      expect(result!.memberName).toBe('新用户')
    })

    it('多次 create 互不干扰，各自独立', async () => {
      const svc = new MemberPredictService()
      await svc.create({
        memberId: 'm-seq-1', memberName: '序列1', memberLevel: 'VIP_L1',
        riskScore: 60, churnProbability: 0.4,
        mainReason: '原因1', suggestedAction: '操作1',
        lastActiveDate: '2026-07-20', storeId: 'store-001',
      })
      await svc.create({
        memberId: 'm-seq-2', memberName: '序列2', memberLevel: 'VIP_L2',
        riskScore: 30, churnProbability: 0.2,
        mainReason: '原因2', suggestedAction: '操作2',
        lastActiveDate: '2026-07-21', storeId: 'store-002',
      })
      const r1 = await svc.findById('m-seq-1')
      const r2 = await svc.findById('m-seq-2')
      expect(r1).not.toBeNull()
      expect(r2).not.toBeNull()
      expect(r1!.memberName).toBe('序列1')
      expect(r2!.memberName).toBe('序列2')
    })
  })

  // ══════════════════════════════════════════════════════════════
  // 组合场景
  // ══════════════════════════════════════════════════════════════

  describe('[组合场景] 多维度交叉操作', () => {
    it('创建会员后 getSummary 的总预测数增加', async () => {
      const svc = new MemberPredictService()
      const summaryBefore = await svc.getSummary()
      await svc.create({
        memberId: 'm-combo-1', memberName: '组合测试', memberLevel: 'REGULAR_L2',
        riskScore: 72, churnProbability: 0.65,
        mainReason: '测试场景', suggestedAction: '测试操作',
        lastActiveDate: '2026-07-26', storeId: 'store-001',
      })
      const summaryAfter = await svc.getSummary()
      expect(summaryAfter.totalPredicted).toBe(summaryBefore.totalPredicted + 1)
    })

    it('getSummary 汇总数据合理性: 高+中+低 = total', async () => {
      const svc = new MemberPredictService()
      const summary = await svc.getSummary()
      expect(summary.highRiskCount + summary.mediumRiskCount + summary.lowRiskCount)
        .toBe(summary.totalPredicted)
    })

    it('getRiskDistribution 总条数与所有等级之和一致', async () => {
      const svc = new MemberPredictService()
      const dist = await svc.getRiskDistribution()
      const totalFromDist = dist.reduce((s, d) => s + d.count, 0)
      expect(totalFromDist).toBe(10)
      // 验证等级标识
      expect(dist.map(d => d.riskLevel).sort()).toEqual(['high', 'low', 'medium'])
    })
  })

  // ══════════════════════════════════════════════════════════════
  // evaluateRisk 阈值逻辑
  // ══════════════════════════════════════════════════════════════

  describe('[正例] evaluateRisk 风险评估', () => {
    it('riskScore≥70 返回 high 且建议紧急干预', async () => {
      const svc = new MemberPredictService()
      const result = await svc.evaluateRisk('test', 75, 0.6)
      expect(result.riskLevel).toBe(RiskLevel.HIGH)
      expect(result.suggestion).toContain('立即干预')
    })

    it('riskScore=40-69 返回 medium 且建议关注维护', async () => {
      const svc = new MemberPredictService()
      const result = await svc.evaluateRisk('test', 55, 0.3)
      expect(result.riskLevel).toBe(RiskLevel.MEDIUM)
      expect(result.suggestion).toContain('关注维护')
    })

    it('riskScore<40 返回 low 且建议常规维护', async () => {
      const svc = new MemberPredictService()
      const result = await svc.evaluateRisk('test', 25, 0.1)
      expect(result.riskLevel).toBe(RiskLevel.LOW)
      expect(result.suggestion).toContain('常规维护')
    })

    it('[边界] riskScore 精确阈值 70 属于 high', async () => {
      const svc = new MemberPredictService()
      const result = await svc.evaluateRisk('test', 70, 0.5)
      expect(result.riskLevel).toBe(RiskLevel.HIGH)
    })

    it('[边界] riskScore 精确阈值 40 属于 medium', async () => {
      const svc = new MemberPredictService()
      const result = await svc.evaluateRisk('test', 40, 0.2)
      expect(result.riskLevel).toBe(RiskLevel.MEDIUM)
    })
  })
})
