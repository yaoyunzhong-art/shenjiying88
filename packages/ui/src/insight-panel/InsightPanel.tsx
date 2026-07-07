/**
 * Phase 94 智能分析 - 面板 (V10 Sprint 2 Day 18)
 *
 * 渲染 markdown 洞察报告 + 列表 + 状态徽章
 */

import React from 'react'
import {
  useInsightList,
  useInsightTemplates,
  useGenerateInsight,
} from './useInsight'
import {
  TEMPLATE_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  type InsightResponse,
  type InsightTemplateType,
} from './types'

export interface InsightPanelProps {
  variant?: 'pc' | 'h5' | 'app' | 'pad' | 'miniprogram'
  onSelectInsight?: (insight: InsightResponse) => void
}

/**
 * 简易 markdown 渲染 (## 标题 + - 列表)
 */
function renderMarkdown(md: string): React.ReactNode {
  const lines = md.split('\n')
  const blocks: React.ReactNode[] = []
  let listItems: string[] = []
  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push(
        <ul key={`ul-${blocks.length}`}>
          {listItems.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>,
      )
      listItems = []
    }
  }
  lines.forEach((line, idx) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('## ')) {
      flushList()
      blocks.push(<h3 key={`h-${idx}`}>{trimmed.slice(3)}</h3>)
    } else if (trimmed.startsWith('- ')) {
      listItems.push(trimmed.slice(2))
    } else if (trimmed.length > 0) {
      flushList()
      blocks.push(<p key={`p-${idx}`}>{trimmed}</p>)
    }
  })
  flushList()
  return <>{blocks}</>
}

export function InsightPanel({ variant = 'pc', onSelectInsight }: InsightPanelProps) {
  const { data: templates = [] } = useInsightTemplates()
  const { data: insights = [] } = useInsightList()
  const generate = useGenerateInsight()

  const isCompact = variant === 'h5' || variant === 'app' || variant === 'miniprogram'
  const selected = insights[0]

  const handleGenerate = (templateType: InsightTemplateType) => {
    generate.mutate({
      templateType,
      sources: [
        {
          type: 'report',
          refId: 'rpt-current',
          dataSnapshot: {},
          period: { from: '2026-06-01', to: '2026-06-30' },
        },
      ],
    })
  }

  return (
    <div data-testid="insight-panel" data-variant={variant} style={{ padding: 16 }}>
      <header style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>AI 智能洞察</h2>
        <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>
          基于 {templates.length} 种模板的 LLM 报表分析
        </p>
      </header>

      <section style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {templates.map((tpl) => (
            <button
              key={tpl.type}
              type="button"
              data-testid={`template-${tpl.type}`}
              onClick={() => handleGenerate(tpl.type)}
              disabled={generate.isPending}
              style={{
                padding: '6px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                background: generate.isPending ? '#f1f5f9' : '#fff',
                cursor: generate.isPending ? 'not-allowed' : 'pointer',
              }}
            >
              {tpl.name}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 style={{ margin: '0 0 8px' }}>洞察列表 ({insights.length})</h3>
        <ul data-testid="insight-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {insights.map((ins) => (
            <li
              key={ins.id}
              data-testid={`insight-${ins.id}`}
              onClick={() => onSelectInsight?.(ins)}
              style={{
                padding: 10,
                marginBottom: 8,
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                cursor: onSelectInsight ? 'pointer' : 'default',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 600 }}>
                  {TEMPLATE_LABELS[ins.templateType]}
                </span>
                <span
                  data-testid="status-badge"
                  style={{
                    padding: '2px 8px',
                    background: STATUS_COLORS[ins.status],
                    color: '#fff',
                    borderRadius: 4,
                    fontSize: 12,
                  }}
                >
                  {STATUS_LABELS[ins.status]}
                </span>
                {ins.cached && (
                  <span style={{ fontSize: 12, color: '#64748b' }}>📦 缓存</span>
                )}
              </div>
              {ins.tokenUsage && (
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                  Tokens: {ins.tokenUsage.total} ({ins.tokenUsage.prompt}+{ins.tokenUsage.completion})
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {!isCompact && selected && selected.content && (
        <section
          data-testid="insight-detail"
          style={{ marginTop: 16, padding: 16, background: '#f8fafc', borderRadius: 8 }}
        >
          <h3 style={{ margin: '0 0 12px' }}>{TEMPLATE_LABELS[selected.templateType]}</h3>
          {renderMarkdown(selected.content)}
        </section>
      )}
    </div>
  )
}
