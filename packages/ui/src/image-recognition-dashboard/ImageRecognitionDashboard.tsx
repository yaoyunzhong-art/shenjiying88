/**
 * Phase 101 图像识别 仪表盘 (V11 Sprint 3 Day 43)
 *
 * 4 Tabs: 任务 / 对象 / 视觉搜索 / 引擎
 * + 统计面板 + 任务卡片 + 对象列表 + 货架分析 + 视觉搜索结果 + 引擎目录
 */

import React, { useState } from 'react'
import {
  useRecognitionTasks, useRecognitionResult, useRecognitionEngines,
  useRecognitionStats, useVisualSearch, useDuplicateDetection,
  useCreateRecognition, useCancelRecognition,
} from './useImageRecognition'
import {
  RECOGNITION_ENGINE_LABELS, TASK_TYPE_LABELS, TASK_TYPE_ICONS,
  STATUS_LABELS, STATUS_COLORS, ENGINE_TASK_MAP,
  confidencePct, formatDuration, occupancyPct,
  type RecognitionTask, RecognitionTaskType, RecognitionEngine,
  type RecognitionResult, type RecognitionEngineMeta, type RecognitionStats,
} from './types'

export interface ImageRecognitionDashboardProps {
  variant?: 'pc' | 'h5' | 'app' | 'pad' | 'miniprogram'
  defaultTaskType?: RecognitionTaskType
  selectedTaskId?: string
}

type TabKey = 'tasks' | 'objects' | 'visual' | 'engines'

export function ImageRecognitionDashboard({
  variant = 'pc',
  defaultTaskType,
  selectedTaskId,
}: ImageRecognitionDashboardProps) {
  const isCompact = variant === 'h5' || variant === 'app' || variant === 'miniprogram'
  const [tab, setTab] = useState<TabKey>('tasks')
  const [filterType, setFilterType] = useState<RecognitionTaskType | undefined>(defaultTaskType)
  const [selectedId, setSelectedId] = useState<string | undefined>(selectedTaskId)
  const [showCreate, setShowCreate] = useState(false)
  const [searchAssetId, setSearchAssetId] = useState('')

  const { data: tasks = [], isLoading } = useRecognitionTasks({ taskType: filterType, limit: 50 })
  const { data: stats } = useRecognitionStats()
  const { data: engines = [] } = useRecognitionEngines()
  const { data: result } = useRecognitionResult(selectedId ?? null)
  const visualSearch = useVisualSearch(searchAssetId ? { sourceAssetId: searchAssetId, topK: 5 } : null)
  const dupDetect = useDuplicateDetection(searchAssetId ? { sourceAssetId: searchAssetId, threshold: 0.7 } : null)
  const createMut = useCreateRecognition()
  const cancelMut = useCancelRecognition()

  const handleCreate = (input: { taskType: RecognitionTaskType; sourceAssetId: string; filename: string }) => {
    createMut.mutate({ ...input, engine: ENGINE_TASK_MAP[input.taskType] })
    setShowCreate(false)
  }

  if (isLoading) {
    return <div data-testid="ir-loading" style={{ padding: 24, textAlign: 'center', color: '#8c8c8c' }}>加载中...</div>
  }

  return (
    <div
      data-testid="image-recognition-dashboard"
      data-variant={variant}
      style={{
        padding: isCompact ? 12 : 20, background: '#f0f2f5', minHeight: '100vh',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ fontSize: isCompact ? 18 : 22, margin: 0 }}>图像识别</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            data-testid="ir-toggle-create"
            onClick={() => setShowCreate((v) => !v)}
            style={{
              padding: '6px 14px', fontSize: 12, borderRadius: 4,
              background: showCreate ? '#52c41a' : '#fff',
              color: showCreate ? '#fff' : '#52c41a',
              border: '1px solid #52c41a', cursor: 'pointer',
            }}
          >
            + 新建识别任务
          </button>
        </div>
      </div>

      {/* 统计面板 */}
      {stats && <StatsPanel stats={stats} isCompact={isCompact} />}

      {/* 创建任务面板 */}
      {showCreate && <CreatePanel onSubmit={handleCreate} onClose={() => setShowCreate(false)} isCompact={isCompact} />}

      {/* Tab 切换 */}
      <TabBar active={tab} onChange={setTab} enginesCount={engines.length} isCompact={isCompact} />

      {/* Tab 内容 */}
      {tab === 'tasks' && (
        <TasksTab
          tasks={tasks}
          filterType={filterType}
          onFilterChange={setFilterType}
          selectedId={selectedId}
          onSelect={setSelectedId}
          isCompact={isCompact}
          onCancel={(id) => cancelMut.mutate(id)}
        />
      )}

      {tab === 'objects' && (
        <ObjectsTab result={result} isCompact={isCompact} />
      )}

      {tab === 'visual' && (
        <VisualSearchTab
          searchAssetId={searchAssetId}
          onChange={setSearchAssetId}
          visualData={visualSearch.data}
          dupData={dupDetect.data}
          isCompact={isCompact}
        />
      )}

      {tab === 'engines' && (
        <EnginesTab engines={engines} isCompact={isCompact} />
      )}
    </div>
  )
}

// ============ TabBar ============

interface TabBarProps { active: TabKey; onChange: (k: TabKey) => void; enginesCount: number; isCompact: boolean }
function TabBar({ active, onChange, enginesCount, isCompact }: TabBarProps) {
  const tabs: Array<{ key: TabKey; label: string; badge?: number }> = [
    { key: 'tasks', label: '任务' },
    { key: 'objects', label: '对象' },
    { key: 'visual', label: '视觉搜索' },
    { key: 'engines', label: '引擎', badge: enginesCount },
  ]
  return (
    <div data-testid="ir-tabbar" style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid #d9d9d9' }}>
      {tabs.map((t) => {
        const isActive = active === t.key
        return (
          <button
            key={t.key}
            type="button"
            data-testid={`ir-tab-${t.key}`}
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
              <span data-testid={`ir-tab-badge-${t.key}`} style={{
                marginLeft: 6, padding: '0 6px', fontSize: 10, borderRadius: 8,
                background: '#f0f0f0', color: '#595959',
              }}>{t.badge}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ============ StatsPanel ============

function StatsPanel({ stats, isCompact }: { stats: RecognitionStats; isCompact: boolean }) {
  return (
    <div data-testid="ir-stats-panel" style={{
      background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <h3 style={{ fontSize: 13, margin: '0 0 12px' }}>识别概览</h3>
      <div style={{ display: 'grid', gridTemplateColumns: isCompact ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)', gap: 12 }}>
        <StatBox label="总任务" value={stats.totalTasks.toString()} testid="ir-stat-total" />
        <StatBox label="已完成" value={stats.completedTasks.toString()} testid="ir-stat-completed" />
        <StatBox label="检测对象" value={stats.totalObjectsDetected.toString()} testid="ir-stat-objects" />
        <StatBox label="平均置信度" value={confidencePct(stats.avgConfidence)} testid="ir-stat-confidence" />
        <StatBox label="重复命中" value={stats.duplicatesDetected.toString()} testid="ir-stat-dupes" />
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

// ============ TasksTab ============

interface TasksTabProps {
  tasks: RecognitionTask[]
  filterType?: RecognitionTaskType
  onFilterChange: (t: RecognitionTaskType | undefined) => void
  selectedId?: string
  onSelect: (id: string) => void
  isCompact: boolean
  onCancel: (id: string) => void
}
function TasksTab({ tasks, filterType, onFilterChange, selectedId, onSelect, isCompact, onCancel }: TasksTabProps) {
  const types: Array<RecognitionTaskType | 'all'> = ['all', 'product_recognition', 'shelf_analysis', 'image_classification', 'object_detection', 'visual_search', 'duplicate_detection']
  return (
    <div data-testid="ir-tasks-tab">
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {types.map((t) => {
          const isActive = (t === 'all' && !filterType) || t === filterType
          const label = t === 'all' ? '全部' : TASK_TYPE_LABELS[t]
          return (
            <button
              key={t}
              type="button"
              data-testid={`ir-filter-${t}`}
              onClick={() => onFilterChange(t === 'all' ? undefined : t)}
              style={{
                padding: '4px 10px', fontSize: 11, borderRadius: 12,
                background: isActive ? '#1890ff' : '#f0f0f0',
                color: isActive ? '#fff' : '#595959',
                border: 'none', cursor: 'pointer',
              }}
            >
              {t !== 'all' && TASK_TYPE_ICONS[t as RecognitionTaskType] + ' '}
              {label}
            </button>
          )
        })}
      </div>
      {tasks.length === 0 ? (
        <div data-testid="ir-tasks-empty" style={{ background: '#fff', padding: 32, textAlign: 'center', borderRadius: 8, color: '#8c8c8c' }}>
          暂无识别任务
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
  )
}

function TaskCard({ task, isCompact, isSelected, onSelect, onCancel }: {
  task: RecognitionTask; isCompact: boolean; isSelected: boolean; onSelect: () => void; onCancel: () => void
}) {
  const color = STATUS_COLORS[task.status]
  return (
    <div
      data-testid={`ir-task-${task.id}`}
      data-status={task.status}
      data-task-type={task.taskType}
      data-selected={isSelected}
      onClick={onSelect}
      style={{
        background: '#fff', padding: 12, borderRadius: 6,
        border: isSelected ? '2px solid #1890ff' : '1px solid #f0f0f0',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 18 }}>{TASK_TYPE_ICONS[task.taskType]}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#262626', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {task.filename}
            </div>
            <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>
              {TASK_TYPE_LABELS[task.taskType]} · {RECOGNITION_ENGINE_LABELS[task.engine]}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span data-testid={`ir-task-status-${task.id}`} style={{
            padding: '2px 8px', fontSize: 10, borderRadius: 8,
            background: `${color}20`, color,
          }}>{STATUS_LABELS[task.status]}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#595959', marginTop: 8, flexWrap: 'wrap' }}>
        <span data-testid={`ir-task-objects-${task.id}`}>📦 {task.objectCount} 对象</span>
        {task.avgConfidence != null && (
          <span data-testid={`ir-task-confidence-${task.id}`}>🎯 {confidencePct(task.avgConfidence)}</span>
        )}
        <span>⏱ {formatDuration(task.durationMs)}</span>
      </div>
      {task.status === 'processing' && (
        <div style={{ height: 4, background: '#f0f0f0', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
          <div data-testid={`ir-task-progress-${task.id}`} style={{
            width: `${task.progress * 100}%`, height: '100%', background: '#1890ff',
          }} />
        </div>
      )}
      {(task.status === 'pending' || task.status === 'processing') && (
        <button
          type="button"
          data-testid={`ir-task-cancel-${task.id}`}
          onClick={(e) => { e.stopPropagation(); onCancel() }}
          style={{
            marginTop: 8, padding: '3px 10px', fontSize: 10, borderRadius: 3,
            background: '#fff1f0', color: '#ff4d4f', border: 'none', cursor: 'pointer',
          }}
        >
          取消
        </button>
      )}
    </div>
  )
}

// ============ ObjectsTab ============

function ObjectsTab({ result, isCompact }: { result?: RecognitionResult; isCompact: boolean }) {
  if (!result) {
    return (
      <div data-testid="ir-objects-empty" style={{ background: '#fff', padding: 32, textAlign: 'center', borderRadius: 8, color: '#8c8c8c' }}>
        请在"任务"标签选择一个任务查看对象
      </div>
    )
  }
  return (
    <div data-testid="ir-objects-tab">
      <div style={{ background: '#fff', padding: 12, borderRadius: 6, marginBottom: 12, border: '1px solid #f0f0f0' }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{result.task.filename}</div>
        <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>
          {RECOGNITION_ENGINE_LABELS[result.task.engine]} · 共 {result.objects.length} 个对象
        </div>
      </div>
      {result.shelfAnalysis && <ShelfAnalysisPanel analysis={result.shelfAnalysis} isCompact={isCompact} />}
      {result.objects.length === 0 ? (
        <div data-testid="ir-objects-none" style={{ background: '#fff', padding: 24, textAlign: 'center', borderRadius: 8, color: '#8c8c8c' }}>
          该任务无对象数据
        </div>
      ) : (
        <div data-testid="ir-objects-list" style={{ display: 'grid', gap: 6 }}>
          {result.objects.map((obj) => (
            <div
              key={obj.id}
              data-testid={`ir-object-${obj.id}`}
              style={{
                background: '#fff', padding: 10, borderRadius: 6,
                border: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', flexWrap: 'wrap', gap: 8,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{obj.label}</div>
                <div style={{ fontSize: 10, color: '#8c8c8c', marginTop: 2 }}>
                  {obj.category && `[${obj.category}] `}
                  bbox: ({obj.bbox.x}, {obj.bbox.y}) {obj.bbox.width}×{obj.bbox.height}
                  {obj.skuId && ` · SKU: ${obj.skuId}`}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span data-testid={`ir-object-confidence-${obj.id}`} style={{
                  padding: '2px 8px', fontSize: 11, borderRadius: 8,
                  background: obj.confidence > 0.9 ? '#52c41a20' : obj.confidence > 0.7 ? '#faad1420' : '#ff4d4f20',
                  color: obj.confidence > 0.9 ? '#52c41a' : obj.confidence > 0.7 ? '#faad14' : '#ff4d4f',
                  fontWeight: 600,
                }}>
                  {confidencePct(obj.confidence)}
                </span>
                {obj.priceCny != null && (
                  <span data-testid={`ir-object-price-${obj.id}`} style={{ fontSize: 13, fontWeight: 600, color: '#1890ff' }}>
                    ¥{obj.priceCny.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ShelfAnalysisPanel({ analysis, isCompact }: { analysis: NonNullable<RecognitionResult['shelfAnalysis']>; isCompact: boolean }) {
  return (
    <div data-testid="ir-shelf-panel" style={{
      background: '#fff', padding: 16, borderRadius: 8, marginBottom: 12,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <h3 style={{ fontSize: 13, margin: '0 0 12px' }}>货架分析</h3>
      <div style={{ display: 'grid', gridTemplateColumns: isCompact ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12 }}>
        <StatBox label="总货位" value={analysis.totalSlots.toString()} testid="ir-shelf-total" />
        <StatBox label="已占用" value={analysis.occupiedSlots.toString()} testid="ir-shelf-occupied" />
        <StatBox label="占用率" value={occupancyPct(analysis.occupancyRate)} testid="ir-shelf-occupancy" />
        <StatBox label="价格合规" value={occupancyPct(analysis.priceCompliance)} testid="ir-shelf-compliance" />
      </div>
      {analysis.outOfStock.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#ff4d4f' }}>缺货 SKU:</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {analysis.outOfStock.map((sku) => (
              <span key={sku} data-testid={`ir-shelf-out-${sku}`} style={{
                padding: '2px 8px', fontSize: 11, borderRadius: 8,
                background: '#fff1f0', color: '#ff4d4f',
              }}>{sku}</span>
            ))}
          </div>
        </div>
      )}
      {analysis.restockSuggestions.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>补货建议:</div>
          <ul data-testid="ir-shelf-restock" style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#595959' }}>
            {analysis.restockSuggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ============ VisualSearchTab ============

interface VisualSearchTabProps {
  searchAssetId: string
  onChange: (id: string) => void
  visualData?: { items: { matchedAssetId: string; similarity: number }[]; total: number }
  dupData?: { sourceAssetId: string; duplicates: { duplicateAssetId: string; similarity: number }[] }
  isCompact: boolean
}
function VisualSearchTab({ searchAssetId, onChange, visualData, dupData, isCompact }: VisualSearchTabProps) {
  return (
    <div data-testid="ir-visual-tab">
      <div style={{ background: '#fff', padding: 12, borderRadius: 6, marginBottom: 12, border: '1px solid #f0f0f0' }}>
        <label style={{ fontSize: 12, display: 'block' }}>
          源资产 ID:
          <input
            data-testid="ir-visual-input"
            type="text"
            value={searchAssetId}
            onChange={(e) => onChange(e.target.value)}
            placeholder="asset-shelf-01"
            style={{ width: '100%', padding: '6px 10px', fontSize: 12, marginTop: 4, border: '1px solid #d9d9d9', borderRadius: 4 }}
          />
        </label>
      </div>
      {!searchAssetId ? (
        <div data-testid="ir-visual-empty" style={{ background: '#fff', padding: 32, textAlign: 'center', borderRadius: 8, color: '#8c8c8c' }}>
          请输入源资产 ID 进行视觉搜索
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          <div data-testid="ir-visual-results" style={{ background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #f0f0f0' }}>
            <h3 style={{ fontSize: 13, margin: '0 0 8px' }}>视觉搜索结果 ({visualData?.total ?? 0})</h3>
            {visualData && visualData.items.length > 0 ? (
              <div style={{ display: 'grid', gap: 4 }}>
                {visualData.items.map((h, i) => (
                  <div
                    key={h.matchedAssetId}
                    data-testid={`ir-visual-hit-${i}`}
                    style={{ display: 'flex', justifyContent: 'space-between', padding: 6, background: '#fafafa', borderRadius: 4 }}
                  >
                    <span style={{ fontSize: 12 }}>{h.matchedAssetId}</span>
                    <span data-testid={`ir-visual-sim-${i}`} style={{
                      fontSize: 12, fontWeight: 600,
                      color: h.similarity > 0.9 ? '#52c41a' : h.similarity > 0.7 ? '#1890ff' : '#8c8c8c',
                    }}>
                      {confidencePct(h.similarity)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#8c8c8c', textAlign: 'center', padding: 16 }}>暂无搜索结果</div>
            )}
          </div>
          <div data-testid="ir-duplicate-results" style={{ background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #f0f0f0' }}>
            <h3 style={{ fontSize: 13, margin: '0 0 8px' }}>重复检测 ({dupData?.duplicates.length ?? 0})</h3>
            {dupData && dupData.duplicates.length > 0 ? (
              <div style={{ display: 'grid', gap: 4 }}>
                {dupData.duplicates.map((d, i) => (
                  <div
                    key={d.duplicateAssetId}
                    data-testid={`ir-dup-${i}`}
                    style={{ display: 'flex', justifyContent: 'space-between', padding: 6, background: '#fff7e6', borderRadius: 4 }}
                  >
                    <span style={{ fontSize: 12 }}>{d.duplicateAssetId}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#faad14' }}>{confidencePct(d.similarity)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#8c8c8c', textAlign: 'center', padding: 16 }}>未发现重复</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ============ EnginesTab ============

function EnginesTab({ engines, isCompact }: { engines: RecognitionEngineMeta[]; isCompact: boolean }) {
  return (
    <div data-testid="ir-engines-tab">
      <div style={{ display: 'grid', gridTemplateColumns: isCompact ? '1fr' : 'repeat(2, 1fr)', gap: 8 }}>
        {engines.map((e) => (
          <div
            key={e.type}
            data-testid={`ir-engine-${e.type}`}
            style={{
              background: '#fff', padding: 12, borderRadius: 6,
              border: '1px solid #f0f0f0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <strong style={{ fontSize: 13 }}>{e.displayName}</strong>
              <span style={{ fontSize: 10, color: '#8c8c8c' }}>v{e.modelVersion}</span>
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
              {e.taskTypes.map((tt) => (
                <span key={tt} style={{
                  padding: '1px 6px', fontSize: 10, borderRadius: 8,
                  background: '#e6f7ff', color: '#1890ff',
                }}>{TASK_TYPE_ICONS[tt]} {TASK_TYPE_LABELS[tt]}</span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#595959', flexWrap: 'wrap' }}>
              <span data-testid={`ir-engine-accuracy-${e.type}`}>🎯 {(e.accuracy * 100).toFixed(0)}%</span>
              <span>⏱ {formatDuration(e.avgTimeMs)}</span>
              {e.classesSupported > 0 && <span>📚 {e.classesSupported} 类</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============ CreatePanel ============

interface CreatePanelProps {
  onSubmit: (input: { taskType: RecognitionTaskType; sourceAssetId: string; filename: string }) => void
  onClose: () => void
  isCompact: boolean
}
function CreatePanel({ onSubmit, onClose, isCompact }: CreatePanelProps) {
  const [taskType, setTaskType] = useState<RecognitionTaskType>('product_recognition')
  const [sourceAssetId, setSourceAssetId] = useState('asset-new-001')
  const [filename, setFilename] = useState('new-photo.jpg')

  const handleSubmit = () => {
    onSubmit({ taskType, sourceAssetId, filename })
  }

  return (
    <div data-testid="ir-create-panel" style={{
      background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <h3 style={{ fontSize: 13, margin: '0 0 12px' }}>新建识别任务</h3>
      <div style={{ display: 'grid', gap: 10 }}>
        <label style={{ fontSize: 12 }}>
          任务类型
          <select
            data-testid="ir-create-tasktype"
            value={taskType}
            onChange={(e) => setTaskType(e.target.value as RecognitionTaskType)}
            style={{ width: '100%', padding: '6px 10px', fontSize: 12, marginTop: 4, border: '1px solid #d9d9d9', borderRadius: 4 }}
          >
            {Object.entries(TASK_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{TASK_TYPE_ICONS[k as RecognitionTaskType]} {v}</option>
            ))}
          </select>
        </label>
        <label style={{ fontSize: 12 }}>
          源资产 ID
          <input
            data-testid="ir-create-assetid"
            type="text"
            value={sourceAssetId}
            onChange={(e) => setSourceAssetId(e.target.value)}
            style={{ width: '100%', padding: '6px 10px', fontSize: 12, marginTop: 4, border: '1px solid #d9d9d9', borderRadius: 4 }}
          />
        </label>
        <label style={{ fontSize: 12 }}>
          文件名
          <input
            data-testid="ir-create-filename"
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            style={{ width: '100%', padding: '6px 10px', fontSize: 12, marginTop: 4, border: '1px solid #d9d9d9', borderRadius: 4 }}
          />
        </label>
        <div style={{ fontSize: 11, color: '#1890ff' }} data-testid="ir-create-engine-hint">
          将自动选择引擎: <strong>{RECOGNITION_ENGINE_LABELS[ENGINE_TASK_MAP[taskType]]}</strong>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            data-testid="ir-create-submit"
            onClick={handleSubmit}
            style={{
              padding: '6px 16px', fontSize: 12, borderRadius: 4,
              background: '#52c41a', color: '#fff', border: 'none', cursor: 'pointer',
            }}
          >
            开始识别
          </button>
          <button
            type="button"
            data-testid="ir-create-cancel"
            onClick={onClose}
            style={{
              padding: '6px 16px', fontSize: 12, borderRadius: 4,
              background: '#fff', color: '#595959', border: '1px solid #d9d9d9', cursor: 'pointer',
            }}
          >
            取消
          </button>
        </div>
      </div>
    </div>
  )
}