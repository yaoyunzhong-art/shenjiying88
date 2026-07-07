import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import {
  MemberDormancyService,
  MemberLifecycleStage
} from './member-dormancy.service'
import { MemberConfigService, DEFAULT_MEMBER_CONFIG } from './member-config'
import { resetMemberServiceTestState } from './member.service'
import type { MemberProfile } from './member.entity'

/**
 * Phase-36 T166-2: Member 休眠状态机 · 单元测试
 *
 * 覆盖 (≥ 8 断言):
 *  - AC-1: 状态枚举 + 默认值 (ACTIVE)
 *  - AC-2: ACTIVE→DORMANT after dormantDays
 *  - AC-2: DORMANT→CHURNED after churnedDays
 *  - AC-2: ACTIVE→CHURNED 跳级非法抛 400
 *  - AC-3: 配置变更后阈值变更 (dormantDays=10)
 *  - AC-7: reactivate 任意→ACTIVE 重置 lastActiveAt
 *  - AC-7: reactivate 记录 lifecycleHistory
 *  - AC-7: CHURNED→ACTIVE 仅通过 reactivate 允许
 *  - AC-4: scan 返回 counts { dormant, churned }
 *  - AC-5: stats active/dormant/churned 计数
 *  - 反模式 v4 cron-job-pitfall: 重入锁 skip
 */

function makeMember(overrides: Partial<MemberProfile> = {}): MemberProfile {
  const now = new Date().toISOString()
  return {
    memberId: `m-${Math.random().toString(36).slice(2, 10)}`,
    tenantContext: { tenantId: 't1' } as MemberProfile['tenantContext'],
    nickname: 'Test',
    level: 'BRONZE' as MemberProfile['level'],
    status: 'ACTIVE' as MemberProfile['status'],
    points: 0,
    registeredAt: now,
    lastActiveAt: now,
    ...overrides
  } as MemberProfile
}

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

describe('MemberDormancyService', () => {
  let memberService: any
  let configService: MemberConfigService
  let dormancy: MemberDormancyService

  beforeEach(() => {
    resetMemberServiceTestState()
    configService = new MemberConfigService()
    // Mock memberService with minimal interface
    const members: MemberProfile[] = []
    memberService = {
      listProfiles: () => members,
      getProfile: (id: string) => members.find((m) => m.memberId === id),
      register: (input: any) => {
        const m = makeMember({ memberId: input.memberId, ...input })
        members.push(m)
        return m
      }
    }
    dormancy = new MemberDormancyService(memberService, configService)
  })

  it('AC-1: 默认 lifecycleStage 是 ACTIVE', () => {
    const m = makeMember()
    assert.equal(dormancy.getLifecycleStage(m), MemberLifecycleStage.Active)
  })

  it('AC-2: ACTIVE→DORMANT after dormantDays (90d)', async () => {
    const m = memberService.register({
      memberId: 'm1',
      tenantContext: { tenantId: 't1' },
      nickname: 'Alice',
      lastActiveAt: daysAgo(91)  // 91 天前
    })
    const result = await dormancy.scanAndPromote()
    assert.equal(result.dormantPromoted, 1)
    assert.equal(result.churnedPromoted, 0)
    assert.equal(dormancy.getLifecycleStage(m), MemberLifecycleStage.Dormant)
  })

  it('AC-2: DORMANT→CHURNED after churnedDays (180d)', async () => {
    const m = memberService.register({
      memberId: 'm2',
      tenantContext: { tenantId: 't1' },
      nickname: 'Bob',
      lastActiveAt: daysAgo(181)
    })
    // 第一轮: ACTIVE→DORMANT
    await dormancy.scanAndPromote()
    assert.equal(dormancy.getLifecycleStage(m), MemberLifecycleStage.Dormant)
    // 第二轮: DORMANT→CHURNED (时间已过 181d > 180d)
    const r2 = await dormancy.scanAndPromote()
    assert.equal(r2.churnedPromoted, 1)
    assert.equal(dormancy.getLifecycleStage(m), MemberLifecycleStage.Churned)
  })

  it('AC-2: ACTIVE→CHURNED 跳级非法抛 400', async () => {
    const m = memberService.register({
      memberId: 'm3',
      tenantContext: { tenantId: 't1' },
      nickname: 'Carol'
    })
    // 直接 transition ACTIVE→CHURNED 应抛错
    assert.throws(
      () => (dormancy as any).transition(m, MemberLifecycleStage.Churned, 'illegal skip'),
      /cannot skip DORMANT stage/
    )
  })

  it('AC-3: 配置变更 dormantDays=10 后下次扫描立即生效', async () => {
    const m = memberService.register({
      memberId: 'm4',
      tenantContext: { tenantId: 't1' },
      nickname: 'Dave',
      lastActiveAt: daysAgo(15)
    })
    // 默认 90d: 不应转为 Dormant
    let r = await dormancy.scanAndPromote()
    assert.equal(r.dormantPromoted, 0)
    assert.equal(dormancy.getLifecycleStage(m), MemberLifecycleStage.Active)

    // 改 dormantDays=10
    configService.updateConfig(
      { lifecycle: { dormantDays: 10, churnedDays: 180 } },
      'admin',
      'fast dormancy test'
    )
    r = await dormancy.scanAndPromote()
    assert.equal(r.dormantPromoted, 1)
    assert.equal(dormancy.getLifecycleStage(m), MemberLifecycleStage.Dormant)
  })

  it('AC-7: reactivate 任意→ACTIVE 重置 lastActiveAt', () => {
    const m = memberService.register({
      memberId: 'm5',
      tenantContext: { tenantId: 't1' },
      nickname: 'Eve',
      lastActiveAt: daysAgo(200)  // 很久没活跃
    })
    const before = m.lastActiveAt
    dormancy.reactivate('m5', 't1', 'test')
    assert.equal(dormancy.getLifecycleStage(m), MemberLifecycleStage.Active)
    assert.notEqual(m.lastActiveAt, before, 'lastActiveAt should be reset')
    assert.ok(new Date(m.lastActiveAt!).getTime() > Date.now() - 5000)
  })

  it('AC-7: reactivate 记录 lifecycleHistory entry', async () => {
    const m = memberService.register({
      memberId: 'm6',
      tenantContext: { tenantId: 't1' },
      nickname: 'Frank',
      lastActiveAt: daysAgo(200)
    })
    // 先推进到 DORMANT (这样 reactivate 才会产生 transition)
    await dormancy.scanAndPromote()
    assert.equal(dormancy.getLifecycleStage(m), MemberLifecycleStage.Dormant)
    // 现在 reactivate 应该有 DORMANT→ACTIVE 的历史记录
    dormancy.reactivate('m6', 't1', 'promotion')
    const ext = m as MemberProfile & { _lifecycleHistory?: any[] }
    assert.ok(ext._lifecycleHistory && ext._lifecycleHistory.length >= 2)
    const last = ext._lifecycleHistory![ext._lifecycleHistory!.length - 1]
    assert.equal(last.to, MemberLifecycleStage.Active)
    assert.equal(last.reason, 'promotion')
    assert.equal(last.from, MemberLifecycleStage.Dormant)
  })

  it('AC-7: CHURNED→ACTIVE 仅通过 reactivate 允许 (业务可控)', async () => {
    const m = memberService.register({
      memberId: 'm7',
      tenantContext: { tenantId: 't1' },
      nickname: 'Grace',
      lastActiveAt: daysAgo(365)
    })
    await dormancy.scanAndPromote()  // → DORMANT
    await dormancy.scanAndPromote()  // → CHURNED
    assert.equal(dormancy.getLifecycleStage(m), MemberLifecycleStage.Churned)
    // reactivate: CHURNED → ACTIVE 允许
    dormancy.reactivate('m7', 't1', 'win-back campaign')
    assert.equal(dormancy.getLifecycleStage(m), MemberLifecycleStage.Active)
  })

  it('AC-4: scan 返回 counts { dormant, churned, scannedCount, durationMs, configSnapshot }', async () => {
    memberService.register({
      memberId: 'm8a',
      tenantContext: { tenantId: 't1' },
      nickname: 'A',
      lastActiveAt: daysAgo(91)  // → DORMANT
    })
    memberService.register({
      memberId: 'm8b',
      tenantContext: { tenantId: 't1' },
      nickname: 'B',
      lastActiveAt: daysAgo(181)  // → DORMANT then CHURNED
    })
    memberService.register({
      memberId: 'm8c',
      tenantContext: { tenantId: 't1' },
      nickname: 'C',
      lastActiveAt: daysAgo(30)  // → ACTIVE (未达 90d)
    })
    const r1 = await dormancy.scanAndPromote()
    assert.equal(r1.scannedCount, 3)
    assert.equal(r1.dormantPromoted, 2)
    assert.equal(r1.churnedPromoted, 0)
    assert.ok(r1.durationMs >= 0)
    assert.deepEqual(r1.configSnapshot, { dormantDays: 90, churnedDays: 180 })

    const r2 = await dormancy.scanAndPromote()
    assert.equal(r2.churnedPromoted, 1)  // m8b → CHURNED
  })

  it('AC-5: stats 计数 active/dormant/churned', async () => {
    memberService.register({
      memberId: 'm9a',
      tenantContext: { tenantId: 't1' },
      nickname: 'A',
      lastActiveAt: daysAgo(30)  // ACTIVE (未达 90d)
    })
    memberService.register({
      memberId: 'm9b',
      tenantContext: { tenantId: 't1' },
      nickname: 'B',
      lastActiveAt: daysAgo(100)  // → DORMANT (90+d)
    })
    memberService.register({
      memberId: 'm9c',
      tenantContext: { tenantId: 't1' },
      nickname: 'C',
      lastActiveAt: daysAgo(200)  // → DORMANT (单次 scan 不可跳级)
    })
    // 第一轮: ACTIVE→DORMANT (90+d 才进 DORMANT)
    await dormancy.scanAndPromote()
    // 第二轮: DORMANT→CHURNED (180+d 才进 CHURNED)
    await dormancy.scanAndPromote()
    const stats = dormancy.getStats('t1')
    assert.equal(stats.total, 3)
    assert.equal(stats.active, 1, 'm9a 应该 ACTIVE')
    assert.equal(stats.dormant, 1, 'm9b 应该 DORMANT (100d < 180d)')
    assert.equal(stats.churned, 1, 'm9c 应该 CHURNED (200d > 180d)')
  })

  it('反模式 v4 cron-job-pitfall: 重入锁 skip', async () => {
    // 第一次扫描不 await, 模拟 cron 触发
    const r1Promise = dormancy.scanAndPromote()
    // 第二次扫描应立即返回 skip
    const r2 = await dormancy.scanAndPromote()
    assert.equal(r2.scannedCount, 0)
    assert.equal(r2.dormantPromoted, 0)
    assert.equal(r2.churnedPromoted, 0)
    await r1Promise  // 等待第一轮结束
  })

  it('反模式 v4: recordActivity 自动唤醒 CHURNED→ACTIVE', () => {
    const m = memberService.register({
      memberId: 'm10',
      tenantContext: { tenantId: 't1' },
      nickname: 'Henry',
      lastActiveAt: daysAgo(365)
    })
    // 手动标记 CHURNED (模拟)
    ;(m as any)._lifecycleStage = MemberLifecycleStage.Churned
    assert.equal(dormancy.getLifecycleStage(m), MemberLifecycleStage.Churned)
    // 记录活跃行为
    dormancy.recordActivity(m)
    assert.equal(dormancy.getLifecycleStage(m), MemberLifecycleStage.Active)
  })

  it('防御: 跨租户 reactivate 抛 BadRequestException', () => {
    memberService.register({
      memberId: 'm11',
      tenantContext: { tenantId: 't1' },
      nickname: 'Ivy',
      lastActiveAt: daysAgo(100)
    })
    assert.throws(
      () => dormancy.reactivate('m11', 't2', 'illegal'),
      /different tenant/
    )
  })

  it('防御: 不存在的 memberId reactivate 抛 NotFoundException', () => {
    assert.throws(
      () => dormancy.reactivate('not-exist', 't1', 'test'),
      /not found/
    )
  })

  it('防御: 默认配置 dormantDays/churnedDays 不为硬编码异常值', () => {
    assert.equal(DEFAULT_MEMBER_CONFIG.lifecycle.dormantDays, 90)
    assert.equal(DEFAULT_MEMBER_CONFIG.lifecycle.churnedDays, 180)
    assert.ok(
      DEFAULT_MEMBER_CONFIG.lifecycle.dormantDays < DEFAULT_MEMBER_CONFIG.lifecycle.churnedDays,
      'dormantDays must be < churnedDays'
    )
  })
})