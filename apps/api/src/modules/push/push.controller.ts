import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query
} from '@nestjs/common'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  BroadcastMessageDto,
  CancelScheduledPushDto,
  RegisterPushTemplateDto,
  SchedulePushDto,
  SendPushDto,
  SendWSMessageDto
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
    priority: s.priority === 'high' ? PushPriority.High : PushPriority.Normal,
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
export class PushController {
  constructor(
    private readonly apnsService: APNsService,
    private readonly wsService: WebSocketService,
    private readonly scheduler: PushNotificationScheduler
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
        priority === PushPriority.High ? 'high' : 'normal'
      )

      if (success) {
        const history = this.apnsService.getPushHistory(body.deviceToken)
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

  // ── Stats & Query endpoints ──

  /**
   * 获取推送统计
   * 👔 店长: 查看推送效果
   * 🎯 运行专员: 监控推送服务运行状态
   */
  @Get('stats')
  getStats(): PushStats {
    const history = this.apnsService.getPushHistory('*')
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
  getPushHistory(
    @Param('deviceToken') deviceToken: string
  ): PushRecord[] {
    const records = this.apnsService.getPushHistory(deviceToken)
    return records.map((r) => toEntityPushRecord(r))
  }

  /**
   * 获取当前 WS 连接数
   */
  @Get('ws/connections')
  getWSConnections(): { activeConnections: number } {
    return { activeConnections: this.wsService.getActiveConnections() }
  }
}
