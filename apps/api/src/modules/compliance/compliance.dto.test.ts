import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * compliance.dto.test.ts - Phase-20 T39-T43
 * 用途: 合规模块 DTO 单元测试
 *
 * 覆盖:
 * - PII 检测/脱敏 DTO: 正例 + 边界
 * - Erasure DTO: 请求/取消/硬删除
 * - 审计日志 DTO: 追加/查询/导出/校验
 * - 健康检查 DTO
 */
import {
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

describe('PIIDetectRequestDto', () => {
  it('should hold detect request with required fields', () => {
    const dto = new PIIDetectRequestDto();
    dto.text = '联系 13800138000 或 test@example.com';
    dto.kinds = ['phone', 'email'];
    dto.minConfidence = 0.85;

    expect(dto.text).toContain('13800138000');
    expect(dto.kinds).toHaveLength(2);
    expect(dto.minConfidence).toBe(0.85);
  });

  it('should default optional fields to undefined', () => {
    const dto = new PIIDetectRequestDto();
    dto.text = 'just text';

    expect(dto.kinds).toBeUndefined();
    expect(dto.minConfidence).toBeUndefined();
  });
});

describe('PIIDetectResponseDto', () => {
  it('should hold detection results', () => {
    const dto = new PIIDetectResponseDto();
    dto.textId = 'scan-001';
    dto.hasPII = true;
    dto.matches = [
      { kind: 'phone', value: '13800138000', start: 0, end: 11, confidence: 0.95 },
    ];
    dto.counts = { phone: 1, email: 0, idCard: 0, creditCard: 0, ip: 0 };
    dto.sensitivityScore = 0.5;

    expect(dto.hasPII).toBe(true);
    expect(dto.matches[0].kind).toBe('phone');
    expect(dto.counts.phone).toBe(1);
  });

  it('should support no matches', () => {
    const dto = new PIIDetectResponseDto();
    dto.textId = 'scan-002';
    dto.hasPII = false;
    dto.matches = [];
    dto.counts = { phone: 0, email: 0, idCard: 0, creditCard: 0, ip: 0 };
    dto.sensitivityScore = 0;

    expect(dto.hasPII).toBe(false);
    expect(dto.matches).toHaveLength(0);
  });
});

describe('PIIMaskRequestDto / PIIMaskResponseDto', () => {
  it('should hold mask request', () => {
    const dto = new PIIMaskRequestDto();
    dto.text = '联系 13800138000';
    dto.maskChar = '#';
    dto.withKind = true;

    expect(dto.text).toContain('13800138000');
    expect(dto.maskChar).toBe('#');
    expect(dto.withKind).toBe(true);
  });

  it('should hold mask response', () => {
    const dto = new PIIMaskResponseDto();
    dto.maskedText = '联系 138####8000';
    dto.matchedCount = 1;
    dto.maskRatio = 0.846;

    expect(dto.maskedText).not.toContain('13800138000');
    expect(dto.matchedCount).toBe(1);
    expect(dto.maskRatio).toBeGreaterThan(0);
  });
});

describe('PIIBatchDetectRequestDto / PIIBatchDetectResponseDto', () => {
  it('should handle batch detect', () => {
    const req = new PIIBatchDetectRequestDto();
    req.texts = ['hello', '联系 13800138000'];
    req.minConfidence = 0.8;

    expect(req.texts).toHaveLength(2);

    const res = new PIIBatchDetectResponseDto();
    res.totalTexts = 2;
    res.textsWithPII = 1;
    res.results = [
      { index: 0, hasPII: false, count: 0, matches: [] },
      { index: 1, hasPII: true, count: 1, matches: [{ kind: 'phone', value: '13800138000', confidence: 0.95 }] },
    ];

    expect(res.textsWithPII).toBe(1);
    expect(res.results[1].hasPII).toBe(true);
  });
});

describe('PIIBatchMaskRequestDto / PIIBatchMaskResponseDto', () => {
  it('should handle batch mask', () => {
    const req = new PIIBatchMaskRequestDto();
    req.texts = ['联系 13800138000', 'test@example.com'];

    const res = new PIIBatchMaskResponseDto();
    res.results = ['联系 138****8000', 't***@example.com'];
    res.totalMatched = 2;

    expect(res.results).toHaveLength(2);
    expect(res.totalMatched).toBe(2);
  });
});

describe('Erasure DTOs', () => {
  it('should hold erasure request', () => {
    const dto = new ErasureRequestDto();
    dto.userId = 'user-001';
    dto.tenantId = 'tenant-1';
    dto.reason = 'GDPR request';
    dto.requestedBy = 'admin';
    dto.gracePeriodMs = 7 * 24 * 60 * 60 * 1000;

    expect(dto.userId).toBe('user-001');
    expect(dto.gracePeriodMs).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('should hold erasure cancel', () => {
    const dto = new ErasureCancelDto();
    dto.reason = 'user cancelled';

    expect(dto.reason).toBe('user cancelled');
  });

  it('should hold erasure response', () => {
    const dto = new ErasureResponseDto();
    dto.requestId = 'erasure-001';
    dto.userId = 'user-001';
    dto.status = 'PENDING_ERASURE';
    dto.requestedAt = new Date().toISOString();

    expect(dto.requestId).toBe('erasure-001');
    expect(dto.status).toBe('PENDING_ERASURE');
  });

  it('should hold hard delete result', () => {
    const dto = new ErasureHardDeleteResponseDto();
    dto.userId = 'user-001';
    dto.deletedFromModules = { member: 5, order: 12 };
    dto.totalDeleted = 17;

    expect(dto.totalDeleted).toBe(17);
    expect(Object.keys(dto.deletedFromModules)).toHaveLength(2);
  });

  it('should hold scheduled deletion result', () => {
    const dto = new ErasureScheduledDeletionsResponseDto();
    dto.processed = 2;
    dto.details = [
      { userId: 'user-001', totalDeleted: 5 },
      { userId: 'user-002', totalDeleted: 3 },
    ];

    expect(dto.processed).toBe(2);
    expect(dto.details[0].userId).toBe('user-001');
  });
});

describe('AuditLog DTOs', () => {
  it('should hold append request', () => {
    const dto = new AuditLogAppendDto();
    dto.tenantId = 't1';
    dto.actorId = 'a1';
    dto.action = 'UPDATE';
    dto.resource = 'order';
    dto.resourceId = 'ord-001';
    dto.before = { status: 'pending' };
    dto.after = { status: 'paid' };

    expect(dto.action).toBe('UPDATE');
    expect(dto.before).toEqual({ status: 'pending' });
    expect(dto.after).toEqual({ status: 'paid' });
  });

  it('should support CUSTOM action with customAction', () => {
    const dto = new AuditLogAppendDto();
    dto.tenantId = 't1';
    dto.actorId = 'a1';
    dto.action = 'CUSTOM';
    dto.customAction = 'export-report';
    dto.resource = 'report';
    dto.resourceId = 'rpt-001';
    dto.meta = { reportType: 'monthly' };

    expect(dto.action).toBe('CUSTOM');
    expect(dto.customAction).toBe('export-report');
    expect(dto.meta?.reportType).toBe('monthly');
  });

  it('should hold query params', () => {
    const dto = new AuditLogQueryDto();
    dto.tenantId = 't1';
    dto.actorId = 'a1';
    dto.action = 'CREATE';
    dto.fromTs = '2026-01-01T00:00:00Z';
    dto.toTs = '2026-06-30T23:59:59Z';
    dto.page = 1;
    dto.pageSize = 20;

    expect(dto.actorId).toBe('a1');
    expect(dto.page).toBe(1);
    expect(dto.pageSize).toBe(20);
  });

  it('should hold export request', () => {
    const dto = new AuditLogExportDto();
    dto.format = 'csv';
    dto.filter = { tenantId: 't1' };
    dto.retentionDays = 365;

    expect(dto.format).toBe('csv');
    expect(dto.retentionDays).toBe(365);
  });

  it('should hold verify response', () => {
    const dto = new AuditVerifyResponseDto();
    dto.valid = true;
    dto.totalChecked = 100;
    dto.checkedAt = '2026-06-26T00:00:00Z';

    expect(dto.valid).toBe(true);
    expect(dto.totalChecked).toBe(100);
  });

  it('should indicate broken chain in verify response', () => {
    const dto = new AuditVerifyResponseDto();
    dto.valid = false;
    dto.brokenAtSeq = 5;
    dto.totalChecked = 4;
    dto.checkedAt = '2026-06-26T00:00:00Z';

    expect(dto.valid).toBe(false);
    expect(dto.brokenAtSeq).toBe(5);
  });
});

describe('ComplianceHealthResponseDto', () => {
  it('should hold health state', () => {
    const dto = new ComplianceHealthResponseDto();
    dto.status = 'healthy';
    dto.services = {
      piiDetector: 'UP',
      piiMasker: 'UP',
      gdprErasure: 'UP',
      auditLog: 'UP',
      auditQuery: 'UP',
    };
    dto.auditLogSize = 42;
    dto.pendingErasures = 3;
    dto.cascadeModules = ['member', 'order'];
    dto.checkedAt = '2026-06-26T00:00:00Z';

    expect(dto.status).toBe('healthy');
    expect(Object.keys(dto.services)).toHaveLength(5);
    expect(dto.cascadeModules).toContain('member');
  });

  it('should hold degraded state', () => {
    const dto = new ComplianceHealthResponseDto();
    dto.status = 'degraded';
    dto.services = { piiDetector: 'UP', piiMasker: 'UP', gdprErasure: 'DOWN', auditLog: 'UP', auditQuery: 'UP' };
    dto.auditLogSize = 0;
    dto.pendingErasures = 0;
    dto.cascadeModules = [];
    dto.checkedAt = '2026-06-26T00:00:00Z';

    expect(dto.status).toBe('degraded');
    expect(dto.services.gdprErasure).toBe('DOWN');
  });
});
