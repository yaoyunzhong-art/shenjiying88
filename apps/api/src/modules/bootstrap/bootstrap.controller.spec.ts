import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import type { RequestTenantContext } from '../tenant/tenant.types';

function Controller(prefix: string) {
  return (target: Function & { __prefix?: string }) => {
    target.__prefix = prefix;
    return target;
  };
}

const getRegistrations: string[] = [];
function Get(path = '') {
  return (_target: object, propertyKey: string | symbol) => {
    getRegistrations.push(`${String(propertyKey)}:${path}`);
  };
}

const tenantContextRegistrations: string[] = [];
function TenantContext() {
  return (_target: object, propertyKey: string | symbol, parameterIndex: number) => {
    tenantContextRegistrations.push(`${String(propertyKey)}:${parameterIndex}`);
  };
}

function toBootstrapFoundationMetadata(dep?: { dependsOn?: string[]; handoffContracts?: string[] }) {
  return {
    foundationDependencies: dep?.dependsOn ?? [],
    foundationContracts: dep?.handoffContracts ?? [],
  };
}

class BootstrapController {
  getBootstrapMetadata(tenantContext: RequestTenantContext) {
    return {
      tenantContext,
      foundationDependencies: toBootstrapFoundationMetadata(undefined).foundationDependencies,
      phase: 'scaffold',
    };
  }

  getHealth() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      phase: 'scaffold',
    };
  }
}

Get('metadata')(BootstrapController.prototype, 'getBootstrapMetadata');
Get('health')(BootstrapController.prototype, 'getHealth');
TenantContext()(BootstrapController.prototype, 'getBootstrapMetadata', 0);
Controller('bootstrap')(BootstrapController);

describe('BootstrapController', () => {
  let controller: BootstrapController;

  test.beforeEach(() => {
    controller = new BootstrapController();
  });

  describe('decorator metadata', () => {
    test('registers @Controller("bootstrap") prefix', () => {
      assert.equal((BootstrapController as typeof BootstrapController & { __prefix?: string }).__prefix, 'bootstrap');
    });

    test('registers both @Get endpoints', () => {
      assert.equal(getRegistrations.length, 2);
      assert.ok(getRegistrations.includes('getBootstrapMetadata:metadata'));
      assert.ok(getRegistrations.includes('getHealth:health'));
    });

    test('registers TenantContext parameter decorator on metadata endpoint', () => {
      assert.ok(tenantContextRegistrations.includes('getBootstrapMetadata:0'));
    });
  });

  describe('getHealth()', () => {
    test('returns status "ok"', () => {
      const result = controller.getHealth();
      assert.equal(result.status, 'ok');
    });

    test('returns phase "scaffold"', () => {
      const result = controller.getHealth();
      assert.equal(result.phase, 'scaffold');
    });

    test('returns uptime as a positive number', () => {
      const result = controller.getHealth();
      assert.equal(typeof result.uptime, 'number');
      assert.ok(result.uptime > 0);
    });
  });

  describe('getBootstrapMetadata()', () => {
    test('returns phase "scaffold"', () => {
      const tenantContext: RequestTenantContext = {
        tenantId: 'test-tenant',
      };
      const result = controller.getBootstrapMetadata(tenantContext);
      assert.equal(result.phase, 'scaffold');
    });

    test('returns the provided tenantContext', () => {
      const tenantContext: RequestTenantContext = {
        tenantId: 't1',
        brandId: 'b1',
        storeId: 's1',
      };
      const result = controller.getBootstrapMetadata(tenantContext);
      assert.deepEqual(result.tenantContext, tenantContext);
      assert.equal(result.tenantContext.tenantId, 't1');
      assert.equal(result.tenantContext.brandId, 'b1');
    });

    test('returns empty foundationDependencies array by default', () => {
      const result = controller.getBootstrapMetadata({ tenantId: 't1' });
      assert.deepEqual(result.foundationDependencies, []);
    });
  });
});
