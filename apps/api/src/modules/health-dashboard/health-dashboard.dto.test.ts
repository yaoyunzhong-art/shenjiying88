import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { EvaluateHealthDto, TenantHealthInputDto, AlertConfigDto, GrafanaQueryDto } from './health-dashboard.dto';

describe('HealthDashboard DTOs', () => {
  describe('TenantHealthInputDto', () => {
    it('AC-1: 应有所有必要字段', () => {
      const dto = new TenantHealthInputDto();
      dto.tenantId = 'tenant-A';
      dto.p95Ms = 100;
      dto.errorRate = 0.001;
      dto.quotaUsagePercent = 0.5;
      dto.championActivityScore = 80;
      dto.anomalyCount30d = 0;

      expect(dto.tenantId).toBe('tenant-A');
      expect(dto.p95Ms).toBe(100);
      expect(dto.errorRate).toBe(0.001);
      expect(dto.quotaUsagePercent).toBe(0.5);
      expect(dto.championActivityScore).toBe(80);
      expect(dto.anomalyCount30d).toBe(0);
    });
  });

  describe('EvaluateHealthDto', () => {
    it('AC-2: 应包含租户列表', () => {
      const dto = new EvaluateHealthDto();
      dto.tenants = [];
      expect(dto.tenants).toEqual([]);
    });
  });

  describe('AlertConfigDto', () => {
    it('AC-3: 应包含告警阈值和通知渠道', () => {
      const dto = new AlertConfigDto();
      dto.warningThreshold = 80;
      dto.criticalThreshold = 50;
      dto.notifyChannels = ['email', 'feishu'];

      expect(dto.warningThreshold).toBe(80);
      expect(dto.criticalThreshold).toBe(50);
      expect(dto.notifyChannels).toContain('feishu');
    });
  });

  describe('GrafanaQueryDto', () => {
    it('AC-4: tenantIds 可选', () => {
      const dto = new GrafanaQueryDto();
      expect(dto.tenantIds).toBeUndefined();
    });
  });
});
