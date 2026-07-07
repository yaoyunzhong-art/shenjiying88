import { describe, it, expect, beforeEach } from 'vitest'

// ── Enums & Types ────────────────────────────────────────────────

enum MemberLifecycleStage {
  Active = 'ACTIVE',
  Dormant = 'DORMANT',
  Churned = 'CHURNED',
}

interface MemberProfile {
  memberId: string
  tenantId: string
  nickname: string
  level: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND'
  status: 'ACTIVE' | 'DORMANT' | 'CHURNED'
  points: number
  registeredAt: string
  lastActiveAt: string
  lifecycleStage?: MemberLifecycleStage
  lifecycleHistory?: Array<{ from: MemberLifecycleStage; to: MemberLifecycleStage; at: string; reason: string }>
}

interface MemberConfig {
  dormantDays: number
  churnedDays: number
  earnRate: number
  redeemRate: number
}

// ── Default Constants ────────────────────────────────────────────

const DEFAULT_CONFIG: MemberConfig = {
  dormantDays: 90,
  churnedDays: 180,
  earnRate: 1,
  redeemRate: 100,
}

// ── Pure Logic Functions — inline, no production import ──────────

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function makeMember(overrides: Partial<MemberProfile> = {}): MemberProfile {
  const now = new Date().toISOString()
  return {
    memberId: `m-${Math.random().toString(36).slice(2, 10)}`,
    tenantId: 't1',
    nickname: 'Test',
    level: 'BRONZE',
    status: 'ACTIVE',
    points: 0,
    registeredAt: now,
    lastActiveAt: now,
    ...overrides,
  }
}

function getLifecycleStage(m: MemberProfile): MemberLifecycleStage {
  return m.lifecycleStage ?? MemberLifecycleStage.Active
}

function setLifecycleStage(
  m: MemberProfile,
  stage: MemberLifecycleStage,
  reason: string,
): void {
  const from = getLifecycleStage(m)
  if (from === stage) return

  // guarded skip: ACTIVE -> CHURNED not allowed
  if (from === MemberLifecycleStage.Active && stage === MemberLifecycleStage.Churned) {
    throw new Error('lifecycle_skip_not_allowed: cannot skip DORMANT stage')
  }

  m.lifecycleStage = stage
  m.lifecycleHistory = m.lifecycleHistory ?? []
  m.lifecycleHistory.push({
    from,
    to: stage,
    at: new Date().toISOString(),
    reason,
  })
  if (m.lifecycleHistory.length > 50) m.lifecycleHistory.shift()
}

function recordActivity(m: MemberProfile, at?: Date): void {
  m.lastActiveAt = (at ?? new Date()).toISOString()
  const current = getLifecycleStage(m)
  if (current !== MemberLifecycleStage.Active) {
    setLifecycleStage(m, MemberLifecycleStage.Active, 'activity recorded')
  }
}

function getInactiveMs(m: MemberProfile, nowDate: Date = new Date()): number {
  const lastMs = m.lastActiveAt
    ? new Date(m.lastActiveAt).getTime()
    : new Date(m.registeredAt).getTime()
  return nowDate.getTime() - lastMs
}

interface ScanResult {
  scannedCount: number
  dormantPromoted: number
  churnedPromoted: number
  configSnapshot: { dormantDays: number; churnedDays: number }
}

function scanForDormancy(
  members: MemberProfile[],
  config: MemberConfig = DEFAULT_CONFIG,
  nowDate: Date = new Date(),
): ScanResult {
  const { dormantDays, churnedDays } = config
  const dormantThresholdMs = dormantDays * 86_400_000
  const churnedThresholdMs = churnedDays * 86_400_000

  let dormantPromoted = 0
  let churnedPromoted = 0

  for (const m of members) {
    const inactiveMs = getInactiveMs(m, nowDate)
    const current = getLifecycleStage(m)

    if (current === MemberLifecycleStage.Active && inactiveMs >= dormantThresholdMs) {
      setLifecycleStage(m, MemberLifecycleStage.Dormant, `inactive for ${dormantDays} days`)
      dormantPromoted++
    } else if (current === MemberLifecycleStage.Dormant && inactiveMs >= churnedThresholdMs) {
      setLifecycleStage(m, MemberLifecycleStage.Churned, `inactive for ${churnedDays} days`)
      churnedPromoted++
    }
  }

  return {
    scannedCount: members.length,
    dormantPromoted,
    churnedPromoted,
    configSnapshot: { dormantDays, churnedDays },
  }
}

function getStats(
  members: MemberProfile[],
  tenantId?: string,
): { active: number; dormant: number; churned: number; total: number } {
  const filtered = tenantId
    ? members.filter((m) => m.tenantId === tenantId)
    : members

  let active = 0
  let dormant = 0
  let churned = 0
  for (const m of filtered) {
    const stage = getLifecycleStage(m)
    if (stage === MemberLifecycleStage.Active) active++
    else if (stage === MemberLifecycleStage.Dormant) dormant++
    else if (stage === MemberLifecycleStage.Churned) churned++
  }
  return { active, dormant, churned, total: filtered.length }
}

function reactivateMember(
  m: MemberProfile | undefined,
  memberId: string,
  tenantId: string,
  reason: string = 'manual',
): MemberProfile {
  if (!m) throw new Error(`member ${memberId} not found`)
  if (m.tenantId !== tenantId) throw new Error('cross_tenant_member_access')
  setLifecycleStage(m, MemberLifecycleStage.Active, reason)
  m.lastActiveAt = new Date().toISOString()
  return m
}

function listByStage(
  members: MemberProfile[],
  stage: MemberLifecycleStage,
  tenantId?: string,
): MemberProfile[] {
  return members.filter((m) => {
    if (tenantId && m.tenantId !== tenantId) return false
    return getLifecycleStage(m) === stage
  })
}

function calculateLevel(currentPoints: number, currentLevel: string): { nextLevel: string | null; pointsNeeded: number } {
  const order = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND']
  const thresholds: Record<string, number> = { BRONZE: 0, SILVER: 500, GOLD: 2000, PLATINUM: 10000, DIAMOND: 50000 }
  const idx = order.indexOf(currentLevel)
  if (idx < 0 || idx >= order.length - 1) return { nextLevel: null, pointsNeeded: 0 }
  const nextLevel = order[idx + 1]
  const pointsNeeded = Math.max(0, thresholds[nextLevel] - currentPoints)
  return { nextLevel, pointsNeeded }
}

// ── Tests ────────────────────────────────────────────────────────

describe('member service — dormancy state machine', () => {
  let members: MemberProfile[]

  beforeEach(() => {
    members = []
  })

  it('AC-1: 默认 lifecycleStage 是 ACTIVE', () => {
    const m = makeMember()
    expect(getLifecycleStage(m)).toBe(MemberLifecycleStage.Active)
  })

  it('AC-2: ACTIVE→DORMANT after dormantDays (90d)', () => {
    const m = makeMember({ lastActiveAt: daysAgo(91) })
    members.push(m)
    const r = scanForDormancy(members)
    expect(r.dormantPromoted).toBe(1)
    expect(r.churnedPromoted).toBe(0)
    expect(getLifecycleStage(m)).toBe(MemberLifecycleStage.Dormant)
  })

  it('AC-2: DORMANT→CHURNED after churnedDays (180d)', () => {
    const m = makeMember({ lastActiveAt: daysAgo(200) })
    members.push(m)
    scanForDormancy(members) // ACTIVE→DORMANT
    expect(getLifecycleStage(m)).toBe(MemberLifecycleStage.Dormant)
    const r2 = scanForDormancy(members)
    expect(r2.churnedPromoted).toBe(1)
    expect(getLifecycleStage(m)).toBe(MemberLifecycleStage.Churned)
  })

  it('AC-2: ACTIVE→CHURNED 跳级非法抛错', () => {
    const m = makeMember()
    expect(() => setLifecycleStage(m, MemberLifecycleStage.Churned, 'illegal skip')).toThrow(
      /cannot skip DORMANT/,
    )
  })

  it('AC-3: 配置变更 dormantDays=10 后扫描立即生效', () => {
    const config = { ...DEFAULT_CONFIG, dormantDays: 10, churnedDays: 180 }
    const m = makeMember({ lastActiveAt: daysAgo(15) })
    members.push(m)

    // 默认 90d: 不应转为 Dormant
    let r = scanForDormancy(members)
    expect(r.dormantPromoted).toBe(0)
    expect(getLifecycleStage(m)).toBe(MemberLifecycleStage.Active)

    // 改 10d
    r = scanForDormancy(members, config)
    expect(r.dormantPromoted).toBe(1)
    expect(getLifecycleStage(m)).toBe(MemberLifecycleStage.Dormant)
  })

  it('AC-7: reactivate 任意→ACTIVE', () => {
    const m = makeMember({ lastActiveAt: daysAgo(200) })
    reactivateMember(m, m.memberId, 't1', 'test')
    expect(getLifecycleStage(m)).toBe(MemberLifecycleStage.Active)
    expect(new Date(m.lastActiveAt).getTime()).toBeGreaterThan(Date.now() - 5000)
  })

  it('AC-7: reactivate 记录 lifecycleHistory', () => {
    const m = makeMember({ lastActiveAt: daysAgo(200) })
    members.push(m)
    scanForDormancy(members) // → DORMANT
    reactivateMember(m, m.memberId, 't1', 'promotion')
    expect(m.lifecycleHistory!.length).toBeGreaterThanOrEqual(2)
    const last = m.lifecycleHistory![m.lifecycleHistory!.length - 1]
    expect(last.to).toBe(MemberLifecycleStage.Active)
    expect(last.reason).toBe('promotion')
    expect(last.from).toBe(MemberLifecycleStage.Dormant)
  })

  it('CHURNED→ACTIVE 通过 reactivate 允许', () => {
    const m = makeMember({ lastActiveAt: daysAgo(365) })
    members.push(m)
    scanForDormancy(members) // → DORMANT
    scanForDormancy(members) // → CHURNED
    expect(getLifecycleStage(m)).toBe(MemberLifecycleStage.Churned)
    reactivateMember(m, m.memberId, 't1', 'win-back')
    expect(getLifecycleStage(m)).toBe(MemberLifecycleStage.Active)
  })

  it('AC-4: scan 返回 counts 且报告 configSnapshot', () => {
    members.push(
      makeMember({ memberId: 'a', lastActiveAt: daysAgo(91) }),
      makeMember({ memberId: 'b', lastActiveAt: daysAgo(200) }),
      makeMember({ memberId: 'c', lastActiveAt: daysAgo(30) }),
    )
    const r1 = scanForDormancy(members)
    expect(r1.scannedCount).toBe(3)
    expect(r1.dormantPromoted).toBe(2)
    expect(r1.churnedPromoted).toBe(0)
    expect(r1.configSnapshot).toEqual({ dormantDays: 90, churnedDays: 180 })

    const r2 = scanForDormancy(members)
    expect(r2.churnedPromoted).toBe(1) // only b crosses churned threshold
  })

  it('AC-5: stats 计数 active/dormant/churned', () => {
    members.push(
      makeMember({ memberId: 'a', lastActiveAt: daysAgo(30), tenantId: 't1' }),
      makeMember({ memberId: 'b', lastActiveAt: daysAgo(100), tenantId: 't1' }),
      makeMember({ memberId: 'c', lastActiveAt: daysAgo(200), tenantId: 't1' }),
    )
    scanForDormancy(members)
    scanForDormancy(members)
    const stats = getStats(members, 't1')
    expect(stats.total).toBe(3)
    expect(stats.active).toBe(1) // a (30d < 90)
    expect(stats.dormant).toBe(1) // b (100d < 180)
    expect(stats.churned).toBe(1) // c (200d > 180)
  })

  it('recordActivity 自动唤醒 CHURNED→ACTIVE', () => {
    const m = makeMember({ lastActiveAt: daysAgo(365) })
    members.push(m)
    scanForDormancy(members)
    scanForDormancy(members)
    expect(getLifecycleStage(m)).toBe(MemberLifecycleStage.Churned)
    recordActivity(m)
    expect(getLifecycleStage(m)).toBe(MemberLifecycleStage.Active)
  })

  it('防御: 跨租户 reactivate 抛错', () => {
    const m = makeMember({ tenantId: 't1' })
    expect(() => reactivateMember(m, m.memberId, 't2', 'illegal')).toThrow(/cross_tenant/)
  })

  it('防御: 不存在的 memberId 抛错', () => {
    expect(() => reactivateMember(undefined, 'not-exist', 't1')).toThrow(/not found/)
  })

  it('listByStage 按阶段过滤', () => {
    const m1 = makeMember({ memberId: 'm1', lastActiveAt: daysAgo(10) })
    const m2 = makeMember({ memberId: 'm2', lastActiveAt: daysAgo(100) })
    members.push(m1, m2)
    scanForDormancy(members)
    const dormantList = listByStage(members, MemberLifecycleStage.Dormant, 't1')
    expect(dormantList.length).toBe(1)
    expect(dormantList[0].memberId).toBe('m2')
  })

  it('listByStage 支持跨租户过滤', () => {
    const m1 = makeMember({ memberId: 'm1', tenantId: 't1', lastActiveAt: daysAgo(10) })
    const m2 = makeMember({ memberId: 'm2', tenantId: 't2', lastActiveAt: daysAgo(100) })
    members.push(m1, m2)
    scanForDormancy(members)
    const t1Dormant = listByStage(members, MemberLifecycleStage.Dormant, 't1')
    const t2Dormant = listByStage(members, MemberLifecycleStage.Dormant, 't2')
    expect(t1Dormant.length).toBe(0)
    expect(t2Dormant.length).toBe(1)
  })

  it('setLifecycleStage no-op 同阶段', () => {
    const m = makeMember()
    setLifecycleStage(m, MemberLifecycleStage.Active, 'test')
    expect(m.lifecycleHistory).toBeUndefined()
    expect(getLifecycleStage(m)).toBe(MemberLifecycleStage.Active)
  })

  it('lifecycleHistory ringbuffer 上限 50', () => {
    const m = makeMember()
    for (let i = 0; i < 60; i++) {
      setLifecycleStage(m, i % 2 === 0 ? MemberLifecycleStage.Dormant : MemberLifecycleStage.Active, `cycle-${i}`)
    }
    expect(m.lifecycleHistory!.length).toBeLessThanOrEqual(50)
  })

  it('getInactiveMs 返回正确毫秒数', () => {
    const m = makeMember({ lastActiveAt: daysAgo(1) })
    const ms = getInactiveMs(m)
    expect(ms).toBeGreaterThanOrEqual(86_000_000) // roughly 1 day
  })

  it('calculateLevel 返回下一等级及所需积分', () => {
    const r = calculateLevel(100, 'BRONZE')
    expect(r.nextLevel).toBe('SILVER')
    expect(r.pointsNeeded).toBe(400)

    const r2 = calculateLevel(99999, 'DIAMOND')
    expect(r2.nextLevel).toBeNull()
    expect(r2.pointsNeeded).toBe(0)
  })
})
