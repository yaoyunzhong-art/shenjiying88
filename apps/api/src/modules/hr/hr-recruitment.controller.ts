import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { TenantGuard } from '../agent/tenant.guard'
import {
  HrRecruitmentService,
  type Position,
  type PositionType,
  type PositionStatus,
  type Candidate,
  type CandidateStage,
  type CandidateSource,
  type Referral,
  type RecruitmentStats,
} from './hr-recruitment.service'

@Controller('hr/recruitment')
@UseGuards(TenantGuard)
export class HrRecruitmentController {
  constructor(private readonly service: HrRecruitmentService) {}

  // ─────────────────────────────────────────────────────────────────
  // 职位管理
  // ─────────────────────────────────────────────────────────────────

  /**
   * POST /api/v1/hr/recruitment/positions
   * 创建职位
   */
  @Post('positions')
  @HttpCode(HttpStatus.CREATED)
  createPosition(
    @Headers('x-tenant-id') tenantId: string,
    @Body()
    body: {
      title: string
      department: string
      type: PositionType
      slots: number
      requirements: string[]
      salary: { min: number; max: number }
      description?: string
    },
  ): Position {
    return this.service.createPosition({ tenantId, ...body })
  }

  /**
   * GET /api/v1/hr/recruitment/positions
   * 职位列表（支持 department/status/type 筛选）
   */
  @Get('positions')
  findAllPositions(
    @Headers('x-tenant-id') tenantId: string,
    @Query('department') department?: string,
    @Query('status') status?: PositionStatus,
    @Query('type') type?: PositionType,
  ): Position[] {
    return this.service.findAllPositions(tenantId, { department, status, type })
  }

  /**
   * GET /api/v1/hr/recruitment/positions/:id
   * 职位详情
   */
  @Get('positions/:id')
  findPositionById(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
  ): Position {
    const pos = this.service.findPositionById(id, tenantId)
    if (!pos) throw new Error(`Position not found: ${id}`)
    return pos
  }

  /**
   * PATCH /api/v1/hr/recruitment/positions/:id
   * 更新职位
   */
  @Patch('positions/:id')
  updatePosition(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
    @Body()
    body: Partial<{
      title: string
      department: string
      type: PositionType
      slots: number
      filled: number
      requirements: string[]
      salary: { min: number; max: number }
      status: PositionStatus
      description: string
    }>,
  ): Position {
    return this.service.updatePosition(id, tenantId, body)
  }

  // ─────────────────────────────────────────────────────────────────
  // 候选人管理
  // ─────────────────────────────────────────────────────────────────

  /**
   * POST /api/v1/hr/recruitment/candidates
   * 新增候选人
   */
  @Post('candidates')
  @HttpCode(HttpStatus.CREATED)
  createCandidate(
    @Headers('x-tenant-id') tenantId: string,
    @Body()
    body: {
      positionId: string
      name: string
      phone: string
      source: CandidateSource
      score?: number
      resumeUrl?: string
      remark?: string
    },
  ): Candidate {
    return this.service.createCandidate({ tenantId, ...body })
  }

  /**
   * GET /api/v1/hr/recruitment/candidates
   * 候选人列表（支持 positionId/stage 筛选）
   */
  @Get('candidates')
  findCandidates(
    @Headers('x-tenant-id') tenantId: string,
    @Query('positionId') positionId?: string,
    @Query('stage') stage?: CandidateStage,
  ): Candidate[] {
    return this.service.findCandidates(tenantId, { positionId, stage })
  }

  /**
   * PATCH /api/v1/hr/recruitment/candidates/:id
   * 更新候选人状态（面试流转）
   */
  @Patch('candidates/:id')
  updateCandidateStatus(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
    @Body()
    body: Partial<{
      stage: CandidateStage
      score: number
      interviewer: string
      result: string
      remark: string
    }>,
  ): Candidate {
    return this.service.updateCandidateStatus(id, tenantId, body)
  }

  // ─────────────────────────────────────────────────────────────────
  // 内推管理
  // ─────────────────────────────────────────────────────────────────

  /**
   * POST /api/v1/hr/recruitment/referrals
   * 推荐记录
   */
  @Post('referrals')
  @HttpCode(HttpStatus.CREATED)
  createReferral(
    @Headers('x-tenant-id') tenantId: string,
    @Body()
    body: {
      candidateId: string
      referrerId: string
      referrerName: string
      reward: number
    },
  ): Referral {
    return this.service.createReferral({ tenantId, ...body })
  }

  // ─────────────────────────────────────────────────────────────────
  // 统计
  // ─────────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/hr/recruitment/stats
   * 招聘统计
   */
  @Get('stats')
  getRecruitmentStats(
    @Headers('x-tenant-id') tenantId: string,
  ): RecruitmentStats {
    return this.service.getRecruitmentStats(tenantId)
  }

  // ─────────────────────────────────────────────────────────────────
  // 入职流程
  // ─────────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/hr/recruitment/onboarding/:id
   * 入职流程（对接员工创建）
   */
  @Get('onboarding/:id')
  getOnboardingInfo(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
  ): {
    candidate: Candidate
    position: Position | undefined
    onboardingSteps: string[]
  } {
    return this.service.getOnboardingInfo(id, tenantId)
  }
}
