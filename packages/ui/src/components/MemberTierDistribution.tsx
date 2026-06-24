'use client';

import React from 'react';
import { Chart, ChartDataPoint } from './Chart';

// ==================== 类型定义 ====================

/** 会员等级信息 */
export interface MemberTier {
  /** 等级名称 */
  tier: string;
  /** 等级标识（如 Gold/Silver） */
  key: string;
  /** 人数 */
  count: number;
  /** 环比增长率 (0.1 = +10%) */
  growth?: number;
  /** 等级颜色 */
  color?: string;
  /** 等级图标 */
  icon?: string;
}

/** 会员等级分布组件 Props */
export interface MemberTierDistributionProps {
  /** 等级数据 */
  tiers: MemberTier[];
  /** 图表宽度 */
  width?: number;
  /** 图表高度 */
  height?: number;
  /** 标题 */
  title?: string;
  /** 是否显示总数 */
  showTotal?: boolean;
  /** 是否显示趋势箭头 */
  showTrends?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 空状态文案 */
  emptyText?: string;
  /** 点击等级回调 */
  onTierClick?: (tier: MemberTier) => void;
}

// ==================== 默认等级调色板 ====================

const TIER_PALETTE: Record<string, string> = {
  diamond: '#7c3aed',   // 钻石 - 紫
  gold: '#f59e0b',       // 黄金 - 琥珀
  silver: '#94a3b8',     // 白银 - 灰
  bronze: '#d97706',     // 青铜 - 褐
  platinum: '#06b6d4',   // 铂金 - 青
  regular: '#64748b',    // 普通 - 石板
  vip: '#ef4444',        // VIP - 红
  svip: '#8b5cf6',       // SVIP - 紫罗兰
};

const FALLBACK_PALETTE = [
  '#7c3aed',
  '#f59e0b',
  '#94a3b8',
  '#d97706',
  '#06b6d4',
  '#ef4444',
  '#22c55e',
  '#ec4899',
];

// ==================== 默认等级图标 ====================

const TIER_ICONS: Record<string, string> = {
  diamond: '💎',
  gold: '🥇',
  silver: '🥈',
  bronze: '🥉',
  platinum: '💠',
  regular: '👤',
  vip: '⭐',
  svip: '👑',
};

// ==================== 增长趋势箭头 ====================

function GrowthArrow({ growth }: { growth?: number }) {
  if (growth == null) return null;

  const isUp = growth > 0;
  const isDown = growth < 0;
  const absPct = (Math.abs(growth) * 100).toFixed(1);

  if (!isUp && !isDown) {
    return (
      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
        → 持平
      </span>
    );
  }

  return (
    <span
      style={{
        fontSize: 11,
        color: isUp ? '#22c55e' : '#ef4444',
        fontWeight: 600,
      }}
    >
      {isUp ? '↑' : '↓'} {absPct}%
    </span>
  );
}

// ==================== 等级列表项 ====================

function TierListItem({
  tier,
  total,
  index,
  showTrends,
  onTierClick,
}: {
  tier: MemberTier;
  total: number;
  index: number;
  showTrends: boolean;
  onTierClick?: (tier: MemberTier) => void;
}) {
  const pct = total > 0 ? ((tier.count / total) * 100).toFixed(1) : '0.0';
  const icon = tier.icon ?? TIER_ICONS[tier.key] ?? '📌';
  const color = tier.color ?? TIER_PALETTE[tier.key] ?? FALLBACK_PALETTE[index % FALLBACK_PALETTE.length]!;

  return (
    <div
      onClick={() => onTierClick?.(tier)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        borderRadius: 10,
        background: 'rgba(148, 163, 184, 0.04)',
        cursor: onTierClick ? 'pointer' : 'default',
        transition: 'background 0.2s',
      }}
      onMouseEnter={(e) => {
        if (onTierClick) {
          (e.currentTarget as HTMLElement).style.background = 'rgba(148, 163, 184, 0.10)';
        }
      }}
      onMouseLeave={(e) => {
        if (onTierClick) {
          (e.currentTarget as HTMLElement).style.background = 'rgba(148, 163, 184, 0.04)';
        }
      }}
    >
      {/* 颜色指示条 */}
      <span
        style={{
          width: 4,
          height: 28,
          borderRadius: 2,
          background: color,
          flexShrink: 0,
        }}
      />

      {/* 图标 */}
      <span style={{ fontSize: 16 }}>{icon}</span>

      {/* 等级名称 */}
      <span
        style={{
          flex: 1,
          fontSize: 13,
          fontWeight: 500,
          color: '#e2e8f0',
        }}
      >
        {tier.tier}
      </span>

      {/* 百分比 */}
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: '#94a3b8',
          minWidth: 42,
          textAlign: 'right',
        }}
      >
        {pct}%
      </span>

      {/* 人数 */}
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: '#cbd5e1',
          minWidth: 48,
          textAlign: 'right',
        }}
      >
        {tier.count.toLocaleString()}
      </span>

      {/* 趋势 */}
      {showTrends && (
        <span style={{ minWidth: 56, textAlign: 'right' }}>
          <GrowthArrow growth={tier.growth} />
        </span>
      )}
    </div>
  );
}

// ==================== 主组件 ====================

/**
 * MemberTierDistribution — 会员等级分布可视化组件。
 *
 * 使用环形图展示各等级占比，配合列表展示详细信息
 * （等级名称、人数、占比、环比增长趋势）。
 *
 * 适用于会员管理后台、运营看板等场景。
 *
 * @example
 * // 基本用法
 * <MemberTierDistribution
 *   title="会员等级分布"
 *   tiers={[
 *     { tier: '钻石会员', key: 'diamond', count: 128, growth: 0.12 },
 *     { tier: '黄金会员', key: 'gold', count: 450, growth: 0.05 },
 *     { tier: '白银会员', key: 'silver', count: 620, growth: -0.03 },
 *     { tier: '青铜会员', key: 'bronze', count: 890, growth: 0.01 },
 *   ]}
 *   showTrends
 *   onTierClick={(tier) => console.log('Clicked', tier)}
 * />
 *
 * @example
 * // 紧凑模式（不显示趋势）
 * <MemberTierDistribution
 *   tiers={[...]}
 *   showTotal={false}
 *   showTrends={false}
 * />
 */
export function MemberTierDistribution({
  tiers,
  width = 420,
  height = 260,
  title = '会员等级分布',
  showTotal = true,
  showTrends = true,
  className,
  emptyText = '暂无会员数据',
  onTierClick,
}: MemberTierDistributionProps) {
  void height;
  // ---- 空状态 ----
  if (!tiers || tiers.length === 0) {
    return (
      <div
        className={className}
        style={{
          borderRadius: 16,
          background: 'rgba(15, 23, 42, 0.38)',
          border: '1px solid rgba(148, 163, 184, 0.16)',
          padding: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 8,
          maxWidth: width,
        }}
      >
        <span style={{ fontSize: 32 }}>👥</span>
        <span style={{ fontSize: 14, color: '#64748b' }}>{emptyText}</span>
      </div>
    );
  }

  const total = tiers.reduce((sum, t) => sum + t.count, 0);

  // 构建 Chart 数据
  const chartData: ChartDataPoint[] = tiers.map((t, i) => ({
    label: t.tier,
    value: t.count,
    color: t.color ?? TIER_PALETTE[t.key] ?? FALLBACK_PALETTE[i % FALLBACK_PALETTE.length],
  }));

  const chartPalette = chartData.map((d) => d.color ?? '#64748b');

  return (
    <div
      className={className}
      style={{
        borderRadius: 16,
        background: 'rgba(15, 23, 42, 0.38)',
        border: '1px solid rgba(148, 163, 184, 0.16)',
        padding: '20px 20px 16px',
        maxWidth: width,
      }}
    >
      {/* 标题行 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: '#cbd5e1' }}>
          👥 {title}
        </span>
        {showTotal && total > 0 && (
          <span
            style={{
              fontSize: 12,
              color: '#64748b',
              background: 'rgba(148, 163, 184, 0.08)',
              padding: '3px 10px',
              borderRadius: 20,
            }}
          >
            总计 {total.toLocaleString()} 人
          </span>
        )}
      </div>

      {/* 环形图 */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
        <Chart
          type="donut"
          data={chartData}
          width={240}
          height={240}
          palette={chartPalette}
          showValues={false}
        />
      </div>

      {/* 等级列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {tiers.map((tier, index) => (
          <TierListItem
            key={tier.key}
            tier={tier}
            total={total}
            index={index}
            showTrends={showTrends}
            onTierClick={onTierClick}
          />
        ))}
      </div>
    </div>
  );
}
