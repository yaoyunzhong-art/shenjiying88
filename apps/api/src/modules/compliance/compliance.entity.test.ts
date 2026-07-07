import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * compliance.entity.test.ts - Phase-20 T39-T43
 * 用途: 合规模块实体单元测试
 *
 * 覆盖:
 * - PIIScanResultEntity: 正常构造 + 边界值
 * - MaskedDocumentEntity: 构造 + 字段验证
 * - ErasureRequestEntity: 全生命周期状态
 * - AuditLogEntryEntity: 构造 + hash 字段
 * - AuditExportResultEntity: 完整性校验
 * - ComplianceHealthEntity: 健康检查
 */
import {
  PIIScanResultEntity,
  MaskedDocumentEntity,
  ErasureRequestEntity,
  AuditLogEntryEntity,
  AuditExportResultEntity,
  ComplianceHealthEntity,
} from './compliance.entity';

describe('PIIScanResultEntity', () => {
  it('should construct and serialize correctly', () => {
    const entity = new PIIScanResultEntity();
    entity.textId = 'doc-001';
    entity.scannedAt = '2026-06-26T00:00:00.000Z';
    entity.matches = [
      { kind: 'phone', value: '13800138000', start: 0, end: 11, confidence: 0.95 },
    ];
    entity.grouped = { phone: entity.matches, email: [], idCard: [], creditCard: [], ip: [] };
    entity.hasPII = true;
    entity.counts = { phone: 1, email: 0, idCard: 0, creditCard: 0, ip: 0 };
    entity.sensitivityScore = 0.5;

    expect(entity.textId).toBe('doc-001');
    expect(entity.hasPII).toBe(true);
    expect(entity.counts.phone).toBe(1);
    expect(entity.sensitivityScore).toBe(0.5);
    expect(entity.scannedAt).toBe('2026-06-26T00:00:00.000Z');
  });

  it('should handle empty scan result', () => {
    const entity = new PIIScanResultEntity();
    entity.textId = '';
    entity.scannedAt = new Date().toISOString();
    entity.matches = [];
    entity.grouped = { phone: [], email: [], idCard: [], creditCard: [], ip: [] };
    entity.hasPII = false;
    entity.counts = { phone: 0, email: 0, idCard: 0, creditCard: 0, ip: 0 };
    entity.sensitivityScore = 0;

    expect(entity.hasPII).toBe(false);
    expect(entity.counts.phone).toBe(0);
    expect(entity.sensitivityScore).toBe(0);
    expect(entity.matches).toHaveLength(0);
  });
});

describe('MaskedDocumentEntity', () => {
  it('should construct with valid mask properties', () => {
    const entity = new MaskedDocumentEntity();
    entity.originalText = '联系 13800138000';
    entity.maskedText = '联系 138****8000';
    entity.matchedCount = 1;
    entity.maskRatio = 11 / 13;
    entity.maskedAt = '2026-06-26T00:00:00.000Z';
    entity.maskChar = '*';

    expect(entity.originalText).toBe('联系 13800138000');
    expect(entity.maskedText).toBe('联系 138****8000');
    expect(entity.matchedCount).toBe(1);
    expect(entity.maskRatio).toBeGreaterThan(0);
    expect(entity.maskChar).toBe('*');
  });

  it('should handle no PII case', () => {
    const entity = new MaskedDocumentEntity();
    entity.originalText = 'hello world';
    entity.maskedText = 'hello world';
    entity.matchedCount = 0;
    entity.maskRatio = 0;
    entity.maskedAt = '2026-06-26T00:00:00.000Z';
    entity.maskChar = '*';

    expect(entity.matchedCount).toBe(0);
    expect(entity.maskRatio).toBe(0);
    expect(entity.maskedText).toBe(entity.originalText);
  });
});

describe('ErasureRequestEntity', () => {
  it('should track full erasure lifecycle', () => {
    const entity = new ErasureRequestEntity();
    entity.requestId = 'erasure-001';
    entity.userId = 'user-123';
    entity.tenantId = 'tenant-1';
    entity.status = 'PENDING_ERASURE';
    entity.requestedAt = '2026-06-26T00:00:00.000Z';
    entity.graceDeadline = '2026-07-26T00:00:00.000Z';
    entity.reason = 'GDPR request';
    entity.requestedBy = 'admin-001';

    expect(entity.status).toBe('PENDING_ERASURE');
    expect(entity.userId).toBe('user-123');

    // 硬删除后
    entity.status = 'ERASED';
    entity.erasedAt = '2026-07-27T00:00:00.000Z';

    expect(entity.status).toBe('ERASED');
    expect(entity.erasedAt).toBeDefined();

    // 恢复
    entity.status = 'RESTORED';
    entity.restoredAt = '2026-07-01T00:00:00.000Z';

    expect(entity.status).toBe('RESTORED');
    expect(entity.restoredAt).toBeDefined();
  });
});

describe('AuditLogEntryEntity', () => {
  it('should construct with hash chain fields', () => {
    const entity = new AuditLogEntryEntity();
    entity.seq = 1;
    entity.ts = '2026-06-26T00:00:00.000Z';
    entity.tenantId = 'tenant-1';
    entity.actorId = 'user-001';
    entity.action = 'UPDATE';
    entity.resource = 'order';
    entity.resourceId = 'ord-001';
    entity.prevHash = '0'.repeat(64);
    entity.hash = 'a'.repeat(64);

    expect(entity.seq).toBe(1);
    expect(entity.action).toBe('UPDATE');
    expect(entity.hash).toHaveLength(64);
    expect(entity.prevHash).toHaveLength(64);
  });

  it('should support all audit actions', () => {
    for (const action of ['CREATE', 'UPDATE', 'DELETE', 'READ', 'CUSTOM'] as const) {
      const entity = new AuditLogEntryEntity();
      entity.seq = 1;
      entity.ts = '2026-06-26T00:00:00.000Z';
      entity.tenantId = 't1';
      entity.actorId = 'a1';
      entity.action = action;
      entity.resource = 'res';
      entity.resourceId = 'rid';
      entity.prevHash = '0'.repeat(64);
      entity.hash = 'b'.repeat(64);
      expect(entity.action).toBe(action);
    }
  });

  it('should support optional fields being undefined', () => {
    const entity = new AuditLogEntryEntity();
    entity.seq = 2;
    entity.ts = '2026-06-26T00:00:00.000Z';
    entity.tenantId = 't1';
    entity.actorId = 'a1';
    entity.action = 'READ';
    entity.resource = 'doc';
    entity.resourceId = 'doc-1';
    entity.prevHash = '0'.repeat(64);
    entity.hash = 'c'.repeat(64);

    expect(entity.customAction).toBeUndefined();
    expect(entity.before).toBeUndefined();
    expect(entity.after).toBeUndefined();
    expect(entity.ip).toBeUndefined();
  });
});

describe('AuditExportResultEntity', () => {
  it('should construct with format and integrity', () => {
    const entity = new AuditExportResultEntity();
    entity.format = 'csv';
    entity.content = 'seq,ts,tenantId\n1,2026-01-01,t1';
    entity.rowCount = 1;
    entity.generatedAt = '2026-06-26T00:00:00.000Z';
    entity.retentionDays = 2557;
    entity.retentionExpiresAt = '2033-06-26T00:00:00.000Z';
    entity.integrityCheck = { valid: true, totalChecked: 1 };

    expect(entity.format).toBe('csv');
    expect(entity.retentionDays).toBe(2557);
    expect(entity.integrityCheck.valid).toBe(true);

    // 可序列化
    const json = JSON.stringify(entity);
    const parsed = JSON.parse(json);
    expect(parsed.format).toBe('csv');
    expect(parsed.integrityCheck.valid).toBe(true);
  });

  it('should support JSON format with broken integrity', () => {
    const entity = new AuditExportResultEntity();
    entity.format = 'json';
    entity.content = '[]';
    entity.rowCount = 0;
    entity.generatedAt = '2026-06-26T00:00:00.000Z';
    entity.retentionDays = 365;
    entity.retentionExpiresAt = '2027-06-26T00:00:00.000Z';
    entity.integrityCheck = { valid: false, totalChecked: 3 };

    expect(entity.integrityCheck.valid).toBe(false);
    expect(entity.rowCount).toBe(0);
  });
});

describe('ComplianceHealthEntity', () => {
  it('should construct healthy state', () => {
    const entity = new ComplianceHealthEntity();
    entity.status = 'healthy';
    entity.piiDetector = 'UP';
    entity.piiMasker = 'UP';
    entity.gdprErasure = 'UP';
    entity.auditLog = 'UP';
    entity.auditQuery = 'UP';
    entity.auditLogSize = 42;
    entity.pendingErasures = 3;
    entity.cascadeModules = ['member', 'order', 'invoice'];
    entity.checkedAt = '2026-06-26T00:00:00.000Z';

    expect(entity.status).toBe('healthy');
    expect(entity.piiDetector).toBe('UP');
    expect(entity.auditLogSize).toBe(42);
  });

  it('should support degraded state', () => {
    const entity = new ComplianceHealthEntity();
    entity.status = 'degraded';
    entity.piiDetector = 'UP';
    entity.piiMasker = 'UP';
    entity.gdprErasure = 'DOWN';
    entity.auditLog = 'UP';
    entity.auditQuery = 'UP';
    entity.auditLogSize = 0;
    entity.pendingErasures = 0;
    entity.cascadeModules = [];
    entity.checkedAt = '2026-06-26T00:00:00.000Z';

    expect(entity.status).toBe('degraded');
    expect(entity.gdprErasure).toBe('DOWN');
    expect(entity.cascadeModules).toHaveLength(0);
  });
});
