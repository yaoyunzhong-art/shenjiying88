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

class LytService {
  getAdapter() {
    return {
      getMember: async (id: string) => ({
        id,
        name: 'seed-member-001',
        level: 'GOLD' as const,
      }),
    };
  }
}

class HealthController {
  constructor(private readonly lytService: LytService) {}

  async getHealth() {
    const adapter = this.lytService.getAdapter();
    const sampleMember = await adapter.getMember('seed-member-001');
    return {
      status: 'ok' as const,
      lytMode: 'mock' as const,
      sampleMember,
    };
  }
}

Get()(HealthController.prototype, 'getHealth');
Controller('health')(HealthController);

describe('HealthController', () => {
  let controller: HealthController;

  test.beforeEach(() => {
    controller = new HealthController(new LytService());
  });

  describe('getHealth()', () => {
    test('returns status "ok"', async () => {
      const result = await controller.getHealth();
      assert.equal(result.status, 'ok');
    });

    test('returns lytMode "mock"', async () => {
      const result = await controller.getHealth();
      assert.equal(result.lytMode, 'mock');
    });

    test('returns seed sample member', async () => {
      const result = await controller.getHealth();
      assert.equal(result.sampleMember.id, 'seed-member-001');
    });

    test('calls adapter.getMember with seed id', async () => {
      let calledWith: string | null = null;
      const mockLytService = {
        getAdapter: () => ({
          getMember: async (id: string) => {
            calledWith = id;
            return { id: 'x', name: 'test' };
          },
        }),
      } as unknown as LytService;

      const ctrl = new HealthController(mockLytService);
      await ctrl.getHealth();

      assert.equal(calledWith, 'seed-member-001');
    });
  });

  describe('decorator metadata', () => {
    test('registers controller prefix', () => {
      assert.equal((HealthController as typeof HealthController & { __prefix?: string }).__prefix, 'health');
    });

    test('registers @Get on getHealth', () => {
      assert.ok(getRegistrations.includes('getHealth:'));
    });
  });
});
