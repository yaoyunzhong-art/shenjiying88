/**
 * audit.controller.ts - 审计日志 Controller
 * 用途: 审计日志的 API 路由定义，支持审计追踪、异常检测、合规报告
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  Logger,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { AuditService } from './audit.service'
import { TenantGuard } from '../agent/tenant.guard'
import {
  CreateAuditLogDto,
  AuditLogQueryDto,
  AuditLogResponseDto,
  AuditLogPaginatedResponseDto,
  SettlementAuditLogDto,
  AuditReportExportDto,
  AnomalyDetectionResultDto,
  ComplianceReportDto,
  RiskScoreResponseDto,
} from './audit.dto'

@ApiTags('审计日志')
@ApiBearerAuth()
@Controller('api/audit')
@UseGuards(TenantGuard)
export class AuditController {
  private readonly logger = new Logger(AuditController.name)

  constructor(private readonly auditService: AuditService) {}

  /**
   * 创建审计日志
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建审计日志', description: '记录一条审计事件' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '创建成功' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '参数错误' })
  async create(@Body() createDto: CreateAuditLogDto): Promise<{ id: string }> {
    this.logger.log(`[AUDIT] Create audit log: eventType=${createDto.eventType} actorId=${createDto.actorId} actorType=${createDto.actorType}`)
    const id = await this.auditService.log({
      ...createDto,
      riskLevel: createDto.riskLevel ?? 'low',
      timestamp: new Date(),
    } as any)
    this.logger.log(`[AUDIT] Audit log created: id=${id}`)
    return { id }
  }

  /**
   * 批量创建审计日志
   */
  @Post('batch')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '批量创建审计日志', description: '批量记录审计事件' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '创建成功' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '参数错误' })
  async createBatch(@Body() createDtos: CreateAuditLogDto[]): Promise<{ ids: string[] }> {
    this.logger.log(`[AUDIT] Batch create ${createDtos.length} audit logs`)
    const ids = await this.auditService.logBatch(
      createDtos.map((dto) => ({
        ...dto,
        riskLevel: dto.riskLevel ?? 'low',
        timestamp: new Date(),
      })) as any,
    )
    this.logger.log(`[AUDIT] Batch created: ${ids.length} audit logs`)
    return { ids }
  }

  /**
   * 查询审计日志
   */
  @Get()
  @ApiOperation({ summary: '查询审计日志', description: '分页查询审计日志，支持多维过滤' })
  @ApiResponse({ status: HttpStatus.OK, description: '查询成功', type: AuditLogPaginatedResponseDto })
  async findAll(@Query() queryDto: AuditLogQueryDto): Promise<AuditLogPaginatedResponseDto> {
    this.logger.log(`[AUDIT] Query audit logs: actorId=${queryDto.actorId ?? '-'} eventType=${queryDto.eventType ?? '-'} limit=${queryDto.limit ?? '-'}`)
    const filter: any = {
      ...queryDto,
      from: queryDto.from ? new Date(queryDto.from) : undefined,
      to: queryDto.to ? new Date(queryDto.to) : undefined,
    }
    const result = await this.auditService.query(filter)
    this.logger.log(`[AUDIT] Query result: ${result.total} total, ${result.items.length} returned`)
    return result
  }

  /**
   * 获取审计日志详情
   */
  @Get(':id')
  @ApiOperation({ summary: '获取审计日志详情', description: '根据 ID 获取审计日志详细信息' })
  @ApiResponse({ status: HttpStatus.OK, description: '获取成功', type: AuditLogResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '日志不存在' })
  async findOne(@Param('id') id: string): Promise<AuditLogResponseDto | null> {
    this.logger.log(`[AUDIT] View audit log detail: id=${id}`)
    const result = await this.auditService.getById(id)
    if (!result) {
      this.logger.warn(`[AUDIT] Audit log not found: id=${id}`)
    }
    return result
  }

  /**
   * 获取用户活动日志
   */
  @Get('user/:userId')
  @ApiOperation({ summary: '获取用户活动日志', description: '获取指定用户在时间范围内的所有操作' })
  @ApiResponse({ status: HttpStatus.OK, description: '获取成功', type: [AuditLogResponseDto] })
  @ApiQuery({ name: 'from', required: true, description: '开始时间' })
  @ApiQuery({ name: 'to', required: true, description: '结束时间' })
  async getUserActivity(
    @Param('userId') userId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ): Promise<AuditLogResponseDto[]> {
    this.logger.log(`[AUDIT] Get user activity: userId=${userId} from=${from} to=${to}`)
    const results = await this.auditService.getUserActivityLog(userId, new Date(from), new Date(to))
    this.logger.log(`[AUDIT] User activity result: ${results.length} records`)
    return results
  }

  /**
   * 异常检测
   */
  @Get('anomalies/detect')
  @ApiOperation({ summary: '异常行为检测', description: '检测审计日志中的异常行为模式' })
  @ApiResponse({ status: HttpStatus.OK, description: '检测成功', type: [AnomalyDetectionResultDto] })
  @ApiQuery({ name: 'windowMinutes', required: false, description: '检测时间窗口（分钟），默认 5' })
  async detectAnomalies(
    @Query('windowMinutes') windowMinutes?: number,
  ): Promise<AnomalyDetectionResultDto[]> {
    const w = windowMinutes ?? 5
    this.logger.log(`[AUDIT] Trigger anomaly detection: window=${w}min`)
    const results = await this.auditService.detectAnomalies(w)
    this.logger.log(`[AUDIT] Anomaly detection complete: ${results.length} anomalies found`)
    return results
  }

  /**
   * 计算风险评分
   */
  @Get('risk-score/:actorId')
  @ApiOperation({ summary: '计算风险评分', description: '根据操作者的历史行为计算风险评分' })
  @ApiResponse({ status: HttpStatus.OK, description: '计算成功', type: RiskScoreResponseDto })
  async computeRiskScore(@Param('actorId') actorId: string): Promise<RiskScoreResponseDto> {
    this.logger.log(`[AUDIT] Compute risk score: actorId=${actorId}`)
    const score = await this.auditService.computeRiskScore(actorId)
    const riskLevel = score >= 70 ? 'critical' : score >= 40 ? 'high' : score >= 20 ? 'medium' : 'low'
    this.logger.log(`[AUDIT] Risk score result: actorId=${actorId} score=${score} level=${riskLevel}`)
    return { actorId, score, riskLevel }
  }

  /**
   * 记录分账事件
   */
  @Post('settlement')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '记录分账事件', description: '记录分账相关的审计事件' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '记录成功' })
  async logSettlement(@Body() dto: SettlementAuditLogDto): Promise<{ id: string }> {
    this.logger.log(`[AUDIT] Log settlement event: settlementId=${dto.settlementId} event=${dto.eventType} amount=${dto.amount}`)
    const id = await this.auditService.logSettlementEvent(
      dto.settlementId,
      dto.amount,
      dto.eventType,
      dto.metadata,
    )
    this.logger.log(`[AUDIT] Settlement event logged: id=${id}`)
    return { id }
  }

  /**
   * 获取分账审计追踪
   */
  @Get('settlement/:settlementId')
  @ApiOperation({ summary: '获取分账审计追踪', description: '获取分账关联的所有审计记录' })
  @ApiResponse({ status: HttpStatus.OK, description: '查询成功', type: [AuditLogResponseDto] })
  async getSettlementAuditTrail(
    @Param('settlementId') settlementId: string,
  ): Promise<AuditLogResponseDto[]> {
    this.logger.log(`[AUDIT] Get settlement trail: settlementId=${settlementId}`)
    const results = await this.auditService.getSettlementAuditTrail(settlementId)
    this.logger.log(`[AUDIT] Settlement trail result: ${results.length} records`)
    return results
  }

  /**
   * 导出审计报告
   */
  @Post('export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '导出审计报告', description: '导出指定时间范围内的审计报告' })
  @ApiResponse({ status: HttpStatus.OK, description: '导出成功' })
  async exportReport(@Body() dto: AuditReportExportDto): Promise<{ content: string }> {
    this.logger.log(`[AUDIT] Export report: from=${dto.from} to=${dto.to} format=${dto.format ?? 'json'}`)
    const content = await this.auditService.exportReport(
      new Date(dto.from),
      new Date(dto.to),
      dto.format ?? 'json',
    )
    this.logger.log(`[AUDIT] Export complete: ${content.length} chars`)
    return { content }
  }

  /**
   * 生成合规报告
   */
  @Get('compliance-report/:tenantId')
  @ApiOperation({ summary: '生成合规报告', description: '根据 GDPR Article 30 生成合规报告' })
  @ApiResponse({ status: HttpStatus.OK, description: '生成成功', type: ComplianceReportDto })
  async generateComplianceReport(
    @Param('tenantId') tenantId: string,
  ): Promise<ComplianceReportDto> {
    this.logger.log(`[AUDIT] Generate compliance report: tenantId=${tenantId}`)
    const report = await this.auditService.generateComplianceReport(tenantId)
    this.logger.log(`[AUDIT] Compliance report generated: tenantId=${tenantId}`)
    return report
  }
}
