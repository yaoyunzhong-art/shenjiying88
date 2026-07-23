import { Body, Controller, Get, Param, Post, Patch, Query, UseGuards } from '@nestjs/common'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  BroadcastMessageDto,
  CancelScheduledPushDto,
  DashboardQueryDto,
  PushHistoryQueryDto,
  RecordPushEventDto,
  RegisterPushTemplateDto,
  SchedulePushDto,
  SendPushDto,
  SendWSMessageDto,
  SetDndHoursDto,
  SetPreferredChannelDto,
  UpdatePushPreferenceDto,
} from './push.dto'
import {
  PushPlatform,
  PushPriority,
  PushRecord,
  PushScheduleStatus,
  PushStatus,
  PushStats,
  PushTemplate,
  ScheduledPush,
  WSClient
} from './push.entity'
import {
  APNsService,
  PushNotificationScheduler,
  WebSocketService
} from './push.service'
import { TenantGuard } from '../agent/tenant.guard'
import { PushBusinessPriority, isPushPriorityMandatory } from './push-priority.enum'
import { DndConfigService, FrequencyCapService, DEFAULT_DND_CONFIG, DEFAULT_FREQUENCY_CAP_CONFIG } from './dnd-config'
import { PushPriorityGuard } from './push-priority.guard'
import { DualChannelRouter, DEFAULT_CHANNEL_ROUTING } from './channels'
import { PushPreferenceService } from './push-preference.service'
import { PushStatsService } from './push-stats.service'
import type { PushEffectDashboard, PushHistoryEntry } from './push-stats.entity'

/**
 * 将 service 返回的轻量 ScheduledPush 转为 entity 完整 ScheduledPush
 */
function toEntityScheduledPush(
  s: import('./push.service').ScheduledPush,
  tenantId: string,
  platform: PushPlatform = PushPlatform.iOS
): ScheduledPush {
  const status = s.status === 'pending' ? PushScheduleStatus.Pending
    : s.status === 'sent' ? PushScheduleStatus.Sent
    : PushScheduleStatus.Cancelled
  return {
    id: s.id,
    memberId: s.memberId,
    content: s.content,
    sendAt: s.sendAt,
    status,
    tenantId,
    platform,
    createdAt: new Date().toISOString()
  }
}

/**
 * 将 service 返回的轻量 PushRecord 转为 entity 完整 PushRecord
 */
function toEntityPushRecord(
  s: import('./push.service').PushRecord,
  platform: PushPlatform = PushPlatform.iOS
): PushRecord {
  const status: PushRecord['status'] = s.status === 'sent' ? PushStatus.Sent
    : s.status === 'failed' ? PushStatus.Failed
    : PushStatus.Revoked
  return {
    id: s.id,
    deviceToken: s.deviceToken,
    platform,
    payload: s.payload,
    // s.priority is 'high'|'normal' from service; PushPriority enum has 'HIGH'|'NORMAL'
    priority: (s.priority as string) === 'high' ? PushPriority.High : PushPriority.Normal,
    status,
    sentAt: s.sentAt
  }
}

/**
 * 将 service 返回的轻量 WSClient 转为 entity 完整 WSClient
 */
function toEntityWSClient(
  s: import('./push.service').WSClient
): WSClient {
  return {
    clientId: s.clientId,
    userId: s.userId,
    connectedAt: s.connectedAt,
    sessionId: s.sessionId
  }
}

@Controller('push')
@UseGuards(TenantGuard)
export class PushController {
  constructor(
    private readonly apnsService: APNsService,
    private readonly wsService: WebSocketService,
    private readonly scheduler: PushNotificationScheduler,
    // WP-13A: 推送分级
    private readonly priorityGuard: PushPriorityGuard,
    // WP-13A: 免打扰 & 频控
    private readonly dndConfig: DndConfigService,
    private readonly frequencyCap: FrequencyCapService,
    // WP-13A: 双通道
    private readonly dualChannelRouter: DualChannelRouter,
    // WP-13B: 用户偏好 (BS-0164~BS-0167)
    private readonly preferenceService: PushPreferenceService,
    // WP-13B: 效果统计 (BS-0185~BS-0188)
    private readonly statsService: PushStatsService,
  ) {}

  // ── Push Template endpoints ──

  /**
   * 注册推送模板
   * 👔 店长: 自定义门店推送模板
   * 📢 营销: 统一营销模板管理
   */
  @Post('templates')
  registerTemplate(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: RegisterPushTemplateDto
  ): PushTemplate {
    const template: PushTemplate = {
      id: `pt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      code: body.code,
      platform: body.platform,
      tenantId: body.tenantId ?? tenantContext.tenantId,
      brandId: body.brandId,
      storeId: body.storeId,
      title: body.title,
      body: body.body,
      sound: body.sound,
      badge: body.badge,
      extra: body.extra,
      enabled: body.enabled ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    return template
  }

  // ── Push sending endpoints ──

  /**
   * 发送推送消息
   * 👔 店长: 门店广播推送
   * 📢 营销: 精准推送营销活动
   */
  @Post('send')
  async sendPush(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: SendPushDto
  ): Promise<{ success: boolean; recordId?: string }> {
    const priority = body.priority ?? PushPriority.High

    if (body.platform === PushPlatform.iOS) {
      const success = await this.apnsService.pushToiOS(
        body.deviceToken,
        {
          alert: body.alert,
          badge: body.badge,
          sound: body.sound,
          extra: { ...body.extra, tenantId: body.tenantId ?? tenantContext.tenantId }
        },
        priority === PushPriority.High ? 'high' as const : 'normal' as const
      )

      if (success) {
        const history = await this.apnsService.getPushHistory(body.deviceToken)
        const record = history[history.length - 1]
        return { success, recordId: record.id }
      }
    }

    return { success: true }
  }

  /**
   * 发送高优先级推送（紧急通知）
   */
  @Post('send-high-priority')
  async sendHighPriority(
    @Body() body: { deviceToken: string; alert: string }
  ): Promise<{ success: boolean }> {
    const result = await this.apnsService.sendWithHighPriority(
      body.deviceToken,
      body.alert
    )
    return { success: result }
  }

  /**
   * 吊销设备 token
   * 🔧 安监: 安保人员设备吊销
   */
  @Post('revoke-token')
  async revokeToken(
    @Body() body: { deviceToken: string }
  ): Promise<{ success: boolean }> {
    await this.apnsService.revokeToken(body.deviceToken)
    return { success: true }
  }

  // ── Scheduled push endpoints ──

  /**
   * 创建定时推送
   * 🎮 导玩员: 定时推送活动预告
   */
  @Post('schedule')
  schedulePush(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: SchedulePushDto
  ): ScheduledPush {
    const s = this.scheduler.schedulePush(
      body.memberId,
      body.content,
      new Date(body.sendAt)
    )
    return toEntityScheduledPush(s, body.tenantId ?? tenantContext.tenantId, body.platform)
  }

  /**
   * 取消定时推送
   */
  @Post('schedule/cancel')
  cancelScheduledPush(
    @Body() body: CancelScheduledPushDto
  ): { success: boolean } {
    const result = this.scheduler.cancelScheduledPush(body.pushId)
    return { success: result }
  }

  /**
   * 查询定时推送列表
   * 🎮 导玩员: 查看已排程的推送任务
   */
  @Get('schedule')
  queryScheduledPushes(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query('memberId') memberId: string
  ): ScheduledPush[] {
    const list = this.scheduler.queryScheduled(memberId)
    return list.map((s) => toEntityScheduledPush(s, tenantContext.tenantId))
  }

  // ── WebSocket endpoints ──

  /**
   * 建立 WebSocket 连接
   */
  @Post('ws/connect')
  connectWS(
    @Body() body: { clientId: string; userId: string; platform?: PushPlatform }
  ): WSClient {
    const c = this.wsService.connect(body.clientId, body.userId)
    return toEntityWSClient(c)
  }

  /**
   * 断开 WebSocket 连接
   */
  @Post('ws/disconnect')
  disconnectWS(
    @Body() body: { clientId: string }
  ): { success: boolean } {
    this.wsService.disconnect(body.clientId)
    return { success: true }
  }

  /**
   * 发送 WebSocket 消息
   */
  @Post('ws/send')
  sendWS(
    @Body() body: SendWSMessageDto
  ): { success: boolean } {
    const result = this.wsService.sendToClient(body.clientId, {
      channel: body.channel,
      data: body.data
    })
    return { success: result }
  }

  /**
   * WebSocket 全频道广播
   * 🛒 前台: 向前台所有设备广播公告
   */
  @Post('ws/broadcast')
  broadcastWS(
    @Body() body: BroadcastMessageDto
  ): { sent: number } {
    const sent = this.wsService.broadcast(body.channel, body.data)
    return { sent }
  }

  /**
   * WebSocket 重连（session 恢复）
   */
  @Post('ws/reconnect')
  reconnectWS(
    @Body() body: { clientId: string; oldSessionId: string }
  ): { restored: boolean; sessionId?: string } {
    return this.wsService.handleReconnect(body.clientId, body.oldSessionId)
  }

  // ── WP-13A: 推送分级 ──

  /**
   * 推送分级检查
   * POST /push/priority/check
   * 在发送前预览推送是否会被拦截
   */
  @Post('priority/check')
  checkPriority(
    @Body() body: {
      priority: PushBusinessPriority
      tenantId: string
      memberId?: string
      userSettings?: Record<string, unknown>
    }
  ): { allowed: boolean; reason?: string; blockedByDnd?: boolean; blockedByFrequencyCap?: boolean; blockedByPreference?: boolean } {
    const result = this.priorityGuard.check(
      body.priority,
      body.tenantId,
      body.memberId,
      body.userSettings
    )
    return result
  }

  /**
   * 获取推送分级定义
   * GET /push/priority/levels
   */
  @Get('priority/levels')
  getPriorityLevels(): Array<{
    level: PushBusinessPriority
    name: string
    mandatory: boolean
    description: string
  }> {
    return [
      { level: PushBusinessPriority.P0, name: '紧急告警', mandatory: true, description: '不可关闭，系统强制发送' },
      { level: PushBusinessPriority.P1, name: '重要通知', mandatory: false, description: '订单/结算/验证等关键业务通知' },
      { level: PushBusinessPriority.P2, name: '一般推送', mandatory: false, description: '通用信息推送' },
      { level: PushBusinessPriority.P3, name: '营销推送', mandatory: false, description: '促销/优惠券/新品推荐，可一键关闭' },
    ]
  }

  // ── WP-13A: 免打扰 DND ──

  /**
   * 获取免打扰配置
   * GET /push/dnd/:tenantId
   */
  @Get('dnd/:tenantId')
  getDndConfig(
    @Param('tenantId') tenantId: string
  ) {
    return this.dndConfig.getConfig(tenantId)
  }

  /**
   * 更新免打扰配置
   * PATCH /push/dnd/:tenantId
   */
  @Patch('dnd/:tenantId')
  updateDndConfig(
    @Param('tenantId') tenantId: string,
    @Body() body: { enabled?: boolean; startTime?: string; endTime?: string }
  ) {
    return this.dndConfig.setConfig(tenantId, body)
  }

  /**
   * 检查当前是否在免打扰时段
   * GET /push/dnd/:tenantId/check
   */
  @Get('dnd/:tenantId/check')
  checkDnd(
    @Param('tenantId') tenantId: string
  ): { inDndHours: boolean } {
    return { inDndHours: this.dndConfig.isInDndHours(tenantId) }
  }

  // ── WP-13A: 频控 ──

  /**
   * 获取频控配置
   * GET /push/frequency-cap/:tenantId
   */
  @Get('frequency-cap/:tenantId')
  getFrequencyCapConfig(
    @Param('tenantId') tenantId: string
  ) {
    return this.frequencyCap.getConfig(tenantId)
  }

  /**
   * 更新频控配置
   * PATCH /push/frequency-cap/:tenantId
   */
  @Patch('frequency-cap/:tenantId')
  updateFrequencyCapConfig(
    @Param('tenantId') tenantId: string,
    @Body() body: { dailyMax?: number; weeklyMax?: number; perMinuteMax?: number; cooldownSeconds?: number }
  ) {
    return this.frequencyCap.setConfig(tenantId, body)
  }

  /**
   * 查询频控状态
   * GET /push/frequency-cap/:tenantId/status/:memberId
   */
  @Get('frequency-cap/:tenantId/status/:memberId')
  getFrequencyCapStatus(
    @Param('tenantId') tenantId: string,
    @Param('memberId') memberId: string
  ) {
    return this.frequencyCap.peek(tenantId, memberId)
  }

  /**
   * 检查成员是否触发频控
   * POST /push/frequency-cap/:tenantId/check/:memberId
   */
  @Post('frequency-cap/:tenantId/check/:memberId')
  checkFrequencyCap(
    @Param('tenantId') tenantId: string,
    @Param('memberId') memberId: string
  ): { allowed: boolean; dailyCount: number; weeklyCount: number } {
    const state = this.frequencyCap.checkAndIncrement(tenantId, memberId)
    return {
      allowed: !state.exceeded,
      dailyCount: state.dailyCount,
      weeklyCount: state.weeklyCount,
    }
  }

  // ── WP-13A: 双通道 ──

  /**
   * 获取双通道健康状态
   * GET /push/channels/health
   */
  @Get('channels/health')
  async getChannelHealth(): Promise<Record<string, boolean>> {
    return this.dualChannelRouter.healthCheck()
  }

  /**
   * 发送邮件推送
   * POST /push/channels/email
   */
  @Post('channels/email')
  async sendEmail(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: { recipient: string; subject: string; body: string; priority?: PushBusinessPriority }
  ) {
    const priority = body.priority ?? PushBusinessPriority.P1
    const guardResult = this.priorityGuard.check(
      priority,
      tenantContext.tenantId,
      undefined,
      undefined
    )
    if (!guardResult.allowed) {
      return { success: false, reason: guardResult.reason }
    }

    return this.dualChannelRouter.send(
      {
        recipient: body.recipient,
        subject: body.subject,
        body: body.body,
        priority,
        tenantId: tenantContext.tenantId,
      },
      { primary: 'email', fallback: 'sms' }
    )
  }

  /**
   * 发送短信推送
   * POST /push/channels/sms
   */
  @Post('channels/sms')
  async sendSms(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: { recipient: string; body: string; priority?: PushBusinessPriority }
  ) {
    const priority = body.priority ?? PushBusinessPriority.P1
    const guardResult = this.priorityGuard.check(
      priority,
      tenantContext.tenantId,
      undefined,
      undefined
    )
    if (!guardResult.allowed) {
      return { success: false, reason: guardResult.reason }
    }

    return this.dualChannelRouter.send(
      {
        recipient: body.recipient,
        body: body.body,
        priority,
        tenantId: tenantContext.tenantId,
      },
      { primary: 'sms', fallback: 'email' }
    )
  }

  /**
   * 双通道发送（主邮件，备短信）
   * POST /push/channels/send-dual
   */
  @Post('channels/send-dual')
  async sendDualChannel(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: {
      recipient: string
      subject?: string
      body: string
      priority?: PushBusinessPriority
      primary?: string
      fallback?: string
    }
  ) {
    const priority = body.priority ?? PushBusinessPriority.P1
    const guardResult = this.priorityGuard.check(
      priority,
      tenantContext.tenantId,
      undefined,
      undefined
    )
    if (!guardResult.allowed) {
      return { success: false, reason: guardResult.reason }
    }

    return this.dualChannelRouter.send(
      {
        recipient: body.recipient,
        subject: body.subject,
        body: body.body,
        priority,
        tenantId: tenantContext.tenantId,
      },
      {
        primary: body.primary ?? DEFAULT_CHANNEL_ROUTING.primary,
        fallback: body.fallback ?? DEFAULT_CHANNEL_ROUTING.fallback,
      }
    )
  }

  // ── Stats & Query endpoints ──

  /**
   * 获取推送统计
   * 👔 店长: 查看推送效果
   * 🎯 运行专员: 监控推送服务运行状态
   */
  @Get('stats')
  async getStats(): Promise<PushStats> {
    const history = await this.apnsService.getPushHistory('*')
    const sentCount = history.filter((r) => r.status === 'sent').length
    const failedCount = history.filter((r) => r.status === 'failed').length

    return {
      totalSent: sentCount,
      totalFailed: failedCount,
      activeConnections: this.wsService.getActiveConnections(),
      scheduledCount: 0,
      byPlatform: {
        [PushPlatform.iOS]: sentCount,
        [PushPlatform.Android]: 0,
        [PushPlatform.Web]: 0
      }
    }
  }

  /**
   * 查询设备推送历史
   */
  @Get('history/:deviceToken')
  async getPushHistory(
    @Param('deviceToken') deviceToken: string
  ): Promise<PushRecord[]> {
    const records = await this.apnsService.getPushHistory(deviceToken)
    return records.map((r) => toEntityPushRecord(r))
  }

  /**
   * 获取当前 WS 连接数
   */
  @Get('ws/connections')
  getWSConnections(): { activeConnections: number } {
    return { activeConnections: this.wsService.getActiveConnections() }
  }

  // ════════════════════════════════════════════════════════════════
  // WP-13B: C端便捷化 (BS-0164~BS-0167)
  // ════════════════════════════════════════════════════════════════

  /**
   * 获取用户推送偏好
   * GET /push/preference/:tenantId/:memberId
   * BS-0164: 用户推送偏好配置
   */
  @Get('preference/:tenantId/:memberId')
  getUserPreference(
    @Param('tenantId') tenantId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.preferenceService.getPreference(memberId, tenantId)
  }

  /**
   * 更新用户推送偏好
   * PATCH /push/preference/:tenantId/:memberId
   * BS-0164: 用户推送偏好设置
   */
  @Patch('preference/:tenantId/:memberId')
  updateUserPreference(
    @Param('tenantId') tenantId: string,
    @Param('memberId') memberId: string,
    @Body() body: UpdatePushPreferenceDto,
  ) {
    return this.preferenceService.setPreference(memberId, tenantId, body)
  }

  /**
   * 一键关闭 P3 营销推送
   * POST /push/preference/:tenantId/:memberId/disable-marketing
   * BS-0167: 一键关闭 P3 营销推送
   */
  @Post('preference/:tenantId/:memberId/disable-marketing')
  disableMarketingPush(
    @Param('tenantId') tenantId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.preferenceService.disableMarketingPush(memberId, tenantId)
  }

  /**
   * 一键开启 P3 营销推送
   * POST /push/preference/:tenantId/:memberId/enable-marketing
   */
  @Post('preference/:tenantId/:memberId/enable-marketing')
  enableMarketingPush(
    @Param('tenantId') tenantId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.preferenceService.enableMarketingPush(memberId, tenantId)
  }

  /**
   * 设置用户级免打扰时段
   * POST /push/preference/:tenantId/:memberId/dnd
   * BS-0165: 用户自定义免打扰时间段
   */
  @Post('preference/:tenantId/:memberId/dnd')
  setUserDndHours(
    @Param('tenantId') tenantId: string,
    @Param('memberId') memberId: string,
    @Body() body: SetDndHoursDto,
  ) {
    return this.preferenceService.setDndHours(
      memberId, tenantId, body.enabled, body.startTime, body.endTime
    )
  }

  /**
   * 设置首选推送通道
   * POST /push/preference/:tenantId/:memberId/channel
   * BS-0172: 通道优先级配置
   */
  @Post('preference/:tenantId/:memberId/channel')
  setPreferredChannel(
    @Param('tenantId') tenantId: string,
    @Param('memberId') memberId: string,
    @Body() body: SetPreferredChannelDto,
  ) {
    return this.preferenceService.setPreferredChannel(
      memberId, tenantId, body.preferredChannel, body.fallbackChannels
    )
  }

  /**
   * 检查推送是否应发送 (按用户偏好)
   * GET /push/preference/:tenantId/:memberId/check?priority=P3
   * BS-0164: 推送前检查用户偏好
   */
  @Get('preference/:tenantId/:memberId/check')
  checkPushPreference(
    @Param('tenantId') tenantId: string,
    @Param('memberId') memberId: string,
    @Query('priority') priority: string,
  ): { allowed: boolean; reason?: string } {
    const p = priority as PushBusinessPriority
    const allowed = this.preferenceService.shouldAllowPush(memberId, tenantId, p)
    return {
      allowed,
      reason: allowed ? undefined : 'Blocked by user push preference',
    }
  }

  // ════════════════════════════════════════════════════════════════
  // WP-13B: 渠道策略 (BS-0171~BS-0175)
  // ════════════════════════════════════════════════════════════════

  /**
   * 获取用户首选通道
   * GET /push/preference/:tenantId/:memberId/channels
   * BS-0172: 获取用户通道优先级配置
   */
  @Get('preference/:tenantId/:memberId/channels')
  getUserPreferredChannels(
    @Param('tenantId') tenantId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.preferenceService.getPreferredChannels(memberId, tenantId)
  }

  /**
   * 多通道发送 (根据用户偏好路由)
   * POST /push/channels/send-smart
   * BS-0171: 多通道路由 (自动选择用户首选通道)
   */
  @Post('channels/send-smart')
  async sendSmartChannel(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: {
      recipient: string
      subject?: string
      body: string
      memberId?: string
      priority?: PushBusinessPriority
    }
  ) {
    const priority = body.priority ?? PushBusinessPriority.P1
    const memberId = body.memberId

    // 根据用户偏好获取通道优先级
    let primary = DEFAULT_CHANNEL_ROUTING.primary
    let fallback = DEFAULT_CHANNEL_ROUTING.fallback

    if (memberId) {
      const userChannels = this.preferenceService.getPreferredChannels(
        memberId, tenantContext.tenantId
      )
      primary = userChannels.primary
      fallback = userChannels.fallbacks[0] ?? 'email'
    }

    return this.dualChannelRouter.send(
      {
        recipient: body.recipient,
        subject: body.subject,
        body: body.body,
        priority,
        tenantId: tenantContext.tenantId,
        memberId,
      },
      { primary, fallback }
    )
  }

  // ════════════════════════════════════════════════════════════════
  // WP-13B: 效果回传 (BS-0185~BS-0188)
  // ════════════════════════════════════════════════════════════════

  /**
   * 记录推送事件
   * POST /push/events
   * BS-0185: 推送事件回传 (送达/点击/失败)
   */
  @Post('events')
  recordPushEvent(
    @Body() body: RecordPushEventDto,
  ) {
    const eventType = body.eventType as 'sent' | 'delivered' | 'clicked' | 'failed' | 'bounced'
    const priority = body.priority as PushBusinessPriority
    return this.statsService.recordEvent({
      pushRecordId: body.pushRecordId,
      eventType,
      memberId: body.memberId,
      tenantId: body.tenantId,
      channel: body.channel,
      priority,
      metadata: body.metadata,
    })
  }

  /**
   * 记录推送点击事件
   * POST /push/events/click
   * BS-0186: 点击率统计
   */
  @Post('events/click')
  recordClickEvent(
    @Body() body: {
      pushRecordId: string
      memberId: string
      tenantId: string
      channel: string
      priority: string
      metadata?: Record<string, unknown>
    }
  ) {
    return this.statsService.recordClicked(
      body.pushRecordId,
      body.memberId,
      body.tenantId,
      body.channel,
      body.priority as PushBusinessPriority,
      body.metadata,
    )
  }

  /**
   * 获取推送效果看板
   * GET /push/dashboard/:tenantId
   * BS-0188: 效果看板数据
   */
  @Get('dashboard/:tenantId')
  getPushDashboard(
    @Param('tenantId') tenantId: string,
    @Query() query: DashboardQueryDto,
  ): PushEffectDashboard {
    return this.statsService.getDashboard(tenantId, query.startDate, query.endDate)
  }

  /**
   * 查询推送历史 (按会员)
   * GET /push/history
   * BS-0166: 推送历史记录查询
   */
  @Get('history')
  queryPushHistory(
    @Query() query: PushHistoryQueryDto,
  ): { items: PushHistoryEntry[]; total: number; page: number; limit: number } {
    return this.statsService.getPushHistory({
      memberId: query.memberId,
      tenantId: query.tenantId,
      channel: query.channel,
      priority: query.priority as PushBusinessPriority | undefined,
      from: query.from,
      to: query.to,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    })
  }
}
