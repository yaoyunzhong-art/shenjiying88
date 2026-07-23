import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Injectable, NotFoundException, Param, Post, Put, Res, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import type { Response } from 'express'
import { MetricsService } from './metrics.service'
import { ObservabilityService } from './observability.service'
import type { CreateAlertRuleRequest, UpdateAlertRuleRequest, AlertRuleResponse } from './metrics.dto'
import { TenantGuard } from '../agent/tenant.guard'

@Injectable()
@ApiTags('observability')
@Controller()
@UseGuards(TenantGuard)
export class MetricsController {
  constructor(
    @Inject(MetricsService) private readonly metricsService: MetricsService,
    private readonly observability: ObservabilityService,
  ) {}

  /**
   * Prometheus 抓取端点 (text/plain; version=0.0.4)
   * GET /metrics
   */
  @Get('metrics')
  async getMetrics(@Res() res: Response) {
    const body = this.metricsService.render()
    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
    res.send(body)
  }

  /**
   * 健康检查端点 (轻量,不影响 metrics 收集)
   * GET /healthz
   */
  @Get('healthz')
  getHealth() {
    return { status: 'ok', metrics: this.metricsService.listMetrics().length }
  }

  // ── 指标列表 ──

  /**
   * GET /api/observability/metrics — 列出所有已注册指标
   */
  @Get('api/observability/metrics')
  @ApiOperation({ summary: '列出所有已注册指标' })
  listMetrics(): { metrics: string[]; count: number } {
    const metrics = this.metricsService.listMetrics()
    return { metrics, count: metrics.length }
  }

  // ── 告警规则 CRUD ──

  /**
   * POST /api/observability/alerts — 创建告警规则
   */
  @Post('api/observability/alerts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建告警规则' })
  createAlertRule(@Body() body: CreateAlertRuleRequest): AlertRuleResponse {
    return this.observability.createAlertRule(body)
  }

  /**
   * GET /api/observability/alerts — 列出所有告警规则
   */
  @Get('api/observability/alerts')
  @ApiOperation({ summary: '列出所有告警规则' })
  listAlertRules(): { items: AlertRuleResponse[]; total: number } {
    const items = this.observability.listAlertRules()
    return { items, total: items.length }
  }

  /**
   * GET /api/observability/alerts/:id — 告警规则详情
   */
  @Get('api/observability/alerts/:id')
  @ApiOperation({ summary: '告警规则详情' })
  getAlertRule(@Param('id') id: string): AlertRuleResponse {
    const rule = this.observability.getAlertRule(id)
    if (!rule) throw new NotFoundException(`Alert rule ${id} not found`)
    return rule
  }

  /**
   * PUT /api/observability/alerts/:id — 更新告警规则
   */
  @Put('api/observability/alerts/:id')
  @ApiOperation({ summary: '更新告警规则' })
  updateAlertRule(
    @Param('id') id: string,
    @Body() body: UpdateAlertRuleRequest,
  ): AlertRuleResponse {
    return this.observability.updateAlertRule(id, body)
  }

  /**
   * DELETE /api/observability/alerts/:id — 删除告警规则
   */
  @Delete('api/observability/alerts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除告警规则' })
  async deleteAlertRule(@Param('id') id: string): Promise<void> {
    this.observability.deleteAlertRule(id)
  }

  // ── 告警评估 ──

  /**
   * POST /api/observability/alerts/evaluate — 评估告警规则
   */
  @Post('api/observability/alerts/evaluate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '评估告警规则' })
  evaluateAlerts() {
    return { items: this.observability.evaluateAlerts() }
  }

  /**
   * GET /api/observability/alerts/active — 当前活跃告警
   */
  @Get('api/observability/alerts/active')
  @ApiOperation({ summary: '当前活跃告警' })
  getActiveAlerts() {
    return { items: this.observability.getActiveAlerts() }
  }

  /**
   * GET /api/observability/alerts/history — 告警历史
   */
  @Get('api/observability/alerts/history')
  @ApiOperation({ summary: '告警历史' })
  getAlertHistory() {
    return { items: this.observability.getAlertHistory() }
  }

  // ── 故障演练 (Chaos) ──

  /**
   * GET /api/observability/chaos/presets — 故障演练预设
   */
  @Get('api/observability/chaos/presets')
  @ApiOperation({ summary: '故障演练预设模板' })
  getChaosPresets() {
    return { items: this.observability.getChaosPresets() }
  }

  /**
   * POST /api/observability/chaos/experiments — 启动故障演练
   */
  @Post('api/observability/chaos/experiments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '启动故障演练' })
  startChaosExperiment(@Body() body: {
    type: string; scope: string; target?: string;
    params?: Record<string, number | string>; description?: string; autoRevertMs?: number
  }) {
    return this.observability.startChaosExperiment({
      type: body.type as string,
      scope: body.scope as string,
      target: body.target,
      params: body.params,
      description: body.description,
      autoRevertMs: body.autoRevertMs,
    })
  }

  /**
   * GET /api/observability/chaos/experiments — 列出故障演练
   */
  @Get('api/observability/chaos/experiments')
  @ApiOperation({ summary: '列出故障演练' })
  listChaosExperiments() {
    const items = this.observability.listChaosExperiments()
    return { items, total: items.length }
  }

  /**
   * GET /api/observability/chaos/experiments/:id — 演练详情
   */
  @Get('api/observability/chaos/experiments/:id')
  @ApiOperation({ summary: '故障演练详情' })
  getChaosExperiment(@Param('id') id: string) {
    const exp = this.observability.getChaosExperiment(id)
    if (!exp) throw new NotFoundException(`Experiment ${id} not found`)
    return exp
  }

  /**
   * POST /api/observability/chaos/experiments/:id/rollback — 回滚故障演练
   */
  @Post('api/observability/chaos/experiments/:id/rollback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '回滚故障演练' })
  rollbackChaosExperiment(@Param('id') id: string) {
    return this.observability.rollbackChaosExperiment(id)
  }

  /**
   * POST /api/observability/chaos/rollback-all — 全部回滚
   */
  @Post('api/observability/chaos/rollback-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '全部回滚故障演练' })
  rollbackAllChaosExperiments() {
    const count = this.observability.rollbackAllChaosExperiments()
    return { rolledBack: count }
  }

  // ── SLO ──

  /**
   * GET /api/observability/slo/targets — SLO 目标列表
   */
  @Get('api/observability/slo/targets')
  @ApiOperation({ summary: 'SLO 目标列表' })
  getSLOTargets() {
    return { items: this.observability.getSLOTargets() }
  }

  /**
   * POST /api/observability/slo/evaluate — 评估 SLO
   */
  @Post('api/observability/slo/evaluate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '评估 SLO' })
  evaluateSLO(@Body() body: { targetId: string; points: any[] }) {
    return this.observability.evaluateSLO(body.targetId, body.points)
  }

  // ── 仪表盘 ──

  /**
   * GET /api/observability/dashboards — Grafana 仪表盘列表
   */
  @Get('api/observability/dashboards')
  @ApiOperation({ summary: 'Grafana 仪表盘模板列表' })
  listDashboards() {
    return { items: this.observability.listDashboards() }
  }

  /**
   * GET /api/observability/dashboards/:uid — 仪表盘详情
   */
  @Get('api/observability/dashboards/:uid')
  @ApiOperation({ summary: '仪表盘详情' })
  getDashboard(@Param('uid') uid: string) {
    const dash = this.observability.getDashboard(uid)
    if (!dash) throw new NotFoundException(`Dashboard ${uid} not found`)
    return dash
  }

  // ── Oncall 排班 ──

  /**
   * GET /api/observability/oncall/schedule — 当前 Oncall 排班
   */
  @Get('api/observability/oncall/schedule')
  @ApiOperation({ summary: '当前 Oncall 排班' })
  getOncallSchedule() {
    return this.observability.getOncallSchedule()
  }

  /**
   * GET /api/observability/oncall/engineers — Oncall 工程师列表
   */
  @Get('api/observability/oncall/engineers')
  @ApiOperation({ summary: 'Oncall 工程师列表' })
  listOncallEngineers() {
    return { items: this.observability.listOncallEngineers() }
  }

  // ── Runbook ──

  /**
   * GET /api/observability/runbooks — Runbook 列表
   */
  @Get('api/observability/runbooks')
  @ApiOperation({ summary: 'Runbook 列表' })
  listRunbooks() {
    return { items: this.observability.listRunbooks() }
  }

  /**
   * GET /api/observability/runbooks/:alertRuleId — Runbook 详情
   */
  @Get('api/observability/runbooks/:alertRuleId')
  @ApiOperation({ summary: 'Runbook 详情' })
  getRunbook(@Param('alertRuleId') alertRuleId: string) {
    const rb = this.observability.getRunbook(alertRuleId)
    if (!rb) throw new NotFoundException(`Runbook for alert rule ${alertRuleId} not found`)
    return rb
  }
}
