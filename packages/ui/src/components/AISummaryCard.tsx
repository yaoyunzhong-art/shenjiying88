'use client';

import React from 'react';

// ==================== 类型定义 ====================

/** 指标变化趋势 */
export type TrendDirection = 'up' | 'down' | 'flat';

/** 高亮指标项 */
export interface HighlightMetric {
  /** 指标名称 */
  label: string;
  /** 当前值 */
  value: string | number;
  /** 变化趋势 */
  trend?: TrendDirection;
  /** 变化百分比 */
  changePercent?: number;
  /** 指标单位 */
  unit?: string;
  /** 是否为正（绿）/负（红） */
  isPositive?: boolean;
}

/** 关键洞察 */
export interface InsightItem {
  /** 洞察类型: positive / negative / info */
  type: 'positive' | 'negative' | 'info';
  /** 洞察文本 */
  text: string;
}

/** AI 摘要卡片 Props */
export interface AISummaryCardProps {
  /** 摘要标题 */
  title?: string;
  /** AI 生成的摘要描述文本 */
  summary: string;
  /** 高亮指标列表（1-3 个最佳） */
  metrics?: HighlightMetric[];
  /** 关键洞察列表 */
  insights?: InsightItem[];
  /** 是否显示加载状态 */
  loading?: boolean;
  /** 加载失败时的错误文本 */
  error?: string;
  /** 数据刷新时间（ISO 字符串） */
  updatedAt?: string;
  /** 自定义类名 */
  className?: string;
  /** 点击 AI 分析区域回调 */
  onAIAnalyze?: () => void;
  /** 是否正在 AI 分析中 */
  analyzing?: boolean;
}

// ==================== 辅助函数 ====================

/** 获取趋势箭头 */
function getTrendSymbol(dir: TrendDirection): string {
  switch (dir) {
    case 'up': return '↑';
    case 'down': return '↓';
    case 'flat': return '→';
  }
}

/** 获取趋势颜色 */
function getTrendColor(isPositive: boolean | undefined, dir?: TrendDirection): string {
  if (!dir || dir === 'flat') return '#94a3b8';
  const isUp = dir === 'up';
  const good = isPositive ?? true;
  // up + positive => green, up + not positive => red
  return (isUp && good) || (!isUp && !good) ? '#22c55e' : '#ef4444';
}

/** 获取洞察图标和颜色 */
function getInsightStyle(type: InsightItem['type']): { icon: string; color: string; bg: string } {
  switch (type) {
    case 'positive':
      return { icon: '📈', color: '#22c55e', bg: 'rgba(34,197,94,0.08)' };
    case 'negative':
      return { icon: '⚠️', color: '#ef4444', bg: 'rgba(239,68,68,0.08)' };
    case 'info':
      return { icon: '💡', color: '#60a5fa', bg: 'rgba(96,165,250,0.08)' };
  }
}

// ==================== 时间格式化 ====================

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (isNaN(diff)) return iso;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  return `${Math.floor(hours / 24)}天前`;
}

// ==================== 子组件 ====================

/** 高亮指标卡片 */
function MetricChip({ metric }: { metric: HighlightMetric }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '10px 14px',
        borderRadius: 10,
        background: 'rgba(15,23,42,0.4)',
        border: '1px solid rgba(148,163,184,0.08)',
        flex: 1,
        minWidth: 0,
      }}
    >
      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
        {metric.label}
      </span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#f8fafc',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {metric.value}
          {metric.unit && (
            <span style={{ fontSize: 12, fontWeight: 400, color: '#64748b', marginLeft: 2 }}>
              {metric.unit}
            </span>
          )}
        </span>
        {metric.trend && metric.trend !== 'flat' && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: getTrendColor(metric.isPositive, metric.trend),
            }}
          >
            {getTrendSymbol(metric.trend)}
            {metric.changePercent != null && ` ${Math.abs(metric.changePercent)}%`}
          </span>
        )}
      </div>
    </div>
  );
}

/** 单条洞察 */
function InsightRow({ insight }: { insight: InsightItem }) {
  const style = getInsightStyle(insight.type);
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        padding: '6px 8px',
        borderRadius: 8,
        background: style.bg,
      }}
    >
      <span style={{ fontSize: 12, flexShrink: 0 }}>{style.icon}</span>
      <span style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.5 }}>
        {insight.text}
      </span>
    </div>
  );
}

/** 加载骨架 */
function LoadingSkeletonBlock() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          height: 14,
          width: '60%',
          borderRadius: 4,
          background: 'rgba(148,163,184,0.1)',
          animation: 'pulse 2s infinite',
        }}
      />
      <div
        style={{
          height: 12,
          width: '90%',
          borderRadius: 4,
          background: 'rgba(148,163,184,0.08)',
          animation: 'pulse 2s infinite',
        }}
      />
      <div
        style={{
          height: 12,
          width: '75%',
          borderRadius: 4,
          background: 'rgba(148,163,184,0.08)',
          animation: 'pulse 2s infinite',
        }}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: 48,
              flex: 1,
              borderRadius: 8,
              background: 'rgba(148,163,184,0.06)',
              animation: 'pulse 2s infinite',
            }}
          />
        ))}
      </div>
    </div>
  );
}

/** 错误提示 */
function ErrorBlock({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: 10,
        background: 'rgba(239,68,68,0.08)',
        border: '1px solid rgba(239,68,68,0.15)',
        fontSize: 13,
        color: '#fca5a5',
        lineHeight: 1.5,
      }}
    >
      {message}
    </div>
  );
}

// ==================== 主组件 ====================

/**
 * AISummaryCard — AI 智能摘要卡片。
 *
 * 在详情页 / 仪表盘顶部展示 AI 自动生成的业务摘要，
 * 包含关键指标高亮显示和智能洞察，帮助运营人员快速掌握核心信息。
 *
 * 特性：
 * - AI 生成的摘要文本
 * - 1-3 个高亮指标（含趋势变化）
 * - 关键洞察列表（正面/负面/提示）
 * - 加载态 / 错误态 / 空状态
 * - AI 重新分析按钮
 * - 更新时间提示
 *
 * @example
 * // 基础用法
 * <AISummaryCard
 *   title="门店运营摘要"
 *   summary="今日门店订单量环比增长 12%，关键指标全部达标。其中线上订单增长显著，但退单率略有上升。"
 *   metrics={[
 *     { label: '订单量', value: 1280, trend: 'up', changePercent: 12, isPositive: true, unit: '单' },
 *     { label: '退单率', value: 3.2, trend: 'down', changePercent: -0.5, isPositive: false, unit: '%' },
 *   ]}
 *   insights={[
 *     { type: 'positive', text: '线上订单增长 25%，建议扩充晚班运力' },
 *     { type: 'negative', text: '商品 A 库存不足，建议及时补货' },
 *   ]}
 *   updatedAt={new Date().toISOString()}
 * />
 *
 * @example
 * // 加载状态
 * <AISummaryCard loading summary="" title="加载中..." />
 *
 * @example
 * // 错误状态
 * <AISummaryCard
 *   error="AI 分析服务暂时不可用，请稍后重试"
 *   summary=""
 * />
 */
export function AISummaryCard({
  title = 'AI 摘要',
  summary,
  metrics,
  insights,
  loading = false,
  error,
  updatedAt,
  className,
  onAIAnalyze,
  analyzing = false,
}: AISummaryCardProps) {
  return (
    <div
      className={className}
      style={{
        borderRadius: 16,
        background: 'linear-gradient(135deg, rgba(30,41,59,0.6) 0%, rgba(15,23,42,0.5) 100%)',
        border: '1px solid rgba(148,163,184,0.12)',
        padding: '18px 20px',
      }}
    >
      {/* 标题栏 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 14,
        }}
      >
        <span style={{ fontSize: 14 }}>🧠</span>
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#e2e8f0',
          }}
        >
          {title}
        </span>

        {analyzing && (
          <span
            style={{
              fontSize: 11,
              color: '#60a5fa',
              background: 'rgba(96,165,250,0.12)',
              padding: '2px 8px',
              borderRadius: 6,
              fontWeight: 500,
            }}
          >
            分析中...
          </span>
        )}

        <div style={{ flex: 1 }} />

        {onAIAnalyze && !loading && !error && (
          <button
            type="button"
            onClick={onAIAnalyze}
            disabled={analyzing}
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: analyzing ? '#475569' : '#60a5fa',
              background: analyzing
                ? 'rgba(71,85,105,0.15)'
                : 'rgba(96,165,250,0.1)',
              border: `1px solid ${
                analyzing ? 'rgba(71,85,105,0.2)' : 'rgba(96,165,250,0.2)'
              }`,
              borderRadius: 6,
              padding: '4px 10px',
              cursor: analyzing ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {analyzing ? '分析中...' : '🔄 重新分析'}
          </button>
        )}

        {updatedAt && !loading && !error && (
          <span style={{ fontSize: 10, color: '#475569' }}>
            {formatRelativeTime(updatedAt)}
          </span>
        )}
      </div>

      {/* 加载状态 */}
      {loading && <LoadingSkeletonBlock />}

      {/* 错误状态 */}
      {error && !loading && <ErrorBlock message={error} />}

      {/* 正常内容 */}
      {!loading && !error && (
        <>
          {/* 摘要文本 */}
          {summary ? (
            <p
              style={{
                fontSize: 13,
                color: '#cbd5e1',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              {summary}
            </p>
          ) : (
            <div
              style={{
                padding: '16px 0',
                textAlign: 'center',
                color: '#475569',
                fontSize: 13,
              }}
            >
              🤔 暂无摘要数据，点击“重新分析”生成
            </div>
          )}

          {/* 高亮指标 */}
          {metrics && metrics.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginTop: 14,
                flexWrap: 'wrap',
              }}
            >
              {metrics.map((m, i) => (
                <MetricChip key={i} metric={m} />
              ))}
            </div>
          )}

          {/* 关键洞察 */}
          {insights && insights.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                marginTop: 12,
                padding: 10,
                borderRadius: 10,
                background: 'rgba(15,23,42,0.3)',
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: '#64748b',
                  fontWeight: 500,
                  marginBottom: 4,
                }}
              >
                关键洞察
              </span>
              {insights.map((item, i) => (
                <InsightRow key={i} insight={item} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AISummaryCard;
