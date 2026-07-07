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
});
