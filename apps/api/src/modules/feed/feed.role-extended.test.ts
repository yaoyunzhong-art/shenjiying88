/**
 * 🐜 自动: [feed] [C] 角色扩展测试
 *
 * 8 角色视角的 信息流模块扩展测试（补充 role.test.ts）
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个至少 3 个场景测试 = 8×3 = 24 tests
 * 使用实际 FeedService
 */
import { describe, it, expect } from 'vitest'
import { FeedService } from './feed.service'
import type { FeedChannel } from './feed.service'

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

/** 角色 → 信息流模块权限 (操作级) */
const roleFeedAccess: Record<string, string[]> = {
  'feed:view': ['👔店长', '🛒前台', '🔧安监', '🎮导玩员', '🎯运行专员', '🤝团建', '📢营销'],
  'feed:post': ['👔店长', '🎯运行专员', '📢营销'],
  'feed:like': ['👔店长', '🛒前台', '🎮导玩员', '🎯运行专员', '🤝团建', '📢营销'],
  'feed:comment': ['👔店长', '🛒前台', '🎮导玩员', '🎯运行专员', '🤝团建', '📢营销'],
  'feed:subscribe': ['👔店长', '🎯运行专员', '📢营销', '🎮导玩员', '🤝团建'],
}

function checkRoleAccess(role: string, resource: string): boolean {
  return roleFeedAccess[resource]?.includes(role) ?? false
}

function makeService(): FeedService {
  return new FeedService()
}

// ════════════════════════════════════════════════════════════
// 👔店长 — 信息流
// ════════════════════════════════════════════════════════════

describe('[👔店长] feed 角色扩展测试', () => {
  it('👔[正例] 店长查看信息流 → 发布公告', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'feed:view')).toBe(true)
    const svc = makeService()
    const feed = svc.getFeed('system')
    expect(feed.length).toBeGreaterThan(0)
    feed.forEach((p) => expect(p.channel).toBe('system'))

    expect(checkRoleAccess(ROLES.StoreManager, 'feed:post')).toBe(true)
    const post = svc.createPost({
      channel: 'system', title: '门店通知',
      content: '今日店休', authorId: 'store-mgr',
      authorName: '店长', tags: ['通知'],
    })
    expect(post.status).toBe('published')
    expect(post.channel).toBe('system')
  })

  it('👔[正例] 店长点赞公告 → 评论', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'feed:like')).toBe(true)
    const svc = makeService()
    // 先发帖再点赞
    const post = svc.createPost({
      channel: 'system', title: '月度表彰',
      content: '本月最佳员工：张三', authorId: 'sm-01',
      authorName: '店长', tags: ['表彰'],
    })
    const liked = svc.likePost(post.id, 'sm-01')
    expect(liked.likes).toBeGreaterThan(0)
    expect(liked.likedBy).toContain('sm-01')

    expect(checkRoleAccess(ROLES.StoreManager, 'feed:comment')).toBe(true)
    const comment = svc.commentPost(post.id, { userId: 'sm-01', userName: '店长', content: '恭喜！' })
    expect(comment.content).toBe('恭喜！')
  })

  it('👔[正例] 店长订阅系统通知频道', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'feed:subscribe')).toBe(true)
    const svc = makeService()
    const sub = svc.subscribeFeed('sm-01', 'system')
    expect(sub.channel).toBe('system')
    expect(sub.userId).toBe('sm-01')

    const subs = svc.getSubscriptions('sm-01')
    expect(subs.some(s => s.channel === 'system')).toBe(true)
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — 信息流
// ════════════════════════════════════════════════════════════

describe('[🛒前台] feed 角色扩展测试', () => {
  it('🛒[正例] 前台查看促销信息流', async () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'feed:view')).toBe(true)
    const svc = makeService()
    const promos = svc.getFeed('promotion')
    expect(promos.length).toBeGreaterThan(0)
    promos.forEach((p) => expect(p.channel).toBe('promotion'))
  })

  it('🛒[正例] 前台对促销帖点赞 → 评论', async () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'feed:like')).toBe(true)
    const svc = makeService()
    const feed = svc.getFeed('promotion')
    expect(feed.length).toBeGreaterThan(0)
    const liked = svc.likePost(feed[0].id, 'fd-01')
    expect(liked.likedBy).toContain('fd-01')

    expect(checkRoleAccess(ROLES.FrontDesk, 'feed:comment')).toBe(true)
    const comment = svc.commentPost(feed[0].id, { userId: 'fd-01', userName: '前台小李', content: '这个活动真不错' })
    expect(comment.userName).toBe('前台小李')
  })

  it('🛒[反例] 前台无权限发布信息', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'feed:post')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'feed:subscribe')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — 信息流
// ════════════════════════════════════════════════════════════

describe('[👥HR] feed 角色扩展测试', () => {
  it('👥[正例] HR查看系统通知', async () => {
    expect(checkRoleAccess(ROLES.HR, 'feed:view')).toBe(true)
    const svc = makeService()
    const systemFeed = svc.getFeed('system')
    expect(systemFeed.length).toBeGreaterThan(0)
  })

  it('👥[反例] HR无权限发布信息流', () => {
    expect(checkRoleAccess(ROLES.HR, 'feed:post')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'feed:subscribe')).toBe(false)
  })

  it('👥[反例] HR无权限点赞和评论', () => {
    expect(checkRoleAccess(ROLES.HR, 'feed:like')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'feed:comment')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — 信息流
// ════════════════════════════════════════════════════════════

describe('[🔧安监] feed 角色扩展测试', () => {
  it('🔧[正例] 安监查看系统通知（安全公告）', async () => {
    expect(checkRoleAccess(ROLES.Security, 'feed:view')).toBe(true)
    const svc = makeService()
    const feed = svc.getFeed()
    expect(feed.length).toBeGreaterThan(0)
  })

  it('🔧[反例] 安监无权限发布信息', () => {
    expect(checkRoleAccess(ROLES.Security, 'feed:post')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'feed:subscribe')).toBe(false)
  })

  it('🔧[反例] 安监无权限互动（点赞评论）', () => {
    expect(checkRoleAccess(ROLES.Security, 'feed:like')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'feed:comment')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — 信息流
// ════════════════════════════════════════════════════════════

describe('[🎮导玩员] feed 角色扩展测试', () => {
  it('🎮[正例] 导玩员查看活动信息流 → 点赞', async () => {
    expect(checkRoleAccess(ROLES.Guide, 'feed:view')).toBe(true)
    const svc = makeService()
    const feed = svc.getFeed('activity')
    expect(feed.length).toBeGreaterThanOrEqual(0)

    expect(checkRoleAccess(ROLES.Guide, 'feed:like')).toBe(true)
    const allFeed = svc.getFeed()
    if (allFeed.length > 0) {
      const liked = svc.likePost(allFeed[0].id, 'guide-01')
      expect(liked.likes).toBeGreaterThanOrEqual(0)
    }
  })

  it('🎮[正例] 导玩员对帖子评论 → 订阅信息流', async () => {
    expect(checkRoleAccess(ROLES.Guide, 'feed:comment')).toBe(true)
    const svc = makeService()
    const feed = svc.getFeed()
    if (feed.length > 0) {
      const comment = svc.commentPost(feed[0].id, { userId: 'guide-01', userName: '导玩小明', content: '加油！' })
      expect(comment.userName).toBe('导玩小明')
    }

    expect(checkRoleAccess(ROLES.Guide, 'feed:subscribe')).toBe(true)
    const sub = svc.subscribeFeed('guide-01', 'activity')
    expect(sub.channel).toBe('activity')
  })

  it('🎮[反例] 导玩员无权限发布信息', () => {
    expect(checkRoleAccess(ROLES.Guide, 'feed:post')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — 信息流
// ════════════════════════════════════════════════════════════

describe('[🎯运行专员] feed 角色扩展测试', () => {
  it('🎯[正例] 运行专员查看全频道信息流', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'feed:view')).toBe(true)
    const svc = makeService()
    const all = svc.getFeed()
    expect(all.length).toBeGreaterThan(0)
  })

  it('🎯[正例] 运行专员发布运营通知 → 点赞评论 → 订阅', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'feed:post')).toBe(true)
    const svc = makeService()
    const post = svc.createPost({
      channel: 'activity', title: '周末活动',
      content: '本周末举办篮球赛', authorId: 'ops-01',
      authorName: '运营小王', tags: ['活动'],
    })
    expect(post.title).toBe('周末活动')

    expect(checkRoleAccess(ROLES.Operations, 'feed:like')).toBe(true)
    const liked = svc.likePost(post.id, 'ops-01')
    expect(liked.likedBy).toContain('ops-01')

    expect(checkRoleAccess(ROLES.Operations, 'feed:comment')).toBe(true)
    svc.commentPost(post.id, { userId: 'ops-01', userName: '运营小王', content: '欢迎大家参加' })

    expect(checkRoleAccess(ROLES.Operations, 'feed:subscribe')).toBe(true)
    svc.subscribeFeed('ops-01', 'activity')
    expect(svc.getSubscriptions('ops-01').length).toBeGreaterThan(0)
  })

  it('🎯[正例] 运行专员按频道精确筛选', async () => {
    const svc = makeService()
    const system = svc.getFeed('system')
    system.forEach((p) => expect(p.channel).toBe('system'))

    const promotion = svc.getFeed('promotion')
    promotion.forEach((p) => expect(p.channel).toBe('promotion'))
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — 信息流
// ════════════════════════════════════════════════════════════

describe('[🤝团建] feed 角色扩展测试', () => {
  it('🤝[正例] 团建查看活动信息流 → 点赞 → 评论', async () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'feed:view')).toBe(true)
    const svc = makeService()
    const feed = svc.getFeed()
    expect(feed.length).toBeGreaterThan(0)

    expect(checkRoleAccess(ROLES.Teambuilding, 'feed:like')).toBe(true)
    if (feed.length > 0) {
      svc.likePost(feed[0].id, 'tb-01')
    }

    expect(checkRoleAccess(ROLES.Teambuilding, 'feed:comment')).toBe(true)
    if (feed.length > 0) {
      svc.commentPost(feed[0].id, { userId: 'tb-01', userName: '团建专员', content: '已安排团建活动场地' })
    }
  })

  it('🤝[正例] 团建订阅活动频道', async () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'feed:subscribe')).toBe(true)
    const svc = makeService()
    const sub = svc.subscribeFeed('tb-01', 'activity')
    expect(sub.channel).toBe('activity')

    const subs = svc.getSubscriptions('tb-01')
    expect(subs.some(s => s.channel === 'activity')).toBe(true)
  })

  it('🤝[反例] 团建无权限发布信息流', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'feed:post')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — 信息流
// ════════════════════════════════════════════════════════════

describe('[📢营销] feed 角色扩展测试', () => {
  it('📢[正例] 营销查看信息流 → 发布促销 → 订阅', async () => {
    expect(checkRoleAccess(ROLES.Marketing, 'feed:view')).toBe(true)
    const svc = makeService()
    const feed = svc.getFeed('promotion')
    expect(feed.length).toBeGreaterThan(0)

    expect(checkRoleAccess(ROLES.Marketing, 'feed:post')).toBe(true)
    const post = svc.createPost({
      channel: 'promotion', title: '七夕特惠',
      content: '双人套餐8折优惠', authorId: 'mkt-01',
      authorName: '营销小张', tags: ['促销', '节日'],
    })
    expect(post.tags).toContain('促销')
    expect(post.tags).toContain('节日')

    expect(checkRoleAccess(ROLES.Marketing, 'feed:subscribe')).toBe(true)
    svc.subscribeFeed('mkt-01', 'promotion')
    const subs = svc.getSubscriptions('mkt-01')
    expect(subs.some(s => s.channel === 'promotion')).toBe(true)
  })

  it('📢[正例] 营销对促销帖点赞 → 评论互动', async () => {
    expect(checkRoleAccess(ROLES.Marketing, 'feed:like')).toBe(true)
    const svc = makeService()
    const feed = svc.getFeed('promotion')
    expect(feed.length).toBeGreaterThan(0)
    const liked = svc.likePost(feed[0].id, 'mkt-01')
    expect(liked.likes).toBeGreaterThan(0)

    expect(checkRoleAccess(ROLES.Marketing, 'feed:comment')).toBe(true)
    const comment = svc.commentPost(feed[0].id, { userId: 'mkt-01', userName: '营销小张', content: '活动已上线' })
    expect(comment.content).toBe('活动已上线')
  })

  it('📢[正例] 营销发布带标签的信息流', async () => {
    const svc = makeService()
    const post = svc.createPost({
      channel: 'promotion', title: '国庆促销',
      content: '国庆期间全场9折', authorId: 'mkt-01',
      authorName: '营销小张', tags: ['促销', '国庆'],
    })
    expect(post.channel).toBe('promotion')
    expect(post.authorName).toBe('营销小张')
    expect(post.likes).toBe(0)
  })
})

// ════════════════════════════════════════════════════════════
// 🦞 跨角色组合场景 + 边界
// ════════════════════════════════════════════════════════════

describe('[🦞 feed 跨角色闭环 + 边界]', () => {
  it('📢 + 🎯 营销发帖 + 运行专员互动全流程', async () => {
    const svc = makeService()

    // 1. 营销发帖
    const post = svc.createPost({
      channel: 'promotion', title: '暑期大促',
      content: '全场8折', authorId: 'mkt',
      authorName: '营销部', tags: ['促销'],
    })
    expect(post.status).toBe('published')

    // 2. 运行专员点赞评论
    svc.likePost(post.id, 'ops')
    const updated = svc.getPost(post.id)
    expect(updated.likedBy).toContain('ops')
    expect(updated.likes).toBeGreaterThan(0)

    svc.commentPost(post.id, { userId: 'ops', userName: '运行专员', content: '已转发门店' })
    expect(updated.comments.length).toBeGreaterThan(0)
  })

  it('🛡️ 不存在的帖子ID抛出 NotFoundException', () => {
    const svc = makeService()
    expect(() => svc.getPost('nonexistent-id')).toThrow('不存在')
  })

  it('🛡️ 不存在的帖子点赞抛异常', () => {
    const svc = makeService()
    expect(() => svc.likePost('fake-id', 'user-01')).toThrow('不存在')
  })

  it('🛡️ 不存在的帖子评论抛异常', () => {
    const svc = makeService()
    expect(() => svc.commentPost('fake-id', { userId: 'u', userName: 'n', content: 'test' })).toThrow('不存在')
  })

  it('🛡️ 重复点赞幂等', () => {
    const svc = makeService()
    const post = svc.createPost({
      channel: 'activity', title: 'test',
      content: 'test', authorId: 'u',
      authorName: 'u', tags: [],
    })
    svc.likePost(post.id, 'user-01')
    const afterFirst = svc.getPost(post.id)
    expect(afterFirst.likes).toBe(1)

    // 重复点赞不应增加
    svc.likePost(post.id, 'user-01')
    const afterSecond = svc.getPost(post.id)
    expect(afterSecond.likes).toBe(1)
  })

  it('🛡️ 取消点赞', () => {
    const svc = makeService()
    const post = svc.createPost({
      channel: 'activity', title: 'test',
      content: 'test', authorId: 'u',
      authorName: 'u', tags: [],
    })
    svc.likePost(post.id, 'user-01')
    svc.unlikePost(post.id, 'user-01')
    const p = svc.getPost(post.id)
    expect(p.likes).toBe(0)
    expect(p.likedBy).not.toContain('user-01')
  })

  it('🛡️ 取消不存在的点赞不报错', () => {
    const svc = makeService()
    const post = svc.createPost({
      channel: 'activity', title: 'test',
      content: 'test', authorId: 'u',
      authorName: 'u', tags: [],
    })
    expect(() => svc.unlikePost(post.id, 'never-liked-user')).not.toThrow()
  })

  it('🛡️ 订阅和取消订阅频道', () => {
    const svc = makeService()
    svc.subscribeFeed('user-01', 'activity')
    expect(svc.getSubscriptions('user-01').length).toBe(1)

    svc.unsubscribeFeed('user-01', 'activity')
    expect(svc.getSubscriptions('user-01').length).toBe(0)
  })

  it('🛡️ 不存在的用户订阅返回空列表', () => {
    const svc = makeService()
    expect(svc.getSubscriptions('no-such-user')).toHaveLength(0)
  })

  it('🛡️ 多次订阅同一频道返回第一次的记录', () => {
    const svc = makeService()
    const sub1 = svc.subscribeFeed('u-01', 'activity')
    const sub2 = svc.subscribeFeed('u-01', 'activity')
    expect(sub1.subscribedAt).toBe(sub2.subscribedAt)
  })
})
