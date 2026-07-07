/**
 * compliance.controller.ts - Phase-20 T39-T43
 * 用途: 合规模块 REST 控制器
 *
 * 端点:
 * - POST /compliance/pii/detect       PII 检测
 * - POST /compliance/pii/mask          PII 脱敏
 * - POST /compliance/pii/batch-detect  批量 PII 检测
 * - POST /compliance/pii/batch-mask    批量 PII 脱敏
 * - POST /compliance/erasure           请求删除
 * - POST /compliance/erasure/:userId/cancel  撤销删除
 * - POST /compliance/erasure/:userId/hard-delete  执行硬删除
 * - POST /compliance/erasure/process-scheduled  定时处理到期删除
 * - GET  /compliance/erasure/:userId   查询删除状态
 * - GET  /compliance/erasure/audit/:tenantId  审计追踪
 * - POST /compliance/audit/append      追加审计日志
 * - POST /compliance/audit/query       查询审计日志
 * - POST /compliance/audit/export      导出审计日志
 * - GET  /compliance/audit/verify      校验审计链完整性
 * - GET  /compliance/health            合规模块健康检查
 */
import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { PIIDetectorService } from './pii-detector.service';
import { PIIMaskerService } from './pii-masker.service';
import { GDPRErasureService } from './gdpr-erasure.service';
import { AuditLogService } from './audit-log.service';
import { AuditQueryService } from './audit-query.service';
import type {
  AuditEntry,
  AuditAction,
  AuditAppendInput,
} from './audit-log.service';
import type { PIIKind, PIIDetectOptions } from './pii-detector.service';
import type { ErasureRequest } from './gdpr-erasure.service';
import type {
  PIIDetectRequestDto,
  PIIDetectResponseDto,
  PIIMaskRequestDto,
  PIIMaskResponseDto,
  PIIBatchDetectRequestDto,
  PIIBatchDetectResponseDto,
  PIIBatchMaskRequestDto,
  PIIBatchMaskResponseDto,
  ErasureRequestDto,
  ErasureCancelDto,
  ErasureResponseDto,
  ErasureHardDeleteResponseDto,
  ErasureScheduledDeletionsResponseDto,
  AuditLogAppendDto,
  AuditLogQueryDto,
  AuditLogExportDto,
  AuditVerifyResponseDto,
  ComplianceHealthResponseDto,
} from './compliance.dto';

@Controller('compliance')
export class ComplianceController {
  constructor(
    private readonly piiDetector: PIIDetectorService,
    private readonly piiMasker: PIIMaskerService,
    private readonly gdprErasure: GDPRErasureService,
    private readonly auditLog: AuditLogService,
    private readonly auditQuery: AuditQueryService,
  ) {}

  // ── PII 检测 ──────────────────────────────────────────────

  @Post('pii/detect')
  detectPII(@Body() dto: PIIDetectRequestDto): PIIDetectResponseDto {
    const options: PIIDetectOptions = {};
    if (dto.kinds) options.kinds = dto.kinds;
    if (dto.minConfidence !== undefined) options.minConfidence = dto.minConfidence;

    const matches = this.piiDetector.detect(dto.text, options);
    const counts = this.piiDetector.count(dto.text, options);
    const sensitivityScore = this.computeSensitivity(matches);
    const textId = `scan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    return {
      textId,
      hasPII: matches.length > 0,
      matches,
      counts,
      sensitivityScore,
    };
  }

  @Post('pii/batch-detect')
  batchDetectPII(@Body() dto: PIIBatchDetectRequestDto): PIIBatchDetectResponseDto {
    const options: PIIDetectOptions = {};
    if (dto.minConfidence !== undefined) options.minConfidence = dto.minConfidence;

    const results = dto.texts.map((text, index) => {
      const matches = this.piiDetector.detect(text, options);
      return { index, hasPII: matches.length > 0, count: matches.length, matches };
    });

    return {
      totalTexts: dto.texts.length,
      textsWithPII: results.filter((r) => r.hasPII).length,
      results,
    };
  }

  // ── PII 脱敏 ──────────────────────────────────────────────

  @Post('pii/mask')
  maskPII(@Body() dto: PIIMaskRequestDto): PIIMaskResponseDto {
    const maskedText = this.piiMasker.maskText(dto.text, {
      maskChar: dto.maskChar,
      withKind: dto.withKind,
    });
    const matches = this.piiDetector.detect(dto.text);
    return {
      maskedText,
      matchedCount: matches.length,
      maskRatio: this.piiMasker.maskRatio(dto.text),
    };
  }

  @Post('pii/batch-mask')
  batchMaskPII(@Body() dto: PIIBatchMaskRequestDto): PIIBatchMaskResponseDto {
    const results = this.piiMasker.maskBatch(dto.texts, {
      maskChar: dto.maskChar,
      withKind: dto.withKind,
    });
    const totalMatched = dto.texts.reduce((sum, t) => sum + this.piiDetector.detect(t).length, 0);
    return { results, totalMatched };
  }

  // ── GDPR Erasure ──────────────────────────────────────────

  @Post('erasure')
  requestErasure(@Body() dto: ErasureRequestDto): ErasureResponseDto {
    const req: ErasureRequest = {
      userId: dto.userId,
      tenantId: dto.tenantId,
      reason: dto.reason,
      requestedBy: dto.requestedBy,
      gracePeriodMs: dto.gracePeriodMs,
    };
    const record = this.gdprErasure.requestErasure(req);
    return this.mapErasureRecord(record);
  }

  @Post('erasure/:userId/cancel')
  cancelErasure(@Param('userId') userId: string, @Body() dto?: ErasureCancelDto): ErasureResponseDto {
    const record = this.gdprErasure.cancelErasure(userId, dto?.reason);
    return this.mapErasureRecord(record);
  }

  @Post('erasure/:userId/hard-delete')
  async hardDelete(@Param('userId') userId: string): Promise<ErasureHardDeleteResponseDto> {
    return this.gdprErasure.hardDelete(userId);
  }

  @Post('erasure/process-scheduled')
  async processScheduledDeletions(): Promise<ErasureScheduledDeletionsResponseDto> {
    const results = await this.gdprErasure.processScheduledDeletions();
    return { processed: results.length, details: results };
  }

  @Get('erasure/:userId')
  getErasureStatus(@Param('userId') userId: string): ErasureResponseDto | { error: string } {
    const record = this.gdprErasure.getRecord(userId);
    if (!record) return { error: `Erasure record not found: ${userId}` };
    return this.mapErasureRecord(record);
  }

  @Get('erasure/audit/:tenantId')
  getErasureAuditTrail(@Param('tenantId') tenantId: string): ErasureResponseDto[] {
    const records = this.gdprErasure.listAuditTrail(tenantId);
    return records.map((r) => this.mapErasureRecord(r));
  }

  // ── 审计日志 ──────────────────────────────────────────────

  @Post('audit/append')
  appendAuditLog(@Body() dto: AuditLogAppendDto): AuditEntry {
    const input: AuditAppendInput = {
      tenantId: dto.tenantId,
      actorId: dto.actorId,
      action: dto.action,
      customAction: dto.customAction,
      resource: dto.resource,
      resourceId: dto.resourceId,
      before: dto.before,
      after: dto.after,
      ip: dto.ip,
      userAgent: dto.userAgent,
      meta: dto.meta,
    };
    return this.auditLog.append(input);
  }

  @Post('audit/query')
  queryAuditLog(@Body() dto: AuditLogQueryDto): AuditEntry[] {
    return this.auditLog.query({
      tenantId: dto.tenantId,
      actorId: dto.actorId,
      action: dto.action,
      resource: dto.resource,
      resourceId: dto.resourceId,
      fromTs: dto.fromTs,
      toTs: dto.toTs,
      limit: dto.page && dto.pageSize ? dto.page * dto.pageSize : undefined,
    });
  }

  @Post('audit/export')
  exportAuditLog(@Body() dto: AuditLogExportDto) {
    return this.auditQuery.export({
      format: dto.format,
      filter: dto.filter,
      retentionDays: dto.retentionDays,
      page: dto.page,
      pageSize: dto.pageSize,
    });
  }

  @Get('audit/verify')
  verifyAuditChain(): AuditVerifyResponseDto {
    const result = this.auditLog.verify();
    return {
      valid: result.valid,
      brokenAtSeq: result.brokenAtSeq,
      totalChecked: result.totalChecked,
      checkedAt: new Date().toISOString(),
    };
  }

  // ── 健康检查 ──────────────────────────────────────────────

  @Get('health')
  getHealth(): ComplianceHealthResponseDto {
    const services: Record<string, string> = {
      piiDetector: 'UP',
      piiMasker: 'UP',
      gdprErasure: 'UP',
      auditLog: 'UP',
      auditQuery: 'UP',
    };

    const auditLogSize = this.auditLog.size();
    const pendingRecords = this.gdprErasure.listReadyForHardDelete();
    const cascadeModules = this.gdprErasure.listRegisteredModules();

    let status = 'healthy';
    if (cascadeModules.length === 0 && auditLogSize === 0) {
      status = 'degraded'; // 无级联模块注册 + 无审计日志,表示未充分配置
    }

    return {
      status,
      services,
      auditLogSize,
      pendingErasures: pendingRecords.length,
      cascadeModules,
      checkedAt: new Date().toISOString(),
    };
  }

  // ── Helpers ──

  private computeSensitivity(matches: Array<{ kind: PIIKind; confidence: number }>): number {
    if (matches.length === 0) return 0;
    const weights: Record<PIIKind, number> = {
      phone: 0.6,
      email: 0.5,
      idCard: 0.9,
      creditCard: 0.85,
      ip: 0.4,
    };
    // 加权和 / 2 并裁切至 [0, 1]
    const score = matches.reduce((sum, m) => sum + (weights[m.kind] ?? 0.5) * m.confidence, 0) / 2;
    return Math.min(1, Math.round(score * 100) / 100);
  }

  private mapErasureRecord(record: {
    userId: string;
    tenantId: string;
    status: string;
    deletionRequestedAt?: string;
    erasureDeadlineAt?: string;
    erasedAt?: string;
    restoredAt?: string;
    reason?: string;
    requestedBy?: string;
  }): ErasureResponseDto {
    return {
      requestId: `${record.tenantId}:${record.userId}`,
      userId: record.userId,
      status: record.status,
      requestedAt: record.deletionRequestedAt ?? new Date().toISOString(),
      graceDeadline: record.erasureDeadlineAt,
      erasedAt: record.erasedAt,
      restoredAt: record.restoredAt,
      reason: record.reason,
    };
  }
}
