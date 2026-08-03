/**
 * automation.controller.ts — 自动化规则引擎 API 端点
 *
 * 提供规则管理、工作流控制、任务查询等 API。
 *
 * 端点:
 *   GET    /api/automation/rules           — 列出所有规则
 *   GET    /api/automation/rules/:id        — 查询规则详情
 *   POST   /api/automation/rules            — 创建规则
 *   POST   /api/automation/rules/:id/evaluate — 评估规则
 *   POST   /api/automation/workflows        — 创建工作流
 *   GET    /api/automation/workflows/:id    — 查询工作流状态
 *   PUT    /api/automation/workflows/:id    — 更新工作流状态
 *   GET    /api/automation/jobs             — 列出任务
 *   POST   /api/automation/jobs             — 创建任务
 */

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
UseGuards,
} from '@nestjs/common'
import {
  AutomationService,
  EvaluationContext,
  type AutomationJob,
  type ActionDefinition,
  type WorkflowStatus,
  type RuleCondition,
  type ActionType,
} from './automation.service'
import { TenantGuard } from '../agent/tenant.guard'

class EvaluateRuleDto {
  context!: EvaluationContext
}

class CreateRuleDto {
  name!: string
  description!: string
  conditions!: RuleCondition[]
  actions!: { type: ActionType; params: Record<string, unknown> }[]
  enabled!: boolean
  priority!: number
}

class CreateWorkflowDto {
  name!: string
  ruleId!: string
}

class UpdateWorkflowDto {
  status!: WorkflowStatus
  progress?: number
}

class CreateJobDto {
  workflowId!: string
  ruleId!: string
  type!: 'scheduled' | 'triggered' | 'manual'
  context!: EvaluationContext
}

class ListJobsQueryDto {
  status?: AutomationJob['status']
  type?: AutomationJob['type']
  limit?: number
}

@Controller('api/automation')
@UseGuards(TenantGuard)
export class AutomationController {
  constructor(private readonly svc: AutomationService) {}

  /**
   * GET /api/automation/rules
   * 列出所有自动化规则。
   */
  @Get('rules')
  listRules() {
    const rules = this.svc.listAllRules()
    return { success: true, data: { rules, total: rules.length } }
  }

  /**
   * GET /api/automation/rules/:id
   * 查询指定规则详情。
   */
  @Get('rules/:id')
  getRule(@Param('id') id: string) {
    const rule = this.svc.getRule(id)
    if (!rule) {
      return { success: false, message: `规则 ${id} 不存在`, data: null }
    }
    return { success: true, data: rule }
  }

  /**
   * POST /api/automation/rules
   * 创建新自动化规则。
   */
  @Post('rules')
  @HttpCode(HttpStatus.CREATED)
  createRule(@Body() body: CreateRuleDto) {
    const rule = this.svc.addRule({
      name: body.name,
      description: body.description,
      conditions: body.conditions,
      actions: body.actions as ActionDefinition[],
      enabled: body.enabled,
      priority: body.priority,
    })
    return { success: true, message: `规则 ${rule.id} 创建成功`, data: rule }
  }

  /**
   * POST /api/automation/rules/:id/evaluate
   * 评估指定规则。
   */
  @Post('rules/:id/evaluate')
  @HttpCode(HttpStatus.OK)
  evaluateRule(@Param('id') id: string, @Body() body: EvaluateRuleDto) {
    const result = this.svc.evaluateRule(id, body.context)
    return { success: true, data: result }
  }

  /**
   * POST /api/automation/workflows
   * 创建工作流。
   */
  @Post('workflows')
  @HttpCode(HttpStatus.CREATED)
  createWorkflow(@Body() body: CreateWorkflowDto) {
    const wf = this.svc.createWorkflow(body.name, body.ruleId)
    return { success: true, data: wf }
  }

  /**
   * GET /api/automation/workflows/:id
   * 查询工作流状态。
   */
  @Get('workflows/:id')
  getWorkflow(@Param('id') id: string) {
    const wf = this.svc.getWorkflowStatus(id)
    if (!wf) {
      return { success: false, message: `工作流 ${id} 不存在`, data: null }
    }
    return { success: true, data: wf }
  }

  /**
   * PUT /api/automation/workflows/:id
   * 更新工作流状态。
   */
  @Put('workflows/:id')
  @HttpCode(HttpStatus.OK)
  updateWorkflow(@Param('id') id: string, @Body() body: UpdateWorkflowDto) {
    const wf = this.svc.updateWorkflowStatus(id, body.status, body.progress)
    if (!wf) {
      return { success: false, message: `工作流 ${id} 不存在`, data: null }
    }
    return { success: true, data: wf }
  }

  /**
   * GET /api/automation/jobs
   * 列出自动化任务。
   */
  @Get('jobs')
  listJobs(@Query() query: ListJobsQueryDto) {
    const jobs = this.svc.listJobs({
      status: query.status,
      type: query.type,
      limit: query.limit,
    })
    return { success: true, data: { jobs, total: jobs.length } }
  }

  /**
   * POST /api/automation/jobs
   * 创建自动化任务。
   */
  @Post('jobs')
  @HttpCode(HttpStatus.CREATED)
  createJob(@Body() body: CreateJobDto) {
    const job = this.svc.createJob(body.workflowId, body.ruleId, body.type, body.context)
    return { success: true, data: job }
  }
}
