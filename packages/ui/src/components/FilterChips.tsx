'use client';

import React from 'react';

// ---- 类型 ----

export interface FilterChip {
  key: string;
  label: string;
  /** 可选的计数值展示在 chip 内 */
  count?: number;
  /** 视觉色调，默认 neutral */
  tone?: 'neutral' | 'warning' | 'danger' | 'success';
}

export interface FilterChipsProps {
  /** 提示文案 */
  hint?: string;
  /** 活跃的过滤条件列表 */
  chips: FilterChip[];
  /** 清除单个过滤条件的回调 */
  onRemove: (key: string) => void;
  /** 清除全部过滤条件的回调 */
  onClearAll?: () => void;
  /** 组件尺寸 */
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
}

// ---- 色调映射 ----

const TONE_MAP: Record<NonNullable<FilterChip['tone']>, { bg: string; border: string; color: string; hoverBg: string }> = {
  neutral: { bg: 'rgba(71, 85, 105, 0.2)', border: 'rgba(100, 116, 139, 0.3)', color: '#cbd5e1', hoverBg: 'rgba(71, 85, 105, 0.35)' },
  warning: { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(251, 191, 36, 0.3)', color: '#fbbf24', hoverBg: 'rgba(245, 158, 11, 0.22)' },
  danger: { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(248, 113, 113, 0.3)', color: '#f87171', hoverBg: 'rgba(239, 68, 68, 0.22)' },
  success: { bg: 'rgba(34, 197, 94, 0.12)', border: 'rgba(74, 222, 128, 0.3)', color: '#4ade80', hoverBg: 'rgba(34, 197, 94, 0.22)' },
};

const X_ICON = (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const CLEAR_ICON = (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// ---- 组件 ----

/**
 * FilterChips — 活跃过滤条件展示组件
 *
 * 以标签形式展示当前已应用的过滤条件，支持单独移除或一键清除。
 * 适用于列表页中搭配 Tabs / SearchFilterInput 的视觉反馈层。
 *
 * @example
 * <FilterChips
 *   chips={[
 *     { key: 'status', label: '运营中', tone: 'success', count: 8 },
 *     { key: 'region', label: '亚太' },
 *   ]}
 *   onRemove={(key) => removeFilter(key)}
 *   onClearAll={clearAllFilters}
 * />
 */
export function FilterChips({
  hint,
  chips,
  onRemove,
  onClearAll,
  size = 'sm',
  style,
}: FilterChipsProps) {
  if (chips.length === 0) return null;

  const isSm = size === 'sm';
  const fontSize = isSm ? 12 : 13;
  const paddingY = isSm ? 3 : 5;
  const paddingX = isSm ? 8 : 10;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 6,
        ...style,
      }}
    >
      {hint ? (
        <span style={{ fontSize: 11, color: '#64748b', marginRight: 2, userSelect: 'none' }}>
          {hint}
        </span>
      ) : null}

      {chips.map((chip) => {
        const tone = TONE_MAP[chip.tone ?? 'neutral'];
        return (
          <span
            key={chip.key}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize,
              color: tone.color,
              background: tone.bg,
              border: `1px solid ${tone.border}`,
              borderRadius: 999,
              padding: `${paddingY}px ${paddingX}px`,
              cursor: 'default',
              userSelect: 'none',
              lineHeight: 1.4,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = tone.hoverBg;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = tone.bg;
            }}
            role="status"
            aria-label={`筛选: ${chip.label}${chip.count !== undefined ? ` (${chip.count})` : ''}`}
          >
            {chip.label}
            {chip.count !== undefined ? (
              <span style={{ fontSize: fontSize - 1, opacity: 0.75, fontWeight: 500 }}>
                ({chip.count})
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => onRemove(chip.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 16,
                height: 16,
                padding: 0,
                border: 'none',
                background: 'transparent',
                color: 'inherit',
                cursor: 'pointer',
                borderRadius: '50%',
                opacity: 0.6,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.opacity = '0.6';
              }}
              aria-label={`移除筛选: ${chip.label}`}
            >
              {X_ICON}
            </button>
          </span>
        );
      })}

      {onClearAll && chips.length > 1 ? (
        <button
          type="button"
          onClick={onClearAll}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            fontSize,
            color: '#94a3b8',
            background: 'transparent',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            borderRadius: 999,
            padding: `${paddingY}px ${paddingX}px`,
            cursor: 'pointer',
            lineHeight: 1.4,
            transition: 'color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.color = '#e2e8f0';
            el.style.borderColor = 'rgba(148, 163, 184, 0.35)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.color = '#94a3b8';
            el.style.borderColor = 'rgba(148, 163, 184, 0.18)';
          }}
          aria-label="清除全部筛选"
        >
          {CLEAR_ICON}
          <span>清除全部</span>
        </button>
      ) : null}
    </div>
  );
}
