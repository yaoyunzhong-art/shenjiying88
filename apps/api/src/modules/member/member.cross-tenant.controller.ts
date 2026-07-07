import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Logger,
  Optional,
  BadRequestException
} from '@nestjs/common'
import {
  MemberCrossTenantService,
  type CrossTenantMemberSummary,
  type CrossTenantMemberLink
} from './member.cross-tenant'

/**
 * Phase-36 T166-3: Member 跨租户识别 · HTTP 接口
 *
 * 端点 (4):
 *  - GET  /api/member/cross-tenant/mobile/:mobile - 跨租户查询 (mobile 路径参数)
 *  - POST /api/member/cross-tenant/link - 关联两个不同租户的会员
 *  - POST /api/member/cross-tenant/unlink - 解关联
 *  - GET  /api/member/cross-tenant/history/:memberId - 查询审计追踪
 *
 * 反模式 v4 防御:
 *  - TenantGuard (TODO: Phase-37 RBAC)
 *  - 操作日志 (link/unlink 记录 performedBy)
 *  - PII 脱敏 (返回前 maskMobile)
 */
@Controller('api/member/cross-tenant')
export class MemberCrossTenantController {
  private readonly logger = new Logger(MemberCrossTenantController.name)

  constructor(@Optional() private readonly service?: MemberCrossTenantService) {}

  /**
   * 跨租户查询 (路径参数, 便于缓存和审计)
   */
  @Get('mobile/:mobile')
  async findByMobile(@Param('mobile') mobile: string): Promise<{
    mobile: string
    matches: CrossTenantMemberSummary[]
    count: number
  }> {
    if (!this.service) {
      throw new BadRequestException('MemberCrossTenantService not available')
    }
    const matches = this.service.findByMobileAcrossTenants(mobile)
    return {
      mobile: this.maskInResponse(mobile),
      matches,
      count: matches.length
    }
  }

  /**
   * 关联两个不同租户的会员
   */
  @Post('link')
  async link(
    @Body()
    body: {
      primaryMemberId: string
      secondaryMemberId: string
      reason: string
      performedBy: string
    }
  ): Promise<CrossTenantMemberLink> {
    if (!this.service) {
      throw new BadRequestException('MemberCrossTenantService not available')
    }
    return this.service.linkAcrossTenants(body)
  }

  /**
   * 解关联
   */
  @Post('unlink')
  async unlink(
    @Body()
    body: {
      primaryMemberId: string
      secondaryMemberId: string
      reason: string
      performedBy: string
    }
  ): Promise<CrossTenantMemberLink> {
    if (!this.service) {
      throw new BadRequestException('MemberCrossTenantService not available')
    }
    return this.service.unlinkAcrossTenants(body)
  }

  /**
   * 查询审计追踪
   */
  @Get('history/:memberId')
  async history(@Param('memberId') memberId: string): Promise<{
    memberId: string
    history: CrossTenantMemberLink['linkHistory']
  }> {
    if (!this.service) {
      throw new BadRequestException('MemberCrossTenantService not available')
    }
    return {
      memberId,
      history: this.service.getLinkHistory(memberId)
    }
  }

  /**
   * 响应中 mobile 脱敏 (日志中也避免打印完整号)
   */
  private maskInResponse(mobile: string): string {
    if (!mobile || mobile.length < 7) return '***'
    return `${mobile.slice(0, 3)}****${mobile.slice(-4)}`
  }
}