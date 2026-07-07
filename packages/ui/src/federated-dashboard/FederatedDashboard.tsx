/**
 * Phase 97 联邦学习 仪表盘 (V10 Sprint 2 Day 28)
 *
 * 任务列表 + 训练轮次 + 隐私预算可视化
 */

import React, { useState } from 'react'
import {
  useFederatedTasks, useFederatedRounds, useFederatedPrivacy,
  useActivateTask, useStartRound, useAggregateRound,
} from './useFederated'
import {
  AGGREGATION_LABELS, TASK_STATUS_LABELS, TASK_STATUS_COLORS,
  ROUND_STATUS_LABELS, ROUND_STATUS_COLORS,
  type FederatedTask, type FederatedRound, type PrivacyAccount,
  type TaskStatus, type RoundStatus,
} from './types'

export interface FederatedDashboardProps {
  variant?: 'pc' | 'h5' | 'app' | 'pad' | 'miniprogram'
  selectedTaskId?: string
  onSelectTask?: (task: FederatedTask) => void
}

export function FederatedDashboard({ variant = 'pc', selectedTaskId, onSelectTask }: FederatedDashboardProps) {
  const { data: tasks = [], isLoading } = useFederatedTasks()
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null)
  const selectedId = selectedTaskId ?? internalSelectedId ?? tasks[0]?.id ?? null

  const isCompact = variant === 'h5' || variant === 'app' || variant === 'miniprogram'

  if (isLoading) {
    return <div data-testid="fed-loading" style={{ padding: 24, textAlign: 'center', color: '#8c8c8c' }}>加载中...</div>
  }

  return (
    <div
      data-testid="federated-dashboard"
      data-variant={variant}
      style={{
        padding: isCompact ? 12 : 20, background: '#f0f2f5', minHeight: '100vh',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1 style={{ fontSize: isCompact ? 18 : 22, margin: '0 0 16px' }}>联邦学习仪表盘</h1>

      {/* 任务列表 */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 14, margin: '0 0 10px' }}>训练任务 ({tasks.length})</h2>
        {tasks.length === 0 ? (
          <div data-testid="fed-empty" style={{ background: '#fff', padding: 32, textAlign: 'center', borderRadius: 8, color: '#8c8c8c' }}>
            暂无联邦训练任务
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {tasks.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                selected={selectedId === t.id}
                isCompact={isCompact}
                onSelect={() => {
                  setInternalSelectedId(t.id)
                  onSelectTask?.(t)
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* 选中任务的详情 */}
      {selectedId && (
        <TaskDetail taskId={selectedId} isCompact={isCompact} />
      )}
    </div>
  )
}

// ============ TaskCard 子组件 ============

interface TaskCardProps {
  task: FederatedTask
  selected: boolean
  isCompact: boolean
  onSelect: () => void
}

function TaskCard({ task, selected, isCompact, onSelect }: TaskCardProps) {
  const activateMut = useActivateTask()
  const startRoundMut = useStartRound()
  const color = TASK_STATUS_COLORS[task.status]
  const status: TaskStatus = task.status
  const progress = task.totalRounds > 0 ? (task.currentRound / task.totalRounds) * 100 : 0

  return (
    <div
      data-testid={`fed-task-${task.id}`}
      data-status={status}
      onClick={onSelect}
      style={{
        background: '#fff', padding: 14, borderRadius: 8, cursor: 'pointer',
        boxShadow: selected ? '0 2px 8px rgba(24,144,255,0.2)' : '0 1px 4px rgba(0,0,0,0.06)',
        borderLeft: selected ? '4px solid #1890ff' : `4px solid ${color}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <strong style={{ fontSize: 14 }}>{task.name}</strong>
            <span
              data-testid={`fed-task-status-${task.id}`}
              style={{
                padding: '2px 8px', fontSize: 11, borderRadius: 10,
                background: `${color}20`, color,
              }}
            >
              {TASK_STATUS_LABELS[status]}
            </span>
            <span style={{ fontSize: 11, color: '#8c8c8c' }}>{AGGREGATION_LABELS[task.aggregationMethod]}</span>
          </div>
          <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 4 }}>
            {task.participantTenantIds.length} 参与者 · 模型 {task.modelArch} · {task.currentRound}/{task.totalRounds} 轮
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          {status === 'draft' && (
            <button
              type="button"
              data-testid={`fed-activate-${task.id}`}
              onClick={(e) => { e.stopPropagation(); activateMut.mutate(task.id) }}
              style={{
                padding: '4px 10px', fontSize: 11, borderRadius: 4,
                background: '#52c41a', color: '#fff', border: 'none', cursor: 'pointer',
              }}
            >
              启动
            </button>
          )}
          {status === 'active' && (
            <button
              type="button"
              data-testid={`fed-start-round-${task.id}`}
              onClick={(e) => { e.stopPropagation(); startRoundMut.mutate(task.id) }}
              style={{
                padding: '4px 10px', fontSize: 11, borderRadius: 4,
                background: '#1890ff', color: '#fff', border: 'none', cursor: 'pointer',
              }}
            >
              新轮次
            </button>
          )}
        </div>
      </div>
      <div style={{ marginTop: 8, height: 4, background: '#f0f0f0', borderRadius: 2, overflow: 'hidden' }}>
        <div
          data-testid={`fed-progress-${task.id}`}
          data-progress={progress}
          style={{ width: `${progress}%`, height: '100%', background: '#1890ff', transition: 'width 0.3s' }}
        />
      </div>
      <div style={{ fontSize: 11, color: '#595959', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <span>隐私 ε: <strong>{task.consumedEpsilon.toFixed(3)}</strong>/{task.privacyBudgetEpsilon.toFixed(2)}</span>
        <span>噪声乘子: {task.noiseMultiplier}</span>
        <span>梯度裁剪: {task.maxGradientNorm}</span>
      </div>
    </div>
  )
}

// ============ TaskDetail 子组件 ============

function TaskDetail({ taskId, isCompact }: { taskId: string; isCompact: boolean }) {
  const { data: rounds = [] } = useFederatedRounds(taskId)
  const { data: privacy } = useFederatedPrivacy(taskId)
  const aggregateMut = useAggregateRound()

  return (
    <div data-testid={`fed-detail-${taskId}`}>
      {/* 隐私预算面板 */}
      {privacy && <PrivacyBudgetBar privacy={privacy} isCompact={isCompact} />}

      {/* 轮次列表 */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 14, margin: '0 0 10px' }}>训练轮次 ({rounds.length})</h2>
        {rounds.length === 0 ? (
          <div data-testid="fed-no-rounds" style={{ background: '#fff', padding: 24, textAlign: 'center', borderRadius: 8, color: '#8c8c8c' }}>
            暂无轮次
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {rounds.map((r) => (
              <RoundCard
                key={r.id}
                round={r}
                isCompact={isCompact}
                onAggregate={r.status === 'collecting' && r.actualParticipants >= 2
                  ? () => aggregateMut.mutate(r.id)
                  : undefined
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ============ PrivacyBudgetBar 子组件 ============

function PrivacyBudgetBar({ privacy, isCompact }: { privacy: PrivacyAccount; isCompact: boolean }) {
  const epsPct = (privacy.consumedEpsilon / privacy.totalEpsilon) * 100
  const epsRemaining = privacy.totalEpsilon - privacy.consumedEpsilon
  const color = epsPct >= 90 ? '#ff4d4f' : epsPct >= 60 ? '#faad14' : '#52c41a'

  return (
    <div
      data-testid="fed-privacy-panel"
      style={{
        background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      <h3 style={{ fontSize: 13, margin: '0 0 12px' }}>差分隐私预算</h3>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
        <span>ε 已用 <strong>{privacy.consumedEpsilon.toFixed(4)}</strong> / {privacy.totalEpsilon.toFixed(2)}</span>
        <span data-testid="fed-eps-remaining" style={{ color }}>剩余 {epsRemaining.toFixed(4)} ({epsPct.toFixed(0)}%)</span>
      </div>
      <div style={{ height: 10, background: '#f0f0f0', borderRadius: 5, overflow: 'hidden' }}>
        <div
          data-testid="fed-eps-bar"
          data-pct={epsPct}
          style={{ width: `${Math.min(100, epsPct)}%`, height: '100%', background: color, transition: 'width 0.3s' }}
        />
      </div>
      <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 6 }}>
        δ 已用 {privacy.consumedDelta.toExponential(2)} / {privacy.totalDelta.toExponential(2)} ·
        组合方式: {privacy.compositionMethod}
      </div>
    </div>
  )
}

// ============ RoundCard 子组件 ============

function RoundCard({ round, isCompact, onAggregate }: { round: FederatedRound; isCompact: boolean; onAggregate?: () => void }) {
  const status: RoundStatus = round.status
  const color = ROUND_STATUS_COLORS[status]
  return (
    <div
      data-testid={`fed-round-${round.id}`}
      data-status={status}
      style={{
        background: '#fff', padding: 12, borderRadius: 6,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        borderLeft: `3px solid ${color}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <strong style={{ fontSize: 13 }}>Round #{round.roundNumber}</strong>
            <span
              data-testid={`fed-round-status-${round.id}`}
              style={{
                padding: '2px 8px', fontSize: 11, borderRadius: 10,
                background: `${color}20`, color,
              }}
            >
              {ROUND_STATUS_LABELS[status]}
            </span>
            <span style={{ fontSize: 11, color: '#8c8c8c' }}>v{round.globalModelVersion}{round.nextModelVersion ? ` → v${round.nextModelVersion}` : ''}</span>
          </div>
          <div style={{ fontSize: 11, color: '#595959', marginTop: 4 }}>
            参与者 {round.actualParticipants}/{round.expectedParticipants} ·
            ε {round.epsilonConsumed.toFixed(3)}
            {round.aggregatedLoss != null && ` · loss ${round.aggregatedLoss.toFixed(4)}`}
          </div>
        </div>
        {onAggregate && (
          <button
            type="button"
            data-testid={`fed-aggregate-${round.id}`}
            onClick={onAggregate}
            style={{
              padding: '4px 10px', fontSize: 11, borderRadius: 4,
              background: '#13c2c2', color: '#fff', border: 'none', cursor: 'pointer',
            }}
          >
            触发聚合
          </button>
        )}
      </div>
    </div>
  )
}