'use client';

import React, { useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import { StatusBadge } from './StatusBadge';
import { QuickStats } from './QuickStats';
import type { QuickStatItem } from './QuickStats';
import { DataTable } from './DataTable';
import type { DataTableColumn } from './DataTable';

// ---- 类型定义 ----

/** 门店概况 */
export interface FranchiseStore {
  id: string;
  name: string;
  region: string;
  /** 运营评分 0-100 */
  score: number;
  /** 今日营收 */
  revenue: number;
  /** 同比变化率 */
  revenueTrend: number;
  /** 状态 */
  status: 'normal' | 'warning' | 'critical';
  /** 门店负责人 */
  manager: string;
  /** 联系方式 */
  phone?: string;
}

/** 巡查任务 */
export interface InspectionTask {
  id: string;
  storeId: string;
  storeName: string;
  type: 'routine' | 'spot' | 'compliance' | 'emergency';
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  dueAt: string;
  assignee: string;
  priority: 'high' | 'medium' | 'low';
}

/** 支持请求 */
export interface SupportRequest {
  id: string;
  storeId: string;
  storeName: string;
  category: 'device' | 'operation' | 'finance' | 'hr' | 'other';
  title: string;
  status: 'open' | 'processing' | 'resolved' | 'closed';
  createdAt: string;
  urgency: 'urgent' | 'normal' | 'low';
}

/** 门店销售排行条目 */
export interface StoreRankingEntry {
  rank: number;
  storeId: string;
  storeName: string;
  region: string;
  revenue: number;
  growth: number;
  score: number;
}

/** 加盟运营总览指标 */
export interface FranchiseOverviewMetrics {
  totalStores: number;
  normalStores: number;
  warningStores: number;
  criticalStores: number;
  totalRevenue: number;
  avgScore: number;
  pendingInspections: number;
  openSupportRequests: number;
}

/** 加盟运营经理工作台 Props */
export interface FranchiseOperationsDashboardProps {
  /** 门店列表 */
  stores?: FranchiseStore[];
  /** 巡查任务 */
  inspectionTasks?: InspectionTask[];
  /** 支持请求 */
  supportRequests?: SupportRequest[];
  /** 销售排行 */
  storeRankings?: StoreRankingEntry[];
  /** 总览指标 */
  overview?: FranchiseOverviewMetrics;
  /** 区域筛选选项 */
  regions?: string[];
  /** 加盟品牌名称 */
  brandName?: string;
  /** 最后更新 */
  lastUpdatedAt?: string;
  /** 加载中 */
  loading?: boolean;
  /** 紧凑模式 */
  compact?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 查看门店详情回调 */
  onViewStore?: (storeId: string) => void;
  /** 查看巡查任务回调 */
  onViewInspection?: (taskId: string) => void;
  /** 处理支持请求回调 */
  onHandleSupportRequest?: (requestId: string) => void;
  /** 刷新回调 */
  onRefresh?: () => void;
  /** 导出排行回调 */
  onExportRankings?: () => void;
}

// ---- 默认样式 ----

const CONTAINER_STYLE: React.CSSProperties = {
  color: '#f8fafc',
  fontFamily: 'system-ui, -apple-system, sans-serif',
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
  fontSize: 16,
  fontWeight: 600,
  color: '#f1f5f9',
};

const CARD_STYLE: React.CSSProperties = {
  borderRadius: 12,
  background: 'rgba(15,23,42,0.35)',
  border: '1px solid rgba(148,163,184,0.10)',
  padding: 16,
};

const ACTION_BUTTON_STYLE: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 8,
  border: '1px solid rgba(148,163,184,0.18)',
  background: 'rgba(15,23,42,0.38)',
  color: '#94a3b8',
  fontSize: 12,
  cursor: 'pointer',
};

const PRIMARY_BUTTON_STYLE: React.CSSProperties = {
  ...ACTION_BUTTON_STYLE,
  background: 'rgba(59,130,246,0.18)',
  borderColor: 'rgba(59,130,246,0.35)',
  color: '#93c5fd',
};

// ---- 工具函数 ----

function fmtCurrency(v: number): string {
  if (Math.abs(v) >= 10000) return `${(v / 10000).toFixed(1)}万`;
  return v.toLocaleString('zh-CN');
}

function fmtTrend(v: number): string {
  const sign = v > 0 ? '+' : '';
  return `${sign}${v.toFixed(1)}%`;
}

function fmtRevenueFull(v: number): string {
  return `¥${Math.round(v).toLocaleString('zh-CN')}`;
}

function statusMeta(status: FranchiseStore['status']): { label: string; variant: 'success' | 'warning' | 'error' } {
  switch (status) {
    case 'normal': return { label: '正常', variant: 'success' };
    case 'warning': return { label: '预警', variant: 'warning' };
    case 'critical': return { label: '异常', variant: 'error' };
  }
}

function urgencyMeta(u: SupportRequest['urgency']): { label: string; variant: 'error' | 'warning' | 'neutral' } {
  switch (u) {
    case 'urgent': return { label: '紧急', variant: 'error' };
    case 'normal': return { label: '普通', variant: 'warning' };
    case 'low': return { label: '低', variant: 'neutral' };
  }
}

function supportStatusLabel(s: SupportRequest['status']): string {
  const map: Record<SupportRequest['status'], string> = {
    open: '待处理',
    processing: '处理中',
    resolved: '已解决',
    closed: '已关闭',
  };
  return map[s];
}

function inspectionStatusMeta(s: InspectionTask['status']): { label: string; variant: 'warning' | 'neutral' | 'success' } {
  switch (s) {
    case 'pending': return { label: '待执行', variant: 'warning' };
    case 'in_progress': return { label: '进行中', variant: 'neutral' };
    case 'completed': return { label: '已完成', variant: 'success' };
  }
}

function inspectionTypeLabel(t: InspectionTask['type']): string {
  const map: Record<InspectionTask['type'], string> = {
    routine: '例行巡检',
    spot: '突击抽查',
    compliance: '合规检查',
    emergency: '应急巡查',
  };
  return map[t];
}

// ---- 组件 ----

export function FranchiseOperationsDashboard({
  stores,
  inspectionTasks,
  supportRequests,
  storeRankings,
  overview,
  regions,
  brandName,
  lastUpdatedAt,
  loading = false,
  compact = false,
  className,
  onViewStore,
  onViewInspection,
  onHandleSupportRequest,
  onRefresh,
  onExportRankings,
}: FranchiseOperationsDashboardProps) {
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [tab, setTab] = useState<'stores' | 'inspections' | 'support' | 'rankings'>('stores');

  if (loading) {
    return (
      <div className={className} style={{ ...CONTAINER_STYLE, padding: 24 }} data-testid="franchiseops-loading">
        <div style={{ display: 'grid', gridTemplateColumns: compact ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {Array.from({ length: compact ? 2 : 4 }).map((_, i) => (
            <div key={i} style={{ height: 88, borderRadius: 12, background: 'rgba(15,23,42,0.3)', border: '1px solid rgba(148,163,184,0.08)' }} />
          ))}
        </div>
        <div style={{ textAlign: 'center', color: '#64748b', fontSize: 13 }}>正在加载加盟运营数据...</div>
      </div>
    );
  }

  // ---- 总览指标 ----

  const metricItems: QuickStatItem[] = overview
    ? [
        { label: '门店总数', value: overview.totalStores, helper: `正常 ${overview.normalStores}` },
        { label: '今日总营收', value: `¥${fmtCurrency(overview.totalRevenue)}` },
        { label: '平均运营分', value: `${overview.avgScore.toFixed(1)}`, valueColor: overview.avgScore >= 80 ? '#4ade80' : overview.avgScore >= 60 ? '#fbbf24' : '#f87171' },
        { label: '待处理事项', value: overview.pendingInspections + overview.openSupportRequests, helper: `巡查${overview.pendingInspections} 工单${overview.openSupportRequests}` },
      ]
    : [
        { label: '门店总数', value: '--' },
        { label: '今日总营收', value: '--' },
        { label: '平均运营分', value: '--' },
        { label: '待处理事项', value: '--' },
      ];

  // ---- 门店列表数据 ----

  const filteredStores = useMemo(() => {
    if (!stores) return [];
    if (regionFilter === 'all') return stores;
    return stores.filter(s => s.region === regionFilter);
  }, [stores, regionFilter]);

  const storeColumns: DataTableColumn<FranchiseStore>[] = useMemo(() => [
    { key: 'name', header: '门店名称', width: 'auto', render: (row) => (
      <span style={{ fontSize: 13, color: '#e2e8f0' }}>{row.name}</span>
    )},
    { key: 'region', header: '区域', width: '80px', render: (row) => (
      <span style={{ fontSize: 12, color: '#94a3b8' }}>{row.region}</span>
    )},
    { key: 'score', header: '评分', width: '60px', render: (row) => {
      const color = row.score >= 80 ? '#4ade80' : row.score >= 60 ? '#fbbf24' : '#f87171';
      return <span style={{ fontSize: 13, fontWeight: 600, color }}>{row.score}</span>;
    }},
    { key: 'revenue', header: '营收', width: '100px', render: (row) => (
      <span style={{ fontSize: 12, color: '#cbd5e1' }}>{fmtRevenueFull(row.revenue)}</span>
    )},
    { key: 'revenueTrend', header: '同比', width: '70px', render: (row) => {
      const color = row.revenueTrend >= 0 ? '#4ade80' : '#f87171';
      return <span style={{ fontSize: 12, color }}>{fmtTrend(row.revenueTrend)}</span>;
    }},
    { key: 'status', header: '状态', width: '60px', render: (row) => {
      const m = statusMeta(row.status);
      return <StatusBadge label={m.label} variant={m.variant} size="sm" />;
    }},
    { key: 'actions', header: '操作', width: '60px', render: (row) => (
      <button
        type="button"
        style={{ ...ACTION_BUTTON_STYLE, padding: '4px 10px', fontSize: 11 }}
        onClick={() => onViewStore?.(row.id)}
        data-testid={`view-store-${row.id}`}
      >
        详情
      </button>
    )},
  ], [onViewStore]);

  // ---- 巡查任务列表 ----

  const inspectionColumns: DataTableColumn<InspectionTask>[] = useMemo(() => [
    { key: 'storeName', header: '门店', width: 'auto', render: (row) => (
      <span style={{ fontSize: 13, color: '#e2e8f0' }}>{row.storeName}</span>
    )},
    { key: 'type', header: '类型', width: '70px', render: (row) => (
      <span style={{ fontSize: 12, color: '#94a3b8' }}>{inspectionTypeLabel(row.type)}</span>
    )},
    { key: 'description', header: '描述', width: '140px', render: (row) => (
      <span style={{ fontSize: 12, color: '#cbd5e1' }}>{row.description}</span>
    )},
    { key: 'status', header: '状态', width: '70px', render: (row) => {
      const m = inspectionStatusMeta(row.status);
      return <StatusBadge label={m.label} variant={m.variant} size="sm" />;
    }},
    { key: 'dueAt', header: '截止', width: '70px', render: (row) => (
      <span style={{ fontSize: 11, color: '#64748b' }}>{row.dueAt}</span>
    )},
    { key: 'assignee', header: '负责人', width: '60px', render: (row) => (
      <span style={{ fontSize: 12, color: '#94a3b8' }}>{row.assignee}</span>
    )},
    { key: 'actions', header: '操作', width: '60px', render: (row) => (
      <button
        type="button"
        style={{ ...ACTION_BUTTON_STYLE, padding: '4px 10px', fontSize: 11 }}
        onClick={() => onViewInspection?.(row.id)}
      >
        处理
      </button>
    )},
  ], [onViewInspection]);

  // ---- 支持请求列表 ----

  const supportColumns: DataTableColumn<SupportRequest>[] = useMemo(() => [
    { key: 'storeName', header: '门店', width: 'auto', render: (row) => (
      <span style={{ fontSize: 13, color: '#e2e8f0' }}>{row.storeName}</span>
    )},
    { key: 'title', header: '问题', width: '140px', render: (row) => (
      <span style={{ fontSize: 12, color: '#cbd5e1' }}>{row.title}</span>
    )},
    { key: 'urgency', header: '紧急', width: '50px', render: (row) => {
      const m = urgencyMeta(row.urgency);
      return <StatusBadge label={m.label} variant={m.variant} size="sm" />;
    }},
    { key: 'status', header: '状态', width: '60px', render: (row) => (
      <span style={{ fontSize: 12, color: '#94a3b8' }}>{supportStatusLabel(row.status)}</span>
    )},
    { key: 'createdAt', header: '时间', width: '70px', render: (row) => (
      <span style={{ fontSize: 11, color: '#64748b' }}>{row.createdAt}</span>
    )},
    { key: 'actions', header: '操作', width: '60px', render: (row) => (
      <button
        type="button"
        style={{ ...PRIMARY_BUTTON_STYLE, padding: '4px 10px', fontSize: 11 }}
        onClick={() => onHandleSupportRequest?.(row.id)}
        data-testid={`handle-support-${row.id}`}
      >
        处理
      </button>
    )},
  ], [onHandleSupportRequest]);

  // ---- 销售排行 ----

  const rankingColumns: DataTableColumn<StoreRankingEntry>[] = useMemo(() => [
    { key: 'rank', header: '排名', width: '50px', render: (row) => (
      <span style={{
        fontSize: 14,
        fontWeight: 700,
        color: row.rank <= 3 ? '#fbbf24' : '#64748b',
      }}>{row.rank}</span>
    )},
    { key: 'storeName', header: '门店', width: 'auto', render: (row) => (
      <span style={{ fontSize: 13, color: '#e2e8f0' }}>{row.storeName}</span>
    )},
    { key: 'region', header: '区域', width: '70px', render: (row) => (
      <span style={{ fontSize: 12, color: '#94a3b8' }}>{row.region}</span>
    )},
    { key: 'revenue', header: '营收', width: '100px', render: (row) => (
      <span style={{ fontSize: 12, fontWeight: 500, color: '#cbd5e1' }}>{fmtRevenueFull(row.revenue)}</span>
    )},
    { key: 'growth', header: '增长', width: '70px', render: (row) => {
      const color = row.growth >= 0 ? '#4ade80' : '#f87171';
      return <span style={{ fontSize: 12, color }}>{fmtTrend(row.growth)}</span>;
    }},
    { key: 'score', header: '评分', width: '50px', render: (row) => {
      const color = row.score >= 80 ? '#4ade80' : row.score >= 60 ? '#fbbf24' : '#f87171';
      return <span style={{ fontSize: 12, fontWeight: 600, color }}>{row.score}</span>;
    }},
  ], []);

  // ---- 顶部标签栏 ----

  const tabs = [
    { key: 'stores', label: '门店管理' },
    { key: 'inspections', label: '巡查任务' },
    { key: 'support', label: '支持请求' },
    { key: 'rankings', label: '销售排行' },
  ] as const;

  // ---- 渲染内容 ----

  const renderContent = () => {
    switch (tab) {
      case 'stores':
        return (
          <>
            {/* 区域筛选 */}
            {regions && regions.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  style={{
                    ...ACTION_BUTTON_STYLE,
                    ...(regionFilter === 'all' ? PRIMARY_BUTTON_STYLE : {}),
                  }}
                  onClick={() => setRegionFilter('all')}
                >
                  全部
                </button>
                {regions.map(r => (
                  <button
                    key={r}
                    type="button"
                    style={{
                      ...ACTION_BUTTON_STYLE,
                      ...(regionFilter === r ? PRIMARY_BUTTON_STYLE : {}),
                    }}
                    onClick={() => setRegionFilter(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}

            {/* 门店列表 */}
            <DataTable
              columns={storeColumns}
              rows={filteredStores}
              rowKey={(row) => row.id}
              compact
              emptyText="暂无门店数据"
            />
          </>
        );

      case 'inspections':
        return (
          <DataTable
            columns={inspectionColumns}
            rows={inspectionTasks ?? []}
            rowKey={(row) => row.id}
            compact
            emptyText="暂无巡查任务"
          />
        );

      case 'support':
        return (
          <DataTable
            columns={supportColumns}
            rows={supportRequests ?? []}
            rowKey={(row) => row.id}
            compact
            emptyText="暂无支持请求"
          />
        );

      case 'rankings':
        return (
          <>
            {onExportRankings && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button
                  type="button"
                  style={ACTION_BUTTON_STYLE}
                  onClick={onExportRankings}
                  data-testid="export-rankings-btn"
                >
                  导出排行
                </button>
              </div>
            )}
            <DataTable
              columns={rankingColumns}
              rows={storeRankings ?? []}
              rowKey={(row) => `${row.rank}`}
              compact
              emptyText="暂无排行数据"
            />
          </>
        );
    }
  };

  return (
    <div className={className} style={{ ...CONTAINER_STYLE, padding: compact ? 16 : 24 }} data-testid="franchiseops-root">
      {/* 头部 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f8fafc' }} data-testid="franchiseops-title">
            {brandName ? `${brandName} ` : ''}加盟运营工作台
          </h2>
          {lastUpdatedAt && (
            <span style={{ fontSize: 11, color: '#475569', marginTop: 4, display: 'inline-block' }}>
              数据更新: {lastUpdatedAt}
            </span>
          )}
        </div>
        {onRefresh && (
          <button type="button" style={ACTION_BUTTON_STYLE} onClick={onRefresh} data-testid="franchiseops-refresh">
            刷新数据
          </button>
        )}
      </div>

      {/* 总览指标 */}
      <div style={SECTION_STYLE}>
        <QuickStats items={metricItems} columns={compact ? 2 : 4} gap={compact ? 10 : 14} padding={compact ? 14 : 18} />
      </div>

      {/* 异常门店提示 */}
      {overview && overview.criticalStores > 0 && (
        <div style={{
          ...SECTION_STYLE,
          padding: '12px 16px',
          borderRadius: 10,
          background: 'rgba(248,113,113,0.08)',
          border: '1px solid rgba(248,113,113,0.2)',
          color: '#fca5a5',
          fontSize: 13,
        }}>
          ⚠ 有 {overview.criticalStores} 家门店状态异常，{overview.warningStores} 家门店需要关注，请及时处理。
        </div>
      )}

      {/* 标签切换 */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 16, borderBottom: '1px solid rgba(148,163,184,0.12)', paddingBottom: 2 }}>
        {tabs.map(t => (
          <button
            key={t.key}
            type="button"
            style={{
              padding: '8px 16px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              background: tab === t.key ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: tab === t.key ? '#93c5fd' : '#64748b',
              fontSize: 13,
              fontWeight: tab === t.key ? 600 : 400,
              cursor: 'pointer',
            }}
            onClick={() => setTab(t.key)}
            data-testid={`tab-${t.key}`}
          >
            {t.label}
            {t.key === 'support' && supportRequests && (
              <span style={{ marginLeft: 6, fontSize: 11, background: 'rgba(248,113,113,0.2)', color: '#fca5a5', borderRadius: 10, padding: '0 6px' }}>
                {supportRequests.filter(r => r.status === 'open').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 具体内容 */}
      <div style={CARD_STYLE}>
        {renderContent()}
      </div>
    </div>
  );
}
