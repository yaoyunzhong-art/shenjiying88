'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import {
  DataTable,
  Pagination,
  SearchFilterInput,
  StatusBadge,
  PageShell,
  Tabs,
  usePagination,
  useSearchFilter,
  useSortedItems,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

// ── 类型 ──

interface NotificationItem {
  id: string;
  title: string;
  content: string;
  type: 'system' | 'alert' | 'reminder' | 'announcement';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'archived';
  createdAt: string;
  expiresAt: string;
}

type BadgeVariant = 'success' | 'neutral' | 'warning' | 'danger';

const TYPE_MAP: Record<NotificationItem['type'], { label: string; variant: BadgeVariant }> = {
  system: { label: '系统', variant: 'neutral' },
  alert: { label: '告警', variant: 'danger' },
  reminder: { label: '提醒', variant: 'warning' },
  announcement: { label: '公告', variant: 'success' },
};

const PRIORITY_MAP: Record<NotificationItem['priority'], { label: string; variant: BadgeVariant }> = {
  low: { label: '低', variant: 'neutral' },
  medium: { label: '中', variant: 'success' },
  high: { label: '高', variant: 'warning' },
  urgent: { label: '紧急', variant: 'danger' },
};

const STATUS_MAP: Record<NotificationItem['status'], { label: string; variant: BadgeVariant }> = {
  unread: { label: '未读', variant: 'warning' },
  read: { label: '已读', variant: 'neutral' },
  archived: { label: '已归档', variant: 'neutral' },
};

// ── Mock 数据 ──

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { id: 'n1', title: '系统维护通知', content: '平台将于 2026-06-16 02:00-04:00 进行季度维护。', type: 'system', priority: 'high', status: 'unread', createdAt: '2026-06-14 04:00:00', expiresAt: '2026-06-17 04:00:00' },
  { id: 'n2', title: '新合作品牌上线', content: '品牌 TechCore 已完成入驻配置，可查看品牌详情。', type: 'announcement', priority: 'medium', status: 'unread', createdAt: '2026-06-14 03:30:00', expiresAt: '2026-07-14 03:30:00' },
  { id: 'n3', title: '⚠️ SSL 证书即将过期', content: '您的 SSL 证书将在 7 天内过期，请尽快续期。', type: 'alert', priority: 'urgent', status: 'unread', createdAt: '2026-06-14 03:00:00', expiresAt: '2026-06-28 03:00:00' },
  { id: 'n4', title: 'API 调用配额提醒', content: '您的 API 调用配额已使用 85%，建议评估是否需要扩容。', type: 'reminder', priority: 'medium', status: 'unread', createdAt: '2026-06-14 02:30:00', expiresAt: '2026-06-21 02:30:00' },
  { id: 'n5', title: '门店状态变更', content: '门店「杭州银泰旗舰店」运营状态已更新。', type: 'alert', priority: 'high', status: 'read', createdAt: '2026-06-14 02:00:00', expiresAt: '2026-06-21 02:00:00' },
  { id: 'n6', title: '月度运营报告已发布', content: '2026 年 5 月运营月报已发布，请查看数据摘要。', type: 'announcement', priority: 'low', status: 'read', createdAt: '2026-06-13 18:00:00', expiresAt: '2026-07-13 18:00:00' },
  { id: 'n7', title: '新功能：智能搜索', content: '平台已上线智能搜索功能，支持全文搜索。', type: 'announcement', priority: 'low', status: 'read', createdAt: '2026-06-13 15:00:00', expiresAt: '2026-09-13 15:00:00' },
  { id: 'n8', title: '⚠️ 边缘节点离线', content: '边缘节点 en-019 已离线超过 1 小时，影响相关门店数据同步。', type: 'alert', priority: 'urgent', status: 'unread', createdAt: '2026-06-13 14:30:00', expiresAt: '2026-06-14 14:30:00' },
  { id: 'n9', title: '季度审计报告已生成', content: '2026 Q2 审计报告已自动生成。', type: 'system', priority: 'low', status: 'archived', createdAt: '2026-06-13 12:00:00', expiresAt: '2026-09-30 12:00:00' },
  { id: 'n10', title: '数据备份确认', content: '2026-06-13 全量备份已完成并验证。', type: 'system', priority: 'low', status: 'archived', createdAt: '2026-06-13 08:00:00', expiresAt: '2026-07-13 08:00:00' },
  { id: 'n11', title: '安全补丁已推送', content: '所有节点已接收安全补丁 v2.4.1，修复了 3 个中危漏洞。', type: 'system', priority: 'high', status: 'read', createdAt: '2026-06-12 14:00:00', expiresAt: '2026-06-26 14:00:00' },
  { id: 'n12', title: '敏感数据访问检测', content: '检测到未授权数据访问尝试，已自动阻断。', type: 'alert', priority: 'urgent', status: 'unread', createdAt: '2026-06-14 01:00:00', expiresAt: '2026-06-17 01:00:00' },
  { id: 'n13', title: 'SEO 配置提醒', content: '新加坡市场的 SEO 元数据已过期，建议更新。', type: 'reminder', priority: 'low', status: 'read', createdAt: '2026-06-07 10:00:00', expiresAt: '2026-06-15 10:00:00' },
  { id: 'n14', title: '租户入驻确认', content: '新租户已提交入驻审核，请在管理控制台处理。', type: 'announcement', priority: 'medium', status: 'unread', createdAt: '2026-06-12 16:00:00', expiresAt: '2026-06-15 16:00:00' },
  { id: 'n15', title: '消防安全整改通知', content: '门店消防安全检查结果已发布，请查看整改清单。', type: 'alert', priority: 'high', status: 'unread', createdAt: '2026-06-13 10:00:00', expiresAt: '2026-06-20 10:00:00' },
];

// ── 列定义 ──

function buildColumns(
  onRowClick: (item: NotificationItem) => void,
): DataTableColumn<NotificationItem>[] {
  return [
    {
      key: 'status',
      title: '状态',
      sortable: true,
      render: (item) => {
        const s = STATUS_MAP[item.status];
        return <StatusBadge label={s.label} variant={s.variant} size="sm" dot />;
      },
    },
    {
      key: 'type',
      title: '类型',
      sortable: true,
      render: (item) => {
        const t = TYPE_MAP[item.type];
        return <StatusBadge label={t.label} variant={t.variant} size="sm" />;
      },
    },
    {
      key: 'priority',
      title: '优先级',
      sortable: true,
      sortValue: (item) => ['urgent', 'high', 'medium', 'low'].indexOf(item.priority),
      render: (item) => {
        const p = PRIORITY_MAP[item.priority];
        return <StatusBadge label={p.label} variant={p.variant} size="sm" />;
      },
    },
    {
      key: 'title',
      title: '标题',
      dataKey: 'title',
      sortable: true,
      render: (item) => (
        <span
          onClick={(e) => { e.stopPropagation(); onRowClick(item); }}
          style={{
            color: '#93c5fd', cursor: 'pointer', textDecoration: 'underline',
            fontWeight: item.status === 'unread' ? 600 : 400,
          }}
        >
          {item.title}
        </span>
      ),
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

// ── 页面 ──

export default function TobNotificationsPage() {
  const router = useRouter();
  const searchFields = useMemo<(keyof NotificationItem)[]>(
    () => ['title', 'content'],
    [],
  );
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(
    MOCK_NOTIFICATIONS,
    searchFields,
  );

  // 状态筛选
  const [statusFilter, setStatusFilter] = useState<NotificationItem['status'] | 'ALL'>('ALL');
  const statusFiltered = useMemo(
    () => (statusFilter === 'ALL' ? filteredItems : filteredItems.filter((i) => i.status === statusFilter)),
    [filteredItems, statusFilter],
  );

  // 类型筛选
  const [typeFilter, setTypeFilter] = useState<NotificationItem['type'] | 'ALL'>('ALL');
  const typeFiltered = useMemo(
    () => (typeFilter === 'ALL' ? statusFiltered : statusFiltered.filter((i) => i.type === typeFilter)),
    [statusFiltered, typeFilter],
  );

  // 优先级筛选
  const [priorityFilter, setPriorityFilter] = useState<NotificationItem['priority'] | 'ALL'>('ALL');
  const priorityFiltered = useMemo(
    () => (priorityFilter === 'ALL' ? typeFiltered : typeFiltered.filter((i) => i.priority === priorityFilter)),
    [typeFiltered, priorityFilter],
  );

  // 排序
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>({
    key: 'createdAt',
    direction: 'desc',
  });
  const handleRowClick = useCallback(
    (item: NotificationItem) => router.push(`/notifications/${item.id}`),
    [router],
  );
  const columns = useMemo(() => buildColumns(handleRowClick), [handleRowClick]);
  const sortedItems = useSortedItems(priorityFiltered, columns, sortConfig);

  // 分页
  const pagination = usePagination({ initialPageSize: 10, pageSizeOptions: [5, 10, 15, 20] });
  useEffect(() => { pagination.resetPage(); }, [searchTerm, statusFilter, typeFilter, priorityFilter, pagination]);
  const pageItems = pagination.paginate(sortedItems);

  // 统计
  const stats = useMemo(
    () => ({
      total: MOCK_NOTIFICATIONS.length,
      unread: MOCK_NOTIFICATIONS.filter((n) => n.status === 'unread').length,
      alert: MOCK_NOTIFICATIONS.filter((n) => n.type === 'alert').length,
      urgent: MOCK_NOTIFICATIONS.filter((n) => n.priority === 'urgent').length,
    }),
    [],
  );

  return (
    <main style={{ maxWidth: 1060, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="通知中心"
        subtitle="查看平台通知、告警、提醒和公告，支持按状态、类型和优先级筛选。"
      >
        {/* 统计行 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            marginBottom: 20,
          }}
        >
          {[
            { label: '通知总数', value: stats.total, color: '#e2e8f0', sub: `其中 ${stats.unread} 条未读` },
            { label: '告警', value: stats.alert, color: '#f87171', sub: `${stats.urgent} 条紧急` },
            { label: '未读', value: stats.unread, color: '#fbbf24', sub: `${((stats.unread / stats.total) * 100).toFixed(0)}% 待处理` },
            { label: '已归档', value: stats.total - stats.unread, color: '#94a3b8', sub: '历史通知' },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: 'rgba(15,23,42,0.5)',
                border: '1px solid rgba(148,163,184,0.12)',
                borderRadius: 12,
                padding: '14px 16px',
              }}
            >
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* 搜索 */}
        <div style={{ marginBottom: 12 }}>
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索通知标题 / 内容..."
          />
        </div>

        {/* 状态 Tabs */}
        <div style={{ marginBottom: 12 }}>
          <Tabs
            items={[
              { key: 'ALL', label: '全部', count: MOCK_NOTIFICATIONS.length },
              ...(['unread', 'read', 'archived'] as const).map((s) => ({
                key: s,
                label: STATUS_MAP[s].label,
                count: MOCK_NOTIFICATIONS.filter((i) => i.status === s).length,
              })),
            ]}
            activeKey={statusFilter}
            onChange={(key) => setStatusFilter(key as NotificationItem['status'] | 'ALL')}
            variant="pills"
            size="sm"
          />
        </div>

        {/* 类型 + 优先级 Tabs */}
        <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>通知类型</div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: statusFiltered.length },
                ...(['system', 'alert', 'reminder', 'announcement'] as const).map((t) => ({
                  key: t,
                  label: TYPE_MAP[t].label,
                  count: statusFiltered.filter((i) => i.type === t).length,
                })),
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
                  count: typeFiltered.filter((i) => i.priority === p).length,
                })),
              ]}
              activeKey={priorityFilter}
              onChange={(key) => setPriorityFilter(key as NotificationItem['priority'] | 'ALL')}
              variant="pills"
              size="sm"
            />
          </div>
        </div>

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
      </PageShell>
    </main>
  );
}
