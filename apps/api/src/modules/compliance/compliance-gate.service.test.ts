import { describe, it, expect, beforeEach, vi } from 'vitest';
/**
 * compliance-gate.service.test.ts - WP-COMPLIANCE BS-0233
 * 用途: 合规阀门引擎单元测试
 *
 * 覆盖策略: 直接实例化 service + AuditLogService mock
 *
 * 覆盖:
 *  - 三阀门全通过 (COVERAGE/TSC_PASS/TEST_PASS)
 *  - 代码审查完成率 FAIL
 *  - TSC 通过率 FAIL
 *  - 测试通过率 FAIL
 *  - 阀门未启用 SKIP
 *  - 配置读取/修改
 *  - 配置化阈值调整
 */

import { ComplianceGateService, GateCheckResult } from './compliance-gate.service';
import { AuditLogService } from './audit-log.service';

function createService(): ComplianceGateService {
  const auditLog = new AuditLogService();
  return new ComplianceGateService(auditLog);
}

describe('ComplianceGateService', () => {
  let service: ComplianceGateService;

  beforeEach(() => {
    service = createService();
    // 确保阀门开启
    service.updateConfig({ enabled: true });
  });

  describe('checkGates() — 全量阀门检查', () => {
    it('should PASS all three gates when all rates above threshold', () => {
      const result = service.checkGates({
        coverageRate: 95,
        tscPassRate: 100,
        testPassRate: 100,
      });

      expect(result.passed).toBe(true);
      expect(result.results).toHaveLength(3);
      expect(result.results[0].status).toBe('PASS');   // COVERAGE
      expect(result.results[1].status).toBe('PASS');   // TSC_PASS
      expect(result.results[2].status).toBe('PASS');   // TEST_PASS
      expect(result.checkedAt).toBeDefined();
    });

    it('should FAIL when coverage rate below threshold', () => {
      const result = service.checkGates({
        coverageRate: 50,  // < 90
        tscPassRate: 100,
        testPassRate: 100,
      });

      expect(result.passed).toBe(false);
      expect(result.results[0].status).toBe('FAIL');
      expect(result.results[1].status).toBe('PASS');
      expect(result.results[2].status).toBe('PASS');
    });

    it('should FAIL when TSC pass rate below threshold', () => {
      const result = service.checkGates({
        coverageRate: 95,
        tscPassRate: 85,  // < 100
        testPassRate: 100,
      });

      expect(result.passed).toBe(false);
      expect(result.results[0].status).toBe('PASS');
      expect(result.results[1].status).toBe('FAIL');
      expect(result.results[2].status).toBe('PASS');
    });

    it('should FAIL when test pass rate below threshold', () => {
      const result = service.checkGates({
        coverageRate: 95,
        tscPassRate: 100,
        testPassRate: 90,  // < 100
      });

      expect(result.passed).toBe(false);
      expect(result.results[0].status).toBe('PASS');
      expect(result.results[1].status).toBe('PASS');
      expect(result.results[2].status).toBe('FAIL');
    });

    it('should FAIL when all three gates below threshold', () => {
      const result = service.checkGates({
        coverageRate: 30,
        tscPassRate: 0,
        testPassRate: 0,
      });

      expect(result.passed).toBe(false);
      expect(result.results.every((r) => r.status === 'FAIL')).toBe(true);
    });
  });

  describe('单阀门检查', () => {
    it('checkCoverage — exact boundary PASS', () => {
      const r = service.checkCoverage(90);  // == threshold
      expect(r.status).toBe('PASS');
      expect(r.currentValue).toBe(90);
    });

    it('checkCoverage — below boundary FAIL', () => {
      const r = service.checkCoverage(89);
      expect(r.status).toBe('FAIL');
    });

    it('checkTscPass — exact boundary PASS', () => {
      const r = service.checkTscPass(100);
      expect(r.status).toBe('PASS');
    });

    it('checkTscPass — below boundary FAIL', () => {
      const r = service.checkTscPass(99);
      expect(r.status).toBe('FAIL');
    });

    it('checkTestPass — exact boundary PASS', () => {
      const r = service.checkTestPass(100);
      expect(r.status).toBe('PASS');
    });

    it('checkTestPass — below boundary FAIL', () => {
      const r = service.checkTestPass(99.9);
      expect(r.status).toBe('FAIL');
    });
  });

  describe('阀门未启用', () => {
    it('should SKIP all checks when disabled', () => {
      service.updateConfig({ enabled: false });
      const result = service.checkGates({
        coverageRate: 0,
        tscPassRate: 0,
        testPassRate: 0,
      });

      expect(result.passed).toBe(false); // SKIP counts as not PASS → result.passed=false
      expect(result.results.every((r) => r.status === 'SKIP')).toBe(true);
    });
  });

  describe('配置管理', () => {
    it('should return default config', () => {
      const config = service.getConfig();
      expect(config.enabled).toBe(true);
      expect(config.coverageThreshold).toBe(90);
      expect(config.tscPassThreshold).toBe(100);
      expect(config.testPassThreshold).toBe(100);
    });

    it('should update config partially', () => {
      service.updateConfig({ coverageThreshold: 80 });
      const config = service.getConfig();
      expect(config.coverageThreshold).toBe(80);
      expect(config.tscPassThreshold).toBe(100); // unchanged
    });

    it('should use updated threshold in checks', () => {
      service.updateConfig({ coverageThreshold: 70 });
      const r = service.checkCoverage(70);
      expect(r.status).toBe('PASS');
      expect(r.threshold).toBe(70);
    });
  });

  describe('审计日志记录', () => {
    it('should append audit log on checkGates', () => {
      const auditLog = new AuditLogService();
      const svc = new ComplianceGateService(auditLog);
      const initialSize = auditLog.size();

      svc.checkGates({ coverageRate: 100, tscPassRate: 100, testPassRate: 100 });

      expect(auditLog.size()).toBe(initialSize + 1);
    });
  });
});
