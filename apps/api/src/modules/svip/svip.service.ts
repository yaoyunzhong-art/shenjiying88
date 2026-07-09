import { Injectable } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { SVIPPlan, SVIPSubscription, SVIPBenefit, SVIPStatus, SVIPBenefitType } from './svip.entity';

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

  checkAndExpire(): Observable<number> {
    const now = new Date();
    let expiredCount = 0;

    this.subscriptions.forEach((subscription) => {
      if (subscription.status === 'active' && subscription.expireAt < now) {
        subscription.status = 'expired';
        this.subscriptions.set(subscription.subscriptionId, subscription);
        expiredCount++;
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

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
