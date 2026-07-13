import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * 🐜 自动: [champion] [A] module.test 补全
 */

describe('ChampionModule', () => {
  it('should have correct module metadata', async () => {
    const { ChampionModule } = await import('./champion.module');
    const { ChampionController } = await import('./champion.controller');
    const { ChampionService } = await import('./champion.service');

    const controllers = Reflect.getMetadata('controllers', ChampionModule);
    const providers = Reflect.getMetadata('providers', ChampionModule);
    const exports = Reflect.getMetadata('exports', ChampionModule);

    expect(controllers).toBeDefined();
    expect(providers).toBeDefined();
    expect(exports).toBeDefined();

    expect(controllers).toContain(ChampionController);
    expect(providers).toContain(ChampionService);
    expect(exports).toContain(ChampionService);
  });

  it('should have imports or no imports metadata', async () => {
    const { ChampionModule } = await import('./champion.module');
    const imports = Reflect.getMetadata('imports', ChampionModule);
    // ChampionModule has no @Module(imports), so metadata may be undefined
    expect(imports === undefined || Array.isArray(imports)).toBe(true);
  });

  it('module instance should be constructable', async () => {
    const { ChampionModule } = await import('./champion.module');
    const instance = new ChampionModule();
    expect(instance).toBeDefined();
    expect(instance.constructor.name).toBe('ChampionModule');
  });

  it('controllers array should contain only ChampionController', async () => {
    const { ChampionModule } = await import('./champion.module');
    const { ChampionController } = await import('./champion.controller');

    const controllers = Reflect.getMetadata('controllers', ChampionModule);
    expect(controllers.length).toBe(1);
    expect(controllers[0]).toBe(ChampionController);
  });

  it('providers array should contain ChampionService', async () => {
    const { ChampionModule } = await import('./champion.module');
    const { ChampionService } = await import('./champion.service');

    const providers = Reflect.getMetadata('providers', ChampionModule);
    expect(providers).toContain(ChampionService);
  });

  it('exports array should have at least as many items as needed', async () => {
    const { ChampionModule } = await import('./champion.module');
    const exports = Reflect.getMetadata('exports', ChampionModule);
    expect(exports.length).toBeGreaterThanOrEqual(1);
  });

  it('all providers are class-like', async () => {
    const { ChampionModule } = await import('./champion.module');
    const providers: unknown[] = Reflect.getMetadata('providers', ChampionModule);
    for (const p of providers) {
      expect(typeof p === 'function' || typeof p === 'object').toBe(true);
    }
  });
});
