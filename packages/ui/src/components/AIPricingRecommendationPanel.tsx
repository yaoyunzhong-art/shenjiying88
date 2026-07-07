'use client';

import React, { useMemo } from 'react';
import { Card } from './Card';
import { StatusBadge } from './StatusBadge';

// ==================== 类型定义 ====================

/** 定价策略建议 */
export interface PricingRecommendation {
  /** 商品ID */
  productId: string;
  /** 商品名称 */
  productName: string;
  /** 当前售价 */
  currentPrice: number;
  /** 建议售价 */
  recommendedPrice: number;
  /** 建议变动百分比 */
  changePercent: number;
  /** 预计销量影响 (百分比) */
  estimatedSalesImpact: number;
  /** 预计利润影响 */
  estimatedProfitImpact: number;
  /** 置信度 (0-100) */
  confidence: number;
  /** 定价策略类型 */
  strategy: 'markup' | 'markdown' | 'promotion' | 'dynamic' | 'premium';
  /** 策略原因 */
  reason: string;
  /** 竞争对手比较 */
  competitorComparison?: {
    competitorName: string;
    competitorPrice: number;
    position: 'above' | 'at' | 'below';
  };
}

/** 汇总统计 */
export interface PricingSummary {
  /** 总商品数 */
  totalProducts: number;
  /** 建议涨价的商品数 */
  markupCount: number;
  /** 建议降价的商品数 */
  markdownCount: number;
  /** 平均建议变动 */
  averageChangePercent: number;
  /** 预计整体收入影响 */
  totalRevenueImpact: number;
  /** 分析时间范围 */
  analysisTimeRange: string;
}

/** AI定价推荐面板属性 */
export interface AIPricingRecommendationPanelProps {
  /** 定价推荐列表 */
  recommendations: PricingRecommendation[];
  /** 汇总统计 */
  summary: PricingSummary;
  /** 是否加载中 */
  loading?: boolean;
  /** 错误信息 */
  error?: string;
  /** 应用推荐的回调 */
  onApplyRecommendation: (productId: string) => void;
  /** 忽略推荐的回调 */
  onDismissRecommendation: (productId: string) => void;
  /** 批量应用所有推荐 */
  onApplyAll?: () => void;
  /** 刷新数据 */
  onRefresh?: () => void;
}

// ==================== 辅助函数 ====================

function formatCurrency(value: number): string {
  return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

function strategyLabel(strategy: PricingRecommendation['strategy']): string {
  const map: Record<PricingRecommendation['strategy'], string> = {
    markup: '提价',
    markdown: '降价',
    promotion: '促销',
    dynamic: '动态定价',
    premium: '溢价',
  };
  return map[strategy];
}

function strategyColor(strategy: PricingRecommendation['strategy']): string {
  const map: Record<PricingRecommendation['strategy'], string> = {
    markup: 'warning',
    markdown: 'success',
    promotion: 'info',
    dynamic: 'neutral',
    premium: 'default',
  };
  return map[strategy];
}

// ==================== 主组件 ====================

export function AIPricingRecommendationPanel({
  recommendations,
  summary,
  loading = false,
  error,
  onApplyRecommendation,
  onDismissRecommendation,
  onApplyAll,
  onRefresh,
}: AIPricingRecommendationPanelProps) {
  const sorted = useMemo(
    () => [...recommendations].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)),
    [recommendations],
  );

  if (loading) {
    return (
      <div className="ai-pricing-loading" data-testid="pricing-panel-loading">
        <Card><div className="p-4 text-center">AI 正在分析定价策略...</div></Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ai-pricing-error" data-testid="pricing-panel-error">
        <Card variant="outlined">
          <div className="p-4">
            <StatusBadge variant="error" label="分析出错了" />
            <p className="mt-2 text-sm text-red-600">{error}</p>
            {onRefresh && (
              <button onClick={onRefresh} className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm">
                重试
              </button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="ai-pricing-empty" data-testid="pricing-panel-empty">
        <Card>
          <div className="p-4 text-center text-gray-500">
            暂无定价建议，当前所有商品定价合理
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="ai-pricing-panel space-y-4" data-testid="pricing-panel">
      {/* 摘要卡片 */}
      <Card>
        <div className="p-4" data-testid="pricing-summary">
          <h3 className="text-lg font-bold mb-3">AI 定价建议摘要</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500">分析商品数</div>
              <div className="text-xl font-bold">{summary.totalProducts}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">建议提价</div>
              <div className="text-xl font-bold text-orange-600">{summary.markupCount}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">建议降价</div>
              <div className="text-xl font-bold text-green-600">{summary.markdownCount}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">预计收入影响</div>
              <div className="text-xl font-bold text-blue-600">{formatCurrency(summary.totalRevenueImpact)}</div>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            分析周期: {summary.analysisTimeRange} | 平均建议变动: {formatPercent(summary.averageChangePercent)}
          </div>
        </div>
      </Card>

      {/* 批量操作栏 */}
      {onApplyAll && sorted.length > 1 && (
        <div className="flex justify-end gap-2">
          <button
            onClick={onApplyAll}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            data-testid="apply-all-btn"
          >
            应用全部建议 ({sorted.length})
          </button>
        </div>
      )}

      {/* 推荐列表 */}
      <div className="space-y-3" data-testid="pricing-recommendations">
        {sorted.map((rec) => (
          <Card key={rec.productId} variant="outlined">
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-base">{rec.productName}</h4>
                  <StatusBadge variant={strategyColor(rec.strategy) as any} label={strategyLabel(rec.strategy)} />
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">
                    {formatCurrency(rec.recommendedPrice)}
                  </div>
                  <div className="text-xs text-gray-400">
                    当前 {formatCurrency(rec.currentPrice)}
                  </div>
                </div>
              </div>

              {/* 价格变动指示 */}
              <div className="mb-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">变动:</span>
                  <span className={rec.changePercent >= 0 ? 'text-orange-600 font-medium' : 'text-green-600 font-medium'}>
                    {formatPercent(rec.changePercent)}
                  </span>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-500">预计销量:</span>
                  <span className={rec.estimatedSalesImpact >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatPercent(rec.estimatedSalesImpact)}
                  </span>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-500">预计利润:</span>
                  <span className={rec.estimatedProfitImpact >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(rec.estimatedProfitImpact)}
                  </span>
                </div>
              </div>

              {/* 置信度 */}
              <div className="mb-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">置信度:</span>
                  <div className="flex-1 max-w-[120px] h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        rec.confidence >= 80 ? 'bg-green-500' : rec.confidence >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${rec.confidence}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{rec.confidence}%</span>
                </div>
              </div>

              {/* 策略原因 */}
              <p className="text-sm text-gray-600 mb-2">{rec.reason}</p>

              {/* 竞争对手比较 */}
              {rec.competitorComparison && (
                <div className="text-xs text-gray-400 mb-3 bg-gray-50 p-2 rounded">
                  竞品 ({rec.competitorComparison.competitorName}): {formatCurrency(rec.competitorComparison.competitorPrice)}
                  {rec.competitorComparison.position === 'above' && ' (低于竞品)'}
                  {rec.competitorComparison.position === 'at' && ' (与竞品持平)'}
                  {rec.competitorComparison.position === 'below' && ' (高于竞品)'}
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-2 justify-end mt-2">
                <button
                  onClick={() => onDismissRecommendation(rec.productId)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-600"
                  data-testid={`dismiss-${rec.productId}`}
                >
                  忽略
                </button>
                <button
                  onClick={() => onApplyRecommendation(rec.productId)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  data-testid={`apply-${rec.productId}`}
                >
                  应用
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
