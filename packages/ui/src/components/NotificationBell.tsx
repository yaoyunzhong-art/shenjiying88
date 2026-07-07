'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

// ==================== 类型定义 ====================

/** 通知条目 */
export interface NotificationItem {
  /** 唯一标识 */
  id: string;
  /** 标题 */
  title: string;
  /** 描述/内容 */
  description?: string;
  /** 是否已读 */
  read: boolean;
  /** 通知类型 */
  type?: 'info' | 'success' | 'warning' | 'error';
  /** 时间戳 (ISO) */
  timestamp: string;
  /** 可选图标 emoji */
  icon?: string;
  /** 点击回调 */
  onClick?: (item: NotificationItem) => void;
}

export interface NotificationBellProps {
  /** 通知列表 */
  items: NotificationItem[];
  /** 未读徽章最大显示数 (超过显示 N+) */
  maxBadgeCount?: number;
  /** 下拉面板最多显示条数 */
  maxListCount?: number;
  /** 空状态提示文字 */
  emptyText?: string;
  /** 查看全部链接文字 */
  viewAllText?: string;
  /** 查看全部回调 */
  onViewAll?: () => void;
  /** 标记已读回调 */
  onMarkRead?: (id: string) => void;
  /** 全部标记已读回调 */
  onMarkAllRead?: () => void;
  /** 铃铛尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 自定义 className */
  className?: string;
}

// ==================== 尺寸映射 ====================

const sizeMap = {
  sm: { bell: 18, badge: 10, dot: 6 },
  md: { bell: 22, badge: 12, dot: 8 },
  lg: { bell: 26, badge: 14, dot: 10 },
} as const;

const fontSizeMap = { sm: 9, md: 10, lg: 11 } as const;

// ==================== 颜色变量 ====================

const typeColors: Record<string, string> = {
  info: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
};

const typeBgColors: Record<string, string> = {
  info: '#eff6ff',
  success: '#f0fdf4',
  warning: '#fffbeb',
  error: '#fef2f2',
};

// ==================== 组件 ====================

export function NotificationBell({
  items,
  maxBadgeCount = 99,
  maxListCount = 5,
  emptyText = '暂无新通知',
  viewAllText = '查看全部',
  onViewAll,
  onMarkRead,
  onMarkAllRead,
  size = 'md',
  className,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = items.filter((i) => !i.read).length;
  const displayItems = items.slice(0, maxListCount);
  const s = sizeMap[size];

  // 点击外部关闭
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open, handleClickOutside]);

  const handleToggle = () => setOpen((v) => !v);

  const handleItemClick = (item: NotificationItem) => {
    if (!item.read && onMarkRead) {
      onMarkRead(item.id);
    }
    item.onClick?.(item);
  };

  const formatTime = (iso: string): string => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return '刚刚';
    if (diffMin < 60) return `${diffMin}分钟前`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}小时前`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 30) return `${diffDay}天前`;
    return d.toLocaleDateString('zh-CN');
  };

  // 铃铛 SVG
  const bellIcon = (
    <svg
      width={s.bell}
      height={s.bell}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="通知"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );

  return (
    <div
      ref={ref}
      className={className}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        cursor: 'pointer',
      }}
      onClick={handleToggle}
    >
      {/* 铃铛 */}
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#1e293b')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
      >
        {bellIcon}
      </span>

      {/* 未读徽章 */}
      {unreadCount > 0 && (
        <span
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            minWidth: s.badge,
            height: s.badge,
            borderRadius: s.badge / 2,
            background: '#ef4444',
            color: '#fff',
            fontSize: fontSizeMap[size],
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 3px',
            lineHeight: 1,
            boxShadow: '0 0 0 2px #fff',
          }}
          data-testid="bell-badge"
        >
          {unreadCount > maxBadgeCount ? `${maxBadgeCount}+` : unreadCount}
        </span>
      )}

      {/* 下拉面板 */}
      {open && (
        <div
          data-testid="notification-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 320,
            maxHeight: 420,
            background: '#fff',
            borderRadius: 8,
            boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid #e2e8f0',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
              通知
              {unreadCount > 0 && (
                <span style={{ color: '#94a3b8', fontWeight: 400, marginLeft: 4 }}>
                  ({unreadCount}条未读)
                </span>
              )}
            </span>
            {unreadCount > 0 && onMarkAllRead && (
              <button
                data-testid="mark-all-read-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAllRead();
                }}
                style={{
                  border: 'none',
                  background: 'none',
                  color: '#3b82f6',
                  fontSize: 12,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                全部已读
              </button>
            )}
          </div>

          {/* 通知列表 */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {displayItems.length === 0 ? (
              <div
                data-testid="notification-empty"
                style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: 13,
                }}
              >
                {emptyText}
              </div>
            ) : (
              displayItems.map((item) => (
                <div
                  key={item.id}
                  data-testid={`notification-item-${item.id}`}
                  onClick={() => handleItemClick(item)}
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: '10px 16px',
                    cursor: 'pointer',
                    background: item.read ? '#fff' : '#f8fafc',
                    borderBottom: '1px solid #f1f5f9',
                    transition: 'background 0.15s',
                    alignItems: 'flex-start',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = item.read ? '#fff' : '#f8fafc')
                  }
                >
                  {/* 未读指示点 */}
                  {!item.read && (
                    <span
                      style={{
                        width: s.dot,
                        height: s.dot,
                        borderRadius: '50%',
                        background: typeColors[item.type || 'info'],
                        flexShrink: 0,
                        marginTop: 5,
                      }}
                      data-testid="unread-dot"
                    />
                  )}
                  {item.read && <span style={{ width: s.dot, flexShrink: 0 }} />}

                  {/* 内容 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginBottom: 2,
                      }}
                    >
                      {item.icon && <span>{item.icon}</span>}
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: item.read ? 400 : 600,
                          color: '#1e293b',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.title}
                      </span>
                    </div>
                    {item.description && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          color: '#64748b',
                          lineHeight: 1.4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.description}
                      </p>
                    )}
                    <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, display: 'inline-block' }}>
                      {formatTime(item.timestamp)}
                    </span>
                  </div>

                  {/* 类型色条 */}
                  {item.type && (
                    <span
                      style={{
                        width: 3,
                        height: '100%',
                        minHeight: 32,
                        borderRadius: 2,
                        background: typeColors[item.type],
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>
              ))
            )}
          </div>

          {/* 底部 */}
          {displayItems.length > 0 && onViewAll && (
            <div
              style={{
                borderTop: '1px solid #e2e8f0',
                padding: '8px 16px',
                textAlign: 'center',
              }}
            >
              <button
                data-testid="view-all-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewAll?.();
                }}
                style={{
                  border: 'none',
                  background: 'none',
                  color: '#3b82f6',
                  fontSize: 13,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {viewAllText}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
