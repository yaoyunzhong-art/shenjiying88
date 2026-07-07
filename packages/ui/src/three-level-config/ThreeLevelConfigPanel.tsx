/**
 * 三级独立配置 - 三工作台面板 (V9 需求 4 · V10 Day 6)
 *
 * 统一展示 W-S (门店) / W-T (租户) / W-B (品牌) 三个工作台配置
 * 支持:
 * - 5 端适配 (PC/H5/APP/Pad/小程序)
 * - 分类切换
 * - 实时编辑 + 乐观更新
 * - 脱敏显示 (secret)
 * - 继承标识
 */

import React, { useState } from 'react'
import { useWorkbenchConfigs } from './useThreeLevelConfig'
import {
  CATEGORY_LABELS,
  SENSITIVITY_COLORS,
  SENSITIVITY_LABELS,
  WORKBENCH_CARDS,
  type ConfigCategory,
  type WorkbenchCode,
  type EffectiveConfig,
  type ConfigSensitivity,
} from './types'

export interface ThreeLevelConfigPanelProps {
  /** 默认显示的工作台 */
  defaultWorkbench?: WorkbenchCode
  /** 视图密度 (compact=卡片列表, comfortable=编辑表单) */
  density?: 'compact' | 'comfortable'
  /** 是否只读 */
  readOnly?: boolean
  /** 编辑回调 (供父组件拦截) */
  onEdit?: (workbench: WorkbenchCode, key: string, value: string) => void
  /** 端类型 (用于响应式) */
  variant?: 'pc' | 'h5' | 'app' | 'pad' | 'miniprogram'
}

const DEFAULT_CATEGORIES: ConfigCategory[] = ['pos', 'print', 'member', 'marketing', 'inventory', 'integration', 'ai', 'compliance', 'billing', 'branding']

/**
 * 三工作台统一面板
 */
export function ThreeLevelConfigPanel({
  defaultWorkbench = 'W-T',
  density = 'comfortable',
  readOnly = false,
  onEdit,
  variant = 'pc',
}: ThreeLevelConfigPanelProps) {
  const [activeWorkbench, setActiveWorkbench] = useState<WorkbenchCode>(defaultWorkbench)
  const [activeCategory, setActiveCategory] = useState<ConfigCategory | 'all'>('all')
  const { data, isLoading, error } = useWorkbenchConfigs(activeWorkbench)

  const isCompact = variant === 'h5' || variant === 'app' || variant === 'miniprogram'
  const containerMaxWidth = variant === 'pc' ? 1080 : variant === 'pad' ? 768 : '100%'

  const filtered = (data ?? []).filter((cfg) => {
    if (activeCategory === 'all') return true
    const prefix = activeCategory + '.'
    return cfg.key.startsWith(prefix)
  })

  return (
    <div
      data-testid="three-level-config-panel"
      data-workbench={activeWorkbench}
      data-density={density}
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        maxWidth: containerMaxWidth,
        margin: '0 auto',
        padding: isCompact ? 12 : 20,
      }}
    >
      <h2 style={{ fontSize: isCompact ? 18 : 22, margin: '0 0 16px' }}>三级配置工作台</h2>

      {/* 工作台切换卡 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isCompact ? '1fr' : 'repeat(3, 1fr)',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {WORKBENCH_CARDS.map((card) => {
          const isActive = card.workbench === activeWorkbench
          return (
            <button
              key={card.workbench}
              type="button"
              onClick={() => setActiveWorkbench(card.workbench)}
              data-testid={`workbench-card-${card.workbench}`}
              style={{
                padding: isCompact ? 12 : 16,
                border: `2px solid ${isActive ? card.color : '#e8e8e8'}`,
                borderRadius: 8,
                background: isActive ? `${card.color}10` : '#fff',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: card.color, fontSize: 16 }}>{card.workbench}</strong>
                <span style={{ fontSize: 12, color: '#8c8c8c' }}>{card.configCount} 项</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{card.title}</div>
              <div style={{ fontSize: 12, color: '#595959', marginTop: 4 }}>{card.description}</div>
            </button>
          )
        })}
      </div>

      {/* 分类过滤 */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        <FilterChip
          active={activeCategory === 'all'}
          onClick={() => setActiveCategory('all')}
          label="全部"
        />
        {DEFAULT_CATEGORIES.map((cat) => (
          <FilterChip
            key={cat}
            active={activeCategory === cat}
            onClick={() => setActiveCategory(cat)}
            label={CATEGORY_LABELS[cat]}
          />
        ))}
      </div>

      {/* 配置项列表 */}
      {isLoading && <div data-testid="loading">加载中...</div>}
      {error && <div data-testid="error" style={{ color: '#f5222d' }}>加载失败</div>}

      {!isLoading && !error && (
        <div style={{ display: 'grid', gap: 12 }}>
          {filtered.map((cfg) => (
            <ConfigRow
              key={cfg.key}
              cfg={cfg}
              density={density}
              readOnly={readOnly}
              isCompact={isCompact}
              onEdit={(value) => onEdit?.(activeWorkbench, cfg.key, value)}
            />
          ))}
          {filtered.length === 0 && (
            <div data-testid="empty" style={{ textAlign: 'center', padding: 32, color: '#8c8c8c' }}>
              当前分类无配置项
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============ 子组件 ============

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '4px 12px',
        fontSize: 13,
        border: '1px solid #d9d9d9',
        borderRadius: 16,
        background: active ? '#1677ff' : '#fff',
        color: active ? '#fff' : '#595959',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}

function inferSensitivity(key: string): ConfigSensitivity {
  if (key.includes('webhook') || key.includes('secret') || key.includes('tax_id')) return 'secret'
  if (key.includes('audit') || key.includes('retention')) return 'restricted'
  if (key.includes('budget') || key.includes('threshold')) return 'internal'
  return 'public'
}

function ConfigRow({
  cfg,
  density,
  readOnly,
  isCompact,
  onEdit,
}: {
  cfg: EffectiveConfig
  density: 'compact' | 'comfortable'
  readOnly: boolean
  isCompact: boolean
  onEdit: (value: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(cfg.value)
  const sensitivity = inferSensitivity(cfg.key)

  const handleSave = () => {
    onEdit(value)
    setEditing(false)
  }

  return (
    <div
      data-testid={`config-row-${cfg.key}`}
      data-inherited={cfg.inherited}
      data-masked={cfg.isMasked}
      style={{
        padding: isCompact ? 10 : 14,
        border: '1px solid #f0f0f0',
        borderRadius: 6,
        background: cfg.inherited ? '#fafafa' : '#fff',
        display: 'grid',
        gridTemplateColumns: isCompact ? '1fr' : '1fr 2fr auto',
        gap: 12,
        alignItems: 'center',
      }}
    >
      <div>
        <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#262626' }}>{cfg.key}</div>
        <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
          <Tag color={SENSITIVITY_COLORS[sensitivity]} label={SENSITIVITY_LABELS[sensitivity]} />
          {cfg.inherited && <Tag color="#8c8c8c" label={`继承自 ${cfg.sourceLevel}`} />}
        </div>
      </div>

      <div>
        {editing && !readOnly ? (
          <input
            data-testid={`config-input-${cfg.key}`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px',
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              fontFamily: 'monospace',
            }}
          />
        ) : (
          <div
            data-testid={`config-value-${cfg.key}`}
            style={{
              fontFamily: 'monospace',
              fontSize: 13,
              color: cfg.isMasked ? '#8c8c8c' : '#262626',
              fontStyle: cfg.isMasked ? 'italic' : 'normal',
            }}
          >
            {cfg.isMasked ? `${cfg.value} (已脱敏)` : cfg.value}
          </div>
        )}
      </div>

      {!readOnly && (
        <div style={{ display: 'flex', gap: 4 }}>
          {editing ? (
            <>
              <button
                type="button"
                onClick={handleSave}
                data-testid={`config-save-${cfg.key}`}
                style={{
                  padding: '4px 10px',
                  border: 'none',
                  borderRadius: 4,
                  background: '#52c41a',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                保存
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue(cfg.value)
                  setEditing(false)
                }}
                style={{
                  padding: '4px 10px',
                  border: '1px solid #d9d9d9',
                  borderRadius: 4,
                  background: '#fff',
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              data-testid={`config-edit-${cfg.key}`}
              style={{
                padding: '4px 10px',
                border: '1px solid #1677ff',
                borderRadius: 4,
                background: '#fff',
                color: '#1677ff',
                cursor: 'pointer',
              }}
            >
              编辑
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function Tag({ color, label }: { color: string; label: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '1px 8px',
        fontSize: 11,
        background: `${color}20`,
        color,
        borderRadius: 10,
      }}
    >
      {label}
    </span>
  )
}

// ============ 三个工作台专用包装 (语义化) ============

export function WStoreConfigPanel(props: Omit<ThreeLevelConfigPanelProps, 'defaultWorkbench'>) {
  return <ThreeLevelConfigPanel {...props} defaultWorkbench="W-S" />
}

export function WTenantConfigPanel(props: Omit<ThreeLevelConfigPanelProps, 'defaultWorkbench'>) {
  return <ThreeLevelConfigPanel {...props} defaultWorkbench="W-T" />
}

export function WBrandConfigPanel(props: Omit<ThreeLevelConfigPanelProps, 'defaultWorkbench'>) {
  return <ThreeLevelConfigPanel {...props} defaultWorkbench="W-B" />
}
