/**
 * 未成年保护 Controller
 */
import { Controller, Get, Post, Body, Param, Query, NotFoundException, UseGuards } from '@nestjs/common'
import { TenantGuard } from '../agent/tenant.guard'
import { MinorProtectionService } from './minor-protection.service'
import type { IdentityVerifyMethod, MinorProtectionConfig } from './minor-protection.entity'

@Controller('minor-protection')
@UseGuards(TenantGuard)
export class MinorProtectionController {
  constructor(private readonly service: MinorProtectionService) {}

  @Get('config')
  getConfig(): MinorProtectionConfig {
    return this.service.getDefaultConfig()
  }

  @Post('verify')
  verifyIdentity(@Body() body: {
    tenantId: string
    memberId: string
    method: IdentityVerifyMethod
    identityNumber: string
    name: string
    birthday: string
    guardianConsent?: boolean
  }) {
    return this.service.verifyIdentity(body)
  }

  @Get('verifications')
  listVerifications(@Query('tenantId') tenantId: string) {
    return this.service.listVerifications(tenantId)
  }

  @Get('verifications/:id')
  getVerification(@Param('id') id: string, @Query('tenantId') tenantId: string) {
    const record = this.service.getVerification(id, tenantId)
    if (!record) throw new NotFoundException('Verification record not found')
    return record
  }

  @Post('check-access')
  checkAccess(@Body() body: {
    tenantId: string
    memberId: string
    action: 'enter' | 'purchase' | 'game_play'
    config?: MinorProtectionConfig
  }) {
    return this.service.checkAccess(body)
  }

  @Get('access-logs')
  getAccessLogs(
    @Query('tenantId') tenantId: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getAccessLogs(tenantId, limit ? parseInt(limit, 10) : 50)
  }
}
