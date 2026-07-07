import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
// marketing-metrics.module.test.ts - Phase-17 T12
// 用途: 营销指标模块集成测试 (node:test runner)
import assert from 'node:assert/strict';
import { Test, TestingModule } from '@nestjs/testing';
import { MarketingMetricsModule } from './marketing-metrics.module';
import { MarketingMetricsController } from './marketing-metrics.controller';
import { MarketingMetricsService } from './marketing-metrics.service';

describe('MarketingMetricsModule', () => {
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [MarketingMetricsModule],
    }).compile();
  });

  it('should compile and instantiate', () => {
    assert.ok(moduleRef);
  });

  it('should provide MarketingMetricsController', () => {
    const controller = moduleRef.get<MarketingMetricsController>(MarketingMetricsController);
    assert.ok(controller);
    assert.ok(controller instanceof MarketingMetricsController);
  });

  it('should provide MarketingMetricsService', () => {
    const service = moduleRef.get<MarketingMetricsService>(MarketingMetricsService);
    assert.ok(service);
    assert.ok(service instanceof MarketingMetricsService);
  });

  it('controller should have access to service through DI', () => {
    const controller = moduleRef.get<MarketingMetricsController>(MarketingMetricsController);
    const service = moduleRef.get<MarketingMetricsService>(MarketingMetricsService);

    // Verify the controller uses the service by calling through
    const snapshot = controller.getSnapshot();
    assert.equal(typeof snapshot.roi, 'number');
    assert.equal(typeof snapshot.avgOrderValue, 'number');
    assert.equal(snapshot.couponRedemptionTotal, 0);

    // After recording an event through controller, verify change
    controller.recordCouponRedemption({ crossStore: true });
    const snap2 = controller.getSnapshot();
    assert.equal(snap2.couponRedemptionTotal, 1);
  });
});
