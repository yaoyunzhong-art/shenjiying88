/**
 * AI 异常告警面板 - Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AiDecision, AnomalyAlert, AnomalyTrendPoint } from './types'
import { MOCK_DECISIONS, MOCK_ANOMALY_ALERTS, MOCK_TREND_DATA } from './useAnomalyAlert.mock'

async function fetchDecisionsApi(): Promise<AiDecision[]> {
  await new Promise((r) => setTimeout(r, 50))
  return MOCK_DECISIONS
}

async function fetchAlertsApi(): Promise<AnomalyAlert[]> {
  await new Promise((r) => setTimeout(r, 50))
  return MOCK_ANOMALY_ALERTS
}

async function fetchTrendApi(): Promise<AnomalyTrendPoint[]> {
  await new Promise((r) => setTimeout(r, 50))
  return MOCK_TREND_DATA
}

async function updateAlertStatusApi({ id, status }: { id: string; status: AnomalyAlert['status'] }): Promise<AnomalyAlert | undefined> {
  await new Promise((r) => setTimeout(r, 50))
  const alert = MOCK_ANOMALY_ALERTS.find((a) => a.id === id)
  if (alert) alert.status = status
  return alert
}

export function useAiDecisions() {
  return useQuery({ queryKey: ['ai-decisions'], queryFn: fetchDecisionsApi, staleTime: 60 * 1000 })
}

export function useAnomalyAlerts() {
  return useQuery({ queryKey: ['anomaly-alerts'], queryFn: fetchAlertsApi, staleTime: 10 * 1000 })
}

export function useAnomalyTrend() {
  return useQuery({ queryKey: ['anomaly-trend'], queryFn: fetchTrendApi, staleTime: 60 * 1000 })
}

export function useUpdateAlertStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateAlertStatusApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['anomaly-alerts'] })
    },
  })
}
