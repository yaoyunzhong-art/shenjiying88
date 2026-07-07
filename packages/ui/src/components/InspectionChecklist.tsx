'use client';

import React, { useState, useCallback } from 'react';

// ---- 类型定义 ----

/** 巡检检查项状态 */
export type InspectionItemStatus = 'pass' | 'fail' | 'pending';

/** 巡检检查项 */
export interface InspectionItem {
  id: string;
  label: string;
  /** 检查类别: 环境/设备/人员/安全/卫生 */
  category: 'environment' | 'device' | 'staff' | 'safety' | 'hygiene';
  /** 初始状态 (默认 pending) */
  defaultStatus?: InspectionItemStatus;
  /** 备注 */
  note?: string;
  /** 是否必检 */
  required?: boolean;
}

/** 巡检检查面板 Props */
export interface InspectionChecklistProps {
  /** 检查项列表 */
  items: InspectionItem[];
  /** 检查人 */
  inspector?: string;
  /** 门店名称 */
  storeName?: string;
  /** 检查日期 */
  date?: string;
  /** 是否加载中 */
  loading?: boolean;
  /** 状态变更回调 */
  onStatusChange?: (itemId: string, status: InspectionItemStatus) => void;
  /** 备注变更回调 */
  onNoteChange?: (itemId: string, note: string) => void;
  /** 提交回调 */
  onSubmit?: (results: InspectionResult[]) => void;
  /** 提交中 */
  submitting?: boolean;
  /** 自定义类名 */
  className?: string;
}

/** 提交结果 */
export interface InspectionResult {
  itemId: string;
  status: InspectionItemStatus;
  note?: string;
}

// ---- 常量 ----

const CATEGORY_LABELS: Record<InspectionItem['category'], string> = {
  environment: '环境',
  device: '设备',
  staff: '人员',
  safety: '安全',
  hygiene: '卫生',
};

const CATEGORY_ORDER: InspectionItem['category'][] = [
  'environment',
  'device',
  'staff',
  'safety',
  'hygiene',
];

const CATEGORY_ICONS: Record<InspectionItem['category'], string> = {
  environment: '🏪',
  device: '🔧',
  staff: '👤',
  safety: '🛡️',
  hygiene: '🧹',
};

const CONTAINER_STYLE: React.CSSProperties = {
  padding: 20,
  color: '#f8fafc',
};

const HEADER_STYLE: React.CSSProperties = {
  marginBottom: 18,
};

const TITLE_STYLE: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: '#f1f5f9',
  margin: 0,
};

const SUBTITLE_STYLE: React.CSSProperties = {
  fontSize: 12,
  color: '#64748b',
  marginTop: 4,
};

const CATEGORY_HEADER_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 14,
  fontWeight: 600,
  color: '#cbd5e1',
  padding: '8px 0',
  borderBottom: '1px solid rgba(148,163,184,0.12)',
  marginBottom: 8,
};

const ITEM_ROW_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 12px',
  borderRadius: 8,
  background: 'rgba(15,23,42,0.25)',
  border: '1px solid rgba(148,163,184,0.08)',
  marginBottom: 6,
};

const STATUS_BUTTON_BASE: React.CSSProperties = {
  padding: '4px 12px',
  borderRadius: 6,
  border: '1px solid rgba(148,163,184,0.15)',
  background: 'transparent',
  color: '#94a3b8',
  fontSize: 12,
  cursor: 'pointer',
  transition: 'all 0.12s ease',
};

const TEXTAREA_STYLE: React.CSSProperties = {
  width: '100%',
  borderRadius: 8,
  border: '1px solid rgba(148,163,184,0.15)',
  background: 'rgba(15,23,42,0.3)',
  color: '#e2e8f0',
  fontSize: 12,
  padding: '8px 10px',
  resize: 'vertical',
  minHeight: 36,
  outline: 'none',
  boxSizing: 'border-box',
};

const SUBMIT_BUTTON_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '12px 0',
  borderRadius: 10,
  border: 'none',
  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
  color: '#fff',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'opacity 0.15s',
  marginTop: 16,
};

const REQUIRED_MARK_STYLE: React.CSSProperties = {
  color: '#f87171',
  marginLeft: 4,
  fontSize: 12,
};

// ---- 工具函数 ----

function formatStatus(status: InspectionItemStatus): string {
  switch (status) {
    case 'pass':
      return '✅ 通过';
    case 'fail':
      return '❌ 不通过';
    case 'pending':
      return '⬜ 待检查';
  }
}

function statusButtonColor(
  current: InspectionItemStatus,
  target: InspectionItemStatus,
): React.CSSProperties {
  if (current !== target) return {};
  switch (target) {
    case 'pass':
      return { background: 'rgba(74,222,128,0.15)', borderColor: '#4ade80', color: '#4ade80' };
    case 'fail':
      return { background: 'rgba(248,113,113,0.15)', borderColor: '#f87171', color: '#f87171' };
    default:
      return {};
  }
}

function computePassRate(results: InspectionItem[]): string {
  const checked = results.filter((r) => r.defaultStatus === 'pass' || r.defaultStatus === 'fail');
  if (checked.length === 0) return '0%';
  const passed = checked.filter((r) => r.defaultStatus === 'pass').length;
  return `${((passed / checked.length) * 100).toFixed(0)}%`;
}

// ---- 主组件 ----

/**
 * InspectionChecklist — 巡检检查面板
 *
 * 店长巡店时逐项检查门店环境、设备、人员、安全、卫生等状况，
 * 支持状态切换与备注提交。
 *
 * @example
 * <InspectionChecklist
 *   storeName="朝阳旗舰店"
 *   inspector="张三"
 *   items={[
 *     { id: '1', label: '收银台整洁', category: 'environment', required: true },
 *     { id: '2', label: 'POS机运行正常', category: 'device', defaultStatus: 'pass' },
 *   ]}
 * />
 */
export function InspectionChecklist({
  items,
  inspector,
  storeName,
  date,
  loading = false,
  onStatusChange,
  onNoteChange,
  onSubmit,
  submitting = false,
  className,
}: InspectionChecklistProps) {
  const [localItems, setLocalItems] = useState<InspectionItem[]>(
    () =>
      items.map((item) => ({
        ...item,
        defaultStatus: item.defaultStatus ?? 'pending',
      })),
  );

  const handleStatusToggle = useCallback(
    (itemId: string) => {
      setLocalItems((prev) => {
        const updated = prev.map((item) => {
          if (item.id !== itemId) return item;
          const next: InspectionItemStatus =
            item.defaultStatus === 'pass'
              ? 'fail'
              : item.defaultStatus === 'fail'
                ? 'pending'
                : 'pass';
          const newItem = { ...item, defaultStatus: next };
          onStatusChange?.(itemId, next);
          return newItem;
        });
        return updated;
      });
    },
    [onStatusChange],
  );

  const handleNoteChange = useCallback(
    (itemId: string, note: string) => {
      setLocalItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, note } : item)),
      );
      onNoteChange?.(itemId, note);
    },
    [onNoteChange],
  );

  const handleSubmit = useCallback(() => {
    const results: InspectionResult[] = localItems.map((item) => ({
      itemId: item.id,
      status: item.defaultStatus ?? 'pending',
      note: item.note,
    }));
    onSubmit?.(results);
  }, [localItems, onSubmit]);

  if (loading) {
    return (
      <div className={className} style={CONTAINER_STYLE} data-testid="inspection-checklist-loading">
        <div
          style={{
            height: 160,
            borderRadius: 12,
            background: 'rgba(15,23,42,0.3)',
            border: '1px solid rgba(148,163,184,0.08)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
        <div style={{ textAlign: 'center', color: '#64748b', fontSize: 13, marginTop: 12 }}>
          正在加载巡检项...
        </div>
      </div>
    );
  }

  const totalItems = localItems.length;
  const checkedItems = localItems.filter(
    (item) => item.defaultStatus === 'pass' || item.defaultStatus === 'fail',
  );
  const passItems = localItems.filter((item) => item.defaultStatus === 'pass');
  const failedItems = localItems.filter((item) => item.defaultStatus === 'fail');

  return (
    <div className={className} style={CONTAINER_STYLE} data-testid="inspection-checklist-root">
      {/* 头部 */}
      <div style={HEADER_STYLE}>
        <h3 style={TITLE_STYLE} data-testid="inspection-checklist-title">
          {storeName ? `${storeName} — 巡店检查` : '巡店检查'}
        </h3>
        <div style={SUBTITLE_STYLE}>
          {inspector && <span data-testid="inspection-checklist-inspector">检查人: {inspector}</span>}
          {date && (
            <span style={{ marginLeft: 12 }} data-testid="inspection-checklist-date">
              日期: {date}
            </span>
          )}
        </div>
      </div>

      {/* 进度摘要 */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
        data-testid="inspection-checklist-summary"
      >
        <SummaryChip label="全部" value={String(totalItems)} color="#94a3b8" />
        <SummaryChip label="已检" value={String(checkedItems.length)} color="#60a5fa" />
        <SummaryChip label="通过" value={String(passItems.length)} color="#4ade80" />
        <SummaryChip label="未通过" value={String(failedItems.length)} color="#f87171" />
        {checkedItems.length > 0 && (
          <SummaryChip
            label="通过率"
            value={`${computePassRate(localItems)}`}
            color="#a78bfa"
          />
        )}
      </div>

      {/* 按类别分组 */}
      {CATEGORY_ORDER.map((cat) => {
        const catItems = localItems.filter((item) => item.category === cat);
        if (catItems.length === 0) return null;

        return (
          <div key={cat} style={{ marginBottom: 14 }}>
            <div style={CATEGORY_HEADER_STYLE}>
              <span>{CATEGORY_ICONS[cat]}</span>
              <span>{CATEGORY_LABELS[cat]}</span>
              <span style={{ fontSize: 11, color: '#475569', marginLeft: 'auto' }}>
                {catItems.filter((i) => i.defaultStatus === 'pass').length}/{catItems.length}
              </span>
            </div>

            {catItems.map((item) => (
              <div key={item.id} style={ITEM_ROW_STYLE} data-testid={`inspection-item-${item.id}`}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      color: '#e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {item.label}
                    {item.required && <span style={REQUIRED_MARK_STYLE}>*必检</span>}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    {formatStatus(item.defaultStatus ?? 'pending')}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button
                    type="button"
                    style={{ ...STATUS_BUTTON_BASE, ...statusButtonColor(item.defaultStatus ?? 'pending', 'pass') }}
                    onClick={() => handleStatusToggle(item.id)}
                    data-testid={`inspection-btn-${item.id}-pass`}
                  >
                    通过
                  </button>
                  <button
                    type="button"
                    style={{ ...STATUS_BUTTON_BASE, ...statusButtonColor(item.defaultStatus ?? 'pending', 'fail') }}
                    onClick={() => {
                      setLocalItems((prev) => {
                        const updated = prev.map((i) =>
                          i.id === item.id
                            ? { ...i, defaultStatus: i.defaultStatus === 'fail' ? 'pending' : 'fail' as InspectionItemStatus }
                            : i,
                        );
                        const newStatus: InspectionItemStatus =
                          item.defaultStatus === 'fail' ? 'pending' : 'fail';
                        onStatusChange?.(item.id, newStatus);
                        return updated;
                      });
                    }}
                    data-testid={`inspection-btn-${item.id}-fail`}
                  >
                    不通过
                  </button>
                </div>
              </div>
            ))}

            {/* 备注区 */}
            {catItems.map(
              (item) =>
                item.defaultStatus === 'fail' && (
                  <div key={`note-${item.id}`} style={{ marginBottom: 8, paddingLeft: 12 }}>
                    <textarea
                      style={TEXTAREA_STYLE}
                      placeholder="输入不通过原因..."
                      value={item.note ?? ''}
                      onChange={(e) => handleNoteChange(item.id, e.target.value)}
                      data-testid={`inspection-note-${item.id}`}
                    />
                  </div>
                ),
            )}
          </div>
        );
      })}

      {/* 提交按钮 */}
      {onSubmit && (
        <button
          type="button"
          style={{
            ...SUBMIT_BUTTON_STYLE,
            opacity: submitting ? 0.6 : 1,
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
          onClick={handleSubmit}
          disabled={submitting}
          data-testid="inspection-checklist-submit"
        >
          {submitting ? '提交中...' : '提交检查结果'}
        </button>
      )}
    </div>
  );
}

// ---- 内联辅助组件 ----

function SummaryChip({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 14px',
        borderRadius: 8,
        background: 'rgba(15,23,42,0.3)',
        border: `1px solid ${color}33`,
      }}
      data-testid={`summary-chip-${label}`}
    >
      <span style={{ fontSize: 12, color: '#94a3b8' }}>{label}</span>
      <span style={{ fontSize: 16, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}
