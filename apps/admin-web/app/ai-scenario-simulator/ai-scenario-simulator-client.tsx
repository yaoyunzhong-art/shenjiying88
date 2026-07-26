'use client'

import React, { useCallback, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  AIScenarioSimulator,
  Button,
  DataTable,
  FormSubmitFeedback,
  PageShell,
  StatCard,
  type DataTableColumn,
  type SimulationResult,
} from '@m5/ui'
import type {
  AiScenarioSimulatorSnapshot,
  HistoryRecord,
  ScenarioPreset,
  ScenarioTrend,
} from './ai-scenario-simulator-data'

const cardStyle: React.CSSProperties = {
  background: '#f8fafc',
  borderRadius: 10,
  border: '1px solid #e2e8f0',
  padding: 16,
}

export default function AiScenarioSimulatorClient({
  snapshot,
}: {
  snapshot: AiScenarioSimulatorSnapshot
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [activePreset, setActivePreset] = useState<string>(snapshot.presets[0]?.id ?? '')
  const [showDescription, setShowDescription] = useState(true)
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [lastResults, setLastResults] = useState<SimulationResult[] | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const currentPreset = useMemo(
    () => (snapshot.presets.find((preset) => preset.id === activePreset) ?? snapshot.presets[0]) as ScenarioPreset,
    [activePreset, snapshot.presets]
  )

  const categories = useMemo(() => {
    const grouped = new Map<string, ScenarioPreset[]>()
    snapshot.presets.forEach((preset) => {
      const items = grouped.get(preset.category) ?? []
      items.push(preset)
      grouped.set(preset.category, items)
    })
    return Array.from(grouped.entries())
  }, [snapshot.presets])

  const handleSimulate = useCallback(
    async (values: Record<string, number | string>) => {
      const results = await currentPreset.simulate(values)
      const record: HistoryRecord = {
        id: `sim-${Date.now()}`,
        presetLabel: currentPreset.label,
        values,
        results,
        timestamp: new Date().toLocaleString('zh-CN'),
      }

      setHistory((previous) => [record, ...previous].slice(0, 20))
      setLastResults(results)
      setFeedback({ type: 'success', message: `模拟完成 (${results.length} 项结果)` })
      return results
    },
    [currentPreset]
  )

  const handleExportReport = useCallback(() => {
    if (!lastResults) return
    const lines = ['变量,模拟前,模拟后,单位,变化率']
    lastResults.forEach((result) => {
      lines.push(`${result.variable},${result.before},${result.after},${result.unit},${result.changePercent}%`)
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `simulation-${activePreset}-${new Date().toISOString().slice(0, 10)}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
    setFeedback({ type: 'success', message: '报告已导出' })
  }, [activePreset, lastResults])

  const historyColumns: DataTableColumn<HistoryRecord>[] = useMemo(
    () => [
      { key: 'timestamp', title: '时间', render: (item) => <span>{item.timestamp}</span>, width: '180px' },
      { key: 'presetLabel', title: '场景', render: (item) => <span>{item.presetLabel}</span> },
      { key: 'resultCount', title: '结果数', render: (item) => <span>{item.results.length} 项</span>, width: '90px' },
      {
        key: 'summary',
        title: '主要结果',
        render: (item) => {
          const top = item.results[0]
          return top ? (
            <span>
              {top.variable}: {typeof top.after === 'number' ? top.after.toLocaleString() : top.after} {top.unit}
            </span>
          ) : null
        },
      },
    ],
    []
  )

  const scenarioTrend: ScenarioTrend[] | null = useMemo(() => {
    if (history.length === 0) return null
    const grouped = new Map<string, number[]>()
    history.forEach((record) => {
      const values = grouped.get(record.presetLabel) ?? []
      record.results.forEach((result) => {
        if (typeof result.after === 'number') {
          values.push(result.after)
        }
      })
      grouped.set(record.presetLabel, values)
    })
    return Array.from(grouped.entries()).map(([label, values]) => ({
      label,
      avgAfter: Math.round(values.reduce((sum, value) => sum + value, 0) / values.length),
      count: values.length,
    }))
  }, [history])

  return (
    <PageShell title="AI 场景模拟器" subtitle="调整参数预测门店运营决策效果">
      <div style={{ display: 'grid', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {categories.map(([category, items]) => (
              <React.Fragment key={category}>
                {items.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setActivePreset(preset.id)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: activePreset === preset.id ? '1px solid #2563eb' : '1px solid #d1d5db',
                      background: activePreset === preset.id ? '#eff6ff' : '#fff',
                      color: activePreset === preset.id ? '#2563eb' : '#334155',
                      cursor: 'pointer',
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </React.Fragment>
            ))}
          </div>
          <button
            type="button"
            onClick={() => startRefresh(() => router.refresh())}
            disabled={isRefreshing}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            {isRefreshing ? '刷新中...' : '刷新'}
          </button>
        </div>

        {feedback ? (
          <FormSubmitFeedback
            success={feedback.type === 'success' ? feedback.message : undefined}
            onDismissSuccess={() => setFeedback(null)}
          />
        ) : null}

        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <StatCard label="可用场景" value={snapshot.presets.length.toString()} helper="预设场景" />
          <StatCard label="模拟次数" value={history.length.toString()} helper="当前会话" />
          <StatCard label="变量总数" value={snapshot.presetStats.totalVariables.toString()} helper="可调参数" />
          <StatCard label="平均延迟" value={`${snapshot.presetStats.avgSimTime}s`} helper="本地快照估算" />
        </div>

        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          {Object.entries(snapshot.categoryDescriptions).map(([category, description]) => (
            <div
              key={category}
              style={{
                ...cardStyle,
                background: currentPreset.category === category ? '#eff6ff' : '#f8fafc',
                borderColor: currentPreset.category === category ? '#93c5fd' : '#e2e8f0',
              }}
            >
              <div style={{ marginBottom: 6, fontWeight: 600 }}>{category}</div>
              <div style={{ color: '#64748b', fontSize: 12 }}>{description}</div>
            </div>
          ))}
        </div>

        <AIScenarioSimulator
          key={`${activePreset}-${lastResults ? 'rerun' : 'base'}`}
          scenarioName={currentPreset.label}
          variables={currentPreset.variables}
          onSimulate={handleSimulate}
          baselineDescription="基于近 30 天历史样本生成预测，结果仅供经营推演参考。"
          loadingText="AI 正在模拟计算..."
          errorText="模拟失败，请检查参数后重试"
        />

        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" onClick={handleExportReport} disabled={!lastResults}>
            导出报告
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setLastResults(null)
              setFeedback({ type: 'success', message: '已重置' })
            }}
          >
            重置
          </Button>
        </div>

        {lastResults ? (
          <section style={cardStyle}>
            <h3 style={{ marginBottom: 12, fontSize: 16, fontWeight: 700 }}>最新模拟结果对比</h3>
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              {lastResults.map((result) => (
                <div
                  key={result.variable}
                  style={{
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    padding: 14,
                    background: result.direction === 'up' ? '#f0fdf4' : '#fef2f2',
                  }}
                >
                  <div style={{ color: '#64748b', fontSize: 12 }}>{result.variable}</div>
                  <div style={{ marginTop: 8, fontSize: 18, fontWeight: 700 }}>
                    {typeof result.after === 'number' ? result.after.toLocaleString() : result.after} {result.unit}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 12, color: result.direction === 'up' ? '#16a34a' : '#dc2626' }}>
                    {result.direction === 'up' ? '↑' : '↓'}
                    {Math.abs(result.changePercent)}%
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {scenarioTrend ? (
          <section style={cardStyle}>
            <h3 style={{ marginBottom: 12, fontSize: 16, fontWeight: 700 }}>场景趋势概览</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {scenarioTrend.map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    padding: '10px 14px',
                    background: '#fff',
                  }}
                >
                  <span>{item.label}</span>
                  <span style={{ color: '#64748b' }}>
                    {item.count} 项结果 · 平均 {item.avgAfter.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {showDescription ? (
          <section style={{ ...cardStyle, background: '#eff6ff', borderColor: '#bfdbfe' }}>
            <h3 style={{ marginBottom: 8, fontSize: 16, fontWeight: 700 }}>{currentPreset.label} - 使用说明</h3>
            <p style={{ color: '#475569', lineHeight: 1.6 }}>{currentPreset.description}</p>
            <p style={{ marginTop: 8, color: '#64748b', fontSize: 12 }}>
              变量数: {currentPreset.variables.length} · 分类: {currentPreset.category}
            </p>
            <button
              type="button"
              onClick={() => setShowDescription(false)}
              style={{ marginTop: 8, border: 'none', background: 'transparent', color: '#2563eb', cursor: 'pointer', padding: 0 }}
            >
              收起说明
            </button>
          </section>
        ) : null}

        <section style={cardStyle}>
          <h3 style={{ marginBottom: 12, fontSize: 16, fontWeight: 700 }}>历史模拟记录</h3>
          {history.length === 0 ? (
            <div style={{ border: '1px dashed #cbd5e1', borderRadius: 8, padding: 32, textAlign: 'center', color: '#94a3b8' }}>
              暂无模拟记录
            </div>
          ) : (
            <DataTable
              columns={historyColumns}
              items={history}
              rowKey={(item) => item.id}
              compact
              striped
              emptyText="暂无记录"
            />
          )}
        </section>
      </div>
    </PageShell>
  )
}
