/**
 * campaigns/[id]/page.tsx — 营销活动详情页 (ToB 活动管理)
 * 含编辑/删除/状态流转/消费数据展示
 */
'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  PageShell,
  Badge,
  Card,
  StatCard,
  DescriptionList,
} from '@m5/ui';

import {
  CAMPAIGN_STATUS_MAP,
  CAMPAIGN_TYPE_MAP,
  CAMPAIGN_CHANNEL_MAP,
  formatCurrency,
  type CampaignItem,
  type CampaignStatus,
} from '../../campaigns-data';
import {
  loadCampaignDetail,
  loadCampaignDispatches,
  transitionCampaignStatus,
  type CampaignDispatchItem
} from '../campaigns-service'
import { ResultKindBadge } from '../dispatch-result-badge';

// ── 状态流转配置 ──

const STATUS_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  draft: ['scheduled', 'archived'],
  scheduled: ['active', 'draft', 'archived'],
  active: ['paused', 'ended'],
  paused: ['active', 'ended'],
  ended: ['archived'],
  archived: ['draft'],
};

const TRANSITION_LABELS: Record<string, string> = {
  'draft->scheduled': '排期活动',
  'draft->archived': '删除草稿',
  'scheduled->active': '启动活动',
  'scheduled->draft': '返回草稿',
  'scheduled->archived': '取消排期',
  'active->paused': '暂停活动',
  'active->ended': '结束活动',
  'paused->active': '恢复活动',
  'paused->ended': '结束活动',
  'ended->archived': '归档',
  'archived->draft': '重新启用',
};

// ── 工具 ──

function statusColor(status: CampaignStatus): string {
  const map: Record<CampaignStatus, string> = {
    draft: '#6b7280',
    scheduled: '#3b82f6',
    active: '#10b981',
    paused: '#f59e0b',
    ended: '#6b7280',
    archived: '#9ca3af',
  };
  return map[status] ?? '#6b7280';
}

function statusBg(status: CampaignStatus): string {
  const map: Record<CampaignStatus, string> = {
    draft: 'rgba(107,114,128,0.12)',
    scheduled: 'rgba(59,130,246,0.12)',
    active: 'rgba(16,185,129,0.12)',
    paused: 'rgba(245,158,11,0.12)',
    ended: 'rgba(107,114,128,0.12)',
    archived: 'rgba(156,163,175,0.12)',
  };
  return map[status] ?? 'rgba(107,114,128,0.12)';
}

function formatPercent(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function formatNumber(n: number): string {
  return n.toLocaleString('zh-CN');
}

function ctr(clicks: number, impressions: number): string {
  if (!impressions) return '0%';
  return `${((clicks / impressions) * 100).toFixed(2)}%`;
}

function cvr(conversions: number, clicks: number): string {
  if (!clicks) return '0%';
  return `${((conversions / clicks) * 100).toFixed(2)}%`;
}

// ── 页面组件 ──

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaignId = params.id as string;
  const highlightDispatchId = searchParams.get('highlightDispatchId');

  const dispatchCardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [campaign, setCampaign] = useState<CampaignItem | null>(null);
  const [dispatches, setDispatches] = useState<CampaignDispatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({ FAILED: true, DISPATCHED: false, PENDING: false, SKIPPED: true });
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    variant: 'danger' | 'warning' | 'neutral';
    onConfirm: () => void;
  } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [resultModal, setResultModal] = useState<{kind: string, typeLabel: string, detailLabel: string, resultRef?: string} | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleStatusTransition = useCallback(
    async (targetStatus: CampaignStatus) => {
      if (!campaign) return;
      const nextCampaign =
        campaign.source === 'live'
          ? await transitionCampaignStatus(campaign.id, targetStatus)
          : { ...campaign, status: targetStatus };
      if (!nextCampaign) {
        showToast('状态更新失败', 'error');
        return;
      }
      setCampaign(nextCampaign);
      showToast(`${CAMPAIGN_STATUS_MAP[targetStatus].label}成功`);
      setConfirmDialog(null);
    },
    [campaign, showToast],
  );

  const handleDelete = useCallback(() => {
    if (!campaign) return;
    if (campaign.deletionDisabled) {
      showToast('真实活动暂不支持删除，请走归档或状态流转', 'error');
      return;
    }
    setConfirmDialog({
      open: true,
      title: '删除活动',
      description: `确定要删除活动「${campaign.name}」吗？此操作不可撤销。`,
      confirmLabel: '确认删除',
      variant: 'danger',
      onConfirm: () => {
        setCampaign(null);
        showToast('活动已删除');
        setConfirmDialog(null);
        setTimeout(() => router.push('/campaigns'), 1000);
      },
    });
  }, [campaign, router, showToast]);

  // 加载活动详情和派发记录
  useEffect(() => {
    let active = true;

    const hydrateCampaign = async () => {
      const [nextCampaign, nextDispatches] = await Promise.all([
        loadCampaignDetail(campaignId),
        loadCampaignDispatches(campaignId)
      ]);
      if (!active) return;
      setCampaign(nextCampaign);
      setDispatches(nextDispatches);
      setLoading(false);
    };

    void hydrateCampaign();

    return () => {
      active = false;
    };
  }, [campaignId]);

  // 高亮滚动：从列表页点击某条派发记录进来时，自动滚动并高亮
  useEffect(() => {
    if (!highlightDispatchId || dispatches.length === 0) return;
    // 等 DOM 渲染完成后滚动
    const timer = setTimeout(() => {
      const el = dispatchCardRefs.current[highlightDispatchId];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [highlightDispatchId, dispatches]);

  // 按状态分组派发记录
  const dispatchGroups = useMemo(() => {
    const groups: Record<string, CampaignDispatchItem[]> = {};
    for (const d of dispatches) {
      if (!groups[d.status]) groups[d.status] = [];
    (groups[d.status] ?? []).push(d);
    }
    return groups;
  }, [dispatches]);

  // 派发统计摘要
  const dispatchStats = useMemo(() => {
    let total = 0, success = 0, failed = 0, pending = 0, skipped = 0;
    for (const d of dispatches) {
      total++;
      if (d.status === 'DISPATCHED') success++;
      else if (d.status === 'FAILED') failed++;
      else if (d.status === 'PENDING') pending++;
      else if (d.status === 'SKIPPED') skipped++;
    }
    return { total, success, failed, pending, skipped };
  }, [dispatches]);

  const toggleDispatchGroup = useCallback((status: string) => {
    setCollapsedGroups(prev => ({ ...prev, [status]: !prev[status] }));
  }, []);

  const STATUS_GROUP_ORDER = ['FAILED', 'DISPATCHED', 'PENDING', 'SKIPPED'] as const;
  const STATUS_GROUP_LABELS: Record<string, { label: string; color: string }> = {
    FAILED:    { label: '失败', color: '#ef4444' },
    DISPATCHED:{ label: '已下发', color: '#10b981' },
    PENDING:   { label: '待执行', color: '#f59e0b' },
    SKIPPED:   { label: '已跳过', color: '#94a3b8' },
  };

  const openTransitionDialog = useCallback(
    (targetStatus: CampaignStatus) => {
      if (!campaign) return;
      const key = `${campaign.status}->${targetStatus}`;
      const label = TRANSITION_LABELS[key] ?? `变更为${CAMPAIGN_STATUS_MAP[targetStatus].label}`;
      const isDestructive = targetStatus === 'archived' || targetStatus === 'ended';
      setConfirmDialog({
        open: true,
        title: label,
        description: `确定要将活动「${campaign.name}」${label}吗？`,
        confirmLabel: '确认',
        variant: isDestructive ? 'warning' : 'neutral',
        onConfirm: () => handleStatusTransition(targetStatus),
      });
    },
    [campaign, handleStatusTransition],
  );

  const budgetUsed = campaign && campaign.budget > 0 ? campaign.spent / campaign.budget : 0;

  // ── 渲染 ──

  if (loading) {
    return (
      <PageShell title="活动详情" description="加载中">
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>加载活动详情...</div>
      </PageShell>
    );
  }

  if (!campaign) {
    return (
      <PageShell title="活动详情" description="未找到该活动">
        <div
          style={{
            textAlign: 'center',
            padding: '80px 20px',
            color: '#94a3b8',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <h2 style={{ color: '#e2e8f0', margin: '0 0 8px' }}>活动不存在或已被删除</h2>
          <p>该营销活动可能已被删除，请返回活动列表。</p>
          <button
            onClick={() => router.push('/campaigns')}
            style={{
              marginTop: 20,
              padding: '10px 24px',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            返回活动列表
          </button>
        </div>
      </PageShell>
    );
  }

  const nextStatuses = STATUS_TRANSITIONS[campaign.status] ?? [];
  const campaignTypeInfo = CAMPAIGN_TYPE_MAP[campaign.type];
  const channelInfo = CAMPAIGN_CHANNEL_MAP[campaign.channel];
  const statusInfo = CAMPAIGN_STATUS_MAP[campaign.status];

  return (
    <PageShell
      title={`活动详情: ${campaign.code}`}
      description={campaign.name}
    >
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            padding: '12px 24px',
            borderRadius: 8,
            background: toast.type === 'success' ? 'rgba(16,185,129,0.9)' : 'rgba(239,68,68,0.9)',
            color: '#fff',
            zIndex: 9999,
            fontSize: 14,
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          {toast.message}
        </div>
      )}

      {/* 顶部概览 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 24,
          background: 'rgba(15,23,42,0.5)',
          border: '1px solid rgba(148,163,184,0.12)',
          borderRadius: 12,
          padding: 24,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <h1 style={{ margin: 0, fontSize: 24, color: '#f1f5f9' }}>{campaign.name}</h1>
            <span
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                background: statusBg(campaign.status),
                color: statusColor(campaign.status),
              }}
            >
              {statusInfo.label}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 16, color: '#94a3b8', fontSize: 13 }}>
            <span>编号: {campaign.code}</span>
            <span>创建人: {campaign.createdBy}</span>
            <span>
              周期: {campaign.startDate} ~ {campaign.endDate}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {/* 状态流转按钮 */}
          {nextStatuses.map((nextStatus) => {
            const key = `${campaign.status}->${nextStatus}`;
            const label = TRANSITION_LABELS[key] ?? CAMPAIGN_STATUS_MAP[nextStatus].label;
            const isDestructive = nextStatus === 'archived' || nextStatus === 'ended';
            return (
              <button
                key={nextStatus}
                onClick={() => openTransitionDialog(nextStatus)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid',
                  borderColor: isDestructive ? 'rgba(239,68,68,0.4)' : 'rgba(148,163,184,0.3)',
                  background: isDestructive ? 'rgba(239,68,68,0.08)' : 'rgba(148,163,184,0.08)',
                  color: isDestructive ? '#ef4444' : '#e2e8f0',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </button>
            );
          })}
          {/* 删除 */}
          <button
            onClick={handleDelete}
            disabled={campaign.deletionDisabled}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid rgba(239,68,68,0.4)',
              background: campaign.deletionDisabled ? 'rgba(148,163,184,0.08)' : 'rgba(239,68,68,0.12)',
              color: campaign.deletionDisabled ? '#94a3b8' : '#ef4444',
              cursor: campaign.deletionDisabled ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontWeight: 500,
            }}
            title={campaign.deletionDisabled ? '真实活动暂不支持删除' : undefined}
          >
            {campaign.deletionDisabled ? '删除未开放' : '删除'}
          </button>
        </div>
      </div>

      {/* 数据卡片 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <StatCard
          label="预算"
          value={formatCurrency(campaign.budget)}
          trend={{ value: budgetUsed > 0.8 ? '即将耗尽' : `${formatPercent(1 - budgetUsed)} 可用`, positive: budgetUsed <= 0.8 }}
          variant={budgetUsed > 0.8 ? 'warning' : 'default'}
        />
        <StatCard
          label="已花费"
          value={formatCurrency(campaign.spent)}
          trend={{ value: campaign.spent > 0 ? `${formatPercent(budgetUsed)} 预算` : '尚未开始', positive: budgetUsed <= 0.7 }}
          variant={budgetUsed > 0.7 ? 'warning' : 'default'}
        />
        <StatCard
          label="曝光数"
          value={formatNumber(campaign.impressions)}
          trend={{ value: `${ctr(campaign.clicks, campaign.impressions)} 点击率`, positive: campaign.impressions > 0 }}
          variant="info"
        />
        <StatCard
          label="ROI"
          value={`${campaign.roi.toFixed(1)}x`}
          trend={{ value: campaign.roi >= 2 ? '优秀' : campaign.roi > 0 ? '待优化' : '无数据', positive: campaign.roi >= 2 }}
          variant={campaign.roi >= 2 ? 'success' : campaign.roi > 0 ? 'default' : 'warning'}
        />
      </div>

      {/* 详情信息 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <Card title="基本信息">
          <DescriptionList
            items={[
              { label: '活动名称', value: campaign.name },
              { label: '活动编号', value: campaign.code },
              {
                label: '活动类型',
                value: (
                  <Badge>{campaignTypeInfo.label}</Badge>
                ),
              },
              {
                label: '活动渠道',
                value: (
                  <Badge>{channelInfo.label}</Badge>
                ),
              },
              {
                label: '当前状态',
                value: (
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 10px',
                      borderRadius: 12,
                      fontSize: 12,
                      background: statusBg(campaign.status),
                      color: statusColor(campaign.status),
                    }}
                  >
                    {statusInfo.label}
                  </span>
                ),
              },
              { label: '创建人', value: campaign.createdBy },
              { label: '开始日期', value: campaign.startDate },
              { label: '结束日期', value: campaign.endDate },
            ]}
          />
        </Card>

        <Card title="投放数据">
          <DescriptionList
            items={[
              { label: '预算', value: formatCurrency(campaign.budget) },
              { label: '已花费', value: formatCurrency(campaign.spent) },
              {
                label: '预算使用率',
                value: formatPercent(budgetUsed),
              },
              { label: '曝光次数', value: formatNumber(campaign.impressions) },
              { label: '点击次数', value: formatNumber(campaign.clicks) },
              { label: '点击率 (CTR)', value: ctr(campaign.clicks, campaign.impressions) },
              { label: '转化次数', value: formatNumber(campaign.conversions) },
              { label: '转化率 (CVR)', value: cvr(campaign.conversions, campaign.clicks) },
              { label: 'ROI', value: `${campaign.roi.toFixed(2)}x` },
            ]}
          />
        </Card>
      </div>

      {/* 派发统计摘要 */}
      {dispatches.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '12px 16px',
            background: 'rgba(15,23,42,0.6)',
            border: '1px solid rgba(148,163,184,0.12)',
            borderRadius: 10,
            marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>总数</span>
            <span style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 600 }}>{dispatchStats.total}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>成功</span>
            <span style={{ color: '#10b981', fontSize: 14, fontWeight: 600 }}>{dispatchStats.success}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>失败</span>
            <span style={{ color: '#ef4444', fontSize: 14, fontWeight: 600 }}>{dispatchStats.failed}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>待执行</span>
            <span style={{ color: '#f59e0b', fontSize: 14, fontWeight: 600 }}>{dispatchStats.pending}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>已跳过</span>
            <span style={{ color: '#94a3b8', fontSize: 14, fontWeight: 600 }}>{dispatchStats.skipped}</span>
          </div>
        </div>
      )}

      <Card title="派发记录">
        {dispatches.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: 13 }}>暂无真实派发记录，后续触发后会显示在这里。</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {STATUS_GROUP_ORDER.map((status) => {
              const items = dispatchGroups[status];
              if (!items || items.length === 0) return null;
              const isCollapsed = collapsedGroups[status] ?? false;
              const groupInfo = STATUS_GROUP_LABELS[status]!;
              return (
                <div key={status}>
                  {/* 分组头部：可点击折叠 */}
                  <div
                    onClick={() => toggleDispatchGroup(status)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      userSelect: 'none',
                      marginBottom: isCollapsed ? 0 : 10,
                    }}
                  >
                    <span style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: groupInfo.color,
                    }}>
                      {groupInfo.label}
                    </span>
                    <span style={{
                      fontSize: 11,
                      padding: '1px 7px',
                      borderRadius: 999,
                      background: `${groupInfo.color}20`,
                      color: groupInfo.color,
                      fontWeight: 600,
                    }}>
                      {items.length}
                    </span>
                    <span style={{ color: '#64748b', fontSize: 11 }}>
                      {isCollapsed ? '▶' : '▼'}
                    </span>
                    {isCollapsed && (
                      <span style={{ color: '#475569', fontSize: 12 }}>
                        点击展开
                      </span>
                    )}
                  </div>

                  {/* 卡片列表：折叠时隐藏 */}
                  {!isCollapsed && items.map((dispatch) => {
                    const isFailed = dispatch.status === 'FAILED';
                    const isSuccess = dispatch.status === 'DISPATCHED';
                    const isHighlighted = dispatch.dispatchId === highlightDispatchId;
                    return (
                      <div
                        key={dispatch.dispatchId}
                        ref={el => { dispatchCardRefs.current[dispatch.dispatchId] = el; }}
                        style={{
                          border: isHighlighted
                            ? '2px solid rgba(59,130,246,0.7)'
                            : '1px solid rgba(148,163,184,0.12)',
                          borderRadius: 10,
                          padding: 14,
                          background: isHighlighted
                            ? 'rgba(30,58,138,0.25)'
                            : 'rgba(15,23,42,0.32)',
                          boxShadow: isHighlighted
                            ? '0 0 0 1px rgba(59,130,246,0.3), 0 0 24px rgba(59,130,246,0.15)'
                            : 'none',
                          transition: 'box-shadow 0.3s, border-color 0.3s',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: 12,
                            marginBottom: 8,
                            flexWrap: 'wrap'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {isHighlighted && (
                              <span style={{
                                fontSize: 10,
                                padding: '2px 6px',
                                borderRadius: 4,
                                background: 'rgba(59,130,246,0.2)',
                                color: '#60a5fa',
                                fontWeight: 700,
                                letterSpacing: '0.05em',
                              }}>
                                来自列表
                              </span>
                            )}
                            <div style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 600 }}>
                              {dispatch.triggerEvent}
                            </div>
                          </div>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 10px',
                              borderRadius: 999,
                              fontSize: 12,
                              background: isSuccess
                                ? 'rgba(16,185,129,0.12)'
                                : isFailed
                                  ? 'rgba(239,68,68,0.12)'
                                  : 'rgba(148,163,184,0.12)',
                              color: isSuccess ? '#10b981' : isFailed ? '#ef4444' : '#cbd5e1'
                            }}
                          >
                            {dispatch.statusLabel}
                          </span>
                        </div>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: 8,
                            fontSize: 12,
                            color: '#94a3b8'
                          }}
                        >
                          <span>成员: <a href={`/members/${dispatch.memberId}`} style={{color:'#60a5fa',textDecoration:'underline',cursor:'pointer'}}>{dispatch.memberLabel}</a></span>
                          <span>结果: {dispatch.resultLabel}</span>
                          <span>时间: {dispatch.createdAtLabel}</span>
                          <span>ID: {dispatch.dispatchId}</span>
                        </div>
                        <div
                          style={{
                            marginTop: 12,
                            borderRadius: 10,
                            border: '1px solid rgba(148,163,184,0.12)',
                            background: 'rgba(2,6,23,0.28)',
                            padding: 12
                          }}
                        >
                          <div style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                            结果钻取
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                            <div
                              style={{ cursor: 'pointer' }}
                              onClick={() => setResultModal({ kind: dispatch.resultKind, typeLabel: dispatch.resultTypeLabel, detailLabel: dispatch.resultDetailLabel, resultRef: dispatch.resultRef })}
                            >
                              <ResultKindBadge
                                kind={dispatch.resultKind}
                                typeLabel={dispatch.resultTypeLabel}
                                detailLabel={dispatch.resultDetailLabel}
                              />
                            </div>
                          </div>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                              gap: 8,
                              fontSize: 12,
                              color: '#cbd5e1'
                            }}
                          >
                            <span>执行域: {dispatch.scopeLabel}</span>
                            <span>动作槽位: {dispatch.actionIndex + 1}</span>
                            <span>订单ID: {dispatch.orderId ?? '-'}</span>
                            <span>支付ID: {dispatch.paymentId ?? '-'}</span>
                            <span>回执引用: {dispatch.resultRef ?? '-'}</span>
                            <span>失败原因: {dispatch.errorMessage ?? '-'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* 结果详情弹窗 */}
      {resultModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.7)',
            zIndex: 10001,
          }}
          onClick={() => setResultModal(null)}
        >
          <div
            style={{
              background: '#1e293b',
              border: '1px solid rgba(148,163,184,0.15)',
              borderRadius: 12,
              padding: 24,
              maxWidth: 480,
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 12px', color: '#f1f5f9', fontSize: 18 }}>
              {resultModal.typeLabel}
            </h3>
            <p style={{ color: '#e2e8f0', margin: '0 0 16px', fontSize: 14, lineHeight: 1.6 }}>
              {resultModal.detailLabel}
            </p>
            {resultModal.resultRef && (
              <div style={{ marginBottom: 16 }}>
                <span style={{ color: '#94a3b8', fontSize: 12 }}>原始引用: </span>
                <span style={{ color: '#cbd5e1', fontSize: 12, fontFamily: 'monospace' }}>
                  {resultModal.resultRef}
                </span>
              </div>
            )}
            <button
              onClick={() => setResultModal(null)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid rgba(148,163,184,0.3)',
                background: 'transparent',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* 确认对话框 */}
      {confirmDialog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)',
            zIndex: 10000,
          }}
          onClick={() => setConfirmDialog(null)}
        >
          <div
            style={{
              background: '#1e293b',
              border: '1px solid rgba(148,163,184,0.15)',
              borderRadius: 12,
              padding: 24,
              maxWidth: 440,
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 8px', color: '#f1f5f9', fontSize: 18 }}>
              {confirmDialog.title}
            </h3>
            <p style={{ color: '#94a3b8', margin: '0 0 20px', fontSize: 14, lineHeight: 1.6 }}>
              {confirmDialog.description}
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmDialog(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid rgba(148,163,184,0.3)',
                  background: 'transparent',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                取消
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background:
                    confirmDialog.variant === 'danger'
                      ? 'rgba(239,68,68,0.9)'
                      : confirmDialog.variant === 'warning'
                        ? 'rgba(245,158,11,0.9)'
                        : '#3b82f6',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
