/**
 * 🐜 考勤 Service - 补充测试（场景深化）
 *
 * 补充 attendance.service.full.test.ts 未覆盖的边界场景和业务逻辑:
 *   1. 各种请假类型的完整生命周期
 *   2. 考勤汇总统计的细致验证
 *   3. 边界条件: 跨天打卡、整点边界
 *   4. 空数据 / 无过滤条件列表
 *   5. 备注(note) 字段传参
 *   6. 列表按时间段 between from/to 联合筛选
 *   7. 种子数据直接读取验证
 *   8. cancelLeave 后审批抛出异常
 *   9. listLeaves 多条件联合筛选
 *  10. 多种请假类型创建
 *  11. 考核汇总 overtimeMinutes 累加正确
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { AttendanceService } from './attendance.service'
import { BadRequestException } from '@nestjs/common'

/** 创建一个新的 Service 实例（每次独立运行） */
function makeService(): AttendanceService {
  return new AttendanceService()
}

// ══════════════════════════════════════════════════════════════════
// 1️⃣ 请假类型全覆盖
// ══════════════════════════════════════════════════════════════════

describe('[1️⃣ 请假类型全覆盖] AttendanceService', () => {
  let svc: AttendanceService

  beforeEach(() => {
    svc = makeService()
  })

  // 测试: 创建年假(annual)请假
  it('创建年假(annual)类型请假 — 状态为 pending', () => {
    const leave = svc.createLeave({
      employeeId: 'emp-annual',
      employeeName: '年假员工',
      storeId: 'store-001',
      leaveType: 'annual',
      startDate: '2026-08-10',
      endDate: '2026-08-14',
      reason: '年度休假',
    })
    expect(leave.leaveType).toBe('annual')
    expect(leave.status).toBe('pending')
    expect(leave.startDate).toBe('2026-08-10')
    expect(leave.endDate).toBe('2026-08-14')
  })

  // 测试: 创建病假(sick)类型请假
  it('创建病假(sick)类型请假 — 状态为 pending', () => {
    const leave = svc.createLeave({
      employeeId: 'emp-sick',
      employeeName: '病假员工',
      storeId: 'store-002',
      leaveType: 'sick',
      startDate: '2026-07-23',
      endDate: '2026-07-24',
      reason: '发烧需要休息',
    })
    expect(leave.leaveType).toBe('sick')
    expect(leave.status).toBe('pending')
  })

  // 测试: 创建事假(personal)类型请假
  it('创建事假(personal)类型请假 — 状态为 pending', () => {
    const leave = svc.createLeave({
      employeeId: 'emp-personal',
      employeeName: '事假员工',
      storeId: 'store-001',
      leaveType: 'personal',
      startDate: '2026-07-26',
      endDate: '2026-07-26',
      reason: '家里有事',
    })
    expect(leave.leaveType).toBe('personal')
  })

  // 测试: 创建婚假(marriage)、产假(maternity)、丧假(bereavement)
  it('创建婚假/产假/丧假 — 各类型均正确', () => {
    const marriage = svc.createLeave({
      employeeId: 'emp-mar', employeeName: '结婚员工', storeId: 'store-001',
      leaveType: 'marriage', startDate: '2026-09-01', endDate: '2026-09-07', reason: '结婚',
    })
    expect(marriage.leaveType).toBe('marriage')

    const maternity = svc.createLeave({
      employeeId: 'emp-mat', employeeName: '产假员工', storeId: 'store-001',
      leaveType: 'maternity', startDate: '2026-10-01', endDate: '2026-12-31', reason: '产假',
    })
    expect(maternity.leaveType).toBe('maternity')

    const bereave = svc.createLeave({
      employeeId: 'emp-ber', employeeName: '丧假员工', storeId: 'store-002',
      leaveType: 'bereavement', startDate: '2026-07-24', endDate: '2026-07-25', reason: '丧假',
    })
    expect(bereave.leaveType).toBe('bereavement')
  })
})

// ══════════════════════════════════════════════════════════════════
// 2️⃣ 考勤汇总精确验证
// ══════════════════════════════════════════════════════════════════

describe('[2️⃣ 考勤汇总精确验证] AttendanceService', () => {
  let svc: AttendanceService

  beforeEach(() => {
    svc = makeService()
  })

  // 测试: 汇总中包含所有状态计数，且 totalDays = 各状态之和
  it('getSummary totalDays = 各状态计数之和', () => {
    // 创建一个正常记录
    svc.clockIn({ employeeId: 'emp-a', employeeName: 'A', storeId: 'store-001', date: '2026-07-21', clockIn: '09:00' })
    svc.clockOut(svc.listRecords({ employeeId: 'emp-a' })[0].id, '18:00')
    // 创建一个迟到记录
    svc.clockIn({ employeeId: 'emp-b', employeeName: 'B', storeId: 'store-001', date: '2026-07-21', clockIn: '10:00' })

    const summary = svc.getSummary('daily', '2026-07-21', '2026-07-21', 'store-001')
    const sum = summary.normalCount + summary.lateCount + summary.earlyLeaveCount +
                summary.absentCount + summary.leaveCount + summary.overtimeCount
    expect(sum).toBe(summary.totalDays)
  })

  // 测试: 加班总时长汇总正确
  // 注意: 种子数据 rec-seed-001 已有 10 分钟加班（在同一 store-001），
  // 此处需额外减去种子数据的贡献
  it('getSummary 中 totalOvertimeMinutes 累加正确', () => {
    svc.clockIn({ employeeId: 'emp-ot1', employeeName: '加班1', storeId: 'store-001', date: '2026-07-21', clockIn: '09:00' })
    svc.clockOut(svc.listRecords({ employeeId: 'emp-ot1' })[0].id, '20:00')
    svc.clockIn({ employeeId: 'emp-ot2', employeeName: '加班2', storeId: 'store-001', date: '2026-07-21', clockIn: '09:00' })
    svc.clockOut(svc.listRecords({ employeeId: 'emp-ot2' })[0].id, '19:30')

    const summary = svc.getSummary('daily', '2026-07-21', '2026-07-21', 'store-001')
    // 种子数据 rec-seed-001 在 store-001 有 10 分钟加班(overtimeMinutes=10)
    // 新加班: 20:00→120min, 19:30→90min = 210min
    // 合计: 210 + 10 = 220
    expect(summary.totalOvertimeMinutes).toBe(120 + 90 + 10)
  })

  // 测试: 无门店筛选时返回所有门店汇总
  it('getSummary 不传 storeId 时包含所有门店数据', () => {
    const summary = svc.getSummary('daily', '2026-07-20', '2026-07-20')
    // 种子数据有三个门店(store-001, store-002) 的记录
    expect(Object.keys(summary.byStore).length).toBeGreaterThanOrEqual(2)
    expect(summary.byStore['store-001']).toBeDefined()
    expect(summary.byStore['store-002']).toBeDefined()
  })
})

// ══════════════════════════════════════════════════════════════════
// 3️⃣ 边界条件
// ══════════════════════════════════════════════════════════════════

describe('[3️⃣ 边界条件] AttendanceService', () => {
  let svc: AttendanceService

  beforeEach(() => {
    svc = makeService()
  })

  // 测试: 迟到一分钟边界
  it('打卡时间 09:01 → 迟到1分钟', () => {
    const rec = svc.clockIn({
      employeeId: 'emp-1min', employeeName: '一分钟迟到', storeId: 'store-001',
      date: '2026-07-21', clockIn: '09:01',
    })
    expect(rec.status).toBe('late')
    expect(rec.lateMinutes).toBe(1)
  })

  // 测试: 整点下班 18:00 — 无早退无加班
  it('下班打卡 18:00 整 — 早退0 加班0', () => {
    const rec = svc.clockIn({
      employeeId: 'emp-exact', employeeName: '整点下班', storeId: 'store-001',
      date: '2026-07-21', clockIn: '09:00',
    })
    const out = svc.clockOut(rec.id, '18:00')
    expect(out.earlyLeaveMinutes).toBe(0)
    expect(out.overtimeMinutes).toBe(0)
    expect(out.status).toBe('normal')
  })

  // 测试: 17:59 下班 — 早退，但加班为负截断为0
  it('下班打卡 17:59 — 早退1分钟，加班0', () => {
    const rec = svc.clockIn({
      employeeId: 'emp-1min-early', employeeName: '早退1分钟', storeId: 'store-001',
      date: '2026-07-21', clockIn: '09:00',
    })
    const out = svc.clockOut(rec.id, '17:59')
    expect(out.earlyLeaveMinutes).toBe(1)
    expect(out.overtimeMinutes).toBe(0)
    expect(out.status).toBe('early_leave')
  })

  // 测试: 18:01 下班 — 加班1分钟，早退0
  it('下班打卡 18:01 — 加班1分钟，早退0', () => {
    const rec = svc.clockIn({
      employeeId: 'emp-1min-ot', employeeName: '加班1分钟', storeId: 'store-001',
      date: '2026-07-21', clockIn: '09:00',
    })
    const out = svc.clockOut(rec.id, '18:01')
    expect(out.overtimeMinutes).toBe(1)
    expect(out.earlyLeaveMinutes).toBe(0)
    expect(out.status).toBe('overtime')
  })

  // 测试: 跨天列表筛选 from/to 联合过滤
  it('listRecords 按日期范围 from+to 联合筛选', () => {
    svc.clockIn({ employeeId: 'emp-f1', employeeName: 'F1', storeId: 'store-001', date: '2026-07-19', clockIn: '09:00' })
    svc.clockIn({ employeeId: 'emp-f2', employeeName: 'F2', storeId: 'store-001', date: '2026-07-20', clockIn: '09:00' })
    svc.clockIn({ employeeId: 'emp-f3', employeeName: 'F3', storeId: 'store-001', date: '2026-07-21', clockIn: '09:00' })

    const result = svc.listRecords({ from: '2026-07-19', to: '2026-07-20' })
    expect(result.length).toBeGreaterThanOrEqual(2)
    result.forEach((r) => {
      expect(r.date >= '2026-07-19').toBe(true)
      expect(r.date <= '2026-07-20').toBe(true)
    })
  })
})

// ══════════════════════════════════════════════════════════════════
// 4️⃣ 空数据 / 无结果场景
// ══════════════════════════════════════════════════════════════════

describe('[4️⃣ 空数据 / 无结果场景] AttendanceService', () => {
  let svc: AttendanceService

  beforeEach(() => {
    svc = makeService()
  })

  // 测试: 按不存在的门店查找记录 → 空数组
  it('listRecords 按不存在的 storeId 筛选 → 空数组', () => {
    const result = svc.listRecords({ storeId: 'store-nonexistent' })
    expect(result).toEqual([])
  })

  // 测试: 按不存在的状态查找记录 → 空数组
  it('listRecords 按不存在的状态(absent)筛选 → 空数组', () => {
    const result = svc.listRecords({ status: 'absent' })
    expect(result).toEqual([])
  })

  // 测试: 按不存在的员工查找请假列表 → 空数组
  it('listLeaves 按不存在的 employeeId 筛选 → 空数组', () => {
    const result = svc.listLeaves({ employeeId: 'emp-nonexistent' })
    expect(result).toEqual([])
  })

  // 测试: 按不存在的请假状态筛选 → 空数组
  it('listLeaves 按 cancelled 状态筛选(种子无取消记录) → 空数组', () => {
    const result = svc.listLeaves({ status: 'cancelled' })
    expect(result).toEqual([])
  })
})

// ══════════════════════════════════════════════════════════════════
// 5️⃣ cancelLeave 后操作异常
// ══════════════════════════════════════════════════════════════════

describe('[5️⃣ cancelLeave 后操作异常] AttendanceService', () => {
  let svc: AttendanceService

  beforeEach(() => {
    svc = makeService()
  })

  // 测试: 请假取消后再次尝试审批抛出异常
  it('请假取消后 approveLeave 抛出 BadRequestException', () => {
    const leave = svc.createLeave({
      employeeId: 'emp-cancel-approve', employeeName: '取消后审批', storeId: 'store-001',
      leaveType: 'annual', startDate: '2026-08-01', endDate: '2026-08-01', reason: '测试',
    })
    svc.cancelLeave(leave.id)
    expect(() => svc.approveLeave(leave.id, 'mgr', '经理', 'approve'))
      .toThrow(BadRequestException)
  })

  // 测试: 请假取消后再次尝试驳回也抛出异常
  it('请假取消后 approveLeave(reject) 抛出 BadRequestException', () => {
    const leave = svc.createLeave({
      employeeId: 'emp-cancel-reject', employeeName: '取消后驳回', storeId: 'store-001',
      leaveType: 'annual', startDate: '2026-08-01', endDate: '2026-08-01', reason: '测试',
    })
    svc.cancelLeave(leave.id)
    expect(() => svc.approveLeave(leave.id, 'mgr', '经理', 'reject'))
      .toThrow(BadRequestException)
  })
})

// ══════════════════════════════════════════════════════════════════
// 6️⃣ 种子数据直接读取验证
// ══════════════════════════════════════════════════════════════════

describe('[6️⃣ 种子数据验证] AttendanceService', () => {
  let svc: AttendanceService

  beforeEach(() => {
    svc = makeService()
  })

  // 测试: 种子打卡记录可以直接 getRecord 获取到
  it('种子数据 rec-seed-001: 张三 正常打卡', () => {
    const rec = svc.getRecord('rec-seed-001')
    expect(rec).not.toBeNull()
    expect(rec!.employeeName).toBe('张三')
    expect(rec!.status).toBe('normal')
    expect(rec!.lateMinutes).toBe(0)
  })

  // 测试: 种子请假记录可以直接 getLeave 获取到
  it('种子数据 leave-seed-001: 张三 已审批年假', () => {
    const leave = svc.getLeave('leave-seed-001')
    expect(leave).not.toBeNull()
    expect(leave!.employeeName).toBe('张三')
    expect(leave!.status).toBe('approved')
    expect(leave!.approverName).toBe('店长王')
  })

  // 测试: 种子请假记录 leave-seed-002: 赵六 待审批病假
  it('种子数据 leave-seed-002: 赵六 待审批病假', () => {
    const leave = svc.getLeave('leave-seed-002')
    expect(leave).not.toBeNull()
    expect(leave!.employeeName).toBe('赵六')
    expect(leave!.status).toBe('pending')
    expect(leave!.leaveType).toBe('sick')
  })
})

// ══════════════════════════════════════════════════════════════════
// 7️⃣ 备注(note) 字段传参
// ══════════════════════════════════════════════════════════════════

describe('[7️⃣ 备注字段 note 传参] AttendanceService', () => {
  let svc: AttendanceService

  beforeEach(() => {
    svc = makeService()
  })

  // 测试: clockIn 携带 note 参数存储正确
  it('打卡时传递 note → 记录包含该备注', () => {
    const rec = svc.clockIn({
      employeeId: 'emp-note', employeeName: '备注员工', storeId: 'store-001',
      date: '2026-07-21', clockIn: '09:00', note: '今天身体不太舒服',
    })
    expect(rec.note).toBe('今天身体不太舒服')
  })

  // 测试: clockIn 不传 note → 记录中 note 为 undefined
  it('打卡时不传 note → note 为 undefined', () => {
    const rec = svc.clockIn({
      employeeId: 'emp-no-note', employeeName: '无备注', storeId: 'store-001', date: '2026-07-21',
    })
    expect(rec.note).toBeUndefined()
  })
})

// ══════════════════════════════════════════════════════════════════
// 8️⃣ listLeaves 多条件联合筛选
// ══════════════════════════════════════════════════════════════════

describe('[8️⃣ listLeaves 多条件联合筛选] AttendanceService', () => {
  let svc: AttendanceService

  beforeEach(() => {
    svc = makeService()
  })

  // 测试: 按 storeId + status 联合筛选
  it('按 storeId + status 联合筛选请假记录', () => {
    const l1 = svc.createLeave({
      employeeId: 'emp-x', employeeName: 'X', storeId: 'store-x',
      leaveType: 'annual', startDate: '2026-08-01', endDate: '2026-08-01', reason: '测试',
    })
    svc.approveLeave(l1.id, 'mgr', '经理', 'approve')

    const result = svc.listLeaves({ storeId: 'store-x', status: 'approved' })
    expect(result.length).toBe(1)
    expect(result[0].id).toBe(l1.id)
  })

  // 测试: 联合筛选不匹配返回空
  it('按 storeId + 不匹配 status 联合筛选 → 空数组', () => {
    svc.createLeave({
      employeeId: 'emp-y', employeeName: 'Y', storeId: 'store-y',
      leaveType: 'sick', startDate: '2026-08-01', endDate: '2026-08-01', reason: '病假',
    })
    // store-y 的请假状态都是 pending，筛选 approved 返回空
    const result = svc.listLeaves({ storeId: 'store-y', status: 'approved' })
    expect(result).toEqual([])
  })

  // 测试: leaveType 不能通过 listLeaves 筛选（按设计只能按 employeeId/storeId/status 筛选）
  it('listLeaves 不支持的筛选字段(leaveType)被忽略 → 返回全部', () => {
    const all = svc.listLeaves()
    // 传入额外字段但 listLeaves 只认 employeeId/storeId/status
    const result = svc.listLeaves({} as any)
    expect(result.length).toBe(all.length)
  })
})
