/**
 * terminal.controller.ts — 排队终端 Controller
 *
 * WP-12B BS-0161~BS-0163
 * - BS-0161: POST /terminal/{id}/heartbeat, GET /terminal/{id}/status
 * - BS-0162: POST /terminal/bind, POST /terminal/unbind, GET /terminal/{id}/bindings
 * - BS-0163: POST /terminal/detect-offline, POST /terminal/{id}/recover, GET /terminal/offline
 */

import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { TenantGuard } from '../agent/tenant.guard'
import { TerminalService } from './terminal.service'
import {
  BindTerminalDto,
  RegisterTerminalDto,
  TerminalHeartbeatDto,
  UnbindTerminalDto,
  RecoverTerminalDto,
} from './terminal.dto'
import {
  toTerminalStatusResponse,
  toTerminalBindingResponse,
  toHeartbeatResponse,
} from './terminal.contract'

@Controller('terminal')
@UseGuards(TenantGuard)
export class TerminalController {
  constructor(private readonly terminalService: TerminalService) {}

  // ═════════════════════════════════════════════════════════════════════
  // BS-0161: 终端心跳与状态
  // ═════════════════════════════════════════════════════════════════════

  /**
   * 注册终端
   * POST /terminal/register
   */
  @Post('register')
  registerTerminal(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: RegisterTerminalDto,
  ) {
    const existing = this.terminalService.getTerminalStatus(body.terminalId)
    if (existing) {
      throw new HttpException('Terminal already registered', HttpStatus.CONFLICT)
    }
    const terminal = this.terminalService.registerTerminal(
      body.terminalId,
      body.type,
      body.name,
      tenantContext.tenantId,
    )
    return toTerminalStatusResponse(terminal)
  }

  /**
   * 终端心跳上报
   * POST /terminal/{id}/heartbeat
   */
  @Post(':id/heartbeat')
  reportHeartbeat(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('id') id: string,
    @Body() body: TerminalHeartbeatDto,
  ) {
    // 检查终端存在
    const existing = this.terminalService.getTerminalStatus(id)
    if (!existing) {
      throw new HttpException('Terminal not found', HttpStatus.NOT_FOUND)
    }
    if (existing.tenantId !== tenantContext.tenantId) {
      throw new HttpException('Terminal tenant mismatch', HttpStatus.FORBIDDEN)
    }

    const result = this.terminalService.handleHeartbeat(id, body.latencyMs)
    return toHeartbeatResponse(result.terminalId, result.status, result.lastHeartbeatAt)
  }

  /**
   * 获取终端状态（含绑定信息）
   * GET /terminal/{id}/status
   */
  @Get(':id/status')
  getTerminalStatus(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('id') id: string,
  ) {
    const detail = this.terminalService.getTerminalStatusDetail(id)
    if (!detail) {
      throw new HttpException('Terminal not found', HttpStatus.NOT_FOUND)
    }
    if (detail.id !== id) {
      throw new HttpException('Terminal tenant mismatch', HttpStatus.FORBIDDEN)
    }
    return detail
  }

  // ═════════════════════════════════════════════════════════════════════
  // BS-0162: 终端 2FA 认证
  // ═════════════════════════════════════════════════════════════════════

  /**
   * 绑定终端到门店+操作员
   * POST /terminal/bind
   */
  @Post('bind')
  bindTerminal(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: BindTerminalDto,
  ) {
    const binding = this.terminalService.bindTerminal(
      body.terminalId,
      body.storeId,
      body.operatorId,
      body.operatorName ?? body.operatorId,
      tenantContext.tenantId,
    )
    return toTerminalBindingResponse(binding)
  }

  /**
   * 解除终端绑定
   * POST /terminal/unbind
   */
  @Post('unbind')
  unbindTerminal(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: UnbindTerminalDto,
  ) {
    const success = this.terminalService.unbindTerminal(body.terminalId, tenantContext.tenantId)
    if (!success) {
      throw new HttpException('No active binding found', HttpStatus.NOT_FOUND)
    }
    return { success: true, terminalId: body.terminalId }
  }

  /**
   * 获取终端的绑定历史
   * GET /terminal/{id}/bindings
   */
  @Get(':id/bindings')
  getTerminalBindings(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('id') id: string,
  ) {
    const terminal = this.terminalService.getTerminalStatus(id)
    if (!terminal) {
      throw new HttpException('Terminal not found', HttpStatus.NOT_FOUND)
    }
    if (terminal.tenantId !== tenantContext.tenantId) {
      throw new HttpException('Terminal tenant mismatch', HttpStatus.FORBIDDEN)
    }
    const bindings = this.terminalService.getBindingHistory(id)
    return bindings.map(toTerminalBindingResponse)
  }

  /**
   * 验证终端 2FA 绑定
   * POST /terminal/{id}/verify-binding
   */
  @Post(':id/verify-binding')
  verifyBinding(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('id') id: string,
    @Body('storeId') storeId: string,
    @Body('operatorId') operatorId: string,
  ) {
    if (!storeId || !operatorId) {
      throw new HttpException('storeId and operatorId are required', HttpStatus.BAD_REQUEST)
    }
    const result = this.terminalService.validateBinding(
      id,
      storeId,
      operatorId,
      tenantContext.tenantId,
    )
    return result
  }

  // ═════════════════════════════════════════════════════════════════════
  // BS-0163: 离线检测与自动恢复
  // ═════════════════════════════════════════════════════════════════════

  /**
   * 手动触发离线检测
   * POST /terminal/detect-offline
   */
  @Post('detect-offline')
  detectOffline(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query('thresholdMinutes') thresholdMinutes?: string,
  ) {
    const threshold = thresholdMinutes ? parseInt(thresholdMinutes, 10) : undefined
    const newlyOffline = this.terminalService.detectAndMarkOffline(
      !isNaN(threshold ?? NaN) && threshold !== undefined ? threshold : undefined,
    )
    const overview = this.terminalService.getOfflineOverview(tenantContext.tenantId)
    return {
      newlyOffline,
      ...overview,
    }
  }

  /**
   * 获取离线终端列表
   * GET /terminal/offline
   */
  @Get('offline')
  getOfflineTerminals(@TenantContext() tenantContext: RequestTenantContext) {
    const overview = this.terminalService.getOfflineOverview(tenantContext.tenantId)
    return overview
  }

  /**
   * 手动恢复终端
   * POST /terminal/{id}/recover
   */
  @Post(':id/recover')
  recoverTerminal(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('id') id: string,
  ) {
    const result = this.terminalService.recoverTerminal(id, tenantContext.tenantId)
    if (!result.success) {
      throw new HttpException('Terminal not found', HttpStatus.NOT_FOUND)
    }
    return {
      terminalId: id,
      previousStatus: result.wasOffline ? 'offline' : 'online',
      currentStatus: 'online',
      recovered: result.wasOffline,
    }
  }

  /**
   * 检查终端是否可用于排队操作
   * GET /terminal/{id}/ready
   */
  @Get(':id/ready')
  checkTerminalReady(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('id') id: string,
  ) {
    return this.terminalService.isTerminalReadyForQueue(id, tenantContext.tenantId)
  }
}
