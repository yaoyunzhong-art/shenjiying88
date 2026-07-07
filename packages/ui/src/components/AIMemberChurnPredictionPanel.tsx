'use client';

import React, { useState, useMemo } from 'react';

// ==================== 类型定义 ====================

/** 流失风险等级 */
export type ChurnRiskLevel = 'low' | 'medium' | 'high' | 'critical';

/** 流失信号因子 */
export interface ChurnSignalFactor {
  /** 因子编码 */
  code: string;
  /** 因子名称 */
  label: string;
  /** 贡献权重 0-100 */
  weight: number;
  /** 详细描述 */
  description: string;
  /** 风险方向 positive=正向, negative=负向 */
  direction: 'positive' | 'negative';
}

/** 建议挽回动作 */
export interface RetentionAction {
  /** 动作编码 */
  code: string;
  /** 动作名称 */
  label: string;
  /** 推荐渠道 */
  channel: 'sms' | 'wechat' | 'app_push' | 'coupon' | 'phone';
  /** 优先级 */
  priority: 'high' | 'medium' | 'low';
  /** 预期挽回概率 0-100 */
  expectedRecoveryRate: number;
  /** 动作说明 */
  description: string;
}

/** 流失预测结果 */
export interface ChurnPrediction {
  /** 会员 ID */
  memberId: string;
  /** 会员名称 */
  memberName: string;
  /** 当前会员等级 */
  memberTier: string;
  /** 风险等级 */
  riskLevel: ChurnRiskLevel;
  /** 整体流失概率 0-100 */
  churnProbability: number;
  /** 预测流失时间窗口（天） */
  predictedWindowDays: number;
  /** 流失信号因子列表 */
  signalFactors: ChurnSignalFactor[];
  /** 建议挽回动作列表 */
  recommendedActions: RetentionAction[];
  /** 历史趋势 last30d/last90d/last180d */
  activityTrend: 'declining' | 'stable' | 'recovering';
  /** 上次活跃距今天数 */
  daysSinceLastActivity: number;
  /** 预测生成时间 */
  predictedAt: string;
}

// ==================== 常量 ====================

const RISK_COLORS: Record<ChurnRiskLevel, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#7c3aed',
};

const RISK_LABELS: Record<ChurnRiskLevel, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
  critical: '极高风险',
};

const TREND_LABELS: Record<string, string> = {
  declining: '持续下降',
  stable: '保持平稳',
  recovering: '逐渐回升',
};

const TREND_COLORS: Record<string, string> = {
  declining: '#ef4444',
  stable: '#f59e0b',
  recovering: '#22c55e',
};

const CHANNEL_LABELS: Record<string, string> = {
  sms: '短信',
  wechat: '企微',
  app_push: 'App推送',
  coupon: '优惠券',
  phone: '电话回访',
};

// ==================== 子组件 ====================

/** 流失概率环形图 */
function ChurnGauge({ probability, riskLevel }: { probability: number; riskLevel: ChurnRiskLevel }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - probability / 100);
  const color = RISK_COLORS[riskLevel];

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={radius}
          fill="none" stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90, 70, 70)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text x="70" y="60" textAnchor="middle" fontSize="28" fontWeight="bold" fill={color}>
          {probability}%
        </text>
        <text x="70" y="82" textAnchor="middle" fontSize="12" fill="#6b7280">
          流失概率
        </text>
      </svg>
      <span className="mt-1 text-sm font-medium" style={{ color }}>
        {RISK_LABELS[riskLevel]}
      </span>
    </div>
  );
}

/** 单条信号因子条 */
function SignalBar({ factor, maxWeight }: { factor: ChurnSignalFactor; maxWeight: number }) {
  const pct = (factor.weight / maxWeight) * 100;
  const barColor = factor.direction === 'negative' ? '#ef4444' : '#22c55e';
  const directionIcon = factor.direction === 'negative' ? '↓' : '↑';
  const directionColor = factor.direction === 'negative' ? '#ef4444' : '#22c55e';

  return (
    <div className="mb-2">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-gray-700">{factor.label}</span>
        <span className="text-xs" style={{ color: directionColor }}>{directionIcon} {factor.weight}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-0.5">{factor.description}</p>
    </div>
  );
}

/** 建议挽回动作卡片 */
function ActionCard({ action }: { action: RetentionAction }) {
  const priorityColors: Record<string, string> = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#22c55e',
  };
  const priorityLabels: Record<string, string> = { high: '高优先级', medium: '中优先级', low: '低优先级' };

  return (
    <div className="border border-gray-200 rounded-lg p-3 mb-2 bg-white hover:shadow-sm transition-shadow">
      <div className="flex justify-between items-start mb-1">
        <span className="text-sm font-medium text-gray-800">{action.label}</span>
        <span
          className="text-xs px-1.5 py-0.5 rounded-full text-white"
          style={{ backgroundColor: priorityColors[action.priority] }}
        >
          {priorityLabels[action.priority]}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-2">{action.description}</p>
      <div className="flex justify-between items-center text-xs">
        <span className="text-gray-400">渠道: {CHANNEL_LABELS[action.channel] || action.channel}</span>
        <span className="text-green-600 font-medium">挽回率 {action.expectedRecoveryRate}%</span>
      </div>
    </div>
  );
}

/** 趋势标签 */
function TrendBadge({ trend }: { trend: string }) {
  const color = TREND_COLORS[trend] || '#6b7280';
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: color }}
    >
      {TREND_LABELS[trend] || trend}
    </span>
  );
}

// ==================== 主组件 ====================

export interface AIMemberChurnPredictionPanelProps {
  /** 流失预测数据 */
  prediction: ChurnPrediction;
  /** 是否加载中 */
  loading?: boolean;
  /** 错误信息 */
  error?: string | null;
  /** 点击执行挽回动作回调 */
  onExecuteAction?: (action: RetentionAction) => void;
  /** 重新预测回调 */
  onRefresh?: () => void;
  /** 自定义类名 */
  className?: string;
}

export function AIMemberChurnPredictionPanel({
  prediction,
  loading = false,
  error = null,
  onExecuteAction,
  onRefresh,
  className = '',
}: AIMemberChurnPredictionPanelProps) {
  const [expandedSignal, setExpandedSignal] = useState(false);
  const maxWeight = useMemo(
    () => Math.max(...prediction.signalFactors.map((f) => f.weight), 1),
    [prediction.signalFactors]
  );

  // ---- 加载态 ----
  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-5 ${className}`}>
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="flex justify-center mb-4">
            <div className="w-32 h-32 bg-gray-200 rounded-full" />
          </div>
          <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
          <div className="h-8 bg-gray-200 rounded mb-2" />
          <div className="h-8 bg-gray-200 rounded mb-2" />
          <div className="h-8 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  // ---- 错误态 ----
  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-5 ${className}`}>
        <div className="flex items-center gap-2 text-red-600 mb-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">预测失败</span>
        </div>
        <p className="text-sm text-red-500 mb-3">{error}</p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-sm px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            重新尝试
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* 头部 */}
      <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          AI 流失预测
        </h3>
        <div className="flex items-center gap-2">
          <TrendBadge trend={prediction.activityTrend} />
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-xs px-2 py-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="重新预测"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="p-5">
        {/* 主体: 环形图 + 概览信息 */}
        <div className="flex flex-wrap gap-6 mb-5">
          <ChurnGauge probability={prediction.churnProbability} riskLevel={prediction.riskLevel} />
          <div className="flex-1 min-w-[140px]">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded p-2.5">
                <p className="text-xs text-gray-500">预计流失时间</p>
                <p className="text-sm font-semibold text-gray-800">{prediction.predictedWindowDays} 天内</p>
              </div>
              <div className="bg-gray-50 rounded p-2.5">
                <p className="text-xs text-gray-500">近期活跃</p>
                <p className="text-sm font-semibold text-gray-800">
                  {prediction.daysSinceLastActivity > 90
                    ? '超90天未到店'
                    : `${prediction.daysSinceLastActivity} 天前`}
                </p>
              </div>
              <div className="bg-gray-50 rounded p-2.5">
                <p className="text-xs text-gray-500">会员等级</p>
                <p className="text-sm font-semibold text-gray-800 capitalize">{prediction.memberTier}</p>
              </div>
              <div className="bg-gray-50 rounded p-2.5">
                <p className="text-xs text-gray-500">预测时间</p>
                <p className="text-sm font-semibold text-gray-800">
                  {new Date(prediction.predictedAt).toLocaleDateString('zh-CN')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 信号因子分析 */}
        <div className="mb-5">
          <button
            onClick={() => setExpandedSignal(!expandedSignal)}
            className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
          >
            <span>流失信号分析 ({prediction.signalFactors.length} 项)</span>
            <svg
              className={`w-4 h-4 transition-transform ${expandedSignal ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSignal && (
            <div className="bg-gray-50 rounded p-3">
              {prediction.signalFactors.map((factor) => (
                <SignalBar key={factor.code} factor={factor} maxWeight={maxWeight} />
              ))}
              {prediction.signalFactors.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-2">暂无信号因子数据</p>
              )}
            </div>
          )}
          {!expandedSignal && prediction.signalFactors.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {prediction.signalFactors.slice(0, 3).map((f) => (
                <span
                  key={f.code}
                  className={`text-xs px-2 py-1 rounded-full ${
                    f.direction === 'negative' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                  }`}
                >
                  {f.label} ({f.weight}%)
                </span>
              ))}
              {prediction.signalFactors.length > 3 && (
                <span className="text-xs text-gray-400 px-1">+{prediction.signalFactors.length - 3} 项</span>
              )}
            </div>
          )}
          {!expandedSignal && prediction.signalFactors.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-2">暂无信号因子数据</p>
          )}
        </div>

        {/* 建议挽回动作 */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            建议挽回动作 ({prediction.recommendedActions.length})
          </p>
          {prediction.recommendedActions.length > 0 ? (
            <div className="space-y-1">
              {prediction.recommendedActions.map((action) => (
                <div key={action.code} className="flex items-start gap-2">
                  <ActionCard action={action} />
                  {onExecuteAction && (
                    <button
                      onClick={() => onExecuteAction(action)}
                      className="mt-2 text-xs px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded hover:bg-purple-100 transition-colors whitespace-nowrap"
                    >
                      执行
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-3">当前无建议动作</p>
          )}
        </div>
      </div>

      {/* 脚注 */}
      <div className="px-5 py-2.5 border-t border-gray-100 bg-gray-50 rounded-b-lg">
        <p className="text-xs text-gray-400">
          基于会员近 {prediction.predictedWindowDays} 天消费行为、访问频率、客单价趋势等多维数据计算
        </p>
      </div>
    </div>
  );
}
