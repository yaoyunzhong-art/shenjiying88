import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * 🐜 自动: [compliance] [A] module 测试
 * ComplianceModule 的模块注册和导出验证
 */
import { ComplianceModule } from './compliance.module';
import { ComplianceController } from './compliance.controller';
import { PIIDetectorService } from './pii-detector.service';
import { PIIMaskerService } from './pii-masker.service';
import { GDPRErasureService } from './gdpr-erasure.service';
import { AuditLogService } from './audit-log.service';
import { AuditQueryService } from './audit-query.service';

describe('ComplianceModule', () => {
  it('should be defined', () => {
    expect(ComplianceModule).toBeDefined();
  });

  it('should be instantiable', () => {
    const instance = new ComplianceModule();
    expect(instance).toBeInstanceOf(ComplianceModule);
  });

  it('module metadata has controllers', () => {
    const controllers = Reflect.getMetadata('controllers', ComplianceModule) as unknown[];
    if (controllers) {
      expect(controllers).toContain(ComplianceController);
    }
  });

  it('module metadata provides all required services', () => {
    const providers = Reflect.getMetadata('providers', ComplianceModule) as unknown[];
    if (providers) {
      const providerNames = providers.map((p: unknown) =>
        typeof p === 'function' ? p.name :
        typeof p === 'object' && p !== null ? ((p as { provide?: unknown }).provide as string || '') : ''
      );
      expect(providerNames).toContain('PIIDetectorService');
      expect(providerNames).toContain('PIIMaskerService');
      expect(providerNames).toContain('GDPRErasureService');
      expect(providerNames).toContain('AuditLogService');
      expect(providerNames).toContain('AuditQueryService');
    }
  });

  it('module exports all services', () => {
    const exports = Reflect.getMetadata('exports', ComplianceModule) as unknown[];
    if (exports) {
      const exportNames = exports.map((e: unknown) =>
        typeof e === 'function' ? e.name :
        typeof e === 'object' && e !== null ? ((e as { export?: unknown }).export as string || '') : ''
      );
      expect(exportNames).toContain('PIIDetectorService');
      expect(exportNames).toContain('PIIMaskerService');
      expect(exportNames).toContain('GDPRErasureService');
      expect(exportNames).toContain('AuditLogService');
      expect(exportNames).toContain('AuditQueryService');
    }
  });

  it('controller has all expected endpoints', () => {
    const proto = ComplianceController.prototype;
    // PII
    expect(typeof proto.detectPII).toBe('function');
    expect(typeof proto.maskPII).toBe('function');
    expect(typeof proto.batchDetectPII).toBe('function');
    expect(typeof proto.batchMaskPII).toBe('function');
    // Erasure
    expect(typeof proto.requestErasure).toBe('function');
    expect(typeof proto.cancelErasure).toBe('function');
    expect(typeof proto.hardDelete).toBe('function');
    expect(typeof proto.processScheduledDeletions).toBe('function');
    expect(typeof proto.getErasureStatus).toBe('function');
    expect(typeof proto.getErasureAuditTrail).toBe('function');
    // Audit
    expect(typeof proto.appendAuditLog).toBe('function');
    expect(typeof proto.queryAuditLog).toBe('function');
    expect(typeof proto.exportAuditLog).toBe('function');
    expect(typeof proto.verifyAuditChain).toBe('function');
    // Health
    expect(typeof proto.getHealth).toBe('function');
  });

  it('all services have expected public methods', () => {
    // PIIDetectorService
    const piiProto = PIIDetectorService.prototype;
    expect(typeof piiProto.detect).toBe('function');
    expect(typeof piiProto.count).toBe('function');

    // PIIMaskerService
    const maskerProto = PIIMaskerService.prototype;
    expect(typeof maskerProto.maskText).toBe('function');
    expect(typeof maskerProto.maskBatch).toBe('function');
    expect(typeof maskerProto.maskRatio).toBe('function');

    // GDPRErasureService
    const gdprProto = GDPRErasureService.prototype;
    expect(typeof gdprProto.requestErasure).toBe('function');
    expect(typeof gdprProto.cancelErasure).toBe('function');
    expect(typeof gdprProto.hardDelete).toBe('function');
    expect(typeof gdprProto.getRecord).toBe('function');
    expect(typeof gdprProto.listAuditTrail).toBe('function');
    expect(typeof gdprProto.listReadyForHardDelete).toBe('function');
    expect(typeof gdprProto.listRegisteredModules).toBe('function');
    expect(typeof gdprProto.processScheduledDeletions).toBe('function');

    // AuditLogService
    const auditProto = AuditLogService.prototype;
    expect(typeof auditProto.append).toBe('function');
    expect(typeof auditProto.query).toBe('function');
    expect(typeof auditProto.verify).toBe('function');
    expect(typeof auditProto.size).toBe('function');

    // AuditQueryService
    const queryProto = AuditQueryService.prototype;
    expect(typeof queryProto.export).toBe('function');
  });

  it('controller and services can be instantiated together', async () => {
    const piiDetector = new PIIDetectorService();
    const piiMasker = new PIIMaskerService(piiDetector);
    const gdprErasure = new GDPRErasureService();
    const auditLog = new AuditLogService();
    const auditQuery = new AuditQueryService(auditLog);

    const controller = new ComplianceController(
      piiDetector, piiMasker, gdprErasure, auditLog, auditQuery
    );

    expect(controller).toBeDefined();
    // Smoke test — health check
    const health = controller.getHealth();
    expect(health.status).toBeDefined();
  });

  it('module can be imported with NestJS Test', async () => {
    const { Test } = await import('@nestjs/testing');
    const module = await Test.createTestingModule({
      imports: [ComplianceModule],
    }).compile();

    const app = module.createNestApplication();
    await app.init();

    const piiService = app.get(PIIDetectorService);
    expect(piiService).toBeInstanceOf(PIIDetectorService);

    await app.close();
  });
});
