'use client';

import React from 'react';

// ============== Types ==============

export interface WorkbenchNavItem {
  key: string;
  label: string;
  href: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: number;
}

export interface WorkbenchBreadcrumb {
  label: string;
  href?: string;
}

export interface WorkbenchHeaderProps {
  /** 角色/来源标识，如 "Platform" */
  channel: string;
  /** 工作台标题 */
  title: string;
  /** 工作台描述 */
  description?: string;
  /** 面包屑导航 */
  breadcrumbs?: WorkbenchBreadcrumb[];
  /** 操作按钮组 */
  actions?: React.ReactNode;
  /** 导航条目 */
  navItems?: WorkbenchNavItem[];
  /** 加载状态 */
  loading?: boolean;
  /** 数据测试属性 */
  'data-testid'?: string;
}

// ============== Sub-components ==============

function Breadcrumbs({ items }: { items: WorkbenchBreadcrumb[] }) {
  return (
    <nav
      data-testid="workbench-breadcrumbs"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        color: '#64748b',
        marginBottom: 12,
      }}
    >
      {items.map((item, idx) => (
        <React.Fragment key={item.label + idx}>
          {idx > 0 && (
            <span style={{ color: '#475569', userSelect: 'none' }}>/</span>
          )}
          {item.href ? (
            <a
              href={item.href}
              style={{ color: '#93c5fd', textDecoration: 'none' }}
            >
              {item.label}
            </a>
          ) : (
            <span style={{ color: '#cbd5e1' }}>{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

function LoadingSkeleton() {
  return (
    <div data-testid="workbench-header-loading" style={{ padding: 28 }}>
      <div
        style={{
          height: 14,
          width: 120,
          borderRadius: 4,
          background: 'rgba(148,163,184,0.1)',
          marginBottom: 16,
        }}
      />
      <div
        style={{
          height: 28,
          width: 260,
          borderRadius: 6,
          background: 'rgba(148,163,184,0.1)',
          marginBottom: 8,
        }}
      />
      <div
        style={{
          height: 14,
          width: 400,
          borderRadius: 4,
          background: 'rgba(148,163,184,0.08)',
        }}
      />
    </div>
  );
}

// ============== Main Component ==============

/**
 * WorkbenchHeader — 工作台顶栏组件
 *
 * 展示工作台页面顶部的品牌信息、面包屑导航、
 * 标题描述和操作入口。适用于 pad/[role] 和
 * workbench/[role] 类型的 role-scoped 页面。
 *
 * @example
 * ```tsx
 * <WorkbenchHeader
 *   channel="Platform"
 *   title="运营管理工作台"
 *   description="管理门店运营、设备状态和告警处理"
 *   breadcrumbs={[
 *     { label: '首页', href: '/' },
 *     { label: '工作台' },
 *   ]}
 *   navItems={[
 *     { key: 'ops', label: '运营管理', href: '/operations', description: '门店运营概览' },
 *     { key: 'alerts', label: '告警中心', href: '/alerts', badge: 3 },
 *   ]}
 * />
 * ```
 */
export function WorkbenchHeader({
  channel,
  title,
  description,
  breadcrumbs,
  actions,
  navItems,
  loading = false,
  'data-testid': testId = 'workbench-header',
}: WorkbenchHeaderProps) {
  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <section
      data-testid={testId}
      style={{
        borderRadius: 24,
        padding: 28,
        color: '#f8fafc',
        background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
        border: '1px solid rgba(148, 163, 184, 0.12)',
      }}
    >
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}

      {/* Channel tag + Actions row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Channel badge */}
          {channel && (
            <div
              data-testid="workbench-channel"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
                fontWeight: 600,
                color: '#93c5fd',
                marginBottom: 6,
                padding: '2px 8px',
                borderRadius: 6,
                background: 'rgba(147,197,253,0.1)',
              }}
            >
              {channel}
            </div>
          )}

          {/* Title */}
          <h1
            data-testid="workbench-title"
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#f8fafc',
              margin: '4px 0 6px',
              lineHeight: 1.3,
            }}
          >
            {title}
          </h1>

          {/* Description */}
          {description && (
            <p
              data-testid="workbench-description"
              style={{
                fontSize: 13,
                color: '#94a3b8',
                margin: 0,
                lineHeight: 1.5,
                maxWidth: 480,
              }}
            >
              {description}
            </p>
          )}
        </div>

        {/* Actions */}
        {actions && (
          <div
            data-testid="workbench-actions"
            style={{ display: 'flex', gap: 8, flexShrink: 0 }}
          >
            {actions}
          </div>
        )}
      </div>

      {/* Nav items */}
      {navItems && navItems.length > 0 && (
        <div
          data-testid="workbench-nav-items"
          style={{
            display: 'grid',
            gap: 12,
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            marginTop: 20,
          }}
        >
          {navItems.map((item) => (
            <a
              key={item.key}
              href={item.href}
              data-testid={`workbench-nav-${item.key}`}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: 14,
                borderRadius: 14,
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid rgba(148,163,184,0.08)',
                textDecoration: 'none',
                transition: 'background 0.15s, border-color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)';
                e.currentTarget.style.borderColor = 'rgba(148,163,184,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(15, 23, 42, 0.4)';
                e.currentTarget.style.borderColor = 'rgba(148,163,184,0.08)';
              }}
            >
              {item.icon && (
                <span style={{ color: '#93c5fd', flexShrink: 0, marginTop: 2 }}>
                  {item.icon}
                </span>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#f1f5f9',
                    }}
                  >
                    {item.label}
                  </span>
                  {item.badge != null && item.badge > 0 && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: 10,
                        background: '#ef4444',
                        color: '#fff',
                        lineHeight: '16px',
                      }}
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                {item.description && (
                  <div
                    style={{
                      fontSize: 12,
                      color: '#64748b',
                      marginTop: 3,
                      lineHeight: 1.4,
                    }}
                  >
                    {item.description}
                  </div>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
