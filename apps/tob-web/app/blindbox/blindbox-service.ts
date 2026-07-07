/**
 * blindbox-service.ts — 盲盒抽奖 API 服务层
 */
import { MOCK_DRAW_HISTORY, getPlanById, type BlindBoxPlan, type BlindBoxPrize, type BlindBoxDrawRecord } from './blindbox-data'

const TENANT = 'demo-tenant'

function buildHeaders(): HeadersInit {
  return {
    'x-tenant-id': TENANT
  }
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...buildHeaders(),
      ...(init.headers ?? {})
    },
    cache: 'no-store'
  })
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }
  return (await response.json()) as T
}

/**
 * 加载盲盒计划（含概率配置）
 */
export async function loadBlindBoxPlan(planId: string): Promise<BlindBoxPlan | null> {
  try {
    const plan = await requestJson<BlindBoxPlan>(`/api/blindbox/${planId}/probabilities`)
    return plan
  } catch {
    return getPlanById(planId) ?? null
  }
}

/**
 * 加载奖池（各奖项库存）
 */
export async function loadPrizePool(planId: string): Promise<BlindBoxPrize[]> {
  try {
    const prizes = await requestJson<BlindBoxPrize[]>(`/api/blindbox/${planId}/prize-pool`)
    return prizes
  } catch {
    const plan = getPlanById(planId)
    if (!plan) return []
    return plan.tiers.flatMap(tier => tier.prizes)
  }
}

/**
 * 加载抽奖记录
 */
export async function loadDrawHistory(planId: string, userId?: string, limit = 10): Promise<BlindBoxDrawRecord[]> {
  try {
    const query = new URLSearchParams({ limit: String(limit) })
    if (userId) query.set('userId', userId)
    const records = await requestJson<BlindBoxDrawRecord[]>(`/api/blindbox/${planId}/history?${query}`)
    return records
  } catch {
    return MOCK_DRAW_HISTORY.slice(0, limit)
  }
}

export type DrawType = 'single' | 'batch10'

/**
 * 发起抽奖
 */
export async function postDraw(planId: string, drawType: DrawType): Promise<{ success: boolean; prize?: BlindBoxDrawRecord; message?: string }> {
  const endpoint = drawType === 'batch10'
    ? `/api/blindbox/${planId}/draw/batch`
    : `/api/blindbox/${planId}/draw`

  try {
    const result = await requestJson<{ success: boolean; prize: BlindBoxDrawRecord }>(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' }
    })
    return result
  } catch {
    // Mock fallback: 返回一个固定记录
    const fallbackRecord = MOCK_DRAW_HISTORY[MOCK_DRAW_HISTORY.length - 1] ?? {
      recordId: 'rec-default',
      tier: '四等奖',
      prizeName: '5元优惠券',
      drawType: 'single' as const,
      createdAt: new Date().toISOString()
    }
    return {
      success: true,
      prize: {
        recordId: `rec-${Date.now()}`,
        tier: fallbackRecord.tier,
        prizeName: fallbackRecord.prizeName,
        drawType,
        createdAt: new Date().toISOString()
      }
    }
  }
}
