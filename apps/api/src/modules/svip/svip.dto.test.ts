import { describe, it, expect } from 'vitest';
import assert from 'node:assert/strict';

/**
 * SVIP 会员管理 DTO 测试
 */

import {
  CreatePlanDto,
  SubscribeDto,
  UseBenefitDto,
  RenewSubscriptionDto,
  CancelSubscriptionDto,
  SubscriptionQueryDto,
  PlanQueryDto,
  BenefitQueryDto,
  PlanResponseDto,
  SubscriptionResponseDto,
  BenefitResponseDto,
  PlanListResponseDto,
  SubscriptionListResponseDto,
  SvipStatsResponseDto,
} from './svip.dto';

describe('Svip DTOs', () => {

  // ── 请求 DTO ──

  describe('CreatePlanDto', () => {
    it('应能设置所有必填字段', () => {
      const dto = new CreatePlanDto();
      dto.name = '黄金会员';
      dto.price = 199;
      dto.durationDays = 30;
      dto.benefits = ['积分翻倍', '免费配送'];

      assert.equal(dto.name, '黄金会员');
      assert.equal(dto.price, 199);
      assert.equal(dto.durationDays, 30);
      assert.deepEqual(dto.benefits, ['积分翻倍', '免费配送']);
    });

    it('价格应支持零元和负值（边界情况）', () => {
      const free = new CreatePlanDto();
      free.name = '免费体验';
      free.price = 0;
      free.durationDays = 7;
      free.benefits = [];

      assert.equal(free.price, 0);

      const expensive = new CreatePlanDto();
      expensive.name = '终身会员';
      expensive.price = 999999;
      expensive.durationDays = 36500;
      expensive.benefits = ['积分翻倍', '免费配送', '专属折扣'];

      assert.equal(expensive.price, 999999);
    });

    it('权益列表应支持空数组', () => {
      const dto = new CreatePlanDto();
      dto.name = '基础体验';
      dto.price = 0;
      dto.durationDays = 1;
      dto.benefits = [];

      assert.deepEqual(dto.benefits, []);
    });
  });

  describe('SubscribeDto', () => {
    it('应能设置用户ID和计划ID', () => {
      const dto = new SubscribeDto();
      dto.userId = 'user-001';
      dto.planId = 'plan-001';

      assert.equal(dto.userId, 'user-001');
      assert.equal(dto.planId, 'plan-001');
    });
  });

  describe('UseBenefitDto', () => {
    it('应能设置用户ID和权益类型', () => {
      const dto = new UseBenefitDto();
      dto.userId = 'user-001';
      dto.benefitType = 'points_multiplier';

      assert.equal(dto.userId, 'user-001');
      assert.equal(dto.benefitType, 'points_multiplier');
    });

    it('应支持所有权益类型', () => {
      const types = ['points_multiplier', 'free_delivery', 'exclusive_discount'] as const;
      for (const t of types) {
        const dto = new UseBenefitDto();
        dto.userId = 'user-001';
        dto.benefitType = t;
        assert.equal(dto.benefitType, t);
      }
    });
  });

  describe('RenewSubscriptionDto', () => {
    it('应设置订阅ID', () => {
      const dto = new RenewSubscriptionDto();
      dto.subscriptionId = 'sub-001';
      assert.equal(dto.subscriptionId, 'sub-001');
    });
  });

  describe('CancelSubscriptionDto', () => {
    it('应设置订阅ID', () => {
      const dto = new CancelSubscriptionDto();
      dto.subscriptionId = 'sub-001';
      assert.equal(dto.subscriptionId, 'sub-001');
    });
  });

  // ── 查询 DTO ──

  describe('SubscriptionQueryDto', () => {
    it('应有默认分页值', () => {
      const dto = new SubscriptionQueryDto();
      assert.equal(dto.page, 1);
      assert.equal(dto.pageSize, 10);
    });

    it('应支持状态过滤', () => {
      const dto = new SubscriptionQueryDto();
      dto.status = 'active';
      assert.equal(dto.status, 'active');
    });

    it('应支持用户ID搜索', () => {
      const dto = new SubscriptionQueryDto();
      dto.userId = 'user-001';
      assert.equal(dto.userId, 'user-001');
    });
  });

  describe('PlanQueryDto', () => {
    it('应有默认分页值', () => {
      const dto = new PlanQueryDto();
      assert.equal(dto.page, 1);
      assert.equal(dto.pageSize, 10);
    });

    it('应支持价格范围过滤', () => {
      const dto = new PlanQueryDto();
      dto.minPrice = 100;
      dto.maxPrice = 500;
      assert.equal(dto.minPrice, 100);
      assert.equal(dto.maxPrice, 500);
    });

    it('应支持名称模糊搜索', () => {
      const dto = new PlanQueryDto();
      dto.name = '黄金';
      assert.equal(dto.name, '黄金');
    });
  });

  describe('BenefitQueryDto', () => {
    it('应设置必填订阅ID', () => {
      const dto = new BenefitQueryDto();
      dto.subscriptionId = 'sub-001';
      assert.equal(dto.subscriptionId, 'sub-001');
    });

    it('应支持权益类型过滤', () => {
      const dto = new BenefitQueryDto();
      dto.subscriptionId = 'sub-001';
      dto.type = 'free_delivery';
      assert.equal(dto.type, 'free_delivery');
    });

    it('应支持已使用过滤', () => {
      const dto = new BenefitQueryDto();
      dto.subscriptionId = 'sub-001';
      dto.used = true;
      assert.equal(dto.used, true);
    });
  });

  // ── 响应 DTO ──

  describe('PlanResponseDto', () => {
    it('应序列化所有字段', () => {
      const dto = new PlanResponseDto();
      dto.planId = 'plan-001';
      dto.name = '黄金会员';
      dto.price = 199;
      dto.durationDays = 30;
      dto.benefits = ['积分翻倍'];
      dto.createdAt = '2026-07-05T00:00:00.000Z';

      assert.equal(dto.planId, 'plan-001');
      assert.equal(dto.name, '黄金会员');
      assert.equal(dto.price, 199);
      assert.deepEqual(dto.benefits, ['积分翻倍']);
    });
  });

  describe('SubscriptionResponseDto', () => {
    it('应序列化所有字段', () => {
      const dto = new SubscriptionResponseDto();
      dto.subscriptionId = 'sub-001';
      dto.userId = 'user-001';
      dto.planId = 'plan-001';
      dto.status = 'active';
      dto.startAt = '2026-07-01T00:00:00.000Z';
      dto.expireAt = '2026-07-31T00:00:00.000Z';
      dto.autoRenew = true;
      dto.createdAt = '2026-07-01T00:00:00.000Z';

      assert.equal(dto.subscriptionId, 'sub-001');
      assert.equal(dto.status, 'active');
      assert.equal(dto.autoRenew, true);
    });

    it('应支持过期状态', () => {
      const dto = new SubscriptionResponseDto();
      dto.subscriptionId = 'sub-002';
      dto.userId = 'user-002';
      dto.planId = 'plan-001';
      dto.status = 'expired';
      dto.startAt = '2026-01-01T00:00:00.000Z';
      dto.expireAt = '2026-01-31T00:00:00.000Z';
      dto.autoRenew = false;
      dto.createdAt = '2026-01-01T00:00:00.000Z';

      assert.equal(dto.status, 'expired');
      assert.equal(dto.autoRenew, false);
    });
  });

  describe('BenefitResponseDto', () => {
    it('应序列化所有字段', () => {
      const dto = new BenefitResponseDto();
      dto.benefitId = 'ben-001';
      dto.subscriptionId = 'sub-001';
      dto.type = 'points_multiplier';

      assert.equal(dto.benefitId, 'ben-001');
      assert.equal(dto.type, 'points_multiplier');
    });

    it('usedAt应为可选', () => {
      const dto = new BenefitResponseDto();
      dto.benefitId = 'ben-001';
      dto.subscriptionId = 'sub-001';
      dto.type = 'free_delivery';

      assert.equal(dto.usedAt, undefined);

      dto.usedAt = '2026-07-05T10:00:00.000Z';
      assert.equal(dto.usedAt, '2026-07-05T10:00:00.000Z');
    });
  });

  describe('PlanListResponseDto', () => {
    it('应包含分页信息', () => {
      const dto = new PlanListResponseDto();
      dto.data = [
        Object.assign(new PlanResponseDto(), { planId: 'plan-001', name: '黄金会员', price: 199, durationDays: 30, benefits: [], createdAt: '2026-07-01T00:00:00.000Z' }),
      ];
      dto.total = 1;
      dto.page = 1;
      dto.pageSize = 10;

      assert.equal(dto.total, 1);
      assert.equal(dto.data.length, 1);
    });
  });

  describe('SubscriptionListResponseDto', () => {
    it('应包含分页信息', () => {
      const dto = new SubscriptionListResponseDto();
      dto.data = [];
      dto.total = 0;
      dto.page = 1;
      dto.pageSize = 10;

      assert.equal(dto.total, 0);
      assert.equal(dto.data.length, 0);
    });
  });

  describe('SvipStatsResponseDto', () => {
    it('应包含统计数据', () => {
      const dto = new SvipStatsResponseDto();
      dto.totalSubscriptions = 100;
      dto.activeCount = 60;
      dto.expiredCount = 30;
      dto.cancelledCount = 10;
      dto.totalRevenue = 50000;

      assert.equal(dto.totalSubscriptions, 100);
      assert.equal(dto.activeCount, 60);
      assert.equal(dto.totalRevenue, 50000);
    });
  });
});
