/**
 * observability.service.ts — 可观测性统一服务 (CRUD)
 *
 * 🐜 V17: 模块补齐 — 封装 AlertEngine / ChaosEngine / SLOCalculator / RunbookRegistry / OncallRotation
 *
 * 提供可观测性领域的 CRUD 操作: 告警规则、故障演练、SLO、Grafana 仪表盘、Oncall 排班。
 */

import { Injectable } from '@nestjs/common'
import { MetricsService } from './metrics.service'
import {
  AlertEngine,
  installDefaultRules,
  type Alert,
  type AlertRule as AlertRuleType,
} from './alert-engine'
import {
  ChaosEngine,
  type ChaosExperiment,
  type ChaosType,
  type ChaosScope,
  CHAOS_PRESETS,
  type ChaosPreset,
} from './chaos-engine'
import {
  SLOCalculator,
  type SLOTarget,
  type SLIReport,
  type SLIDataPoint,
  DEFAULT_SLO_TARGETS,
} from './slo-engine'
import {
  RunbookRegistry,
  type Runbook,
  installDefaultRunbooks,
} from './oncall-runbook'
import {
  OncallRotation,
  type OncallEngineer,
  type OncallSchedule,
} from './oncall-runbook'
import {
  ALL_DASHBOARDS,
  type GrafanaDashboard,
} from './grafana-dashboards'
import type {
  CreateAlertRuleRequest,
  UpdateAlertRuleRequest,
  AlertRuleResponse,
} from './metrics.dto'

@Injectable()
export class ObservabilityService {
  readonly alertEngine: AlertEngine
  readonly chaosEngine: ChaosEngine
  readonly sloCalculator: SLOCalculator
  readonly runbookRegistry: RunbookRegistry
  readonly oncallRotation: OncallRotation

  constructor(private readonly metricsService: MetricsService) {
    this.alertEngine = new AlertEngine({ metrics: metricsService })
    this.chaosEngine = new ChaosEngine()
    this.sloCalculator = new SLOCalculator({ targets: DEFAULT_SLO_TARGETS })
    this.runbookRegistry = new RunbookRegistry()
    this.oncallRotation = new OncallRotation({
      engineers: [
        { id: 'eng-1', name: 'Primary Engineer', email: 'primary@example.com', timezone: 'Asia/Shanghai' },
        { id: 'eng-2', name: 'Secondary Engineer', email: 'secondary@example.com', timezone: 'Asia/Shanghai' },
        { id: 'eng-3', name: 'Manager', email: 'manager@example.com', timezone: 'Asia/Shanghai' },
      ],
    })

    installDefaultRules(this.alertEngine)
    installDefaultRunbooks(this.runbookRegistry)
  }

  // ── Metrics ──

  getMetricsRender(): string {
    return this.metricsService.render()
  }

  listMetricNames(): string[] {
    return this.metricsService.listMetrics()
  }

  getHealthz(): { status: 'ok' | 'degraded' | 'down'; metrics: number; uptimeSeconds: number } {
    return {
      status: 'ok',
      metrics: this.metricsService.listMetrics().length,
      uptimeSeconds: process.uptime(),
    }
  }

  // ── Alert Rules CRUD ──

  createAlertRule(req: CreateAlertRuleRequest): AlertRuleResponse {
    const id = `alert-${req.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
    this.alertEngine.addRule({
      id,
      severity: req.severity === 'critical' ? 'P0' : req.severity === 'warning' ? 'P1' : 'P2',
      title: req.name,
      description: req.description,
      metric: req.metricName,
      evaluator: (s) => {
        switch (req.operator) {
          case '>': return s.avg > req.threshold
          case '<': return s.avg < req.threshold
          case '>=': return s.avg >= req.threshold
          case '<=': return s.avg <= req.threshold
          case '==': return s.avg === req.threshold
          default: return false
        }
      },
      windowMs: parseDuration(req.duration),
      minSamples: 1,
    })
    const now = new Date().toISOString()
    return {
      id,
      name: req.name,
      metricName: req.metricName,
      operator: req.operator,
      threshold: req.threshold,
      duration: req.duration,
      severity: req.severity,
      description: req.description,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    }
  }

  listAlertRules(): AlertRuleResponse[] {
    return this.alertEngine.listRules().map((r) => ({
      id: r.id,
      name: r.title,
      metricName: r.metric,
      operator: '>',
      threshold: 0,
      duration: `${r.windowMs}ms`,
      severity: r.severity === 'P0' ? 'critical' : r.severity === 'P1' ? 'warning' : 'info',
      description: r.description,
      enabled: true,
      createdAt: '',
      updatedAt: '',
    }))
  }

  getAlertRule(id: string): AlertRuleResponse | undefined {
    const rule = this.alertEngine.listRules().find((r) => r.id === id)
    if (!rule) return undefined
    return {
      id: rule.id,
      name: rule.title,
      metricName: rule.metric,
      operator: '>',
      threshold: 0,
      duration: `${rule.windowMs}ms`,
      severity: rule.severity === 'P0' ? 'critical' : rule.severity === 'P1' ? 'warning' : 'info',
      description: rule.description,
      enabled: true,
      createdAt: '',
      updatedAt: '',
    }
  }

  updateAlertRule(id: string, req: UpdateAlertRuleRequest): AlertRuleResponse {
    this.alertEngine.removeRule(id)
    return this.createAlertRule({
      name: req.name ?? '',
      metricName: req.metricName ?? 'http_requests_total',
      operator: req.operator ?? '>',
      threshold: req.threshold ?? 0,
      duration: req.duration ?? '60s',
      severity: req.severity ?? 'warning',
      description: req.description,
    })
  }

  deleteAlertRule(id: string): boolean {
    return this.alertEngine.removeRule(id)
  }

  evaluateAlerts(): Alert[] {
    return this.alertEngine.evaluate()
  }

  getActiveAlerts(): Alert[] {
    return this.alertEngine.getActiveAlerts()
  }

  getAlertHistory(limit?: number): Alert[] {
    return this.alertEngine.getHistory(limit ?? 100)
  }

  // ── Chaos Experiments ──

  getChaosPresets(): ChaosPreset[] {
    return CHAOS_PRESETS
  }

  startChaosExperiment(input: {
    type: ChaosType
    scope: ChaosScope
    target?: string
    params?: Record<string, number | string>
    description?: string
    autoRevertMs?: number
  }): ChaosExperiment {
    return this.chaosEngine.start(input)
  }

  listChaosExperiments(): ChaosExperiment[] {
    return this.chaosEngine.listAll()
  }

  getChaosExperiment(id: string): ChaosExperiment | undefined {
    return this.chaosEngine.get(id)
  }

  rollbackChaosExperiment(id: string): ChaosExperiment | undefined {
    return this.chaosEngine.rollback(id)
  }

  rollbackAllChaosExperiments(): number {
    return this.chaosEngine.rollbackAll()
  }

  // ── SLO ──

  getSLOTargets(): SLOTarget[] {
    return this.sloCalculator.listTargets()
  }

  evaluateSLO(targetId: string, points: SLIDataPoint[]): SLIReport {
    return this.sloCalculator.evaluate(targetId, points)
  }

  evaluateAllSLO(pointsBySLO: Record<string, SLIDataPoint[]>): SLIReport[] {
    return this.sloCalculator.evaluateAll(pointsBySLO)
  }

  // ── Dashboards ──

  listDashboards(): GrafanaDashboard[] {
    return ALL_DASHBOARDS
  }

  getDashboard(uid: string): GrafanaDashboard | undefined {
    return ALL_DASHBOARDS.find((d) => d.uid === uid)
  }

  // ── Oncall ──

  getOncallSchedule(): OncallSchedule {
    return this.oncallRotation.currentSchedule()
  }

  listOncallEngineers(): OncallEngineer[] {
    return this.oncallRotation.listEngineers()
  }

  // ── Runbooks ──

  listRunbooks(): Runbook[] {
    return this.runbookRegistry.list()
  }

  getRunbook(alertRuleId: string): Runbook | undefined {
    return this.runbookRegistry.get(alertRuleId)
  }
}

function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)(ms|s|m|h)$/)
  if (!match) return 60_000
  const val = parseInt(match[1], 10)
  switch (match[2]) {
    case 'ms': return val
    case 's': return val * 1000
    case 'm': return val * 60_000
    case 'h': return val * 3_600_000
    default: return 60_000
  }
}
