import React from 'react'

/**
 * ResourceOptimizationPanel · T403-3 AI 资源优化建议面板
 * 用途: 展示门店资源(人力/设备/库存)的AI优化建议，含收益预估
 * 关联: P3-8 智能资源分配 / P4-5 运营效率提升
 */

export interface ResourceOptimizationSuggestion {
  id: string
  category: 'STAFF' | 'EQUIPMENT' | 'INVENTORY'
  title: string
  description: string
  estimatedBenefit: string
  effortLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  priority: number
}

export interface ResourceOptimizationPanelProps {
  suggestions: ResourceOptimizationSuggestion[]
  isLoading?: boolean
}

const categoryLabel: Record<ResourceOptimizationSuggestion['category'], string> = {
  STAFF: '人员',
  EQUIPMENT: '设备',
  INVENTORY: '库存',
}

const effortLabel: Record<ResourceOptimizationSuggestion['effortLevel'], string> = {
  LOW: '低投入',
  MEDIUM: '中等投入',
  HIGH: '高投入',
}

const priorityColor: Record<number, string> = {
  1: '#ef4444',
  2: '#f97316',
  3: '#eab308',
  4: '#22c55e',
  5: '#22c55e',
}

export function ResourceOptimizationPanel({
  suggestions,
  isLoading = false,
}: ResourceOptimizationPanelProps) {
  if (isLoading) {
    return (
      <div data-testid="resource-optimization-loading" role="status">
        <div className="skeleton" style={{ height: 120, marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 120, marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 120 }} />
      </div>
    )
  }

  const sorted = [...suggestions].sort((a, b) => a.priority - b.priority)

  return (
    <div data-testid="resource-optimization-panel" className="resource-optimization-panel">
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
        AI 资源优化建议
      </h3>
      {sorted.length === 0 && (
        <p data-testid="empty-state" style={{ color: '#888' }}>
          暂无优化建议
        </p>
      )}
      {sorted.map((item) => (
        <div
          key={item.id}
          data-testid={`suggestion-${item.id}`}
          className="optimization-card"
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 8,
            borderLeft: `4px solid ${priorityColor[item.priority] ?? '#6b7280'}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              data-testid={`category-badge-${item.id}`}
              style={{
                fontSize: 12,
                padding: '2px 8px',
                borderRadius: 4,
                background: '#f3f4f6',
                color: '#374151',
              }}
            >
              {categoryLabel[item.category]}
            </span>
            <span data-testid={`effort-badge-${item.id}`} style={{ fontSize: 12, color: '#6b7280' }}>
              {effortLabel[item.effortLevel]}
            </span>
          </div>
          <div style={{ marginTop: 8 }}>
            <strong data-testid={`title-${item.id}`}>{item.title}</strong>
            <p data-testid={`desc-${item.id}`} style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
              {item.description}
            </p>
          </div>
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 500 }}>
              预估收益: {item.estimatedBenefit}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
