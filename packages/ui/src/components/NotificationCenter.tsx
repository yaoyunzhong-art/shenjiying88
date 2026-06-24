'use client';

import React, { useState, useCallback, useMemo } from 'react';

// ---- 类型 ----

export type NotificationSeverity = 'info' | 'warning' | 'error' | 'success';
export type NotificationCategory = 'system' | 'member' | 'device' | 'order' | 'alert';

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  severity: NotificationSeverity;
  category: NotificationCategory;
  timestamp: number; // unix ms
  read: boolean;
  /** 可选链接，点击跳转 */
  link?: string;
  /** 可选操作按钮 */
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface NotificationSummary {
  total: number;
  unread: number;
  byCategory: Partial<Record<NotificationCategory, number>>;
}

export interface NotificationCenterProps {
  notifications: NotificationItem[];
  /** 点击通知 */
  onNotificationClick?: (item: NotificationItem) => void;
  /** 标记为已读 */
  onMarkAsRead?: (id: string) => void;
  /** 标记全部已读 */
  onMarkAllAsRead?: () => void;
  /** 删除通知 */
  onDelete?: (id: string) => void;
  /** 清空已读 */
  onClearRead?: () => void;
  /** 自定义空状态 */
  emptyText?: string;
  /** 最大高度 */
  maxHeight?: number;
}

// ---- 图标 ----

const SEVERITY_ICONS: Record<NotificationSeverity, React.ReactNode> = {
  info: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="#60a5fa" strokeWidth="2" />
      <path d="M12 8v4m0 4h.01" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
        stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="#f87171" strokeWidth="2" />
      <path d="M15 9l-6 6m0-6l6 6" stroke="#f87171" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  success: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="#4ade80" strokeWidth="2" />
      <path d="M9 12l2 2 4-4" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  system: '系统',
  member: '会员',
  device: '设备',
  order: '订单',
  alert: '告警',
};

const SEVERITY_DOT_COLORS: Record<NotificationSeverity, string> = {
  info: '#60a5fa',
  warning: '#fbbf24',
  error: '#f87171',
  success: '#4ade80',
};

const CATEGORY_COLORS: Record<NotificationCategory, string> = {
  system: '#6366f1',
  member: '#8b5cf6',
  device: '#06b6d4',
  order: '#f59e0b',
  alert: '#ef4444',
};

// ---- 工具 ----

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return '刚刚';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}小时前`;
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ============== NotificationSummaryBar（汇总栏） ==============

interface NotificationSummaryBarProps {
  summary: NotificationSummary;
  activeCategory: NotificationCategory | 'all';
  onCategoryChange: (c: NotificationCategory | 'all') => void;
  onMarkAllAsRead?: () => void;
  onClearRead?: () => void;
}

function NotificationSummaryBar({
  summary,
  activeCategory,
  onCategoryChange,
  onMarkAllAsRead,
  onClearRead,
}: NotificationSummaryBarProps) {
  const categories: (NotificationCategory | 'all')[] = ['all', ...Object.keys(CATEGORY_LABELS) as NotificationCategory[]];

  return (
    <div style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.15)' }}>
      {/* 汇总信息 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          fontSize: 13,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 600, color: '#f1f5f9' }}>通知</span>
          {summary.unread > 0 && (
            <span
              style={{
                background: '#ef4444',
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
                padding: '1px 7px',
                borderRadius: 10,
                lineHeight: '18px',
              }}
            >
              {summary.unread}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {onMarkAllAsRead && summary.unread > 0 && (
            <button
              type="button"
              onClick={onMarkAllAsRead}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: 12,
                padding: '2px 6px',
              }}
            >
              全部已读
            </button>
          )}
          {onClearRead && summary.total - summary.unread > 0 && (
            <button
              type="button"
              onClick={onClearRead}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: 12,
                padding: '2px 6px',
              }}
            >
              清空已读
            </button>
          )}
        </div>
      </div>

      {/* 分类标签 */}
      <div
        style={{
          display: 'flex',
          gap: 2,
          padding: '0 12px 8px',
          overflowX: 'auto',
        }}
      >
        {categories.map((cat) => {
          const isActive = cat === activeCategory;
          const count = cat === 'all' ? summary.total : (summary.byCategory[cat] ?? 0);
          const color = cat === 'all' ? '#94a3b8' : CATEGORY_COLORS[cat];
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onCategoryChange(cat)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                borderRadius: 6,
                border: isActive ? `1px solid ${color}` : '1px solid transparent',
                background: isActive ? `${color}15` : 'transparent',
                color: isActive ? color : '#94a3b8',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: isActive ? 600 : 400,
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              {cat === 'all' ? '全部' : CATEGORY_LABELS[cat]}
              {count > 0 && (
                <span style={{ opacity: 0.7 }}>{count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============== NotificationItemRow（单条通知） ==============

interface NotificationItemRowProps {
  item: NotificationItem;
  onClick?: (item: NotificationItem) => void;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
}

function NotificationItemRow({ item, onClick, onMarkAsRead, onDelete }: NotificationItemRowProps) {
  const [actionsVisible, setActionsVisible] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        padding: '12px 16px',
        cursor: onClick ? 'pointer' : 'default',
        background: item.read ? 'transparent' : 'rgba(99, 102, 241, 0.04)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
        transition: 'background 0.15s',
        position: 'relative',
      }}
      role="listitem"
      onMouseEnter={() => setActionsVisible(true)}
      onMouseLeave={() => setActionsVisible(false)}
      onClick={() => {
        if (!item.read && onMarkAsRead) onMarkAsRead(item.id);
        if (onClick) onClick(item);
      }}
    >
      {/* 未读小点 */}
      {!item.read && (
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: SEVERITY_DOT_COLORS[item.severity],
            flexShrink: 0,
            marginTop: 5,
          }}
        />
      )}

      {/* 图标 */}
      <div style={{ flexShrink: 0, marginTop: 1, opacity: item.read ? 0.5 : 1 }}>
        {SEVERITY_ICONS[item.severity]}
      </div>

      {/* 内容 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: item.read ? 400 : 600,
            fontSize: 13,
            color: item.read ? '#94a3b8' : '#f1f5f9',
            lineHeight: 1.4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.title}
        </div>
        {item.description && (
          <div
            style={{
              fontSize: 12,
              color: '#64748b',
              marginTop: 2,
              lineHeight: 1.4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {item.description}
          </div>
        )}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 4,
            fontSize: 11,
            color: '#475569',
          }}
        >
          <span
            style={{
              padding: '1px 5px',
              borderRadius: 4,
              fontSize: 10,
              background: `${CATEGORY_COLORS[item.category]}20`,
              color: CATEGORY_COLORS[item.category],
              fontWeight: 500,
            }}
          >
            {CATEGORY_LABELS[item.category]}
          </span>
          <span>{formatTime(item.timestamp)}</span>
        </div>

        {/* 操作按钮 */}
        {item.actions && item.actions.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            {item.actions.map((action, i) => {
              const btnColors = {
                primary: { bg: '#3b82f6', color: '#fff' },
                secondary: { bg: 'rgba(148, 163, 184, 0.15)', color: '#cbd5e1' },
                danger: { bg: '#ef4444', color: '#fff' },
              } as const;
              const c = btnColors[action.variant ?? 'secondary'] ?? btnColors.secondary;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick();
                  }}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 4,
                    border: 'none',
                    background: c.bg,
                    color: c.color,
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 500,
                  }}
                >
                  {action.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 悬浮操作 */}
      {actionsVisible && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            position: 'absolute',
            right: 12,
            top: 12,
            background: 'rgba(15, 23, 42, 0.9)',
            borderRadius: 6,
            padding: 2,
          }}
        >
          {!item.read && onMarkAsRead && (
            <button
              type="button"
              title="标记已读"
              onClick={(e) => { e.stopPropagation(); onMarkAsRead(item.id); }}
              style={iconBtnStyle}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              title="删除"
              onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
              style={iconBtnStyle}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '4px',
  display: 'flex',
  borderRadius: 4,
  color: '#94a3b8',
};

// ============== NotificationCenter（主组件） ==============

export function NotificationCenter({
  notifications,
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearRead,
  emptyText = '暂无通知',
  maxHeight = 480,
}: NotificationCenterProps) {
  const [activeCategory, setActiveCategory] = useState<NotificationCategory | 'all'>('all');

  // 汇总
  const summary = useMemo<NotificationSummary>(() => {
    const total = notifications.length;
    const unread = notifications.filter((n) => !n.read).length;
    const byCategory: NotificationSummary['byCategory'] = {};
    for (const cat of Object.keys(CATEGORY_LABELS) as NotificationCategory[]) {
      byCategory[cat] = notifications.filter((n) => n.category === cat && !n.read).length;
    }
    return { total, unread, byCategory };
  }, [notifications]);

  // 过滤
  const filtered = useMemo(() => {
    if (activeCategory === 'all') return notifications;
    return notifications.filter((n) => n.category === activeCategory);
  }, [notifications, activeCategory]);

  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: 12,
        overflow: 'hidden',
        width: 400,
        maxWidth: '100%',
        display: 'flex',
        flexDirection: 'column',
        backdropFilter: 'blur(16px)',
      }}
      role="region"
      aria-label="通知中心"
    >
      {/* 汇总栏 */}
      <NotificationSummaryBar
        summary={summary}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        onMarkAllAsRead={onMarkAllAsRead}
        onClearRead={onClearRead}
      />

      {/* 通知列表 */}
      <div
        style={{
          flex: 1,
          maxHeight,
          overflowY: 'auto',
        }}
        role="list"
      >
        {filtered.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 16px',
              color: '#475569',
              fontSize: 13,
              gap: 8,
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5">
              <path d="M13.73 21a2 2 0 01-3.46 0M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M18 8A6 6 0 106 8" opacity="0" />
            </svg>
            <span>{emptyText}</span>
          </div>
        ) : (
          filtered.map((item) => (
            <NotificationItemRow
              key={item.id}
              item={item}
              onClick={onNotificationClick}
              onMarkAsRead={onMarkAsRead}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ============== 便捷 Hook ==============

export function useNotificationSummary(notifications: NotificationItem[]): NotificationSummary {
  return useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter((n) => !n.read).length;
    const byCategory: NotificationSummary['byCategory'] = {};
    for (const cat of Object.keys(CATEGORY_LABELS) as NotificationCategory[]) {
      byCategory[cat] = notifications.filter((n) => n.category === cat && !n.read).length;
    }
    return { total, unread, byCategory };
  }, [notifications]);
}
