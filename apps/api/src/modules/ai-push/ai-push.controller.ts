import { Controller, Get, Post, Body, Query, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common'
import { PushTaskService } from './ai-push-task.service'
import { MemberSegmentationService, OptimalTimingService, ABTestService } from './ai-push.service'
import type { PushTask, PushStats, SegmentProfile, ExperimentResult } from './ai-push.entity'
import type { OptimalTimeWindow, ExperimentConfig } from './ai-push.service'
import {
  CreatePushTaskDto,
  SegmentPushDto,
  CreateExperimentDto,
  RecordConversionDto,
  PushHistoryQueryDto,
  PushStatsDto,
} from './ai-push.dto'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('ai-push')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@UseGuards(TenantGuard)
export class AiPushController {
  constructor(
    private readonly pushTaskService: PushTaskService,
    private readonly memberSegmentationService: MemberSegmentationService,
    private readonly optimalTimingService: OptimalTimingService,
    private readonly abTestService: ABTestService,
  ) {}

  /**
   * 创建推送任务
   * POST /ai-push/tasks
   */
  @Post('tasks')
  createTask(@Body() body: CreatePushTaskDto): PushTask {
    return this.pushTaskService.createTask({
      title: body.title,
      content: body.content,
      channel: body.channel as any,
      targetMemberIds: body.targetMemberIds ?? [],
      scheduledAt: body.scheduledAt ?? Date.now(),
    })
  }

  /**
   * 按分群推送
   * POST /ai-push/segment-push
   */
  @Post('segment-push')
  segmentPush(@Body() body: SegmentPushDto): { taskId: string; memberCount: number } {
    const task = this.pushTaskService.createTask({
      title: body.title,
      content: body.content,
      channel: body.channel as any,
      targetMemberIds: [],
      scheduledAt: body.scheduledAt ?? Date.now(),
    })

    return { taskId: task.id, memberCount: 0 }
  }

  /**
   * 获取推送任务列表
   * GET /ai-push/tasks
   */
  @Get('tasks')
  getTasks(@Query() query: PushHistoryQueryDto): PushTask[] {
    return this.pushTaskService.getTasks({
      status: query.status,
      channel: query.channel,
      page: query.page ?? 0,
      pageSize: query.pageSize ?? 20,
    })
  }

  /**
   * 获取推送统计
   * GET /ai-push/stats
   */
  @Get('stats')
  getStats(@Query() query: PushStatsDto): PushStats {
    return this.pushTaskService.getStats(query.startTime, query.endTime)
  }

  /**
   * 创建 A/B 实验
   * POST /ai-push/experiments
   */
  @Post('experiments')
  createExperiment(@Body() body: CreateExperimentDto): ExperimentConfig {
    return this.abTestService.createExperiment({
      id: `exp-${Date.now()}`,
      name: body.name,
      description: body.description,
      variants: body.variants.map(v => ({
        name: v.name,
        weight: v.weight,
        config: v.config as Record<string, unknown>,
      })),
      trafficSplit: body.trafficSplit,
      startAt: Date.now(),
    })
  }

  /**
   * 获取实验结果
   * GET /ai-push/experiments/result
   */
  @Get('experiments/result')
  getExperimentResult(@Query('id') id: string): ExperimentResult | undefined {
    return this.abTestService.getExperimentResult(id)
  }

  /**
   * 记录转化
   * POST /ai-push/conversion
   */
  @Post('conversion')
  recordConversion(@Body() body: RecordConversionDto): { success: boolean } {
    this.abTestService.recordConversion(
      body.memberId,
      body.experimentId,
      body.variantName,
      body.event,
      body.value ?? 1,
    )
    return { success: true }
  }

  /**
   * 获取最优推送时段
   * GET /ai-push/optimal-timing
   */
  @Get('optimal-timing')
  getOptimalTiming(@Query('channel') channel: string): OptimalTimeWindow[] {
    return this.optimalTimingService.getGlobalOptimalWindows()
  }

  /**
   * 获取分群画像
   * POST /ai-push/segment-profile
   */
  @Post('segment-profile')
  getSegmentProfile(@Body() body: { type: string; id: string }): SegmentProfile {
    return this.memberSegmentationService.getSegmentProfile(body.type, body.id)
  }
}
