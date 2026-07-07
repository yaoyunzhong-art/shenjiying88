/**
 * compliance.module.ts - Phase-20 T39-T43
 * 用途: 合规模块入口 (PII 检测 + 脱敏 + GDPR 删除 + 审计日志)
 */
import { Module, Global } from '@nestjs/common';
import { PIIDetectorService } from './pii-detector.service';
import { PIIMaskerService } from './pii-masker.service';
import { GDPRErasureService } from './gdpr-erasure.service';
import { AuditLogService } from './audit-log.service';
import { AuditQueryService } from './audit-query.service';
import { ComplianceController } from './compliance.controller';

@Global()
@Module({
  controllers: [ComplianceController],
  providers: [
    PIIDetectorService,
    PIIMaskerService,
    GDPRErasureService,
    AuditLogService,
    AuditQueryService,
  ],
  exports: [
    PIIDetectorService,
    PIIMaskerService,
    GDPRErasureService,
    AuditLogService,
    AuditQueryService,
  ],
})
export class ComplianceModule {}