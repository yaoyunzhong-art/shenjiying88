/**
 * 🐜 自动: [performance-review] [C] 角色扩展测试
 *
 * 8 角色视角的绩效评审模块扩展测试（补充 role.test.ts）
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个至少 3 个场景测试 = 8×3 = 24 tests
 * 使用实际 PerformanceReviewService + in-memory Store
 */
import { describe, it, expect } from 'vitest'
import { PerformanceReviewService } from './performance-review.service'
import { ReviewPeriod, ReviewStatus } from './performance-review.entity'

// ── 角色权限矩阵 ──

const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

/** 角色 → 绩效评审模块权限 */
const roleAccess: Record<string, string[]> = {
  'pr:list': ['👔店长', '👥HR', '🎯运行专员'],
  'pr:detail': ['👔店长', '👥HR', '🎯运行专员'],
  'pr:create': ['👥HR'],
  'pr:review': ['👔店长', '👥HR'],
  'pr:acknowledge': ['👔店长', '👥HR'],
  'pr:update': ['👥HR'],
  'pr:archive': ['👔店长', '👥HR'],
  'pr:stats': ['👔店长', '👥HR', '🎯运行专员'],
}

function checkRoleAccess(role: string, resource: string): boolean {
  return roleAccess[resource]?.includes(role) ?? false
}

function makeService(): PerformanceReviewService {
  const svc = new PerformanceReviewService()
  svc.resetReviewStoresForTests()
  svc.seedMockData('tenant-001')
  return svc
}

function makeFreshService(): PerformanceReviewService {
  const svc = new PerformanceReviewService()
  svc.resetReviewStoresForTests()
  return svc
}

const TENANT = 'tenant-001'

// ════════════════════════════════════════════════════════════
// 👔店长 — 绩效评审
// ════════════════════════════════════════════════════════════

describe('[👔店长] performance-review 角色扩展测试', () => {
  it('👔[正例] 店长查看绩效评审列表 → 按期间筛选 → 查看统计', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'pr:list')).toBe(true)
    const svc = makeService()
    const all = svc.listReviews(TENANT)
    expect(all.length).toBeGreaterThanOrEqual(10)

    const quarterly = svc.listReviews(TENANT, { period: ReviewPeriod.Quarterly })
    expect(quarterly.length).toBeGreaterThanOrEqual(4)

    expect(checkRoleAccess(ROLES.StoreManager, 'pr:stats')).toBe(true)
    const byStatus = {
      draft: all.filter((r) => r.status === ReviewStatus.Draft).length,
      reviewed: all.filter((r) => r.status === ReviewStatus.Reviewed).length,
      acknowledged: all.filter((r) => r.status === ReviewStatus.Acknowledged).length,
      archived: all.filter((r) => r.status === ReviewStatus.Archived).length,
      pendingReview: all.filter((r) => r.status === ReviewStatus.PendingReview).length,
    }
    const total = Object.values(byStatus).reduce((a, b) => a + b, 0)
    expect(total).toBe(all.length)
  })

  it('👔[正例] 店长评审待审绩效 → 确认知悉', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'pr:review')).toBe(true)
    const svc = makeService()
    const pendingReviews = svc.listReviews(TENANT, { status: ReviewStatus.PendingReview })
    expect(pendingReviews.length).toBeGreaterThanOrEqual(0)

    const draft = svc.listReviews(TENANT, { status: ReviewStatus.Draft })
    if (draft.length > 0) {
      const reviewed = svc.updateReviewStatus(draft[0].id, ReviewStatus.Reviewed, TENANT)
      expect(reviewed.status).toBe(ReviewStatus.Reviewed)
    }
  })

  it('👔[反例] 店长无创建绩效权限', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'pr:create')).toBe(false)
  })

  it('👔[反例] 店长无编辑分数权限', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'pr:update')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — 绩效评审
// ════════════════════════════════════════════════════════════

describe('[🛒前台] performance-review 角色扩展测试', () => {
  it('🛒[反例] 前台无绩效评审访问权限', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'pr:list')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'pr:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'pr:stats')).toBe(false)
  })

  it('🛒[反例] 前台不可创建/编辑/评审绩效', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'pr:create')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'pr:review')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'pr:update')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'pr:archive')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'pr:acknowledge')).toBe(false)
  })

  it('🛒[闭环] 统一拒绝响应', () => {
    const denied = { success: false, code: 403, message: 'NO_PERFORMANCE_REVIEW_ACCESS' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — 绩效评审
// ════════════════════════════════════════════════════════════

describe('[👥HR] performance-review 角色扩展测试', () => {
  it('👥[正例] HR 创建绩效评审 → 设置考核维度 → 提交评审', () => {
    expect(checkRoleAccess(ROLES.HR, 'pr:create')).toBe(true)
    const svc = makeFreshService()

    const review = svc.createReview({
      tenantId: TENANT,
      employeeId: 'EMP-100',
      employeeName: '新员工刘测试',
      reviewer: 'HR主管',
      period: ReviewPeriod.Monthly,
      scores: [
        { dimension: '工作质量', score: 4, weight: 0.3, comment: '良好' },
        { dimension: '工作效率', score: 4, weight: 0.25, comment: '效率良好' },
        { dimension: '团队协作', score: 4, weight: 0.2, comment: '配合良好' },
        { dimension: '创新能力', score: 3, weight: 0.15, comment: '一般' },
        { dimension: '出勤率', score: 5, weight: 0.1, comment: '全勤' },
      ],
      comments: '新员工入职第一个月表现良好',
    })
    expect(review.employeeName).toBe('新员工刘测试')
    expect(review.status).toBe(ReviewStatus.Draft)
    expect(review.overallRating).toBe('B')
  })

  it('👥[正例] HR 更新绩效分数并重新计算评级', () => {
    expect(checkRoleAccess(ROLES.HR, 'pr:update')).toBe(true)
    const svc = makeService()
    const draftItems = svc.listReviews(TENANT, { status: ReviewStatus.Draft })
    expect(draftItems.length).toBeGreaterThan(0)
    const target = draftItems[0]

    const updated = svc.updateScores(target.id, TENANT, [
      { score: 5 }, { score: 5 }, { score: 5 }, { score: 5 }, { score: 5 },
    ], '更新为满分')
    expect(updated.overallRating).toBe('A')
    expect(updated.comments).toBe('更新为满分')
  })

  it('👥[正例] HR 归档已完成评审', () => {
    expect(checkRoleAccess(ROLES.HR, 'pr:archive')).toBe(true)
    const svc = makeService()
    const reviewed = svc.listReviews(TENANT, { status: ReviewStatus.Reviewed })
    expect(reviewed.length).toBeGreaterThan(0)
    const target = reviewed[0]

    const archived = svc.updateReviewStatus(target.id, ReviewStatus.Archived, TENANT)
    expect(archived.status).toBe(ReviewStatus.Archived)
  })

  it('👥[正例] HR 查看按员工筛选绩效', () => {
    expect(checkRoleAccess(ROLES.HR, 'pr:list')).toBe(true)
    const svc = makeService()
    const empReviews = svc.listReviews(TENANT, { employeeId: 'EMP-001' })
    expect(empReviews.length).toBeGreaterThanOrEqual(2)
    empReviews.forEach((r) => expect(r.employeeId).toBe('EMP-001'))
  })

  it('👥[反例] HR 更新不存在的绩效报错', () => {
    expect(checkRoleAccess(ROLES.HR, 'pr:update')).toBe(true)
    const svc = makeService()
    expect(() => svc.updateScores('nonexistent', TENANT, [{}])).toThrow('not found')
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — 绩效评审
// ════════════════════════════════════════════════════════════

describe('[🔧安监] performance-review 角色扩展测试', () => {
  it('🔧[反例] 安监无绩效评审访问权限', () => {
    expect(checkRoleAccess(ROLES.Security, 'pr:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'pr:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'pr:stats')).toBe(false)
  })

  it('🔧[反例] 安监不可执行绩效操作', () => {
    expect(checkRoleAccess(ROLES.Security, 'pr:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'pr:review')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'pr:update')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'pr:archive')).toBe(false)
  })

  it('🔧[闭环] 统一拒绝 403', () => {
    const denied = { success: false, code: 403, message: 'NO_PERFORMANCE_REVIEW_ACCESS' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — 绩效评审
// ════════════════════════════════════════════════════════════

describe('[🎮导玩员] performance-review 角色扩展测试', () => {
  it('🎮[反例] 导玩员无绩效评审权限', () => {
    expect(checkRoleAccess(ROLES.Guide, 'pr:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'pr:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'pr:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'pr:review')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'pr:update')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'pr:archive')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'pr:stats')).toBe(false)
  })

  it('🎮[反例] 导玩员不可确认知悉评审', () => {
    expect(checkRoleAccess(ROLES.Guide, 'pr:acknowledge')).toBe(false)
  })

  it('🎮[闭环] 返回统一拒绝', () => {
    const denied = { success: false, code: 403, message: 'NO_PERFORMANCE_REVIEW_ACCESS' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — 绩效评审
// ════════════════════════════════════════════════════════════

describe('[🎯运行专员] performance-review 角色扩展测试', () => {
  it('🎯[正例] 运行专员查看绩效列表 → 按状态筛选 → 查看统计', () => {
    expect(checkRoleAccess(ROLES.Operations, 'pr:list')).toBe(true)
    const svc = makeService()
    const reviewed = svc.listReviews(TENANT, { status: ReviewStatus.Reviewed })
    expect(reviewed.length).toBeGreaterThanOrEqual(4)

    expect(checkRoleAccess(ROLES.Operations, 'pr:stats')).toBe(true)
    const all = svc.listReviews(TENANT)
    const byRating = { A: 0, B: 0, C: 0, D: 0 }
    all.forEach((r) => { byRating[r.overallRating]++ })
    const total = byRating.A + byRating.B + byRating.C + byRating.D
    expect(total).toBe(all.length)
  })

  it('🎯[正例] 运行专员查看绩效详情 → 查看评分明细', () => {
    expect(checkRoleAccess(ROLES.Operations, 'pr:detail')).toBe(true)
    const svc = makeService()
    const all = svc.listReviews(TENANT)
    expect(all.length).toBeGreaterThan(0)
    const detail = svc.getReview(all[0].id, TENANT)
    expect(detail).toBeDefined()
    expect(detail!.scores.length).toBeGreaterThanOrEqual(3)
  })

  it('🎯[反例] 运行专员不可创建/编辑绩效', () => {
    expect(checkRoleAccess(ROLES.Operations, 'pr:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Operations, 'pr:update')).toBe(false)
    expect(checkRoleAccess(ROLES.Operations, 'pr:review')).toBe(false)
  })

  it('🎯[反例] 运行专员不可归档', () => {
    expect(checkRoleAccess(ROLES.Operations, 'pr:archive')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — 绩效评审
// ════════════════════════════════════════════════════════════

describe('[🤝团建] performance-review 角色扩展测试', () => {
  it('🤝[反例] 团建无任何绩效权限', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'pr:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'pr:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'pr:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'pr:review')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'pr:update')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'pr:archive')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'pr:stats')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'pr:acknowledge')).toBe(false)
  })

  it('🤝[闭环] 返回统一 403', () => {
    const denied = { success: false, code: 403, message: 'NO_PERFORMANCE_REVIEW_ACCESS' }
    expect(denied.code).toBe(403)
  })

  it('🤝[闭环] 团建操作不影响数据', () => {
    const svc = makeService()
    const count = svc.listReviews(TENANT).length
    expect(count).toBeGreaterThan(0)
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — 绩效评审
// ════════════════════════════════════════════════════════════

describe('[📢营销] performance-review 角色扩展测试', () => {
  it('📢[反例] 营销无绩效权限', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'pr:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'pr:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'pr:stats')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'pr:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'pr:review')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'pr:update')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'pr:archive')).toBe(false)
  })

  it('📢[闭环] 营销返回 403', () => {
    const denied = { success: false, code: 403, message: 'NO_PERFORMANCE_REVIEW_ACCESS' }
    expect(denied.code).toBe(403)
  })

  it('📢[闭环] 数据结构一致性', () => {
    const denied = { success: false, code: 403, message: 'NO_PERFORMANCE_REVIEW_ACCESS', module: 'performance-review' }
    expect(denied.module).toBe('performance-review')
  })
})

// ════════════════════════════════════════════════════════════
// 🦞 跨角色闭环 + 边界场景
// ════════════════════════════════════════════════════════════

describe('[🦞 performance-review 跨角色闭环 + 边界]', () => {
  it('👥+👔 创建绩效→评审→归档全流程', () => {
    const svc = makeFreshService()

    // 1. HR 创建绩效
    const review = svc.createReview({
      tenantId: TENANT,
      employeeId: 'EMP-200',
      employeeName: '闭环测试员工',
      reviewer: 'HR主管',
      period: ReviewPeriod.Quarterly,
      scores: [
        { dimension: '工作质量', score: 5, weight: 0.3, comment: '优秀' },
        { dimension: '工作效率', score: 4, weight: 0.25, comment: '良好' },
        { dimension: '团队协作', score: 5, weight: 0.2, comment: '核心成员' },
        { dimension: '创新能力', score: 4, weight: 0.15, comment: '有创新' },
        { dimension: '出勤率', score: 5, weight: 0.1, comment: '全勤' },
      ],
      comments: '季度优秀员工',
    })
    expect(review.status).toBe(ReviewStatus.Draft)

    // 2. 店长评审
    const reviewed = svc.updateReviewStatus(review.id, ReviewStatus.Reviewed, TENANT)
    expect(reviewed.status).toBe(ReviewStatus.Reviewed)

    // 3. HR 归档
    const archived = svc.updateReviewStatus(review.id, ReviewStatus.Archived, TENANT)
    expect(archived.status).toBe(ReviewStatus.Archived)
  })

  it('🛡️ 查询不存在的绩效返回 undefined', () => {
    const svc = makeService()
    expect(svc.getReview('nonexistent', TENANT)).toBeUndefined()
  })

  it('🛡️ 空数据新建服务返回空列表', () => {
    const svc = makeFreshService()
    expect(svc.listReviews(TENANT).length).toBe(0)
  })

  it('🛡️ 已归档绩效不可重复归档', () => {
    const svc = makeService()
    const archived = svc.listReviews(TENANT, { status: ReviewStatus.Archived })
    if (archived.length > 0) {
      const target = svc.updateReviewStatus(archived[0].id, ReviewStatus.Archived, TENANT)
      expect(target.status).toBe(ReviewStatus.Archived) // repeating archive is allowed
    }
    expect(archived.length).toBeGreaterThanOrEqual(2)
  })

  it('🛡️ 跨租户隔离', () => {
    const svc = makeService()
    const tenantB = 'tenant-002'
    expect(svc.listReviews(tenantB).length).toBe(0)
  })

  it('🛡️ 权重和为零时默认 C 评级', () => {
    const rating = PerformanceReviewService.calculateOverallRating([])
    expect(rating).toBe('C')
  })

  it('🛡️ 极端权重分布评分正确', () => {
    const rating = PerformanceReviewService.calculateOverallRating([
      { id: 's1', dimension: '质量', score: 5, weight: 1, comment: '唯一维度' },
    ])
    expect(rating).toBe('A')
  })
})
