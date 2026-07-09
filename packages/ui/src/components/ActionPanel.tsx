'use client';

import React, { type ReactNode } from 'react';

// ---- 类型 ----

export interface ActionPanelAction {
  /** 操作键标识 */
  key: string;
  /** 按钮文字 */
  label: string;
  /** 点击回调 */
  onClick?: () => void;
  /** 是否危险操作 */
  danger?: boolean;
  /** 是否主要操作 */
  primary?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 加载中 */
  loading?: boolean;
  /** 图标 */
  icon?: ReactNode;
}

export interface ActionPanelProps {
  /** 面板标题 */
  title: string;
  /** 子标题/描述 */
  subtitle?: string;
  /** 右上角操作按钮列表 */
  actions?: ActionPanelAction[];
  /** 面板内容 */
  children: ReactNode;
  /** 是否正在加载 */
  loading?: boolean;
  /** 是否折叠状态 */
  collapsed?: boolean;
  /** 展开/折叠回调 */
  onToggleCollapse?: () => void;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 空状态内容（children 为空时显示） */
  emptyContent?: ReactNode;
  /** 额外 header 右侧内容 */
  headerExtra?: ReactNode;
}

// ---- 默认样式 ----

const styles: Record<string, React.CSSProperties> = {
  panel: {
    borderRadius: 12,
    background: 'rgba(15, 23, 42, 0.38)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 18px',
    borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: 600,
    color: '#f1f5f9',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  actionsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  body: {
    padding: 18,
  },
  actionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '5px 12px',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
    border: 'none',
    cursor: 'pointer',
    transition: 'opacity 0.15s',
    lineHeight: 1.4,
  } as React.CSSProperties,
  collapseBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 14,
    padding: '2px 4px',
  },
  loadingOverlay: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    color: '#64748b',
    fontSize: 14,
  },
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    color: '#64748b',
    fontSize: 14,
  },
};

/**
 * ActionPanel — 操作面板容器
 *
 * 通用面板组件，集成标题、操作按钮、loading/empty 状态。
 * 适用于详情页、列表页中的功能区块。
 *
 * @example
 * <ActionPanel
 *   title="订单详情"
 *   subtitle="查看和编辑订单信息"
 *   actions={[
 *     { key: 'edit', label: '编辑', primary: true },
 *     { key: 'delete', label: '删除', danger: true },
 *   ]}
 * >
 *   <div>面板内容</div>
 * </ActionPanel>
 */
export function ActionPanel({
  title,
  subtitle,
  actions,
  children,
  loading = false,
  collapsed = false,
  onToggleCollapse,
  className = '',
  style,
  emptyContent,
  headerExtra,
}: ActionPanelProps) {
  const showEmpty = !loading && !children;
  const panelStyle: React.CSSProperties = {
    ...styles.panel,
    ...(collapsed ? { borderBottom: 'none' } : {}),
    ...style,
  };

  return (
    <div
      className={className}
      style={panelStyle}
      data-testid={`action-panel-${title.replace(/\s+/g, '-').toLowerCase()}`}
    >
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div>
            <div style={styles.title}>{title}</div>
            {subtitle && <div style={styles.subtitle}>{subtitle}</div>}
          </div>
          {onToggleCollapse && (
            <button
              style={styles.collapseBtn}
              onClick={onToggleCollapse}
              aria-label={collapsed ? '展开' : '折叠'}
            >
              {collapsed ? '▶' : '▼'}
            </button>
          )}
        </div>

        <div style={styles.actionsRow}>
          {headerExtra}
          {actions?.map((action) => {
            const btnStyle: React.CSSProperties = {
              ...styles.actionBtn,
              backgroundColor: action.primary
                ? '#3b82f6'
                : action.danger
                  ? '#ef4444'
                  : 'rgba(148, 163, 184, 0.12)',
              color: action.primary || action.danger ? '#fff' : '#e2e8f0',
              opacity: action.disabled ? 0.5 : action.loading ? 0.7 : 1,
              cursor: action.disabled ? 'not-allowed' : 'pointer',
            };

            return (
              <button
                key={action.key}
                style={btnStyle}
                disabled={action.disabled || action.loading}
                onClick={action.onClick}
                data-testid={`action-panel-btn-${action.key}`}
              >
                {action.loading ? '⏳' : action.icon}
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div style={styles.body}>
          {loading && (
            <div style={styles.loadingOverlay}>
              <span>加载中...</span>
            </div>
          )}
          {!loading && showEmpty && emptyContent && (
            <div style={styles.emptyState}>{emptyContent}</div>
          )}
          {!loading && !showEmpty && children}
        </div>
      )}
    </div>
  );
}

export default ActionPanel;
