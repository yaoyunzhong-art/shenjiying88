// CampaignTriggerService · Phase-17 T5
// 创建: 2026-06-26 · Pulse-68 下午主任务
// 状态: IMPLEMENTED · EventBus 包装 + CampaignService.fire() 集成
// 关联: tasks.md T5 · afternoon-dev-jobs.sh 13:00-14:30

import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit, Optional } from '@nestjs/common';
import {
  EVENT_BUS_SERVICE,
  type EventBusService,
} from '../../infrastructure/event-bus/event-bus.module';
import {
  CampaignService,
  type CampaignEvaluationResult,
  type CampaignTriggerEvent,
} from './campaign.service';
import type { RequestTenantContext } from '../tenant/tenant.types';

/**
 * CampaignTriggerService · 营销触发器服务
 *
 * 职责:
 * 1. 监听业务事件 (member.registered / order.completed / share.clicked / payment.success 等)
 * 2. 转换为 CampaignTriggerEvent
 * 3. 调用 CampaignService.evaluateTriggers 评估匹配的 campaigns
 * 4. 自动 dispatch actions (AwardPoints / IssueCoupon / IssueBlindbox / RecommendTag)
 * 5. 发布 trigger 事件 (供 NotificationService / Analytics 订阅)
 *
 * 设计:
 * - 包装在 CampaignService 之上,不修改现有 evaluateTriggers 接口
 * - EventBus subscribe 全部 4 个内置 trigger + 可扩展
 * - 单次事件限频:同 userId + 同 triggerEvent 每日 ≤1 次 (频次控制)
 */
@Injectable()
export class CampaignTriggerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CampaignTriggerService.name);
  /** 频次控制:userId:triggerEvent:dateKey → count */
  private readonly frequencyCounter = new Map<string, number>();
  private readonly subscribed: string[] = [];

  constructor(
    @Optional() @Inject(EVENT_BUS_SERVICE) private readonly eventBus?: EventBusService,
    @Optional() private readonly campaignService?: CampaignService,
  ) {}

  onModuleInit(): void {
    if (!this.eventBus) {
      this.logger.warn('EventBus not configured; trigger service will be no-op');
      return;
    }
    // 4 个核心业务事件
    const events = [
      'member.registered',
      'order.completed',
      'share.clicked',
      'payment.success',
      'member.profile-synced',
    ];
    for (const ev of events) {
      this.eventBus.subscribe(ev, async (payload: any) => {
        await this.handleEvent(ev, payload);
      });
      this.subscribed.push(ev);
    }
    this.logger.debug(`Subscribed to ${this.subscribed.length} trigger events`);
  }

  onModuleDestroy(): void {
    this.subscribed.length = 0;
    this.frequencyCounter.clear();
  }

  /**
   * 处理事件 (EventBus handler)
   */
  async handleEvent(eventName: string, payload: any): Promise<CampaignEvaluationResult | null> {
    if (!this.campaignService || !payload) return null;
    const tenantContext: RequestTenantContext | undefined = payload.tenantContext;
    const memberId: string | undefined = payload.memberId;
    if (!tenantContext) {
      this.logger.warn(`Event ${eventName} missing tenantContext; skipped`);
      return null;
    }

    // 频次控制:同 userId + 同 triggerEvent 每日 ≤1 次 (T6 要求)
    if (memberId) {
      const today = new Date().toISOString().slice(0, 10);
      const key = `${tenantContext.tenantId}:${memberId}:${eventName}:${today}`;
      const count = this.frequencyCounter.get(key) ?? 0;
      if (count >= 1) {
        this.logger.debug(`Frequency limit hit: ${key}; skipped`);
        return null;
      }
      this.frequencyCounter.set(key, count + 1);
    }

    const event: CampaignTriggerEvent = {
      eventName,
      tenantContext,
      memberId,
      orderId: payload.orderId,
      paymentId: payload.paymentId,
      orderAmount: payload.orderAmount,
      memberLevel: payload.memberLevel,
      storeId: payload.storeId,
      brandId: payload.brandId,
      payload,
    };

    const result = this.campaignService.evaluateTriggers(event);
    this.logger.log(
      `Event ${eventName} tenant=${tenantContext.tenantId}: ${result.matchedCampaigns} matched, ${result.dispatchedActions} dispatched`,
    );
    return result;
  }

  /**
   * 主动触发 (供业务代码直接调用,例如节日定时全员推送)
   */
  async fire(eventName: string, payload: any): Promise<CampaignEvaluationResult | null> {
    return this.handleEvent(eventName, payload);
  }

  /**
   * 测试 helper:清空频次计数器
   */
  resetFrequencyCounter(): void {
    this.frequencyCounter.clear();
  }

  /**
   * 测试 helper:已订阅事件数
   */
  subscribedEventCount(): number {
    return this.subscribed.length;
  }
}
