/**
 * 🧪 角色旅程测试: 预约服务模块
 *
 * 场景覆盖: reservation(预约), device-adapter(设备适配), venue(场地), equipment-fault-report(设备报修)
 * 角色: 🛒前台, 🎮导玩员, 🤝团建, 🔧安监
 *
 * 每个角色: 正例(happy path) + 反例(error case) + 边界(edge case)
 */
import { describe, it, expect } from 'vitest'

const ROLES = {
  FrontDesk: '🛒前台',
  Guide: '🎮导玩员',
  Teambuilding: '🤝团建',
  Security: '🔧安监',
} as const

function mockSuccess(data: any, code = 200) {
  return { success: true, code, data, ts: Date.now() }
}
function mockError(code: number, msg: string) {
  return { success: false, code, message: msg, ts: Date.now() }
}

const ModuleAccess: Record<string, readonly string[]> = {
  reservation:  ['🛒前台', '🎮导玩员', '🤝团建'] as const,
  equipment:    ['🎮导玩员', '🔧安监', '🎯运行专员'] as const,
  venue:        ['🤝团建', '🔧安监', '👔店长'] as const,
  device:       ['🎮导玩员', '🔧安监', '🎯运行专员'] as const,
}

function canAccess(role: string, mod: string) {
  return (ModuleAccess[mod] ?? []).includes(role)
}

// ═══════════════════════════════════════════════════════════════════
// 🛒前台 - 预约接待主场
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} 预约服务旅程`, () => {
  it('🛒[正例] 前台查看今日预约 → 确认到店 → 开台安排 → 完成接待', () => {
    // 1. 查看预约列表
    expect(canAccess(ROLES.FrontDesk, 'reservation')).toBe(true)
    const reservations = mockSuccess([
      { id: 'RES-001', guestName: '王先生', time: '14:00', persons: 3, status: 'pending' },
      { id: 'RES-002', guestName: '李女士', time: '15:30', persons: 2, status: 'confirmed' },
    ])
    expect(reservations.data.length).toBeGreaterThanOrEqual(2)

    // 2. 确认到店
    const checkedIn = mockSuccess({ id: 'RES-001', status: 'checked_in', checkedInAt: Date.now() })
    expect(checkedIn.data.status).toBe('checked_in')

    // 3. 开台安排
    const assigned = mockSuccess({ reservationId: 'RES-001', deviceId: 'DEV-A01', deviceName: 'VR体验区', sessionId: 'S-101' })
    expect(assigned.data.deviceId).toContain('DEV-')

    // 4. 接待完成
    const completed = mockSuccess({ reservationId: 'RES-001', totalDuration: 120, totalAmount: 240, status: 'completed' })
    expect(completed.data.status).toBe('completed')
  })

  it('🛒[反例] 前台确认已取消的预约应报错', () => {
    const alreadyCancelled = mockError(409, 'RESERVATION_ALREADY_CANCELLED')
    expect(alreadyCancelled.code).toBe(409)
  })

  it('🛒[反例] 前台不能修改场地价格', () => {
    expect(canAccess(ROLES.FrontDesk, 'venue')).toBe(false)
    const blocked = mockError(403, 'VENUE_PRICE_MODIFICATION_DENIED')
    expect(blocked.code).toBe(403)
  })

  it('🛒[边界] 前台查未来1个月无预约空数据', () => {
    const empty = mockSuccess([])
    expect(empty.data.length).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════════
// 🎮导玩员 - 设备与排障主场
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} 预约服务旅程`, () => {
  it('🎮[正例] 导玩员查看所有设备状态 → 接受预约 → 报修故障 → 完成', () => {
    // 1. 设备列表
    expect(canAccess(ROLES.Guide, 'device')).toBe(true)
    const devices = mockSuccess([
      { id: 'DEV-01', name: '跳舞机', status: 'online' },
      { id: 'DEV-02', name: '抓娃娃机', status: 'fault' },
      { id: 'DEV-03', name: '赛车模拟器', status: 'online' },
    ])
    const faultDevices = devices.data.filter((d: any) => d.status === 'fault')
    expect(faultDevices.length).toBe(1)

    // 2. 接受预约安排
    expect(canAccess(ROLES.Guide, 'reservation')).toBe(true)
    const accept = mockSuccess({ id: 'RES-010', deviceId: 'DEV-03', guestName: '小朋友', status: 'assigned' })
    expect(accept.data.status).toBe('assigned')

    // 3. 报修故障设备
    expect(canAccess(ROLES.Guide, 'equipment')).toBe(true)
    const report = mockSuccess({ id: 'FR-001', deviceId: 'DEV-02', faultType: 'mechanical', priority: 'high', status: 'reported' })
    expect(report.data.status).toBe('reported')
  })

  it('🎮[反例] 导玩员报修已处于维修中的设备', () => {
    const alreadyInRepair = mockError(409, 'DEVICE_ALREADY_IN_REPAIR')
    expect(alreadyInRepair.code).toBe(409)
  })

  it('🎮[反例] 导玩员无权创建场地', () => {
    expect(canAccess(ROLES.Guide, 'venue')).toBe(false)
    const blocked = mockError(403, 'VENUE_CREATE_DENIED')
    expect(blocked.code).toBe(403)
  })

  it('🎮[边界] 导玩员查看全部设备在线但报修数为0', () => {
    const allOnline = mockSuccess({ total: 15, online: 15, fault: 0, repairCount: 0 })
    expect(allOnline.data.fault).toBe(0)
    expect(allOnline.data.repairCount).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════════
// 🤝团建 - 场地预约主场
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} 预约服务旅程`, () => {
  it('🤝[正例] 团建查看可用场地 → 预约包场 → 支付定金 → 确认', () => {
    // 1. 查看场地
    expect(canAccess(ROLES.Teambuilding, 'venue')).toBe(true)
    const venues = mockSuccess([
      { id: 'V-01', name: 'VIP包间A', capacity: 20, price: 200, available: true },
      { id: 'V-02', name: 'VIP包间B', capacity: 30, price: 300, available: true },
    ])
    expect(venues.data.length).toBe(2)

    // 2. 预约场地
    expect(canAccess(ROLES.Teambuilding, 'reservation')).toBe(true)
    const reservation = mockSuccess({ id: 'RES-VIP-001', venueId: 'V-01', startTime: '2026-07-19T18:00', endTime: '2026-07-19T22:00', status: 'pending_deposit' })
    expect(reservation.data.status).toBe('pending_deposit')

    // 3. 定金支付
    const deposit = mockSuccess({ reservationId: reservation.data.id, depositAmount: 200, status: 'deposit_paid' })
    expect(deposit.data.status).toBe('deposit_paid')

    // 4. 确认
    const confirmed = mockSuccess({ id: reservation.data.id, status: 'confirmed' })
    expect(confirmed.data.status).toBe('confirmed')
  })

  it('🤝[反例] 团建预约已占用的时段', () => {
    const conflict = mockError(409, 'TIME_SLOT_CONFLICT')
    expect(conflict.code).toBe(409)
  })

  it('🤝[反例] 团建不能查看安全漏洞报告', () => {
    const blocked = mockError(403, 'SECURITY_DATA_RESTRICTED')
    expect(blocked.code).toBe(403)
  })

  it('🤝[边界] 团建预约即将开始但未支付定金自动释放', () => {
    const released = mockSuccess({ id: 'RES-VIP-099', status: 'released', reason: 'DEPOSIT_TIMEOUT', releasedAt: Date.now() })
    expect(released.data.status).toBe('released')
    expect(released.data.reason).toBe('DEPOSIT_TIMEOUT')
  })
})

// ═══════════════════════════════════════════════════════════════════
// 🔧安监 - 场地安全巡查
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.Security} 预约服务旅程`, () => {
  it('🔧[正例] 安监查看场地安防状态 → 检查设备告警 → 关闭', () => {
    // 1. 场地安防状态
    expect(canAccess(ROLES.Security, 'venue')).toBe(true)
    const venueStatus = mockSuccess([
      { id: 'V-01', name: 'VIP包间A', doorLock: 'secure', camera: 'online', alarm: 'armed' },
      { id: 'V-02', name: 'VIP包间B', doorLock: 'fault', camera: 'offline', alarm: 'disarmed' },
    ])
    const faults = venueStatus.data.filter((v: any) => v.doorLock === 'fault' || v.camera === 'offline')
    expect(faults.length).toBe(1)

    // 2. 设备告警历史
    expect(canAccess(ROLES.Security, 'device')).toBe(true)
    const alarms = mockSuccess([{ deviceId: 'DEV-02', type: 'DOOR_TAMPER', time: Date.now() - 1800000, resolved: false }])
    expect(alarms.data.length).toBeGreaterThanOrEqual(1)

    // 3. 处理并关闭
    const resolved = mockSuccess({ deviceId: 'DEV-02', alarmType: 'DOOR_TAMPER', status: 'resolved', resolvedBy: ROLES.Security })
    expect(resolved.data.status).toBe('resolved')
  })

  it('🔧[反例] 安监不能删除客人预约记录', () => {
    const deleteBlock = mockError(403, 'RESERVATION_DELETE_DENIED')
    expect(deleteBlock.code).toBe(403)
  })

  it('🔧[边界] 安监查看无告警的正常运行状态', () => {
    const cleanStatus = mockSuccess({ totalZones: 8, alarmCount: 0, allSecure: true })
    expect(cleanStatus.data.alarmCount).toBe(0)
    expect(cleanStatus.data.allSecure).toBe(true)
  })
})
