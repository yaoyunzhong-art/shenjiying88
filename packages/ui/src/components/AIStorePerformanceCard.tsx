'use client';

import React from 'react';

// ==================== 类型定义 ====================

/** 评分维度 */
export interface ScoreDimension {
  /** 维度名称 */
  label: string;
  /** 分值 (0-100) */
  score: number;
  /** 同比变化 (百分比) */
  changePercent: number;
  /** 维度说明 */
  description?: string;
}

/** AI门店绩效评分卡属性 */
export interface AIStorePerformanceCardProps {
  /** 门店名称 */
  storeName: string;
  /** 综合评分 (0-100) */
  overallScore: number;
  /** 评分同比变化 */
  overallChange: number;
  /** 各维度评分 */
  dimensions: ScoreDimension[];
  /** 上一周期综合评分 (用于对比) */
  previousScore?: number;
  /** 排名 */
  rank?: number;
  /** 总门店数(用于排名展示) */
  totalStores?: number;
  /** AI 总结建议 */
  insight?: string;
  /** 自定义类名 */
  className?: string;
}

// ==================== 工具函数 ====================

/** 根据分数返回颜色类名 */
function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

/** 根据分数返回背景色 */
function scoreBg(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
}

/** 趋势箭头 */
function trendArrow(change: number): string {
  if (change > 0) return '↑';
  if (change < 0) return '↓';
  return '→';
}

/** 趋势颜色 */
function trendColor(change: number): string {
  if (change > 0) return 'text-green-600';
  if (change < 0) return 'text-red-600';
  return 'text-gray-500';
}

// ==================== 组件 ====================

export function AIStorePerformanceCard({
  storeName,
  overallScore,
  overallChange,
  dimensions,
  previousScore,
  rank,
  totalStores,
  insight,
  className = '',
}: AIStorePerformanceCardProps) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}>
      {/* 头部：门店名称 + 排名 */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{storeName}</h3>
        {rank != null && totalStores != null && (
          <span className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
            排名 #{rank}/{totalStores}
          </span>
        )}
      </div>

      {/* 综合评分 */}
      <div className="mb-4 flex items-end gap-3">
        <div className="flex items-baseline gap-1">
          <span className={`text-4xl font-bold ${scoreColor(overallScore)}`}>
            {overallScore}
          </span>
          <span className="text-sm text-gray-400">/100</span>
        </div>
        <span className={`text-sm font-medium ${trendColor(overallChange)}`}>
          {trendArrow(overallChange)} {Math.abs(overallChange).toFixed(1)}%
        </span>
        {previousScore != null && (
          <span className="text-xs text-gray-400">
            上期: {previousScore}
          </span>
        )}
      </div>

      {/* 评分条 */}
      <div className="mb-5 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all ${scoreBg(overallScore)}`}
          style={{ width: `${Math.min(overallScore, 100)}%` }}
        />
      </div>

      {/* 维度评分 */}
      <div className="space-y-3">
        {dimensions.map((dim, idx) => {
          const pct = Math.min(dim.score, 100);
          return (
            <div key={idx}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm text-gray-700">{dim.label}</span>
                <span className="flex items-center gap-1.5">
                  <span className={`text-sm font-semibold ${scoreColor(dim.score)}`}>
                    {dim.score}
                  </span>
                  <span className={`text-xs ${trendColor(dim.changePercent)}`}>
                    {trendArrow(dim.changePercent)} {Math.abs(dim.changePercent).toFixed(1)}%
                  </span>
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full ${scoreBg(dim.score)}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {dim.description && (
                <p className="mt-0.5 text-xs text-gray-400">{dim.description}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* AI 总结建议 */}
      {insight && (
        <div className="mt-4 rounded-lg bg-blue-50 p-3">
          <div className="mb-1 flex items-center gap-1.5">
            <span className="text-sm text-blue-600">🤖 AI 洞察</span>
          </div>
          <p className="text-sm leading-relaxed text-blue-800">{insight}</p>
        </div>
      )}
    </div>
  );
}

export default AIStorePerformanceCard;
