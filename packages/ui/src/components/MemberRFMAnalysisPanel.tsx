'use client';

import React, { useMemo } from 'react';

// ==================== 类型定义 ====================

/** 单条 RFM 记录 */
export interface RFMRecord {
  /** 会员标识 */
  id: string;
  /** 会员名称 */
  name: string;
  /** 最近一次消费分数 (1-5) */
  recency: number;
  /** 消费频率分数 (1-5) */
  frequency: number;
  /** 消费金额分数 (1-5) */
  monetary: number;
  /** 头像颜色 */
  avatarColor?: string;
}

/** 分层标签 */
export type RFMSegment =
  | '高价值'
  | '重要发展'
  | '重要保持'
  | '重要挽留'
  | '一般价值'
  | '一般发展'
  | '一般保持'
  | '流失预警';

/** 分层信息 */
export interface RFMSegmentInfo {
  label: RFMSegment;
  color: string;
  count: number;
}

/** MemberRFMAnalysisPanel Props */
export interface MemberRFMAnalysisPanelProps {
  /** RFM 数据集 */
  data: RFMRecord[];
  /** 标题 */
  title?: string;
  /** 面板高度（默认 300） */
  height?: number;
  /** 是否加载中 */
  loading?: boolean;
  /** 空态文案 */
  emptyText?: string;
  /** 显示模式：'list'（列表）| 'segment'（分层分布）| 'all'（两者，默认） */
  mode?: 'list' | 'segment' | 'all';
  /** 自定义类名 */
  className?: string;
  'data-testid'?: string;
}

// ==================== 分数颜色映射 ====================

const SCORE_COLORS: Record<number, string> = {
  1: '#ef4444',
  2: '#f97316',
  3: '#eab308',
  4: '#22c55e',
  5: '#06b6d4',
};

function scoreColor(score: number): string {
  return SCORE_COLORS[score] || '#9ca3af';
}

function scoreLabel(score: number): string {
  if (score >= 4) return '优秀';
  if (score >= 3) return '中等';
  if (score >= 2) return '偏低';
  return '较差';
}

/** 平均分带星标记 */
function AvgBadge({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1" data-testid={`rfm-avg-${label.toLowerCase()}`}>
      <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">{label}</span>
      <span
        className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ backgroundColor: scoreColor(Math.round(value)) }}
      >
        {value.toFixed(1)}
      </span>
      <span className="text-[10px] text-gray-400">
        {scoreLabel(Math.round(value))}
      </span>
    </div>
  );
}

// ==================== 分层计算 ====================

function calcSegment(r: number, f: number, m: number): RFMSegment {
  const total = r + f + m;
  if (total >= 13) return '高价值';
  if (total >= 11) return r >= 4 ? '重要发展' : '一般价值';
  if (total >= 9) return f >= 4 ? '重要保持' : '一般发展';
  if (total >= 7) return r >= 3 ? '重要挽留' : '一般保持';
  return '流失预警';
}

const SEGMENT_COLORS: Record<RFMSegment, string> = {
  '高价值': '#06b6d4',
  '重要发展': '#22c55e',
  '重要保持': '#eab308',
  '重要挽留': '#f97316',
  '一般价值': '#3b82f6',
  '一般发展': '#8b5cf6',
  '一般保持': '#ec4899',
  '流失预警': '#ef4444',
};

// ==================== 格式化数字 ====================

function fmt(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ==================== 子组件：单条RFM条形图 ====================

function RFMBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-right text-[11px] text-gray-500">{label}</span>
      <div className="relative h-4 flex-1 rounded bg-gray-100">
        <div
          className="h-full rounded transition-all duration-300"
          style={{
            width: `${(value / 5) * 100}%`,
            backgroundColor: scoreColor(value),
          }}
        />
      </div>
      <span className="w-5 text-center text-xs font-semibold" style={{ color: scoreColor(value) }}>
        {value}
      </span>
    </div>
  );
}

// ==================== 子组件：单条会员记录 ====================

function RFMRecordRow({ record, index }: { record: RFMRecord; index: number }) {
  const segment = calcSegment(record.recency, record.frequency, record.monetary);
  return (
    <div
      className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2 transition-colors hover:bg-gray-50"
      data-testid={`rfm-record-${index}`}
    >
      {/* 序号 */}
      <span className="w-5 text-center text-[11px] font-medium text-gray-400">{index + 1}</span>

      {/* 头像 */}
      <div
        className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: record.avatarColor || '#6366f1' }}
      >
        {record.name.charAt(0)}
      </div>

      {/* 名称 */}
      <span className="min-w-0 flex-1 truncate text-xs font-medium text-gray-700">{record.name}</span>

      {/* R / F / M 小条 */}
      <div className="flex w-32 flex-col gap-0.5">
        <RFMBar label="R" value={record.recency} />
        <RFMBar label="F" value={record.frequency} />
        <RFMBar label="M" value={record.monetary} />
      </div>

      {/* 总分 */}
      <div className="flex flex-col items-center gap-0.5">
        <span
          className="flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold text-white"
          style={{ backgroundColor: SEGMENT_COLORS[segment] }}
        >
          {record.recency + record.frequency + record.monetary}
        </span>
        <span className="text-[9px] text-gray-400">{segment}</span>
      </div>
    </div>
  );
}

// ==================== 分层分布图 ====================

function SegmentDistribution({ segments }: { segments: RFMSegmentInfo[] }) {
  const total = segments.reduce((s, g) => s + g.count, 0) || 1;
  return (
    <div className="space-y-2" data-testid="rfm-segment-distribution">
      {segments.map((seg) => (
        <div key={seg.label} className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: seg.color }}
          />
          <span className="w-16 text-[11px] text-gray-600">{seg.label}</span>
          <div className="relative flex-1 h-5 rounded bg-gray-100">
            <div
              className="h-full rounded transition-all"
              style={{
                width: `${(seg.count / total) * 100}%`,
                backgroundColor: seg.color,
              }}
            />
          </div>
          <span className="w-10 text-right text-[11px] font-medium text-gray-600">
            {fmt(seg.count)}
          </span>
          <span className="w-10 text-right text-[11px] text-gray-400">
            {((seg.count / total) * 100).toFixed(0)}%
          </span>
        </div>
      ))}
    </div>
  );
}

// ==================== 主组件 ====================

/**
 * MemberRFMAnalysisPanel — 会员RFM分析面板
 *
 * 展示会员最近消费时间(Recency)、消费频率(Frequency)、
 * 消费金额(Monetary)的三维评分，自动分层归类。
 * 适用角色：会员营销经理、店长、运营经理。
 */
export function MemberRFMAnalysisPanel({
  data,
  title = 'RFM 会员分析',
  height = 300,
  loading = false,
  emptyText = '暂无会员数据',
  mode = 'all',
  className = '',
  'data-testid': dataTestId = 'member-rfm-analysis',
}: MemberRFMAnalysisPanelProps) {
  // 计算平均分
  const avgR = useMemo(
    () => (data.length > 0 ? data.reduce((s, d) => s + d.recency, 0) / data.length : 0),
    [data],
  );
  const avgF = useMemo(
    () => (data.length > 0 ? data.reduce((s, d) => s + d.frequency, 0) / data.length : 0),
    [data],
  );
  const avgM = useMemo(
    () => (data.length > 0 ? data.reduce((s, d) => s + d.monetary, 0) / data.length : 0),
    [data],
  );

  // 分层统计
  const segments = useMemo<RFMSegmentInfo[]>(() => {
    const map = new Map<RFMSegment, number>();
    for (const d of data) {
      const seg = calcSegment(d.recency, d.frequency, d.monetary);
      map.set(seg, (map.get(seg) || 0) + 1);
    }
    const order: RFMSegment[] = [
      '高价值', '重要发展', '重要保持', '重要挽留',
      '一般价值', '一般发展', '一般保持', '流失预警',
    ];
    return order
      .filter((k) => map.has(k))
      .map((k) => ({ label: k, color: SEGMENT_COLORS[k], count: map.get(k)! }));
  }, [data]);

  // 按总分排序
  const sorted = useMemo(
    () => [...data].sort((a, b) => b.recency + b.frequency + b.monetary - (a.recency + a.frequency + a.monetary)),
    [data],
  );

  // ============== 加载态 ==============
  if (loading) {
    return (
      <div
        className={`rounded-lg border border-gray-200 bg-white p-4 ${className}`}
        data-testid={dataTestId}
      >
        <div className="mb-3 h-5 w-28 animate-pulse rounded bg-gray-200" />
        <div className="flex items-center justify-center" style={{ height: height - 50 }}>
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  // ============== 空态 ==============
  if (!data || data.length === 0) {
    return (
      <div
        className={`rounded-lg border border-gray-200 bg-white p-4 ${className}`}
        data-testid={dataTestId}
      >
        <h3 className="mb-3 text-sm font-semibold text-gray-700">{title}</h3>
        <div
          className="flex items-center justify-center text-sm text-gray-400"
          style={{ height: height - 50 }}
        >
          {emptyText}
        </div>
      </div>
    );
  }

  // ============== 正常渲染 ==============
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white p-4 ${className}`}
      data-testid={dataTestId}
    >
      {/* 标题 */}
      <h3 className="mb-3 text-sm font-semibold text-gray-700">{title}</h3>

      {/* 平均分概览 */}
      <div className="mb-4 flex items-center justify-center gap-6 rounded-lg bg-gray-50 p-3">
        <AvgBadge value={avgR} label="Recency" />
        <AvgBadge value={avgF} label="Frequency" />
        <AvgBadge value={avgM} label="Monetary" />
      </div>

      {/* 会员数 + 高价值占比 */}
      <div className="mb-3 flex gap-4 text-[11px] text-gray-500">
        <span>会员总数：<strong>{fmt(data.length)}</strong></span>
        {segments.length > 0 && (
          <span>
            高价值会员占比：
            <strong style={{ color: SEGMENT_COLORS['高价值'] }}>
              {((segments.find((s) => s.label === '高价值')?.count || 0) / data.length * 100).toFixed(0)}%
            </strong>
          </span>
        )}
      </div>

      {/* 分层分布 */}
      {(mode === 'segment' || mode === 'all') && (
        <div className="mb-4">
          <h4 className="mb-2 text-xs font-semibold text-gray-600">会员分层分布</h4>
          <SegmentDistribution segments={segments} />
        </div>
      )}

      {/* 会员列表 */}
      {(mode === 'list' || mode === 'all') && (
        <div>
          <h4 className="mb-2 text-xs font-semibold text-gray-600">
            会员 RFM 排名
            <span className="ml-2 font-normal text-gray-400">({fmt(data.length)} 人)</span>
          </h4>
          <div className="max-h-64 space-y-1.5 overflow-y-auto">
            {sorted.map((record, idx) => (
              <RFMRecordRow key={record.id} record={record} index={idx} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
