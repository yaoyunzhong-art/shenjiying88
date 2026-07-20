// session.controller.ts · 会话管理接口
// Phase-FP P10 · 2026-07-08

import { Controller, Post, Get, Body, Param, Delete, HttpCode, HttpStatus, NotFoundException, BadRequestException, UseGuards } from '@nestjs/common'
import { SessionService } from './session.service'
import {
  CreateSessionDto,
  ValidateSessionDto,
  RevokeSessionDto,
  RevokeAllSessionsDto,
  SessionInfoDto,
  CreateSessionResponseDto,
} from './session.dto'
import { DeviceInfo } from './session.entity'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('sessions')
@UseGuards(TenantGuard)
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  /**
   * POST /sessions
   * 创建新会话
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  createSession(@Body() body: CreateSessionDto): CreateSessionResponseDto {
    if (!body.userId || !body.tenantId) {
      throw new BadRequestException('userId and tenantId are required')
    }

    const deviceInfo: DeviceInfo = body.deviceInfo || {
      deviceId: 'unknown',
      deviceType: 'unknown',
    }

    const session = this.sessionService.createSession(body.userId, body.tenantId, deviceInfo)

    return {
      sessionId: session.sessionId,
      userId: session.userId,
      tenantId: session.tenantId,
      deviceInfo: session.deviceInfo,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      status: session.status,
    }
  }

  /**
   * POST /sessions/validate
   * 验证会话是否有效
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  validateSession(@Body() body: ValidateSessionDto) {
    if (!body.sessionId) {
      throw new BadRequestException('sessionId is required')
    }

    const session = this.sessionService.getSession(body.sessionId)
    const valid = session !== null

    return {
      valid,
      userId: session?.userId,
      tenantId: session?.tenantId,
    }
  }

  /**
   * POST /sessions/revoke
   * 作废指定会话
   */
  @Post('revoke')
  @HttpCode(HttpStatus.OK)
  revokeSession(@Body() body: RevokeSessionDto) {
    if (!body.sessionId) {
      throw new BadRequestException('sessionId is required')
    }

    const success = this.sessionService.revokeSession(body.sessionId)
    if (!success) {
      throw new NotFoundException(`Session ${body.sessionId} not found`)
    }

    return {
      success: true,
      revokedAt: new Date().toISOString(),
    }
  }

  /**
   * POST /sessions/revoke-all
   * 作废用户所有会话
   */
  @Post('revoke-all')
  @HttpCode(HttpStatus.OK)
  revokeAllUserSessions(@Body() body: RevokeAllSessionsDto) {
    if (!body.userId) {
      throw new BadRequestException('userId is required')
    }

    const count = this.sessionService.revokeAllUserSessions(body.userId)

    return {
      success: true,
      revokedCount: count,
    }
  }

  /**
   * GET /sessions/user/:userId
   * 获取用户所有活跃会话
   */
  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  getUserSessions(@Param('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId is required')
    }

    const sessions = this.sessionService.getUserSessions(userId)
    const infoList: SessionInfoDto[] = sessions.map((s) => ({
      sessionId: s.sessionId,
      userId: s.userId,
      tenantId: s.tenantId,
      deviceType: s.deviceInfo.deviceType,
      deviceId: s.deviceInfo.deviceId,
      browser: s.deviceInfo.browser,
      os: s.deviceInfo.os,
      ip: (s.deviceInfo as any).ip,
      createdAt: s.createdAt,
      lastActiveAt: s.lastActiveAt,
      expiresAt: s.expiresAt,
      status: s.status,
    }))

    return {
      sessions: infoList,
      count: infoList.length,
    }
  }

  /**
   * GET /sessions/:sessionId
   * 获取单条会话详情
   */
  @Get(':sessionId')
  @HttpCode(HttpStatus.OK)
  getSession(@Param('sessionId') sessionId: string) {
    if (!sessionId) {
      throw new BadRequestException('sessionId is required')
    }

    const session = this.sessionService.getSession(sessionId)
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found or expired`)
    }

    return {
      sessionId: session.sessionId,
      userId: session.userId,
      tenantId: session.tenantId,
      deviceType: session.deviceInfo.deviceType,
      deviceId: session.deviceInfo.deviceId,
      browser: session.deviceInfo.browser,
      os: session.deviceInfo.os,
      ip: (session.deviceInfo as any).ip,
      createdAt: session.createdAt,
      lastActiveAt: session.lastActiveAt,
      expiresAt: session.expiresAt,
      status: session.status,
    }
  }

  /**
   * DELETE /sessions/:sessionId
   * 删除/作废指定会话
   */
  @Delete(':sessionId')
  @HttpCode(HttpStatus.OK)
  deleteSession(@Param('sessionId') sessionId: string) {
    if (!sessionId) {
      throw new BadRequestException('sessionId is required')
    }

    const success = this.sessionService.revokeSession(sessionId)
    if (!success) {
      throw new NotFoundException(`Session ${sessionId} not found`)
    }

    return {
      success: true,
      message: 'Session deleted',
    }
  }
}
