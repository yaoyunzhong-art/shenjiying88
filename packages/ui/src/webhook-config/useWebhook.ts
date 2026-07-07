/**
 * Phase 95 Webhook Hooks (V10 Sprint 2 Day 21)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  WebhookEndpointView,
  WebhookDeliveryView,
  WebhookPlatform,
  WebhookEventType,
  WebhookStatus,
  WebhookDeliveryStatus,
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

async function fetchEndpointsApi(): Promise<WebhookEndpointView[]> {
  await new Promise((r) => setTimeout(r, 50))
  return MOCK_ENDPOINTS
}

async function fetchDeliveriesApi(endpointId?: string): Promise<WebhookDeliveryView[]> {
  await new Promise((r) => setTimeout(r, 50))
  return endpointId
    ? MOCK_DELIVERIES.filter((d) => d.endpointId === endpointId)
    : MOCK_DELIVERIES
}

async function createWebhookApi(req: {
  name: string
  platform: WebhookPlatform
  url: string
  secret: string
  events: WebhookEventType[]
  maxRetries?: number
  description?: string
}): Promise<WebhookEndpointView> {
  await new Promise((r) => setTimeout(r, 200))
  return {
    id: `wh-${Date.now().toString(36)}`,
    name: req.name,
    platform: req.platform,
    url: req.url,
    events: req.events,
    status: 'active',
    maxRetries: req.maxRetries ?? 3,
    secretFingerprint: `${req.secret.slice(0, 2)}***${req.secret.slice(-2)}`,
    description: req.description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

async function deleteWebhookApi(id: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 100))
}

async function testWebhookApi(id: string, eventType: WebhookEventType): Promise<{
  status: WebhookDeliveryStatus
  responseStatus?: number
}> {
  await new Promise((r) => setTimeout(r, 300))
  return { status: 'success', responseStatus: 200 }
}

async function updateWebhookApi(id: string, patch: Partial<{
  status: WebhookStatus
  events: WebhookEventType[]
}>): Promise<WebhookEndpointView> {
  await new Promise((r) => setTimeout(r, 150))
  return {
    ...MOCK_ENDPOINTS[0] as WebhookEndpointView,
    ...patch as WebhookEndpointView,
    id,
    updatedAt: new Date().toISOString(),
  } as WebhookEndpointView
}

export function useWebhookList() {
  return useQuery({
    queryKey: ['webhooks'],
    queryFn: fetchEndpointsApi,
    staleTime: 30 * 1000,
  })
}

export function useWebhookDeliveries(endpointId?: string) {
  return useQuery({
    queryKey: ['webhook-deliveries', endpointId],
    queryFn: () => fetchDeliveriesApi(endpointId),
    staleTime: 15 * 1000,
  })
}

export function useCreateWebhook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createWebhookApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks'] }),
  })
}

export function useDeleteWebhook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteWebhookApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks'] }),
  })
}

export function useTestWebhook() {
  return useMutation({
    mutationFn: (args: { id: string; eventType: WebhookEventType }) =>
      testWebhookApi(args.id, args.eventType),
  })
}

export function useUpdateWebhook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { id: string; patch: Partial<{ status: WebhookStatus; events: WebhookEventType[] }> }) =>
      updateWebhookApi(args.id, args.patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks'] }),
  })
}
