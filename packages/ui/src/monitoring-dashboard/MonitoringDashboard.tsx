/**
 * 监控告警 - Panel (V10 Day 9 Phase 93)
 */

import React, { useState } from 'react'
import { useMetrics, useAlertRules, useAlerts, useSilenceAlert } from './useMonitoringDashboard'
import {
  SEVERITY_LABELS, SEVERITY_COLORS, STATUS_LABELS,
  type AlertSeverity, type AlertStatus,
} from './types'

export interface MonitoringDashboardProps {
  variant?: 'pc' | 'h5' | 'app' | 'pad' | 'miniprogram'
}

export function MonitoringDashboard({ variant = 'pc' }: MonitoringDashboardProps) {
  const { data: metrics = [] } = useMetrics()
  const { data: rules = [] } = useAlertRules()
  const { data: alerts = [] } = useAlerts()
  const silence = useSilenceAlert()

  const isCompact = variant === 'h5' || variant === 'app' || variant === 'miniprogram'

  const counts: Record<AlertSeverity, number> = { info: 0, warning: 0, error: 0, critical: 0 }
  alerts.filter((a) => a.status === 'firing').forEach((a) => counts[a.severity]++)

  return (
    <div
      data-testid="monitoring-dashboard"
      data-variant={variant}
      style={{
        fontFamily: 'system-ui, sans-serif',
        padding: isCompact ? 12 : 20,
        background: '#f0f2f5',
        minHeight: '100vh',
      }}
    >
      <h1 style={{ fontSize: isCompact ? 18 : 24, margin: '0 0 16px' }}>监控告警中心</h1>

      {/* 严重度计数 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isCompact ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: 12, marginBottom: 20,
        }}
      >
        {(['critical', 'error', 'warning', 'info'] as AlertSeverity[]).map((sev) => (
          <div
            key={sev}
            data-testid={`severity-${sev}`}
            data-count={counts[sev]}
            style={{
              background: '#fff', padding: 16, borderRadius: 8,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              borderLeft: `4px solid ${SEVERITY_COLORS[sev]}`,
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 700, color: SEVERITY_COLORS[sev] }}>{counts[sev]}</div>
            <div style={{ fontSize: 12, color: '#595959', marginTop: 4 }}>{SEVERITY_LABELS[sev]} (告警中)</div>
          </div>
        ))}
      </div>

      {/* 当前告警列表 */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, margin: '0 0 12px' }}>告警列表</h2>
        {alerts.length === 0 ? (
          <div style={{ background: '#fff', padding: 24, textAlign: 'center', color: '#8c8c8c', borderRadius: 8 }}>
            暂无告警
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {alerts.map((a) => (
              <div
                key={a.id}
                data-testid={`alert-${a.id}`}
                data-severity={a.severity}
                data-status={a.status}
                style={{
                  background: '#fff', padding: 12, borderRadius: 6,
                  borderLeft: `4px solid ${SEVERITY_COLORS[a.severity]}`,
                  opacity: a.status === 'resolved' ? 0.6 : 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <strong>{a.ruleName}</strong>
                      <span style={{
                        padding: '1px 8px', fontSize: 11, borderRadius: 10,
                        background: `${SEVERITY_COLORS[a.severity]}20`, color: SEVERITY_COLORS[a.severity],
                      }}>{SEVERITY_LABELS[a.severity]}</span>
                      <span style={{
                        padding: '1px 8px', fontSize: 11, borderRadius: 10,
                        background: a.status === 'firing' ? '#f5222d20' : '#52c41a20',
                        color: a.status === 'firing' ? '#f5222d' : '#52c41a',
                      }}>{STATUS_LABELS[a.status]}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#595959', marginTop: 4, fontFamily: 'monospace' }}>{a.message}</div>
                    <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>
                      触发 {new Date(a.firedAt).toLocaleString()}
                      {a.resolvedAt && ` · 恢复 ${new Date(a.resolvedAt).toLocaleString()}`}
                    </div>
                  </div>
                  {a.status === 'firing' && (
                    <button
                      type="button"
                      onClick={() => silence.mutate({ id: a.id, durationSec: 3600 })}
                      data-testid={`silence-${a.id}`}
                      style={{
                        padding: '4px 12px', fontSize: 12,
                        border: '1px solid #d9d9d9', borderRadius: 4,
                        background: '#fff', cursor: 'pointer',
                      }}
                    >
                      静默 1h
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 告警规则 + 指标定义 (双栏) */}
      <div style={{ display: 'grid', gridTemplateColumns: isCompact ? '1fr' : '1fr 1fr', gap: 16 }}>
        <div style={{ background: '#fff', padding: 16, borderRadius: 8 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>告警规则 ({rules.length})</h3>
          {rules.map((r) => (
            <div
              key={r.id}
              data-testid={`rule-${r.id}`}
              style={{ padding: 8, borderBottom: '1px solid #f0f0f0', fontSize: 13 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{r.name}</strong>
                <span style={{ color: SEVERITY_COLORS[r.severity], fontSize: 11 }}>
                  {SEVERITY_LABELS[r.severity]}
                </span>
              </div>
              <code style={{ fontSize: 11, color: '#8c8c8c' }}>
                {r.metric} {r.comparator} {r.threshold} ({r.durationSec}s)
              </code>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', padding: 16, borderRadius: 8 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>指标定义 ({metrics.length})</h3>
          {metrics.map((m) => (
            <div
              key={m.name}
              data-testid={`metric-${m.name}`}
              style={{ padding: 8, borderBottom: '1px solid #f0f0f0', fontSize: 13 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <code style={{ fontSize: 12 }}>{m.name}</code>
                <span style={{ color: '#8c8c8c', fontSize: 11 }}>{m.type} · {m.unit}</span>
              </div>
              <div style={{ fontSize: 11, color: '#8c8c8c' }}>{m.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
