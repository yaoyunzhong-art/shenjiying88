/**
 * 多系统对接 - Controller (V9 需求 3 · V10 Day 5 Phase 89)
 *
 * RESTful API:
 * - POST /api/v9/open/auth          OAuth 2.0 client_credentials
 * - POST /api/v9/open/sync          数据同步 (HMAC + Bearer)
 * - POST /api/v9/open/command       指令下发 (HMAC + Bearer + Idempotency-Key)
 * - POST /api/v9/open/verify        Token 验证
 * - GET  /api/v9/open/clients       列出客户端 (admin)
 */

import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'

import { TenantGuard } from '../agent/tenant.guard'
import type { Request } from 'express'
import { OpenApiService } from './open-api.service'
import type { SyncPayload, CommandPayload } from './open-api.entity'

@UseGuards(TenantGuard)
@Controller('open')
export class OpenApiController {
  constructor(private readonly service: OpenApiService) {}

  /** POST /open/auth - OAuth 2.0 client_credentials */
  @Post('auth')
  @HttpCode(HttpStatus.OK)
  async authenticate(
    @Body() body: { client_id: string; client_secret: string; scope?: string },
    @Req() req: Request,
  ) {
    const clientIp = this.extractIp(req)
    const token = await this.service.authenticate(
      body.client_id,
      body.client_secret,
      body.scope?.split(' ') ?? [],
    )

    // IP 白名单 (auth 接口也校验,防止密钥泄露滥用)
    if (!this.service.verifyIpWhitelist(body.client_id, clientIp)) {
      throw new Error('IP not whitelisted')
    }

    return token
  }

  /** POST /open/verify - Token 验证 */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verify(@Body() body: { access_token: string }) {
    return this.service.verifyToken(body.access_token)
  }

  /** POST /open/sync - 数据同步 */
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async sync(
    @Body() payload: SyncPayload,
    @Headers('authorization') authHeader: string,
    @Headers('x-client-id') clientId: string,
    @Headers('x-hmac-signature') signature: string,
    @Headers('x-timestamp') timestamp: string,
    @Req() req: Request,
  ) {
    const token = this.extractBearer(authHeader)
    const clientIp = this.extractIp(req)

    // 三层校验: Bearer + IP + HMAC
    if (!this.service.verifyIpWhitelist(clientId, clientIp)) {
      throw new Error('IP not whitelisted')
    }
    if (
      !this.service.verifyHmacSignature(
        clientId,
        'POST',
        '/open/sync',
        timestamp,
        JSON.stringify(payload),
        signature,
      )
    ) {
      throw new Error('HMAC signature invalid')
    }

    return this.service.handleSync(clientId, payload)
  }

  /** POST /open/command - 指令下发 */
  @Post('command')
  @HttpCode(HttpStatus.OK)
  async command(
    @Body() payload: CommandPayload,
    @Headers('authorization') authHeader: string,
    @Headers('x-client-id') clientId: string,
    @Headers('x-hmac-signature') signature: string,
    @Headers('x-timestamp') timestamp: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Req() req: Request,
  ) {
    // 限流
    const limit = this.service.checkRateLimit(clientId)
    if (!limit.allowed) {
      return {
        error: 'rate_limited',
        errorDescription: 'Exceed rate limit',
        retryAfterMs: 1000,
      }
    }

    const clientIp = this.extractIp(req)
    if (!this.service.verifyIpWhitelist(clientId, clientIp)) {
      throw new Error('IP not whitelisted')
    }
    if (
      !this.service.verifyHmacSignature(
        clientId,
        'POST',
        '/open/command',
        timestamp,
        JSON.stringify(payload),
        signature,
      )
    ) {
      throw new Error('HMAC signature invalid')
    }

    return this.service.sendCommand(clientId, payload, idempotencyKey)
  }

  /** GET /open/clients?tenantId=... */
  @Get('clients')
  async listClients(@Query('tenantId') tenantId: string) {
    return { data: this.service.listClients(tenantId) }
  }

  // ============ 内部 ============

  private extractBearer(authHeader: string | undefined): string {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid Authorization header')
    }
    return authHeader.substring(7)
  }

  private extractIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '127.0.0.1'
    )
  }
}