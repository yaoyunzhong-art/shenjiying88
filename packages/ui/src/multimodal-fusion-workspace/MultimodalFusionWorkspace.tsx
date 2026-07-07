/**
 * Phase 103 多模态融合 工作台 (V11 Sprint 3 Day 46)
 */

import React, { useState } from 'react'
import {
  useFusionTasks, useFusionTask, useFusionTemplates, useFusionEngines,
  useFusionStats, useCrossModalSearch, useCreateFusionTask, useCancelFusionTask,
} from './useMultimodalFusion'
import {
  FUSION_SOURCE_LABELS, FUSION_SOURCE_ICONS, FUSION_SOURCE_COLORS,
  TASK_TYPE_LABELS, TASK_TYPE_ICONS, SEVERITY_LABELS, SEVERITY_COLORS,
  STATUS_LABELS, STATUS_COLORS, ANOMALY_TYPE_LABELS,
  type FusionTask, type FusionTaskType, type FusionSource, type Insight, type Anomaly, type CrossModalHit,
  type FusionTemplate, type FusionEngine, type FusionStats,
} from './types'

export interface MultimodalFusionWorkspaceProps {
  variant?: 'pc' | 'h5' | 'app' | 'pad' | 'miniprogram'
  defaultTab?: 'tasks' | 'insights' | 'search' | 'templates'
  selectedTaskId?: string
}
type TabKey = 'tasks' | 'insights' | 'search' | 'templates'

export function MultimodalFusionWorkspace({
  variant = 'pc',
  defaultTab = 'tasks',
  selectedTaskId,
}: MultimodalFusionWorkspaceProps) {
  const isCompact = variant === 'h5' || variant === 'app' || variant === 'miniprogram'
  const [tab, setTab] = useState<TabKey>(defaultTab)
  const [filterType, setFilterType] = useState<FusionTaskType | undefined>()
  const [selectedId, setSelectedId] = useState<string | undefined>(selectedTaskId)
  const [showCreate, setShowCreate] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchModalities, setSearchModalities] = useState<FusionSource[]>(['image', 'document', 'voice'])

  const { data: tasks = [], isLoading } = useFusionTasks({ taskType: filterType, limit: 50 })
  const { data: stats } = useFusionStats()
  const { data: templates = [] } = useFusionTemplates()
  const { data: engines = [] } = useFusionEngines()
  const { data: selectedTask } = useFusionTask(selectedId ?? null)
  const search = useCrossModalSearch(searchQuery ? { query: searchQuery, modalities: searchModalities, topK: 10 } : null)
  const createMut = useCreateFusionTask()
  const cancelMut = useCancelFusionTask()

  const handleCreate = (input: any) => {
    createMut.mutate(input)
    setShowCreate(false)
  }

  if (isLoading) {
    return <div data-testid="mf-loading" style={{ padding: 24, textAlign: 'center', color: '#8c8c8c' }}>加载中...</div>
  }

  return (
    <div
      data-testid="multimodal-fusion-workspace"
      data-variant={variant}
      style={{
        padding: isCompact ? 12 : 20, background: '#f0f2f5', minHeight: '100vh',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ fontSize: isCompact ? 18 : 22, margin: 0 }}>多模态融合分析</h1>
        <button
          type="button"
          data-testid="mf-toggle-create"
          onClick={() => setShowCreate((v) => !v)}
          style={{
            padding: '6px 14px', fontSize: 12, borderRadius: 4,
            background: showCreate ? '#52c41a' : '#fff',
            color: showCreate ? '#fff' : '#52c41a',
            border: '1px solid #52c41a', cursor: 'pointer',
          }}
        >
          + 新建融合任务
        </button>
      </div>

      {stats && <StatsPanel stats={stats} isCompact={isCompact} />}

      {showCreate && <CreatePanel onSubmit={handleCreate} onClose={() => setShowCreate(false)} isCompact={isCompact} />}

      <TabBar active={tab} onChange={setTab} templatesCount={templates.length} enginesCount={engines.length} isCompact={isCompact} />

      {tab === 'tasks' && (
        <TasksTab
          tasks={tasks}
          filterType={filterType}
          onFilterChange={setFilterType}
          selectedId={selectedId}
          onSelect={setSelectedId}
          selectedTask={selectedTask}
          isCompact={isCompact}
          onCancel={(id) => cancelMut.mutate(id)}
        />
      )}

      {tab === 'insights' && (
        <InsightsTab task={selectedTask} isCompact={isCompact} />
      )}

      {tab === 'search' && (
        <SearchTab
          query={searchQuery}
          onQueryChange={setSearchQuery}
          modalities={searchModalities}
          onModalitiesChange={setSearchModalities}
          hits={search.data}
          isCompact={isCompact}
        />
      )}

      {tab === 'templates' && (
        <TemplatesTab templates={templates} engines={engines} isCompact={isCompact} />
      )}
    </div>
  )
}

interface TabBarProps {
  active: TabKey; onChange: (k: TabKey) => void;
  templatesCount: number; enginesCount: number; isCompact: boolean
}
function TabBar({ active, onChange, templatesCount, enginesCount, isCompact }: TabBarProps) {
  const tabs: Array<{ key: TabKey; label: string; badge?: number }> = [
    { key: 'tasks', label: '任务' },
    { key: 'insights', label: '洞察' },
    { key: 'search', label: '跨模态搜索' },
    { key: 'templates', label: '模板/引擎', badge: templatesCount + enginesCount },
  ]
  return (
    <div data-testid="mf-tabbar" style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid #d9d9d9' }}>
      {tabs.map((t) => {
        const isActive = active === t.key
        return (
          <button
            key={t.key}
            type="button"
            data-testid={`mf-tab-${t.key}`}
            onClick={() => onChange(t.key)}
            style={{
              padding: isCompact ? '6px 10px' : '8px 16px',
              fontSize: 12, border: 'none', cursor: 'pointer',
              background: 'transparent',
              borderBottom: isActive ? '2px solid #1890ff' : '2px solid transparent',
              color: isActive ? '#1890ff' : '#595959',
              fontWeight: isActive ? 600 : 400,
            }}
          >
            {t.label}
            {t.badge != null && (
              <span style={{ marginLeft: 6, padding: '0 6px', fontSize: 10, borderRadius: 8, background: '#f0f0f0', color: '#595959' }}>{t.badge}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function StatsPanel({ stats, isCompact }: { stats: FusionStats; isCompact: boolean }) {
  return (
    <div data-testid="mf-stats-panel" style={{
      background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <h3 style={{ fontSize: 13, margin: '0 0 12px' }}>融合分析概览</h3>
      <div style={{ display: 'grid', gridTemplateColumns: isCompact ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)', gap: 12 }}>
        <StatBox label="总任务" value={stats.totalTasks.toString()} testid="mf-stat-total" />
        <StatBox label="已完成" value={stats.completedTasks.toString()} testid="mf-stat-completed" />
        <StatBox label="总洞察" value={stats.totalInsights.toString()} testid="mf-stat-insights" />
        <StatBox label="异常数" value={stats.totalAnomalies.toString()} testid="mf-stat-anomalies" />
        <StatBox label="关键异常" value={stats.criticalAnomalies.toString()} testid="mf-stat-critical" />
      </div>
    </div>
  )
}

function StatBox({ label, value, testid }: { label: string; value: string; testid: string }) {
  return (
    <div data-testid={testid} style={{ background: '#fafafa', padding: 10, borderRadius: 6 }}>
      <div style={{ fontSize: 11, color: '#8c8c8c' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4, color: '#262626' }}>{value}</div>
    </div>
  )
}

interface TasksTabProps {
  tasks: FusionTask[]
  filterType?: FusionTaskType
  onFilterChange: (t: FusionTaskType | undefined) => void
  selectedId?: string
  onSelect: (id: string) => void
  selectedTask?: FusionTask
  isCompact: boolean
  onCancel: (id: string) => void
}
function TasksTab({ tasks, filterType, onFilterChange, selectedId, onSelect, selectedTask, isCompact, onCancel }: TasksTabProps) {
  const types: Array<FusionTaskType | 'all'> = [
    'all', 'comprehensive_analysis', 'report_generation', 'cross_modal_search',
    'anomaly_detection', 'trend_insight', 'entity_linking', 'sentiment_synthesis', 'compliance_audit',
  ]
  return (
    <div data-testid="mf-tasks-tab">
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {types.map((t) => {
          const isActive = (t === 'all' && !filterType) || t === filterType
          const label = t === 'all' ? '全部' : TASK_TYPE_LABELS[t]
          return (
            <button
              key={t}
              type="button"
              data-testid={`mf-filter-${t}`}
              onClick={() => onFilterChange(t === 'all' ? undefined : t)}
              style={{
                padding: '4px 10px', fontSize: 11, borderRadius: 12,
                background: isActive ? '#1890ff' : '#f0f0f0',
                color: isActive ? '#fff' : '#595959',
                border: 'none', cursor: 'pointer',
              }}
            >
              {t !== 'all' && TASK_TYPE_ICONS[t as FusionTaskType] + ' '}
              {label}
            </button>
          )
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isCompact ? '1fr' : '1fr 1fr', gap: 12 }}>
        <div>
          {tasks.length === 0 ? (
            <div data-testid="mf-tasks-empty" style={{ background: '#fff', padding: 24, textAlign: 'center', borderRadius: 8, color: '#8c8c8c' }}>
              暂无融合任务
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {tasks.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  isCompact={isCompact}
                  isSelected={selectedId === t.id}
                  onSelect={() => onSelect(t.id)}
                  onCancel={() => onCancel(t.id)}
                />
              ))}
            </div>
          )}
        </div>
        {!isCompact && (
          <div>
            {selectedTask ? (
              <TaskDetail task={selectedTask} />
            ) : (
              <div data-testid="mf-detail-empty" style={{ background: '#fff', padding: 24, textAlign: 'center', borderRadius: 8, color: '#8c8c8c' }}>
                选择左侧任务查看详情
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function TaskCard({ task, isCompact, isSelected, onSelect, onCancel }: {
  task: FusionTask; isCompact: boolean; isSelected: boolean; onSelect: () => void; onCancel: () => void
}) {
  return (
    <div
      data-testid={`mf-task-${task.id}`}
      data-status={task.status}
      data-selected={isSelected}
      onClick={onSelect}
      style={{
        background: '#fff', padding: 12, borderRadius: 6,
        border: isSelected ? '2px solid #1890ff' : '1px solid #f0f0f0',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 18 }}>{TASK_TYPE_ICONS[task.taskType]}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#262626', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {task.title}
            </div>
            <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>
              {TASK_TYPE_LABELS[task.taskType]} · {task.sources.length} 数据源
            </div>
          </div>
        </div>
        <span data-testid={`mf-task-status-${task.id}`} style={{
          padding: '2px 8px', fontSize: 10, borderRadius: 8,
          background: `${STATUS_COLORS[task.status]}20`, color: STATUS_COLORS[task.status],
        }}>{STATUS_LABELS[task.status]}</span>
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
        {task.sources.map((s, i) => (
          <span
            key={i}
            data-testid={`mf-task-source-${task.id}-${i}`}
            style={{
              padding: '1px 6px', fontSize: 10, borderRadius: 6,
              background: `${FUSION_SOURCE_COLORS[s.source]}20`, color: FUSION_SOURCE_COLORS[s.source],
            }}
          >
            {FUSION_SOURCE_ICONS[s.source]} {(s.weight * 100).toFixed(0)}%
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#595959', marginTop: 6, flexWrap: 'wrap' }}>
        <span data-testid={`mf-task-insights-${task.id}`}>💡 {task.insights.length} 洞察</span>
        <span data-testid={`mf-task-anomalies-${task.id}`}>⚠️ {task.anomalies.length} 异常</span>
        {task.durationMs != null && <span>⏱ {(task.durationMs / 1000).toFixed(2)}s</span>}
      </div>
      {(task.status === 'pending' || task.status === 'processing') && (
        <button
          type="button"
          data-testid={`mf-task-cancel-${task.id}`}
          onClick={(e) => { e.stopPropagation(); onCancel() }}
          style={{
            marginTop: 6, padding: '2px 8px', fontSize: 10, borderRadius: 3,
            background: '#fff1f0', color: '#ff4d4f', border: 'none', cursor: 'pointer',
          }}
        >
          取消
        </button>
      )}
    </div>
  )
}

function TaskDetail({ task }: { task: FusionTask }) {
  return (
    <div data-testid={`mf-detail-${task.id}`} style={{
      background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #f0f0f0',
    }}>
      <h3 style={{ fontSize: 14, margin: '0 0 8px' }}>{TASK_TYPE_ICONS[task.taskType]} {task.title}</h3>
      {task.description && <p style={{ fontSize: 12, color: '#595959', margin: '0 0 12px' }}>{task.description}</p>}
      {task.report && (
        <div data-testid="mf-detail-report" style={{ marginBottom: 16 }}>
          <h4 style={{ fontSize: 12, margin: '0 0 6px', color: '#8c8c8c' }}>综合报告</h4>
          {task.report.sections.map((sec, i) => (
            <div key={i} data-testid={`mf-detail-section-${i}`} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{sec.heading}</div>
              <div style={{ fontSize: 12, color: '#595959', whiteSpace: 'pre-wrap', marginTop: 2 }}>{sec.content}</div>
            </div>
          ))}
        </div>
      )}
      {task.insights.length > 0 && (
        <div data-testid="mf-detail-insights" style={{ marginBottom: 12 }}>
          <h4 style={{ fontSize: 12, margin: '0 0 6px', color: '#8c8c8c' }}>洞察 ({task.insights.length})</h4>
          {task.insights.slice(0, 5).map((ins) => <InsightCard key={ins.id} insight={ins} />)}
        </div>
      )}
      {task.anomalies.length > 0 && (
        <div data-testid="mf-detail-anomalies">
          <h4 style={{ fontSize: 12, margin: '0 0 6px', color: '#8c8c8c' }}>异常 ({task.anomalies.length})</h4>
          {task.anomalies.slice(0, 5).map((an) => <AnomalyCard key={an.id} anomaly={an} />)}
        </div>
      )}
    </div>
  )
}

function InsightsTab({ task, isCompact }: { task?: FusionTask; isCompact: boolean }) {
  if (!task) {
    return (
      <div data-testid="mf-insights-empty" style={{ background: '#fff', padding: 32, textAlign: 'center', borderRadius: 8, color: '#8c8c8c' }}>
        请在"任务"标签选择任务查看洞察
      </div>
    )
  }
  return (
    <div data-testid="mf-insights-tab">
      <h3 style={{ fontSize: 13, margin: '0 0 8px' }}>{task.title} - 洞察 ({task.insights.length})</h3>
      {task.insights.length === 0 ? (
        <div style={{ background: '#fff', padding: 24, textAlign: 'center', borderRadius: 8, color: '#8c8c8c' }}>该任务无洞察数据</div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {task.insights.map((ins) => <InsightCard key={ins.id} insight={ins} />)}
        </div>
      )}
      {task.anomalies.length > 0 && (
        <>
          <h3 style={{ fontSize: 13, margin: '16px 0 8px' }}>异常 ({task.anomalies.length})</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {task.anomalies.map((an) => <AnomalyCard key={an.id} anomaly={an} />)}
          </div>
        </>
      )}
    </div>
  )
}

function InsightCard({ insight }: { insight: Insight }) {
  return (
    <div
      data-testid={`mf-insight-${insight.id}`}
      data-severity={insight.severity}
      style={{
        background: '#fff', padding: 12, borderRadius: 6,
        border: '1px solid #f0f0f0', borderLeftWidth: 4, borderLeftStyle: 'solid',
        borderLeftColor: SEVERITY_COLORS[insight.severity],
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
        <strong style={{ fontSize: 13, color: '#262626' }}>{insight.title}</strong>
        <span style={{
          padding: '1px 8px', fontSize: 10, borderRadius: 8,
          background: `${SEVERITY_COLORS[insight.severity]}20`, color: SEVERITY_COLORS[insight.severity],
        }}>{SEVERITY_LABELS[insight.severity]}</span>
      </div>
      <p style={{ fontSize: 12, color: '#595959', margin: '6px 0 0' }}>{insight.description}</p>
      {insight.recommendation && (
        <div data-testid={`mf-insight-rec-${insight.id}`} style={{
          marginTop: 6, padding: 6, background: '#e6f7ff', borderRadius: 4,
          fontSize: 11, color: '#1890ff',
        }}>💡 {insight.recommendation}</div>
      )}
      <div style={{ fontSize: 10, color: '#8c8c8c', marginTop: 4 }}>
        🎯 {(insight.confidence * 100).toFixed(0)}% 置信度 · {insight.category}
      </div>
    </div>
  )
}

function AnomalyCard({ anomaly }: { anomaly: Anomaly }) {
  return (
    <div
      data-testid={`mf-anomaly-${anomaly.id}`}
      data-severity={anomaly.severity}
      style={{
        background: '#fff', padding: 10, borderRadius: 6,
        border: '1px solid #f0f0f0', borderLeftWidth: 4,
        borderLeftStyle: 'solid', borderLeftColor: SEVERITY_COLORS[anomaly.severity],
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <strong style={{ fontSize: 12 }}>{anomaly.description}</strong>
        </div>
        <span style={{
          padding: '1px 8px', fontSize: 10, borderRadius: 8,
          background: `${SEVERITY_COLORS[anomaly.severity]}20`, color: SEVERITY_COLORS[anomaly.severity],
        }}>{SEVERITY_LABELS[anomaly.severity]}</span>
      </div>
      <div style={{ fontSize: 10, color: '#8c8c8c', marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span>{ANOMALY_TYPE_LABELS[anomaly.type]}</span>
        <span>🎯 {(anomaly.confidence * 100).toFixed(0)}%</span>
        <span>📅 {new Date(anomaly.detectedAt).toLocaleDateString('zh-CN')}</span>
      </div>
    </div>
  )
}

interface SearchTabProps {
  query: string; onQueryChange: (q: string) => void
  modalities: FusionSource[]; onModalitiesChange: (m: FusionSource[]) => void
  hits?: CrossModalHit[]; isCompact: boolean
}
function SearchTab({ query, onQueryChange, modalities, onModalitiesChange, hits, isCompact }: SearchTabProps) {
  const allModalities: FusionSource[] = ['image', 'document', 'voice', 'multimedia', 'tabular', 'text']
  const toggleModality = (m: FusionSource) => {
    onModalitiesChange(modalities.includes(m) ? modalities.filter((x) => x !== m) : [...modalities, m])
  }
  return (
    <div data-testid="mf-search-tab">
      <div style={{ background: '#fff', padding: 12, borderRadius: 6, marginBottom: 12, border: '1px solid #f0f0f0' }}>
        <label style={{ fontSize: 12, display: 'block' }}>
          搜索查询:
          <input
            data-testid="mf-search-input"
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="输入关键词搜索"
            style={{ width: '100%', padding: '6px 10px', fontSize: 12, marginTop: 4, border: '1px solid #d9d9d9', borderRadius: 4 }}
          />
        </label>
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 4 }}>数据源 (多选):</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {allModalities.map((m) => {
              const active = modalities.includes(m)
              return (
                <button
                  key={m}
                  type="button"
                  data-testid={`mf-search-mod-${m}`}
                  onClick={() => toggleModality(m)}
                  style={{
                    padding: '3px 8px', fontSize: 10, borderRadius: 8,
                    background: active ? FUSION_SOURCE_COLORS[m] : '#f0f0f0',
                    color: active ? '#fff' : '#595959',
                    border: 'none', cursor: 'pointer',
                  }}
                >
                  {FUSION_SOURCE_ICONS[m]} {FUSION_SOURCE_LABELS[m]}
                </button>
              )
            })}
          </div>
        </div>
      </div>
      {!query ? (
        <div data-testid="mf-search-empty" style={{ background: '#fff', padding: 32, textAlign: 'center', borderRadius: 8, color: '#8c8c8c' }}>
          请输入查询关键词
        </div>
      ) : (
        <div data-testid="mf-search-results" style={{ display: 'grid', gap: 6 }}>
          {(hits ?? []).map((h, i) => (
            <div
              key={i}
              data-testid={`mf-search-hit-${i}`}
              style={{
                background: '#fff', padding: 10, borderRadius: 6,
                border: '1px solid #f0f0f0',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>
                  {FUSION_SOURCE_ICONS[h.modality as FusionSource]} {h.sourceAssetId || h.documentId || h.sttTaskId || h.recognitionId}
                </div>
                {h.matchedText && <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>{h.matchedText}</div>}
              </div>
              <span data-testid={`mf-search-score-${i}`} style={{
                padding: '2px 8px', fontSize: 10, borderRadius: 8,
                background: h.score > 0.9 ? '#52c41a20' : h.score > 0.7 ? '#1890ff20' : '#f0f0f0',
                color: h.score > 0.9 ? '#52c41a' : h.score > 0.7 ? '#1890ff' : '#8c8c8c',
                fontWeight: 600,
              }}>{(h.score * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface TemplatesTabProps { templates: FusionTemplate[]; engines: FusionEngine[]; isCompact: boolean }
function TemplatesTab({ templates, engines, isCompact }: TemplatesTabProps) {
  return (
    <div data-testid="mf-templates-tab">
      <h3 style={{ fontSize: 13, margin: '0 0 8px' }}>融合模板 ({templates.length})</h3>
      <div style={{ display: 'grid', gridTemplateColumns: isCompact ? '1fr' : 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            data-testid={`mf-template-${tpl.id}`}
            style={{ background: '#fff', padding: 12, borderRadius: 6, border: '1px solid #f0f0f0' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 18 }}>{tpl.icon}</span>
              <strong style={{ fontSize: 13 }}>{tpl.title}</strong>
            </div>
            <div style={{ fontSize: 11, color: '#595959', marginBottom: 6 }}>{tpl.description}</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {tpl.defaultModalities.map((m) => (
                <span key={m} style={{
                  padding: '1px 6px', fontSize: 10, borderRadius: 6,
                  background: `${FUSION_SOURCE_COLORS[m]}20`, color: FUSION_SOURCE_COLORS[m],
                }}>{FUSION_SOURCE_ICONS[m]} {FUSION_SOURCE_LABELS[m]}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <h3 style={{ fontSize: 13, margin: '0 0 8px' }}>AI 融合引擎 ({engines.length})</h3>
      <div style={{ display: 'grid', gridTemplateColumns: isCompact ? '1fr' : 'repeat(2, 1fr)', gap: 8 }}>
        {engines.map((e) => (
          <div
            key={e.type}
            data-testid={`mf-engine-${e.type}`}
            style={{ background: '#fff', padding: 12, borderRadius: 6, border: '1px solid #f0f0f0' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <strong style={{ fontSize: 13 }}>{e.displayName}</strong>
              {e.supportsTools && <span style={{ fontSize: 10, color: '#52c41a' }}>🛠 工具</span>}
            </div>
            <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#595959', flexWrap: 'wrap' }}>
              <span>⏱ {e.avgLatencyMs} ms</span>
              <span>📝 {e.maxTokens} tokens</span>
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
              {e.modality.map((m) => (
                <span key={m} style={{
                  padding: '1px 6px', fontSize: 10, borderRadius: 6,
                  background: `${FUSION_SOURCE_COLORS[m]}20`, color: FUSION_SOURCE_COLORS[m],
                }}>{FUSION_SOURCE_ICONS[m]} {FUSION_SOURCE_LABELS[m]}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface CreatePanelProps { onSubmit: (input: any) => void; onClose: () => void; isCompact: boolean }
function CreatePanel({ onSubmit, onClose, isCompact }: CreatePanelProps) {
  const [taskType, setTaskType] = useState<FusionTaskType>('comprehensive_analysis')
  const [title, setTitle] = useState('新建融合分析')
  const [source, setSource] = useState<FusionSource>('tabular')
  const [sourceId, setSourceId] = useState('src-001')
  const [weight, setWeight] = useState(1)
  const [confidence, setConfidence] = useState(0.9)
  const handleSubmit = () => {
    onSubmit({
      taskType, title, description: '用户创建任务',
      sources: [{ source, sourceId, weight, confidence, keyFindings: [] }],
    })
  }
  return (
    <div data-testid="mf-create-panel" style={{
      background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <h3 style={{ fontSize: 13, margin: '0 0 12px' }}>新建融合任务</h3>
      <div style={{ display: 'grid', gap: 10 }}>
        <label style={{ fontSize: 12 }}>
          任务类型
          <select data-testid="mf-create-tasktype" value={taskType}
            onChange={(e) => setTaskType(e.target.value as FusionTaskType)}
            style={{ width: '100%', padding: '6px 10px', fontSize: 12, marginTop: 4, border: '1px solid #d9d9d9', borderRadius: 4 }}>
            {Object.entries(TASK_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{TASK_TYPE_ICONS[k as FusionTaskType]} {v}</option>
            ))}
          </select>
        </label>
        <label style={{ fontSize: 12 }}>
          标题
          <input data-testid="mf-create-title" type="text" value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', padding: '6px 10px', fontSize: 12, marginTop: 4, border: '1px solid #d9d9d9', borderRadius: 4 }} />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label style={{ fontSize: 12 }}>
            数据源
            <select data-testid="mf-create-source" value={source}
              onChange={(e) => setSource(e.target.value as FusionSource)}
              style={{ width: '100%', padding: '6px 10px', fontSize: 12, marginTop: 4, border: '1px solid #d9d9d9', borderRadius: 4 }}>
              {Object.entries(FUSION_SOURCE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{FUSION_SOURCE_ICONS[k as FusionSource]} {v}</option>
              ))}
            </select>
          </label>
          <label style={{ fontSize: 12 }}>
            源 ID
            <input data-testid="mf-create-sourceid" type="text" value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              style={{ width: '100%', padding: '6px 10px', fontSize: 12, marginTop: 4, border: '1px solid #d9d9d9', borderRadius: 4 }} />
          </label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label style={{ fontSize: 12 }}>
            权重 (0-1)
            <input data-testid="mf-create-weight" type="number" step={0.1} min={0} max={1} value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              style={{ width: '100%', padding: '6px 10px', fontSize: 12, marginTop: 4, border: '1px solid #d9d9d9', borderRadius: 4 }} />
          </label>
          <label style={{ fontSize: 12 }}>
            置信度 (0-1)
            <input data-testid="mf-create-confidence" type="number" step={0.05} min={0} max={1} value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              style={{ width: '100%', padding: '6px 10px', fontSize: 12, marginTop: 4, border: '1px solid #d9d9d9', borderRadius: 4 }} />
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" data-testid="mf-create-submit" onClick={handleSubmit}
            style={{ padding: '6px 16px', fontSize: 12, borderRadius: 4, background: '#52c41a', color: '#fff', border: 'none', cursor: 'pointer' }}>
            开始融合
          </button>
          <button type="button" onClick={onClose}
            style={{ padding: '6px 16px', fontSize: 12, borderRadius: 4, background: '#fff', color: '#595959', border: '1px solid #d9d9d9', cursor: 'pointer' }}>
            取消
          </button>
        </div>
      </div>
    </div>
  )
}