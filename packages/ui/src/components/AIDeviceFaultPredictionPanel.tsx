'use client';

import React, { useMemo } from 'react';
import { Card } from './Card';
import { StatusBadge, type StatusBadgeProps } from './StatusBadge';

// ==================== 类型定义 ====================

/** 严重程度 */
export type FaultSeverity = 'critical' | 'high' | 'medium' | 'low';

/** 预测状态 */
export type PredictionStatus = 'predicted' | 'monitoring' | 'resolved' | 'scheduled';

/** 设备类别 */
export type DeviceCategory = 'arcade' | 'prize' | 'audio' | 'lighting' | 'ac' | 'network' | 'other';

/** 单个设备故障预测 */
export interface DeviceFaultPrediction {
  /** 设备 ID */
  deviceId: string;
  /** 设备名称 */
  deviceName: string;
  /** 设备类别 */
  category: DeviceCategory;
  /** 故障预测描述 */
  predictedFault: string;
  /** 严重程度 */
  severity: FaultSeverity;
  /** 当前状态 */
  status: PredictionStatus;
  /** 预测概率 (0-100) */
  probability: number;
  /** 预计发生时间 (ISO 日期) */
  estimatedDate: string;
  /** 建议维护操作 */
  suggestedAction: string;
  /** 上次维护日期 */
  lastMaintenanceDate?: string;
  /** 运行时长 (小时) */
  runtimeHours?: number;
  /** 当前评分 (0-100) */
  healthScore?: number;
}

/** 汇总统计数据 */
export interface FaultPredictionSummary {
  /** 总设备数 */
  totalDevices: number;
  /** 高危设备数 */
  criticalCount: number;
  /** 待维护数 */
  pendingCount: number;
  /** 本月预计故障数 */
  predictedThisMonth: number;
  /** 平均健康分 */
  avgHealthScore: number;
}

/** AI 设备故障预测面板 Props */
export interface AIDeviceFaultPredictionPanelProps {
  /** 预测列表 */
  predictions: DeviceFaultPrediction[];
  /** 汇总数据 */
  summary?: FaultPredictionSummary;
  /** 面板标题 */
  title?: string;
  /** 是否紧凑 */
  compact?: boolean;
  /** 类名 */
  className?: string;
  /** 空状态文案 */
  emptyText?: string;
  /** 条目点击回掉 */
  onPredictionClick?: (prediction: DeviceFaultPrediction) => void;
  /** 一键安排维护 */
  onScheduleMaintenance?: (deviceIds: string[]) => void;
  /** 标记已处理 */
  onResolve?: (deviceId: string) => void;
  /** 加载中 */
  loading?: boolean;
  /** 测试 id */
  'data-testid'?: string;
}

// ==================== 常量 ====================

const SEVERITY_CONFIG = {
  critical: { label: '紧急', variant: 'danger' as const },
  high: { label: '高危', variant: 'warning' as const },
  medium: { label: '中等', variant: 'info' as const },
  low: { label: '较低', variant: 'success' as const },
} satisfies Record<FaultSeverity, { label: string; variant: StatusBadgeProps['variant'] }>;

const STATUS_CONFIG = {
  predicted: { label: '已预测', variant: 'warning' as const },
  monitoring: { label: '监控中', variant: 'info' as const },
  resolved: { label: '已解决', variant: 'success' as const },
  scheduled: { label: '已安排', variant: 'info' as const },
} satisfies Record<PredictionStatus, { label: string; variant: StatusBadgeProps['variant'] }>;

const CATEGORY_LABELS: Record<DeviceCategory, string> = {
  arcade: '街机',
  prize: '礼品机',
  audio: '音响',
  lighting: '灯光',
  ac: '空调',
  network: '网络',
  other: '其他',
};

// ==================== 工具函数 ====================

/** 根据概率返回颜色类名 */
function probabilityColor(probability: number): string {
  if (probability >= 80) return 'color-critical';
  if (probability >= 60) return 'color-high';
  if (probability >= 30) return 'color-medium';
  return 'color-low';
}

/** 严重程度排序权重 */
const severityWeight: Record<FaultSeverity, number> = { critical: 4, high: 3, medium: 2, low: 1 };

// ==================== 子组件 ====================

/** 概率条 */
function ProbabilityBar({ value }: { value: number }) {
  const barColor =
    value >= 80 ? 'var(--color-critical, #ef4444)' :
    value >= 60 ? 'var(--color-high, #f97316)' :
    value >= 30 ? 'var(--color-medium, #eab308)' :
    'var(--color-low, #22c55e)';
  return (
    <div className="probability-bar-wrapper" style={{ width: 80, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <div style={{ flex: 1, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: barColor, borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 12, minWidth: 30, textAlign: 'right' }}>{value}%</span>
    </div>
  );
}

/** 健康分圆环 */
function HealthRing({ score }: { score: number }) {
  const color =
    score >= 80 ? '#22c55e' :
    score >= 60 ? '#eab308' :
    score >= 40 ? '#f97316' : '#ef4444';
  const r = 14;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  return (
    <svg width={36} height={36} viewBox="0 0 36 36">
      <circle cx={18} cy={18} r={r} fill="none" stroke="#e5e7eb" strokeWidth={3} />
      <circle cx={18} cy={18} r={r} fill="none" stroke={color} strokeWidth={3}
        strokeDasharray={circumference} strokeDashoffset={offset}
        transform="rotate(-90 18 18)" strokeLinecap="round" />
      <text x={18} y={18} textAnchor="middle" dominantBaseline="central"
        fontSize={10} fontWeight={600} fill={color}>{score}</text>
    </svg>
  );
}

// ==================== 主组件 ====================

export function AIDeviceFaultPredictionPanel({
  predictions,
  summary,
  title,
  compact = false,
  className = '',
  emptyText = '暂无设备故障预测',
  onPredictionClick,
  onScheduleMaintenance,
  onResolve,
  loading = false,
  'data-testid': testId = 'ai-device-fault-prediction-panel',
}: AIDeviceFaultPredictionPanelProps) {

  // 按严重程度排序
  const sorted = useMemo(() => {
    return [...predictions].sort((a, b) => {
      const sw = severityWeight[b.severity] - severityWeight[a.severity];
      if (sw !== 0) return sw;
      return b.probability - a.probability;
    });
  }, [predictions]);

  // 高危/紧急预测
  const criticalPredictions = useMemo(() => {
    return predictions.filter(p => p.severity === 'critical' || p.severity === 'high');
  }, [predictions]);

  // 需要操作的去重设备 ID
  const actionableIds = useMemo(() => {
    return [...new Set(
      predictions
        .filter(p => p.status === 'predicted' || p.status === 'monitoring')
        .map(p => p.deviceId)
    )];
  }, [predictions]);

  // ---------- 渲染 ----------

  if (loading) {
    return (
      <div className={className} data-testid={testId}>
        <Card>
          <div style={{ padding: compact ? 12 : 16 }}>
            <div className="skeleton-block" style={{ height: 24, width: '40%', marginBottom: 12, background: '#f0f0f0', borderRadius: 4 }} />
            <div className="skeleton-block" style={{ height: 60, background: '#f0f0f0', borderRadius: 4 }} />
          </div>
        </Card>
      </div>
    );
  }

  if (!predictions.length) {
    return (
      <div className={className} data-testid={testId}>
        <Card>
          <div style={{ padding: compact ? 12 : 16 }}>
            <div data-testid={`${testId}-empty`} style={{ textAlign: 'center', padding: '24px 0', color: '#9ca3af' }}>
              {emptyText}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={className} data-testid={testId}>
      <Card>
        <div style={{ padding: compact ? 12 : 16 }}>
          {/* 标题 & 操作 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
              {title || 'AI 设备故障预测'}
            </h3>
            {actionableIds.length > 0 && onScheduleMaintenance && (
              <button
                data-testid={`${testId}-schedule-all`}
                onClick={() => onScheduleMaintenance(actionableIds)}
                style={{
                  padding: '4px 12px',
                  fontSize: 13,
                  borderRadius: 4,
                  border: '1px solid #d1d5db',
                  background: '#fff',
                  cursor: 'pointer',
                }}
              >
                一键安排维护 ({actionableIds.length})
              </button>
            )}
          </div>

          {/* 汇总卡片 */}
          {summary && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <SummaryItem label="总设备" value={summary.totalDevices} />
              <SummaryItem label="高危" value={summary.criticalCount} color="#ef4444" />
              <SummaryItem label="待维护" value={summary.pendingCount} color="#f97316" />
              <SummaryItem label="本月预测" value={summary.predictedThisMonth} color="#eab308" />
              <SummaryItem label="平均健康分" value={summary.avgHealthScore} suffix="分" color="#22c55e" />
            </div>
          )}

          {/* 告警横幅 (高危) */}
          {criticalPredictions.length > 0 && (
            <div
              data-testid={`${testId}-alert-banner`}
              style={{
                padding: '8px 12px',
                marginBottom: 12,
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 6,
                color: '#991b1b',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 16 }}>⚠️</span>
              <span>发现 <strong>{criticalPredictions.length}</strong> 条高危/紧急设备故障预测，请尽快处理</span>
            </div>
          )}

          {/* 预测列表 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sorted.map((prediction, idx) => (
              <PredictionRow
                key={`${prediction.deviceId}-${idx}`}
                prediction={prediction}
                onClick={onPredictionClick}
                onResolve={onResolve}
                testId={testId}
              />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ==================== 子组件 ====================

/** 汇总单项 */
function SummaryItem({
  label,
  value,
  color,
  suffix = '',
}: {
  label: string;
  value: number;
  color?: string;
  suffix?: string;
}) {
  return (
    <div style={{
      flex: '1 0 100px',
      padding: '8px 12px',
      background: '#f9fafb',
      borderRadius: 6,
      border: '1px solid #f3f4f6',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: color || '#111827' }}>
        {value}{suffix}
      </div>
    </div>
  );
}

/** 预测行 */
function PredictionRow({
  prediction,
  onClick,
  onResolve,
  testId,
}: {
  prediction: DeviceFaultPrediction;
  onClick?: (p: DeviceFaultPrediction) => void;
  onResolve?: (deviceId: string) => void;
  testId: string;
}) {
  const sev = SEVERITY_CONFIG[prediction.severity];
  const st = STATUS_CONFIG[prediction.status];
  const clickable = !!onClick;

  return (
    <div
      data-testid={`${testId}-prediction-${prediction.deviceId}`}
      onClick={() => onClick?.(prediction)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        background: '#fff',
        border: '1px solid #f3f4f6',
        borderRadius: 6,
        cursor: clickable ? 'pointer' : 'default',
        transition: 'box-shadow 0.15s',
        flexWrap: 'wrap',
      }}
      onMouseEnter={e => { if (clickable) e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'; }}
      onMouseLeave={e => { if (clickable) e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* 设备信息 */}
      <div style={{ flex: '1 1 180px', minWidth: 120 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{prediction.deviceName}</div>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
          {CATEGORY_LABELS[prediction.category]} · {prediction.deviceId}
        </div>
      </div>

      {/* 故障预测 */}
      <div style={{ flex: '1 1 160px', minWidth: 100 }}>
        <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{prediction.predictedFault}</div>
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
          预计 {prediction.estimatedDate}
          {prediction.lastMaintenanceDate && ` · 上次维护 ${prediction.lastMaintenanceDate}`}
        </div>
      </div>

      {/* 概率条 */}
      <div style={{ width: 120 }}>
        <ProbabilityBar value={prediction.probability} />
      </div>

      {/* 健康分 */}
      {prediction.healthScore !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <HealthRing score={prediction.healthScore} />
        </div>
      )}

      {/* 状态 Badge */}
      <div style={{ width: 64, textAlign: 'center' }}>
        <StatusBadge variant={sev.variant} label={sev.label} />
      </div>
      <div style={{ width: 64, textAlign: 'center' }}>
        <StatusBadge variant={st.variant} label={st.label} />
      </div>

      {/* 操作 */}
      {(prediction.status === 'predicted' || prediction.status === 'monitoring') && onResolve && (
        <button
          data-testid={`${testId}-resolve-${prediction.deviceId}`}
          onClick={(e) => { e.stopPropagation(); onResolve(prediction.deviceId); }}
          style={{
            padding: '2px 8px',
            fontSize: 12,
            borderRadius: 4,
            border: '1px solid #d1d5db',
            background: '#fff',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          标记处理
        </button>
      )}
    </div>
  );
}
