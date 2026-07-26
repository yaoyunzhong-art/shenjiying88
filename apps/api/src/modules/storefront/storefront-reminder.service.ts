// storefront-reminder.service.ts · TOC 到店提醒服务
// Phase 2B 社媒增长引擎 · 2026-07-26
//
// 宪法§16.1 全渠道触达:
//   - P0 交易类推送: App + 微信服务通知 + 邮件 (不可关闭)
//   - P1 服务类推送: 到店提醒 (2h前 + 30min前), App→短信降级
//
// 到店提醒触发规则:
//   1. 预约创建时: schedule 两个提醒
//      - T-2h: "您的预约还有2小时开始"
//      - T-30min: "您的预约即将开始"
//   2. 改期时: cancel 旧提醒, schedule 新提醒
//   3. 取消时: cancel 所有提醒
//
// 实现:
//   - 使用 setInterval 心跳 (每分钟检查一次) 替代 NestJS @Cron
//   - 内存 Map 存储待发提醒

import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'

interface Reminder {
  id: string
  bookingId: string
  storeName: string
  serviceName: string
  customerPhone: string
  customerName: string
  date: string
  timeSlot: string
  sendAt: Date
  type: 't_minus_2h' | 't_minus_30min'
  fired: boolean
}

@Injectable()
export class StorefrontReminderService implements OnModuleDestroy {
  private readonly logger = new Logger(StorefrontReminderService.name)
  private reminders = new Map<string, Reminder>()
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null

  constructor() {
    // 心跳检查：每分钟扫描待发提醒
    this.heartbeatInterval = setInterval(() => this.heartbeat(), 60_000)
    this.logger.log('[Reminder] 到店提醒心跳已启动 (60s间隔)')
  }

  onModuleDestroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  /**
   * 为预约创建到店提醒
   * @returns 创建的提醒 ID 列表
   */
  scheduleReminders(booking: {
    bookingId: string
    storeName: string
    serviceName: string
    customerPhone: string
    customerName: string
    date: string
    timeSlot: string
  }): string[] {
    const slotDateTime = new Date(`${booking.date}T${booking.timeSlot}:00+08:00`)
    const ids: string[] = []

    // T-2h 提醒
    const twoHoursBefore = new Date(slotDateTime.getTime() - 2 * 60 * 60 * 1000)
    if (twoHoursBefore > new Date()) {
      const id = this.addReminder(booking, twoHoursBefore, 't_minus_2h')
      ids.push(id)
    }

    // T-30min 提醒
    const thirtyMinBefore = new Date(slotDateTime.getTime() - 30 * 60 * 1000)
    if (thirtyMinBefore > new Date()) {
      const id = this.addReminder(booking, thirtyMinBefore, 't_minus_30min')
      ids.push(id)
    }

    this.logger.log(
      `[Reminder] ${booking.bookingId}: ${ids.length}个提醒已排队 ` +
      `(${booking.date} ${booking.timeSlot})`,
    )

    return ids
  }

  /**
   * 取消预约的所有未发提醒
   */
  cancelReminders(bookingId: string): number {
    let count = 0
    for (const [id, r] of this.reminders) {
      if (r.bookingId === bookingId && !r.fired) {
        this.reminders.delete(id)
        count++
      }
    }
    if (count > 0) {
      this.logger.log(`[Reminder] ${bookingId}: 已取消 ${count} 个提醒`)
    }
    return count
  }

  /**
   * 改期：取消旧提醒 + 创建新提醒
   */
  rescheduleReminders(
    bookingId: string,
    newBooking: {
      bookingId: string
      storeName: string
      serviceName: string
      customerPhone: string
      customerName: string
      date: string
      timeSlot: string
    },
  ): { cancelled: number; created: string[] } {
    const cancelled = this.cancelReminders(bookingId)
    const created = this.scheduleReminders(newBooking)
    return { cancelled, created }
  }

  /**
   * 查询预约的提醒状态
   */
  getRemindersForBooking(bookingId: string): Reminder[] {
    return Array.from(this.reminders.values()).filter(r => r.bookingId === bookingId)
  }

  // ═══════════════════════════════════════════════════
  // 私有
  // ═══════════════════════════════════════════════════

  private addReminder(
    booking: {
      bookingId: string; storeName: string; serviceName: string
      customerPhone: string; customerName: string
      date: string; timeSlot: string
    },
    sendAt: Date,
    type: 't_minus_2h' | 't_minus_30min',
  ): string {
    const id = `rem-${booking.bookingId}-${type}-${Date.now()}`
    this.reminders.set(id, {
      id,
      bookingId: booking.bookingId,
      storeName: booking.storeName,
      serviceName: booking.serviceName,
      customerPhone: booking.customerPhone,
      customerName: booking.customerName,
      date: booking.date,
      timeSlot: booking.timeSlot,
      sendAt,
      type,
      fired: false,
    })
    return id
  }

  /**
   * 心跳：每分钟检查一次待发提醒
   * 到达发送时间时执行推送（现阶段 log 模拟，上线接 PushNotificationScheduler）
   */
  private heartbeat(): void {
    const now = Date.now()
    const fired: string[] = []

    for (const [id, reminder] of this.reminders) {
      if (reminder.fired) continue
      if (now >= reminder.sendAt.getTime()) {
        this.fireReminder(reminder)
        reminder.fired = true
        fired.push(id)
      }
    }

    // 清理已发送的提醒 (保留1分钟后清除)
    for (const id of fired) {
      setTimeout(() => this.reminders.delete(id), 60_000)
    }
  }

  private fireReminder(reminder: Reminder): void {
    const timeLabel = reminder.type === 't_minus_2h' ? '2小时后' : '30分钟后'
    const message = `[到店提醒] ${reminder.customerName}，您的${reminder.storeName}·${reminder.serviceName}预约将于${timeLabel}开始 (${reminder.date} ${reminder.timeSlot})`

    // TODO: 接入 PushNotificationScheduler.sendPush() 实现真实推送
    // 现阶段: 日志记录 + WebSocket 广播
    this.logger.log(`🔔 ${message} → ${reminder.customerPhone}`)
  }
}
