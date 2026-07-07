/**
 * Phase 94 智能分析 - 触发器按钮 (V10 Sprint 2 Day 18)
 *
 * 用法: 报表详情页 <InsightTrigger reportId="rpt-001" />
 */

import React, { useState } from 'react'
import { useGenerateInsight } from './useInsight'
import { TEMPLATE_LABELS, type InsightTemplateType } from './types'

export interface InsightTriggerProps {
  reportId: string
  templateType?: InsightTemplateType
  label?: string
  onGenerated?: (id: string) => void
}

export function InsightTrigger({
  reportId,
  templateType = 'sales',
  label,
  onGenerated,
}: InsightTriggerProps) {
  const generate = useGenerateInsight()
  const [lastId, setLastId] = useState<string | null>(null)

  const handleClick = async () => {
    const result = await generate.mutateAsync({
      templateType,
      sources: [
        {
          type: 'report',
          refId: reportId,
          dataSnapshot: {},
          period: { from: '2026-06-01', to: '2026-06-30' },
        },
      ],
    })
    setLastId(result.id)
    onGenerated?.(result.id)
  }

  return (
    <button
      type="button"
      data-testid="insight-trigger"
      data-report-id={reportId}
      data-template={templateType}
      data-last-id={lastId ?? ''}
      data-pending={generate.isPending ? 'true' : 'false'}
      onClick={handleClick}
      disabled={generate.isPending}
      style={{
        padding: '6px 14px',
        background: '#3b82f6',
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        cursor: generate.isPending ? 'wait' : 'pointer',
      }}
    >
      {generate.isPending
        ? '生成中...'
        : label ?? `🤖 AI 洞察 - ${TEMPLATE_LABELS[templateType]}`}
    </button>
  )
}
