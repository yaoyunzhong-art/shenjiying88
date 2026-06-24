'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import {
  DataTable,
  DetailActionBar,
  Pagination,
  SearchFilterInput,
  StatusBadge,
  PageShell,
  QuickStats,
  Tabs,
  FilterChips,
  usePagination,
  useSearchFilter,
  useSortedItems,
  type FilterChip,
  type DataTableColumn,
  type DataTableSortConfig
} from '@m5/ui';

import { useDetailActions } from '../components/use-detail-actions';

// ---- 类型 ----

interface NotificationItem {
  id: string;
  title: string;
  content: string;
  type: 'system' | 'alert' | 'reminder' | 'announcement';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'archived';
  targetScope: 'PLATFORM' | 'TENANT' | 'BRAND' | 'STORE' | 'MARKET';
  targetId: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
}

type NotifStatusVariant = 'success' | 'neutral' | 'warning' | 'danger';

const TYPE_MAP: Record<NotificationItem['type'], { label: string; variant: NotifStatusVariant }> = {
  system: { label: '系统', variant: 'neutral' },
  alert: { label: '告警', variant: 'danger' },
  reminder: { label: '提醒', variant: 'warning' },
  announcement: { label: '公告', variant: 'success' },
};

const PRIORITY_MAP: Record<NotificationItem['priority'], { label: string; variant: NotifStatusVariant }> = {
  low: { label: '低', variant: 'neutral' },
  medium: { label: '中', variant: 'success' },
  high: { label: '高', variant: 'warning' },
  urgent: { label: '紧急', variant: 'danger' },
};

const STATUS_MAP: Record<NotificationItem['status'], { label: string; variant: NotifStatusVariant }> = {
  unread: { label: '未读', variant: 'warning' },
  read: { label: '已读', variant: 'neutral' },
  archived: { label: '已归档', variant: 'neutral' },
};

const SCOPE_MAP: Record<NotificationItem['targetScope'], string> = {
  PLATFORM: '平台',
  TENANT: '租户',
  BRAND: '品牌',
  STORE: '门店',
  MARKET: '市场',
};

// ---- Mock 数据 ----

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { id: 'n1', title: '系统维护通知', content: '平台将于 2026-06-16 02:00-04:00 进行季度维护，届时部分服务可能短暂不可用。', type: 'system', priority: 'high', status: 'unread', targetScope: 'PLATFORM', targetId: 'platform', createdBy: 'system', createdAt: '2026-06-14 04:00:00', expiresAt: '2026-06-17 04:00:00' },
  { id: 'n2', title: '日本市场激活成功', content: '日本市场 (jp-default) 已完成激活和基础配置，租户和品牌可以开始入驻。', type: 'announcement', priority: 'medium', status: 'unread', targetScope: 'MARKET', targetId: 'm-005', createdBy: 'admin@m5.com', createdAt: '2026-06-14 03:30:00', expiresAt: '2026-07-14 03:30:00' },
  { id: 'n3', title: '⚠️ 证书即将过期', content: 'SSL 证书 cert-007 将在 7 天内过期，请尽快安排证书轮换。', type: 'alert', priority: 'urgent', status: 'unread', targetScope: 'PLATFORM', targetId: 'cert-007', createdBy: 'system', createdAt: '2026-06-14 03:00:00', expiresAt: '2026-06-28 03:00:00' },
  { id: 'n4', title: '租户配额提醒', content: '租户「华润万象生活」(TNT-001) 的 API 调用配额已使用 85%，建议评估是否需要扩容。', type: 'reminder', priority: 'medium', status: 'unread', targetScope: 'TENANT', targetId: 't-001', createdBy: 'system', createdAt: '2026-06-14 02:30:00', expiresAt: '2026-06-21 02:30:00' },
  { id: 'n5', title: '门店暂停通知', content: '门店「杭州银泰旗舰店」(STORE-005) 因消防安全整改已暂停运营。', type: 'alert', priority: 'high', status: 'read', targetScope: 'STORE', targetId: 's-005', createdBy: 'admin@m5.com', createdAt: '2026-06-14 02:00:00', expiresAt: '2026-06-21 02:00:00' },
  { id: 'n6', title: '品牌等级升级通知', content: '品牌「TechCore 科技核心」(BRAND-004) 已从标准级升级为旗舰级。', type: 'announcement', priority: 'medium', status: 'read', targetScope: 'BRAND', targetId: 'b-004', createdBy: 'brand-mgr@m5.com', createdAt: '2026-06-13 18:00:00', expiresAt: '2026-07-13 18:00:00' },
  { id: 'n7', title: '新功能发布：智能搜索', content: '平台已上线智能搜索功能，支持跨市场、跨租户的全文搜索。详情请查看帮助文档。', type: 'announcement', priority: 'low', status: 'read', targetScope: 'PLATFORM', targetId: 'platform', createdBy: 'product@m5.com', createdAt: '2026-06-13 15:00:00', expiresAt: '2026-09-13 15:00:00' },
  { id: 'n8', title: '⚠️ 边缘节点离线警告', content: '边缘节点 en-019（深圳万象天地店）已离线超过 1 小时，相关门店数据同步暂停。', type: 'alert', priority: 'urgent', status: 'unread', targetScope: 'STORE', targetId: 's-003', createdBy: 'system', createdAt: '2026-06-13 14:30:00', expiresAt: '2026-06-14 14:30:00' },
  { id: 'n9', title: '季度审计报告已生成', content: '2026 Q2 审计报告已自动生成，相关方可在财务模块查看完整报告。', type: 'system', priority: 'low', status: 'archived', targetScope: 'PLATFORM', targetId: 'platform', createdBy: 'system', createdAt: '2026-06-13 12:00:00', expiresAt: '2026-09-30 12:00:00' },
  { id: 'n10', title: '网关配额超限通知', content: '租户「龙湖集团」(TNT-002) 近 1 小时网关请求量超过上限 40%，建议联系客户沟通扩容方案。', type: 'reminder', priority: 'high', status: 'unread', targetScope: 'TENANT', targetId: 't-002', createdBy: 'system', createdAt: '2026-06-13 11:00:00', expiresAt: '2026-06-15 11:00:00' },
  { id: 'n11', title: '韩国市场待激活', content: '韩国市场 (kr-default) 已配置完成但尚未激活，请尽快完成激活流程。', type: 'reminder', priority: 'medium', status: 'unread', targetScope: 'MARKET', targetId: 'm-006', createdBy: 'ops@m5.com', createdAt: '2026-06-13 10:00:00', expiresAt: '2026-06-20 10:00:00' },
  { id: 'n12', title: '数据备份确认', content: '2026-06-13 全量备份已完成并验证，备份文件大小 48.2 GB，保留至 2026-07-13。', type: 'system', priority: 'low', status: 'archived', targetScope: 'PLATFORM', targetId: 'platform', createdBy: 'system', createdAt: '2026-06-13 08:00:00', expiresAt: '2026-07-13 08:00:00' },
  { id: 'n13', title: '品牌暂停通知', content: '品牌「NatureEssence 自然精华」(BRAND-005) 因供应链调整已暂停运营，预计 2 周内恢复。', type: 'alert', priority: 'medium', status: 'read', targetScope: 'BRAND', targetId: 'b-005', createdBy: 'brand-mgr@m5.com', createdAt: '2026-06-12 18:00:00', expiresAt: '2026-06-26 18:00:00' },
  { id: 'n14', title: '新门店入驻通知', content: '租户「万达集团」已提交 2 家新门店入驻申请，请在门店管理模块审核。', type: 'reminder', priority: 'medium', status: 'unread', targetScope: 'TENANT', targetId: 't-009', createdBy: 'system', createdAt: '2026-06-12 16:00:00', expiresAt: '2026-06-15 16:00:00' },
  { id: 'n15', title: '安全补丁已推送', content: '所有边缘节点已接收安全补丁版本 2.4.1，修复了 3 个中危漏洞和 1 个高危漏洞。', type: 'system', priority: 'high', status: 'read', targetScope: 'PLATFORM', targetId: 'platform', createdBy: 'security@m5.com', createdAt: '2026-06-12 14:00:00', expiresAt: '2026-06-26 14:00:00' },
  { id: 'n16', title: '月度运营报告', content: '2026 年 5 月平台运营月报已发布，包含 12 个市场、24 个门店的运营数据摘要。', type: 'announcement', priority: 'low', status: 'archived', targetScope: 'PLATFORM', targetId: 'platform', createdBy: 'ops@m5.com', createdAt: '2026-06-10 09:00:00', expiresAt: '2026-07-10 09:00:00' },
  { id: 'n17', title: '⚠️ 敏感数据访问检测', content: '检测到未授权尝试访问租户「恒隆地产」的财务数据，已自动阻断并记录审计。', type: 'alert', priority: 'urgent', status: 'unread', targetScope: 'TENANT', targetId: 't-005', createdBy: 'system', createdAt: '2026-06-14 01:00:00', expiresAt: '2026-06-17 01:00:00' },
  { id: 'n18', title: 'SEO 配置提醒', content: '新加坡市场 (sg-default) 的 SEO 元数据已过期，建议在 2 天内更新以保持搜索引擎优化效果。', type: 'reminder', priority: 'low', status: 'read', targetScope: 'MARKET', targetId: 'm-007', createdBy: 'system', createdAt: '2026-06-07 10:00:00', expiresAt: '2026-06-15 10:00:00' },
];

// ---- 列定义 ----

function buildColumns(
  onRowClick: (item: NotificationItem) => void
): DataTableColumn<NotificationItem>[] {
  return [
    {
      key: 'status',
      title: '状态',
      sortable: true,
      render: (item: NotificationItem) => {
        const s = STATUS_MAP[item.status];
        return <StatusBadge label={s.label} variant={s.variant} size="sm" dot />;
      },
    },
    {
      key: 'type',
      title: '类型',
      sortable: true,
      render: (item: NotificationItem) => {
        const t = TYPE_MAP[item.type];
        return <StatusBadge label={t.label} variant={t.variant} size="sm" />;
      },
    },
    {
      key: 'priority',
      title: '优先级',
      sortable: true,
      sortValue: (item: NotificationItem) => ['urgent', 'high', 'medium', 'low'].indexOf(item.priority),
      render: (item: NotificationItem) => {
        const p = PRIORITY_MAP[item.priority];
        return <StatusBadge label={p.label} variant={p.variant} size="sm" />;
      },
    },
    {
      key: 'title',
      title: '标题',
      dataKey: 'title',
      sortable: true,
      render: (item: NotificationItem) => (
        <span
          onClick={(e) => { e.stopPropagation(); onRowClick(item); }}
          style={{
            color: '#93c5fd', cursor: 'pointer', textDecoration: 'underline',
            fontWeight: item.status === 'unread' ? 600 : 400
          }}
        >
          {item.title}
        </span>
      ),
    },
    {
      key: 'targetScope',
      title: '作用域',
      sortable: true,
      render: (item: NotificationItem) => (
        <div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>{SCOPE_MAP[item.targetScope]}</div>
          <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b' }}>{item.targetId}</div>
        </div>
      ),
    },
    {
      key: 'createdBy',
      title: '发布者',
      dataKey: 'createdBy',
      sortable: true,
    },
    {
      key: 'createdAt',
      title: '发布时间',
      dataKey: 'createdAt',
      sortable: true,
    },
    {
      key: 'expiresAt',
      title: '过期时间',
      dataKey: 'expiresAt',
      sortable: true,
    },
  ];
}

// ---- 页面 ----

export default function NotificationsPage() {
  const router = useRouter();
  const searchFields = useMemo<(keyof NotificationItem)[]>(() => ['title', 'content', 'createdBy', 'targetId'], []);
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(MOCK_NOTIFICATIONS, searchFields);

  // 状态筛选
  const [statusFilter, setStatusFilter] = useState<NotificationItem['status'] | 'ALL'>('ALL');
  const statusFiltered = useMemo(
    () => (statusFilter === 'ALL' ? filteredItems : filteredItems.filter((item) => item.status === statusFilter)),
    [filteredItems, statusFilter]
  );

  // 类型筛选
  const [typeFilter, setTypeFilter] = useState<NotificationItem['type'] | 'ALL'>('ALL');
  const typeFiltered = useMemo(
    () => (typeFilter === 'ALL' ? statusFiltered : statusFiltered.filter((item) => item.type === typeFilter)),
    [statusFiltered, typeFilter]
  );

  // 优先级筛选
  const [priorityFilter, setPriorityFilter] = useState<NotificationItem['priority'] | 'ALL'>('ALL');
  const priorityFiltered = useMemo(
    () => (priorityFilter === 'ALL' ? typeFiltered : typeFiltered.filter((item) => item.priority === priorityFilter)),
    [typeFiltered, priorityFilter]
  );

  // 作用域筛选
  const [scopeFilter, setScopeFilter] = useState<NotificationItem['targetScope'] | 'ALL'>('ALL');
  const scopeFiltered = useMemo(
    () => (scopeFilter === 'ALL' ? priorityFiltered : priorityFiltered.filter((item) => item.targetScope === scopeFilter)),
    [priorityFiltered, scopeFilter]
  );

  // 排序
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>({ key: 'createdAt', direction: 'desc' });
  const handleRowClick = useCallback((item: NotificationItem) => {
    router.push(`/notifications/${item.id}`);
  }, [router]);
  const columns = useMemo(() => buildColumns(handleRowClick), [handleRowClick]);
  const sortedItems = useSortedItems(scopeFiltered, columns, sortConfig);

  // 分页
  const pagination = usePagination({ initialPageSize: 10, pageSizeOptions: [5, 10, 15, 20] });
  useEffect(() => { pagination.resetPage(); }, [searchTerm, statusFilter, typeFilter, priorityFilter, scopeFilter, pagination]);
  const pageItems = pagination.paginate(sortedItems);

  // 统计
  const stats = useMemo(() => ({
    total: MOCK_NOTIFICATIONS.length,
    unread: MOCK_NOTIFICATIONS.filter((n) => n.status === 'unread').length,
    alert: MOCK_NOTIFICATIONS.filter((n) => n.type === 'alert').length,
    urgent: MOCK_NOTIFICATIONS.filter((n) => n.priority === 'urgent').length,
  }), []);

  const { actions } = useDetailActions({
    workspace: 'notifications',
    detailId: 'overview',
    record: { items: sortedItems, statusFilter, typeFilter, priorityFilter, scopeFilter, stats },
    shareTitle: '通知中心',
    shareText: '查看通知 / 状态 / 类型 / 优先级 / 范围筛选结果'
  });

  return (
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="通知中心"
        subtitle="统一管理平台所有系统通知、告警、提醒和公告。支持按类型、优先级和作用域筛选，快速定位关键信息。"
      >
        {/* 统计卡片 */}
        <QuickStats
          items={[
            { label: '通知总数', value: stats.total, helper: `其中 ${stats.unread} 条未读` },
            { label: '告警', value: stats.alert, valueColor: '#f87171', helper: `${stats.urgent} 条紧急` },
            { label: '未读', value: stats.unread, valueColor: '#fbbf24', helper: `${((stats.unread / stats.total) * 100).toFixed(0)}% 待处理` },
            { label: '已归档', value: stats.total - stats.unread, valueColor: '#94a3b8', helper: '历史通知' },
          ]}
        />

        {/* 搜索框 */}
        <div style={{ marginBottom: 12 }}>
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索通知标题 / 内容 / 发布者 / 目标ID..."
          />
        </div>

        {/* 状态过滤栏 */}
        <div style={{ marginBottom: 12 }}>
          <Tabs
            items={[
              { key: 'ALL', label: '全部', count: MOCK_NOTIFICATIONS.length },
              ...(['unread', 'read', 'archived'] as const).map((s) => ({
                key: s,
                label: STATUS_MAP[s]?.label ?? s,
                count: MOCK_NOTIFICATIONS.filter((item) => item.status === s).length
              }))
            ]}
            activeKey={statusFilter}
            onChange={(key) => setStatusFilter(key as NotificationItem['status'] | 'ALL')}
            variant="pills"
            size="sm"
          />
        </div>

        {/* 类型 + 优先级 + 作用域 筛选栏 */}
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>通知类型</div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: statusFiltered.length },
                ...(['system', 'alert', 'reminder', 'announcement'] as const).map((t) => ({
                  key: t,
                  label: TYPE_MAP[t].label,
                  count: statusFiltered.filter((item) => item.type === t).length
                }))
              ]}
              activeKey={typeFilter}
              onChange={(key) => setTypeFilter(key as NotificationItem['type'] | 'ALL')}
              variant="pills"
              size="sm"
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>优先级</div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: typeFiltered.length },
                ...(['urgent', 'high', 'medium', 'low'] as const).map((p) => ({
                  key: p,
                  label: PRIORITY_MAP[p].label,
                  count: typeFiltered.filter((item) => item.priority === p).length
                }))
              ]}
              activeKey={priorityFilter}
              onChange={(key) => setPriorityFilter(key as NotificationItem['priority'] | 'ALL')}
              variant="pills"
              size="sm"
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>作用域</div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: priorityFiltered.length },
                ...Object.entries(SCOPE_MAP).map(([key, label]) => ({
                  key: key as NotificationItem['targetScope'],
                  label,
                  count: priorityFiltered.filter((item) => item.targetScope === key).length
                }))
              ]}
              activeKey={scopeFilter}
              onChange={(key) => setScopeFilter(key as NotificationItem['targetScope'] | 'ALL')}
              variant="pills"
              size="sm"
            />
          </div>
        </div>

        {/* 活跃过滤条件可视化 */}
        <FilterChips
          hint="已筛选："
          chips={[
            ...(statusFilter !== 'ALL'
              ? [{ key: 'status' as const, label: STATUS_MAP[statusFilter]?.label ?? statusFilter, tone: (STATUS_MAP[statusFilter]?.variant === 'warning' ? 'warning' : 'neutral') as FilterChip['tone'], count: statusFiltered.filter((item) => item.status === statusFilter).length }]
              : []),
            ...(typeFilter !== 'ALL'
              ? [{ key: 'type' as const, label: TYPE_MAP[typeFilter].label, tone: (TYPE_MAP[typeFilter].variant === 'danger' ? 'danger' : TYPE_MAP[typeFilter].variant === 'warning' ? 'warning' : 'neutral') as FilterChip['tone'], count: statusFiltered.filter((item) => item.type === typeFilter).length }]
              : []),
            ...(priorityFilter !== 'ALL'
              ? [{ key: 'priority' as const, label: PRIORITY_MAP[priorityFilter].label, tone: (PRIORITY_MAP[priorityFilter].variant === 'danger' ? 'danger' : PRIORITY_MAP[priorityFilter].variant === 'warning' ? 'warning' : 'neutral') as FilterChip['tone'], count: typeFiltered.filter((item) => item.priority === priorityFilter).length }]
              : []),
            ...(scopeFilter !== 'ALL'
              ? [{ key: 'scope' as const, label: SCOPE_MAP[scopeFilter], tone: 'neutral' as FilterChip['tone'], count: priorityFiltered.filter((item) => item.targetScope === scopeFilter).length }]
              : []),
          ]}
          onRemove={(key) => {
            switch (key) {
              case 'status': setStatusFilter('ALL'); break;
              case 'type': setTypeFilter('ALL'); break;
              case 'priority': setPriorityFilter('ALL'); break;
              case 'scope': setScopeFilter('ALL'); break;
            }
          }}
          onClearAll={() => { setStatusFilter('ALL'); setTypeFilter('ALL'); setPriorityFilter('ALL'); setScopeFilter('ALL'); }}
          size="sm"
          style={{ marginBottom: 8 }}
        />

        {/* 数据表格 */}
        <DataTable
          title={`通知列表（匹配 ${sortedItems.length} 条）`}
          columns={columns}
          items={pageItems}
          rowKey={(item) => item.id}
          sort={sortConfig}
          onSortChange={setSortConfig}
          striped
          compact
        />

        {/* 分页 */}
        <Pagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={sortedItems.length}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
        />

        <DetailActionBar
          actions={actions}
          heading="工作台收口动作"
          caption="复制 / 导出 / 分享当前通知中心筛选快照"
        />
      </PageShell>
    </main>
  );
}
