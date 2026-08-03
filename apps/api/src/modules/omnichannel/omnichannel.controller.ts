/**
 * omnichannel.controller.ts - 全渠道触达 Controller
 *
 * API 端点:
 *   POST /omnichannel/reach              - 单条触达
 *   POST /omnichannel/reach-all           - 批量触达
 *   GET  /omnichannel/history/:memberId   - 触达历史
 *   GET  /omnichannel/channel/:channel    - 渠道状态
 *   PATCH /omnichannel/channel/:channel   - 设置渠道状态
 *   POST /omnichannel/sms/send            - 短信发送（主通道）
 *   POST /omnichannel/sms/send-backup     - 短信发送（备用通道）
 *   POST /omnichannel/sms/send-fallback   - 短信发送（自动切换）
 *   GET  /omnichannel/sms/status/:id      - 短信投递状态
 *   POST /omnichannel/email/send          - 邮件发送
 *   POST /omnichannel/email/bulk          - 批量邮件
 *   POST /omnichannel/email/render        - 渲染模板
 *   GET  /omnichannel/email/status/:id    - 邮件投递状态
 *   GET  /omnichannel/channels            - 所有渠道配置
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common'

import { TenantGuard } from '../agent/tenant.guard'
import { OmnichannelReachService, SMSDualChannelService, InternationalEmailService } from './omnichannel.service'
import type {
  ReachRequest,
  ReachAllRequest,
  SendSmsRequest,
  SendEmailRequest,
  SendBulkEmailRequest,
  RenderTemplateRequest,
  SetChannelStatusRequest,
  DeliveryHistoryQuery,
} from './omnichannel.dto'
import type { ChannelType } from './omnichannel.entity'
import { DEFAULT_CHANNEL_CONFIGS } from './omnichannel.entity'

@UseGuards(TenantGuard)
@Controller('omnichannel')
export class OmnichannelController {
  constructor(
    private readonly reachService: OmnichannelReachService,
    private readonly smsService: SMSDualChannelService,
    private readonly emailService: InternationalEmailService,
  ) {}

  // ── Reach ──

  @Post('reach')
  @HttpCode(HttpStatus.OK)
  async reach(@Body() body: ReachRequest) {
    const result = await this.reachService.reach(body.memberId, body.channel, body.content)
    return result
  }

  @Post('reach-all')
  @HttpCode(HttpStatus.OK)
  async reachAll(@Body() body: ReachAllRequest) {
    const results = await this.reachService.reachAll(body.memberIds, body.channel, body.content)
    return { results, total: results.length }
  }

  @Get('history/:memberId')
  async getHistory(@Param('memberId') memberId: string, @Query() query: DeliveryHistoryQuery) {
    const history = this.reachService.getReachHistory(memberId)
    const filtered = query.channel ? history.filter(h => h.channel === query.channel) : history
    return { memberId, deliveries: filtered, total: filtered.length }
  }

  @Get('channel/:channel')
  async getChannelStatus(@Param('channel') channel: ChannelType) {
    const status = this.reachService.getChannelStatus(channel)
    return { channel, status, lastChecked: new Date().toISOString() }
  }

  @Patch('channel/:channel')
  @HttpCode(HttpStatus.OK)
  async setChannelStatus(@Param('channel') channel: ChannelType, @Body() body: SetChannelStatusRequest) {
    this.reachService.setChannelStatus(channel, body.status)
    return { channel, status: body.status, updated: true }
  }

  @Get('channels')
  async listChannels() {
    return DEFAULT_CHANNEL_CONFIGS.map(cfg => ({
      channel: cfg.channel,
      status: this.reachService.getChannelStatus(cfg.channel),
      priority: cfg.priority,
      fallbackChannels: cfg.fallbackChannels,
    }))
  }

  // ── SMS ──

  @Post('sms/send')
  @HttpCode(HttpStatus.OK)
  async sendSms(@Body() body: SendSmsRequest) {
    const result = await this.smsService.sendViaPrimary(body.phone, body.content)
    return result
  }

  @Post('sms/send-backup')
  @HttpCode(HttpStatus.OK)
  async sendSmsBackup(@Body() body: SendSmsRequest) {
    const result = await this.smsService.sendViaBackup(body.phone, body.content)
    return result
  }

  @Post('sms/send-fallback')
  @HttpCode(HttpStatus.OK)
  async sendSmsFallback(@Body() body: SendSmsRequest) {
    const result = await this.smsService.sendWithFallback(body.phone, body.content)
    return result
  }

  @Get('sms/status/:messageId')
  async getSmsStatus(@Param('messageId') messageId: string) {
    const status = this.smsService.getDeliveryStatus(messageId)
    if (!status) {
      return { messageId, status: 'not_found' as const }
    }
    return status
  }

  // ── Email ──

  @Post('email/send')
  @HttpCode(HttpStatus.OK)
  async sendEmail(@Body() body: SendEmailRequest) {
    const result = await this.emailService.sendEmail(body.to, body.subject, body.body, body.locale)
    return result
  }

  @Post('email/bulk')
  @HttpCode(HttpStatus.OK)
  async sendBulkEmail(@Body() body: SendBulkEmailRequest) {
    const recipients = body.recipients.map(to => ({ to }))
    const results = await this.emailService.sendBulkEmail(recipients, body.subject, body.body, body.locale)
    return { results, total: results.length }
  }

  @Post('email/render')
  @HttpCode(HttpStatus.OK)
  async renderTemplate(@Body() body: RenderTemplateRequest) {
    const rendered = this.emailService.renderTemplate(body.templateId, body.locale, body.data)
    return { templateId: body.templateId, locale: body.locale, rendered }
  }

  @Get('email/status/:messageId')
  async getEmailStatus(@Param('messageId') messageId: string) {
    const status = this.emailService.getEmailStatus(messageId)
    if (!status) {
      return { messageId, status: 'not_found' as const }
    }
    return status
  }
}
