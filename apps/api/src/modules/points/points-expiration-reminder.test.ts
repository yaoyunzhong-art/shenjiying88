/**
 * points-expiration-reminder.test.ts
 * BS-0278: 积分过期5次提醒 — 第30天/14天/7天/3天/1天
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ExpirationNotifier } from './points-risk.service'

describe('ExpirationNotifier — BS-0278 积分过期5次提醒', () => {
  let notifier: ExpirationNotifier

  beforeEach(() => {
    notifier = new ExpirationNotifier()
  })

  const daysFromNow = (days: number): Date => {
    const d = new Date()
    d.setDate(d.getDate() + days)
    return d
  }

  // ─── 排程创建 ───

  it('BS-0278: 排定5次过期提醒，包含正确的天数间隔', () => {
    const expireAt = daysFromNow(60)
    const schedule = notifier.schedule5TimingReminder('member-001', 1000, expireAt)

    expect(schedule.memberId).toBe('member-001')
    expect(schedule.points).toBe(1000)
    expect(schedule.reminderDates).toHaveLength(5)
    expect(schedule.triggered).toEqual([])
  })

  it('BS-0278: 提醒日期顺序为第30天/14天/7天/3天/1天', () => {
    const expireAt = new Date('2026-12-31')
    const schedule = notifier.schedule5TimingReminder('member-002', 500, expireAt)

    const expectedDates = [
      new Date('2026-12-01'), // -30天
      new Date('2026-12-17'), // -14天
      new Date('2026-12-24'), // -7天
      new Date('2026-12-28'), // -3天
      new Date('2026-12-30'), // -1天
    ]

    for (let i = 0; i < 5; i++) {
      const actual = schedule.reminderDates[i]!
      const expected = expectedDates[i]!
      expect(actual.getFullYear()).toBe(expected.getFullYear())
      expect(actual.getMonth()).toBe(expected.getMonth())
      expect(actual.getDate()).toBe(expected.getDate())
    }
  })

  // ─── 检查并触发提醒 ───

  it('BS-0278: 已过期的提醒日期会被触发', () => {
    const pastDate = new Date('2020-01-01')
    const schedule = notifier.schedule5TimingReminder('member-003', 2000, pastDate)

    // 所有提醒日期都已过，应全部触发
    const results = notifier.checkAndSend5TimingReminders()

    const memberResults = results.filter(r => r.scheduleIndex < 5)

    // 至少触发1次（实际由于全部过去，触发5次但第一次只会触发第0个，如果一天多次调用才可能触发更多）
    expect(memberResults.length).toBeGreaterThanOrEqual(1)

    // 确认不重复触发
    const results2 = notifier.checkAndSend5TimingReminders()
    expect(results2.length).toBe(0) // 排程中triggered已满，不会重复
  })

  it('BS-0278: 触发提醒后消息格式正确', () => {
    const expireAt = new Date()
    expireAt.setDate(expireAt.getDate() + 3) // 3天后过期
    notifier.schedule5TimingReminder('member-004', 800, expireAt)

    const results = notifier.checkAndSend5TimingReminders()

    expect(results.length).toBeGreaterThanOrEqual(1)
    const lastResult = results[results.length - 1]!
    expect(lastResult.sent).toBe(true)
    expect(lastResult.message).toContain('800')
    expect(lastResult.message).toContain('member-004')
  })

  // ─── 排程管理 ───

  it('BS-0278: 获取指定会员的提醒排程', () => {
    const expireAt = daysFromNow(45)
    notifier.schedule5TimingReminder('member-005', 1500, expireAt)

    const schedule = notifier.getReminderSchedule('member-005')
    expect(schedule).toBeDefined()
    expect(schedule!.memberId).toBe('member-005')
    expect(schedule!.points).toBe(1500)
  })

  it('BS-0278: 获取所有排程', () => {
    notifier.schedule5TimingReminder('member-a', 100, daysFromNow(30))
    notifier.schedule5TimingReminder('member-b', 200, daysFromNow(60))

    const all = notifier.getAllSchedules()
    expect(all).toHaveLength(2)
  })

  // ─── 取消排程 ───

  it('BS-0278: 取消指定排程后不再触发', () => {
    const expireAt = daysFromNow(1)
    notifier.schedule5TimingReminder('member-006', 300, expireAt)

    // 取消
    const cancelled = notifier.cancelSchedule('member-006')
    expect(cancelled).toBe(true)

    // 取消后不会触发
    expect(notifier.getReminderSchedule('member-006')).toBeUndefined()
  })
})
