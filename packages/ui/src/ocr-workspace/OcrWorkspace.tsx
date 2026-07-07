/**
 * Phase 100 OCR + 文档解析 工作台 (V11 Sprint 3 Day 35)
 *
 * OCR 任务列表 + 文档解析 + 引擎选择 + 文本块预览
 */

import React, { useState } from 'react'
import {
  useOcrTasks, useOcrBlocks, useParsedDocuments, useEngines, useOcrStats,
  useCreateOcrTask, useParseDocument,
} from './useOcr'
import {
  OCR_STATUS_LABELS, OCR_STATUS_COLORS,
  DOC_STATUS_LABELS, DOC_STATUS_COLORS,
  BLOCK_TYPE_LABELS, FORMAT_ICONS,
  type OcrTask, type ParsedDocument, type EngineInfo,
} from './types'

export interface OcrWorkspaceProps {
  variant?: 'pc' | 'h5' | 'app' | 'pad' | 'miniprogram'
  onTaskSelect?: (task: OcrTask) => void
}

export function OcrWorkspace({ variant = 'pc', onTaskSelect }: OcrWorkspaceProps) {
  const isCompact = variant === 'h5' || variant === 'app' || variant === 'miniprogram'
  const { data: tasks = [], isLoading } = useOcrTasks()
  const { data: docs = [] } = useParsedDocuments()
  const { data: engines = [] } = useEngines()
  const { data: stats } = useOcrStats()
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'tasks' | 'documents' | 'engines'>('tasks')

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? tasks[0]

  if (isLoading) {
    return <div data-testid="ocr-loading" style={{ padding: 24, textAlign: 'center', color: '#8c8c8c' }}>加载中...</div>
  }

  return (
    <div
      data-testid="ocr-workspace"
      data-variant={variant}
      style={{
        padding: isCompact ? 12 : 20, background: '#f0f2f5', minHeight: '100vh',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1 style={{ fontSize: isCompact ? 18 : 22, margin: '0 0 16px' }}>OCR + 文档解析工作台</h1>

      {/* 统计面板 */}
      {stats && <StatsPanel stats={stats} isCompact={isCompact} />}

      {/* Tab 切换 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid #d9d9d9' }}>
        <TabButton label={`OCR 任务 (${tasks.length})`} active={activeTab === 'tasks'} testid="ocr-tab-tasks" onClick={() => setActiveTab('tasks')} />
        <TabButton label={`已解析文档 (${docs.length})`} active={activeTab === 'documents'} testid="ocr-tab-docs" onClick={() => setActiveTab('documents')} />
        <TabButton label={`引擎目录 (${engines.length})`} active={activeTab === 'engines'} testid="ocr-tab-engines" onClick={() => setActiveTab('engines')} />
      </div>

      {activeTab === 'tasks' && (
        <div style={{ display: 'grid', gridTemplateColumns: isCompact ? '1fr' : '1fr 1fr', gap: 16 }}>
          {/* 左侧任务列表 */}
          <div>
            <NewTaskForm isCompact={isCompact} />
            <div style={{ display: 'grid', gap: 8 }}>
              {tasks.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  selected={selectedTask?.id === t.id}
                  isCompact={isCompact}
                  onClick={() => {
                    setSelectedTaskId(t.id)
                    onTaskSelect?.(t)
                  }}
                />
              ))}
            </div>
          </div>
          {/* 右侧任务详情 */}
          {selectedTask && <TaskDetail task={selectedTask} isCompact={isCompact} />}
        </div>
      )}

      {activeTab === 'documents' && (
        <div style={{ display: 'grid', gridTemplateColumns: isCompact ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {docs.map((d) => <DocumentCard key={d.id} doc={d} isCompact={isCompact} />)}
        </div>
      )}

      {activeTab === 'engines' && (
        <div style={{ display: 'grid', gridTemplateColumns: isCompact ? '1fr' : 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {engines.map((e) => <EngineCard key={e.type} engine={e} isCompact={isCompact} />)}
        </div>
      )}
    </div>
  )
}

// ============ TabButton ============

function TabButton({ label, active, testid, onClick }: { label: string; active: boolean; testid: string; onClick: () => void }) {
  return (
    <button
      type="button"
      data-testid={testid}
      data-active={active}
      onClick={onClick}
      style={{
        padding: '8px 16px', fontSize: 13, border: 'none',
        background: 'transparent', cursor: 'pointer',
        borderBottom: active ? '2px solid #1890ff' : '2px solid transparent',
        color: active ? '#1890ff' : '#595959',
        fontWeight: active ? 600 : 400,
      }}
    >
      {label}
    </button>
  )
}

// ============ StatsPanel ============

function StatsPanel({ stats, isCompact }: { stats: any; isCompact: boolean }) {
  return (
    <div
      data-testid="ocr-stats-panel"
      style={{
        background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: isCompact ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)', gap: 12 }}>
        <StatBox label="总任务" value={stats.totalTasks} testid="ocr-stat-tasks" />
        <StatBox label="已完成" value={stats.completedTasks} testid="ocr-stat-completed" color="#52c41a" />
        <StatBox label="文档" value={stats.totalDocuments} testid="ocr-stat-docs" />
        <StatBox label="总字符" value={stats.totalChars.toLocaleString()} testid="ocr-stat-chars" />
        <StatBox label="平均置信度" value={(stats.avgConfidence * 100).toFixed(1) + '%'} testid="ocr-stat-confidence" color="#13c2c2" />
      </div>
    </div>
  )
}

function StatBox({ label, value, testid, color }: { label: string; value: any; testid: string; color?: string }) {
  return (
    <div data-testid={testid} style={{ background: '#fafafa', padding: 10, borderRadius: 6 }}>
      <div style={{ fontSize: 11, color: '#8c8c8c' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4, color: color ?? '#262626' }}>{value}</div>
    </div>
  )
}

// ============ NewTaskForm ============

function NewTaskForm({ isCompact }: { isCompact: boolean }) {
  const createMut = useCreateOcrTask()
  const [assetId, setAssetId] = useState('asset-new-001')
  const [engine, setEngine] = useState('mock-paddleocr')

  const handleCreate = () => {
    createMut.mutate({ sourceAssetId: assetId, engine: engine as any, language: 'auto' })
  }

  return (
    <div
      data-testid="ocr-new-task-form"
      style={{
        background: '#fff', padding: 12, borderRadius: 8, marginBottom: 12,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          data-testid="ocr-new-asset"
          type="text"
          value={assetId}
          onChange={(e) => setAssetId(e.target.value)}
          placeholder="资产 ID"
          style={{ flex: 1, minWidth: 120, padding: '6px 10px', fontSize: 12, border: '1px solid #d9d9d9', borderRadius: 4 }}
        />
        <select
          data-testid="ocr-new-engine"
          value={engine}
          onChange={(e) => setEngine(e.target.value)}
          style={{ padding: '6px 10px', fontSize: 12, border: '1px solid #d9d9d9', borderRadius: 4 }}
        >
          <option value="mock-paddleocr">PaddleOCR</option>
          <option value="mock-azure-cv">Azure CV</option>
          <option value="mock-tesseract">Tesseract</option>
        </select>
        <button
          type="button"
          data-testid="ocr-new-submit"
          onClick={handleCreate}
          style={{
            padding: '6px 16px', fontSize: 12, borderRadius: 4,
            background: '#1890ff', color: '#fff', border: 'none', cursor: 'pointer',
          }}
        >
          创建 OCR 任务
        </button>
      </div>
    </div>
  )
}

// ============ TaskCard ============

interface TaskCardProps { task: OcrTask; selected: boolean; isCompact: boolean; onClick: () => void }
function TaskCard({ task, selected, isCompact, onClick }: TaskCardProps) {
  const status = task.status
  const color = OCR_STATUS_COLORS[status]
  return (
    <div
      data-testid={`ocr-task-${task.id}`}
      data-status={status}
      onClick={onClick}
      style={{
        background: '#fff', padding: 12, borderRadius: 8, cursor: 'pointer',
        boxShadow: selected ? '0 2px 8px rgba(24,144,255,0.2)' : '0 1px 4px rgba(0,0,0,0.06)',
        borderLeft: selected ? '4px solid #1890ff' : `4px solid ${color}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div>
          <strong style={{ fontSize: 13, color: '#262626' }}>{task.filename}</strong>
          <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 4 }}>
            {task.engine} · {task.language} · {task.blockCount} 块
          </div>
        </div>
        <span
          data-testid={`ocr-task-status-${task.id}`}
          style={{
            padding: '2px 8px', fontSize: 10, borderRadius: 10,
            background: `${color}20`, color, whiteSpace: 'nowrap',
          }}
        >
          {OCR_STATUS_LABELS[status]}
        </span>
      </div>
      {status === 'processing' && (
        <div data-testid={`ocr-task-progress-${task.id}`} style={{ marginTop: 8 }}>
          <div style={{ height: 4, background: '#f0f0f0', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${task.progress * 100}%`, height: '100%', background: '#1890ff' }} />
          </div>
          <div style={{ fontSize: 10, color: '#8c8c8c', marginTop: 2 }}>{(task.progress * 100).toFixed(0)}%</div>
        </div>
      )}
      {task.summary && (
        <div style={{ fontSize: 10, color: '#595959', marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span>页: {task.summary.pageCount}</span>
          <span>字符: {task.summary.totalChars}</span>
          <span>置信度: {(task.summary.avgConfidence * 100).toFixed(0)}%</span>
        </div>
      )}
    </div>
  )
}

// ============ TaskDetail ============

function TaskDetail({ task, isCompact }: { task: OcrTask; isCompact: boolean }) {
  const { data: blocks = [] } = useOcrBlocks(task.id)
  return (
    <div data-testid={`ocr-task-detail-${task.id}`} style={{ background: '#fff', borderRadius: 8, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <h3 style={{ fontSize: 14, margin: '0 0 12px' }}>任务详情: {task.filename}</h3>
      <div style={{ display: 'grid', gap: 6, marginBottom: 12, fontSize: 12 }}>
        <div><strong>引擎:</strong> {task.engine}</div>
        <div><strong>语言:</strong> {task.language}</div>
        {task.durationMs && <div data-testid="ocr-task-duration"><strong>耗时:</strong> {task.durationMs} ms</div>}
        <div><strong>Layout:</strong> {task.enableLayoutAnalysis ? '是' : '否'} · <strong>Table:</strong> {task.enableTableDetection ? '是' : '否'}</div>
      </div>
      <h4 style={{ fontSize: 12, margin: '12px 0 8px', color: '#8c8c8c' }}>文本块 ({blocks.length})</h4>
      <div style={{ display: 'grid', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
        {blocks.map((b) => (
          <div
            key={b.id}
            data-testid={`ocr-block-${b.id}`}
            data-block-type={b.blockType}
            style={{
              padding: 8, borderRadius: 4,
              background: b.blockType === 'title' ? '#fff7e6' : '#fafafa',
              borderLeft: `3px solid ${b.blockType === 'title' ? '#faad14' : '#d9d9d9'}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#8c8c8c', marginBottom: 2 }}>
              <span>{BLOCK_TYPE_LABELS[b.blockType as keyof typeof BLOCK_TYPE_LABELS] ?? b.blockType} · 页 {b.page}</span>
              <span data-testid={`ocr-block-conf-${b.id}`}>置信 {(b.confidence * 100).toFixed(0)}%</span>
            </div>
            <div style={{ fontSize: 12, color: '#262626' }}>{b.text}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============ DocumentCard ============

function DocumentCard({ doc, isCompact }: { doc: ParsedDocument; isCompact: boolean }) {
  const status = doc.status
  const color = DOC_STATUS_COLORS[status]
  return (
    <div
      data-testid={`ocr-doc-${doc.id}`}
      data-format={doc.format}
      style={{
        background: '#fff', borderRadius: 8, padding: 14,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        borderTop: `3px solid ${color}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <strong style={{ fontSize: 13 }}>{FORMAT_ICONS[doc.format]} {doc.filename}</strong>
        <span data-testid={`ocr-doc-status-${doc.id}`} style={{
          padding: '2px 8px', fontSize: 10, borderRadius: 10,
          background: `${color}20`, color,
        }}>{DOC_STATUS_LABELS[status]}</span>
      </div>
      <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 6 }}>
        {doc.parser} · {doc.pageCount} 页 · {doc.charCount.toLocaleString()} 字符
      </div>
      <div style={{ fontSize: 11, color: '#595959', display: 'flex', gap: 6, marginBottom: 8 }}>
        <span data-testid={`ocr-doc-tables-${doc.id}`}>📊 {doc.tableCount} 表格</span>
        <span data-testid={`ocr-doc-lists-${doc.id}`}>📝 {doc.listCount} 列表</span>
      </div>
      <div style={{ fontSize: 11, color: '#262626', padding: 8, background: '#fafafa', borderRadius: 4, maxHeight: 60, overflow: 'hidden' }}>
        {doc.previewText}
      </div>
    </div>
  )
}

// ============ EngineCard ============

function EngineCard({ engine, isCompact }: { engine: EngineInfo; isCompact: boolean }) {
  const isOcr = engine.category === 'ocr'
  return (
    <div
      data-testid={`ocr-engine-${engine.type}`}
      data-category={engine.category}
      style={{
        background: '#fff', borderRadius: 8, padding: 14,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        borderTop: `3px solid ${isOcr ? '#1890ff' : '#13c2c2'}`,
      }}
    >
      <div style={{ marginBottom: 6 }}>
        <strong style={{ fontSize: 13 }}>{engine.displayName}</strong>
      </div>
      <div style={{ fontSize: 10, color: '#8c8c8c', marginBottom: 8 }}>
        {isOcr ? 'OCR' : 'Parser'} · {engine.type}
      </div>
      <div style={{ fontSize: 11, color: '#262626', display: 'grid', gap: 3 }}>
        {isOcr && engine.languages && (
          <div data-testid={`ocr-engine-langs-${engine.type}`}>语言: {engine.languages.join(', ')}</div>
        )}
        {!isOcr && engine.formats && (
          <div data-testid={`ocr-engine-formats-${engine.type}`}>格式: {engine.formats.join(', ')}</div>
        )}
        <div>耗时: {engine.avgTimePerPageMs} ms/页</div>
        <div>免费额度: {engine.freeQuotaPerMonth === Infinity ? '∞' : engine.freeQuotaPerMonth.toLocaleString()}/月</div>
        <div>单价: ¥{engine.unitPriceCny}/页</div>
      </div>
    </div>
  )
}