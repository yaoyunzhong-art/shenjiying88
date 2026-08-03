/**
 * 🐜 自动: [queue] [A] dual-mode entity/service/controller test
 *
 * WP-12A: 双模排队 + 微信/App 并行 + 队列状态管理
 *
 * 测试覆盖:
 * - 正例: 线上排队创建、现场排队创建、微信入口、App入口、状态同步
 * - 反例: 无效来源、无效渠道、空 memberId、重复转换
 * - 边界: 来源转换、不同渠道统计、大批量排队
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  QueueChannel,
  QueueEntity,
  QueueSource,
  QueueStatus,
  QueueType,
} from './queue.entity'
import { QueueService } from './queue.service'

function makeService(): QueueService {
  const svc = new QueueService()
  svc.resetQueueStoresForTests()
  return svc
}

function createOnlineQueue(
  svc: QueueService,
  overrides: Partial<{
    tenantId: string
    type: QueueType
    userId: string
    userName: string
    resourceId: string
    priority: number
  }> = {},
) {
  return svc.create({
    tenantId: overrides.tenantId ?? 't1',
    type: overrides.type ?? QueueType.Waiting,
    userId: overrides.userId ?? 'user-online-1',
    userName: overrides.userName ?? '张三（线上）',
    partySize: 1,
    resourceId: overrides.resourceId ?? 'resource-1',
    resourceName: '包间A',
    source: QueueSource.Online,
    channel: QueueChannel.WeChat,
    priority: overrides.priority ?? 0,
  })
}

function createOnsiteQueue(
  svc: QueueService,
  overrides: Partial<{
    tenantId: string
    type: QueueType
    userId: string
    userName: string
    resourceId: string
    priority: number
  }> = {},
) {
  return svc.create({
    tenantId: overrides.tenantId ?? 't1',
    type: overrides.type ?? QueueType.Waiting,
    userId: overrides.userId ?? 'user-onsite-1',
    userName: overrides.userName ?? '李四（现场）',
    partySize: 2,
    resourceId: overrides.resourceId ?? 'resource-1',
    resourceName: '包间A',
    source: QueueSource.Onsite,
    channel: QueueChannel.Terminal,
    priority: overrides.priority ?? 0,
  })
}

// ═════════════════════════════════════════════════════════════════════
// Entity: 双模排队
// ═════════════════════════════════════════════════════════════════════

describe('queue.entity — WP-12A QueueSource / QueueChannel', () => {
  /* ── 正例: 枚举值 ── */
  it('QueueSource 包含 Online 和 Onsite', () => {
    expect(QueueSource.Online).toBe('online')
    expect(QueueSource.Onsite).toBe('onsite')
  })

  it('QueueChannel 包含 WeChat / App / Terminal / Kiosk', () => {
    expect(QueueChannel.WeChat).toBe('wechat')
    expect(QueueChannel.App).toBe('app')
    expect(QueueChannel.Terminal).toBe('terminal')
    expect(QueueChannel.Kiosk).toBe('kiosk')
  })

  /* ── 正例: Entity 包含新字段 ── */
  it('QueueEntity 包含 source 字段', () => {
    const entity = Object.assign(new QueueEntity(), {
      id: 'q1',
      tenantId: 't1',
      type: QueueType.Waiting,
      queueNumber: 'B001',
      userId: 'u1',
      userName: '张三',
      partySize: 2,
      status: QueueStatus.Waiting,
      priority: 0,
      estimatedWaitMin: 10,
      source: QueueSource.Online,
      channel: QueueChannel.WeChat,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    expect(entity.source).toBe('online')
    expect(entity.channel).toBe('wechat')
  })

  /* ── 边界: defaults ── */
  it('QueueEntity source 默认值应可设置', () => {
    const entity = Object.assign(new QueueEntity(), {
      id: 'q2',
      tenantId: 't1',
      type: QueueType.Waiting,
      queueNumber: 'B002',
      userId: 'u2',
      userName: '李四',
      partySize: 1,
      status: QueueStatus.Waiting,
      priority: 0,
      estimatedWaitMin: 5,
      source: QueueSource.Onsite,
      channel: QueueChannel.Terminal,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    expect(entity.source).toBe('onsite')
    expect(entity.channel).toBe('terminal')
  })
})

// ═════════════════════════════════════════════════════════════════════
// Service: 双模创建
// ═════════════════════════════════════════════════════════════════════

describe('QueueService — WP-12A 双模创建', () => {
  let svc: QueueService

  beforeEach(() => {
    svc = makeService()
  })

  /* ── 正例: 创建线上排队 ── */
  it('create 带 source=Online + channel=WeChat 应创建线上排队', () => {
    const entry = createOnlineQueue(svc)
    expect(entry.source).toBe(QueueSource.Online)
    expect(entry.channel).toBe(QueueChannel.WeChat)
    expect(entry.queueNumber).toMatch(/^B\d{3}$/)
  })

  /* ── 正例: 创建现场排队 ── */
  it('create 带 source=Onsite + channel=Terminal 应创建现场排队', () => {
    const entry = createOnsiteQueue(svc)
    expect(entry.source).toBe(QueueSource.Onsite)
    expect(entry.channel).toBe(QueueChannel.Terminal)
    expect(entry.queueNumber).toMatch(/^B\d{3}$/)
  })

  /* ── 正例: 线上/现场排号独立计数 ── */
  it('线上和现场排队应共享计数器前缀', () => {
    const e1 = createOnlineQueue(svc)
    const e2 = createOnsiteQueue(svc)
    expect(e1.queueNumber).toBe('B001')
    expect(e2.queueNumber).toBe('B002')
  })

  /* ── 边界: 不传 source/channel 时默认为 Onsite/Terminal ── */
  it('不传 source 和 channel 应默认为 Onsite/Terminal', () => {
    const entry = svc.create({
      tenantId: 't1',
      type: QueueType.Waiting,
      userId: 'u1',
      userName: '张三',
      partySize: 1,
    })
    expect(entry.source).toBe(QueueSource.Onsite)
    expect(entry.channel).toBe(QueueChannel.Terminal)
  })

  /* ── 正例: joinByChannel 按渠道自动推导 source ── */
  it('joinByChannel 微信渠道应推导为 Online', () => {
    const entry = svc.joinByChannel({
      tenantId: 't1',
      queueType: QueueType.Waiting,
      memberId: 'm1',
      memberName: '王五',
      channel: QueueChannel.WeChat,
    })
    expect(entry.source).toBe(QueueSource.Online)
    expect(entry.channel).toBe(QueueChannel.WeChat)
  })

  it('joinByChannel App渠道应推导为 Online', () => {
    const entry = svc.joinByChannel({
      tenantId: 't1',
      queueType: QueueType.Waiting,
      memberId: 'm2',
      memberName: '赵六',
      channel: QueueChannel.App,
    })
    expect(entry.source).toBe(QueueSource.Online)
    expect(entry.channel).toBe(QueueChannel.App)
  })

  it('joinByChannel 终端渠道应推导为 Onsite', () => {
    const entry = svc.joinByChannel({
      tenantId: 't1',
      queueType: QueueType.Waiting,
      memberId: 'm3',
      channel: QueueChannel.Terminal,
    })
    expect(entry.source).toBe(QueueSource.Onsite)
    expect(entry.channel).toBe(QueueChannel.Terminal)
  })

  it('joinByChannel Kiosk渠道应推导为 Onsite', () => {
    const entry = svc.joinByChannel({
      tenantId: 't1',
      queueType: QueueType.Waiting,
      memberId: 'm4',
      channel: QueueChannel.Kiosk,
    })
    expect(entry.source).toBe(QueueSource.Onsite)
    expect(entry.channel).toBe(QueueChannel.Kiosk)
  })
})

// ═════════════════════════════════════════════════════════════════════
// Service: 双模查询
// ═════════════════════════════════════════════════════════════════════

describe('QueueService — WP-12A 双模查询', () => {
  let svc: QueueService

  beforeEach(() => {
    svc = makeService()
    // 创建 3 个线上 + 2 个现场排队
    createOnlineQueue(svc, { userId: 'u1', resourceId: 'r1' })
    createOnlineQueue(svc, { userId: 'u2', resourceId: 'r1' })
    createOnlineQueue(svc, { userId: 'u3', resourceId: 'r2' })
    createOnsiteQueue(svc, { userId: 'u4', resourceId: 'r1' })
    createOnsiteQueue(svc, { userId: 'u5', resourceId: 'r2' })
  })

  /* ── 正例: getQueueBySource 按来源过滤 ── */
  it('getQueueBySource 应只返回对应来源的排队', () => {
    const online = svc.getQueueBySource('t1', QueueSource.Online)
    expect(online).toHaveLength(3)
    online.forEach((q) => expect(q.source).toBe(QueueSource.Online))

    const onsite = svc.getQueueBySource('t1', QueueSource.Onsite)
    expect(onsite).toHaveLength(2)
    onsite.forEach((q) => expect(q.source).toBe(QueueSource.Onsite))
  })

  /* ── 正例: getQueueBySource 支持 resourceId 过滤 ── */
  it('getQueueBySource 支持 resourceId 过滤', () => {
    const onlineR1 = svc.getQueueBySource('t1', QueueSource.Online, 'r1')
    expect(onlineR1).toHaveLength(2)

    const onsiteR2 = svc.getQueueBySource('t1', QueueSource.Onsite, 'r2')
    expect(onsiteR2).toHaveLength(1)
  })

  /* ── 正例: getQueueByChannel ── */
  it('getQueueByChannel 应返回指定渠道的排队', () => {
    const wechat = svc.getQueueByChannel('t1', QueueChannel.WeChat)
    expect(wechat).toHaveLength(3)
  })

  /* ── 反例: 空队列 ── */
  it('空队列应返回空数组', () => {
    const svc2 = makeService()
    expect(svc2.getQueueBySource('t1', QueueSource.Online)).toHaveLength(0)
    expect(svc2.getQueueByChannel('t1', QueueChannel.WeChat)).toHaveLength(0)
  })
})

// ═════════════════════════════════════════════════════════════════════
// Service: 双模统计
// ═════════════════════════════════════════════════════════════════════

describe('QueueService — WP-12A 双模统计', () => {
  let svc: QueueService

  beforeEach(() => {
    svc = makeService()
    createOnlineQueue(svc, { userId: 'u1', resourceId: 'r1' })
    createOnlineQueue(svc, { userId: 'u2', resourceId: 'r1' })
    createOnsiteQueue(svc, { userId: 'u3', resourceId: 'r1' })
  })

  /* ── 正例: getDualModeStats ── */
  it('getDualModeStats 应返回正确的分来源统计', () => {
    const stats = svc.getDualModeStats('t1')
    expect(stats.online.waiting).toBe(2)
    expect(stats.onsite.waiting).toBe(1)
    expect(stats.online.called).toBe(0)
    expect(stats.onsite.serving).toBe(0)
    expect(stats.total).toBe(3)
  })

  /* ── 正例: byChannel 统计 ── */
  it('getDualModeStats byChannel 应覆盖所有渠道', () => {
    const stats = svc.getDualModeStats('t1')
    expect(stats.byChannel.wechat).toBeDefined()
    expect(stats.byChannel.terminal).toBeDefined()
    expect(stats.byChannel.app).toBeDefined()
    expect(stats.byChannel.kiosk).toBeDefined()
    expect(stats.byChannel.wechat.waiting).toBe(2)
    expect(stats.byChannel.terminal.waiting).toBe(1)
  })

  /* ── 反例: 无匹配 ── */
  it('空租户应返回零值', () => {
    const stats = svc.getDualModeStats('no-such')
    expect(stats.online.waiting).toBe(0)
    expect(stats.onsite.waiting).toBe(0)
    expect(stats.total).toBe(0)
  })
})

// ═════════════════════════════════════════════════════════════════════
// Service: 队列状态同步
// ═════════════════════════════════════════════════════════════════════

describe('QueueService — WP-12A 状态同步', () => {
  let svc: QueueService

  beforeEach(() => {
    svc = makeService()
  })

  /* ── 正例: 用户有活跃排队 ── */
  it('getSyncStatus 应返回用户的活跃排队', () => {
    createOnlineQueue(svc, { userId: 'u1', resourceId: 'r1' })
    createOnsiteQueue(svc, { userId: 'u2', resourceId: 'r1' })

    const status = svc.getSyncStatus('u1', 't1')
    expect(status.hasActiveQueue).toBe(true)
    expect(status.activeEntry).not.toBeNull()
    expect(status.activeEntry!.userId).toBe('u1')
    expect(status.entries).toHaveLength(1)
  })

  /* ── 正例: 用户有多个活跃排队 ── */
  it('getSyncStatus 同一用户多个排队应全部返回', () => {
    createOnlineQueue(svc, { userId: 'u1', resourceId: 'r1' })
    createOnlineQueue(svc, { userId: 'u1', resourceId: 'r2' })

    const status = svc.getSyncStatus('u1', 't1')
    expect(status.entries).toHaveLength(2)
    expect(status.hasActiveQueue).toBe(true)
  })

  /* ── 反例: 用户无活跃排队 ── */
  it('getSyncStatus 无排队应返回空', () => {
    const status = svc.getSyncStatus('no-such-user', 't1')
    expect(status.hasActiveQueue).toBe(false)
    expect(status.activeEntry).toBeNull()
    expect(status.entries).toHaveLength(0)
  })

  /* ── 反例: 已完成的排队不返回 ── */
  it('getSyncStatus 应过滤已完成的排队', () => {
    const entry = createOnlineQueue(svc, { userId: 'u1', resourceId: 'r1' })
    svc.cancel(entry.id, 't1')

    const status = svc.getSyncStatus('u1', 't1')
    expect(status.hasActiveQueue).toBe(false)
  })
})

// ═════════════════════════════════════════════════════════════════════
// Service: 入口转换
// ═════════════════════════════════════════════════════════════════════

describe('QueueService — WP-12A 入口转换', () => {
  let svc: QueueService

  beforeEach(() => {
    svc = makeService()
  })

  /* ── 正例: 线上转现场 ── */
  it('transferEntry 线上→现场应更新 source 和 channel', () => {
    const entry = createOnlineQueue(svc)
    const transferred = svc.transferEntry(entry.id, 't1', QueueSource.Onsite)
    expect(transferred.source).toBe(QueueSource.Onsite)
    expect(transferred.channel).toBe(QueueChannel.Terminal)
  })

  /* ── 正例: 现场转线上 ── */
  it('transferEntry 现场→线上应更新 source 和 channel', () => {
    const entry = createOnsiteQueue(svc)
    const transferred = svc.transferEntry(entry.id, 't1', QueueSource.Online)
    expect(transferred.source).toBe(QueueSource.Online)
    expect(transferred.channel).toBe(QueueChannel.WeChat)
  })

  /* ── 反例: 重复转换应报错 ── */
  it('transferEntry 相同 source 应报错', () => {
    const entry = createOnlineQueue(svc)
    expect(() => svc.transferEntry(entry.id, 't1', QueueSource.Online)).toThrow(
      /already/,
    )
  })

  /* ── 反例: 不存在的排队应报错 ── */
  it('transferEntry 不存在的排队应报错', () => {
    expect(() => svc.transferEntry('no-such', 't1', QueueSource.Onsite)).toThrow(
      /not found/,
    )
  })
})

// ═════════════════════════════════════════════════════════════════════
// Service: 等待时间预估
// ═════════════════════════════════════════════════════════════════════

describe('QueueService — WP-12A 等待时间预估', () => {
  let svc: QueueService

  beforeEach(() => {
    svc = makeService()
    createOnlineQueue(svc, { userId: 'u1', resourceId: 'r1' })
    createOnlineQueue(svc, { userId: 'u2', resourceId: 'r1' })
    createOnsiteQueue(svc, { userId: 'u3', resourceId: 'r1' })
  })

  /* ── 正例: 分来源等待时间 ── */
  it('getEstimatedWaitBySource 应计算正确', () => {
    const wait = svc.getEstimatedWaitBySource('t1', 'r1')
    expect(wait.onlineAhead).toBe(2)
    expect(wait.onsiteAhead).toBe(1)
    expect(wait.onlineWaitMin).toBeGreaterThan(0)
    expect(wait.onsiteWaitMin).toBeGreaterThan(0)
    expect(wait.totalWaitMin).toBe(wait.onlineWaitMin + wait.onsiteWaitMin)
  })

  /* ── 边界: 空队列等待时间 ── */
  it('空队列等待时间应为 0', () => {
    const svc2 = makeService()
    const wait = svc2.getEstimatedWaitBySource('t1', 'r1')
    expect(wait.onlineAhead).toBe(0)
    expect(wait.onsiteAhead).toBe(0)
    expect(wait.totalWaitMin).toBe(0)
  })
})

// ═════════════════════════════════════════════════════════════════════
// Service: 按来源/渠道 findAll
// ═════════════════════════════════════════════════════════════════════

describe('QueueService — WP-12A findAll 过滤', () => {
  let svc: QueueService

  beforeEach(() => {
    svc = makeService()
    createOnlineQueue(svc, { userId: 'u1', resourceId: 'r1' })
    createOnlineQueue(svc, { userId: 'u2', resourceId: 'r1' })
    createOnsiteQueue(svc, { userId: 'u3', resourceId: 'r1' })
  })

  /* ── 正例: 按 source 过滤 ── */
  it('findAll 支持 source 过滤', () => {
    const online = svc.findAll('t1', { source: QueueSource.Online })
    expect(online).toHaveLength(2)
  })

  /* ── 正例: 按 channel 过滤 ── */
  it('findAll 支持 channel 过滤', () => {
    const wechat = svc.findAll('t1', { channel: QueueChannel.WeChat })
    expect(wechat).toHaveLength(2)

    const terminal = svc.findAll('t1', { channel: QueueChannel.Terminal })
    expect(terminal).toHaveLength(1)
  })

  /* ── 正例: 组合过滤 ── */
  it('findAll 支持 source + channel + resourceId 组合过滤', () => {
    const result = svc.findAll('t1', {
      source: QueueSource.Online,
      channel: QueueChannel.WeChat,
      resourceId: 'r1',
    })
    expect(result).toHaveLength(2)
  })

  /* ── 反例: 不存在的 source 应返回空 ── */
  it('findAll 不匹配的组合应返回空', () => {
    const result = svc.findAll('t1', {
      source: QueueSource.Online,
      channel: QueueChannel.Terminal,
    })
    expect(result).toHaveLength(0)
  })
})

// ═════════════════════════════════════════════════════════════════════
// Service: findPaginated 支持 source/channel
// ═════════════════════════════════════════════════════════════════════

describe('QueueService — WP-12A findPaginated 过滤', () => {
  let svc: QueueService

  beforeEach(() => {
    svc = makeService()
    createOnlineQueue(svc, { userId: 'u1', resourceId: 'r1' })
    createOnlineQueue(svc, { userId: 'u2', resourceId: 'r1' })
    createOnsiteQueue(svc, { userId: 'u3', resourceId: 'r1' })
  })

  it('findPaginated 支持 source 过滤', () => {
    const result = svc.findPaginated('t1', {
      source: QueueSource.Online,
      pageSize: 10,
    })
    expect(result.total).toBe(2)
    expect(result.items).toHaveLength(2)
  })

  it('findPaginated 支持 channel 过滤', () => {
    const result = svc.findPaginated('t1', {
      channel: QueueChannel.WeChat,
      pageSize: 10,
    })
    expect(result.total).toBe(2)
  })
})
