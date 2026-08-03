/**
 * logistics.maintenance.test.ts — P-30 设备维保模块测试
 *
 * 状态机: pending(待处理) → in_progress(处理中) → pending_acceptance(待验收) → completed(已完成)
 *
 * 覆盖:
 *   正例 × 6: 创建/查询/列表/完整流程/过滤/跨租户
 *   反例 × 5: 状态转换错误/参数缺失
 *   边界 × 2: 日期校验/不存在
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { LogisticsService } from './logistics.service'

describe('LogisticsService — 设备维保 (MaintenanceOrder)', () => {
  let service: LogisticsService

  beforeEach(() => {
    service = new LogisticsService()
    service.resetStoreForTests()
  })

  const T = { tenantId: 't-001', storeId: 'store-a' }

  // ── 正例 (6) ───────────────────────────────────────

  it('创建设备维保订单 → 状态为pending', () => {
    const order = service.createMaintenanceOrder({
      ...T,
      equipmentId: 'e-1',
      equipmentName: '跳舞机',
      issueDescription: '踏板感应器失灵',
      reporterId: 'u-1',
      reporterName: '导玩小王',
    })
    expect(order.id).toMatch(/^mnt-/)
    expect(order.status).toBe('pending')
    expect(order.equipmentName).toBe('跳舞机')
    expect(order.issueDescription).toBe('踏板感应器失灵')
  })

  it('startMaintenanceOrder 将状态转为 in_progress', () => {
    const order = service.createMaintenanceOrder({
      ...T, equipmentId: 'e-2', equipmentName: '抓娃娃机',
      issueDescription: '爪子松动', reporterId: 'u-1', reporterName: '小王',
    })
    const started = service.startMaintenanceOrder(order.id, T.tenantId, {
      assigneeId: 'tech-1',
      assigneeName: '赵维修',
    })
    expect(started.status).toBe('in_progress')
    expect(started.assigneeName).toBe('赵维修')
    expect(started.startedAt).toBeDefined()
  })

  it('completeMaintenanceOrder 将状态转为 pending_acceptance', () => {
    const order = service.createMaintenanceOrder({
      ...T, equipmentId: 'e-3', equipmentName: '跳舞机',
      issueDescription: '踏板故障', reporterId: 'u-1', reporterName: '小王',
    })
    service.startMaintenanceOrder(order.id, T.tenantId, {
      assigneeId: 'tech-1', assigneeName: '赵维修',
    })
    const completed = service.completeMaintenanceOrder(order.id, T.tenantId, {
      completionNote: '已更换踏板传感器，测试正常',
    })
    expect(completed.status).toBe('pending_acceptance')
    expect(completed.completionNote).toBe('已更换踏板传感器，测试正常')
  })

  it('acceptMaintenanceOrder 将状态转为 completed (闭环)', () => {
    const order = service.createMaintenanceOrder({
      ...T, equipmentId: 'e-4', equipmentName: '扭蛋机',
      issueDescription: '投币器故障', reporterId: 'u-1', reporterName: '小王',
    })
    service.startMaintenanceOrder(order.id, T.tenantId, { assigneeId: 'tech-1', assigneeName: '赵维修' })
    service.completeMaintenanceOrder(order.id, T.tenantId, { completionNote: '投币器已更换' })

    const accepted = service.acceptMaintenanceOrder(order.id, T.tenantId, {
      acceptedBy: 'manager-1',
      acceptanceNote: '复测通过，设备正常运行',
    })
    expect(accepted.status).toBe('completed')
    expect(accepted.acceptanceNote).toBe('复测通过，设备正常运行')
    expect(accepted.acceptedBy).toBe('manager-1')
    expect(accepted.acceptedAt).toBeDefined()
  })

  it('维保完整闭环: pending → in_progress → pending_acceptance → completed', () => {
    const order = service.createMaintenanceOrder({
      ...T, equipmentId: 'e-5', equipmentName: '空调',
      issueDescription: '制冷不足', reporterId: 'u-1', reporterName: '前台小李',
    })
    expect(order.status).toBe('pending')

    const s1 = service.startMaintenanceOrder(order.id, T.tenantId, { assigneeId: 'tech-1', assigneeName: '张维修' })
    expect(s1.status).toBe('in_progress')

    const s2 = service.completeMaintenanceOrder(order.id, T.tenantId, { completionNote: '清洗滤网，添加冷媒' })
    expect(s2.status).toBe('pending_acceptance')

    const s3 = service.acceptMaintenanceOrder(order.id, T.tenantId, { acceptedBy: 'u-1', acceptanceNote: '制冷恢复正常' })
    expect(s3.status).toBe('completed')
  })

  it('listMaintenanceOrders 支持按状态和设备过滤', () => {
    const o1 = service.createMaintenanceOrder({
      ...T, equipmentId: 'e-10', equipmentName: '设备10',
      issueDescription: '故障A', reporterId: 'u-1', reporterName: '小王',
    })
    service.createMaintenanceOrder({
      ...T, equipmentId: 'e-11', equipmentName: '设备11',
      issueDescription: '故障B', reporterId: 'u-2', reporterName: '小李',
    })
    service.startMaintenanceOrder(o1.id, T.tenantId, { assigneeId: 'tech-1', assigneeName: '赵' })

    const pending = service.listMaintenanceOrders(T.tenantId, { status: 'pending' })
    expect(pending).toHaveLength(1)

    const byEquipment = service.listMaintenanceOrders(T.tenantId, { equipmentId: 'e-10' })
    expect(byEquipment).toHaveLength(1)
  })

  // ── 反例 (5) ───────────────────────────────────────

  it('从 pending 不能直接跳到 pending_acceptance', () => {
    const order = service.createMaintenanceOrder({
      ...T, equipmentId: 'e-20', equipmentName: 'E20',
      issueDescription: '故障', reporterId: 'u-1', reporterName: '小王',
    })
    expect(() =>
      service.completeMaintenanceOrder(order.id, T.tenantId, { completionNote: '跳过' })
    ).toThrow('cannot complete from status pending')
  })

  it('从 pending 不能直接到 completed', () => {
    const order = service.createMaintenanceOrder({
      ...T, equipmentId: 'e-21', equipmentName: 'E21',
      issueDescription: '异常', reporterId: 'u-1', reporterName: '小王',
    })
    expect(() =>
      service.acceptMaintenanceOrder(order.id, T.tenantId, {
        acceptedBy: 'mgr', acceptanceNote: '跳过'
      })
    ).toThrow('cannot be accepted from status pending')
  })

  it('从 in_progress 不能直接到 completed (跳过验收)', () => {
    const order = service.createMaintenanceOrder({
      ...T, equipmentId: 'e-22', equipmentName: 'E22',
      issueDescription: '故障', reporterId: 'u-1', reporterName: '小王',
    })
    service.startMaintenanceOrder(order.id, T.tenantId, { assigneeId: 'tech-1', assigneeName: '赵' })
    expect(() =>
      service.acceptMaintenanceOrder(order.id, T.tenantId, {
        acceptedBy: 'mgr', acceptanceNote: '直接验收'
      })
    ).toThrow('cannot be accepted from status in_progress')
  })

  it('创建维保订单缺 issueDescription 应报错', () => {
    expect(() =>
      service.createMaintenanceOrder({
        ...T, equipmentId: 'e-23', equipmentName: 'E23',
        issueDescription: '   ', reporterId: 'u-1', reporterName: '小王',
      })
    ).toThrow('issueDescription')
  })

  it('completeMaintenanceOrder 缺 completionNote 应报错', () => {
    const order = service.createMaintenanceOrder({
      ...T, equipmentId: 'e-24', equipmentName: 'E24',
      issueDescription: '故障', reporterId: 'u-1', reporterName: '小王',
    })
    service.startMaintenanceOrder(order.id, T.tenantId, { assigneeId: 'tech-1', assigneeName: '赵' })
    expect(() =>
      service.completeMaintenanceOrder(order.id, T.tenantId, { completionNote: '   ' })
    ).toThrow('completionNote')
  })

  // ── 边界 (2) ───────────────────────────────────────

  it('getMaintenanceOrder 不存在的 id 返回 undefined', () => {
    const result = service.getMaintenanceOrder('nonexistent', T.tenantId)
    expect(result).toBeUndefined()
  })

  it('getMaintenanceOrder 错误 tenant 返回 undefined', () => {
    const order = service.createMaintenanceOrder({
      ...T, equipmentId: 'e-30', equipmentName: 'E30',
      issueDescription: '故障', reporterId: 'u-1', reporterName: '小王',
    })
    expect(service.getMaintenanceOrder(order.id, 'wrong-tenant')).toBeUndefined()
  })
})
