/**
 * Phase 96 自定义域名 Controller (V10 Sprint 2 Day 22)
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { CustomDomainService } from './custom-domain.service'
import { isValidDomain, buildVerificationHost, buildVerificationValue } from './custom-domain.entity'

export interface AddDomainRequest {
  domain: string
}

@Controller('saas/domain')
export class CustomDomainController {
  constructor(private readonly service: CustomDomainService) {}

  /**
   * 添加自定义域名 (返回待 TXT 校验记录)
   * POST /saas/domain
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async addDomain(@Body() body: AddDomainRequest) {
    return this.service.addDomain(body.domain)
  }

  /**
   * 列出当前租户所有域名
   * GET /saas/domain
   */
  @Get()
  async list() {
    const items = await this.service.list()
    return { items, total: items.length }
  }

  /**
   * 获取域名详情 + 校验提示
   * GET /saas/domain/:id
   */
  @Get(':id')
  async getById(@Param('id') id: string) {
    const m = await this.service.getById(id)
    return {
      ...m,
      hint: {
        host: m.verificationHost,
        value: buildVerificationValue(m.verificationToken),
        type: 'TXT',
        instructions: `请在 DNS 服务商添加 TXT 记录: ${m.verificationHost} = shenjiying-verify=${m.verificationToken}`,
      },
    }
  }

  /**
   * 删除域名
   * DELETE /saas/domain/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.service.remove(id)
  }

  /**
   * 触发 DNS TXT 校验
   * POST /saas/domain/:id/verify
   */
  @Post(':id/verify')
  @HttpCode(HttpStatus.OK)
  async verify(@Param('id') id: string) {
    return this.service.verify(id)
  }

  /**
   * 申请 SSL 证书 (active → active_ssl)
   * POST /saas/domain/:id/ssl
   */
  @Post(':id/ssl')
  @HttpCode(HttpStatus.OK)
  async requestSsl(@Param('id') id: string) {
    return this.service.requestSsl(id)
  }

  /**
   * Host → tenantId 解析 (CDN/网关用, 无需租户上下文)
   * GET /saas/domain/resolve?host=acme.shenjiying88.com
   */
  @Get('resolve/host')
  async resolveHost(@Body() body: { host: string }) {
    const tenantId = this.service.resolveTenantByHost(body.host)
    return { host: body.host, tenantId, resolved: tenantId != null }
  }

  /**
   * 域名格式预校验 (前端表单用)
   * POST /saas/domain/validate
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  async validateDomain(@Body() body: AddDomainRequest) {
    const result = isValidDomain(body.domain)
    return result
  }
}