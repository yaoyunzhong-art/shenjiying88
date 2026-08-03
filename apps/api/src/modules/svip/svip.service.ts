import { Injectable, Optional } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { SVIPPlan, SVIPSubscription, SVIPBenefit, SVIPStatus, SVIPBenefitType, RenewalTierDiscount, RenewalDiscountResult } from './svip.entity';
import { PushNotificationScheduler } from '../push/push.service';

interface CreatePlanInput {
  name: string;
  price: number;
  durationDays: number;
  benefits: string[];
}

interface SubscribeInput {
  userId: string;
  planId: string;
}

interface UseBenefitInput {
  subscriptionId: string;
  benefitType: SVIPBenefitType;
}

@Injectable()
export class SvipService {
  private readonly plans: Map<string, SVIPPlan> = new Map();
  private readonly subscriptions: Map<string, SVIPSubscription> = new Map();
  private readonly benefits: Map<string, SVIPBenefit[]> = new Map();
  private readonly userSubscriptions: Map<string, string> = new Map();

  constructor(
    @Optional() private readonly pushScheduler?: PushNotificationScheduler,
  ) {}

  listPlans(): Observable<SVIPPlan[]> {
    return of(Array.from(this.plans.values()))
  }

  createPlan(input: CreatePlanInput): Observable<SVIPPlan> {
    const planId = this.generateId();
    const plan: SVIPPlan = {
      planId,
      name: input.name,
      price: input.price,
      durationDays: input.durationDays,
      benefits: input.benefits,
      createdAt: new Date(),
    };
    this.plans.set(planId, plan);
    return of(plan);
  }

  subscribe(userId: string, planId: string): Observable<SVIPSubscription | null> {
    const plan = this.plans.get(planId);
    if (!plan) {
      return of(null);
    }

    const existingSubId = this.userSubscriptions.get(userId);
    if (existingSubId) {
      const existing = this.subscriptions.get(existingSubId);
      if (existing && existing.status === 'active') {
        return of(null);
      }
    }

    const subscriptionId = this.generateId();
    const now = new Date();
    const expireAt = new Date(now);
    expireAt.setDate(expireAt.getDate() + plan.durationDays);

    const subscription: SVIPSubscription = {
      subscriptionId,
      userId,
      planId,
      status: 'active',
      startAt: now,
      expireAt,
      autoRenew: true,
      createdAt: now,
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.userSubscriptions.set(userId, subscriptionId);

    const benefits = this.createBenefitsForSubscription(subscriptionId, plan.benefits, expireAt);
    this.benefits.set(subscriptionId, benefits);

    return of(subscription);
  }

  cancelSubscription(subscriptionId: string): Observable<SVIPSubscription | null> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return of(null);
    }

    subscription.status = 'cancelled';
    subscription.autoRenew = false;
    this.subscriptions.set(subscriptionId, subscription);

    return of(subscription);
  }

  renewSubscription(subscriptionId: string): Observable<SVIPSubscription | null> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return of(null);
    }

    const plan = this.plans.get(subscription.planId);
    if (!plan) {
      return of(null);
    }

    subscription.expireAt = new Date(subscription.expireAt);
    subscription.expireAt.setDate(subscription.expireAt.getDate() + plan.durationDays);
    subscription.status = 'active';
    subscription.autoRenew = true;
    this.subscriptions.set(subscriptionId, subscription);

    return of(subscription);
  }

  /**
   * BS-0266: 检查并过期 SVIP 订阅，过期时推送到期通知（P1 级别）
   */
  checkAndExpire(): Observable<number> {
    const now = new Date();
    let expiredCount = 0;

    this.subscriptions.forEach((subscription) => {
      if (subscription.status === 'active' && subscription.expireAt < now) {
        subscription.status = 'expired';
        this.subscriptions.set(subscription.subscriptionId, subscription);
        expiredCount++;

        // BS-0266: SVIP到期 P1 级别推送
        if (this.pushScheduler) {
          this.pushScheduler.schedulePush(
            subscription.userId,
            `您的SVIP会员已于 ${subscription.expireAt.toLocaleDateString('zh-CN')} 到期，续费可恢复全部权益`,
            new Date(),
          );
        }
      }
    });

    return of(expiredCount);
  }

  getSubscription(userId: string): Observable<SVIPSubscription | null> {
    const subscriptionId = this.userSubscriptions.get(userId);
    if (!subscriptionId) {
      return of(null);
    }

    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return of(null);
    }

    if (subscription.status === 'active' && subscription.expireAt < new Date()) {
      subscription.status = 'expired';
      this.subscriptions.set(subscriptionId, subscription);
    }

    return of(subscription);
  }

  useBenefit(userId: string, benefitType: SVIPBenefitType): Observable<SVIPBenefit | null> {
    const subscriptionId = this.userSubscriptions.get(userId);
    if (!subscriptionId) {
      return of(null);
    }

    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription || subscription.status !== 'active') {
      return of(null);
    }

    const benefits = this.benefits.get(subscriptionId) || [];
    const benefit = benefits.find(b => b.type === benefitType && !b.usedAt);

    if (!benefit) {
      return of(null);
    }

    benefit.usedAt = new Date();
    this.benefits.set(subscriptionId, benefits);

    return of(benefit);
  }

  getBenefits(subscriptionId: string): Observable<SVIPBenefit[]> {
    const benefits = this.benefits.get(subscriptionId) || [];
    return of(benefits);
  }

  private createBenefitsForSubscription(
    subscriptionId: string,
    benefitNames: string[],
    expiresAt: Date,
  ): SVIPBenefit[] {
    const benefitTypeMap: Record<string, SVIPBenefitType> = {
      '积分翻倍': 'points_multiplier',
      '免费配送': 'free_delivery',
      '专属折扣': 'exclusive_discount',
    };

    return benefitNames.map(name => ({
      benefitId: this.generateId(),
      subscriptionId,
      type: benefitTypeMap[name] || 'points_multiplier',
      expiresAt,
    }));
  }

  // ════════════════════════════════════════════════════════════════
  // BS-0286: SVIP续费阶梯优惠（1年95折/2年9折/3年85折）
  // ════════════════════════════════════════════════════════════════

  /**
   * BS-0286: 获取续费阶梯优惠信息
   * @param annualPrice 年度订阅价格
   * @returns 各续费档位的折扣信息
   */
  getRenewalTiers(annualPrice: number): RenewalTierDiscount[] {
    const tiers: Array<{ years: number; discount: number }> = [
      { years: 1, discount: 0.95 },
      { years: 2, discount: 0.90 },
      { years: 3, discount: 0.85 },
    ]

    return tiers.map(t => {
      const originalTotal = annualPrice * t.years
      const totalPrice = Math.round(originalTotal * t.discount)
      const monthlyPrice = Math.round(totalPrice / (t.years * 12))

      return {
        years: t.years,
        discount: t.discount,
        totalPrice,
        monthlyPrice,
      }
    })
  }

  /**
   * BS-0286: 计算指定续费年限的折后价格
   * @param annualPrice 年度订阅价格
   * @param years 续费年限（1/2/3）
   * @returns 折扣计算结果
   * @throws 不支持非1/2/3年以外的续费年限
   */
  calculateRenewalDiscount(annualPrice: number, years: number): RenewalDiscountResult {
    const allTiers = this.getRenewalTiers(annualPrice)

    const tier = allTiers.find(t => t.years === years)
    if (!tier) {
      throw new Error(`不支持的续费年限: ${years}。支持 1/2/3 年续费`)
    }

    return {
      originalTotal: annualPrice * years,
      discountedTotal: tier.totalPrice,
      savedAmount: (annualPrice * years) - tier.totalPrice,
      discount: tier.discount,
      years,
      allTiers,
    }
  }

  /**
   * BS-0286: 带阶梯优惠的续费操作
   * 在 renewSubscription 基础上叠加折扣（用于展示折后价）
   */
  renewWithDiscount(
    subscriptionId: string,
    years: number,
  ): Observable<{ subscription: SVIPSubscription | null; discount: RenewalDiscountResult | null }> {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) {
      return of({ subscription: null, discount: null })
    }

    const plan = this.plans.get(subscription.planId)
    if (!plan) {
      return of({ subscription: null, discount: null })
    }

    // 计算折扣
    const annualPrice = plan.price
    const discount = this.calculateRenewalDiscount(annualPrice, years)

    // 延长订阅时间
    const totalDays = plan.durationDays * years
    subscription.expireAt = new Date(subscription.expireAt)
    subscription.expireAt.setDate(subscription.expireAt.getDate() + totalDays)
    subscription.status = 'active'
    subscription.autoRenew = true
    this.subscriptions.set(subscriptionId, subscription)

    return of({ subscription, discount })
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
