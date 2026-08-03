import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * compliance.controller.test.ts - Phase-20 T39-T43
 * 用途: 合规模块控制器单元测试 (vitest)
 *
 * 覆盖策略: 直接实例化 Controller + service mock
 * 端点覆盖:
 * - POST /compliance/pii/detect         正例 + 无 PII + 空文本
 * - POST /compliance/pii/mask           正例 + 空文本
 * - POST /compliance/pii/batch-detect   批量正例
 * - POST /compliance/pii/batch-mask     批量正例
 * - POST /compliance/erasure            正例
 * - POST /compliance/erasure/:userId/cancel 正例 + 不存在的用户
 * - POST /compliance/erasure/:userId/hard-delete 正例
 * - GET  /compliance/erasure/:userId    正例 + 不存在
 * - POST /compliance/audit/append       正例
 * - POST /compliance/audit/query        正例
 * - POST /compliance/audit/export       正例 CSV + JSON
 * - GET  /compliance/audit/verify       正例
 * - GET  /compliance/health             正例
 */
import { ComplianceController } from './compliance.controller';
import { PIIDetectorService } from './pii-detector.service';
import { PIIMaskerService } from './pii-masker.service';
import { GDPRErasureService } from './gdpr-erasure.service';
import { AuditLogService } from './audit-log.service';
import { AuditQueryService } from './audit-query.service';
import { ComplianceGateService } from './compliance-gate.service';

describe('ComplianceController', () => {
  let controller: ComplianceController;
  let piiDetector: PIIDetectorService;
  let piiMasker: PIIMaskerService;
  let gdprErasure: GDPRErasureService;
  let auditLog: AuditLogService;
  let auditQuery: AuditQueryService;
  let gateService: ComplianceGateService;

  beforeEach(() => {
    piiDetector = new PIIDetectorService();
    piiMasker = new PIIMaskerService(piiDetector);
    gdprErasure = new GDPRErasureService();
    auditLog = new AuditLogService();
    auditQuery = new AuditQueryService(auditLog);
    gateService = new ComplianceGateService(auditLog);
    controller = new ComplianceController(piiDetector, piiMasker, gdprErasure, auditLog, auditQuery, gateService);
  });

  // ── PII 检测 ──

  describe('POST /compliance/pii/detect', () => {
    it('should detect phone and email PII', () => {
      const result = controller.detectPII({
        text: '联系 13800138000 或 test@example.com',
      });

      expect(result.hasPII).toBe(true);
      expect(result.matches.length).toBeGreaterThanOrEqual(2);
      expect(result.counts.phone).toBe(1);
      expect(result.counts.email).toBe(1);
      expect(result.sensitivityScore).toBeGreaterThan(0);
      expect(result.textId).toContain('scan-');
    });

    it('should return empty result for text without PII', () => {
      const result = controller.detectPII({ text: 'hello world' });

      expect(result.hasPII).toBe(false);
      expect(result.matches).toHaveLength(0);
      expect(result.sensitivityScore).toBe(0);
    });

    it('should return empty result for empty text', () => {
      const result = controller.detectPII({ text: '' });

      expect(result.hasPII).toBe(false);
      expect(result.matches).toHaveLength(0);
    });

    it('should respect kind filter', () => {
      const result = controller.detectPII({
        text: '联系 13800138000 或 test@example.com',
        kinds: ['phone'],
      });

      expect(result.hasPII).toBe(true);
      const kinds = result.matches.map((m) => m.kind);
      expect(kinds).not.toContain('email');
      expect(kinds).toContain('phone');
    });

    it('should respect minConfidence', () => {
      const result = controller.detectPII({
        text: '联系 13800138000',
        minConfidence: 0.99, // phone confidence is 0.95 < 0.99, so filtered
      });

      expect(result.hasPII).toBe(false);
    });
  });

  // ── PII 脱敏 ──

  describe('POST /compliance/pii/mask', () => {
    it('should mask phone number', () => {
      const result = controller.maskPII({ text: '联系 13800138000' });

      expect(result.maskedText).toContain('138****8000');
      expect(result.matchedCount).toBe(1);
      expect(result.maskRatio).toBeGreaterThan(0);
    });

    it('should mask with custom char', () => {
      const result = controller.maskPII({ text: '联系 13800138000', maskChar: '#' });

      expect(result.maskedText).toContain('138####8000');
    });

    it('should return original text for empty input', () => {
      const result = controller.maskPII({ text: '' });

      expect(result.maskedText).toBe('');
      expect(result.matchedCount).toBe(0);
    });
  });

  // ── 批量 PII 检测 ──

  describe('POST /compliance/pii/batch-detect', () => {
    it('should detect PII across multiple texts', () => {
      const result = controller.batchDetectPII({
        texts: ['hello world', '联系 13800138000'],
      });

      expect(result.totalTexts).toBe(2);
      expect(result.textsWithPII).toBe(1);
      expect(result.results[0].hasPII).toBe(false);
      expect(result.results[1].hasPII).toBe(true);
    });
  });

  // ── 批量 PII 脱敏 ──

  describe('POST /compliance/pii/batch-mask', () => {
    it('should mask PII in batch texts', () => {
      const result = controller.batchMaskPII({
        texts: ['联系 13800138000', 'test@example.com'],
      });

      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toContain('138****8000');
      expect(result.totalMatched).toBeGreaterThanOrEqual(2);
    });
  });

  // ── GDPR Erasure ──

  describe('POST /compliance/erasure', () => {
    it('should create erasure request', () => {
      const result = controller.requestErasure({
        userId: 'user-001',
        tenantId: 'tenant-1',
        reason: 'GDPR request',
        requestedBy: 'admin',
      });

      expect(result.userId).toBe('user-001');
      expect(result.status).toBe('PENDING_ERASURE');
      expect(result.requestedAt).toBeDefined();
      expect(result.graceDeadline).toBeDefined();
    });
  });

  describe('POST /compliance/erasure/:userId/cancel', () => {
    it('should cancel existing erasure', () => {
      // Arrange: 先创建
      controller.requestErasure({ userId: 'user-001', tenantId: 't1' });

      // Act
      const result = controller.cancelErasure('user-001');

      expect(result.userId).toBe('user-001');
      expect(result.status).toBe('ACTIVE');
      expect(result.restoredAt).toBeDefined();
    });

    it('should throw for non-existent user', () => {
      expect(() => controller.cancelErasure('non-existent')).toThrow();
    });
  });

  describe('POST /compliance/erasure/:userId/hard-delete', () => {
    it('should execute hard delete for pending erasure', async () => {
      controller.requestErasure({ userId: 'user-001', tenantId: 't1' });

      const result = await controller.hardDelete('user-001');

      expect(result.userId).toBe('user-001');
      expect(result.totalDeleted).toBe(0); // 无级联钩子
    });

    it('should throw for non-existent user', async () => {
      await expect(controller.hardDelete('ghost')).rejects.toThrow();
    });
  });

  describe('POST /compliance/erasure/process-scheduled', () => {
    it('should process no scheduled deletions when none ready', async () => {
      const result = await controller.processScheduledDeletions();
      expect(result.processed).toBe(0);
      expect(result.details).toHaveLength(0);
    });
  });

  describe('GET /compliance/erasure/:userId', () => {
    it('should return erasure status for existing user', () => {
      controller.requestErasure({ userId: 'user-001', tenantId: 't1' });

      const result = controller.getErasureStatus('user-001') as any;
      expect(result.userId).toBe('user-001');
      expect(result.status).toBe('PENDING_ERASURE');
    });

    it('should return error for non-existent user', () => {
      const result = controller.getErasureStatus('ghost') as any;
      expect(result.error).toContain('not found');
    });
  });

  describe('GET /compliance/erasure/audit/:tenantId', () => {
    it('should return audit trail for tenant', () => {
      controller.requestErasure({ userId: 'user-001', tenantId: 't1' });
      controller.requestErasure({ userId: 'user-002', tenantId: 't1' });

      const result = controller.getErasureAuditTrail('t1');
      expect(result).toHaveLength(2);
    });
  });

  // ── 审计日志 ──

  describe('POST /compliance/audit/append', () => {
    it('should append audit entry', () => {
      const entry = controller.appendAuditLog({
        tenantId: 't1',
        actorId: 'a1',
        action: 'CREATE',
        resource: 'order',
        resourceId: 'ord-001',
      });

      expect(entry.seq).toBe(1);
      expect(entry.hash).toHaveLength(64);
      expect(entry.action).toBe('CREATE');
    });

    it('should generate chain hash linking', () => {
      const e1 = controller.appendAuditLog({
        tenantId: 't1', actorId: 'a1', action: 'CREATE', resource: 'order', resourceId: 'ord-001',
      });
      const e2 = controller.appendAuditLog({
        tenantId: 't1', actorId: 'a1', action: 'UPDATE', resource: 'order', resourceId: 'ord-001',
      });

      expect(e2.prevHash).toBe(e1.hash);
      expect(e2.seq).toBe(2);
    });
  });

  describe('POST /compliance/audit/query', () => {
    it('should query by tenantId', () => {
      controller.appendAuditLog({ tenantId: 't1', actorId: 'a1', action: 'CREATE', resource: 'r', resourceId: '1' });
      controller.appendAuditLog({ tenantId: 't2', actorId: 'a1', action: 'CREATE', resource: 'r', resourceId: '2' });

      const results = controller.queryAuditLog({ tenantId: 't1' });
      expect(results).toHaveLength(1);
    });

    it('should return all for empty filter', () => {
      controller.appendAuditLog({ tenantId: 't1', actorId: 'a1', action: 'CREATE', resource: 'r', resourceId: '1' });
      controller.appendAuditLog({ tenantId: 't2', actorId: 'a1', action: 'CREATE', resource: 'r', resourceId: '2' });

      const results = controller.queryAuditLog({});
      expect(results).toHaveLength(2);
    });
  });

  describe('POST /compliance/audit/export', () => {
    it('should export as CSV', () => {
      controller.appendAuditLog({ tenantId: 't1', actorId: 'a1', action: 'CREATE', resource: 'r', resourceId: '1' });

      const result = controller.exportAuditLog({ format: 'csv', filter: { tenantId: 't1' } });
      expect(result.format).toBe('csv');
      expect(result.rowCount).toBe(1);
      expect(result.content).toContain('seq,ts,tenantId');
    });

    it('should export as JSON', () => {
      controller.appendAuditLog({ tenantId: 't1', actorId: 'a1', action: 'CREATE', resource: 'r', resourceId: '1' });

      const result = controller.exportAuditLog({ format: 'json' });
      expect(result.format).toBe('json');
      expect(result.rowCount).toBe(1);
    });
  });

  describe('GET /compliance/audit/verify', () => {
    it('should return valid for empty log', () => {
      const result = controller.verifyAuditChain();
      expect(result.valid).toBe(true);
      expect(result.totalChecked).toBe(0);
    });

    it('should return valid for appended entries', () => {
      controller.appendAuditLog({ tenantId: 't1', actorId: 'a1', action: 'CREATE', resource: 'r', resourceId: '1' });
      controller.appendAuditLog({ tenantId: 't1', actorId: 'a1', action: 'UPDATE', resource: 'r', resourceId: '1' });

      const result = controller.verifyAuditChain();
      expect(result.valid).toBe(true);
      expect(result.totalChecked).toBe(2);
    });
  });

  // ── 合规阀门 ──

  describe('GET /compliance/gate/check', () => {
    it('should pass all gates with high rates', () => {
      const result = controller.checkGates('95', '100', '100');
      expect(result.passed).toBe(true);
      expect(result.results).toHaveLength(3);
    });

    it('should fail when coverage rate low', () => {
      const result = controller.checkGates('50', '100', '100');
      expect(result.passed).toBe(false);
      expect(result.results[0].status).toBe('FAIL');
    });

    it('should use defaults when query params omitted', () => {
      const result = controller.checkGates();
      expect(result.results[0].currentValue).toBe(0);
      expect(result.results[0].status).toBe('FAIL');
    });
  });

  describe('GET /compliance/gate/config', () => {
    it('should return gate config', () => {
      const config = controller.getGateConfig();
      expect(config.enabled).toBe(true);
      expect(config.coverageThreshold).toBe(90);
    });
  });

  describe('POST /compliance/gate/config', () => {
    it('should update gate config', () => {
      const updated = controller.updateGateConfig({ coverageThreshold: 80 });
      expect(updated.coverageThreshold).toBe(80);
    });
  });

  // ── 健康检查 ──

  describe('GET /compliance/health', () => {
    it('should return health status', () => {
      const result = controller.getHealth();
      expect(result.status).toBe('degraded'); // 无级联模块 + 无日志
      expect(result.services.piiDetector).toBe('UP');
      expect(result.services.auditLog).toBe('UP');
      expect(result.auditLogSize).toBe(0);
      expect(result.pendingErasures).toBe(0);
    });

    it('should reflect audit log size', () => {
      controller.appendAuditLog({ tenantId: 't1', actorId: 'a1', action: 'CREATE', resource: 'r', resourceId: '1' });

      const result = controller.getHealth();
      expect(result.auditLogSize).toBe(1);
    });
  });
});
