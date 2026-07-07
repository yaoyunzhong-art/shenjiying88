'use client';

import React, { useMemo } from 'react';

// ==================== 类型定义 ====================

/** 洞察类型 */
export type InsightCategory = 'sales' | 'customer' | 'inventory' | 'anomaly' | 'recommendation' | 'trend';

/** 洞察严重程度 */
export type InsightSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/** 单条分析洞察 */
export interface AnalysisInsight {
  /** 洞察唯一标识 */
  id: string;
  /** 洞察类别 */
  category: InsightCategory;
  /** 洞察标题 */
  title: string;
  /** 洞察描述/建议 */
  description: string;
  /** 严重程度 */
  severity: InsightSeverity;
  /** 影响数值（如金额、百分比） */
  impactValue?: string;
  /** 影响标签（如"预计增收 ¥12,000"） */
  impactLabel?: string;
  /** 相关链接或引用标识 */
  relatedId?: string;
  /** 可信度 0-100 */
  confidence: number;
  /** 生成时间 */
  generatedAt: string;
  /** 是否已读 */
  isRead?: boolean;
}

/** 分析洞察面板属性 */
export interface AIAnalysisInsightsPanelProps {
  /** 洞察列表 */
  insights: AnalysisInsight[];
  /** 加载状态 */
  loading?: boolean;
  /** 错误信息 */
  error?: string;
  /** 面板标题 */
  title?: string;
  /** 面板描述 */
  description?: string;
  /** 已读/未读切换回调 */
  onMarkRead?: (id: string) => void;
  /** 全部标记已读回调 */
  onMarkAllRead?: () => void;
  /** 刷新回调 */
  onRefresh?: () => void;
  /** 洞察点击回调 */
  onInsightClick?: (insight: AnalysisInsight) => void;
}

// ==================== 内部常量 ====================

const CATEGORY_LABELS: Record<InsightCategory, string> = {
  sales: '销售洞察',
  customer: '客户洞察',
  inventory: '库存洞察',
  anomaly: '异常检测',
  recommendation: '推荐建议',
  trend: '趋势分析',
};

const CATEGORY_ICONS: Record<InsightCategory, string> = {
  sales: '📈',
  customer: '👥',
  inventory: '📦',
  anomaly: '⚠️',
  recommendation: '💡',
  trend: '📊',
};

const SEVERITY_COLORS: Record<InsightSeverity, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
  info: '#3b82f6',
};

const SEVERITY_BG: Record<InsightSeverity, string> = {
  critical: 'rgba(239,68,68,0.12)',
  high: 'rgba(249,115,22,0.12)',
  medium: 'rgba(234,179,8,0.12)',
  low: 'rgba(34,197,94,0.12)',
  info: 'rgba(59,130,246,0.12)',
};

const SEVERITY_LABELS: Record<InsightSeverity, string> = {
  critical: '严重',
  high: '高',
  medium: '中',
  low: '低',
  info: '信息',
};

// ==================== 子组件 ====================

/** 严重度徽标 */
function SeverityBadge({ severity }: { severity: InsightSeverity }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        color: SEVERITY_COLORS[severity],
        background: SEVERITY_BG[severity],
      }}
    >
      {SEVERITY_LABELS[severity]}
    </span>
  );
}

/** 可信度指示器 */
function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 80 ? '#22c55e' : value >= 60 ? '#eab308' : '#f97316';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div
        style={{
          width: 60,
          height: 4,
          borderRadius: 2,
          background: 'rgba(148,163,184,0.2)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${value}%`,
            borderRadius: 2,
            background: color,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
      <span style={{ fontSize: 11, color: '#94a3b8' }}>{value}%</span>
    </div>
  );
}

/** 单条洞察卡片 */
function InsightCard({
  insight,
  onMarkRead,
  onClick,
}: {
  insight: AnalysisInsight;
  onMarkRead?: (id: string) => void;
  onClick?: (insight: AnalysisInsight) => void;
}) {
  const cardStyle: React.CSSProperties = {
    borderRadius: 12,
    padding: '14px 16px',
    background: insight.isRead ? 'rgba(15,23,42,0.3)' : 'rgba(15,23,42,0.5)',
    border: `1px solid ${insight.isRead ? 'rgba(148,163,184,0.08)' : 'rgba(148,163,184,0.14)'}`,
    cursor: onClick ? 'pointer' : 'default',
    transition: 'all 0.2s ease',
    opacity: insight.isRead ? 0.8 : 1,
    position: 'relative',
  };

  const handleClick = () => {
    onClick?.(insight);
    if (!insight.isRead) onMarkRead?.(insight.id);
  };

  return (
    <article
      style={cardStyle}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleClick();
      }}
      tabIndex={0}
      role="button"
      aria-label={`洞察: ${insight.title}`}
    >
      {/* 未读标识 */}
      {!insight.isRead && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#3b82f6',
          }}
        />
      )}

      {/* 头部 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>{CATEGORY_ICONS[insight.category]}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{insight.title}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
              {CATEGORY_LABELS[insight.category]}
            </div>
          </div>
        </div>
        <SeverityBadge severity={insight.severity} />
      </div>

      {/* 描述 */}
      <div style={{ marginTop: 10, fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
        {insight.description}
      </div>

      {/* 底部信息 */}
      <div
        style={{
          marginTop: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        {/* 影响数值 */}
        {insight.impactValue && (
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#22c55e',
              background: 'rgba(34,197,94,0.1)',
              padding: '2px 10px',
              borderRadius: 999,
            }}
          >
            {insight.impactLabel ? `${insight.impactLabel}` : insight.impactValue}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
          <ConfidenceBar value={insight.confidence} />
          <span style={{ fontSize: 11, color: '#64748b' }}>
            {new Date(insight.generatedAt).toLocaleString('zh-CN', {
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>
    </article>
  );
}

/** 分类汇总统计 */
function CategorySummary({ insights }: { insights: AnalysisInsight[] }) {
  const counts = useMemo(() => {
    const map = new Map<InsightCategory, number>();
    for (const ins of insights) {
      map.set(ins.category, (map.get(ins.category) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([cat, count]) => ({ category: cat, count }));
  }, [insights]);

  const unreadCount = useMemo(() => insights.filter((i) => !i.isRead).length, [insights]);
  const criticalCount = useMemo(() => insights.filter((i) => i.severity === 'critical').length, [insights]);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
        gap: 8,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          borderRadius: 10,
          padding: '10px 12px',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.2)',
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 700, color: '#ef4444' }}>{criticalCount}</div>
        <div style={{ fontSize: 11, color: '#fca5a5', marginTop: 2 }}>严重洞察</div>
      </div>
      <div
        style={{
          borderRadius: 10,
          padding: '10px 12px',
          background: 'rgba(59,130,246,0.1)',
          border: '1px solid rgba(59,130,246,0.2)',
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 700, color: '#60a5fa' }}>{unreadCount}</div>
        <div style={{ fontSize: 11, color: '#93c5fd', marginTop: 2 }}>未读</div>
      </div>
      {counts.slice(0, 4).map(({ category, count }) => (
        <div
          key={category}
          style={{
            borderRadius: 10,
            padding: '10px 12px',
            background: 'rgba(15,23,42,0.4)',
            border: '1px solid rgba(148,163,184,0.1)',
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>{count}</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
            {CATEGORY_LABELS[category]}
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================== 加载和空状态 ====================

function LoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`skeleton-${String(i)}`}
          style={{
            borderRadius: 12,
            padding: '14px 16px',
            background: 'rgba(15,23,42,0.3)',
            border: '1px solid rgba(148,163,184,0.08)',
          }}
        >
          <div
            style={{
              width: `${60 + Math.random() * 30}%`,
              height: 14,
              borderRadius: 4,
              background: 'rgba(148,163,184,0.1)',
              marginBottom: 10,
            }}
          />
          <div
            style={{
              width: '85%',
              height: 10,
              borderRadius: 4,
              background: 'rgba(148,163,184,0.08)',
              marginBottom: 6,
            }}
          />
          <div
            style={{
              width: '60%',
              height: 10,
              borderRadius: 4,
              background: 'rgba(148,163,184,0.08)',
            }}
          />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: 48,
        color: '#64748b',
        fontSize: 14,
        borderRadius: 12,
        border: '1px dashed rgba(148,163,184,0.18)',
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
      <div>暂未生成分析洞察</div>
      <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
        系统将在检测到异常或趋势变化时自动生成洞察
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: 32,
        color: '#fca5a5',
        fontSize: 14,
        borderRadius: 12,
        background: 'rgba(239,68,68,0.08)',
        border: '1px solid rgba(239,68,68,0.18)',
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 8 }}>❌</div>
      <div style={{ fontWeight: 600 }}>加载洞察失败</div>
      <div style={{ fontSize: 12, color: '#f87171', marginTop: 4 }}>{error}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: 12,
            padding: '6px 16px',
            borderRadius: 8,
            border: '1px solid rgba(239,68,68,0.3)',
            background: 'rgba(239,68,68,0.15)',
            color: '#fca5a5',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          重新加载
        </button>
      )}
    </div>
  );
}

// ==================== 主组件 ====================

/**
 * AIAnalysisInsightsPanel - 智能分析洞察面板
 *
 * 聚合展示 AI 分析生成的多种类型洞察（销售、客户、库存、异常检测等），
 * 支持未读标记、可信度展示、严重程度分类。
 */
export function AIAnalysisInsightsPanel({
  insights,
  loading = false,
  error,
  title = 'AI 分析洞察',
  description = '系统基于多维数据分析自动生成的智能洞察与建议',
  onMarkRead,
  onMarkAllRead,
  onRefresh,
  onInsightClick,
}: AIAnalysisInsightsPanelProps) {
  const unreadCount = useMemo(
    () => insights.filter((i) => !i.isRead).length,
    [insights],
  );

  return (
    <section
      style={{
        borderRadius: 16,
        padding: 20,
        background: 'rgba(15,23,42,0.6)',
        border: '1px solid rgba(148,163,184,0.12)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* 面板头部 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🧠</span>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
              {title}
            </h2>
            {unreadCount > 0 && (
              <span
                style={{
                  padding: '1px 8px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                  background: '#3b82f6',
                  color: '#fff',
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0 0' }}>
            {description}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {unreadCount > 0 && onMarkAllRead && (
            <button
              onClick={onMarkAllRead}
              style={{
                padding: '4px 12px',
                borderRadius: 8,
                border: '1px solid rgba(148,163,184,0.14)',
                background: 'rgba(15,23,42,0.5)',
                color: '#94a3b8',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
              aria-label="全部标记已读"
            >
              全部已读
            </button>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              style={{
                padding: '4px 8px',
                borderRadius: 8,
                border: '1px solid rgba(148,163,184,0.14)',
                background: 'rgba(15,23,42,0.5)',
                color: '#94a3b8',
                fontSize: 14,
                cursor: 'pointer',
                lineHeight: 1,
              }}
              aria-label="刷新洞察"
            >
              🔄
            </button>
          )}
        </div>
      </div>

      {/* 加载状态 */}
      {loading && <LoadingSkeleton count={3} />}

      {/* 错误状态 */}
      {error && !loading && <ErrorState error={error} onRetry={onRefresh} />}

      {/* 正常内容 */}
      {!loading && !error && (
        <>
          {insights.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* 统计摘要 */}
              <CategorySummary insights={insights} />

              {/* 洞察列表 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {insights.map((insight) => (
                  <InsightCard
                    key={insight.id}
                    insight={insight}
                    onMarkRead={onMarkRead}
                    onClick={onInsightClick}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}

export default AIAnalysisInsightsPanel;
