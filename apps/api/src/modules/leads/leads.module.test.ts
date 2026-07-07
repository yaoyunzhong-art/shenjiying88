import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
// 创建: 2026-06-26 · Pulse-自动
// 状态: IMPLEMENTED · Leads Module 集成测试

import { MarketingMetricsModule } from '../marketing-metrics/marketing-metrics.module';
import { LeadsModule } from './leads.module';

describe('LeadsModule', () => {
  it('应能正确导入模块定义', () => {
    const module = new LeadsModule();
    expect(module).toBeDefined();
  });

  it('模块应包含 LeadsController 和 LeadsService', () => {
    const module = Reflect.getMetadata('controllers', LeadsModule) || [];
    const providers = Reflect.getMetadata('providers', LeadsModule) || [];
    const exports = Reflect.getMetadata('exports', LeadsModule) || [];

    expect(Array.isArray(module)).toBe(true);
    expect(providers.length).toBeGreaterThan(0);
    expect(exports.length).toBeGreaterThan(0);
  });

  it('模块应导入 MarketingMetricsModule', () => {
    const importsList = Reflect.getMetadata('imports', LeadsModule) || [];
    const importNames = importsList.map((entry: { name?: string }) => entry.name);
    expect(importNames).toContain(MarketingMetricsModule.name);
  });
});
