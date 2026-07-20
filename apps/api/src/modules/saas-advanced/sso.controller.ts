/**
 * Phase 96 SSO Controller (V10 Sprint 2 Day 23)
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common'
import { SsoService } from './sso.service'
import type {
  CreateSamlConnectionDto,
  CreateOidcConnectionDto,
  UpdateSsoConnectionDto,
  SsoLoginInitiateDto,
  SsoLoginCompleteDto,
} from './sso.dto'
import { TenantGuard } from '../agent/tenant.guard';

@Controller('saas/sso')
@UseGuards(TenantGuard)
export class SsoController {
  constructor(private readonly service: SsoService) {}

  // ============ 连接管理 ============

  /**
   * 创建 SAML 连接
   * POST /saas/sso/saml
   */
  @Post('saml')
  @HttpCode(HttpStatus.CREATED)
  async createSaml(@Body() body: CreateSamlConnectionDto) {
    const conn = await this.service.createSamlConnection(body)
    return { id: conn.id, protocol: conn.protocol, name: conn.name, status: conn.status }
  }

  /**
   * 创建 OIDC 连接
   * POST /saas/sso/oidc
   */
  @Post('oidc')
  @HttpCode(HttpStatus.CREATED)
  async createOidc(@Body() body: CreateOidcConnectionDto) {
    const conn = await this.service.createOidcConnection(body)
    return { id: conn.id, protocol: conn.protocol, name: conn.name, status: conn.status }
  }

  /**
   * 列出当前租户 SSO 连接
   * GET /saas/sso/connections
   */
  @Get('connections')
  async list() {
    const items = await this.service.listConnections()
    return { items, total: items.length }
  }

  /**
   * SSO 连接详情
   * GET /saas/sso/connections/:id
   */
  @Get('connections/:id')
  async getOne(@Param('id') id: string) {
    return this.service.getConnection(id)
  }

  /**
   * 更新 SSO 连接
   * PATCH /saas/sso/connections/:id
   */
  @Patch('connections/:id')
  async update(@Param('id') id: string, @Body() body: UpdateSsoConnectionDto) {
    return this.service.updateConnection(id, body)
  }

  /**
   * 删除 SSO 连接
   * DELETE /saas/sso/connections/:id
   */
  @Delete('connections/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.service.deleteConnection(id)
  }

  // ============ 登录流程 (公开接口, 无需 tenant context) ============

  /**
   * 启动 SSO 登录 (SP-initiated)
   * POST /saas/sso/login/initiate/:connectionId
   */
  @Post('login/initiate/:connectionId')
  @HttpCode(HttpStatus.OK)
  async initiateLogin(
    @Param('connectionId') connectionId: string,
    @Body() body: SsoLoginInitiateDto,
  ) {
    return this.service.initiateLogin(connectionId, body)
  }

  /**
   * 完成 SSO 登录 (SAML POST 或 OIDC 回调)
   * POST /saas/sso/login/complete
   */
  @Post('login/complete')
  @HttpCode(HttpStatus.OK)
  async completeLogin(@Body() body: SsoLoginCompleteDto) {
    return this.service.completeLogin(body)
  }

  /**
   * 验证访问令牌
   * POST /saas/sso/verify
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verify(@Body() body: { token: string }) {
    const claims = this.service.verifyAccessToken(body.token)
    return { valid: claims != null, claims }
  }

  // ============ 用户身份查询 ============

  /**
   * 列出当前用户的 SSO 身份关联
   * GET /saas/sso/identities
   */
  @Get('identities')
  async listIdentities(@Req() req: any) {
    const userId = req.headers['x-user-id'] ?? 'anonymous'
    return { items: await this.service.listUserIdentities(userId) }
  }
}