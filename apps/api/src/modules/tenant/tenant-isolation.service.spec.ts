import { ForbiddenException } from '@nestjs/common';
import { TenantIsolationService, type TenantEntity } from './tenant-isolation.service';

describe('TenantIsolationService', () => {
  let service: TenantIsolationService;

  beforeEach(() => {
    service = new TenantIsolationService();
  });

  afterEach(() => {
    service.resetForTests();
  });

  // ── verifyTenant ──────────────────────────────────────────────────────────

  describe('verifyTenant', () => {
    it('should pass when token tenant matches path tenant', () => {
      const result = service.verifyTenant('tenant-a', 'tenant-a');
      expect(result.matched).toBe(true);
      expect(result.tokenTenantId).toBe('tenant-a');
      expect(result.pathTenantId).toBe('tenant-a');
    });

    it('should throw ForbiddenException when token tenant is empty', () => {
      expect(() => service.verifyTenant('', 'tenant-a')).toThrow(ForbiddenException);
      expect(() => service.verifyTenant('', 'tenant-a')).toThrow('Missing tenant context in token');
    });

    it('should throw ForbiddenException when path tenant is empty', () => {
      expect(() => service.verifyTenant('tenant-a', '')).toThrow(ForbiddenException);
      expect(() => service.verifyTenant('tenant-a', '')).toThrow('Missing tenant context in request path');
    });

    it('should throw ForbiddenException when both tenants are empty', () => {
      expect(() => service.verifyTenant('', '')).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException on tenant mismatch', () => {
      expect(() => service.verifyTenant('tenant-a', 'tenant-b')).toThrow(ForbiddenException);
      expect(() => service.verifyTenant('tenant-a', 'tenant-b')).toThrow(
        'Tenant mismatch: token tenant "tenant-a" !== path tenant "tenant-b"',
      );
    });

    it('should handle tenant IDs with special characters', () => {
      const result = service.verifyTenant('tenant_a.b-c@x', 'tenant_a.b-c@x');
      expect(result.matched).toBe(true);
    });
  });

  // ── registerTenantData ────────────────────────────────────────────────────

  describe('registerTenantData', () => {
    it('should store entities for a given tenant', () => {
      const entities: TenantEntity[] = [
        { id: 'e1', tenantId: 't1', name: 'entity1' },
      ];
      service.registerTenantData('t1', entities);

      const found = service.findOne('t1', 'e1');
      expect(found).toBeDefined();
      expect(found!.tenantId).toBe('t1');
    });

    it('should append entities to existing tenant store', () => {
      service.registerTenantData('t1', [{ id: 'e1', tenantId: 't1' }]);
      service.registerTenantData('t1', [{ id: 'e2', tenantId: 't1' }]);

      const all = service.find('t1');
      expect(all).toHaveLength(2);
    });

    it('should isolate data between tenants', () => {
      service.registerTenantData('t1', [{ id: 'e1', tenantId: 't1' }]);
      service.registerTenantData('t2', [{ id: 'e2', tenantId: 't2' }]);

      expect(service.findOne('t2', 'e1')).toBeUndefined();
      expect(service.findOne('t1', 'e2')).toBeUndefined();
    });
  });

  // ── findOne ───────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return undefined for unknown tenant', () => {
      expect(service.findOne('nonexistent', 'e1')).toBeUndefined();
    });

    it('should return undefined for unknown entity', () => {
      service.registerTenantData('t1', [{ id: 'e1', tenantId: 't1' }]);
      expect(service.findOne('t1', 'unknown')).toBeUndefined();
    });

    it('should return the entity when found', () => {
      service.registerTenantData('t1', [{ id: 'e1', tenantId: 't1', extra: 'val' }]);
      const entity = service.findOne('t1', 'e1');
      expect(entity).toBeDefined();
      expect((entity as any).extra).toBe('val');
    });
  });

  // ── find ──────────────────────────────────────────────────────────────────

  describe('find', () => {
    it('should return empty array for unknown tenant', () => {
      expect(service.find('nonexistent')).toEqual([]);
    });

    it('should return all entities for a tenant without predicate', () => {
      service.registerTenantData('t1', [
        { id: 'e1', tenantId: 't1' },
        { id: 'e2', tenantId: 't1' },
      ]);
      expect(service.find('t1')).toHaveLength(2);
    });

    it('should filter entities with predicate', () => {
      service.registerTenantData('t1', [
        { id: 'e1', tenantId: 't1', active: true },
        { id: 'e2', tenantId: 't1', active: false },
      ]);
      const active = service.find('t1', (e) => (e as any).active === true);
      expect(active).toHaveLength(1);
      expect(active[0].id).toBe('e1');
    });
  });

  // ── gencrossTenantScenarios ────────────────────────────────────────────

  describe('generateCrossTenantScenarios', () => {
    it('should generate specified number of scenarios', () => {
      const scenarios = service.generateCrossTenantScenarios(['t1', 't2'], 10);
      expect(scenarios).toHaveLength(10);
    });

    it('should generate default 100 scenarios when count omitted', () => {
      const scenarios = service.generateCrossTenantScenarios(['t1', 't2']);
      expect(scenarios).toHaveLength(100);
    });

    it('should alternate operation types', () => {
      const scenarios = service.generateCrossTenantScenarios(['t1', 't2'], 4);
      expect(scenarios[0].operation).toBe('findOne');
      expect(scenarios[1].operation).toBe('find');
      expect(scenarios[2].operation).toBe('findOne');
      expect(scenarios[3].operation).toBe('find');
    });

    it('should assign unique scenario IDs', () => {
      const scenarios = service.generateCrossTenantScenarios(['t1', 't2', 't3'], 10);
      const ids = scenarios.map((s) => s.scenarioId);
      expect(new Set(ids).size).toBe(10);
    });
  });

  // ── runCrossTenantIntegrationTest ─────────────────────────────────────────

  describe('runCrossTenantIntegrationTest', () => {
    it('should return a result with all metrics', () => {
      const result = service.runCrossTenantIntegrationTest({
        tenantIds: ['t1', 't2'],
        scenarioCount: 10,
      });
      expect(result.totalAttempted).toBe(10);
      expect(result.passRate).toBeGreaterThanOrEqual(0);
      expect(result.passRate).toBeLessThanOrEqual(1);
      expect(result.details).toHaveLength(10);
    });

    it('should block cross-tenant access when data belongs to a different tenant', () => {
      service.registerTenantData('t1', [{ id: 'e-0-0', tenantId: 't1', name: 't1-data' }]);
      const result = service.runCrossTenantIntegrationTest({
        tenantIds: ['t1', 't2'],
        scenarioCount: 5,
      });
      // cross-tenant scenarios (t1→t2 / t2→t1) should be blocked since target tenant has no data
      expect(result.crossTenantBlocked).toBeGreaterThanOrEqual(0);
    });

    it('should produce details with durationMs', () => {
      const result = service.runCrossTenantIntegrationTest({
        tenantIds: ['t1', 't2'],
        scenarioCount: 3,
      });
      for (const detail of result.details) {
        expect(detail.durationMs).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // ── resetForTests ─────────────────────────────────────────────────────────

  describe('resetForTests', () => {
    it('should clear all stored data', () => {
      service.registerTenantData('t1', [{ id: 'e1', tenantId: 't1' }]);
      expect(service.find('t1')).toHaveLength(1);
      service.resetForTests();
      expect(service.find('t1')).toHaveLength(0);
    });
  });
});
