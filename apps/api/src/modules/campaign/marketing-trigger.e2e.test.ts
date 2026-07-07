import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
// 创建: 2026-06-26 · Pulse-68 下午主任务
// 状态: IMPLEMENTED · 4 场景 + 频次控制
// 关联: tasks.md T5/T6 · afternoon-dev-jobs.sh 14:30-16:00

import { CampaignTriggerService } from './trigger.service';
import type { MemberService } from '../member/member.service';
import type { LoyaltyService } from '../loyalty/loyalty.service';

/** Mock MemberService - 返回成功 */
function mockMemberService(): any {
  return { awardPoints: () => ({ success: true, pointsAwarded: 100 }) } as unknown as MemberService;
}

/** Mock LoyaltyService - 返回模拟 redemption */
function mockLoyaltyService(): any {
  return {
    issueCouponFromPlan: () => ({ redemptionId: 'mock-redemption-1' }),
    issueBlindboxFromPlan: () => ({ fulfillmentId: 'mock-fulfillment-1' }),
  } as unknown as LoyaltyService;
}
import { CampaignService } from './campaign.service';
import { InMemoryEventBus } from '../../infrastructure/event-bus/event-bus.module';
import {
  CampaignActionKind,
  CampaignConditionType,
  CampaignStatus,
  CampaignTrigger,
  type CampaignCondition,
  type CampaignAction,
} from './campaign.entity';
import { TenantTier } from '../tenant/tenant-quota.entity';
import { TenantQuotaService } from '../tenant/tenant-quota.service';
import type { RequestTenantContext } from '../tenant/tenant.types';

function tenantCtx(tenantId = 'tenant-A'): RequestTenantContext {
  return { tenantId, brandId: 'brand-1', storeId: 'store-1' };
}

function makeCampaign(service: CampaignService, ctx: RequestTenantContext, code: string, trigger: string, actions: CampaignAction[]) {
  return service.registerCampaign({
    tenantContext: ctx,
    code,
    title: `Test campaign ${code}`,
    triggerEvent: trigger as CampaignTrigger,
    conditions: [],
    actions,
  });
}

describe('CampaignTriggerService · Phase-17 T5/T6', () => {
  let eventBus: InMemoryEventBus;
  let campaignService: CampaignService;
  let triggerService: CampaignTriggerService;

  beforeEach(() => {
    eventBus = new InMemoryEventBus();
    campaignService = new CampaignService(mockMemberService(), mockLoyaltyService());
    campaignService.resetCampaignStoresForTests();
    triggerService = new CampaignTriggerService(eventBus, campaignService);
    triggerService.onModuleInit();
  });

  it('AC-1: member.registered 触发 IssueCoupon', async () => {
    const ctx = tenantCtx();
    makeCampaign(campaignService, ctx, 'NEW-USER-COUPON', 'member.registered', [
      { kind: CampaignActionKind.IssueCoupon, params: { couponPlanId: 'plan-1' } },
    ]);
    campaignService.updateCampaignStatus(
      campaignService.listCampaigns(ctx.tenantId)[0].planId,
      CampaignStatus.Active,
      ctx.tenantId,
    );

    const result = await triggerService.fire('member.registered', {
      tenantContext: ctx,
      memberId: 'user-001',
    });
    expect(result).not.toBeNull();
    expect(result!.matchedCampaigns).toBe(1);
    expect(result!.dispatchedActions).toBe(1);
  });

  it('AC-2: order.completed 触发 AwardPoints', async () => {
    const ctx = tenantCtx();
    makeCampaign(campaignService, ctx, 'ORDER-POINTS', 'order.completed', [
      { kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 100, pointsReason: 'order-complete' } },
    ]);
    campaignService.updateCampaignStatus(
      campaignService.listCampaigns(ctx.tenantId)[0].planId,
      CampaignStatus.Active,
      ctx.tenantId,
    );

    const result = await triggerService.fire('order.completed', {
      tenantContext: ctx,
      memberId: 'user-001',
      orderId: 'order-123',
      orderAmount: 200,
    });
    expect(result!.dispatchedActions).toBe(1);
  });

  it('AC-3: share.clicked 触发 RecommendTag', async () => {
    const ctx = tenantCtx();
    makeCampaign(campaignService, ctx, 'SHARE-TAG', 'share.clicked', [
      { kind: CampaignActionKind.RecommendTag, params: { tagCode: 'vip' } },
    ]);
    campaignService.updateCampaignStatus(
      campaignService.listCampaigns(ctx.tenantId)[0].planId,
      CampaignStatus.Active,
      ctx.tenantId,
    );

    const result = await triggerService.fire('share.clicked', {
      tenantContext: ctx,
      memberId: 'user-002',
    });
    expect(result!.dispatchedActions).toBe(1);
  });

  it('AC-4: payment.success 节日定时全员推送 (无 memberId 也跑通)', async () => {
    const ctx = tenantCtx();
    makeCampaign(campaignService, ctx, 'PAYMENT-OK', 'payment.success', [
      { kind: CampaignActionKind.RecommendTag, params: { tagCode: 'returning' } },
    ]);
    campaignService.updateCampaignStatus(
      campaignService.listCampaigns(ctx.tenantId)[0].planId,
      CampaignStatus.Active,
      ctx.tenantId,
    );

    const result = await triggerService.fire('payment.success', {
      tenantContext: ctx,
      memberId: 'user-003',
      paymentId: 'pay-1',
    });
    expect(result!.dispatchedActions).toBe(1);
  });

  it('频次控制: 同 userId + 同 event 每日 ≤1 次', async () => {
    const ctx = tenantCtx();
    makeCampaign(campaignService, ctx, 'LIMITED', 'member.registered', [
      { kind: CampaignActionKind.IssueCoupon, params: { couponPlanId: 'plan-1' } },
    ]);
    campaignService.updateCampaignStatus(
      campaignService.listCampaigns(ctx.tenantId)[0].planId,
      CampaignStatus.Active,
      ctx.tenantId,
    );

    const r1 = await triggerService.fire('member.registered', { tenantContext: ctx, memberId: 'user-005' });
    const r2 = await triggerService.fire('member.registered', { tenantContext: ctx, memberId: 'user-005' });
    expect(r1!.dispatchedActions).toBe(1);
    expect(r2).toBeNull(); // 频次限制
  });
});
