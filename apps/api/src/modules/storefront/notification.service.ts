// notification.service.ts · 到店提醒 + 交易推送服务
// Phase 2A 交易闭环硬化 · 2026-07-26
//
// 宪法§16.1: P0交易类 — 邮件(必发) + App推送/微信服务通知 + 短信(备选)
// 宪法§15.3: 推送每日≤1条营销, 23:00-08:00 P2/P3免打扰
// 宪法§16.2: P0/P1邮件不可关闭
//
// 职责:
// - 预约确认通知（即时, P0 交易类）
// - 到店提醒（预约前2h/30min, P1 服务类）
// - 改期/退订通知（P0 交易类）
// - 核销确认（P0 交易类）

import { Injectable, Logger } from '@nestjs/common'

export type PushLevel = 'P0' | 'P1' | 'P2' | 'P3'
export type Channel = 'app_push' | 'sms' | 'email' | 'wechat_service' | 'wechat_mini'

interface NotificationPayload {
  customerName: string
  customerPhone: string
  storeName: string
  serviceName: string
  bookingId: string
  date: string
  timeSlot: string
  amount: number // 分
  qrCode: string
}

interface PushLog {
  id: string
  bookingId: string
  level: PushLevel
  channel: Channel
  sentAt: string
  success: boolean
  message: string
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name)
  private readonly pushLogs: PushLog[] = []

  private readonly PUSH_CONFIG = {
    P0: { channels: ['app_push', 'wechat_service', 'email'] as Channel[], smsFallback: true },
    P1: { channels: ['app_push', 'wechat_service'] as Channel[], smsFallback: true },
    P2: { channels: ['app_push', 'wechat_service', 'email'] as Channel[], smsFallback: false },
    P3: { channels: ['app_push', 'wechat_service'] as Channel[], smsFallback: false },
  }

  // ═══════════════════════════════════════════════════════
  // P0: 预约确认 — 交易类必发
  // ═══════════════════════════════════════════════════════

  async sendBookingConfirmed(payload: NotificationPayload): Promise<PushLog[]> {
    const results: PushLog[] = []

    // 1. App推送
    results.push(await this.pushApp(payload, {
      title: '✅ 预约成功',
      body: `${payload.storeName} 已确认您的预约\n${payload.date} ${payload.timeSlot}\n${payload.serviceName}\n预约编号: ${payload.bookingId}`,
      level: 'P0',
    }))

    // 2. 微信服务通知
    results.push(await this.pushWechat(payload, {
      templateId: 'BOOKING_CONFIRMED',
      data: {
        first: { value: '预约已确认' },
        keyword1: { value: payload.storeName },
        keyword2: { value: `${payload.date} ${payload.timeSlot}` },
        keyword3: { value: payload.serviceName },
        keyword4: { value: `¥${(payload.amount / 100).toFixed(2)}` },
        remark: { value: `预约编号: ${payload.bookingId}\n到店出示核销码入场` },
      },
      level: 'P0',
    }))

    // 3. 邮件（P0必发, 不可关闭）
    results.push(await this.pushEmail(payload, {
      subject: `预约确认 - ${payload.storeName} - ${payload.serviceName}`,
      body: `
        <h2>预约已确认 ✅</h2>
        <p><strong>门店:</strong> ${payload.storeName}</p>
        <p><strong>项目:</strong> ${payload.serviceName}</p>
        <p><strong>时间:</strong> ${payload.date} ${payload.timeSlot}</p>
        <p><strong>金额:</strong> ¥${(payload.amount / 100).toFixed(2)}</p>
        <p><strong>预约编号:</strong> ${payload.bookingId}</p>
        <hr/>
        <p style="color:#666;">到店时出示核销码扫码入场。如需改期或取消，请提前1小时操作。</p>
      `,
      level: 'P0',
    }))

    this.logger.log(`[P0 Booking] ${payload.bookingId} → ${results.length} channels`)
    return results
  }

  // ═══════════════════════════════════════════════════════
  // P1: 到店提醒（2h前 + 30min前）
  // ═══════════════════════════════════════════════════════

  async sendArrivalReminder(payload: NotificationPayload, minutesBefore: number): Promise<PushLog | null> {
    // 23:00-08:00 P2/P3免打扰 — P1服务类不受限但降音量
    const now = new Date()
    const hour = now.getHours()
    const isSilentHour = hour >= 23 || hour < 8

    const results = await this.pushApp(payload, {
      title: `⏰ ${minutesBefore}分钟后到店`,
      body: `您预约的 ${payload.serviceName} 即将开始\n${payload.storeName}\n${payload.date} ${payload.timeSlot}`,
      level: 'P1',
    })

    // 如果App推送未读，降级到短信
    if (results.success) {
      this.logger.log(`[P1 Reminder] ${payload.bookingId} ${minutesBefore}min → App push OK`)
    } else {
      const sms = await this.pushSms(payload, {
        body: `【神机营】${payload.customerName}，您预约的${payload.serviceName}于${payload.date} ${payload.timeSlot}在${payload.storeName}开始，请提前到店。退订回T`,
        level: 'P1',
      })
      this.logger.warn(`[P1 Reminder] ${payload.bookingId} App push 失败 → SMS降级`)
      return sms
    }

    return results
  }

  // ═══════════════════════════════════════════════════════
  // P0: 改期/取消确认
  // ═══════════════════════════════════════════════════════

  async sendRescheduled(payload: NotificationPayload, newDate: string, newTimeSlot: string): Promise<PushLog[]> {
    return await this.sendBookingConfirmed({
      ...payload,
      date: newDate,
      timeSlot: newTimeSlot,
    })
  }

  async sendCancelled(payload: NotificationPayload): Promise<void> {
    await this.pushApp(payload, {
      title: '预约已取消',
      body: `${payload.serviceName} 预约已取消\n${payload.date} ${payload.timeSlot}\n期待您再次光临 ${payload.storeName}`,
      level: 'P0',
    })

    await this.pushEmail(payload, {
      subject: `预约已取消 - ${payload.storeName}`,
      body: `<p>您在 ${payload.storeName} 的 ${payload.serviceName} 预约已取消。</p><p>预约时间: ${payload.date} ${payload.timeSlot}</p>`,
      level: 'P0',
    })

    this.logger.log(`[P0 Cancelled] ${payload.bookingId}`)
  }

  // ═══════════════════════════════════════════════════════
  // P0: 核销确认
  // ═══════════════════════════════════════════════════════

  async sendCheckInConfirmed(payload: NotificationPayload): Promise<void> {
    await this.pushApp(payload, {
      title: '🎉 已核销入场',
      body: `欢迎光临 ${payload.storeName}！${payload.serviceName} 体验即将开始。`,
      level: 'P0',
    })
    this.logger.log(`[P0 CheckIn] ${payload.bookingId} 核销确认`)
  }

  // ═══════════════════════════════════════════════════════
  // Private: channel senders (真实实现用第三方SDK)
  // ═══════════════════════════════════════════════════════

  private async pushApp(payload: NotificationPayload, opts: { title: string; body: string; level: PushLevel }): Promise<PushLog> {
    // TODO: 接真实推送服务 (极光/Firebase)
    const log: PushLog = {
      id: `push-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      bookingId: payload.bookingId,
      level: opts.level,
      channel: 'app_push',
      sentAt: new Date().toISOString(),
      success: true,
      message: `App push → ${payload.customerPhone}: ${opts.title}`,
    }
    this.pushLogs.push(log)
    return log
  }

  private async pushSms(payload: NotificationPayload, opts: { body: string; level: PushLevel }): Promise<PushLog> {
    // TODO: 接阿里云短信 / 腾讯云短信双通道（宪法§16.1 降级策略）
    const log: PushLog = {
      id: `sms-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      bookingId: payload.bookingId,
      level: opts.level,
      channel: 'sms',
      sentAt: new Date().toISOString(),
      success: true,
      message: `SMS → ${payload.customerPhone}: ${opts.body.slice(0, 50)}...`,
    }
    this.pushLogs.push(log)
    return log
  }

  private async pushEmail(payload: NotificationPayload, opts: { subject: string; body: string; level: PushLevel }): Promise<PushLog> {
    // TODO: 接真实邮件服务 (SendGrid/AWS SES/阿里云邮件)
    const log: PushLog = {
      id: `email-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      bookingId: payload.bookingId,
      level: opts.level,
      channel: 'email',
      sentAt: new Date().toISOString(),
      success: true,
      message: `Email → ${payload.customerPhone}@shenjiying.com: ${opts.subject}`,
    }
    this.pushLogs.push(log)
    return log
  }

  private async pushWechat(payload: NotificationPayload, opts: { templateId: string; data: Record<string, { value: string }>; level: PushLevel }): Promise<PushLog> {
    // TODO: 接微信服务号模板消息
    const log: PushLog = {
      id: `wechat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      bookingId: payload.bookingId,
      level: opts.level,
      channel: 'wechat_service',
      sentAt: new Date().toISOString(),
      success: true,
      message: `Wechat service → ${opts.templateId}`,
    }
    this.pushLogs.push(log)
    return log
  }
}
