import 'reflect-metadata';
import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import { BootstrapService } from './bootstrap.service';
import type { RequestTenantContext } from '../tenant/tenant.types';

// ── helpers ────────────────────────────────────────────────────
function createContext(
  overrides: Partial<RequestTenantContext> = {}
): RequestTenantContext {
  return {
    tenantId: 'tenant-boot',
    brandId: 'brand-boot',
    storeId: 'store-boot',
    marketCode: 'cn-mainland',
    ...overrides
  };
}

// ── BootstrapService tests ─────────────────────────────────────
describe('BootstrapService', () => {
  const service = new BootstrapService();

  // ── getHealth() ──────────────────────────────────────────────
  describe('getHealth()', () => {
    test('returns status "ok"', () => {
      const result = service.getHealth();
      assert.equal(result.status, 'ok');
    });

    test('returns phase "scaffold"', () => {
      const result = service.getHealth();
      assert.equal(result.phase, 'scaffold');
    });

    test('returns uptime as a non-negative number', () => {
      const result = service.getHealth();
      assert.equal(typeof result.uptime, 'number');
      assert.ok(result.uptime >= 0);
    });
  });

  // ── getBootstrapMetadata() ───────────────────────────────────
  describe('getBootstrapMetadata()', () => {
    test('returns tenantContext unchanged', () => {
      const ctx = createContext();
      const result = service.getBootstrapMetadata(ctx);
      assert.deepStrictEqual(result.tenantContext, ctx);
    });

    test('returns phase "scaffold"', () => {
      const result = service.getBootstrapMetadata(createContext());
      assert.equal(result.phase, 'scaffold');
    });

    test('returns empty foundationDependencies by default', () => {
      const result = service.getBootstrapMetadata(createContext());
      assert.deepStrictEqual(result.foundationDependencies, []);
    });

    test('preserves tenantId with minimal context', () => {
      const ctx = { tenantId: 'min-tenant' } as RequestTenantContext;
      const result = service.getBootstrapMetadata(ctx);
      assert.equal(result.tenantContext.tenantId, 'min-tenant');
    });

    test('preserves brandId and storeId in full context', () => {
      const ctx = createContext({ brandId: 'b-x', storeId: 's-y' });
      const result = service.getBootstrapMetadata(ctx);
      assert.equal(result.tenantContext.brandId, 'b-x');
      assert.equal(result.tenantContext.storeId, 's-y');
    });

    test('preserves marketCode across different markets', () => {
      const ctx = createContext({ marketCode: 'en-global' });
      const result = service.getBootstrapMetadata(ctx);
      assert.equal(result.tenantContext.marketCode, 'en-global');
    });
  });
});
