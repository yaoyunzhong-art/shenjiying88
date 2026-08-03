import { describe, it, expect, assert } from 'vitest'
import {
  PushPlatform,
  PushStatus,
  PushPriority,
  PushScheduleStatus,
  PushTemplate,
  PushRecord,
  ScheduledPush,
  WSClient,
  WSMessage,
  PushStats,
  PushRecordEntity
} from './push.entity'

describe('Push Entity - Enums', () => {
  it('PushPlatform should have expected values', () => {
    expect(PushPlatform.iOS).toBe('iOS')
    expect(PushPlatform.Android).toBe('ANDROID')
    expect(PushPlatform.Web).toBe('WEB')
  })

  it('PushStatus should have expected values', () => {
    expect(PushStatus.Pending).toBe('PENDING')
    expect(PushStatus.Sent).toBe('SENT')
    expect(PushStatus.Failed).toBe('FAILED')
    expect(PushStatus.Cancelled).toBe('CANCELLED')
    expect(PushStatus.Revoked).toBe('REVOKED')
  })

  it('PushPriority should have expected values', () => {
    expect(PushPriority.High).toBe('HIGH')
    expect(PushPriority.Normal).toBe('NORMAL')
    expect(PushPriority.Low).toBe('LOW')
  })

  it('PushScheduleStatus should have expected values', () => {
    expect(PushScheduleStatus.Pending).toBe('PENDING')
    expect(PushScheduleStatus.Sent).toBe('SENT')
    expect(PushScheduleStatus.Cancelled).toBe('CANCELLED')
  })
})

describe('Push Entity - Interfaces', () => {
  it('PushTemplate should be constructable', () => {
    const template: PushTemplate = {
      id: 'pt_001',
      code: 'welcome_push',
      platform: PushPlatform.iOS,
      tenantId: 'tenant_1',
      title: 'Welcome',
      body: 'Welcome to our app!',
      sound: 'default',
      badge: 1,
      enabled: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    }

    expect(template.id).toBe('pt_001')
    expect(template.code).toBe('welcome_push')
    expect(template.platform).toBe(PushPlatform.iOS)
    expect(template.enabled).toBe(true)
    expect(template.badge).toBe(1)
  })

  it('PushTemplate should allow optional fields to be undefined', () => {
    const minimal: PushTemplate = {
      id: 'pt_002',
      code: 'minimal',
      platform: PushPlatform.Android,
      tenantId: 'tenant_1',
      body: 'Minimal body',
      enabled: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    }

    expect(minimal.title).toBeUndefined()
    expect(minimal.sound).toBeUndefined()
    expect(minimal.badge).toBeUndefined()
    expect(minimal.storeId).toBeUndefined()
  })

  it('PushRecord should be constructable', () => {
    const record: PushRecord = {
      id: 'push_001',
      deviceToken: 'a'.repeat(64),
      platform: PushPlatform.iOS,
      payload: {
        alert: 'Test alert',
        badge: 1,
        sound: 'default',
        extra: { key: 'value' }
      },
      priority: PushPriority.High,
      status: PushStatus.Sent,
      sentAt: '2026-01-01T00:00:00Z',
      tenantId: 'tenant_1',
      memberId: 'member_1'
    }

    expect(record.status).toBe(PushStatus.Sent)
    expect(record.payload.alert).toBe('Test alert')
    expect(record.payload.extra?.key).toBe('value')
  })

  it('ScheduledPush should be constructable', () => {
    const scheduled: ScheduledPush = {
      id: 'sched_001',
      memberId: 'member_1',
      tenantId: 'tenant_1',
      content: 'Reminder message',
      platform: PushPlatform.iOS,
      sendAt: new Date('2026-02-01T00:00:00Z'),
      status: PushScheduleStatus.Pending,
      createdAt: '2026-01-01T00:00:00Z'
    }

    expect(scheduled.status).toBe(PushScheduleStatus.Pending)
    expect(scheduled.content).toBe('Reminder message')
    expect(scheduled.sendAt instanceof Date).toBe(true)
  })

  it('WSClient should be constructable', () => {
    const client: WSClient = {
      clientId: 'client_1',
      userId: 'user_1',
      tenantId: 'tenant_1',
      connectedAt: '2026-01-01T00:00:00Z',
      sessionId: 'sess_001',
      platform: PushPlatform.Web
    }

    expect(client.clientId).toBe('client_1')
    expect(client.platform).toBe(PushPlatform.Web)
  })

  it('WSMessage should be constructable', () => {
    const msg: WSMessage = {
      channel: 'orders',
      data: { orderId: 'ord_001' },
      from: 'system',
      timestamp: '2026-01-01T00:00:00Z'
    }

    expect(msg.channel).toBe('orders')
    expect(msg.data).toEqual({ orderId: 'ord_001' })
  })

  it('PushStats should be constructable', () => {
    const stats: PushStats = {
      totalSent: 100,
      totalFailed: 2,
      activeConnections: 50,
      scheduledCount: 10,
      byPlatform: {
        [PushPlatform.iOS]: 80,
        [PushPlatform.Android]: 15,
        [PushPlatform.Web]: 5
      }
    }

    expect(stats.totalSent).toBe(100)
    expect(stats.byPlatform[PushPlatform.iOS]).toBe(80)
  })

  it('PushRecord should default status to PENDING when not explicitly sent', () => {
    const record: PushRecord = {
      id: 'push_002',
      deviceToken: 'b'.repeat(64),
      platform: PushPlatform.Android,
      payload: { alert: 'Android push' },
      priority: PushPriority.Normal,
      status: PushStatus.Pending,
      sentAt: '2026-01-01T00:00:00Z'
    }

    // 正常流程: 初试状态为 PENDING
    expect(record.status).toBe(PushStatus.Pending)
  })

  it('should handle all PushPriority values in a switch', () => {
    const getPriorityLabel = (p: PushPriority): string => {
      switch (p) {
        case PushPriority.High: return '紧急'
        case PushPriority.Normal: return '普通'
        case PushPriority.Low: return '低优'
      }
    }

    expect(getPriorityLabel(PushPriority.High)).toBe('紧急')
    expect(getPriorityLabel(PushPriority.Normal)).toBe('普通')
    expect(getPriorityLabel(PushPriority.Low)).toBe('低优')
  })
})

// ── PushRecordEntity (TypeORM 持久化实体) 测试 ────────────────────────────

describe('PushRecordEntity - CRUD (无数据库)', () => {
  // 准备通用的合约数据
  const makeRecord = (overrides: Partial<PushRecord> = {}): PushRecord => ({
    id: 'push_test_001',
    deviceToken: 'a'.repeat(64),
    platform: PushPlatform.iOS as any,
    payload: { alert: 'Test push', badge: 1, sound: 'default' },
    priority: PushPriority.High as any,
    status: PushStatus.Sent as any,
    sentAt: '2026-07-21T00:00:00.000Z',
    tenantId: 'tenant_test',
    memberId: 'member_test',
    ...overrides,
  })

  // ── C: fromContract → 新建 token 写入 ──

  it('C-1: fromContract 应正确构建实体 (id 为 PrimaryGeneratedColumn，fromContract 不设置)', () => {
    const record = makeRecord()
    const entity = PushRecordEntity.fromContract(record)

    // id 是 @PrimaryGeneratedColumn('uuid')，由 DB 生成，fromContract 不设置
    expect(entity.id).toBeUndefined()
    expect(entity.deviceToken).toBe('a'.repeat(64))
    expect(entity.platform).toBe('iOS')
    expect(entity.payload).toEqual({ alert: 'Test push', badge: 1, sound: 'default' })
    expect(entity.priority).toBe('HIGH')
    expect(entity.status).toBe('SENT')
    expect(entity.sentAt).toBeInstanceOf(Date)
    expect(entity.sentAt!.toISOString()).toBe('2026-07-21T00:00:00.000Z')
    expect(entity.tenantId).toBe('tenant_test')
    expect(entity.memberId).toBe('member_test')
    expect(entity.createdAt).toBeInstanceOf(Date)
  })

  it('C-2: fromContract 应允许 payload 为复杂嵌套对象', () => {
    const payload = {
      alert: 'Complex payload',
      extra: { deep: { key: 'value' }, list: [1, 2, 3] },
      sound: 'custom.wav',
    }
    const record = makeRecord({ payload })
    const entity = PushRecordEntity.fromContract(record)

    expect(entity.payload?.alert).toBe('Complex payload')
    expect(entity.payload?.extra).toEqual({ deep: { key: 'value' }, list: [1, 2, 3] })
    expect(entity.payload?.sound).toBe('custom.wav')
  })

  it('C-3: fromContract 应正确处理所有平台类型', () => {
    const platforms = [
      { platform: 'iOS' as const, contract: PushPlatform.iOS },
      { platform: 'ANDROID' as const, contract: PushPlatform.Android },
      { platform: 'WEB' as const, contract: PushPlatform.Web },
    ]
    for (const p of platforms) {
      const entity = PushRecordEntity.fromContract(makeRecord({ platform: p.contract as any }))
      expect(entity.platform).toBe(p.platform)
    }
  })

  it('C-4: fromContract 应正确处理所有优先级', () => {
    const priorities = [
      { priority: 'HIGH' as const, contract: PushPriority.High },
      { priority: 'NORMAL' as const, contract: PushPriority.Normal },
      { priority: 'LOW' as const, contract: PushPriority.Low },
    ]
    for (const p of priorities) {
      const entity = PushRecordEntity.fromContract(makeRecord({ priority: p.contract as any }))
      expect(entity.priority).toBe(p.priority)
    }
  })

  it('C-5: fromContract 应正确处理所有状态', () => {
    const statuses = [
      { status: 'PENDING' as const, contract: PushStatus.Pending },
      { status: 'SENT' as const, contract: PushStatus.Sent },
      { status: 'FAILED' as const, contract: PushStatus.Failed },
      { status: 'CANCELLED' as const, contract: PushStatus.Cancelled },
      { status: 'REVOKED' as const, contract: PushStatus.Revoked },
    ]
    for (const s of statuses) {
      const entity = PushRecordEntity.fromContract(makeRecord({ status: s.contract as any }))
      expect(entity.status).toBe(s.status)
    }
  })

  // ── R: toContract → 按 platform / deviceToken 查询 ──

  it('R-1: toContract 应正确转换为接口合约 (模拟 DB 返回后赋值 id)', () => {
    const entity = PushRecordEntity.fromContract(makeRecord())
    // 模拟 TypeORM 从 DB 加载后自动填充 id
    entity.id = 'push_db_001'
    const contract = entity.toContract()

    expect(contract.id).toBe('push_db_001')
    expect(contract.deviceToken).toBe('a'.repeat(64))
    expect(contract.platform).toBe(PushPlatform.iOS)
    expect(contract.payload.alert).toBe('Test push')
    expect(contract.payload.badge).toBe(1)
    expect(contract.payload.sound).toBe('default')
    expect(contract.priority).toBe(PushPriority.High)
    expect(contract.status).toBe(PushStatus.Sent)
    expect(contract.sentAt).toBe('2026-07-21T00:00:00.000Z')
    expect(contract.tenantId).toBe('tenant_test')
    expect(contract.memberId).toBe('member_test')
  })

  it('R-2: toContract 在 payload 为 null/undefined 时应回退到空 alert', () => {
    // 模拟 payload 为 undefined (数据库可能返回 null)
    const entity = PushRecordEntity.fromContract(makeRecord())
    entity.payload = undefined
    const contract = entity.toContract()

    // toContract 会回退到 { alert: '' }
    expect(contract.payload.alert).toBe('')
  })

  it('R-3: toContract 在 sentAt 为 undefined 时应回退到当前时间', () => {
    const entity = PushRecordEntity.fromContract(makeRecord())
    entity.sentAt = undefined
    const contract = entity.toContract()

    // sentAt 回退到 new Date().toISOString()，应该是一个有效 ISO 字符串
    expect(() => new Date(contract.sentAt)).not.toThrow()
    expect(typeof contract.sentAt).toBe('string')
  })

  it('R-4: toContract 应正确反映不同平台的值', () => {
    const entity = PushRecordEntity.fromContract(makeRecord({ platform: PushPlatform.Android as any }))
    const contract = entity.toContract()
    expect(contract.platform).toBe(PushPlatform.Android)
  })

  it('R-5: toContract 应正确反映不同优先级的值', () => {
    const entity = PushRecordEntity.fromContract(makeRecord({ priority: PushPriority.Low as any }))
    const contract = entity.toContract()
    expect(contract.priority).toBe(PushPriority.Low)
  })

  it('R-6: toContract 应正确反映不同状态的值', () => {
    const entity = PushRecordEntity.fromContract(makeRecord({ status: PushStatus.Failed as any }))
    const contract = entity.toContract()
    expect(contract.status).toBe(PushStatus.Failed)
  })

  // ── U: 更新 token → 修改 entity 属性并重新转换 ──

  it('U-1: 更新 deviceToken 应正确反映', () => {
    const entity = PushRecordEntity.fromContract(makeRecord())
    const newToken = 'b'.repeat(64)
    entity.deviceToken = newToken

    const contract = entity.toContract()
    expect(contract.deviceToken).toBe(newToken)
  })

  it('U-2: 更新 platform 应正确反映', () => {
    const entity = PushRecordEntity.fromContract(makeRecord({ platform: PushPlatform.iOS as any }))
    entity.platform = 'ANDROID'

    const contract = entity.toContract()
    expect(contract.platform).toBe(PushPlatform.Android)
  })

  it('U-3: 更新 status 状态流转应正确', () => {
    const entity = PushRecordEntity.fromContract(makeRecord({ status: PushStatus.Pending as any }))

    // 模拟: PENDING → SENT → REVOKED
    entity.status = 'SENT'
    expect(entity.toContract().status).toBe(PushStatus.Sent)

    entity.status = 'REVOKED'
    expect(entity.toContract().status).toBe(PushStatus.Revoked)
  })

  it('U-4: 更新 payload 应正确反映', () => {
    const entity = PushRecordEntity.fromContract(makeRecord())
    entity.payload = { alert: 'Updated message', badge: 2, extra: { ref: 'order_123' } }

    const contract = entity.toContract()
    expect(contract.payload.alert).toBe('Updated message')
    expect(contract.payload.badge).toBe(2)
    expect(contract.payload.extra?.ref).toBe('order_123')
  })

  it('U-5: 更新 tenantId / memberId 应正确反映', () => {
    const entity = PushRecordEntity.fromContract(makeRecord())
    entity.tenantId = 'tenant_new'
    entity.memberId = 'member_new'

    const contract = entity.toContract()
    expect(contract.tenantId).toBe('tenant_new')
    expect(contract.memberId).toBe('member_new')
  })

  // ── D: 删除 token (模拟清除 deviceToken) ──

  it('D-1: 清空 deviceToken 应反映在合约中', () => {
    const entity = PushRecordEntity.fromContract(makeRecord())
    entity.deviceToken = ''

    const contract = entity.toContract()
    expect(contract.deviceToken).toBe('')
  })

  it('D-2: 删除 tenantId 和 memberId (设为 undefined) 应反映', () => {
    const entity = PushRecordEntity.fromContract(makeRecord())
    entity.tenantId = undefined
    entity.memberId = undefined

    const contract = entity.toContract()
    expect(contract.tenantId).toBeUndefined()
    expect(contract.memberId).toBeUndefined()
  })

  it('D-3: 重置所有字段后应得到最小合约', () => {
    const entity = PushRecordEntity.fromContract(makeRecord())
    // 模拟删除后的状态: 清空所有可空字段
    entity.deviceToken = ''
    entity.payload = undefined
    entity.sentAt = undefined
    entity.tenantId = undefined
    entity.memberId = undefined

    const contract = entity.toContract()
    expect(contract.deviceToken).toBe('')
    expect(contract.payload.alert).toBe('')
    expect(typeof contract.sentAt).toBe('string')
    expect(contract.tenantId).toBeUndefined()
    expect(contract.memberId).toBeUndefined()
  })

  // ── 边界测试 ──

  it('EDGE-1: 超长 deviceToken (256字) 应正确存储', () => {
    const longToken = 'x'.repeat(256)
    const entity = PushRecordEntity.fromContract(makeRecord({ deviceToken: longToken }))

    expect(entity.deviceToken).toBe(longToken)
    expect(entity.deviceToken.length).toBe(256)
  })

  it('EDGE-2: payload 全空对象应正确传递', () => {
    const entity = PushRecordEntity.fromContract(makeRecord({ payload: { alert: '' } }))

    const contract = entity.toContract()
    expect(contract.payload.alert).toBe('')
  })

  it('EDGE-3: sentAt 为未来时间应保留', () => {
    const futureTime = '2099-12-31T23:59:59.999Z'
    const entity = PushRecordEntity.fromContract(makeRecord({ sentAt: futureTime }))

    const contract = entity.toContract()
    expect(contract.sentAt).toBe(futureTime)
  })
})

