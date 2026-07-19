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
  HrPerformanceService,
  type PerformanceTemplate,
  type PerformancePeriod,
  type Evaluation,
  type EvaluationStatus,
  type KpiScore,
  type OkrScore,
  type SbIInterview,
  type StarEmployee,
  type PerformanceStats,
} from './hr-performance.service'

@Controller('hr/performance')
@UseGuards(TenantGuard)
export class HrPerformanceController {
  constructor(private readonly service: HrPerformanceService) {}

  // ─────────────────────────────────────────────────────────────────
  // 考核模板管理
  // ─────────────────────────────────────────────────────────────────

  /**
   * POST /api/v1/hr/performance/templates
   * 创建考核模板
   */
  @Post('templates')
  @HttpCode(HttpStatus.CREATED)
  createTemplate(
    @Headers('x-tenant-id') tenantId: string,
    @Body()
    body: {
      name: string
      department: string
      kpis: { name: string; target: string; weight: number }[]
      okrs: { objective: string; keyResults: string[] }[]
      period: PerformancePeriod
    },
  ): PerformanceTemplate {
    return this.service.createTemplate({ tenantId, ...body })
  }

  /**
   * GET /api/v1/hr/performance/templates
   * 考核模板列表
   */
  @Get('templates')
  findAllTemplates(
    @Headers('x-tenant-id') tenantId: string,
  ): PerformanceTemplate[] {
    return this.service.findAllTemplates(tenantId)
  }

  /**
   * GET /api/v1/hr/performance/templates/:id
   * 模板详情
   */
  @Get('templates/:id')
  findTemplateById(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
  ): PerformanceTemplate {
    const tpl = this.service.findTemplateById(id, tenantId)
    if (!tpl) throw new Error(`Performance template not found: ${id}`)
    return tpl
  }

  // ─────────────────────────────────────────────────────────────────
  // 考核评估
  // ─────────────────────────────────────────────────────────────────

  /**
   * POST /api/v1/hr/performance/evaluations
   * 创建评估
   */
  @Post('evaluations')
  @HttpCode(HttpStatus.CREATED)
  createEvaluation(
    @Headers('x-tenant-id') tenantId: string,
    @Body()
    body: {
      employeeId: string
      templateId: string
      period: string
      kpiScores: KpiScore[]
      okrScores: OkrScore[]
      status: EvaluationStatus
      selfComment?: string
    },
  ): Evaluation {
    return this.service.createEvaluation({ tenantId, ...body })
  }

  /**
   * GET /api/v1/hr/performance/evaluations
   * 评估列表（支持 employeeId, period 筛选）
   */
  @Get('evaluations')
  findEvaluations(
    @Headers('x-tenant-id') tenantId: string,
    @Query('employeeId') employeeId?: string,
    @Query('period') period?: string,
  ): Evaluation[] {
    return this.service.findEvaluations(tenantId, { employeeId, period })
  }

  /**
   * GET /api/v1/hr/performance/evaluations/:id
   * 评估详情
   */
  @Get('evaluations/:id')
  findEvaluationById(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
  ): Evaluation {
    const evalRecord = this.service.findEvaluationById(id, tenantId)
    if (!evalRecord) throw new Error(`Evaluation not found: ${id}`)
    return evalRecord
  }

  /**
   * PATCH /api/v1/hr/performance/evaluations/:id
   * 更新评估（支持审核流转）
   */
  @Patch('evaluations/:id')
  updateEvaluation(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
    @Body()
    body: Partial<{
      kpiScores: KpiScore[]
      okrScores: OkrScore[]
      status: EvaluationStatus
      selfComment: string
      managerComment: string
      completedAt: string
    }>,
  ): Evaluation {
    return this.service.updateEvaluation(id, tenantId, body)
  }

  // ─────────────────────────────────────────────────────────────────
  // SBI面谈
  // ─────────────────────────────────────────────────────────────────

  /**
   * POST /api/v1/hr/performance/interviews
   * 记录SBI面谈
   */
  @Post('interviews')
  @HttpCode(HttpStatus.CREATED)
  createInterview(
    @Headers('x-tenant-id') tenantId: string,
    @Body()
    body: {
      employeeId: string
      evaluatorId: string
      situation: string
      behavior: string
      impact: string
      overallFeedback?: string
      actionPlan?: string
      interviewDate: string
    },
  ): SbIInterview {
    return this.service.createInterview({ tenantId, ...body })
  }

  /**
   * GET /api/v1/hr/performance/interviews
   * 面谈记录列表（支持 employeeId 筛选）
   */
  @Get('interviews')
  findInterviews(
    @Headers('x-tenant-id') tenantId: string,
    @Query('employeeId') employeeId?: string,
  ): SbIInterview[] {
    return this.service.findInterviews(tenantId, employeeId)
  }

  // ─────────────────────────────────────────────────────────────────
  // 星级员工
  // ─────────────────────────────────────────────────────────────────

  /**
   * POST /api/v1/hr/performance/star-employees
   * 评定星级员工
   */
  @Post('star-employees')
  @HttpCode(HttpStatus.CREATED)
  createStarEmployee(
    @Headers('x-tenant-id') tenantId: string,
    @Body()
    body: {
      employeeId: string
      period: string
      type: 'monthly' | 'quarterly' | 'annual'
      achievement: string
      reward: string
    },
  ): StarEmployee {
    return this.service.createStarEmployee({ tenantId, ...body })
  }

  /**
   * GET /api/v1/hr/performance/star-employees
   * 星级员工列表
   */
  @Get('star-employees')
  findAllStarEmployees(
    @Headers('x-tenant-id') tenantId: string,
  ): StarEmployee[] {
    return this.service.findAllStarEmployees(tenantId)
  }

  // ─────────────────────────────────────────────────────────────────
  // 统计
  // ─────────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/hr/performance/stats
   * 绩效统计（平均分/分布/星级数）
   */
  @Get('stats')
  getPerformanceStats(
    @Headers('x-tenant-id') tenantId: string,
  ): PerformanceStats {
    return this.service.getPerformanceStats(tenantId)
  }
}
