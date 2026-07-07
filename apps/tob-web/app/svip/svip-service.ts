import { MOCK_PLANS, MOCK_SUBSCRIPTION, MOCK_BENEFITS, type SVIPPlan, type SVIPSubscription, type SVIPBenefit, type SVIPBenefitType } from './svip-data';

const TENANT = 'demo-tenant';

function buildHeaders(): HeadersInit {
  return {
    'x-tenant-id': TENANT,
  };
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...buildHeaders(),
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function loadPlans(): Promise<SVIPPlan[]> {
  try {
    const plans = await requestJson<SVIPPlan[]>('/api/svip/plans');
    return plans;
  } catch {
    return MOCK_PLANS;
  }
}

export async function loadSubscription(userId: string): Promise<SVIPSubscription | null> {
  try {
    const subscription = await requestJson<SVIPSubscription | null>(`/api/svip/subscription/${userId}`);
    return subscription;
  } catch {
    if (userId === MOCK_SUBSCRIPTION.userId) {
      return MOCK_SUBSCRIPTION;
    }
    return null;
  }
}

export async function subscribe(userId: string, planId: string): Promise<SVIPSubscription | null> {
  try {
    const subscription = await requestJson<SVIPSubscription | null>('/api/svip/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId, planId }),
    });
    return subscription;
  } catch {
    return {
      subscriptionId: `sub-${Date.now()}`,
      userId,
      planId,
      status: 'active',
      startAt: new Date(),
      expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      autoRenew: true,
      createdAt: new Date(),
    };
  }
}

export async function cancel(subscriptionId: string): Promise<SVIPSubscription | null> {
  try {
    const subscription = await requestJson<SVIPSubscription | null>(`/api/svip/${subscriptionId}/cancel`, {
      method: 'POST',
    });
    return subscription;
  } catch {
    return {
      subscriptionId,
      userId: 'demo-user',
      planId: 'svip-monthly',
      status: 'cancelled',
      startAt: new Date(),
      expireAt: new Date(),
      autoRenew: false,
      createdAt: new Date(),
    };
  }
}

export async function renew(subscriptionId: string): Promise<SVIPSubscription | null> {
  try {
    const subscription = await requestJson<SVIPSubscription | null>(`/api/svip/${subscriptionId}/renew`, {
      method: 'POST',
    });
    return subscription;
  } catch {
    return {
      subscriptionId,
      userId: 'demo-user',
      planId: 'svip-monthly',
      status: 'active',
      startAt: new Date(),
      expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      autoRenew: true,
      createdAt: new Date(),
    };
  }
}

export async function useBenefit(userId: string, benefitType: SVIPBenefitType): Promise<SVIPBenefit | null> {
  try {
    const subscription = await loadSubscription(userId);
    if (!subscription) return null;
    const benefit = await requestJson<SVIPBenefit | null>(`/api/svip/${subscription.subscriptionId}/benefit`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId, benefitType }),
    });
    return benefit;
  } catch {
    return {
      benefitId: `ben-${Date.now()}`,
      subscriptionId: MOCK_SUBSCRIPTION.subscriptionId,
      type: benefitType,
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    };
  }
}

export async function loadBenefits(subscriptionId: string): Promise<SVIPBenefit[]> {
  try {
    const benefits = await requestJson<SVIPBenefit[]>(`/api/svip/${subscriptionId}/benefits`);
    return benefits;
  } catch {
    return MOCK_BENEFITS.filter(b => b.subscriptionId === subscriptionId);
  }
}
