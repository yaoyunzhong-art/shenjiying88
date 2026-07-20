/**
 * lineage.controller.ts — 数据血缘控制器
 *
 * 提供字段血缘追踪、影响分析、敏感数据分类、数据流监控、合规报告 REST API
 */

import { Controller, Post, Get, Body, Param, Query, HttpException, HttpStatus, , UseGuards } from '@nestjs/common'
import { DataLineageTracker, ImpactAnalyzer } from './data-lineage.service'
import {
  SensitiveDataClassifier,
  DataFlowMonitor,
  ComplianceReporter,
} from './sensitive-data.service'
import type {
  LineageGraph,
  ImpactAnalysis,
  FieldClassification,
  DataFlowReport,
  ComplianceReport,
  ExposureRisk,
} from './lineage.entity'
import { TenantGuard } from '../agent/tenant.guard'

// ─── 工具 ────────────────────────────────────────────────────

function ok<T>(data: T, message?: string) {
  return { success: true, data, message }
}

function fail(error: string, message?: string) {
  return { success: false, error, message }
}

// ─── Controller ──────────────────────────────────────────────

@Controller('lineage')
@UseGuards(TenantGuard)
export class LineageController {
  constructor(
    private readonly lineageTracker: DataLineageTracker,
    private readonly impactAnalyzer: ImpactAnalyzer,
    private readonly classifier: SensitiveDataClassifier,
    private readonly flowMonitor: DataFlowMonitor,
    private readonly complianceReporter: ComplianceReporter,
  ) {}

  // ════════════════════════════════════════════════════════════
  // 字段血缘
  // ════════════════════════════════════════════════════════════

  @Post('fields/register')
  registerField(
    @Body() body: { tableName: string; fieldName: string },
  ) {
    this.lineageTracker.trackField(body.tableName, body.fieldName, { tableName: '__system__', fieldName: '__register__' })
    return ok(null, `Field ${body.tableName}.${body.fieldName} registered`)
  }

  @Post('edges')
  registerEdge(
    @Body() body: {
      type: 'DIRECT' | 'TRANSFORM'
      from: { tableName: string; fieldName: string }
      to: { tableName: string; fieldName: string }
      transform?: string
    },
  ) {
    this.lineageTracker.trackTransform(
      body.to,
      [{ tableName: body.from.tableName, fieldName: body.from.fieldName }],
    )
    return ok(null, 'Edge registered')
  }

  @Get('lineage/:tableName/:fieldName')
  getLineage(
    @Param('tableName') tableName: string,
    @Param('fieldName') fieldName: string,
  ) {
    try {
      const result = this.lineageTracker.getUpstream(tableName, fieldName)
      return ok(result)
    } catch (err) {
      throw new HttpException(
        fail('LINEAGE_ERROR', err instanceof Error ? err.message : String(err)),
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Get('downstream/:tableName/:fieldName')
  getDownstream(
    @Param('tableName') tableName: string,
    @Param('fieldName') fieldName: string,
  ) {
    try {
      const result = this.lineageTracker.getDownstream(tableName, fieldName)
      return ok(result)
    } catch (err) {
      throw new HttpException(
        fail('DOWNSTREAM_ERROR', err instanceof Error ? err.message : String(err)),
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('impact')
  analyzeImpact(
    @Body() body: { field: { tableName: string; fieldName: string } },
  ): Record<string, unknown> {
    try {
      const result = this.impactAnalyzer.analyzeImpact(
        body.field.tableName,
        body.field.fieldName,
      )
      return { success: true, data: result }
    } catch (err) {
      throw new HttpException(
        { success: false, error: 'IMPACT_ERROR', message: err instanceof Error ? err.message : String(err) },
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Get('graph')
  getFullGraph() {
    const upstream = this.lineageTracker.getUpstream('', '')
    const downstream = this.lineageTracker.getDownstream('', '')
    return ok({ upstream, downstream, nodeCount: upstream.length + downstream.length })
  }

  // ════════════════════════════════════════════════════════════
  // 敏感数据分类
  // ════════════════════════════════════════════════════════════

  @Post('classify')
  classifyField(
    @Body() body: { tableName: string; fieldName: string; sampleData?: string },
  ) {
    try {
      const result = this.classifier.classifyField(body.tableName, body.fieldName, body.sampleData)
      return ok(result)
    } catch (err) {
      throw new HttpException(
        fail('CLASSIFY_ERROR', err instanceof Error ? err.message : String(err)),
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('classify/batch')
  classifyFieldBatch(
    @Body() body: Array<{ tableName: string; fieldName: string; sampleData?: string }>,
  ) {
    const results = body.map((b) => this.classifier.classifyField(b.tableName, b.fieldName, b.sampleData))
    return ok(results)
  }

  @Get('classify/:tableName/:fieldName')
  getClassification(
    @Param('tableName') tableName: string,
    @Param('fieldName') fieldName: string,
  ) {
    const result = this.classifier.getClassification(tableName, fieldName)
    if (!result) {
      throw new HttpException(
        fail('NOT_FOUND', `Field ${tableName}.${fieldName} not classified`),
        HttpStatus.NOT_FOUND,
      )
    }
    return ok(result)
  }

  @Post('classify/update')
  updateClassification(
    @Body() body: { tableName: string; fieldName: string; level: string },
  ) {
    const validLevels = ['public', 'internal', 'restricted', 'critical']
    if (!validLevels.includes(body.level)) {
      throw new HttpException(
        fail('INVALID_LEVEL', `Invalid level: ${body.level}`),
        HttpStatus.BAD_REQUEST,
      )
    }
    try {
      const result = this.classifier.updateClassification(
        body.tableName,
        body.fieldName,
        body.level as any,
      )
      return ok(result, 'Classification updated')
    } catch (err) {
      throw new HttpException(
        fail('UPDATE_FAILED', err instanceof Error ? err.message : String(err)),
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Get('classify/sensitive/:tableName')
  listSensitiveFields(@Param('tableName') tableName: string) {
    const fields = this.classifier.listSensitiveFields(tableName)
    return ok(fields)
  }

  @Get('classify/all')
  getAllClassifications() {
    const classifications = this.classifier.getAllClassifications()
    return ok(classifications)
  }

  // ════════════════════════════════════════════════════════════
  // 数据流监控
  // ════════════════════════════════════════════════════════════

  @Post('flows/track')
  trackDataFlow(
    @Body() body: {
      fromTable: string
      fromField: string
      toTable: string
      toField: string
      via: string
    },
  ) {
    this.flowMonitor.trackFlow(body.fromTable, body.toTable, body.fromField, body.via as any)
    return ok(null, 'Data flow tracked')
  }

  @Post('flows/transfer')
  registerTransfer(
    @Body() body: { sourceField: string; targetField: string; table: string; operation: string },
  ) {
    this.flowMonitor.trackFlow(body.table, body.table, body.sourceField)
    return ok(null, 'Transfer registered')
  }

  @Get('flows/report')
  getDataFlowReport() {
    const edges = this.flowMonitor.getDataFlow('', '')
    return ok({ edges })
  }

  @Get('flows/risks')
  getExposureRisks() {
    const risk = this.flowMonitor.detectSensitiveFieldExposure('*')
    return ok([risk])
  }

  // ════════════════════════════════════════════════════════════
  // 合规报告
  // ════════════════════════════════════════════════════════════

  @Get('compliance/report')
  generateComplianceReport() {
    const report = this.complianceReporter.generateGDPRReport()
    return ok(report)
  }

  @Get('compliance/score')
  getComplianceScore() {
    const report = this.complianceReporter.generateGDPRReport()
    return ok({ score: report.compliant ? 100 : 50 })
  }

  @Get('compliance/violations')
  getViolations() {
    const report = this.complianceReporter.generateGDPRReport()
    return ok(report.issues)
  }

  @Get('compliance/report/:reportId')
  getReportById(@Param('reportId') reportId: string) {
    // 生成当次报告，reportId 只作日志
    const report = this.complianceReporter.generateGDPRReport()
    return ok({ ...report, requestedReportId: reportId })
  }
}
