/**
 * MemberActivityCard — 会员活动卡片组件
 *
 * 用于展示会员的最近活动记录，如消费、充值、积分变动等。
 * 支持多种活动类型、自定义图标和交互回调。
 *
 * Pattern: 纯展示组件，无外部依赖，支持 .test.tsx 测试
 */

import React from 'react';

export type ActivityType =
  | 'purchase'
  | 'recharge'
  | 'redeem'
  | 'visit'
  | 'review'
  | 'register'
  | 'upgrade'
  | 'referral';

export interface MemberActivity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  amount?: number;
  points?: number;
  createdAt: string;
  metadata?: Record<string, string>;
}

export interface MemberActivityCardProps {
  activity: MemberActivity;
  onClick?: (activity: MemberActivity) => void;
  compact?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const ACTIVITY_ICONS: Record<ActivityType, string> = {
  purchase: '🛒',
  recharge: '💰',
  redeem: '🎁',
  visit: '🚪',
  review: '⭐',
  register: '📝',
  upgrade: '⬆️',
  referral: '👥',
};

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  purchase: '消费',
  recharge: '充值',
  redeem: '兑换',
  visit: '到店',
  review: '评价',
  register: '注册',
  upgrade: '升级',
  referral: '推荐',
};

const AMOUNT_TYPES: Set<ActivityType> = new Set(['purchase', 'recharge']);
const POINTS_TYPES: Set<ActivityType> = new Set(['redeem', 'visit', 'review', 'register', 'upgrade', 'referral']);

function formatAmount(amount: number): string {
  if (amount >= 10000) return `¥${(amount / 10000).toFixed(1)}万`;
  return `¥${amount.toFixed(2)}`;
}

function formatPoints(points: number): string {
  return points > 0 ? `+${points}` : `${points}`;
}

export function MemberActivityCard({
  activity,
  onClick,
  compact = false,
  className,
  style,
}: MemberActivityCardProps) {
  const icon = ACTIVITY_ICONS[activity.type];
  const label = ACTIVITY_LABELS[activity.type];

  const handleClick = () => {
    onClick?.(activity);
  };

  return (
    <div
      data-testid={`member-activity-${activity.id}`}
      data-activity-type={activity.type}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); } : undefined}
      className={className}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: compact ? 8 : 12,
        padding: compact ? '8px 12px' : '12px 16px',
        background: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 8,
        border: '1px solid rgba(148, 163, 184, 0.1)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background 0.15s',
        ...style,
      }}
    >
      {/* 图标 */}
      <div
        style={{
          width: compact ? 28 : 36,
          height: compact ? 28 : 36,
          borderRadius: '50%',
          background: 'rgba(24, 144, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: compact ? 12 : 16,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      {/* 内容 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 2,
          }}
        >
          <span
            style={{
              fontSize: compact ? 12 : 14,
              fontWeight: 600,
              color: '#e2e8f0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {activity.title}
          </span>
          {activity.amount !== undefined && AMOUNT_TYPES.has(activity.type) && (
            <span
              data-testid={`activity-${activity.id}-amount`}
              style={{
                fontSize: compact ? 12 : 14,
                fontWeight: 700,
                color: activity.type === 'recharge' ? '#52c41a' : '#ff4d4f',
                whiteSpace: 'nowrap',
                marginLeft: 8,
              }}
            >
              {formatAmount(activity.amount)}
            </span>
          )}
        </div>

        <div
          style={{
            fontSize: compact ? 11 : 12,
            color: '#94a3b8',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: compact ? 'nowrap' : undefined,
            display: '-webkit-box',
            WebkitLineClamp: compact ? undefined : 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {activity.description}
        </div>

        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            marginTop: 4,
            fontSize: 11,
            color: '#64748b',
          }}
        >
          <span data-testid={`activity-${activity.id}-label`}>
            {label}
          </span>
          {activity.points !== undefined && POINTS_TYPES.has(activity.type) && (
            <span
              data-testid={`activity-${activity.id}-points`}
              style={{
                color: '#f59e0b',
                fontWeight: 600,
              }}
            >
              {formatPoints(activity.points)} 积分
            </span>
          )}
          <span>{activity.createdAt}</span>
        </div>
      </div>
    </div>
  );
}
