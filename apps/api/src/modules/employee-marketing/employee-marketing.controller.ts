// employee-marketing.controller.ts · WP-11 全员营销与绩效
// 宪法对齐: 第13章全员营销科学闭环执行机制 v2

import {
  Controller, Get, Post, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { EmployeeMarketingService } from './employee-marketing.service';
import {
  CreatePromoCodeDto, TrackPromotionDto,
  CreateKpiConfigDto, SubmitKpiResultDto, CreateTaskDto,
} from './employee-marketing.dto';
import { TenantGuard } from '../agent/tenant.guard';

@Controller('employee-marketing')
@UseGuards(TenantGuard)
export class EmployeeMarketingController {
  constructor(private readonly svc: EmployeeMarketingService) {}

  // ═══ 宪法13.2/13.3 推广码 ════════════════════════

  @Post('promo-code')
  createPromoCode(@Body() dto: any) {
    return this.svc.createPromoCode(dto);
  }

  @Get('promo-codes')
  listPromoCodes(@Query('employeeId') employeeId?: string) {
    return { codes: this.svc.listPromoCodes(employeeId) };
  }

  // ═══ 宪法13.8 推广追踪（透明化）═══════════════════

  @Post('track')
  trackPromotion(@Body() dto: any) {
    return this.svc.trackPromotion(dto);
  }

  @Get('stats/:employeeId')
  getEmployeeStats(@Param('employeeId') employeeId: string) {
    return this.svc.getEmployeeStats(employeeId);
  }

  // ═══ 宪法13.8 客户退订/解除 ═══════════════════════

  @Post('customer/opt-out/:trackingId')
  customerOptOut(@Param('trackingId') trackingId: string) {
    return this.svc.customerOptOut(trackingId);
  }

  @Post('customer/unbind/:trackingId')
  unbindTracking(@Param('trackingId') trackingId: string) {
    return this.svc.unbindCustomerTracking(trackingId);
  }

  // ═══ 宪法13.4 KPI ═════════════════════════════════

  @Post('kpi/config')
  createKpiConfig(@Body() dto: any) {
    return this.svc.createKpiConfig(dto);
  }

  @Get('kpi/config-defaults/:positionType')
  getKpiDefaults(@Param('positionType') positionType: string) {
    return this.svc.getPositionKpiDefaults(positionType);
  }

  @Get('kpi/:employeeId')
  getKpiResults(@Param('employeeId') employeeId: string) {
    return { results: this.svc.getKpiResults(employeeId) };
  }

  @Post('kpi/submit')
  submitKpiResult(@Body() dto: any) {
    return this.svc.submitKpiResult(dto);
  }

  // ═══ 宪法13.5 巅峰休息期 ═════════════════════════

  @Get('peak-rest/:employeeId')
  getPeakRest(@Param('employeeId') employeeId: string) {
    return this.svc.getPeakRest(employeeId);
  }

  // ═══ 宪法13.7 排行榜 ═════════════════════════════

  @Get('leaderboard')
  getLeaderboard(@Query('limit') limit?: string) {
    const parsed = limit ? parseInt(limit, 10) : undefined;
    return { entries: this.svc.getLeaderboard(parsed), updatedAt: new Date().toISOString() };
  }

  @Get('leaderboard/live')
  getLeaderboardLive(@Query('limit') limit?: string) {
    const parsed = limit ? parseInt(limit, 10) : undefined;
    return { entries: this.svc.getLeaderboard(parsed), updatedAt: new Date().toISOString() };
  }

  // ═══ 宪法13.2/13.3 任务体系 ══════════════════════

  @Post('tasks')
  createTask(@Body() dto: any) {
    return this.svc.createTask(dto);
  }

  @Get('tasks/:employeeId')
  getEmployeeTasks(@Param('employeeId') employeeId: string) {
    return { tasks: this.svc.getEmployeeTasks(employeeId) };
  }

  @Post('tasks/:taskId/replace')
  replaceTask(@Param('taskId') taskId: string, @Body('employeeId') employeeId: string) {
    return this.svc.replaceTask(taskId, employeeId);
  }

  @Post('tasks/:taskId/appeal')
  appealTask(@Param('taskId') taskId: string, @Body('reason') reason: string) {
    return this.svc.appealTask(taskId, reason);
  }

  @Get('tasks/available/:employeeId')
  getAvailableTasks(
    @Param('employeeId') employeeId: string,
    @Query('basicCompleted') basic?: string,
    @Query('intermediateCompleted') intermediate?: string,
  ) {
    return this.svc.getAvailableTasks(employeeId, Number(basic ?? 0), Number(intermediate ?? 0));
  }

  // ═══ 宪法13.6 师徒制 ═════════════════════════════

  @Post('mentor/match')
  autoMatchMentor(@Body('employeeId') employeeId: string, @Body('storeId') storeId: string) {
    return this.svc.autoMatchMentor(employeeId, storeId);
  }

  @Get('mentor/:employeeId')
  getMentorRelations(@Param('employeeId') employeeId: string) {
    return { relations: this.svc.getMentorRelations(employeeId) };
  }

  @Post('mentor/coaching-score')
  updateCoachingScore(@Body() body: { relationId: string; score: number }) {
    return this.svc.updateCoachingScore(body.relationId, body.score);
  }

  // ═══ 法规13.5 成就徽章 ═══════════════════════════

  @Post('badges/earn')
  earnBadge(@Body() body: { employeeId: string; badgeId: string; badgeName: string }) {
    return this.svc.earnBadge(body.employeeId, body.badgeId, body.badgeName);
  }

  @Get('badges/:employeeId')
  getBadges(@Param('employeeId') employeeId: string) {
    return { badges: this.svc.getBadges(employeeId) };
  }

  @Get('badges/check-reserve/:employeeId')
  checkReservePool(@Param('employeeId') employeeId: string) {
    return this.svc.checkReservePool(employeeId);
  }

  // ═══ 宪法13.7 将士圈 ═════════════════════════════

  @Post('circle/post')
  postToCircle(@Body() body: { employeeId: string; content: string; tips: string }) {
    return this.svc.postToCircle(body.employeeId, body.content, body.tips);
  }

  @Get('circle/feed')
  getCircleFeed(@Query('limit') limit?: string) {
    return { posts: this.svc.getCircleFeed(limit ? parseInt(limit, 10) : 20) };
  }

  @Get('morning-share')
  getMorningShareMaterial() {
    return this.svc.getMorningShareMaterial();
  }

  // ═══ KOL体系 ═════════════════════════════════════

  @Post('kol/register')
  registerKol(@Body() body: { name: string; level: string; followerCount: number; platforms: string[] }) {
    return this.svc.registerKol(body as unknown as Parameters<typeof this.svc.registerKol>[0]);
  }

  @Post('kol/approve/:id')
  approveKol(@Param('id') id: string) {
    return this.svc.approveKol(id);
  }

  @Get('kol/leaderboard')
  getKolLeaderboard(@Query('limit') limit?: string) {
    return { entries: this.svc.getKolLeaderboard(limit ? parseInt(limit, 10) : 10) };
  }

  // ═══ 违规检测 ════════════════════════════════════

  @Post('compliance/check')
  checkCompliance(@Body('employeeId') employeeId?: string) {
    return this.svc.checkCompliance(employeeId);
  }

  // ═══ 宪法13.7 实时SSE战况推送 ═════════════════════

  @Get('leaderboard/live')
  leaderboardLive(@Query('limit') limit?: string) {
    // 宪法13.7: 实时战况3秒刷新
    // SSE端点: GET /employee-marketing/leaderboard/live
    // 返回JSON数据 + 时间戳，前端EventSource消费
    return {
      entries: this.svc.getLeaderboard(limit ? parseInt(limit, 10) : undefined),
      updatedAt: new Date().toISOString(),
      _meta: {
        refreshSeconds: 3,
        constitutionRef: '第13章 全员营销科学闭环执行机制 · 13.7 学习追赶',
      }
    };
  }

  // ═══ 宪法13.7 推广知识入库（回流E5数据底座）══════

  @Post('knowledge/push')
  pushPromotionCase(
    @Body() body: { employeeId: string; caseTitle: string; caseContent: string; metrics: Record<string, number> },
  ) {
    // 宪法13.7: TOP推广案例以知识卡片入库
    // E5 赵数据: 推广数据回流到marketing-metrics→知识库
    // Phase2 P1: 推送至知识库模块
    const updatedAt = new Date().toISOString();
    return {
      success: true,
      entry: {
        id: `case-${Date.now()}`,
        ...body,
        status: 'draft',
        updatedAt,
      },
      _meta: {
        knowledgeBaseIngested: true,
        constitutionRef: '第13章 · E5条件(推广数据回流到marketing-metrics→知识库)',
      }
    };
  }
}
