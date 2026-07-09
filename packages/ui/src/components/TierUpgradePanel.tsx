'use client';

import React from 'react';

export interface TierInfo {
  /** Tier name, e.g. "黄金会员" */
  name: string;
  /** Tier color hex */
  color: string;
  /** Minimum points/spend required */
  threshold: number;
}

export interface TierUpgradePanelProps {
  /** Current tier info */
  currentTier: TierInfo;
  /** Next tier info (null if already max tier) */
  nextTier: TierInfo | null;
  /** User's current accumulated value (points / spend) */
  currentValue: number;
  /** Unit label e.g. "积分" / "元" */
  unit?: string;
  /** Estimated remaining days to upgrade */
  estimatedDays?: number;
  /** Whether progress is based on spend vs points */
  metric?: 'points' | 'spend';
  /** Card variant */
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost';
  /** Extra style */
  style?: React.CSSProperties;
  /** Test id */
  'data-testid'?: string;
}

const CARD_STYLES: Record<string, React.CSSProperties> = {
  default: {
    background: 'rgba(15, 23, 42, 0.35)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
  },
  elevated: {
    background: 'rgba(15, 23, 42, 0.5)',
    border: '1px solid rgba(148, 163, 184, 0.16)',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.25)',
  },
  outlined: {
    background: 'transparent',
    border: '1px solid rgba(148, 163, 184, 0.2)',
  },
  ghost: {
    background: 'transparent',
    border: 'none',
  },
};

function formatNumber(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n.toLocaleString();
}

/**
 * TierUpgradePanel — 会员等级升级进度面板
 *
 * Shows current tier, progress toward next tier, and estimated time to upgrade.
 * Commonly used in member profile / storefront dashboards.
 */
export function TierUpgradePanel({
  currentTier,
  nextTier,
  currentValue,
  unit = '积分',
  estimatedDays,
  metric = 'points',
  variant = 'default',
  style,
  'data-testid': dataTestId,
}: TierUpgradePanelProps) {
  const cardStyle = CARD_STYLES[variant] ?? CARD_STYLES.default;

  const isMaxLevel = nextTier === null;
  const progress = isMaxLevel
    ? 100
    : Math.min(100, Math.round((currentValue / nextTier.threshold) * 100));
  const remaining = isMaxLevel ? 0 : Math.max(0, nextTier.threshold - currentValue);

  return (
    <div
      data-testid={dataTestId}
      style={{
        borderRadius: 16,
        padding: 20,
        ...cardStyle,
        ...style,
      }}
    >
      {/* Header */}
      <div style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', marginBottom: 12 }}>
        会员等级
      </div>

      {/* Current tier badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div
          data-testid="tier-current-badge"
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: currentTier.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 800,
            color: '#fff',
          }}
        >
          {currentTier.name.charAt(0)}
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>
            {currentTier.name}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            {formatNumber(currentValue)} {unit}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {!isMaxLevel && nextTier ? (
        <div data-testid="tier-upgrade-progress" style={{ marginBottom: 12 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12,
              color: '#94a3b8',
              marginBottom: 6,
            }}
          >
            <span>升级进度</span>
            <span>{progress}%</span>
          </div>
          <div
            style={{
              height: 8,
              borderRadius: 4,
              background: 'rgba(148, 163, 184, 0.15)',
              overflow: 'hidden',
            }}
          >
            <div
              data-testid="tier-progress-bar"
              style={{
                height: '100%',
                borderRadius: 4,
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${currentTier.color}, ${nextTier.color})`,
                transition: 'width 0.6s ease',
              }}
            />
          </div>
        </div>
      ) : null}

      {/* Next tier info */}
      {isMaxLevel ? (
        <div
          data-testid="tier-max-level"
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.25)',
            color: '#4ade80',
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          已达最高等级 🎉
        </div>
      ) : nextTier ? (
        <div data-testid="tier-next-info" style={{ marginBottom: 12 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 10,
              background: 'rgba(148, 163, 184, 0.08)',
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: nextTier.color,
                flexShrink: 0,
              }}
            />
            <div>
              <span style={{ fontSize: 13, color: '#cbd5e1' }}>
                距 <strong style={{ color: nextTier.color }}>{nextTier.name}</strong>
              </span>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                还需 {formatNumber(remaining)} {unit}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Estimated time */}
      {estimatedDays !== undefined && !isMaxLevel ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: '#64748b',
          }}
        >
          <span>📅</span>
          <span>
            预计升级时间：约 <strong style={{ color: '#f8fafc' }}>{estimatedDays}</strong> 天后
          </span>
        </div>
      ) : null}
    </div>
  );
}
