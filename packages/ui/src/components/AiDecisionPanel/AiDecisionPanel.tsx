/**
 * AI决策面板 - 规则执行结果展示 (Component)
 *
 * 在会员等级自动评估 / 设备异常检测 / 积分风控等场景下,
 * 展示 AI 规则链执行的详细结果, 包含命中规则/置信度/数据快照/建议操作
 */

import React from 'react'
import { useDecisionPanel } from './useDecisionPanel'
import {
  EVENT_TYPE_LABELS,
  EVENT_TYPE_ICONS,
  SEVERITY_LABELS,
  SEVERITY_COLORS,
  type DecisionEvent,
  type DecisionRuleResult,
  type DecisionPanelConfig,
} from './types'

export interface AiDecisionPanelProps {
  variant?: 'pc' | 'h5' | 'app' | 'pad' | 'miniprogram'
  config?: DecisionPanelConfig
}

/** 置信度色值 */
function confidenceColor(score: number): string {
  if (score >= 0.9) return '#52c41a'
  if (score >= 0.7) return '#1677ff'
  if (score >= 0.5) return '#faad14'
  return '#f5222d'
}

/** 单条规则结果展示 */
function RuleResultItem({ result }: { result: DecisionRuleResult }) {
  return (
    <div
      data-testid={`rule-result-${result.ruleId}`}
      data-triggered={result.triggered}
      style={{
        padding: '8px 10px',
        marginBottom: 6,
        borderRadius: 6,
        background: result.triggered ? '#fff7e6' : '#f6ffed',
        border: `1px solid ${result.triggered ? '#ffd591' : '#b7eb8f'}`,
        fontSize: 13,
      }}
    >
      {/* 规则名称 + 触发状态 + 置信度 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <strong>{result.ruleName}</strong>
          <span
            style={{
              padding: '1px 6px',
              fontSize: 11,
              borderRadius: 8,
              background: result.triggered ? '#fa8c1620' : '#52c41a20',
              color: result.triggered ? '#fa8c16' : '#52c41a',
              fontWeight: 600,
            }}
          >
            {result.triggered ? '已触发' : '未触发'}
          </span>
        </div>
        <span style={{ fontSize: 11, color: confidenceColor(result.confidence) }}>
          置信度 {(result.confidence * 100).toFixed(0)}%
        </span>
      </div>

      {/* 规则详情 */}
      <div style={{ color: '#595959', fontSize: 12, marginBottom: 4 }}>{result.detail}</div>

      {/* 建议 */}
      {result.suggestion && (
        <div style={{ color: '#1677ff', fontSize: 12, marginBottom: 4 }}>
          💡 {result.suggestion}
        </div>
      )}

      {/* 数据快照 */}
      {result.dataSnapshot && Object.keys(result.dataSnapshot).length > 0 && (
        <details style={{ marginTop: 4 }}>
          <summary style={{ fontSize: 11, color: '#8c8c8c', cursor: 'pointer' }}>查看数据快照</summary>
          <pre
            style={{
              fontSize: 11,
              background: '#f5f5f5',
              padding: 8,
              borderRadius: 4,
              marginTop: 4,
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {JSON.stringify(result.dataSnapshot, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}

/** 单条决策事件卡片 */
function DecisionEventCard({
  event,
  onSelect,
  isSelected,
}: {
  event: DecisionEvent
  onSelect: (e: DecisionEvent) => void
  isSelected: boolean
}) {
  const triggeredCount = event.ruleResults.filter((r) => r.triggered).length
  const totalRules = event.ruleResults.length

  return (
    <div
      data-testid={`decision-event-${event.id}`}
      data-severity={event.severity}
      data-handled={event.handled}
      onClick={() => onSelect(event)}
      role="button"
      tabIndex={0}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(event)
        }
      }}
      style={{
        background: isSelected ? '#e6f4ff' : '#fff',
        padding: 12,
        borderRadius: 8,
        border: `1px solid ${isSelected ? '#1677ff' : '#f0f0f0'}`,
        cursor: 'pointer',
        transition: 'all 0.15s',
        opacity: event.handled ? 0.65 : 1,
        marginBottom: 8,
      }}
    >
      {/* 头部: 图标 + 类型 + 严重度 + 处理状态 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 18 }}>{EVENT_TYPE_ICONS[event.type]}</span>
          <strong style={{ fontSize: 14 }}>{EVENT_TYPE_LABELS[event.type]}</strong>
          <span style={{ fontSize: 11, color: '#8c8c8c' }}>#{event.label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              padding: '1px 8px',
              fontSize: 11,
              borderRadius: 10,
              background: `${SEVERITY_COLORS[event.severity]}20`,
              color: SEVERITY_COLORS[event.severity],
              fontWeight: 600,
            }}
          >
            {SEVERITY_LABELS[event.severity]}
          </span>
          {event.handled ? (
            <span style={{ fontSize: 11, color: '#52c41a' }}>已处理</span>
          ) : (
            <span style={{ fontSize: 11, color: '#faad14' }}>待处理</span>
          )}
        </div>
      </div>

      {/* 关联目标 + 时间 */}
      <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 6 }}>
        {event.type === 'device_risk' ? '设备' : '会员'}: {event.targetId} ·{' '}
        {new Date(event.createdAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </div>

      {/* 规则命中 */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#595959' }}>
          规则 {triggeredCount}/{totalRules} 条命中
        </span>
        <span style={{ fontSize: 11, color: '#8c8c8c' }}>·</span>
        <span style={{ fontSize: 12, color: '#595959' }}>
          {event.conclusion.length > 40 ? `${event.conclusion.slice(0, 40)}...` : event.conclusion}
        </span>
      </div>
    </div>
  )
}

/** 决策事件详情弹窗 */
function DecisionEventDetail({
  event,
  onClose,
  onMarkHandled,
}: {
  event: DecisionEvent
  onClose: () => void
  onMarkHandled: (id: string, handledBy: string) => void
}) {
  const [handledByName, setHandledByName] = React.useState('')

  return (
    <div
      data-testid="decision-event-detail"
      style={{
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
        padding: 20,
        marginTop: 12,
      }}
    >
      {/* 关闭按钮 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24 }}>{EVENT_TYPE_ICONS[event.type]}</span>
          <div>
            <h3 style={{ margin: 0, fontSize: 16 }}>{EVENT_TYPE_LABELS[event.type]}</h3>
            <span style={{ fontSize: 12, color: '#8c8c8c' }}>{event.label}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          data-testid="detail-close-btn"
          style={{
            padding: '4px 12px',
            border: '1px solid #d9d9d9',
            borderRadius: 4,
            background: '#fff',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          关闭 ✕
        </button>
      </div>

      {/* 基本信息 */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 16,
          padding: 12,
          background: '#fafafa',
          borderRadius: 6,
          fontSize: 13,
        }}
      >
        <div>
          <span style={{ color: '#8c8c8c' }}>严重度: </span>
          <span style={{ color: SEVERITY_COLORS[event.severity], fontWeight: 600 }}>
            {SEVERITY_LABELS[event.severity]}
          </span>
        </div>
        <div>
          <span style={{ color: '#8c8c8c' }}>关联 ID: </span>
          <code style={{ fontSize: 12 }}>{event.targetId}</code>
        </div>
        <div>
          <span style={{ color: '#8c8c8c' }}>发生时间: </span>
          {new Date(event.createdAt).toLocaleString('zh-CN')}
        </div>
        <div>
          <span style={{ color: '#8c8c8c' }}>处理状态: </span>
          {event.handled ? (
            <span style={{ color: '#52c41a' }}>
              已处理 ({event.handledBy}) · {event.handledAt ? new Date(event.handledAt).toLocaleString('zh-CN') : ''}
            </span>
          ) : (
            <span style={{ color: '#faad14' }}>待处理</span>
          )}
        </div>
      </div>

      {/* 结论 */}
      <div
        style={{
          padding: 12,
          background: '#fffbe6',
          border: '1px solid #ffe58f',
          borderRadius: 6,
          marginBottom: 16,
          fontSize: 13,
        }}
      >
        <strong>📋 决策结论:</strong> {event.conclusion}
      </div>

      {/* 规则结果链 */}
      <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>
        规则执行链 ({event.ruleResults.length})
      </h4>
      {event.ruleResults.map((result) => (
        <RuleResultItem key={result.ruleId} result={result} />
      ))}

      {/* 处理按钮 */}
      {!event.handled && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
          <input
            type="text"
            value={handledByName}
            onChange={(e) => setHandledByName(e.target.value)}
            placeholder="输入处理人姓名"
            data-testid="handled-by-input"
            style={{
              padding: '4px 12px',
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              fontSize: 13,
              flex: 1,
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (handledByName.trim()) {
                onMarkHandled(event.id, handledByName.trim())
              }
            }}
            disabled={!handledByName.trim()}
            data-testid="mark-handled-btn"
            style={{
              padding: '4px 16px',
              border: 'none',
              borderRadius: 4,
              background: handledByName.trim() ? '#1677ff' : '#d9d9d9',
              color: handledByName.trim() ? '#fff' : '#8c8c8c',
              cursor: handledByName.trim() ? 'pointer' : 'not-allowed',
              fontSize: 13,
            }}
          >
            标记已处理
          </button>
        </div>
      )}
    </div>
  )
}

/** 事件类型过滤栏 */
function TypeFilterBar({
  activeTypes,
  onChange,
}: {
  activeTypes: DecisionPanelConfig['typeFilter']
  onChange: (types: DecisionPanelConfig['typeFilter']) => void
}) {
  const allTypes = Object.keys(EVENT_TYPE_LABELS) as Array<keyof typeof EVENT_TYPE_LABELS>

  const toggle = (t: keyof typeof EVENT_TYPE_LABELS) => {
    if (!activeTypes || activeTypes.length === 0) {
      onChange(allTypes.filter((x) => x !== t))
    } else if (activeTypes.includes(t)) {
      const next = activeTypes.filter((x) => x !== t)
      onChange(next.length === 0 ? undefined : next)
    } else {
      onChange([...activeTypes, t])
    }
  }

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
      {(Object.entries(EVENT_TYPE_LABELS) as Array<[keyof typeof EVENT_TYPE_LABELS, string]>).map(([key, label]) => {
        const isActive = !activeTypes || activeTypes.length === 0 || activeTypes.includes(key)
        return (
          <button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            data-testid={`filter-type-${key}`}
            data-active={isActive}
            style={{
              padding: '3px 10px',
              fontSize: 12,
              borderRadius: 12,
              border: `1px solid ${isActive ? '#1677ff' : '#d9d9d9'}`,
              background: isActive ? '#1677ff10' : '#fff',
              color: isActive ? '#1677ff' : '#8c8c8c',
              cursor: 'pointer',
            }}
          >
            {EVENT_TYPE_ICONS[key]} {label}
          </button>
        )
      })}
    </div>
  )
}

/**
 * AI决策面板 - 主组件
 */
export function AiDecisionPanel({ variant = 'pc', config }: AiDecisionPanelProps) {
  const {
    events,
    loading,
    error,
    selectedEvent,
    handleSelectEvent,
    handleDismissDetail,
    handleMarkHandled,
  } = useDecisionPanel({ config })

  const [typeFilter, setTypeFilter] = React.useState<DecisionPanelConfig['typeFilter']>(config?.typeFilter)

  const isCompact = variant === 'h5' || variant === 'app' || variant === 'miniprogram'

  const unhandledCount = events.filter((e) => !e.handled).length

  // 显示 loading
  if (loading) {
    return (
      <div data-testid="ai-decision-panel" style={{ padding: 20, textAlign: 'center', color: '#8c8c8c' }}>
        AI决策引擎运行中...
      </div>
    )
  }

  // 显示 error
  if (error) {
    return (
      <div data-testid="ai-decision-panel" style={{ padding: 20, textAlign: 'center', color: '#f5222d' }}>
        决策引擎异常: {error}
      </div>
    )
  }

  return (
    <div
      data-testid="ai-decision-panel"
      data-variant={variant}
      style={{
        fontFamily: 'system-ui, sans-serif',
        padding: isCompact ? 12 : 20,
        background: '#f5f7fa',
        minHeight: '100vh',
      }}
    >
      {/* 标题 + 统计 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: isCompact ? 18 : 22, margin: 0 }}>
            🤖 AI决策中心
          </h1>
          <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
            {events.length} 条决策事件 · {unhandledCount} 条待处理
            {unhandledCount > 0 && (
              <span style={{ color: '#faad14', fontWeight: 600, marginLeft: 8 }}>
                需关注
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 过滤栏 */}
      <TypeFilterBar activeTypes={typeFilter} onChange={setTypeFilter} />

      {/* 事件列表 */}
      {events.length === 0 ? (
        <div
          style={{
            background: '#fff',
            padding: 40,
            textAlign: 'center',
            borderRadius: 8,
            color: '#8c8c8c',
          }}
          data-testid="empty-state"
        >
          暂无决策事件
        </div>
      ) : (
        <div>
          {events.map((event) => (
            <DecisionEventCard
              key={event.id}
              event={event}
              onSelect={handleSelectEvent}
              isSelected={selectedEvent?.id === event.id}
            />
          ))}
        </div>
      )}

      {/* 详情面板 */}
      {selectedEvent && (
        <DecisionEventDetail
          event={selectedEvent}
          onClose={handleDismissDetail}
          onMarkHandled={handleMarkHandled}
        />
      )}
    </div>
  )
}
