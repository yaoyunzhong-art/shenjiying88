import { Controller, Post, Get, Body, Param, UsePipes, ValidationPipe, BadRequestException } from '@nestjs/common'

import { TenantGuard } from '../agent/tenant.guard'

import { MemberLevelService } from './member-level.service'
import { LevelEvaluationInputDto, BatchLevelInputDto, LevelConfigUpdateDto } from './member-level.dto'
import { MemberLevelTier, MemberLevelSub, type LevelInfo, type BatchLevelOutput, type AllLevelConfig } from './member-level.entity'
import type { LevelChangeRecord } from './member-level.entity'

@UseGuards(TenantGuard)
@Controller('member-level')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class MemberLevelController {
  constructor(private readonly memberLevelService: MemberLevelService) {}

  /** POST /member-level/evaluate - 评估会员等级 */
  @Post('evaluate')
  evaluate(@Body() input: LevelEvaluationInputDto): { success: boolean; data: LevelInfo } {
    const result = this.memberLevelService.evaluateMemberLevel(input)
    return { success: true, data: result }
  }

  /** POST /member-level/calculate - 仅根据成长值计算（旧接口兼容） */
  @Post('calculate')
  async calculate(@Body() body: { growthValue: number }): Promise<{ success: boolean; data: LevelInfo }> {
    if (body.growthValue === undefined || body.growthValue < 0) {
      throw new BadRequestException('growthValue must be a non-negative number')
    }
    const result = await this.memberLevelService.calculateLevel(body.growthValue)
    return { success: true, data: result }
  }

  /** POST /member-level/batch - 批量评估 */
  @Post('batch')
  batchEvaluate(@Body() body: BatchLevelInputDto): { success: boolean; data: BatchLevelOutput } {
    const items = body.items.map(i => i.input)
    const result = this.memberLevelService.batchEvaluate({ items })
    return { success: true, data: result }
  }

  /** GET /member-level/config - 获取等级配置 */
  @Get('config')
  getConfig(): { success: boolean; data: AllLevelConfig } {
    const config = this.memberLevelService.getAllLevelConfig()
    return { success: true, data: config }
  }

  /** GET /member-level/upgrade-path/:fromTier/:fromSub/:toTier/:toSub - 获取升级路径 */
  @Get('upgrade-path/:fromTier/:fromSub/:toTier/:toSub')
  getUpgradePath(
    @Param('fromTier') fromTier: string,
    @Param('fromSub') fromSub: string,
    @Param('toTier') toTier: string,
    @Param('toSub') toSub: string
  ): { success: boolean; data: LevelChangeRecord[] } {
    const validTiers = Object.values(MemberLevelTier) as string[]
    const validSubs = Object.values(MemberLevelSub) as string[]

    if (!validTiers.includes(fromTier)) throw new BadRequestException(`Invalid fromTier: ${fromTier}`)
    if (!validSubs.includes(fromSub)) throw new BadRequestException(`Invalid fromSub: ${fromSub}`)
    if (!validTiers.includes(toTier)) throw new BadRequestException(`Invalid toTier: ${toTier}`)
    if (!validSubs.includes(toSub)) throw new BadRequestException(`Invalid toSub: ${toSub}`)

    const path = this.memberLevelService.getUpgradePath(
      fromTier as MemberLevelTier,
      fromSub as MemberLevelSub,
      toTier as MemberLevelTier,
      toSub as MemberLevelSub
    )

    return { success: true, data: path }
  }
}
