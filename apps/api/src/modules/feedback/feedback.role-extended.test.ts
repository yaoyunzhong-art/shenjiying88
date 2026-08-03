import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 [feedback] 8角色扩展测试
 * 覆盖反馈创建/列表/详情/回复/更新/删除/统计
 * 8角色×3场景 = 24+ tests
 *
 * 8角色: 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 */

import { FeedbackController } from './feedback.controller'
import { FeedbackService } from './feedback.service'

function setup() {
  const service = new FeedbackService()
  const controller = new FeedbackController(service)
  return { service, controller }
}

// ══════════════════════════════════════════════════════════════
// 👔店长 — 门店全局反馈管理与统计
// ══════════════════════════════════════════════════════════════
describe('👔店长 feedback 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('店长查看反馈统计数据含各类型分布', () => {
    const stats = svc.controller.stats()
    expect(stats.total).toBeGreaterThan(0)
    expect(stats.byType).toBeDefined()
    expect(stats.byStatus).toBeDefined()
    expect(stats.pending).toBeGreaterThanOrEqual(0)
  })

  it('店长按门店筛选反馈列表', () => {
    const list = svc.controller.list({ storeId: 'store-001' })
    expect(list.total).toBeGreaterThan(0)
    list.items.forEach(item => {
      expect(item.storeId === 'store-001' || !item.storeId).toBe(true)
    })
  })

  it('店长将反馈分配给维修人员处理', () => {
    const list = svc.controller.list({ status: 'pending' })
    if (list.items.length > 0) {
      const fbId = list.items[0].id
      const updated = svc.controller.update(fbId, {
        assignedTo: 'tech-liu',
        assignedToName: '技术-刘',
        status: 'processing',
      })
      expect(updated.assignedTo).toBe('tech-liu')
      expect(updated.status).toBe('processing')
    }
  })
})

// ══════════════════════════════════════════════════════════════
// 🛒前台 — 前台提交顾客反馈
// ══════════════════════════════════════════════════════════════
describe('🛒前台 feedback 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('前台代顾客提交投诉反馈', () => {
    const fb = svc.controller.create({
      type: 'complaint',
      title: '洗手间卫生问题',
      content: '男洗手间地面有水渍，存在安全隐患',
      source: 'store_qr',
      severity: 'high',
      tags: ['environment', 'service'],
      userId: 'reception-001',
      userName: '前台小李',
      storeId: 'store-001',
    })
    expect(fb.type).toBe('complaint')
    expect(fb.status).toBe('pending')
    expect(fb.storeId).toBe('store-001')
  })

  it('前台提交建议并查看回复', () => {
    const fb = svc.controller.create({
      type: 'suggestion',
      title: '建议增加儿童座椅',
      content: '亲子区域缺少儿童座椅',
      source: 'app',
      severity: 'low',
      tags: ['service'],
      userId: 'reception-002',
      userName: '前台小王',
    })
    const replied = svc.controller.reply(fb.id, {
      content: '感谢建议，已提交采购申请',
      repliedBy: 'reception-002',
      repliedByName: '前台小王',
    })
    expect(replied.replies.length).toBe(1)
    expect(replied.status).toBe('processing')
  })

  it('前台查看当天新增反馈', () => {
    const today = new Date().toISOString().slice(0, 10)
    const list = svc.controller.list({ fromDate: today })
    expect(list).toBeDefined()
  })
})

// ══════════════════════════════════════════════════════════════
// 👥HR — 员工相关反馈处理
// ══════════════════════════════════════════════════════════════
describe('👥HR feedback 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('HR 更新反馈严重等级', () => {
    const list = svc.controller.list({ status: 'pending' })
    if (list.items.length > 0) {
      const fbId = list.items[0].id
      const updated = svc.controller.update(fbId, { severity: 'critical' })
      expect(updated.severity).toBe('critical')
    }
  })

  it('HR 关闭已解决的反馈', () => {
    const list = svc.controller.list({ status: 'resolved' })
    if (list.items.length > 0) {
      const fbId = list.items[0].id
      const updated = svc.controller.update(fbId, {
        status: 'closed',
        repliedBy: 'hr-001',
        repliedByName: 'HR张',
      })
      expect(updated.status).toBe('closed')
      expect(updated.replies.some(r => r.isSystem && r.content === '反馈已关闭')).toBe(true)
    }
  })

  it('HR 按关键字搜索反馈内容', () => {
    const list = svc.controller.list({ keyword: '排队' })
    expect(list.total).toBeGreaterThan(0)
  })
})

// ══════════════════════════════════════════════════════════════
// 🔧安监 — 安全类问题反馈管理
// ══════════════════════════════════════════════════════════════
describe('🔧安监 feedback 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('安监提交安全隐患反馈（critical 严重度）', () => {
    const fb = svc.controller.create({
      type: 'issue',
      title: '二楼消防通道堵塞',
      content: '消防通道堆放杂物，需立即清理',
      source: 'web',
      severity: 'critical',
      tags: ['environment', 'other'],
      userId: 'safety-001',
      userName: '安监老陈',
      storeId: 'store-001',
    })
    expect(fb.severity).toBe('critical')
    expect(fb.type).toBe('issue')
  })

  it('安监回复反馈并分配技术处理', () => {
    const list = svc.controller.list({ type: 'issue', status: 'pending' })
    if (list.items.length > 0) {
      const fbId = list.items[0].id
      const replied = svc.controller.reply(fbId, {
        content: '已派维修人员前往处理',
        repliedBy: 'safety-002',
        repliedByName: '安监小李',
      })
      expect(replied.status).toBe('processing')
    }
  })

  it('安监按严重度筛选 high 以上反馈', () => {
    const list = svc.controller.list({ severity: 'critical' })
    list.items.forEach(item => {
      expect(item.severity === 'critical').toBe(true)
    })
  })
})

// ══════════════════════════════════════════════════════════════
// 🎮导玩员 — 游戏设备反馈处理
// ══════════════════════════════════════════════════════════════
describe('🎮导玩员 feedback 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('导玩员提交设备故障报告', () => {
    const fb = svc.controller.create({
      type: 'issue',
      title: '5号街机投币器故障',
      content: '投币后无反应，不出游戏币',
      source: 'app',
      severity: 'high',
      tags: ['device'],
      userId: 'guide-001',
      userName: '导玩员小张',
      storeId: 'store-001',
      attachments: ['https://img.example.com/arcade-issue.jpg'],
    })
    expect(fb.type).toBe('issue')
    expect(fb.tags).toContain('device')
    expect(fb.attachments).toHaveLength(1)
  })

  it('导玩员查看设备类标签反馈', () => {
    const list = svc.controller.list({ tags: 'device', status: 'pending' as any })
    expect(list).toBeDefined()
  })

  it('导玩员删除自己提交的反馈草稿', () => {
    const fb = svc.controller.create({
      type: 'suggestion',
      title: '测试删除',
      content: '临时建议',
      source: 'app',
      severity: 'low',
      tags: ['other'],
      userId: 'guide-002',
      userName: '导玩员测试',
    })
    const result = svc.controller.delete(fb.id)
    expect(result.success).toBe(true)
    expect(result.id).toBe(fb.id)
    expect(() => svc.controller.getById(fb.id)).toThrow()
  })
})

// ══════════════════════════════════════════════════════════════
// 🎯运行专员 — 运营数据反馈管理
// ══════════════════════════════════════════════════════════════
describe('🎯运行专员 feedback 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('运行专员分页查询反馈列表', () => {
    const list = svc.controller.list({ page: '1', pageSize: '2' })
    expect(list.items.length).toBeLessThanOrEqual(2)
    expect(list.page).toBe(1)
    expect(list.pageSize).toBe(2)
  })

  it('运行专员查询反馈详情包含完整回复链', () => {
    const list = svc.controller.list({ status: 'closed' })
    if (list.items.length > 0) {
      const detail = svc.controller.getById(list.items[0].id)
      expect(detail.id).toBe(list.items[0].id)
      expect(detail.replies).toBeDefined()
    }
  })

  it('运行专员查看评分类型反馈统计', () => {
    const stats = svc.controller.stats()
    expect(stats.averageRating).toBeDefined()
    expect(stats.byType.rating).toBeGreaterThanOrEqual(0)
  })
})

// ══════════════════════════════════════════════════════════════
// 🤝团建 — 团建活动相关反馈
// ══════════════════════════════════════════════════════════════
describe('🤝团建 feedback 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('团建提交团建活动体验评分', () => {
    const fb = svc.controller.create({
      type: 'rating',
      title: '团建活动体验评价',
      content: '活动整体不错，建议增加互动环节',
      source: 'app',
      severity: 'low',
      tags: ['service'],
      userId: 'team-lead-001',
      userName: '团建队长',
      rating: 4,
    })
    expect(fb.rating).toBe(4)
    expect(fb.type).toBe('rating')
  })

  it('团建创建评分时缺少评分值应报错', () => {
    expect(() => {
      svc.controller.create({
        type: 'rating',
        title: '错误评分',
        content: '无评分',
        source: 'app',
        severity: 'low',
        tags: [],
        userId: 'u1',
        userName: '测试',
        // missing rating
      } as any)
    }).toThrow('评价类型必须提供评分')
  })

  it('团建查看所有建议类型反馈', () => {
    const list = svc.controller.list({ type: 'suggestion' })
    list.items.forEach(item => {
      expect(item.type).toBe('suggestion')
    })
  })
})

// ══════════════════════════════════════════════════════════════
// 📢营销 — 营销活动反馈分析
// ══════════════════════════════════════════════════════════════
describe('📢营销 feedback 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('营销查看所有投诉类型反馈', () => {
    const list = svc.controller.list({ type: 'complaint' })
    list.items.forEach(item => {
      expect(item.type).toBe('complaint')
    })
  })

  it('营销按时间段筛选反馈数据', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString()
    const list = svc.controller.list({ fromDate: yesterday })
    expect(list.total).toBeGreaterThan(0)
  })

  it('营销查询反馈中每项都有详情可查', () => {
    const list = svc.controller.list({})
    if (list.items.length > 0) {
      for (const item of list.items) {
        const detail = svc.controller.getById(item.id)
        expect(detail.id).toBe(item.id)
      }
    }
  })
})
