'use client';

import React from 'react';
import { QuickStats } from './QuickStats';
import type { QuickStatItem } from './QuickStats';
import { StatusBadge } from './StatusBadge';
import { DataTable } from './DataTable';
import type { DataTableColumn } from './DataTable';

// ---- 类型定义 ----

/** 今日接待指标 */
export interface CoachDailyMetrics {
  /** 接待人次 */
  servedCount: number;
  /** 新增会员 */
  newMembers: number;
  /** 推广转化数 (裂变/分享) */
  promoConversions: number;
  /** 跟进回访数 */
  followUps: number;
  /** 同比变化 */
  servedTrend: number;
  memberTrend: number;
  promoTrend: number;
  followUpTrend: number;
}

/** 待跟进会员 */
export interface FollowUpMember {
  id: string;
  name: string;
  /** 会员等级 */
  tier: string;
  /** 上次互动时间 */
  lastContactAt: string;
  /** 跟进状态 */
  status: 'pending' | 'contacted' | 'converted' | 'lost';
  /** 跟进事项 */
  note?: string;
  phone?: string;
}

/** 推广活动任务 */
export interface PromoTask {
  id: string;
  title: string;
  /** 活动类型 */
  type: 'share' | 'referral' | 'event' | 'coupon';
  /** 目标 */
  target: number;
  /** 已完成 */
  completed: number;
  deadline: string;
}

/** 教练工作台 Props */
export interface CoachDashboardProps {
  /** 今日接待指标 */
  dailyMetrics?: CoachDailyMetrics;
  /** 待跟进会员 */
  followUpMembers?: FollowUpMember[];
  /** 推广任务 */
  promoTasks?: PromoTask[];
  /** 教练姓名 */
  coachName?: string;
  /** 门店名称 */
  storeName?: string;
  /** 工号 */
  employeeId?: string;
  /** 本月业绩排名 */
  rank?: { current: number; total: number };
  /** 最后同步时间 */
  lastSyncAt?: string;
  /** 加载中 */
  loading?: boolean;
  /** 紧凑模式 (移动/PAD 适配) */
  compact?: boolean;
  /** 自定义类名 */
  className?: string;
}

// ---- 默认样式常量 ----

const SECTION_STYLE: React.CSSProperties = {
  marginBottom: 24,
};

const SECTION_HEADER_STYLE: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 14,
};

const SECTION_TITLE_STYLE: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: '#f1f5f9',
};

const CARD_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  borderRadius: 10,
  background: 'rgba(15,23,42,0.28)',
  border: '1px solid rgba(148,163,184,0.10)',
  marginBottom: 8,
};

const HEADER_WRAPPER_STYLE: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 18,
  flexWrap: 'wrap' as const,
  gap: 10,
};

const EMPHASIS_STYLE: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: '#f8fafc',
};

const MUTED_STYLE: React.CSSProperties = {
  fontSize: 11,
  color: '#64748b',
};

const STATUS_MAP: Record<FollowUpMember['status'], { label: string; variant: 'warning' | 'success' | 'neutral' | 'error' }> = {
  pending: { label: '待跟进', variant: 'warning' },
  contacted: { label: '已联系', variant: 'success' },
  converted: { label: '已转化', variant: 'neutral' },
  lost: { label: '已流失', variant: 'error' },
};

const PROMO_TYPE_MAP: Record<PromoTask['type'], string> = {
  share: '分享',
  referral: '裂变',
  event: '活动',
  coupon: '券推广',
};

// ---- 工具函数 ----

function fmtCurrency(value: number): string {
  if (Math.abs(value) >= 10000) {
    return (value / 10000).toFixed(1) + '万';
  }
  return value.toLocaleString('zh-CN');
}

function fmtTrend(delta: number): string {
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}%`;
}

function promoProgressBar(completed: number, target: number): React.ReactNode {
  const pct = target > 0 ? Math.min((completed / target) * 100, 100) : 0;
  return (
    <div
      style={{
        width: 80,
        height: 6,
        borderRadius: 3,
        background: 'rgba(148,163,184,0.15)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          borderRadius: 3,
          background: pct >= 100 ? '#4ade80' : '#60a5fa',
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  );
}

// ---- 列配置 ----

const FOLLOW_UP_COLUMNS: DataTableColumn<FollowUpMember>[] = [
  {
    key: 'name',
    header: '会员',
    width: '100px',
    render: (row) => (
      <div>
        <div style={{ fontSize: 13, color: '#e2e8f0' }}>{row.name}</div>
        {row.phone && <div style={{ fontSize: 11, color: '#475569' }}>{row.phone}</div>}
      </div>
    ),
  },
  {
    key: 'tier',
    header: '等级',
    width: '70px',
    render: (row) => (
      <StatusBadge label={row.tier} variant="neutral" size="sm" />
    ),
  },
  {
    key: 'status',
    header: '状态',
    width: '80px',
    render: (row) => {
      const m = STATUS_MAP[row.status];
      return <StatusBadge label={m.label} variant={m.variant} size="sm" />;
    },
  },
  {
    key: 'lastContactAt',
    header: '上次联系',
    width: '80px',
    render: (row) => (
      <span style={{ fontSize: 11, color: '#64748b' }}>{row.lastContactAt}</span>
    ),
  },
  {
    key: 'note',
    header: '备注',
    width: '120px',
    render: (row) => (
      <span style={{ fontSize: 12, color: '#94a3b8' }}>{row.note ?? '--'}</span>
    ),
  },
];

// ---- 主组件 ----

/**
 * CoachDashboard — 教练工作台 (导玩员)
 *
 * 面向 PAD 端教练角色，聚合会员接待、推广转化与跟进任务。
 * 适用于娱乐场馆 / 电玩城 / 运动场馆的导玩员日常运营。
 *
 * @example
 * <CoachDashboard
 *   coachName="张教练"
 *   storeName="朝阳旗舰店"
 *   dailyMetrics={{ servedCount: 68, newMembers: 12, promoConversions: 23, followUps: 8, servedTrend: 5.2, memberTrend: 8.0, promoTrend: 12.3, followUpTrend: -2.1 }}
 *   followUpMembers={[{ id: '1', name: '王小明', tier: 'GOLD', lastContactAt: '06-25', status: 'pending' }]}
 *   promoTasks={[{ id: 'p1', title: '扫码分享有礼', type: 'share', target: 50, completed: 32, deadline: '06-30' }]}
 *   rank={{ current: 3, total: 12 }}
 * />
 */
export function CoachDashboard({
  dailyMetrics,
  followUpMembers,
  promoTasks,
  coachName,
  storeName,
  employeeId,
  rank,
  lastSyncAt,
  loading = false,
  compact = false,
  className,
}: CoachDashboardProps) {
  if (loading) {
    return (
      <div className={className} style={{ padding: 24 }} data-testid="coachdashboard-loading">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: compact ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: 14,
            marginBottom: 24,
          }}
        >
          {Array.from({ length: compact ? 2 : 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 88,
                borderRadius: 12,
                background: 'rgba(15,23,42,0.3)',
                border: '1px solid rgba(148,163,184,0.08)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
        <div style={{ textAlign: 'center', color: '#64748b', fontSize: 13 }}>
          正在加载教练工作台数据...
        </div>
      </div>
    );
  }

  // ---- 统计数据 ----

  const metricItems: QuickStatItem[] = dailyMetrics
    ? [
        {
          label: '接待人次',
          value: dailyMetrics.servedCount,
          helper: `同比 ${fmtTrend(dailyMetrics.servedTrend)}`,
          valueColor: dailyMetrics.servedTrend >= 0 ? '#4ade80' : '#f87171',
        },
        {
          label: '新增会员',
          value: dailyMetrics.newMembers,
          helper: `同比 ${fmtTrend(dailyMetrics.memberTrend)}`,
          valueColor: dailyMetrics.memberTrend >= 0 ? '#4ade80' : '#f87171',
        },
        {
          label: '推广转化',
          value: dailyMetrics.promoConversions,
          helper: `同比 ${fmtTrend(dailyMetrics.promoTrend)}`,
          valueColor: dailyMetrics.promoTrend >= 0 ? '#4ade80' : '#f87171',
        },
        {
          label: '跟进回访',
          value: dailyMetrics.followUps,
          helper: `同比 ${fmtTrend(dailyMetrics.followUpTrend)}`,
          valueColor: dailyMetrics.followUpTrend >= 0 ? '#4ade80' : '#f87171',
        },
      ]
    : [
        { label: '接待', value: '--' },
        { label: '新会员', value: '--' },
        { label: '推广', value: '--' },
        { label: '回访', value: '--' },
      ];

  // ---- 个人信息条 ----

  const renderProfileBar = () => {
    if (!coachName && !storeName && !employeeId) return null;
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '14px 18px',
          borderRadius: 10,
          background: 'rgba(15,23,42,0.28)',
          border: '1px solid rgba(148,163,184,0.10)',
          marginBottom: 20,
          flexWrap: 'wrap' as const,
        }}
      >
        {coachName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #60a5fa, #818cf8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 700,
                color: '#fff',
              }}
            >
              {coachName.charAt(0)}
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc' }}>
              {coachName}
            </span>
          </div>
        )}
        {storeName && (
          <span style={{ fontSize: 12, color: '#94a3b8' }}>
            📍 {storeName}
          </span>
        )}
        {employeeId && (
          <span style={{ fontSize: 11, color: '#475569' }}>
            工号 {employeeId}
          </span>
        )}
        {rank && (
          <span style={{ fontSize: 12, color: '#fbbf24', marginLeft: 'auto' }}>
            🏆 本月排名 {rank.current}/{rank.total}
          </span>
        )}
        {lastSyncAt && (
          <span style={{ fontSize: 11, color: '#475569', marginLeft: rank ? 0 : 'auto' }}>
            同步: {lastSyncAt}
          </span>
        )}
      </div>
    );
  };

  // ---- 推广任务 ----

  const renderPromoTasks = () => {
    if (!promoTasks || promoTasks.length === 0) {
      return (
        <div style={{ padding: '24px 0', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
          暂无推广任务
        </div>
      );
    }

    return (
      <div>
        {promoTasks.map((task) => (
          <div key={task.id} style={CARD_STYLE}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>
                [{PROMO_TYPE_MAP[task.type]}]
              </span>
              <span style={EMPHASIS_STYLE}>{task.title}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {promoProgressBar(task.completed, task.target)}
              <span style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' as const }}>
                {task.completed}/{task.target}
              </span>
              <span style={{ fontSize: 11, color: '#475569', whiteSpace: 'nowrap' as const }}>
                截止 {task.deadline}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ---- 待跟进会员 ----

  const renderFollowUpMembers = () => {
    if (!followUpMembers || followUpMembers.length === 0) {
      return (
        <div style={{ padding: '24px 0', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
          暂无待跟进会员
        </div>
      );
    }

    if (compact) {
      return (
        <div>
          {followUpMembers.slice(0, 5).map((member) => {
            const sm = STATUS_MAP[member.status];
            return (
              <div key={member.id} style={CARD_STYLE}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={EMPHASIS_STYLE}>{member.name}</span>
                  <StatusBadge label={member.tier} variant="neutral" size="sm" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <StatusBadge label={sm.label} variant={sm.variant} size="sm" />
                  <span style={MUTED_STYLE}>{member.lastContactAt}</span>
                </div>
              </div>
            );
          })}
          {followUpMembers.length > 5 && (
            <div style={{ textAlign: 'center', color: '#64748b', fontSize: 12, paddingTop: 8 }}>
              ... 还有 {followUpMembers.length - 5} 位会员
            </div>
          )}
        </div>
      );
    }

    return (
      <DataTable
        columns={FOLLOW_UP_COLUMNS}
        rows={followUpMembers}
        rowKey={(member: FollowUpMember) => member.id}
        compact
        emptyText="暂无待跟进会员"
      />
    );
  };

  // ---- 组装渲染 ----

  return (
    <div
      className={className}
      style={{
        padding: compact ? 16 : 24,
        color: '#f8fafc',
      }}
      data-testid="coachdashboard-root"
    >
      {/* ---- 头部 ---- */}
      <div style={HEADER_WRAPPER_STYLE}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f8fafc' }} data-testid="coachdashboard-title">
          教练工作台
        </h2>
      </div>

      {/* ---- 个人信息 ---- */}
      {(() => {
        const bar = renderProfileBar();
        return bar !== null ? (
          <div data-testid="coachdashboard-profile">{bar}</div>
        ) : null;
      })()}

      {/* ---- 今日指标 ---- */}
      <div style={SECTION_STYLE} data-testid="coachdashboard-metrics">
        <QuickStats
          items={metricItems}
          columns={compact ? 2 : 4}
          gap={compact ? 10 : 14}
          padding={compact ? 14 : 18}
        />
      </div>

      {/* ---- 推广任务 ---- */}
      <div style={SECTION_STYLE} data-testid="coachdashboard-promo-tasks">
        <div style={SECTION_HEADER_STYLE}>
          <span style={SECTION_TITLE_STYLE}>
            推广任务
            {promoTasks && promoTasks.length > 0 && (
              <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>
                ({promoTasks.length})
              </span>
            )}
          </span>
        </div>
        {renderPromoTasks()}
      </div>

      {/* ---- 待跟进会员 ---- */}
      <div style={SECTION_STYLE} data-testid="coachdashboard-follow-up">
        <div style={SECTION_HEADER_STYLE}>
          <span style={SECTION_TITLE_STYLE}>
            待跟进会员
            {followUpMembers && followUpMembers.length > 0 && (
              <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>
                ({followUpMembers.length})
              </span>
            )}
          </span>
        </div>
        {renderFollowUpMembers()}
      </div>
    </div>
  );
}
