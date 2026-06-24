'use client';

import React from 'react';
import { QuickStats } from './QuickStats';
import type { QuickStatItem } from './QuickStats';
import { StatusBadge } from './StatusBadge';
import { DataTable } from './DataTable';
import type { DataTableColumn } from './DataTable';
import { Tag } from './Tag';

// ---- 类型定义 ----

/** 会员服务概览 */
export interface MemberServiceOverview {
  /** 总服务次数 */
  totalServices: number;
  /** 本月新增VIP */
  newVipCount: number;
  /** 待处理咨询 */
  pendingInquiries: number;
  /** 客户满意度 (0-100) */
  satisfactionScore: number;
  /** 满意度环比变化 */
  satisfactionTrend: number;
}

/** 积分操作记录 */
export interface PointsTransaction {
  id: string;
  memberName: string;
  memberId: string;
  memberLevel: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  type: 'earn' | 'redeem' | 'adjust' | 'expire';
  points: number;
  reason: string;
  operatedBy: string;
  operatedAt: string;
}

/** 会员来访记录 */
export interface MemberVisitRecord {
  id: string;
  memberName: string;
  memberId: string;
  memberLevel: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  visitTime: string;
  purpose: string;
  durationMin: number;
  staffName: string;
  notes?: string;
}

/** 个性化推荐项 */
export interface PersonalizedRecommendation {
  id: string;
  memberId: string;
  memberName: string;
  productName: string;
  productCategory: string;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
  price?: number;
}

/** 快速服务操作 */
export interface ConciergeAction {
  key: string;
  label: string;
  icon?: string;
  primary?: boolean;
  onClick?: () => void;
}

/** 礼宾管家面板 Props */
export interface ConciergePanelProps {
  /** 会员服务概览统计 */
  overview?: MemberServiceOverview;
  /** 积分流水 */
  pointsTransactions?: PointsTransaction[];
  /** 来访记录 */
  visitRecords?: MemberVisitRecord[];
  /** 个性化推荐 */
  recommendations?: PersonalizedRecommendation[];
  /** 快速操作 */
  actions?: ConciergeAction[];
  /** 管家名称 */
  conciergeName?: string;
  /** 上次同步时间 */
  lastSyncAt?: string;
  /** 加载中 */
  loading?: boolean;
  /** 紧凑模式 */
  compact?: boolean;
  /** 自定义类名 */
  className?: string;
}

// ---- 默认样式 ----

const PANEL_STYLE: React.CSSProperties = {
  color: '#e2e8f0',
  fontFamily: 'system-ui, -apple-system, sans-serif',
};

const HEADER_STYLE: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 20,
  flexWrap: 'wrap',
  gap: 10,
};

const HEADER_TITLE_STYLE: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: '#f1f5f9',
  margin: 0,
};

const HEADER_SUBTITLE_STYLE: React.CSSProperties = {
  fontSize: 12,
  color: '#64748b',
  marginTop: 4,
};

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
  fontSize: 15,
  fontWeight: 600,
  color: '#cbd5e1',
  margin: 0,
};

const ACTIONS_BAR_STYLE: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
  marginBottom: 20,
};

const ACTION_BTN_BASE: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: 10,
  border: '1px solid rgba(148,163,184,0.18)',
  background: 'rgba(15,23,42,0.38)',
  color: '#cbd5e1',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  whiteSpace: 'nowrap',
};

const ACTION_BTN_PRIMARY: React.CSSProperties = {
  ...ACTION_BTN_BASE,
  background: 'rgba(168,85,247,0.18)',
  borderColor: 'rgba(168,85,247,0.35)',
  color: '#c4b5fd',
};

const RECOMMENDATION_CARD_STYLE: React.CSSProperties = {
  padding: '14px 16px',
  borderRadius: 10,
  background: 'rgba(15,23,42,0.28)',
  border: '1px solid rgba(148,163,184,0.10)',
  marginBottom: 8,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 8,
};

const VISIT_CARD_STYLE: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: 10,
  background: 'rgba(15,23,42,0.28)',
  border: '1px solid rgba(148,163,184,0.10)',
  marginBottom: 8,
};

const VISIT_HEADER_STYLE: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 6,
  flexWrap: 'wrap',
  gap: 6,
};

const COMPACT_GRID_STYLE: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: 16,
};

const EMPTY_STYLE: React.CSSProperties = {
  textAlign: 'center',
  padding: '28px 16px',
  color: '#64748b',
  fontSize: 13,
};

const SYNC_TEXT_STYLE: React.CSSProperties = {
  fontSize: 11,
  color: '#475569',
  marginTop: 2,
};

const LEVEL_COLORS: Record<string, string> = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  platinum: '#e5e4e2',
  diamond: '#b9f2ff',
};

// ---- 工具函数 ----

function confidenceTagVariant(c: PersonalizedRecommendation['confidence']): { label: string; variant: 'success' | 'warning' | 'default' } {
  switch (c) {
    case 'high':
      return { label: '高置信', variant: 'success' };
    case 'medium':
      return { label: '中置信', variant: 'warning' };
    case 'low':
      return { label: '低置信', variant: 'default' };
  }
}

function levelLabel(level: PointsTransaction['memberLevel']): string {
  const map: Record<string, string> = {
    bronze: '青铜',
    silver: '白银',
    gold: '黄金',
    platinum: '铂金',
    diamond: '钻石',
  };
  return map[level] ?? level;
}

function txTypeLabel(type: PointsTransaction['type']): string {
  const map: Record<string, string> = {
    earn: '获取',
    redeem: '兑换',
    adjust: '调整',
    expire: '过期',
  };
  return map[type] ?? type;
}

function txTypeVariant(type: PointsTransaction['type']): 'success' | 'error' | 'warning' | 'neutral' {
  switch (type) {
    case 'earn':
      return 'success';
    case 'redeem':
      return 'warning';
    case 'adjust':
      return 'neutral';
    case 'expire':
      return 'error';
  }
}

function fmtTime(isoString: string): string {
  const d = new Date(isoString);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${mm}-${dd} ${hh}:${mi}`;
}

function fmtCurrency(v: number): string {
  if (v >= 10000) return (v / 10000).toFixed(1) + '万';
  return v.toLocaleString('zh-CN');
}

function fmtPoints(p: number): string {
  if (p >= 10000) return (p / 10000).toFixed(1) + '万';
  return p.toLocaleString('zh-CN');
}

// ---- 列配置 ----

const TX_COLUMNS: DataTableColumn<PointsTransaction>[] = [
  {
    key: 'memberName',
    header: '会员',
    render: (row) => (
      <div>
        <div style={{ fontWeight: 500, color: '#e2e8f0' }}>{row.memberName}</div>
        <div style={{ fontSize: 11, color: '#64748b' }}>{row.memberId}</div>
      </div>
    ),
  },
  {
    key: 'memberLevel',
    header: '等级',
    render: (row) => (
      <span style={{ color: LEVEL_COLORS[row.memberLevel] ?? '#94a3b8', fontSize: 12, fontWeight: 600 }}>
        {levelLabel(row.memberLevel)}
      </span>
    ),
  },
  {
    key: 'type',
    header: '类型',
    render: (row) => <StatusBadge label={txTypeLabel(row.type)} variant={txTypeVariant(row.type)} />,
  },
  {
    key: 'points',
    header: '积分',
    render: (row) => (
      <span
        style={{
          fontWeight: 600,
          color: row.type === 'earn' ? '#4ade80' : row.type === 'expire' ? '#f87171' : '#f59e0b',
        }}
      >
        {row.type === 'earn' ? '+' : row.type === 'expire' ? '-' : ''}
        {fmtPoints(row.points)}
      </span>
    ),
  },
  { key: 'reason', header: '原因', render: (row) => <span style={{ fontSize: 12 }}>{row.reason}</span> },
  {
    key: 'operatedBy',
    header: '操作人',
    render: (row) => <span style={{ fontSize: 12 }}>{row.operatedBy}</span>,
  },
  {
    key: 'operatedAt',
    header: '时间',
    render: (row) => <span style={{ fontSize: 11, color: '#64748b' }}>{fmtTime(row.operatedAt)}</span>,
  },
];

const VISIT_COLUMNS: DataTableColumn<MemberVisitRecord>[] = [
  {
    key: 'memberName',
    header: '会员',
    render: (row) => (
      <div>
        <div style={{ fontWeight: 500, color: '#e2e8f0' }}>{row.memberName}</div>
        <div style={{ fontSize: 11, color: '#64748b' }}>{row.memberId}</div>
      </div>
    ),
  },
  {
    key: 'memberLevel',
    header: '等级',
    render: (row) => (
      <span style={{ color: LEVEL_COLORS[row.memberLevel] ?? '#94a3b8', fontSize: 12, fontWeight: 600 }}>
        {levelLabel(row.memberLevel)}
      </span>
    ),
  },
  {
    key: 'visitTime',
    header: '到访时间',
    render: (row) => <span style={{ fontSize: 12 }}>{fmtTime(row.visitTime)}</span>,
  },
  {
    key: 'purpose',
    header: '目的',
    render: (row) => <span style={{ fontSize: 12 }}>{row.purpose}</span>,
  },
  {
    key: 'durationMin',
    header: '时长',
    render: (row) => <span style={{ fontSize: 12 }}>{row.durationMin}分钟</span>,
  },
  {
    key: 'staffName',
    header: '接待人',
    render: (row) => <span style={{ fontSize: 12 }}>{row.staffName}</span>,
  },
  {
    key: 'notes',
    header: '备注',
    render: (row) => <span style={{ fontSize: 11, color: '#64748b' }}>{row.notes || '—'}</span>,
  },
];

// ---- 组件 ----

function buildOverviewStats(overview: MemberServiceOverview | undefined): QuickStatItem[] {
  if (!overview) return [];
  return [
    {
      label: '服务人次',
      value: overview.totalServices.toLocaleString('zh-CN'),
      helper: undefined,
    },
    {
      label: '新增VIP',
      value: overview.newVipCount.toString(),
      helper: overview.newVipCount > 0 ? `+${overview.newVipCount}` : undefined,
    },
    {
      label: '待处理咨询',
      value: overview.pendingInquiries.toString(),
      helper: overview.pendingInquiries > 0 ? `${overview.pendingInquiries}条` : '无',
    },
    {
      label: '满意度',
      value: overview.satisfactionScore + '%',
      helper: `${overview.satisfactionTrend >= 0 ? '+' : ''}${overview.satisfactionTrend.toFixed(1)}%`,
    },
  ];
}

export const ConciergePanel: React.FC<ConciergePanelProps> = ({
  overview,
  pointsTransactions = [],
  visitRecords = [],
  recommendations = [],
  actions = [],
  conciergeName = '管家',
  lastSyncAt,
  loading = false,
  compact = false,
  className,
}) => {
  const overviewStats = buildOverviewStats(overview);

  if (loading) {
    return (
      <div className={className} style={PANEL_STYLE} data-testid="concierge-panel-loading">
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>加载中...</div>
      </div>
    );
  }

  return (
    <div className={className} style={PANEL_STYLE} data-testid="concierge-panel">
      {/* 头部 */}
      <div style={HEADER_STYLE}>
        <div>
          <h2 style={HEADER_TITLE_STYLE}>🎩 {conciergeName}工作台</h2>
          <div style={HEADER_SUBTITLE_STYLE}>
            礼宾管家 · 会员服务面板
            {lastSyncAt && <span style={SYNC_TEXT_STYLE}> · 同步于 {fmtTime(lastSyncAt)}</span>}
          </div>
        </div>
      </div>

      {/* 快速操作栏 */}
      {actions.length > 0 && (
        <div style={ACTIONS_BAR_STYLE} data-testid="concierge-actions">
          {actions.map((action) => (
            <button
              key={action.key}
              style={action.primary ? ACTION_BTN_PRIMARY : ACTION_BTN_BASE}
              onClick={action.onClick}
              data-testid={`concierge-action-${action.key}`}
              type="button"
            >
              {action.icon && <span style={{ marginRight: 6 }}>{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* 概览统计 */}
      {overviewStats.length > 0 && (
        <div style={SECTION_STYLE} data-testid="concierge-overview">
          <QuickStats items={overviewStats} />
        </div>
      )}

      {/* 个性化推荐 */}
      {recommendations.length > 0 && (
        <div style={SECTION_STYLE} data-testid="concierge-recommendations">
          <div style={SECTION_HEADER_STYLE}>
            <h3 style={SECTION_TITLE_STYLE}>💡 个性化推荐</h3>
            <span style={{ fontSize: 12, color: '#64748b' }}>{recommendations.length} 条</span>
          </div>

          {compact ? (
            <div style={COMPACT_GRID_STYLE}>
              {recommendations.map((rec) => (
                <div key={rec.id} style={RECOMMENDATION_CARD_STYLE} data-testid={`recommendation-${rec.id}`}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 13, marginBottom: 2 }}>
                      {rec.productName}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      {rec.memberName} · {rec.productCategory}
                      {rec.price != null && (
                        <span style={{ marginLeft: 6 }}>¥{fmtCurrency(rec.price)}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{rec.reason}</div>
                  </div>
                  <Tag variant={confidenceTagVariant(rec.confidence).variant}>{confidenceTagVariant(rec.confidence).label}</Tag>
                </div>
              ))}
            </div>
          ) : (
            recommendations.map((rec) => (
              <div key={rec.id} style={RECOMMENDATION_CARD_STYLE} data-testid={`recommendation-${rec.id}`}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 14, marginBottom: 3 }}>
                    {rec.productName}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    推荐给 <span style={{ color: '#cbd5e1' }}>{rec.memberName}</span> · {rec.productCategory}
                    {rec.price != null && (
                      <span style={{ marginLeft: 8 }}>¥{fmtCurrency(rec.price)}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{rec.reason}</div>
                </div>
                <Tag variant={confidenceTagVariant(rec.confidence).variant}>{confidenceTagVariant(rec.confidence).label}</Tag>
              </div>
            ))
          )}
        </div>
      )}

      {/* 会员搜索 */}
      <div style={SECTION_STYLE} data-testid="concierge-member-search">
        <div style={SECTION_HEADER_STYLE}>
          <h3 style={SECTION_TITLE_STYLE}>🔍 会员查询</h3>
        </div>
        <div style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(148,163,184,0.18)', background: 'rgba(15,23,42,0.28)', color: '#94a3b8', fontSize: 13 }}>
          输入会员姓名 / 手机号 / 会员ID...
        </div>
      </div>

      {/* 来访记录 */}
      <div style={SECTION_STYLE} data-testid="concierge-visits">
        <div style={SECTION_HEADER_STYLE}>
          <h3 style={SECTION_TITLE_STYLE}>📋 今日来访</h3>
          <span style={{ fontSize: 12, color: '#64748b' }}>{visitRecords.length} 条</span>
        </div>
        {visitRecords.length > 0 ? (
          <DataTable columns={VISIT_COLUMNS} rows={visitRecords} rowKey={(r) => r.id} emptyText="暂无来访记录" />
        ) : (
          <div style={EMPTY_STYLE}>暂无来访记录</div>
        )}
      </div>

      {/* 积分流水 */}
      <div style={SECTION_STYLE} data-testid="concierge-points">
        <div style={SECTION_HEADER_STYLE}>
          <h3 style={SECTION_TITLE_STYLE}>💰 积分流水</h3>
          <span style={{ fontSize: 12, color: '#64748b' }}>{pointsTransactions.length} 条</span>
        </div>
        {pointsTransactions.length > 0 ? (
          <DataTable columns={TX_COLUMNS} rows={pointsTransactions} rowKey={(r) => r.id} emptyText="暂无积分变动记录" />
        ) : (
          <div style={EMPTY_STYLE}>暂无积分变动记录</div>
        )}
      </div>
    </div>
  );
};

ConciergePanel.displayName = 'ConciergePanel';
