/**
 * AI 异常告警面板 (C-AI前端组件)
 * AI决策规则执行结果展示 + 异常告警管理
 */

import React, { useState } from 'react'
import {
  useAiDecisions, useAnomalyAlerts, useAnomalyTrend, useUpdateAlertStatus,
} from './useAnomalyAlert'
import {
  ANOMALY_TYPE_LABELS, ANOMALY_TYPE_COLORS,
  SEVERITY_LABELS, SEVERITY_COLORS, STATUS_LABELS,
  type AnomalySeverity, type AnomalyStatus, type AnomalyType,
} from './types'

export interface AnomalyAlertPanelProps {
  variant?: 'pc' | 'h5' | 'app' | 'pad' | 'miniprogram'
}

export function AnomalyAlertPanel({ variant = 'pc' }: AnomalyAlertPanelProps) {
  const { data: decisions = [] } = useAiDecisions()
  const { data: alerts = [] } = useAnomalyAlerts()
  const { data: trend = [] } = useAnomalyTrend()
  const updateStatus = useUpdateAlertStatus()

  const [activeTab, setActiveTab] = useState<'anomalies' | 'decisions'>('anomalies')
  const isCompact = variant === 'h5' || variant === 'app' || variant === 'miniprogram'

  const openAlerts = alerts.filter((a) => a.status === 'open')
  const investigatingAlerts = alerts.filter((a) => a.status === 'investigating')
  const resolvedAlerts = alerts.filter((a) => a.status === 'resolved' || a.status === 'dismissed')

  // Severity counts
  const severityCounts: Record<AnomalySeverity, number> = { info: 0, warning: 0, critical: 0 }
  alerts.filter((a) => a.status !== 'dismissed').forEach((a) => severityCounts[a.severity]++)

  // Anomaly type counts
  const anomalyTypeCounts: Record<string, number> = {}
  alerts.forEach((a) => {
    anomalyTypeCounts[a.anomalyType] = (anomalyTypeCounts[a.anomalyType] || 0) + 1
  })

  const handleStatusChange = (id: string, status: AnomalyStatus) => {
    updateStatus.mutate({ id, status })
  }

  return (
    <div
      data-testid="anomaly-alert-panel"
      data-variant={variant}
      style={{
        fontFamily: 'system-ui, sans-serif',
        padding: isCompact ? 12 : 20,
        background: '#f0f2f5',
        minHeight: '100vh',
      }}
    >
      <h1 style={{ fontSize: isCompact ? 18 : 24, margin: '0 0 16px' }}>
        AI 异常告警中心
      </h1>

      {/* 严重度概览 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isCompact ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)',
          gap: 12, marginBottom: 20,
        }}
      >
        {(['critical', 'warning', 'info'] as AnomalySeverity[]).map((sev) => (
          <div
            key={sev}
            data-testid={`severity-${sev}`}
            data-count={severityCounts[sev]}
            style={{
              background: '#fff', padding: 16, borderRadius: 8,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              borderLeft: `4px solid ${SEVERITY_COLORS[sev]}`,
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 700, color: SEVERITY_COLORS[sev] }}>
              {severityCounts[sev]}
            </div>
            <div style={{ fontSize: 12, color: '#595959', marginTop: 4 }}>
              {SEVERITY_LABELS[sev]} (未处理)
            </div>
          </div>
        ))}
      </div>

      {/* Tab 切换 */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setActiveTab('anomalies')}
          data-testid="tab-anomalies"
          style={{
            padding: '8px 20px', fontSize: 14, cursor: 'pointer',
            border: '1px solid #d9d9d9', borderRadius: '4px 0 0 4px',
            background: activeTab === 'anomalies' ? '#1677ff' : '#fff',
            color: activeTab === 'anomalies' ? '#fff' : '#333',
          }}
        >
          异常告警 ({alerts.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('decisions')}
          data-testid="tab-decisions"
          style={{
            padding: '8px 20px', fontSize: 14, cursor: 'pointer',
            border: '1px solid #d9d9d9', borderRadius: '0 4px 4px 0',
            background: activeTab === 'decisions' ? '#1677ff' : '#fff',
            color: activeTab === 'decisions' ? '#fff' : '#333',
          }}
        >
          AI 决策记录 ({decisions.length})
        </button>
      </div>

      {/* 异常告警 Tab */}
      {activeTab === 'anomalies' && (
        <div>
          {/* 异常类型分布 */}
          <div
            style={{
              background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>异常类型分布</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(Object.keys(ANOMALY_TYPE_LABELS) as AnomalyType[]).map((type) => (
                <span
                  key={type}
                  data-testid={`anomaly-type-badge-${type}`}
                  data-count={anomalyTypeCounts[type] || 0}
                  style={{
                    padding: '2px 10px', borderRadius: 12, fontSize: 12,
                    background: `${ANOMALY_TYPE_COLORS[type]}15`,
                    color: ANOMALY_TYPE_COLORS[type],
                    border: `1px solid ${ANOMALY_TYPE_COLORS[type]}40`,
                  }}
                >
                  {ANOMALY_TYPE_LABELS[type]} {anomalyTypeCounts[type] ? `(${anomalyTypeCounts[type]})` : ''}
                </span>
              ))}
            </div>
          </div>

          {/* 实时趋势 (简化的文本趋势图) */}
          <div
            style={{
              background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: 14 }}>实时趋势 (最近20min)</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 80, padding: '8px 0' }}>
              {trend.slice(-20).map((pt, i) => {
                const maxVal = Math.max(...trend.map((t) => t.value))
                const height = (pt.value / maxVal) * 70
                return (
                  <div
                    key={i}
                    data-testid={`trend-bar-${i}`}
                    data-anomaly={pt.isAnomaly}
                    title={`${pt.timestamp}: ${pt.value}${pt.isAnomaly ? ' ⚠️' : ''}`}
                    style={{
                      flex: 1, minWidth: 4,
                      height: Math.max(height, 2),
                      background: pt.isAnomaly ? ANOMALY_TYPE_COLORS[pt.anomalyType || 'spike'] : '#1677ff',
                      opacity: pt.isAnomaly ? 1 : 0.5,
                      borderRadius: '2px 2px 0 0',
                    }}
                  />
                )
              })}
            </div>
          </div>

          {/* 异常告警列表 */}
          <div>
            {/* 待处理 */}
            {openAlerts.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, margin: '0 0 8px', color: '#f5222d' }}>
                  待处理 ({openAlerts.length})
                </h3>
                {openAlerts.map((a) => renderAlertCard(a, handleStatusChange, isCompact))}
              </div>
            )}

            {/* 调查中 */}
            {investigatingAlerts.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, margin: '0 0 8px', color: '#fa8c16' }}>
                  调查中 ({investigatingAlerts.length})
                </h3>
                {investigatingAlerts.map((a) => renderAlertCard(a, handleStatusChange, isCompact))}
              </div>
            )}

            {/* 已处理 */}
            {resolvedAlerts.length > 0 && (
              <div>
                <h3 style={{ fontSize: 14, margin: '0 0 8px', color: '#8c8c8c' }}>
                  已处理 ({resolvedAlerts.length})
                </h3>
                {resolvedAlerts.map((a) => renderAlertCard(a, handleStatusChange, isCompact))}
              </div>
            )}

            {alerts.length === 0 && (
              <div style={{ background: '#fff', padding: 24, textAlign: 'center', color: '#8c8c8c', borderRadius: 8 }}>
                暂无异常告警
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI 决策记录 Tab */}
      {activeTab === 'decisions' && (
        <div>
          {/* AI 决策成功率概览 */}
          <div
            style={{
              background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>AI 决策执行概览</h3>
            <div style={{ display: 'grid', gridTemplateColumns: isCompact ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12 }}>
              <div data-testid="decision-stats-total">
                <div style={{ fontSize: 24, fontWeight: 700 }}>{decisions.length}</div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>总决策次数</div>
              </div>
              <div data-testid="decision-stats-success">
                <div style={{ fontSize: 24, fontWeight: 700, color: '#52c41a' }}>
                  {decisions.filter((d) => d.success).length}
                </div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>执行成功</div>
              </div>
              <div data-testid="decision-stats-failed">
                <div style={{ fontSize: 24, fontWeight: 700, color: '#f5222d' }}>
                  {decisions.filter((d) => !d.success).length}
                </div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>执行失败</div>
              </div>
              <div data-testid="decision-stats-avg-conf">
                <div style={{ fontSize: 24, fontWeight: 700, color: '#1677ff' }}>
                  {(decisions.reduce((s, d) => s + d.confidence, 0) / decisions.length * 100).toFixed(0)}%
                </div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>平均置信度</div>
              </div>
            </div>
          </div>

          {/* 决策列表 */}
          {decisions.map((d) => (
            <div
              key={d.id}
              data-testid={`decision-${d.id}`}
              data-success={d.success}
              style={{
                background: '#fff', padding: 12, borderRadius: 6, marginBottom: 8,
                borderLeft: `4px solid ${d.success ? '#52c41a' : '#f5222d'}`,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <strong>{d.ruleName}</strong>
                    <span style={{
                      padding: '1px 8px', fontSize: 11, borderRadius: 10,
                      background: d.success ? '#52c41a20' : '#f5222d20',
                      color: d.success ? '#52c41a' : '#f5222d',
                    }}>
                      {d.success ? '成功' : '失败'}
                    </span>
                    <span style={{ fontSize: 11, color: '#8c8c8c' }}>
                      置信度 {(d.confidence * 100).toFixed(0)}% · {(d.durationMs / 1000).toFixed(2)}s
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#595959', marginTop: 4 }}>{d.description}</div>
                  <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>
                    输入: {JSON.stringify(d.input).slice(0, 80)}...
                  </div>
                  <div style={{ fontSize: 11, color: '#8c8c8c' }}>
                    输出: {JSON.stringify(d.output).slice(0, 80)}...
                  </div>
                  {!d.success && d.errorMessage && (
                    <div style={{ fontSize: 11, color: '#f5222d', marginTop: 2 }}>
                      错误: {d.errorMessage}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function renderAlertCard(
  a: import('./types').AnomalyAlert,
  onStatusChange: (id: string, status: import('./types').AnomalyStatus) => void,
  isCompact: boolean,
) {
  return (
    <div
      key={a.id}
      data-testid={`anomaly-${a.id}`}
      data-severity={a.severity}
      data-status={a.status}
      style={{
        background: '#fff', padding: 12, borderRadius: 6, marginBottom: 8,
        borderLeft: `4px solid ${SEVERITY_COLORS[a.severity]}`,
        opacity: a.status === 'resolved' || a.status === 'dismissed' ? 0.6 : 1,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <strong>{a.metricLabel}</strong>
            <span style={{
              padding: '1px 8px', fontSize: 11, borderRadius: 10,
              background: `${ANOMALY_TYPE_COLORS[a.anomalyType]}20`,
              color: ANOMALY_TYPE_COLORS[a.anomalyType],
            }}>
              {ANOMALY_TYPE_LABELS[a.anomalyType]}
            </span>
            <span style={{
              padding: '1px 8px', fontSize: 11, borderRadius: 10,
              background: `${SEVERITY_COLORS[a.severity]}20`,
              color: SEVERITY_COLORS[a.severity],
            }}>
              {SEVERITY_LABELS[a.severity]}
            </span>
            <span style={{
              padding: '1px 8px', fontSize: 11, borderRadius: 10,
              background: a.status === 'open' ? '#f5222d20'
                : a.status === 'investigating' ? '#fa8c1620'
                : a.status === 'resolved' ? '#52c41a20'
                : '#8c8c8c20',
              color: a.status === 'open' ? '#f5222d'
                : a.status === 'investigating' ? '#fa8c16'
                : a.status === 'resolved' ? '#52c41a'
                : '#8c8c8c',
            }}>
              {STATUS_LABELS[a.status]}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#595959', marginTop: 4 }}>{a.message}</div>
          <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>
            {a.metric}: 当前 {a.currentValue} / 基线 {a.baselineValue} · 偏离 {a.deviation > 0 ? '+' : ''}{a.deviation.toFixed(1)}%
          </div>
          {a.aiRecommendation && (
            <div style={{
              fontSize: 11, color: '#1677ff', marginTop: 4,
              background: '#1677ff08', padding: '4px 8px', borderRadius: 4,
            }}>
              🤖 AI建议: {a.aiRecommendation}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4, flexDirection: isCompact ? 'row' : 'column', alignItems: 'flex-start' }}>
          {a.status === 'open' && (
            <>
              <button
                type="button"
                onClick={() => onStatusChange(a.id, 'investigating')}
                data-testid={`investigate-${a.id}`}
                style={{
                  padding: '3px 10px', fontSize: 11,
                  border: '1px solid #fa8c16', borderRadius: 4,
                  background: '#fff', color: '#fa8c16', cursor: 'pointer',
                }}
              >
                调查
              </button>
              <button
                type="button"
                onClick={() => onStatusChange(a.id, 'dismissed')}
                data-testid={`dismiss-${a.id}`}
                style={{
                  padding: '3px 10px', fontSize: 11,
                  border: '1px solid #8c8c8c', borderRadius: 4,
                  background: '#fff', color: '#8c8c8c', cursor: 'pointer',
                }}
              >
                忽略
              </button>
            </>
          )}
          {a.status === 'investigating' && (
            <button
              type="button"
              onClick={() => onStatusChange(a.id, 'resolved')}
              data-testid={`resolve-${a.id}`}
              style={{
                padding: '3px 10px', fontSize: 11,
                border: '1px solid #52c41a', borderRadius: 4,
                background: '#fff', color: '#52c41a', cursor: 'pointer',
              }}
            >
              标记解决
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
