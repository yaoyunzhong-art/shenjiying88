'use client';

import React from 'react';

// ==================== 类型定义 ====================

/** 建议置信度 */
export type RecommendationConfidence = 'high' | 'medium' | 'low';

/** 建议类别 */
export type RecommendationCategory =
  | 'governance'       // 治理规则
  | 'compliance'       // 合规规则
  | 'performance'      // 性能规则
  | 'security'         // 安全规则
  | 'cost'             // 成本规则
  | 'member_retention'; // 会员留存规则

/** 单条规则建议 */
export interface RuleRecommendation {
  /** 建议 ID */
  id: string;
  /** 建议标题 */
  title: string;
  /** 建议描述 */
  description: string;
  /** 建议类别 */
  category: RecommendationCategory;
  /** 置信度 */
  confidence: RecommendationConfidence;
  /** 潜在影响描述 */
  impact?: string;
  /** 预估收益（如节省成本百分比/提升效率百分比）*/
  estimatedBenefit?: string;
  /** 是否已被采纳 */
  adopted?: boolean;
  /** 采纳后关联规则 ID */
  resultingRuleId?: string;
  /** 创建时间 */
  createdAt: string;
}

/** 汇总统计 */
export interface RecommendationSummary {
  total: number;
  highConfidence: number;
  adopted: number;
  /** 预估总收益 */
  totalEstimatedBenefit?: string;
}

/** 面板属性 */
export interface RuleRecommendationPanelProps {
  /** 建议列表 */
  recommendations: RuleRecommendation[];
  /** 汇总统计 */
  summary?: RecommendationSummary;
  /** 采纳回调 */
  onAdopt?: (recommendationId: string) => void;
  /** 忽略回调 */
  onDismiss?: (recommendationId: string) => void;
  /** 查看详情回调 */
  onViewDetail?: (recommendationId: string) => void;
  /** 加载状态 */
  loading?: boolean;
  /** 类名 */
  className?: string;
}

// ==================== 内部组件 ====================

/** 置信度徽标 */
function ConfidenceBadge({
  confidence,
}: {
  confidence: RecommendationConfidence;
}) {
  const colorMap: Record<RecommendationConfidence, string> = {
    high: '#22c55e',
    medium: '#eab308',
    low: '#94a3b8',
  };
  const labelMap: Record<RecommendationConfidence, string> = {
    high: '高置信',
    medium: '中置信',
    low: '低置信',
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 500,
        color: '#fff',
        backgroundColor: colorMap[confidence],
      }}
    >
      {labelMap[confidence]}
    </span>
  );
}

/** 类别标签 */
function CategoryLabel({ category }: { category: RecommendationCategory }) {
  const labelMap: Record<RecommendationCategory, string> = {
    governance: '治理',
    compliance: '合规',
    performance: '性能',
    security: '安全',
    cost: '成本',
    member_retention: '会员留存',
  };

  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 400,
        color: '#6366f1',
        backgroundColor: '#eef2ff',
      }}
    >
      {labelMap[category]}
    </span>
  );
}

// ==================== 主组件 ====================

export function RuleRecommendationPanel({
  recommendations,
  summary,
  onAdopt,
  onDismiss,
  onViewDetail,
  loading = false,
  className,
}: RuleRecommendationPanelProps) {
  if (loading) {
    return (
      <div
        className={className}
        style={{
          padding: 24,
          borderRadius: 8,
          border: '1px solid #e5e7eb',
          backgroundColor: '#fff',
        }}
      >
        <div style={{ fontSize: 14, color: '#6b7280' }}>加载推荐规则中...</div>
        <div
          style={{
            marginTop: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: 72,
                borderRadius: 8,
                backgroundColor: '#f3f4f6',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
        <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
      </div>
    );
  }

  if (!recommendations.length) {
    return (
      <div
        className={className}
        style={{
          padding: 24,
          borderRadius: 8,
          border: '1px solid #e5e7eb',
          backgroundColor: '#fff',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 16, color: '#9ca3af', marginTop: 12 }}>
          暂无待处理的规则建议
        </div>
        <div style={{ fontSize: 13, color: '#d1d5db', marginTop: 4 }}>
          系统将根据运行数据自动生成建议
        </div>
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        borderRadius: 8,
        border: '1px solid #e5e7eb',
        backgroundColor: '#fff',
        overflow: 'hidden',
      }}
    >
      {/* 头部 + 摘要 */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <span style={{ fontWeight: 600, fontSize: 16, color: '#111827' }}>
            🤖 AI 规则建议
          </span>
          {summary && (
            <span
              style={{
                marginLeft: 12,
                fontSize: 13,
                color: '#6b7280',
              }}
            >
              {summary.total} 条建议 · 已采纳 {summary.adopted} 条
              {summary.totalEstimatedBenefit
                ? ` · 预估 ${summary.totalEstimatedBenefit}`
                : ''}
            </span>
          )}
        </div>
      </div>

      {/* 建议列表 */}
      <div style={{ maxHeight: 480, overflowY: 'auto' }}>
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid #f3f4f6',
              opacity: rec.adopted ? 0.6 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 500,
                      fontSize: 14,
                      color: '#111827',
                      textDecoration: rec.adopted ? 'line-through' : 'none',
                    }}
                  >
                    {rec.title}
                  </span>
                  <CategoryLabel category={rec.category} />
                  <ConfidenceBadge confidence={rec.confidence} />
                  {rec.adopted && (
                    <span
                      style={{
                        fontSize: 12,
                        color: '#22c55e',
                        fontWeight: 500,
                      }}
                    >
                      ✓ 已采纳
                    </span>
                  )}
                </div>

                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: '#6b7280',
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {rec.description}
                </p>

                {(rec.impact || rec.estimatedBenefit) && (
                  <div
                    style={{
                      marginTop: 6,
                      display: 'flex',
                      gap: 12,
                      fontSize: 12,
                      color: '#9ca3af',
                    }}
                  >
                    {rec.impact && <span>影响: {rec.impact}</span>}
                    {rec.estimatedBenefit && (
                      <span style={{ color: '#22c55e' }}>
                        预估收益: {rec.estimatedBenefit}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 操作按钮 */}
              {!rec.adopted && (
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    marginLeft: 12,
                    flexShrink: 0,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onViewDetail?.(rec.id)}
                    style={{
                      padding: '4px 10px',
                      fontSize: 12,
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      backgroundColor: '#fff',
                      color: '#374151',
                      cursor: 'pointer',
                    }}
                  >
                    详情
                  </button>
                  <button
                    type="button"
                    onClick={() => onDismiss?.(rec.id)}
                    style={{
                      padding: '4px 10px',
                      fontSize: 12,
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      backgroundColor: '#fff',
                      color: '#9ca3af',
                      cursor: 'pointer',
                    }}
                  >
                    忽略
                  </button>
                  <button
                    type="button"
                    onClick={() => onAdopt?.(rec.id)}
                    style={{
                      padding: '4px 12px',
                      fontSize: 12,
                      border: 'none',
                      borderRadius: 6,
                      backgroundColor: '#6366f1',
                      color: '#fff',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    采纳
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 底部操作区 */}
      <div
        style={{
          padding: '10px 20px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#fafafa',
        }}
      >
        <span style={{ fontSize: 12, color: '#9ca3af' }}>
          共 {recommendations.length} 条建议
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => onViewDetail?.('__all__')}
            style={{
              padding: '6px 14px',
              fontSize: 13,
              border: '1px solid #d1d5db',
              borderRadius: 6,
              backgroundColor: '#fff',
              color: '#374151',
              cursor: 'pointer',
            }}
          >
            查看全部
          </button>
        </div>
      </div>
    </div>
  );
}

export default RuleRecommendationPanel;
