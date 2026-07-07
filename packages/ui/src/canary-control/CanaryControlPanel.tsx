/**
 * 灰度控制 - Panel (V10 Day 8 Phase 92)
 */

import React, { useState } from 'react'
import { useCanaryExperiments, useActivateExperiment, usePromoteExperiment, useRollbackExperiment } from './useCanaryControl'
import {
  STATUS_LABELS, STATUS_COLORS, STRATEGY_LABELS,
  type CanaryExperiment, type CanaryStatus,
} from './types'

export interface CanaryControlPanelProps {
  variant?: 'pc' | 'h5' | 'app' | 'pad' | 'miniprogram'
}

export function CanaryControlPanel({ variant = 'pc' }: CanaryControlPanelProps) {
  const { data: experiments = [], isLoading } = useCanaryExperiments()
  const activate = useActivateExperiment()
  const promote = usePromoteExperiment()
  const rollback = useRollbackExperiment()

  const isCompact = variant === 'h5' || variant === 'app' || variant === 'miniprogram'

  const stats = {
    total: experiments.length,
    active: experiments.filter((e) => e.status === 'active').length,
    paused: experiments.filter((e) => e.status === 'paused').length,
    completed: experiments.filter((e) => e.status === 'completed').length,
    rolledBack: experiments.filter((e) => e.status === 'rolled_back').length,
  }

  return (
    <div
      data-testid="canary-control-panel"
      data-variant={variant}
      style={{
        fontFamily: 'system-ui, sans-serif',
        padding: isCompact ? 12 : 20,
        background: '#fafafa',
        minHeight: '100vh',
      }}
    >
      <h1 style={{ fontSize: isCompact ? 18 : 24, margin: '0 0 16px' }}>灰度发布控制台</h1>

      {/* 统计 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isCompact ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <StatCard label="总数" value={stats.total} color="#1677ff" />
        <StatCard label="进行中" value={stats.active} color="#52c41a" />
        <StatCard label="已暂停" value={stats.paused} color="#fa8c16" />
        <StatCard label="已完成" value={stats.completed} color="#1677ff" />
        <StatCard label="已回滚" value={stats.rolledBack} color="#f5222d" />
      </div>

      {/* 实验列表 */}
      {isLoading ? (
        <div>加载中...</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {experiments.map((exp) => (
            <ExperimentCard
              key={exp.id}
              experiment={exp}
              isCompact={isCompact}
              onActivate={() => activate.mutate(exp.id)}
              onPromote={(pct) => promote.mutate({ id: exp.id, percentage: pct })}
              onRollback={() => {
                if (confirm(`确认回滚 ${exp.name}?`)) rollback.mutate(exp.id)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============ 子组件 ============

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      data-testid={`stat-${label}`}
      style={{
        background: '#fff', padding: 16, borderRadius: 8,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)', textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>{label}</div>
    </div>
  )
}

function ExperimentCard({
  experiment, isCompact, onActivate, onPromote, onRollback,
}: {
  experiment: CanaryExperiment
  isCompact: boolean
  onActivate: () => void
  onPromote: (pct: number) => void
  onRollback: () => void
}) {
  const statusColor = STATUS_COLORS[experiment.status]
  const pct = experiment.currentPercentage
  const target = experiment.targetPercentage

  return (
    <div
      data-testid={`experiment-card-${experiment.id}`}
      data-status={experiment.status}
      style={{
        background: '#fff', padding: isCompact ? 12 : 16,
        borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        borderLeft: `4px solid ${statusColor}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <strong style={{ fontSize: 15, color: '#262626' }}>{experiment.name}</strong>
            <span style={{
              padding: '2px 8px', fontSize: 11, borderRadius: 10,
              background: `${statusColor}20`, color: statusColor,
            }}>
              {STATUS_LABELS[experiment.status]}
            </span>
            <span style={{
              padding: '2px 8px', fontSize: 11, borderRadius: 10,
              background: '#f0f0f0', color: '#595959',
            }}>
              {STRATEGY_LABELS[experiment.strategy]}
            </span>
          </div>
          <div style={{ fontSize: 13, color: '#595959', marginTop: 4 }}>{experiment.description}</div>
          <code style={{ fontSize: 12, color: '#8c8c8c' }}>{experiment.flagKey}</code>
        </div>

        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {experiment.status === 'draft' && (
            <button
              type="button"
              onClick={onActivate}
              data-testid={`btn-activate-${experiment.id}`}
              style={btnStyle('#52c41a')}
            >
              启动
            </button>
          )}
          {experiment.status === 'active' && pct < target && (
            <button
              type="button"
              onClick={() => onPromote(Math.min(pct + 25, target))}
              data-testid={`btn-promote-${experiment.id}`}
              style={btnStyle('#1677ff')}
            >
              晋级 +25%
            </button>
          )}
          {experiment.status === 'active' && (
            <button
              type="button"
              onClick={onRollback}
              data-testid={`btn-rollback-${experiment.id}`}
              style={btnStyle('#f5222d')}
            >
              回滚
            </button>
          )}
        </div>
      </div>

      {/* 进度条 */}
      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#595959' }}>
          <span>当前 {pct}%</span>
          <span>目标 {target}%</span>
        </div>
        <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4, marginTop: 4, overflow: 'hidden' }}>
          <div
            data-testid={`progress-${experiment.id}`}
            data-current={pct}
            data-target={target}
            style={{
              width: `${(pct / Math.max(target, 1)) * 100}%`,
              height: '100%', background: statusColor, transition: 'width 0.3s',
            }}
          />
        </div>
      </div>
    </div>
  )
}

function btnStyle(bg: string): React.CSSProperties {
  return {
    padding: '4px 12px', fontSize: 13, border: 'none', borderRadius: 4,
    background: bg, color: '#fff', cursor: 'pointer',
  }
}
