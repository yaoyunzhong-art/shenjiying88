import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

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

class PortalController {
  constructor(private readonly portalService: { getBootstrap: () => unknown }) {}

  getBootstrap() {
    return this.portalService.getBootstrap();
  }
}

Get('bootstrap')(PortalController.prototype, 'getBootstrap');
Controller('portals')(PortalController);

describe('PortalController', () => {
  let callCount = 0;
  let bootstrapPayload: unknown;
  let controller: PortalController;

  test.beforeEach(() => {
    callCount = 0;
    bootstrapPayload = {
      tenantPortal: { audience: 'to-b', scopeType: 'tenant' },
      brandPortal: { audience: 'to-b', scopeType: 'brand' },
      storePortal: { audience: 'to-c', scopeType: 'store' },
    };
    controller = new PortalController({
      getBootstrap: () => {
        callCount += 1;
        return bootstrapPayload;
      },
    });
  });

  describe('getBootstrap()', () => {
    test('delegates to portalService.getBootstrap', () => {
      const result = controller.getBootstrap();
      assert.equal(callCount, 1);
      assert.equal(result, bootstrapPayload);
    });

    test('returns a well-shaped bootstrap response', () => {
      const result = controller.getBootstrap() as {
        tenantPortal: { audience: string };
        brandPortal: unknown;
        storePortal: { audience: string };
      };

      assert.ok('tenantPortal' in result);
      assert.ok('brandPortal' in result);
      assert.ok('storePortal' in result);
      assert.equal(result.tenantPortal.audience, 'to-b');
      assert.equal(result.storePortal.audience, 'to-c');
    });
  });

  describe('decorator metadata', () => {
    test('registers controller prefix', () => {
      assert.equal((PortalController as typeof PortalController & { __prefix?: string }).__prefix, 'portals');
    });

    test('registers @Get("bootstrap") on getBootstrap', () => {
      assert.ok(getRegistrations.includes('getBootstrap:bootstrap'));
    });
  });
});
