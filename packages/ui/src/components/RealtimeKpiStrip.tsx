'use client';

import React, { useMemo } from 'react';

// ==================== 类型定义 ====================

export interface KpiItem {
  /** 唯一标识 */
  id: string;
  /** 标签文字 */
  label: string;
  /** 当前值 */
  value: string | number;
  /** 与前值对比（百分比变化） */
  change?: number;
  /** 变化方向：true=上升(正), false=下降(负), undefined=无变化 */
  changePositive?: boolean;
  /** 格式化后的变化文字 */
  changeLabel?: string;
  /** 单位 */
  unit?: string;
  /** 自定义图标/emoji */
  icon?: string;
  /** 色系 */
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

export interface RealtimeKpiStripProps {
  /** KPI 数据列表 */
  items: KpiItem[];
  /** 滚动方向 */
  direction?: 'horizontal' | 'vertical';
  /** 卡片宽度（horizontal） */
  cardWidth?: number;
  /** 是否显示边框高亮 */
  bordered?: boolean;
  /** 最多显示条数（超出省略） */
  maxItems?: number;
  /** 自动刷新标记 */
  isLive?: boolean;
  /** 最后更新时间 */
  lastUpdate?: string;
  className?: string;
}

// ==================== 常量样式 ====================

const S_WRAPPER: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '12px 16px',
  borderRadius: 12,
  background: 'rgba(15,23,42,0.3)',
  border: '1px solid rgba(148,163,184,0.1)',
  overflow: 'hidden',
  width: '100%',
};

const S_LIVE_TAG: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  padding: '4px 10px',
  borderRadius: 20,
  background: 'rgba(34,197,94,0.15)',
  fontSize: 11,
  fontWeight: 600,
  color: '#22c55e',
  whiteSpace: 'nowrap',
  flexShrink: 0,
};

const S_LIVE_DOT: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: '50%',
  backgroundColor: '#22c55e',
};

const S_STRIP: React.CSSProperties = {
  display: 'flex',
  alignItems: 'stretch',
  gap: 10,
  overflowX: 'auto',
  flex: 1,
  WebkitOverflowScrolling: 'touch',
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
};

const S_CARD: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: 4,
  padding: '8px 14px',
  borderRadius: 10,
  background: 'rgba(15,23,42,0.4)',
  border: '1px solid rgba(148,163,184,0.08)',
  minWidth: 120,
  whiteSpace: 'nowrap',
  flexShrink: 0,
};

const S_LABEL: React.CSSProperties = {
  fontSize: 11,
  color: '#64748b',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
};

const S_VALUE_ROW: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 6,
};

const S_VALUE: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums',
  lineHeight: 1.2,
};

const S_UNIT: React.CSSProperties = {
  fontSize: 11,
  color: '#94a3b8',
  fontWeight: 400,
};

const S_CHANGE: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
};

const S_TIME: React.CSSProperties = {
  fontSize: 10,
  color: '#475569',
  whiteSpace: 'nowrap',
  flexShrink: 0,
};

// ==================== 颜色映射 ====================

const COLOR_MAP: Record<string, string> = {
  default: '#e2e8f0',
  primary: '#60a5fa',
  success: '#4ade80',
  warning: '#facc15',
  danger: '#f87171',
  info: '#22d3ee',
};

// ==================== 组件 ====================

export function RealtimeKpiStrip({
  items,
  direction = 'horizontal',
  isLive = true,
  lastUpdate,
  maxItems = 12,
  className = '',
}: RealtimeKpiStripProps) {
  const displayItems = useMemo(
    () => items.slice(0, maxItems),
    [items, maxItems],
  );

  const liveText = useMemo(() => {
    if (!isLive) return null;
    const now = lastUpdate || new Date().toLocaleTimeString('zh-CN', { hour12: false });
    return (
      <div style={S_LIVE_TAG}>
        <div style={S_LIVE_DOT} />
        <span>LIVE</span>
        <span style={{ fontWeight: 400, opacity: 0.7 }}>{now}</span>
      </div>
    );
  }, [isLive, lastUpdate]);

  if (!displayItems.length) {
    return (
      <div style={S_WRAPPER} className={className}>
        <div style={{ fontSize: 12, color: '#64748b', padding: '8px 0' }}>
          暂无实时数据
        </div>
      </div>
    );
  }

  const containerStyle: React.CSSProperties = direction === 'vertical'
    ? { ...S_WRAPPER, flexDirection: 'column', alignItems: 'stretch' }
    : S_WRAPPER;

  const stripStyle: React.CSSProperties = direction === 'vertical'
    ? { ...S_STRIP, flexDirection: 'column', overflowX: 'hidden', overflowY: 'auto' }
    : S_STRIP;

  return (
    <div style={containerStyle} className={className}>
      {isLive && liveText}
      <div style={stripStyle}>
        {displayItems.map((item) => (
          <div
            key={item.id}
            style={{
              ...S_CARD,
              borderLeft: `3px solid ${COLOR_MAP[item.color || 'default']}`,
            }}
          >
            <div style={S_LABEL}>
              {item.icon && <span>{item.icon}</span>}
              <span>{item.label}</span>
            </div>
            <div style={S_VALUE_ROW}>
              <span style={{ ...S_VALUE, color: COLOR_MAP[item.color || 'default'] }}>
                {item.value}
              </span>
              {item.unit && <span style={S_UNIT}>{item.unit}</span>}
              {item.change !== undefined && (
                <span
                  style={{
                    ...S_CHANGE,
                    color: item.changePositive
                      ? '#4ade80'
                      : item.changePositive === false
                        ? '#f87171'
                        : '#94a3b8',
                  }}
                >
                  {item.changePositive ? '↑' : '↓'} {item.changeLabel || `${Math.abs(item.change).toFixed(1)}%`}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      {!isLive && lastUpdate && (
        <span style={S_TIME}>更新于 {lastUpdate}</span>
      )}
    </div>
  );
}

export default RealtimeKpiStrip;
