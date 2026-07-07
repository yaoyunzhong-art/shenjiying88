'use client'

import React, { useState } from 'react'
import { Card } from './Card'
import { Badge } from './Badge'
import { Button } from './Button'
import { Spinner } from './Spinner'
import { StatCard } from './StatCard'
import { Timeline } from './Timeline'
import type { TimelineItem } from './Timeline'
import { Tabs } from './Tabs'

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface DiagnosisFinding {
  id: string
  title: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  category: string
  description: string
  rootCause: string
  impact: string
  recommendation: string
  timestamp: string
  owner?: string
  resolved?: boolean
}

export interface AnomalyDiagnosisReportProps {
  /** 诊断报告标题 */
  title?: string
  /** 诊断发现的异常项列表 */
  findings: DiagnosisFinding[]
  /** 是否正在加载 */
  loading?: boolean
  /** 处理异常回调 */
  onHandleFinding?: (findingId: string) => void
  /** 忽略异常回调 */
  onDismissFinding?: (findingId: string) => void
  /** 全量刷新回调 */
  onRefresh?: () => void
  /** 导出报告回调 */
  onExport?: () => void
  /** 自定义类名 */
  className?: string
}

/* -------------------------------------------------------------------------- */
/*  Severity helpers                                                          */
/* -------------------------------------------------------------------------- */

const severityVariantMap: Record<DiagnosisFinding['severity'], string> = {
  critical: 'error',
  high: 'warning',
  medium: 'warning',
  low: 'info',
  info: 'default',
}

const severityLabelMap: Record<DiagnosisFinding['severity'], string> = {
  critical: '严重',
  high: '高危',
  medium: '中等',
  low: '低危',
  info: '提示',
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                            */
/* -------------------------------------------------------------------------- */

export function AnomalyDiagnosisReport({
  title = 'AI 异常诊断报告',
  findings,
  loading = false,
  onHandleFinding,
  onDismissFinding,
  onRefresh,
  onExport,
  className = '',
}: AnomalyDiagnosisReportProps) {
  const [activeTab, setActiveTab] = useState<string>('all')
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set())

  const unresolvedFindings = findings.filter((f) => !resolvedIds.has(f.id))

  const severityCounts = {
    critical: unresolvedFindings.filter((f) => f.severity === 'critical').length,
    high: unresolvedFindings.filter((f) => f.severity === 'high').length,
    medium: unresolvedFindings.filter((f) => f.severity === 'medium').length,
    low: unresolvedFindings.filter((f) => f.severity === 'low').length,
  }

  const filtered = (() => {
    if (activeTab === 'all') return unresolvedFindings
    return unresolvedFindings.filter((f) => f.severity === activeTab)
  })()

  const handleResolve = (id: string) => {
    setResolvedIds((prev) => new Set(prev).add(id))
    onHandleFinding?.(id)
  }

  const handleDismiss = (id: string) => {
    setResolvedIds((prev) => new Set(prev).add(id))
    onDismissFinding?.(id)
  }

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner size="lg" />
          <p className="mt-4 text-sm text-gray-500">AI 正在分析异常数据...</p>
        </div>
      </Card>
    )
  }

  const tabItems = [
    { key: 'all', label: `全部 (${unresolvedFindings.length})` },
    { key: 'critical', label: `严重 (${severityCounts.critical})` },
    { key: 'high', label: `高危 (${severityCounts.high})` },
    { key: 'medium', label: `中等 (${severityCounts.medium})` },
    { key: 'low', label: `低危 (${severityCounts.low})` },
  ]

  return (
    <Card className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {findings.length} 项发现 · {unresolvedFindings.length} 项待处理
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              刷新
            </Button>
          )}
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              导出报告
            </Button>
          )}
        </div>
      </div>

      {/* Severity Stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <StatCard
          label="严重"
          value={severityCounts.critical}
          variant="error"
        />
        <StatCard
          label="高危"
          value={severityCounts.high}
          variant="warning"
        />
        <StatCard
          label="中等"
          value={severityCounts.medium}
          variant="warning"
        />
        <StatCard
          label="低危"
          value={severityCounts.low}
          variant="info"
        />
      </div>

      {/* Tab filter */}
      <Tabs
        items={tabItems}
        activeKey={activeTab}
        onChange={setActiveTab}
      />

      {/* Findings list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
          <svg
            className="w-12 h-12 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm">暂无未处理的异常</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {filtered.map((finding) => (
            <div
              key={finding.id}
              className="rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant={severityVariantMap[finding.severity] as any}>
                    {severityLabelMap[finding.severity]}
                  </Badge>
                  <span className="font-medium text-sm text-gray-900">
                    {finding.title}
                  </span>
                  <Badge variant="default">{finding.category}</Badge>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {finding.timestamp}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-2">{finding.description}</p>

              <details className="group">
                <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-700 select-none">
                  查看详细分析
                </summary>
                <div className="mt-2 space-y-1.5 text-xs text-gray-600 border-t border-gray-100 pt-2">
                  <div>
                    <span className="font-medium text-gray-700">根因：</span>
                    {finding.rootCause}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">影响：</span>
                    {finding.impact}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">建议：</span>
                    {finding.recommendation}
                  </div>
                  {finding.owner && (
                    <div>
                      <span className="font-medium text-gray-700">负责人：</span>
                      {finding.owner}
                    </div>
                  )}
                </div>
              </details>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleResolve(finding.id)}
                >
                  处理
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDismiss(finding.id)}
                >
                  忽略
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resolved timeline (if any) */}
      {resolvedIds.size > 0 && (
        <details className="mt-4">
          <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700 select-none">
            已处理 ({resolvedIds.size} 项)
          </summary>
          <div className="mt-2">
            <Timeline
              items={findings
                .filter((f) => resolvedIds.has(f.id))
                .map(
                  (f): TimelineItem => ({
                    key: f.id,
                    heading: f.title,
                    subtitle: f.category,
                    content: f.timestamp,
                  })
                )}
            />
          </div>
        </details>
      )}
    </Card>
  )
}

export default AnomalyDiagnosisReport
