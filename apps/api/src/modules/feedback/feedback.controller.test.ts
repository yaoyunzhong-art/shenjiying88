import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 用户反馈/评价管理 Controller 测试 (V23)
 *
 * 覆盖: 路由元数据 / 提交反馈 / 列表+筛选+分页 / 详情 / 回复 / 更新 / 删除 / 统计
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { FeedbackController } from './feedback.controller'
import { FeedbackService } from './feedback.service'

// ══════════════════════════════════════════════════════════════
// 路由元数据验证
// ══════════════════════════════════════════════════════════════

const ROUTES: Array<{ method: number; path: string; handler: string; verb: string }> = [
  { method: 1, path: '/',         handler: 'create',    verb: 'POST'   },
  { method: 0, path: '/',         handler: 'list',       verb: 'GET'    },
  { method: 0, path: 'stats',     handler: 'stats',      verb: 'GET'    },
  { method: 0, path: ':id',       handler: 'getById',    verb: 'GET'    },
  { method: 1, path: ':id/reply', handler: 'reply',      verb: 'POST'   },
  { method: 4, path: ':id',       handler: 'update',     verb: 'PATCH'  },
  { method: 3, path: ':id',       handler: 'delete',     verb: 'DELETE' },
]

describe('路由元数据验证', () => {
  it('feedback controller path metadata is set', () => {
    const ctrlPath = Reflect.getMetadata('path', FeedbackController)
    assert.equal(ctrlPath, 'feedback')
  })

  for (const route of ROUTES) {
    it(`${route.verb} /feedback${route.path} → ${route.handler}`, () => {
      const method = Reflect.getMetadata('method', FeedbackController.prototype[route.handler as keyof FeedbackController])
      const routePath = Reflect.getMetadata('path', FeedbackController.prototype[route.handler as keyof FeedbackController])
      assert.equal(method, route.method)
      assert.equal(routePath, route.path)
    })
  }

  it('所有 7 个路由都注册了元数据', () => {
    const methods = ROUTES.map((r) => r.handler)
    for (const handler of methods) {
      const method = Reflect.getMetadata('method', FeedbackController.prototype[handler as keyof FeedbackController])
      assert.ok(method !== undefined, `Missing metadata for ${handler}`)
    }
  })
})

// ══════════════════════════════════════════════════════════════
// 辅助函数
// ══════════════════════════════════════════════════════════════

function makeController(): FeedbackController {
  return new FeedbackController(new FeedbackService())
}

// ══════════════════════════════════════════════════════════════
// 提交反馈
// ══════════════════════════════════════════════════════════════

describe('POST /feedback - 提交反馈', () => {
  it('提交投诉反馈，返回完整实体', () => {
    const ctrl = makeController()
    const result = ctrl.create({
      type: 'complaint',
      content: '噪音太大影响体验',
      title: '噪音投诉',
      source: 'app',
      severity: 'medium',
      tags: ['environment'],
      userId: 'user-test-1',
      userName: '测试用户',
    })
    assert.ok(result.id)
    assert.equal(result.type, 'complaint')
    assert.equal(result.title, '噪音投诉')
    assert.equal(result.status, 'pending')
    assert.equal(result.source, 'app')
    assert.equal(result.severity, 'medium')
    assert.equal(result.userName, '测试用户')
  })

  it('提交评价反馈必须包含评分(1-5)', () => {
    const ctrl = makeController()
    const result = ctrl.create({
      type: 'rating',
      content: '非常好',
      title: '5星好评',
      source: 'store_qr',
      severity: 'low',
      tags: ['service'],
      userId: 'user-test-2',
      userName: '好评用户',
      rating: 5,
    })
    assert.equal(result.type, 'rating')
    assert.equal(result.rating, 5)
  })

  it('提交建议反馈，包含门店信息', () => {
    const ctrl = makeController()
    const result = ctrl.create({
      type: 'suggestion',
      content: '建议增加儿童游乐区',
      title: '儿童区建议',
      source: 'miniapp',
      severity: 'low',
      tags: ['environment'],
      userId: 'user-test-3',
      userName: '建议用户',
      storeId: 'store-002',
      attachments: [],
    })
    assert.equal(result.type, 'suggestion')
    assert.equal(result.storeId, 'store-002')
    assert.ok(result.attachments)
  })

  it('提交问题报告，包含附件', () => {
    const ctrl = makeController()
    const result = ctrl.create({
      type: 'issue',
      content: '空调不制冷',
      title: '空调故障',
      source: 'app',
      severity: 'high',
      tags: ['device'],
      userId: 'user-test-4',
      userName: '报修用户',
      storeId: 'store-001',
      attachments: ['https://img.example.com/ac.jpg'],
    })
    assert.equal(result.type, 'issue')
    assert.equal(result.attachments.length, 1)
    assert.equal(result.attachments[0], 'https://img.example.com/ac.jpg')
  })

  it('提交反馈自动生成 feedbackNo', () => {
    const ctrl = makeController()
    const result = ctrl.create({
      type: 'complaint',
      content: '测试编号生成',
      title: '编号测试',
      source: 'web',
      severity: 'low',
      tags: ['other'],
      userId: 'user-test-5',
      userName: '编号测试',
    })
    // feedbackNo 格式 FB-xxxxxx
    assert.match(result.feedbackNo, /^FB-\d{6}$/)
  })
})

// ══════════════════════════════════════════════════════════════
// 反馈列表 + 筛选 + 分页
// ══════════════════════════════════════════════════════════════

describe('GET /feedback - 列表/筛选/分页', () => {
  it('空白查询返回所有反馈', () => {
    const ctrl = makeController()
    const result = ctrl.list({})
    assert.ok(result.total >= 6) // 6 条种子数据
    const items = result.items
    assert.ok(items.length > 0)
    for (const item of items) {
      assert.ok(item.id)
      assert.ok(item.feedbackNo)
      assert.ok(item.title)
      assert.ok(item.status)
    }
  })

  it('按 type 筛选投诉', () => {
    const ctrl = makeController()
    const result = ctrl.list({ type: 'complaint' })
    assert.ok(result.items.length > 0)
    assert.ok(result.items.every((i) => i.type === 'complaint'))
  })

  it('按 status 筛选 pending 反馈', () => {
    const ctrl = makeController()
    const result = ctrl.list({ status: 'pending' })
    assert.ok(result.items.length > 0)
    assert.ok(result.items.every((i) => i.status === 'pending'))
  })

  it('按门店筛选', () => {
    const ctrl = makeController()
    const result = ctrl.list({ storeId: 'store-001' })
    assert.ok(result.items.length > 0)
    assert.ok(result.items.every((i) => i.storeId === 'store-001'))
  })

  it('按关键字搜索', () => {
    const ctrl = makeController()
    const result = ctrl.list({ keyword: '排队' })
    assert.ok(result.items.length > 0)
    assert.ok(result.items.some((i) => i.title.includes('排队')))
  })

  it('分页生效', () => {
    const ctrl = makeController()
    const result = ctrl.list({ page: '1', pageSize: '2' })
    assert.equal(result.items.length, 2)
    assert.equal(result.page, 1)
    assert.equal(result.pageSize, 2)
    assert.ok(result.totalPages >= 3)
  })

  it('空筛选条件返回空列表', () => {
    const ctrl = makeController()
    const result = ctrl.list({ type: 'issue', status: 'pending' })
    assert.equal(result.total, 0)
    assert.equal(result.items.length, 0)
  })
})

// ══════════════════════════════════════════════════════════════
// 反馈统计
// ══════════════════════════════════════════════════════════════

describe('GET /feedback/stats - 统计', () => {
  it('返回完整统计数据', () => {
    const ctrl = makeController()
    const result = ctrl.stats()
    assert.ok(result.total >= 6)
    assert.ok(result.byType.complaint >= 2)
    assert.ok(result.byType.rating >= 1)
    assert.ok(result.byType.suggestion >= 2)
    assert.ok(result.byType.issue >= 1)
    assert.ok(typeof result.averageRating === 'number')
    assert.ok(result.averageRating! > 0)
    assert.ok(result.pending >= 2)
    assert.ok(result.processing >= 2)
    assert.ok(result.resolved >= 1)
    assert.ok(typeof result.todayNew === 'number')
  })

  it('bySource 包含所有来源', () => {
    const ctrl = makeController()
    const result = ctrl.stats()
    assert.ok('app' in result.bySource)
    assert.ok('miniapp' in result.bySource)
    assert.ok('store_qr' in result.bySource)
    assert.ok('web' in result.bySource)
    assert.ok('ai_cs' in result.bySource)
  })

  it('bySeverity 包含所有严重等级', () => {
    const ctrl = makeController()
    const result = ctrl.stats()
    assert.ok('low' in result.bySeverity)
    assert.ok('medium' in result.bySeverity)
    assert.ok('high' in result.bySeverity)
    assert.ok('critical' in result.bySeverity)
  })
})

// ══════════════════════════════════════════════════════════════
// 反馈详情
// ══════════════════════════════════════════════════════════════

describe('GET /feedback/:id - 详情', () => {
  it('获取已存在的反馈详情', () => {
    const ctrl = makeController()
    const result = ctrl.getById('fb-seed-001')
    assert.ok(result)
    assert.equal(result.feedbackNo, 'FB-000001')
    assert.equal(result.title, '排队时间过长')
    assert.equal(result.userName, '张明')
  })

  it('获取已关闭反馈包含回复记录', () => {
    const ctrl = makeController()
    const result = ctrl.getById('fb-seed-003')
    assert.equal(result.status, 'closed')
    assert.equal(result.rating, 5)
    assert.ok(result.replies.length > 0)
    assert.equal(result.replies[0].repliedByName, '王店长')
  })

  it('获取已解决反馈包含解决信息', () => {
    const ctrl = makeController()
    const result = ctrl.getById('fb-seed-004')
    assert.equal(result.status, 'resolved')
    assert.equal(result.severity, 'critical')
    assert.ok(result.resolution)
    assert.ok(result.resolvedAt)
    assert.equal(result.replies.length, 2)
  })

  it('不存在的反馈抛出 400', () => {
    const ctrl = makeController()
    assert.throws(
      () => ctrl.getById('non-existent-feedback'),
      /不存在/i,
    )
  })
})

// ══════════════════════════════════════════════════════════════
// 回复反馈
// ══════════════════════════════════════════════════════════════

describe('POST /feedback/:id/reply - 回复', () => {
  it('回复 pending 反馈后自动变为 processing', () => {
    const ctrl = makeController()
    const result = ctrl.reply('fb-seed-001', {
      content: '收到您的反馈，已安排人员跟进',
      repliedBy: 'staff-001',
      repliedByName: '客服小李',
    })
    assert.equal(result.status, 'processing')
    assert.equal(result.replies.length, 1)
    assert.equal(result.replies[0].repliedByName, '客服小李')
  })

  it('多次回复按顺序追加', () => {
    const ctrl = makeController()
    ctrl.reply('fb-seed-001', {
      content: '第一次回复',
      repliedBy: 'staff-001',
      repliedByName: '客服A',
    })
    const result = ctrl.reply('fb-seed-001', {
      content: '第二次回复',
      repliedBy: 'staff-002',
      repliedByName: '主管B',
    })
    assert.equal(result.replies.length, 2)
    assert.equal(result.replies[result.replies.length - 1].repliedByName, '主管B')
  })

  it('系统回复 isSystem=true', () => {
    const ctrl = makeController()
    const result = ctrl.reply('fb-seed-005', {
      content: '系统自动回复：您的反馈已进入工单系统',
      repliedBy: 'system',
      repliedByName: '系统',
      isSystem: true,
    })
    assert.ok(result.replies[0].isSystem)
    assert.equal(result.replies[0].repliedBy, 'system')
  })
})

// ══════════════════════════════════════════════════════════════
// 更新反馈
// ══════════════════════════════════════════════════════════════

describe('PATCH /feedback/:id - 更新', () => {
  it('更新状态为 processing', () => {
    const ctrl = makeController()
    const result = ctrl.update('fb-seed-001', { status: 'processing' })
    assert.equal(result.status, 'processing')
  })

  it('更新分配处理人', () => {
    const ctrl = makeController()
    const result = ctrl.update('fb-seed-001', {
      assignedTo: 'staff-003',
      assignedToName: '陈经理',
    })
    assert.equal(result.assignedTo, 'staff-003')
    assert.equal(result.assignedToName, '陈经理')
  })

  it('更新为 resolved 时记录解决时间', () => {
    const ctrl = makeController()
    const result = ctrl.update('fb-seed-001', {
      status: 'resolved',
      resolution: '已安排清洁人员处理',
    })
    assert.equal(result.status, 'resolved')
    assert.equal(result.resolution, '已安排清洁人员处理')
    assert.ok(result.resolvedAt)
  })

  it('更新为 closed 时自动添加系统回复', () => {
    const ctrl = makeController()
    const result = ctrl.update('fb-seed-001', {
      status: 'closed',
      repliedBy: 'staff-001',
      repliedByName: '王店长',
    })
    assert.equal(result.status, 'closed')
    assert.ok(result.replies.length > 0)
    // 最后一个回复应该是系统关闭通知
    const lastReply = result.replies[result.replies.length - 1]
    assert.equal(lastReply.content, '反馈已关闭')
    assert.ok(lastReply.isSystem)
  })

  it('更新严重程度', () => {
    const ctrl = makeController()
    const result = ctrl.update('fb-seed-005', { severity: 'high' })
    assert.equal(result.severity, 'high')
  })

  it('更新标签', () => {
    const ctrl = makeController()
    const result = ctrl.update('fb-seed-005', { tags: ['service', 'environment'] })
    assert.deepEqual(result.tags, ['service', 'environment'])
  })
})

// ══════════════════════════════════════════════════════════════
// 删除反馈
// ══════════════════════════════════════════════════════════════

describe('DELETE /feedback/:id - 删除', () => {
  it('删除已存在的反馈', () => {
    const ctrl = makeController()
    const result = ctrl.delete('fb-seed-005')
    assert.ok(result.success)
    assert.equal(result.id, 'fb-seed-005')
  })

  it('删除后再次查询抛出 400', () => {
    const ctrl = makeController()
    ctrl.delete('fb-seed-005')
    assert.throws(
      () => ctrl.getById('fb-seed-005'),
      /不存在/i,
    )
  })

  it('不存在的反馈抛出 400', () => {
    const ctrl = makeController()
    assert.throws(
      () => ctrl.delete('non-existent'),
      /不存在/i,
    )
  })
})

// ══════════════════════════════════════════════════════════════
// 综合业务流程场景
// ══════════════════════════════════════════════════════════════

describe('业务流程场景', () => {
  it('完整流程：提交→回复→解决→关闭', () => {
    const ctrl = makeController()

    // 1. 提交反馈
    const created = ctrl.create({
      type: 'complaint',
      content: 'WiFi 信号太差',
      title: 'WiFi 问题',
      source: 'app',
      severity: 'medium',
      tags: ['service'],
      userId: 'user-biz-1',
      userName: '商务用户',
      storeId: 'store-001',
    })
    assert.equal(created.status, 'pending')
    const fbId = created.id

    // 2. 回复反馈 (自动变 processing)
    const replied = ctrl.reply(fbId, {
      content: '已安排网络工程师检查',
      repliedBy: 'staff-001',
      repliedByName: '客服小张',
    })
    assert.equal(replied.status, 'processing')
    assert.equal(replied.replies.length, 1)

    // 3. 更新解决
    const resolved = ctrl.update(fbId, {
      status: 'resolved',
      assignedTo: 'tech-001',
      assignedToName: '工程师王',
      resolution: '已调整路由器位置，信号恢复正常',
    })
    assert.equal(resolved.status, 'resolved')
    assert.ok(resolved.resolution)
    assert.ok(resolved.resolvedAt)

    // 4. 关闭
    const closed = ctrl.update(fbId, {
      status: 'closed',
      repliedBy: 'staff-001',
      repliedByName: '客服小张',
    })
    assert.equal(closed.status, 'closed')
    // 系统添加关闭回复
    const lastReply = closed.replies[closed.replies.length - 1]
    assert.equal(lastReply.content, '反馈已关闭')
  })

  it('统计覆盖完整流程后数据变化', () => {
    const ctrl = makeController()
    const statsBefore = ctrl.stats()

    // 添加新反馈
    ctrl.create({
      type: 'suggestion',
      content: '新建议',
      title: '新建议',
      source: 'app',
      severity: 'low',
      tags: ['other'],
      userId: 'user-new',
      userName: '新用户',
    })

    const statsAfter = ctrl.stats()
    assert.equal(statsAfter.total, statsBefore.total + 1)
    assert.equal(statsAfter.byType.suggestion, statsBefore.byType.suggestion + 1)
  })
})
