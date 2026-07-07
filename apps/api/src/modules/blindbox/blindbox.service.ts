import { Injectable } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import {
  BlindBoxPlan,
  BlindBoxDrawRecord,
  BlindBoxTier,
  BlindBoxStatus,
  DrawType,
} from './blindbox.entity';

interface CreatePlanInput {
  name: string;
  tiers: BlindBoxTier[];
  guaranteePityCount: number;
}

interface PityCounter {
  count: number;
  lastHighTierWin: number;
}

@Injectable()
export class BlindboxService {
  private readonly plans: Map<string, BlindBoxPlan> = new Map();
  private readonly records: Map<string, BlindBoxDrawRecord[]> = new Map();
  private readonly pityCounters: Map<string, PityCounter> = new Map();

  createPlan(input: CreatePlanInput): Observable<BlindBoxPlan> {
    const planId = this.generateId();
    const plan: BlindBoxPlan = {
      planId,
      name: input.name,
      tiers: input.tiers,
      guaranteePityCount: input.guaranteePityCount,
      status: BlindBoxStatus.ACTIVE,
      createdAt: new Date(),
    };
    this.plans.set(planId, plan);
    return of(plan);
  }

  drawSingle(userId: string, planId: string): Observable<BlindBoxDrawRecord | null> {
    const plan = this.plans.get(planId);
    if (!plan || plan.status !== BlindBoxStatus.ACTIVE) {
      return of(null);
    }

    const result = this.executeDraw(userId, planId, plan, DrawType.SINGLE);
    return of(result);
  }

  drawBatch10(userId: string, planId: string): Observable<BlindBoxDrawRecord[]> {
    const plan = this.plans.get(planId);
    if (!plan || plan.status !== BlindBoxStatus.ACTIVE) {
      return of([]);
    }

    const results: BlindBoxDrawRecord[] = [];
    for (let i = 0; i < 10; i++) {
      const result = this.executeDraw(userId, planId, plan, DrawType.BATCH10);
      if (result) {
        results.push(result);
      }
    }
    return of(results);
  }

  getProbability公示(planId: string): Observable<{ tiers: { name: string; probability: number }[]; sum: number } | null> {
    const plan = this.plans.get(planId);
    if (!plan) {
      return of(null);
    }

    const tiers = plan.tiers.map((t) => ({
      name: t.name,
      probability: t.probability,
    }));
    const sum = tiers.reduce((acc, t) => acc + t.probability, 0);

    return of({ tiers, sum });
  }

  getPrizePool(planId: string): Observable<{ planId: string; name: string; prizePools: { tierId: string; tierName: string; prizes: { prizeId: string; name: string; stock: number; weight: number }[] }[] } | null> {
    const plan = this.plans.get(planId);
    if (!plan) {
      return of(null);
    }

    const prizePools = plan.tiers.map((tier) => ({
      tierId: tier.tierId,
      tierName: tier.name,
      prizes: tier.prizes.map((p) => ({
        prizeId: p.prizeId,
        name: p.name,
        stock: p.stock,
        weight: p.weight,
      })),
    }));

    return of({
      planId,
      name: plan.name,
      prizePools,
    });
  }

  getDrawHistory(userId: string, planId: string, limit: number = 20): Observable<BlindBoxDrawRecord[]> {
    const key = `${userId}:${planId}`;
    const history = this.records.get(key) || [];
    const sorted = history.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return of(sorted.slice(0, limit));
  }

  private executeDraw(
    userId: string,
    planId: string,
    plan: BlindBoxPlan,
    drawType: DrawType,
  ): BlindBoxDrawRecord | null {
    const pityKey = `${userId}:${planId}`;
    const pity = this.pityCounters.get(pityKey) || { count: 0, lastHighTierWin: 0 };

    pity.count++;
    const totalDrawsSinceHighTier = pity.count - pity.lastHighTierWin;
    const isPityTriggered = totalDrawsSinceHighTier >= plan.guaranteePityCount;

    const selectedTier = this.selectTier(plan.tiers, isPityTriggered, pity.lastHighTierWin);

    if (!selectedTier) {
      return null;
    }

    const prize = this.selectPrize(selectedTier);
    if (!prize) {
      return null;
    }

    if (prize.stock <= 0) {
      return this.executeDraw(userId, planId, plan, drawType);
    }

    prize.stock--;

    const isHighTier = this.isHighTierPrize(selectedTier.tierId);
    if (isHighTier) {
      pity.lastHighTierWin = pity.count;
    }

    this.pityCounters.set(pityKey, pity);

    const record: BlindBoxDrawRecord = {
      recordId: this.generateId(),
      planId,
      userId,
      tier: selectedTier.name,
      prizeId: prize.prizeId,
      prizeName: prize.name,
      drawType,
      createdAt: new Date(),
    };

    const historyKey = `${userId}:${planId}`;
    const history = this.records.get(historyKey) || [];
    history.push(record);
    this.records.set(historyKey, history);

    return record;
  }

  private selectTier(
    tiers: BlindBoxTier[],
    isPityTriggered: boolean,
    lastHighTierWin: number,
  ): BlindBoxTier | null {
    if (tiers.length === 0) {
      return null;
    }

    if (isPityTriggered && lastHighTierWin > 0) {
      const highTier = tiers.find((t) => t.tierId === '1' || t.tierId === 'tier_1');
      if (highTier) {
        return highTier;
      }
    }

    const totalProbability = tiers.reduce((sum, t) => sum + t.probability, 0);
    const random = Math.random() * totalProbability;

    let cumulative = 0;
    for (const tier of tiers) {
      cumulative += tier.probability;
      if (random <= cumulative) {
        return tier;
      }
    }

    return tiers[tiers.length - 1];
  }

  private selectPrize(tier: BlindBoxTier): { prizeId: string; name: string; stock: number; weight: number } | null {
    const availablePrizes = tier.prizes.filter((p) => p.stock > 0);
    if (availablePrizes.length === 0) {
      return null;
    }

    const totalWeight = availablePrizes.reduce((sum, p) => sum + p.weight, 0);
    const random = Math.random() * totalWeight;

    let cumulative = 0;
    for (const prize of availablePrizes) {
      cumulative += prize.weight;
      if (random <= cumulative) {
        return { ...prize };
      }
    }

    return availablePrizes[availablePrizes.length - 1];
  }

  private isHighTierPrize(tierId: string): boolean {
    return tierId === '1' || tierId === 'tier_1' || tierId === '2' || tierId === 'tier_2';
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
