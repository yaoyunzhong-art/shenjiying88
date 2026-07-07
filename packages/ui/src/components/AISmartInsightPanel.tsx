'use client';

import React from 'react';

// ==================== 类型定义 ====================

/** 建议优先级 */
export type SmartInsightPriority = 'critical' | 'high' | 'medium' | 'low';

/** 建议类别 */
export type SmartInsightCategory = 'sales' | 'inventory' | 'member' | 'operation' | 'marketing';

/** 单条智能建议 */
export interface SmartInsight {
  /** 建议 ID */
  id: string;
  /** 建议标题 */
  title: string;
  /** 建议详细描述 */
  description: string;
  /** 优先级 */
  priority: SmartInsightPriority;
  /** 类别 */
  category: SmartInsightCategory;
  /** 预期提升指标 */
  expectedImpact?: string;
  /** 置信度 (0-100) */
  confidence: number;
  /** 建议生成时间 */
  generatedAt?: string;
  /** 是否已读 */
  read?: boolean;
  /** 关联数据链接 */
  relatedLink?: string;
}

/** 智能建议面板 Props */
export interface AISmartInsightPanelProps {
  /** 建议列表 */
  insights: SmartInsight[];
  /** 面板标题 */
  title?: string;
  /** 空状态文案 */
  emptyText?: string;
  /** 建议点击回调 */
  onInsightClick?: (insight: SmartInsight) => void;
  /** 建议忽略回调 */
  onInsightDismiss?: (insightId: string) => void;
  /** 全部标记已读回调 */
  onMarkAllRead?: () => void;
  /** 自定义类名 */
  className?: string;
  /** 是否显示类别筛选 */
  showCategoryFilter?: boolean;
  /** 是否紧凑模式 */
  compact?: boolean;
}

// ==================== 常量 ====================

const PRIORITY_CONFIG: Record<SmartInsightPriority, { label: string; color: string; icon: string }> = {
  critical: { label: '紧急', color: '#dc2626', icon: '⚠️' },
  high: { label: '高优', color: '#ea580c', icon: '🔴' },
  medium: { label: '中等', color: '#ca8a04', icon: '🟡' },
  low: { label: '参考', color: '#6b7280', icon: '💡' },
};

const CATEGORY_LABELS: Record<SmartInsightCategory, string> = {
  sales: '销售提升',
  inventory: '库存优化',
  member: '会员运营',
  operation: '运营效率',
  marketing: '营销策略',
};

// ==================== 内部组件 ====================

function PriorityBadge({ priority }: { priority: SmartInsightPriority }) {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <span
      data-testid={`priority-badge-${priority}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
        color: '#fff',
        backgroundColor: cfg.color,
      }}
      aria-label={`${cfg.label}优先级`}
    >
      <span aria-hidden="true">{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

function CategoryTag({ category }: { category: SmartInsightCategory }) {
  return (
    <span
      data-testid={`category-tag-${category}`}
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 500,
        color: '#374151',
        backgroundColor: '#f3f4f6',
        border: '1px solid #e5e7eb',
      }}
    >
      {CATEGORY_LABELS[category]}
    </span>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const color = clamped >= 80 ? '#22c55e' : clamped >= 50 ? '#ca8a04' : '#ef4444';
  return (
    <div
      data-testid="confidence-bar"
      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
    >
      <div
        style={{
          width: 60,
          height: 6,
          borderRadius: 3,
          backgroundColor: '#e5e7eb',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${clamped}%`,
            height: '100%',
            borderRadius: 3,
            backgroundColor: color,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>
        {clamped}%
      </span>
    </div>
  );
}

// ==================== 主组件 ====================

export function AISmartInsightPanel({
  insights,
  title = 'AI 智能建议',
  emptyText = '暂无智能建议',
  onInsightClick,
  onInsightDismiss,
  onMarkAllRead,
  className,
  showCategoryFilter = true,
  compact = false,
}: AISmartInsightPanelProps) {
  const [activeCategory, setActiveCategory] = React.useState<SmartInsightCategory | 'all'>('all');
  const [dismissedIds, setDismissedIds] = React.useState<Set<string>>(new Set());

  const categories = React.useMemo(() => {
    const cats = new Set(insights.map(i => i.category));
    return Array.from(cats);
  }, [insights]);

  const filteredInsights = React.useMemo(() => {
    return insights.filter(i => {
      if (dismissedIds.has(i.id)) return false;
      if (activeCategory !== 'all' && i.category !== activeCategory) return false;
      return true;
    });
  }, [insights, activeCategory, dismissedIds]);

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set(prev).add(id));
    onInsightDismiss?.(id);
  };

  const handleMarkAllRead = () => {
    onMarkAllRead?.();
  };

  // 按优先级排序: critical > high > medium > low
  const sorted = React.useMemo(() => {
    const order: SmartInsightPriority[] = ['critical', 'high', 'medium', 'low'];
    return [...filteredInsights].sort(
      (a, b) => order.indexOf(a.priority) - order.indexOf(b.priority)
    );
  }, [filteredInsights]);

  const unreadCount = insights.filter(i => !i.read).length;

  return (
    <div
      data-testid="ai-smart-insight-panel"
      className={className}
      style={{
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        backgroundColor: '#fff',
        overflow: 'hidden',
      }}
      role="region"
      aria-label={title}
    >
      {/* 头部 */}
      <div
        data-testid="panel-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: compact ? '10px 14px' : '14px 18px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#fafafa',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: compact ? 14 : 16, fontWeight: 700, color: '#111827' }}>
            {title}
          </span>
          {unreadCount > 0 && (
            <span
              data-testid="unread-badge"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 20,
                height: 20,
                padding: '0 6px',
                borderRadius: 10,
                backgroundColor: '#dc2626',
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            data-testid="mark-all-read-btn"
            onClick={handleMarkAllRead}
            style={{
              border: 'none',
              background: 'none',
              color: '#2563eb',
              fontSize: 13,
              cursor: 'pointer',
              fontWeight: 500,
              padding: '4px 8px',
              borderRadius: 6,
            }}
          >
            全部已读
          </button>
        )}
      </div>

      {/* 类别筛选 */}
      {showCategoryFilter && categories.length > 1 && (
        <div
          data-testid="category-filter"
          style={{
            display: 'flex',
            gap: 6,
            padding: '8px 14px',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            flexWrap: 'wrap',
          }}
        >
          <button
            data-testid="filter-all"
            onClick={() => setActiveCategory('all')}
            style={{
              border: activeCategory === 'all' ? '1px solid #2563eb' : '1px solid #d1d5db',
              backgroundColor: activeCategory === 'all' ? '#eff6ff' : '#fff',
              color: activeCategory === 'all' ? '#2563eb' : '#374151',
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 12,
              cursor: 'pointer',
              fontWeight: activeCategory === 'all' ? 600 : 400,
            }}
          >
            全部
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              data-testid={`filter-${cat}`}
              onClick={() => setActiveCategory(cat)}
              style={{
                border: activeCategory === cat ? '1px solid #2563eb' : '1px solid #d1d5db',
                backgroundColor: activeCategory === cat ? '#eff6ff' : '#fff',
                color: activeCategory === cat ? '#2563eb' : '#374151',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 12,
                cursor: 'pointer',
                fontWeight: activeCategory === cat ? 600 : 400,
              }}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      )}

      {/* 内容区 */}
      <div data-testid="insight-list" style={{ padding: compact ? '6px' : '8px' }}>
        {sorted.length === 0 ? (
          <div
            data-testid="empty-state"
            style={{
              padding: '32px 16px',
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: 14,
            }}
          >
            {emptyText}
          </div>
        ) : (
          sorted.map(insight => (
            <div
              key={insight.id}
              data-testid={`insight-item-${insight.id}`}
              onClick={() => onInsightClick?.(insight)}
              style={{
                padding: compact ? '10px 10px' : '12px 14px',
                borderRadius: 8,
                border: '1px solid #f3f4f6',
                marginBottom: compact ? 6 : 8,
                cursor: onInsightClick ? 'pointer' : 'default',
                backgroundColor: insight.read ? '#fff' : '#f0f9ff',
                transition: 'background-color 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* 标题行 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: compact ? 13 : 14, fontWeight: 600, color: '#111827' }}>
                      {insight.title}
                    </span>
                    <PriorityBadge priority={insight.priority} />
                    <CategoryTag category={insight.category} />
                  </div>
                  {/* 描述 */}
                  <p
                    style={{
                      margin: 0,
                      fontSize: compact ? 12 : 13,
                      color: '#4b5563',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: compact ? 1 : 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {insight.description}
                  </p>
                  {/* 底部信息 */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      marginTop: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    <ConfidenceBar value={insight.confidence} />
                    {insight.expectedImpact && (
                      <span style={{ fontSize: 11, color: '#059669', fontWeight: 500 }}>
                        📈 {insight.expectedImpact}
                      </span>
                    )}
                    {insight.generatedAt && (
                      <span style={{ fontSize: 11, color: '#9ca3af' }}>
                        {insight.generatedAt}
                      </span>
                    )}
                  </div>
                </div>
                {/* 忽略按钮 */}
                {onInsightDismiss && (
                  <button
                    data-testid={`dismiss-${insight.id}`}
                    onClick={e => {
                      e.stopPropagation();
                      handleDismiss(insight.id);
                    }}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: '#d1d5db',
                      cursor: 'pointer',
                      padding: 4,
                      fontSize: 16,
                      lineHeight: 1,
                      flexShrink: 0,
                    }}
                    aria-label={`忽略 "${insight.title}"`}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
