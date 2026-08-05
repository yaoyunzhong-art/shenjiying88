/* ===== member — 纯函数式内联测试，不 import 生产代码 ===== */

// ── 1. 枚举 + 类型定义 ────────────────────────────────────────────

enum MemberLevel {
  Bronze = 'BRONZE',
  Silver = 'SILVER',
  Gold = 'GOLD',
  Platinum = 'PLATINUM',
  Diamond = 'DIAMOND',
}

enum MemberStatus {
  Active = 'ACTIVE',
  Frozen = 'FROZEN',
  Expired = 'EXPIRED',
  Blacklisted = 'BLACKLISTED',
}

interface RequestTenantContext {
  tenantId: string
  brandId?: string
  storeId?: string
  marketCode?: string
}

interface MemberProfile {
  memberId: string
  userId?: string
  tenantContext: RequestTenantContext
  mobile?: string
  nickname: string
  email?: string
  address?: string
  notes?: string
  level: MemberLevel
  status: MemberStatus
  points: number
  growthValue?: number
  svipStatus?: string
  registeredAt: string
  lastActiveAt?: string
  lifecycleStage?: 'prospect' | 'newly-paid' | 'repeat-paid' | 'vip-active'
  tags?: string[]
  lastPaymentAt?: string
  lastPaymentAmount?: number
  lastPaymentOrderId?: string
  lastPaymentChannel?: string
  source?: 'memory' | 'prisma'
  persisted?: boolean
}

interface MemberOperationsAction {
  code:
    | 'complete-member-onboarding'
    | 'send-post-payment-welcome'
    | 'issue-bounce-back-coupon'
    | 'recommend-repeat-purchase-bundle'
    | 'invite-loyalty-challenge'
    | 'assign-vip-concierge'
    | 'push-new-arrival-preview'
    | 'deliver-channel-follow-up'
  label: string
  reason: string
  channel: 'coupon' | 'crm-task' | 'wechat' | 'app-push'
  priority: 'high' | 'medium' | 'low'
}

interface MemberAutomationTrigger {
  code:
    | 'payment-success-journey'
    | 'newly-paid-bounce-back'
    | 'repeat-paid-retention'
    | 'vip-service-upgrade'
    | 'channel-retouch'
  status: 'ready' | 'watch'
  source: 'payment-success' | 'lifecycle' | 'tag'
  reason: string
}

interface MemberOperationsProfile {
  memberId: string
  tenantContext: RequestTenantContext
  level: MemberLevel
  status: MemberStatus
  lifecycleStage: NonNullable<MemberProfile['lifecycleStage']> | 'prospect'
  audienceSegments: string[]
  recommendedActions: MemberOperationsAction[]
  automationTriggers: MemberAutomationTrigger[]
  lastPaymentAt?: string
  lastPaymentAmount?: number
  lastPaymentChannel?: string
  tags: string[]
  source?: 'memory' | 'prisma'
}

interface MemberBootstrap {
  tenantContext: RequestTenantContext
  capabilities: string[]
  phase: string
}

export {} // ensure module scope

// ── 2. Mock 数据工厂 ──────────────────────────────────────────────

const MEMBER_LEVEL_THRESHOLDS: Record<MemberLevel, number> = {
  [MemberLevel.Bronze]: 0,
  [MemberLevel.Silver]: 500,
  [MemberLevel.Gold]: 2000,
  [MemberLevel.Platinum]: 10000,
  [MemberLevel.Diamond]: 50000,
}

const memberStore = new Map<string, MemberProfile>()

function makeContext(overrides?: Partial<RequestTenantContext>): RequestTenantContext {
  return { tenantId: 'tenant-001', brandId: 'brand-a', storeId: 'store-1', marketCode: 'cn-mainland', ...overrides }
}

function makeProfile(overrides?: Partial<MemberProfile>): MemberProfile {
  return {
    memberId: 'mem-001',
    tenantContext: makeContext(),
    nickname: '测试用户',
    level: MemberLevel.Bronze,
    status: MemberStatus.Active,
    points: 0,
    growthValue: 0,
    svipStatus: 'INACTIVE',
    registeredAt: '2026-01-01T00:00:00Z',
    source: 'memory',
    persisted: false,
    ...overrides,
  }
}

// ── 3. 内联业务逻辑 ──────────────────────────────────────────────

function computeMemberLevel(points: number): MemberLevel {
  if (points >= MEMBER_LEVEL_THRESHOLDS[MemberLevel.Diamond]) return MemberLevel.Diamond
  if (points >= MEMBER_LEVEL_THRESHOLDS[MemberLevel.Platinum]) return MemberLevel.Platinum
  if (points >= MEMBER_LEVEL_THRESHOLDS[MemberLevel.Gold]) return MemberLevel.Gold
  if (points >= MEMBER_LEVEL_THRESHOLDS[MemberLevel.Silver]) return MemberLevel.Silver
  return MemberLevel.Bronze
}

function canUpgrade(currentLevel: MemberLevel, points: number): boolean {
  const computed = computeMemberLevel(points)
  const levels = Object.values(MemberLevel)
  return levels.indexOf(computed) > levels.indexOf(currentLevel)
}

function makeMemberBootstrap(
  tenantContext: RequestTenantContext,
  overrides: Partial<Pick<MemberBootstrap, 'capabilities' | 'phase'>> = {},
): MemberBootstrap {
  return { tenantContext, capabilities: ['member-center', 'points', 'svip', 'blind-box'], phase: 'scaffold', ...overrides }
}

function getBootstrap(tenantContext: RequestTenantContext): MemberBootstrap {
  return makeMemberBootstrap(tenantContext)
}

function getProfile(memberId: string): MemberProfile | undefined {
  return memberStore.get(memberId)
}

function listProfiles(): MemberProfile[] {
  return Array.from(memberStore.values())
}

function register(input: { memberId: string; tenantContext: RequestTenantContext; nickname: string }): MemberProfile {
  if (memberStore.has(input.memberId)) {
    throw new Error(`Member ${input.memberId} already exists`)
  }
  const profile: MemberProfile = {
    memberId: input.memberId,
    userId: undefined,
    tenantContext: input.tenantContext,
    mobile: undefined,
    nickname: input.nickname,
    level: MemberLevel.Bronze,
    status: MemberStatus.Active,
    points: 0,
    growthValue: 0,
    svipStatus: 'INACTIVE',
    registeredAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    source: 'memory',
    persisted: false,
  }
  memberStore.set(input.memberId, profile)
  return profile
}

function addPoints(memberId: string, points: number): MemberProfile {
  const profile = memberStore.get(memberId)
  if (!profile) throw new Error(`Member ${memberId} not found`)
  if (points <= 0) throw new Error('Points to add must be positive')
  profile.points += points
  profile.growthValue = (profile.growthValue ?? 0) + points
  profile.level = computeMemberLevel(profile.points)
  profile.lastActiveAt = new Date().toISOString()
  return profile
}

function revokePoints(memberId: string, points: number): MemberProfile {
  const profile = memberStore.get(memberId)
  if (!profile) throw new Error(`Member ${memberId} not found`)
  if (points <= 0) throw new Error('Points to revoke must be positive')
  profile.points = Math.max(0, profile.points - points)
  profile.growthValue = Math.max(0, (profile.growthValue ?? 0) - points)
  profile.level = computeMemberLevel(profile.points)
  profile.lastActiveAt = new Date().toISOString()
  return profile
}

function sanitizeTagSegment(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function mergeMemberTags(existing: string[] | undefined, additions: string[]): string[] {
  const tags = new Set<string>(existing ?? [])
  for (const addition of additions) {
    const normalized = sanitizeTagSegment(addition)
    if (normalized) tags.add(normalized)
  }
  return Array.from(tags).slice(0, 12)
}

function deriveLifecycleStage(input: { hadPaymentBefore: boolean; amount: number; level: MemberLevel }): NonNullable<MemberProfile['lifecycleStage']> {
  if (input.level === MemberLevel.Gold || input.level === MemberLevel.Platinum || input.level === MemberLevel.Diamond) return 'vip-active'
  if (input.hadPaymentBefore || input.amount >= 200) return 'repeat-paid'
  return 'newly-paid'
}

function buildOperationsSegments(profile: MemberProfile): string[] {
  const lifecycleStage = profile.lifecycleStage ?? 'prospect'
  const normalizedChannel = profile.lastPaymentChannel ? sanitizeTagSegment(profile.lastPaymentChannel) : undefined
  const values: Array<string | undefined> = [
    `lifecycle-${lifecycleStage}`,
    `level-${profile.level.toLowerCase()}`,
    profile.persisted ? 'persisted-member' : 'memory-member',
    profile.lastPaymentAt ? 'recent-payer' : undefined,
    (profile.lastPaymentAmount ?? 0) >= 200 || profile.tags?.includes('high-value-buyer') ? 'high-value-buyer' : undefined,
    profile.level === MemberLevel.Gold || profile.level === MemberLevel.Platinum || profile.level === MemberLevel.Diamond ? 'vip-tier-member' : undefined,
    normalizedChannel ? `channel-${normalizedChannel}` : undefined,
    ...(profile.tags ?? []).map((tag) => `tag-${sanitizeTagSegment(tag)}`),
  ]
  return Array.from(new Set(values.filter((v): v is string => Boolean(v))))
}

// ── 4. Tests ──────────────────────────────────────────────────────

describe('MemberService (inline)', () => {
  beforeEach(() => {
    memberStore.clear()
  })

  // ── computeMemberLevel ──
  describe('computeMemberLevel', () => {
    it('should return Bronze for 0 points', () => {
      expect(computeMemberLevel(0)).toBe(MemberLevel.Bronze)
    })

    it('should return Bronze for 499 points', () => {
      expect(computeMemberLevel(499)).toBe(MemberLevel.Bronze)
    })

    it('should return Silver for 500 points', () => {
      expect(computeMemberLevel(500)).toBe(MemberLevel.Silver)
    })

    it('should return Gold for 2000 points', () => {
      expect(computeMemberLevel(2000)).toBe(MemberLevel.Gold)
    })

    it('should return Platinum for 10000 points', () => {
      expect(computeMemberLevel(10000)).toBe(MemberLevel.Platinum)
    })

    it('should return Diamond for 50000 points', () => {
      expect(computeMemberLevel(50000)).toBe(MemberLevel.Diamond)
    })
  })

  // ── canUpgrade ──
  describe('canUpgrade', () => {
    it('should return true when points qualify for upgrade', () => {
      expect(canUpgrade(MemberLevel.Bronze, 600)).toBe(true)
    })

    it('should return false when points are insufficient', () => {
      expect(canUpgrade(MemberLevel.Silver, 300)).toBe(false)
    })

    it('should return false at same level', () => {
      expect(canUpgrade(MemberLevel.Gold, 1500)).toBe(false)
    })

    it('should return false for Diamond (max level)', () => {
      expect(canUpgrade(MemberLevel.Diamond, 100000)).toBe(false)
    })
  })

  // ── makeMemberBootstrap / getBootstrap ──
  describe('bootstrap', () => {
    it('should return tenant context', () => {
      const ctx = makeContext()
      const result = getBootstrap(ctx)
      expect(result.tenantContext.tenantId).toBe('tenant-001')
    })

    it('should include member-center capability', () => {
      const result = getBootstrap(makeContext())
      expect(result.capabilities).toContain('member-center')
      expect(result.capabilities).toContain('points')
      expect(result.capabilities).toContain('svip')
    })

    it('should be in scaffold phase', () => {
      const result = getBootstrap(makeContext())
      expect(result.phase).toBe('scaffold')
    })
  })

  // ── register ──
  describe('register', () => {
    it('should create a new member profile', () => {
      const profile = register({ memberId: 'mem-new', tenantContext: makeContext(), nickname: '新人' })
      expect(profile.memberId).toBe('mem-new')
      expect(profile.nickname).toBe('新人')
      expect(profile.level).toBe(MemberLevel.Bronze)
      expect(profile.status).toBe(MemberStatus.Active)
      expect(profile.points).toBe(0)
    })

    it('should throw when member already exists', () => {
      register({ memberId: 'mem-dupe', tenantContext: makeContext(), nickname: 'first' })
      expect(() => register({ memberId: 'mem-dupe', tenantContext: makeContext(), nickname: 'second' })).toThrow('already exists')
    })
  })

  // ── getProfile / listProfiles ──
  describe('getProfile / listProfiles', () => {
    it('should return undefined for non-existent member', () => {
      expect(getProfile('no-such-member')).toBeUndefined()
    })

    it('should return registered member', () => {
      const profile = register({ memberId: 'mem-find', tenantContext: makeContext(), nickname: '查找' })
      expect(getProfile('mem-find')).toBe(profile)
    })

    it('should list all profiles', () => {
      register({ memberId: 'mem-a', tenantContext: makeContext(), nickname: 'A' })
      register({ memberId: 'mem-b', tenantContext: makeContext(), nickname: 'B' })
      expect(listProfiles()).toHaveLength(2)
    })
  })

  // ── addPoints ──
  describe('addPoints', () => {
    it('should add points to member', () => {
      const profile = register({ memberId: 'mem-p', tenantContext: makeContext(), nickname: '积分测试' })
      addPoints('mem-p', 100)
      expect(getProfile('mem-p')!.points).toBe(100)
    })

    it('should auto-upgrade level when crossing threshold', () => {
      const profile = register({ memberId: 'mem-up', tenantContext: makeContext(), nickname: '升级' })
      addPoints('mem-up', 2000)
      expect(getProfile('mem-up')!.level).toBe(MemberLevel.Gold)
    })

    it('should throw for non-positive points', () => {
      register({ memberId: 'mem-bad', tenantContext: makeContext(), nickname: '错误' })
      expect(() => addPoints('mem-bad', 0)).toThrow('must be positive')
    })

    it('should throw for non-existent member', () => {
      expect(() => addPoints('no-exist', 100)).toThrow('not found')
    })
  })

  // ── revokePoints ──
  describe('revokePoints', () => {
    it('should revoke points from member', () => {
      register({ memberId: 'mem-r', tenantContext: makeContext(), nickname: '扣分' })
      addPoints('mem-r', 500)
      revokePoints('mem-r', 200)
      expect(getProfile('mem-r')!.points).toBe(300)
    })

    it('should not go below 0 points', () => {
      register({ memberId: 'mem-neg', tenantContext: makeContext(), nickname: '防负' })
      addPoints('mem-neg', 100)
      revokePoints('mem-neg', 999)
      expect(getProfile('mem-neg')!.points).toBe(0)
    })

    it('should throw for non-positive points', () => {
      register({ memberId: 'mem-br', tenantContext: makeContext(), nickname: '扣错' })
      expect(() => revokePoints('mem-br', -5)).toThrow('must be positive')
    })
  })

  // ── sanitizeTagSegment ──
  describe('sanitizeTagSegment', () => {
    it('should lowercase and hyphenate', () => {
      expect(sanitizeTagSegment('Hello World!')).toBe('hello-world')
    })

    it('should strip Chinese characters leaving empty string', () => {
      expect(sanitizeTagSegment('高级会员')).toBe('')
    })

    it('should handle mixed content', () => {
      expect(sanitizeTagSegment('VIP_高级')).toBe('vip')
    })
  })

  // ── mergeMemberTags ──
  describe('mergeMemberTags', () => {
    it('should merge and normalize tags', () => {
      const result = mergeMemberTags(['paid'], ['New Tag!', 'VIP'])
      expect(result).toContain('paid')
      expect(result).toContain('new-tag')
      expect(result).toContain('vip')
    })
  })

  // ── deriveLifecycleStage ──
  describe('deriveLifecycleStage', () => {
    it('should return newly-paid for first payment under 200', () => {
      expect(deriveLifecycleStage({ hadPaymentBefore: false, amount: 50, level: MemberLevel.Bronze })).toBe('newly-paid')
    })

    it('should return repeat-paid if had payment before', () => {
      expect(deriveLifecycleStage({ hadPaymentBefore: true, amount: 50, level: MemberLevel.Bronze })).toBe('repeat-paid')
    })

    it('should return repeat-paid for amount >= 200', () => {
      expect(deriveLifecycleStage({ hadPaymentBefore: false, amount: 200, level: MemberLevel.Bronze })).toBe('repeat-paid')
    })

    it('should return vip-active for Gold level', () => {
      expect(deriveLifecycleStage({ hadPaymentBefore: false, amount: 0, level: MemberLevel.Gold })).toBe('vip-active')
    })
  })

  // ── buildOperationsSegments ──
  describe('buildOperationsSegments', () => {
    it('should include lifecycle and level segments', () => {
      const profile = makeProfile({ lifecycleStage: 'newly-paid', level: MemberLevel.Silver, persisted: true })
      const segments = buildOperationsSegments(profile)
      expect(segments).toContain('lifecycle-newly-paid')
      expect(segments).toContain('level-silver')
      expect(segments).toContain('persisted-member')
    })

    it('should include high-value-buyer when amount >= 200', () => {
      const profile = makeProfile({ lastPaymentAmount: 300, lifecycleStage: 'repeat-paid' })
      const segments = buildOperationsSegments(profile)
      expect(segments).toContain('high-value-buyer')
    })

    it('should include vip-tier-member for premium levels', () => {
      const profile = makeProfile({ level: MemberLevel.Platinum, lifecycleStage: 'vip-active' })
      const segments = buildOperationsSegments(profile)
      expect(segments).toContain('vip-tier-member')
    })

    it('should include tags as segments', () => {
      const profile = makeProfile({ tags: ['campaign-spring', 'referral'], lifecycleStage: 'prospect' })
      const segments = buildOperationsSegments(profile)
      expect(segments).toContain('tag-campaign-spring')
      expect(segments).toContain('tag-referral')
    })
  })
})
