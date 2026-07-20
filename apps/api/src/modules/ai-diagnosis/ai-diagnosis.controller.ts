import { Controller, Post, Get, Patch, Delete, Param, Query, Body, HttpCode, HttpStatus, NotFoundException, UseGuards } from '@nestjs/common'
import { AiDiagnosisService } from './ai-diagnosis.service'
import type { DiagnosisBatch } from './ai-diagnosis.entity'
import {
  CreateDiagnosisDto,
  CreateDiagnosisBatchDto,
  UpdateDiagnosisDto,
  DiagnosisQueryDto,
  DiagnosisResponse,
  DiagnosisListResponse,
  DiagnosisBatchResponse,
  DiagnosisRiskReportResponse
} from './ai-diagnosis.dto'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('ai-diagnosis')
@UseGuards(TenantGuard)
export class AiDiagnosisController {
  constructor(private readonly diagnosisService: AiDiagnosisService) {}

  // ── 诊断 CRUD ──

  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateDiagnosisDto): DiagnosisResponse {
    const diagnosis = this.diagnosisService.createDiagnosis(dto)
    return { diagnosis }
  }

  @Get('/')
  list(@Query() query: DiagnosisQueryDto): DiagnosisListResponse {
    return this.diagnosisService.listDiagnoses(query)
  }

  @Get('/:diagnosisId')
  get(@Param('diagnosisId') diagnosisId: string): DiagnosisResponse {
    const diagnosis = this.diagnosisService.getDiagnosis(diagnosisId)
    if (!diagnosis) {
      throw new NotFoundException(`Diagnosis ${diagnosisId} not found`)
    }
    return { diagnosis }
  }

  @Patch('/:diagnosisId')
  update(
    @Param('diagnosisId') diagnosisId: string,
    @Body() dto: UpdateDiagnosisDto
  ): DiagnosisResponse {
    const diagnosis = this.diagnosisService.updateDiagnosis(diagnosisId, dto)
    if (!diagnosis) {
      throw new NotFoundException(`Diagnosis ${diagnosisId} not found`)
    }
    return { diagnosis }
  }

  @Delete('/:diagnosisId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('diagnosisId') diagnosisId: string): void {
    const deleted = this.diagnosisService.deleteDiagnosis(diagnosisId)
    if (!deleted) {
      throw new NotFoundException(`Diagnosis ${diagnosisId} not found`)
    }
  }

  // ── 批量诊断 ──

  @Post('/batch')
  @HttpCode(HttpStatus.CREATED)
  createBatch(@Body() dto: CreateDiagnosisBatchDto): DiagnosisBatchResponse {
    const batch = this.diagnosisService.createDiagnosisBatch(dto)
    return { batch }
  }

  @Get('/batch/:batchId')
  getBatch(@Param('batchId') batchId: string): DiagnosisBatchResponse {
    const batch = this.diagnosisService.getDiagnosisBatch(batchId)
    if (!batch) {
      throw new NotFoundException(`Diagnosis batch ${batchId} not found`)
    }
    return { batch }
  }

  @Get('/batch')
  listBatches(@Query('engineId') engineId?: string, @Query('tenantId') tenantId?: string): DiagnosisBatch[] {
    return this.diagnosisService.listDiagnosisBatches({ engineId, tenantId })
  }

  // ── 风险报告 ──

  @Get('/report/risk')
  riskReport(
    @Query('engineId') engineId?: string,
    @Query('tenantId') tenantId?: string
  ): DiagnosisRiskReportResponse {
    return this.diagnosisService.generateRiskReport({ engineId, tenantId })
  }
}
