/**
 * email-channel.ts — 邮件推送通道
 *
 * WP-13A: 邮件通道骨架
 * BS-0168 ~ BS-0184
 *
 * 当前实现为模拟发送骨架。
 * 生产部署需要:
 * 1. 配置 SMTP 服务器信息（环境变量或配置中心）
 * 2. 接入实际邮件提供方 SDK (nodemailer / SendGrid / AWS SES)
 *
 * 配置方式 (环境变量):
 *   MAIL_HOST=smtp.example.com
 *   MAIL_PORT=587
 *   MAIL_USER=your@email.com
 *   MAIL_PASS=your-password
 *   MAIL_FROM=noreply@shenjiying.com
 *
 * 或通过配置中心推送:
 *   email.smtp.host / email.smtp.port / email.smtp.user / email.smtp.pass
 */

import { Injectable, Logger } from '@nestjs/common'
import { PushBusinessPriority } from '../push-priority.enum'
import type { PushChannel, PushChannelRequest, PushChannelResponse } from './push-channel.interface'

@Injectable()
export class EmailPushChannel implements PushChannel {
  readonly name = 'email'
  readonly available = true
  private readonly logger = new Logger(EmailPushChannel.name)

  /**
   * 发送邮件推送
   *
   * 当前实现：
   *   - 模拟发送，仅日志记录
   *   - 返回模拟成功
   *
   * 生产实现：
   *   - 使用 nodemailer 创建 transporter
   *   - const transporter = nodemailer.createTransport({...})
   *   - await transporter.sendMail({ from, to, subject, html })
   */
  async send(request: PushChannelRequest): Promise<PushChannelResponse> {
    const startedAt = Date.now()

    // ✋ 这里接入真实邮件提供方
    // 示例: 使用 nodemailer (需安装 @nestjs-modules/mailer 或 nodemailer)
    // import { createTransport } from 'nodemailer'
    // const transporter = createTransport({
    //   host: process.env.MAIL_HOST ?? 'smtp.example.com',
    //   port: Number(process.env.MAIL_PORT ?? 587),
    //   secure: false,
    //   auth: {
    //     user: process.env.MAIL_USER,
    //     pass: process.env.MAIL_PASS,
    //   },
    // })
    // await transporter.sendMail({
    //   from: process.env.MAIL_FROM ?? 'noreply@shenjiying.com',
    //   to: request.recipient,
    //   subject: request.subject ?? '',
    //   html: request.body,
    // })

    const elapsedMs = Date.now() - startedAt

    this.logger.log(
      `[EmailChannel] SEND to=${request.recipient} subject=${request.subject} priority=${request.priority} elapsed=${elapsedMs}ms`
    )

    return {
      success: true,
      providerId: `email-mock-${Date.now()}`,
      elapsedMs,
    }
  }

  async healthCheck(): Promise<boolean> {
    // ✋ 生产实现：配置验证
    // return !!(process.env.MAIL_HOST && process.env.MAIL_USER && process.env.MAIL_PASS)
    return true
  }
}
