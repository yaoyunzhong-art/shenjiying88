/**
 * useWebhook Mock (V10 Sprint 2 Day 21)
 *
 * 替代 @tanstack/react-query 的 useQuery/useMutation
 * 让 WebhookList.test.tsx 等在 node:test 环境下 SSR 渲染
 */

import type {
  WebhookEndpointView,
  WebhookDeliveryView,
  WebhookPlatform,
  WebhookEventType,
} from './types'

const MOCK_ENDPOINTS: WebhookEndpointView[] = [
  {
    id: 'wh-001',
    name: '飞书运营群',
    platform: 'feishu',
    url: 'https://open.feishu.cn/open-apis/bot/v2/hook/xxx',
    events: ['license.expired', 'canary.promoted', 'monitoring.alert.fired'],
    status: 'active',
    maxRetries: 3,
    secretFingerprint: 'ey***xz',
    description: '运维告警通知',
    createdAt: '2026-06-25T08:00:00Z',
    updatedAt: '2026-06-28T09:30:00Z',
  },
  {
    id: 'wh-002',
    name: '钉钉销售群',
    platform: 'dingtalk',
    url: 'https://oapi.dingtalk.com/robot/send?access_token=xxx',
    events: ['insight.generated'],
    status: 'paused',
    maxRetries: 5,
    secretFingerprint: 'SE***ET',
    description: '销售洞察推送',
    createdAt: '2026-06-26T10:00:00Z',
    updatedAt: '2026-06-27T14:20:00Z',
  },
]

const MOCK_DELIVERIES: WebhookDeliveryView[] = [
  {
    id: 'whd-001',
    endpointId: 'wh-001',
    eventType: 'license.expired',
    status: 'success',
    attempt: 0,
    maxAttempts: 4,
    responseStatus: 200,
    createdAt: '2026-06-28T09:00:00Z',
    completedAt: '2026-06-28T09:00:00.120Z',
    durationMs: 120,
  },
  {
    id: 'whd-002',
    endpointId: 'wh-001',
    eventType: 'canary.promoted',
    status: 'retrying',
    attempt: 1,
    maxAttempts: 4,
    responseStatus: 502,
    error: 'HTTP 502',
    createdAt: '2026-06-28T09:30:00Z',
    durationMs: 1500,
  },
  {
    id: 'whd-003',
    endpointId: 'wh-002',
    eventType: 'insight.generated',
    status: 'dead_letter',
    attempt: 3,
    maxAttempts: 4,
    responseStatus: 0,
    error: 'Network unreachable after 3 retries',
    createdAt: '2026-06-28T08:00:00Z',
    durationMs: 30000,
  },
]

export function useWebhookList() {
  return { data: MOCK_ENDPOINTS, isPending: false, isLoading: false }
}

export function useWebhookDeliveries(endpointId?: string) {
  const items = endpointId
    ? MOCK_DELIVERIES.filter((d) => d.endpointId === endpointId)
    : MOCK_DELIVERIES
  return { data: items, isPending: false, isLoading: false }
}

export function useCreateWebhook() {
  return {
    mutate: async (req: any) => ({
      id: `wh-mock-${Date.now()}`,
      ...req,
      status: 'active',
      secretFingerprint: 'xx***xx',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    mutateAsync: async (req: any) => ({
      id: `wh-mock-${Date.now()}`,
      ...req,
      status: 'active',
      secretFingerprint: 'xx***xx',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    isPending: false,
  }
}

export function useDeleteWebhook() {
  return { mutate: async (_id: string) => null, mutateAsync: async (_id: string) => null, isPending: false }
}

export function useTestWebhook() {
  return {
    mutate: async (_args: { id: string; eventType: WebhookEventType }) => null,
    mutateAsync: async (_args: { id: string; eventType: WebhookEventType }) => ({ status: 'success' as const, responseStatus: 200 }),
    isPending: false,
  }
}

export function useUpdateWebhook() {
  return {
    mutate: async (_args: { id: string; patch: any }) => null,
    mutateAsync: async (_args: { id: string; patch: any }) => ({ ...MOCK_ENDPOINTS[0], updatedAt: new Date().toISOString() }),
    isPending: false,
  }
}
