/**
 * 监控告警 - Hooks (V10 Day 9)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  MetricDefinition, MetricPoint, AlertRule, Alert, AlertSeverity,
} from './types'

const MOCK_METRICS: MetricDefinition[] = [
  { name: 'http.error.rate', type: 'gauge', unit: 'ratio', description: 'HTTP 错误率' },
  { name: 'ai.latency.avg', type: 'gauge', unit: 'ms', description: 'AI 平均延迟' },
  { name: 'cpu.usage_percent', type: 'gauge', unit: '%', description: 'CPU 使用率' },
  { name: 'http.request.count', type: 'counter', unit: 'count', description: 'HTTP 请求' },
]

const MOCK_RULES: AlertRule[] = [
  { id: 'rule-1', name: '高错误率', metric: 'http.error.rate', comparator: 'gt', threshold: 0.05,
    durationSec: 60, severity: 'error', channels: ['in_app'], enabled: true,
    createdBy: 'system', createdAt: '2026-06-01', updatedAt: '2026-06-28' },
  { id: 'rule-2', name: 'AI 延迟', metric: 'ai.latency.avg', comparator: 'gt', threshold: 1000,
    durationSec: 30, severity: 'warning', channels: ['in_app'], enabled: true,
    createdBy: 'system', createdAt: '2026-06-01', updatedAt: '2026-06-28' },
  { id: 'rule-3', name: 'CPU 高占用', metric: 'cpu.usage_percent', comparator: 'gt', threshold: 80,
    durationSec: 120, severity: 'critical', channels: ['email'], enabled: true,
    createdBy: 'system', createdAt: '2026-06-01', updatedAt: '2026-06-28' },
]

const MOCK_ALERTS: Alert[] = [
  { id: 'alert-1', ruleId: 'rule-3', ruleName: 'CPU 高占用', severity: 'critical', status: 'firing',
    value: 92, threshold: 80, message: 'cpu.usage_percent > 80 (current: 92.00)',
    firedAt: '2026-06-28T10:30:00Z', receivers: ['admin@shenjiying88.com'] },
  { id: 'alert-2', ruleId: 'rule-2', ruleName: 'AI 延迟', severity: 'warning', status: 'firing',
    value: 1200, threshold: 1000, message: 'ai.latency.avg > 1000 (current: 1200.00)',
    firedAt: '2026-06-28T10:25:00Z', receivers: ['ai-team@shenjiying88.com'] },
  { id: 'alert-3', ruleId: 'rule-1', ruleName: '高错误率', severity: 'error', status: 'resolved',
    value: 0.08, threshold: 0.05, message: 'http.error.rate > 0.05 (current: 0.08)',
    firedAt: '2026-06-28T09:00:00Z', resolvedAt: '2026-06-28T09:15:00Z', receivers: [] },
]

async function fetchMetricsApi(): Promise<MetricDefinition[]> {
  await new Promise((r) => setTimeout(r, 60))
  return MOCK_METRICS
}
async function fetchRulesApi(): Promise<AlertRule[]> {
  await new Promise((r) => setTimeout(r, 60))
  return MOCK_RULES
}
async function fetchAlertsApi(): Promise<Alert[]> {
  await new Promise((r) => setTimeout(r, 60))
  return MOCK_ALERTS
}

export function useMetrics() {
  return useQuery({ queryKey: ['metrics'], queryFn: fetchMetricsApi, staleTime: 60 * 1000 })
}
export function useAlertRules() {
  return useQuery({ queryKey: ['alert-rules'], queryFn: fetchRulesApi, staleTime: 60 * 1000 })
}
export function useAlerts() {
  return useQuery({ queryKey: ['alerts'], queryFn: fetchAlertsApi, staleTime: 10 * 1000 })
}
export function useSilenceAlert() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, durationSec }: { id: string; durationSec: number }) => {
      await new Promise((r) => setTimeout(r, 50))
      return MOCK_ALERTS.find((a) => a.id === id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  })
}
