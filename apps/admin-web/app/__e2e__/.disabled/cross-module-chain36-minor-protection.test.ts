/**
 * 🐜 树哥C L3 跨模块端到端 · 链36 (V24 Phase2 新增)
 * 未成年保护验收链 — 注册/年龄验证/家长同意/消费限制/盲盒拦截/内容分级
 *
 * 新增于 2026-07-29 01:18 凌晨时段
 */

import { describe, it, expect } from 'vitest'

describe('🔗 Chain36: 未成年保护 — 注册→验证→限制→拦截', () => {
  // ════════════════════════════════════════════════════════
  //  用户注册 + 年龄自动识别
  // ════════════════════════════════════════════════════════

  describe('注册与年龄识别', () => {
    it('C36-01 [P] 未成年人注册 — POST /minor-protection/profile → child分组', async () => {
      const res = await fetch('/api/minor-protection/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'minor-001', tenantId: 't001',
          birthDate: '2015-05-15',  // 11岁 → child
        }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.ageGroup).toBe('child')
      expect(body.age).toBe(11)
      expect(body.restrictions).toContain('blindbox_limit')
    })

    it('C36-02 [P] 青少年注册 — 14岁 → teen分组', async () => {
      const res = await fetch('/api/minor-protection/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'minor-002', tenantId: 't001',
          birthDate: '2012-01-01',  // 14岁 → teen
        }),
      })
      const body = await res.json()
      expect(body.ageGroup).toBe('teen')
      expect(body.dailySpendLimit).toBe(200)
    })

    it('C36-03 [P] 成年人注册 — 25岁 → adult分组，无限制', async () => {
      const res = await fetch('/api/minor-protection/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'adult-001', tenantId: 't001',
          birthDate: '2001-01-01',
        }),
      })
      const body = await res.json()
      expect(body.ageGroup).toBe('adult')
      expect(body.restrictions).toHaveLength(0)
    })
  })

  // ════════════════════════════════════════════════════════
  //  年龄验证
  // ════════════════════════════════════════════════════════

  describe('年龄验证', () => {
    it('C36-04 [P] 身份证验证 — POST verify → ageVerified=true', async () => {
      await fetch('/api/minor-protection/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'verify-001', tenantId: 't001', birthDate: '2008-06-01' }),
      })
      const res = await fetch('/api/minor-protection/profile/verify-001/verify', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'id_card' }),
      })
      const body = await res.json()
      expect(body.ageVerified).toBe(true)
      expect(body.verificationMethod).toBe('id_card')
    })
  })

  // ════════════════════════════════════════════════════════
  //  家长同意书
  // ════════════════════════════════════════════════════════

  describe('家长同意书', () => {
    it('C36-05 [P] 创建家长同意书 → pending状态', async () => {
      const res = await fetch('/api/minor-protection/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minorUserId: 'minor-001', parentUserId: 'parent-001',
          parentName: '张爸爸', parentIdCard: '310101198001011234',
          relationship: '父亲', consentType: 'full',
        }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.status).toBe('pending')
    })

    it('C36-06 [P] 审批同意 → 解除限制', async () => {
      const create = await fetch('/api/minor-protection/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minorUserId: 'minor-002', parentUserId: 'parent-002',
          parentName: '李妈妈', parentIdCard: '310101198502021234',
          relationship: '母亲', consentType: 'full',
        }),
      })
      const { id } = await create.json()

      const approve = await fetch(`/api/minor-protection/consent/${id}/approve`, { method: 'POST' })
      expect(approve.status).toBe(201)
      const approved = await approve.json()
      expect(approved.status).toBe('approved')

      // 验证限制已解除
      const profile = await fetch('/api/minor-protection/profile/minor-002')
      const p = await profile.json()
      expect(p.restrictions).toHaveLength(0)
    })
  })

  // ════════════════════════════════════════════════════════
  //  消费限制
  // ════════════════════════════════════════════════════════

  describe('消费限制', () => {
    it('C36-07 [P] 未成年人消费 ≤ 限额 → allowed', async () => {
      const res = await fetch('/api/minor-protection/check/minor-001/spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 20 }),  // child 限额 ¥50
      })
      const body = await res.json()
      expect(body.allowed).toBe(true)
    })

    it('C36-08 [B] 未成年人消费 > 限额 → blocked', async () => {
      const res = await fetch('/api/minor-protection/check/minor-001/spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 200 }),  // > ¥50 限额
      })
      const body = await res.json()
      expect(body.allowed).toBe(false)
      expect(body.reason).toContain('消费限额')
    })
  })

  // ════════════════════════════════════════════════════════
  //  盲盒拦截
  // ════════════════════════════════════════════════════════

  describe('盲盒拦截', () => {
    it('C36-09 [P] 未成年人访问盲盒 → blocked', async () => {
      const res = await fetch('/api/minor-protection/check/minor-001/blindbox')
      const body = await res.json()
      expect(body.allowed).toBe(false)
      expect(body.reason).toContain('盲盒')
    })

    it('C36-10 [P] 成年人访问盲盒 → allowed', async () => {
      const res = await fetch('/api/minor-protection/check/adult-001/blindbox')
      const body = await res.json()
      expect(body.allowed).toBe(true)
    })
  })

  // ════════════════════════════════════════════════════════
  //  内容分级
  // ════════════════════════════════════════════════════════

  describe('内容分级', () => {
    it('C36-11 [P] Child 查看 PG内容 → allowed', async () => {
      const res = await fetch('/api/minor-protection/check/minor-001/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: 'PG' }),
      })
      const body = await res.json()
      expect(body.allowed).toBe(true)
    })

    it('C36-12 [B] Child 查看 R内容 → blocked', async () => {
      const res = await fetch('/api/minor-protection/check/minor-001/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: 'R' }),
      })
      const body = await res.json()
      expect(body.allowed).toBe(false)
    })
  })

  // ════════════════════════════════════════════════════════
  //  时长限制
  // ════════════════════════════════════════════════════════

  describe('时长限制', () => {
    it('C36-13 [P] Child 使用 10min → allowed (剩余30min)', async () => {
      const res = await fetch('/api/minor-protection/check/minor-001/time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionDurationMin: 10 }),
      })
      const body = await res.json()
      expect(body.allowed).toBe(true)
      expect(body.remainingMinutes).toBeGreaterThan(0)
    })

    it('C36-14 [B] Child 使用 60min → blocked (超过40min限额)', async () => {
      // 先消耗部分时长
      await fetch('/api/minor-protection/record/minor-001/time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionDurationMin: 35 }),
      })

      const res = await fetch('/api/minor-protection/check/minor-001/time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionDurationMin: 10 }),
      })
      const body = await res.json()
      // 35 + 10 > 40 → blocked
      expect(body.allowed).toBe(false)
    })
  })

  // ════════════════════════════════════════════════════════
  //  使用报告
  // ════════════════════════════════════════════════════════

  describe('使用报告', () => {
    it('C36-15 [P] 查询使用报告 — GET /report → 汇总', async () => {
      const res = await fetch('/api/minor-protection/report/minor-001?startDate=2026-07-01&endDate=2026-07-29')
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.totalMinutes).toBeDefined()
      expect(body.totalSpend).toBeDefined()
      expect(body.sessions).toBeDefined()
    })
  })
})
