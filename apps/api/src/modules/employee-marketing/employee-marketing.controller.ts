// employee-marketing.controller.ts · WP-11 全员营销与绩效
// 日期: 2026-07-23
// 状态: IMPLEMENTED

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EmployeeMarketingService } from './employee-marketing.service';
import {
  CreatePromoCodeDto,
  TrackPromotionDto,
  CreateKpiConfigDto,
  SubmitKpiResultDto,
  CreateTaskDto,
} from './employee-marketing.dto';
import { TenantGuard } from '../agent/tenant.guard';

@Controller('employee-marketing')
@UseGuards(TenantGuard)
export class EmployeeMarketingController {
  constructor(
    private readonly employeeMarketingService: EmployeeMarketingService,
  ) {}

  // ══════════════════════════════════════════════════════════════
  // 推广码
  // ══════════════════════════════════════════════════════════════

  /**
   * POST /employee-marketing/promo-code
   * 生成推广码
   */
  @Post('promo-code')
  createPromoCode(@Body() dto: CreatePromoCodeDto) {
    const code = this.employeeMarketingService.createPromoCode(dto);
    return {
      id: code.id,
      employeeId: code.employeeId,
      code: code.code,
      type: code.type,
      commissionRate: code.commissionRate,
      validUntil: code.validUntil.toISOString(),
      usageLimit: code.usageLimit,
      currentUsage: code.currentUsage,
    };
  }

  /**
   * GET /employee-marketing/promo-codes?employeeId=
   * 查询员工推广码列表
   */
  @Get('promo-codes')
  listPromoCodes(@Query('employeeId') employeeId?: string) {
    const codes = this.employeeMarketingService.listPromoCodes(employeeId);
    return {
      codes: codes.map(c => ({
        id: c.id,
        employeeId: c.employeeId,
        code: c.code,
        type: c.type,
        commissionRate: c.commissionRate,
        validUntil: c.validUntil.toISOString(),
        usageLimit: c.usageLimit,
        currentUsage: c.currentUsage,
      })),
    };
  }

  // ══════════════════════════════════════════════════════════════
  // 推广追踪
  // ══════════════════════════════════════════════════════════════

  /**
   * POST /employee-marketing/track
   * 追踪推广转化
   */
  @Post('track')
  trackPromotion(@Body() dto: TrackPromotionDto) {
    const tracking = this.employeeMarketingService.trackPromotion(dto);
    return {
      id: tracking.id,
      promoCodeId: tracking.promoCodeId,
      customerId: tracking.customerId,
      orderId: tracking.orderId,
      referredUserId: tracking.referredUserId,
      commission: tracking.commission,
      status: tracking.status,
      createdAt: tracking.createdAt.toISOString(),
      note: tracking.note,
    };
  }

  // ══════════════════════════════════════════════════════════════
  // 员工推广统计
  // ══════════════════════════════════════════════════════════════

  /**
   * GET /employee-marketing/stats/:employeeId
   * 员工推广统计（推广数/佣金/排名）
   */
  @Get('stats/:employeeId')
  getEmployeeStats(@Param('employeeId') employeeId: string) {
    const stats = this.employeeMarketingService.getEmployeeStats(employeeId);
    return stats;
  }

  // ══════════════════════════════════════════════════════════════
  // KPI 配置
  // ══════════════════════════════════════════════════════════════

  /**
   * POST /employee-marketing/kpi/config
   * 配置 KPI（管理端）
   */
  @Post('kpi/config')
  createKpiConfig(@Body() dto: CreateKpiConfigDto) {
    const config = this.employeeMarketingService.createKpiConfig(dto);
    return {
      id: config.id,
      positionType: config.positionType,
      metricName: config.metricName,
      target: config.target,
      weight: config.weight,
      unit: config.unit,
      period: config.period,
    };
  }

  /**
   * GET /employee-marketing/kpi/:employeeId
   * 查询员工 KPI 结果
   */
  @Get('kpi/:employeeId')
  getKpiResults(@Param('employeeId') employeeId: string) {
    const results = this.employeeMarketingService.getKpiResults(employeeId);
    return {
      results: results.map(r => ({
        id: r.id,
        employeeId: r.employeeId,
        period: r.period,
        scores: r.scores,
        totalScore: r.totalScore,
        bonusAmount: r.bonusAmount,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  // ══════════════════════════════════════════════════════════════
  // 绩效结果提交
  // ══════════════════════════════════════════════════════════════

  /**
   * POST /employee-marketing/kpi/submit
   * 提交绩效结果
   */
  @Post('kpi/submit')
  submitKpiResult(@Body() dto: SubmitKpiResultDto) {
    const result = this.employeeMarketingService.submitKpiResult(dto);
    return {
      id: result.id,
      employeeId: result.employeeId,
      period: result.period,
      scores: result.scores,
      totalScore: result.totalScore,
      bonusAmount: result.bonusAmount,
      createdAt: result.createdAt.toISOString(),
    };
  }

  // ══════════════════════════════════════════════════════════════
  // 排行榜
  // ══════════════════════════════════════════════════════════════

  /**
   * GET /employee-marketing/leaderboard
   * 推广排行榜
   */
  @Get('leaderboard')
  getLeaderboard(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    const entries = this.employeeMarketingService.getLeaderboard(parsedLimit);
    return {
      entries: entries.map(e => ({
        employeeId: e.employeeId,
        totalConversions: e.totalConversions,
        totalCommission: e.totalCommission,
        rank: e.rank,
      })),
      updatedAt: new Date().toISOString(),
    };
  }

  // ══════════════════════════════════════════════════════════════
  // 营销任务
  // ══════════════════════════════════════════════════════════════

  /**
   * POST /employee-marketing/tasks
   * 创建营销任务
   */
  @Post('tasks')
  createTask(@Body() dto: CreateTaskDto) {
    const task = this.employeeMarketingService.createTask(dto);
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      points: task.points,
      deadline: task.deadline.toISOString(),
      status: task.status,
      assignedTo: task.assignedTo,
      createdAt: task.createdAt.toISOString(),
    };
  }

  /**
   * GET /employee-marketing/tasks/:employeeId
   * 员工待办任务
   */
  @Get('tasks/:employeeId')
  getEmployeeTasks(@Param('employeeId') employeeId: string) {
    const tasks = this.employeeMarketingService.getEmployeeTasks(employeeId);
    return {
      tasks: tasks.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        points: t.points,
        deadline: t.deadline.toISOString(),
        status: t.status,
        createdAt: t.createdAt.toISOString(),
      })),
    };
  }

  // ══════════════════════════════════════════════════════════════
  // 违规检测
  // ══════════════════════════════════════════════════════════════

  /**
   * POST /employee-marketing/compliance/check
   * 检查推广行为异常
   */
  @Post('compliance/check')
  checkCompliance(@Body('employeeId') employeeId?: string) {
    const result = this.employeeMarketingService.checkCompliance(
      employeeId,
    );
    return {
      riskLevel: result.riskLevel,
      suspiciousItems: result.suspiciousItems,
      score: result.score,
    };
  }
}
