'use client';

import React from 'react';

// ==================== 类型定义 ====================

/** 会员分群基础信息 */
export interface MemberSegment {
  /** 分群 ID */
  id: string;
  /** 分群名称 */
  name: string;
  /** 分群描述 */
  description: string;
  /** 会员数量 */
  memberCount: number;
  /** 占比 (0-1) */
  percentage: number;
  /** 月均消费 */
  avgMonthlySpend: number;
  /** 月均到店次数 */
  avgMonthlyVisits: number;
  /** 同期增长 (+百分比) */
  growthRate: number;
  /** 分群颜色 (用于可视化) */
  color: string;
  /** 代表图标 emoji */
  icon: string;
}

/** 分群分析统计 */
export interface SegmentAnalysis {
  /** 会员总数 */
  totalMembers: number;
  /** 活跃会员数 (近30天有消费) */
  activeMembers: number;
  /** 活跃率 */
  activeRate: number;
  /** 高价值分群数量 (月均消费 > 阈值) */
  highValueCount: number;
  /** 待激活分群数量 (睡眠会员 > 30天未到店) */
  dormantCount: number;
}

/** AI 会员分群面板 Props */
export interface AIMemberSegmentationPanelProps {
  /** 分群列表 */
  segments: MemberSegment[];
  /** 分析概览统计 */
  analysis?: SegmentAnalysis;
  /** 面板标题 */
  title?: string;
  /** 空状态文案 */
  emptyText?: string;
  /** 分群点击回调 */
  onSegmentClick?: (segment: MemberSegment) => void;
  /** 查看详情回调 */
  onViewDetails?: (segmentId: string) => void;
  /** 自定义类名 */
  className?: string;
  /** 数据测试 ID */
  'data-testid'?: string;
}

// ==================== 常量 ====================

const SEGMENT_CARD_STYLES: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: 16,
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.08)',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const STAT_LABEL_STYLES: React.CSSProperties = {
  fontSize: 12,
  color: 'rgba(255,255,255,0.5)',
};

const STAT_VALUE_STYLES: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: 'rgba(255,255,255,0.9)',
};

const BADGE_GREEN = '#22c55e';
const BADGE_AMBER = '#f59e0b';
const BADGE_RED = '#ef4444';

function formatCurrency(value: number): string {
  return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(1)}%`;
}

// ==================== 统计概览栏 ====================

function AnalysisOverview({ analysis }: { analysis: SegmentAnalysis }) {
  const items = [
    { label: '总会员', value: analysis.totalMembers.toLocaleString(), color: BADGE_GREEN },
    { label: '活跃会员', value: analysis.activeMembers.toLocaleString(), color: BADGE_GREEN },
    { label: '活跃率', value: `${(analysis.activeRate * 100).toFixed(1)}%`, color: BADGE_AMBER },
    { label: '高价值群', value: String(analysis.highValueCount), color: BADGE_GREEN },
    { label: '待激活群', value: String(analysis.dormantCount), color: BADGE_RED },
  ];

  return (
    <div
      style={{
        display: 'flex',
        gap: 24,
        padding: '16px 20px',
        borderRadius: 12,
        background: 'rgba(255,255,255,0.04)',
        flexWrap: 'wrap',
      }}
    >
      {items.map((item) => (
        <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
            {item.label}
          </span>
          <span style={{ fontSize: 20, fontWeight: 700, color: item.color }}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ==================== 单条分群卡片 ====================

function SegmentCard({
  segment,
  onSegmentClick,
  onViewDetails,
}: {
  segment: MemberSegment;
  onSegmentClick?: (segment: MemberSegment) => void;
  onViewDetails?: (segmentId: string) => void;
}) {
  const growthColor = segment.growthRate >= 0 ? BADGE_GREEN : BADGE_RED;

  return (
    <div
      style={{
        ...SEGMENT_CARD_STYLES,
        background: 'rgba(255,255,255,0.04)',
      }}
      onClick={() => onSegmentClick?.(segment)}
      data-testid={`segment-card-${segment.id}`}
    >
      {/* 头部: 图标 + 名称 + 增长 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>{segment.icon}</span>
          <div>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
              {segment.name}
            </span>
            <span
              style={{
                fontSize: 11,
                color: growthColor,
                fontWeight: 600,
                marginLeft: 8,
              }}
            >
              {formatPercent(segment.growthRate)}
            </span>
          </div>
        </div>
        {onViewDetails && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(segment.id);
            }}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              borderRadius: 6,
              padding: '4px 12px',
              color: 'rgba(255,255,255,0.6)',
              fontSize: 12,
              cursor: 'pointer',
            }}
            data-testid={`view-details-${segment.id}`}
          >
            详情 →
          </button>
        )}
      </div>

      {/* 描述 */}
      {segment.description && (
        <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>
          {segment.description}
        </p>
      )}

      {/* 指标行 */}
      <div style={{ display: 'flex', gap: 24, marginTop: 4 }}>
        <div>
          <div style={STAT_LABEL_STYLES}>会员数</div>
          <div style={STAT_VALUE_STYLES}>{segment.memberCount.toLocaleString()}</div>
        </div>
        <div>
          <div style={STAT_LABEL_STYLES}>月均消费</div>
          <div style={STAT_VALUE_STYLES}>{formatCurrency(segment.avgMonthlySpend)}</div>
        </div>
        <div>
          <div style={STAT_LABEL_STYLES}>月均到店</div>
          <div style={STAT_VALUE_STYLES}>{segment.avgMonthlyVisits}次</div>
        </div>
        <div>
          <div style={STAT_LABEL_STYLES}>占比</div>
          <div style={STAT_VALUE_STYLES}>{(segment.percentage * 100).toFixed(0)}%</div>
        </div>
      </div>

      {/* 进度条 */}
      <div
        style={{
          height: 4,
          borderRadius: 2,
          background: 'rgba(255,255,255,0.08)',
          overflow: 'hidden',
          marginTop: 4,
        }}
      >
        <div
          style={{
            width: `${segment.percentage * 100}%`,
            height: '100%',
            background: segment.color,
            borderRadius: 2,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}

// ==================== 主面板 ====================

/**
 * AIMemberSegmentationPanel — AI 会员分群分析面板 (C类-AI前端组件)
 *
 * 店长/运营视角: 自动将会员分为多个群体，展示各群体核心指标与增长趋势。
 * 帮助运营团队快速识别高价值群体和睡眠会员，制定精准营销策略。
 *
 * @example
 * <AIMemberSegmentationPanel
 *   segments={segments}
 *   analysis={analysis}
 *   onSegmentClick={(seg) => console.log(seg)}
 * />
 */
export function AIMemberSegmentationPanel({
  segments,
  analysis,
  title = 'AI 会员分群分析',
  emptyText = '暂无分群数据',
  onSegmentClick,
  onViewDetails,
  className,
  'data-testid': dataTestId = 'ai-member-segmentation-panel',
}: AIMemberSegmentationPanelProps) {
  // ── 空状态 ──
  if (!segments || segments.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 48,
          color: 'rgba(255,255,255,0.4)',
        }}
        data-testid={dataTestId}
      >
        <span style={{ fontSize: 48, marginBottom: 12 }}>📊</span>
        <span style={{ fontSize: 15 }}>{emptyText}</span>
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        width: '100%',
      }}
      data-testid={dataTestId}
    >
      {/* 标题 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
          {title}
        </h3>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          {segments.length} 个分群 · {segments.reduce((s, g) => s + g.memberCount, 0).toLocaleString()} 会员
        </span>
      </div>

      {/* 统计概览 */}
      {analysis && <AnalysisOverview analysis={analysis} />}

      {/* 分群列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {segments.map((segment) => (
          <SegmentCard
            key={segment.id}
            segment={segment}
            onSegmentClick={onSegmentClick}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    </div>
  );
}
