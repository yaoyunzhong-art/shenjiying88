import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { HealthDashboardModule } from './health-dashboard.module';

describe('HealthDashboardModule', () => {
  it('AC-1: 应正确定义模块元数据', () => {
    const metadata = Reflect.getMetadata('imports', HealthDashboardModule);
    const controllers = Reflect.getMetadata('controllers', HealthDashboardModule);
    const providers = Reflect.getMetadata('providers', HealthDashboardModule);
    const exports = Reflect.getMetadata('exports', HealthDashboardModule);

    expect(controllers).toBeDefined();
    expect(controllers).toHaveLength(1);
    expect(providers).toBeDefined();
    expect(providers).toHaveLength(2);
    expect(exports).toBeDefined();
    expect(exports).toHaveLength(2);
  });
});
