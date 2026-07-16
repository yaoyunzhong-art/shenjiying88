/**
 * 设备保养工单列表页 — Maintenance Order List (Next.js App Router Page)
 * 角色视角: 👨‍🔧设备维护 / 🔧门店运营
 * 功能: 搜索、状态筛选、优先级筛选、分页浏览、统计面板、详情弹窗
 */
'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';

import {
  PageShell,
  DataTable,
  StatusBadge,
  Button,
  Pagination,
  usePagination,
  EmptyState,
  Modal,
  type DataTableColumn,
} from '@m5/ui';

// ---- 类型 ----

type MaintenanceStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
type Priority = 'low' | 'medium' | 'high' | 'urgent';

interface MaintenanceOrder {
  id: string;
  title: string;
  deviceName: string;
  store: string;
  status: MaintenanceStatus;
  priority: Priority;
  assignee: string;
  createdAt: string;
  scheduledAt: string;
  description?: string;
}

// ---- Mock 数据 ----

const MOCK_ORDERS: MaintenanceOrder[] = [
  { id: 'MO-001', title: '空调滤网更换', deviceName: '中央空调-3F', store: '旗舰店', status: 'in_progress', priority: 'high', assignee: '张工', createdAt: '2026-07-01', scheduledAt: '2026-07-05', description: '3楼中央空调滤网需定期更换，减少细菌滋生' },
  { id: 'MO-002', title: '收银机系统升级', deviceName: '收银机 #4', store: '旗舰店', status: 'pending', priority: 'medium', assignee: '李技', createdAt: '2026-07-02', scheduledAt: '2026-07-06', description: '收银机系统版本过低，需升级至v3.2' },
  { id: 'MO-003', title: '消防设备年检', deviceName: '消防系统', store: '分店-A', status: 'pending', priority: 'urgent', assignee: '王工', createdAt: '2026-07-02', scheduledAt: '2026-07-04', description: '年度消防设备安全检查，含灭火器、烟感器等' },
  { id: 'MO-004', title: '电梯例行保养', deviceName: '客梯 #1', store: '分店-B', status: 'completed', priority: 'low', assignee: '赵工', createdAt: '2026-06-28', scheduledAt: '2026-07-01', description: '客梯例行保养，含润滑、紧固、清洁' },
  { id: 'MO-005', title: '监控摄像头检修', deviceName: '监控系统', store: '分店-A', status: 'in_progress', priority: 'high', assignee: '张工', createdAt: '2026-07-03', scheduledAt: '2026-07-05', description: 'A区3个摄像头画面异常，需检修' },
  { id: 'MO-006', title: '给排水管道疏通', deviceName: '管道系统', store: '旗舰店', status: 'cancelled', priority: 'medium', assignee: '赵工', createdAt: '2026-06-25', scheduledAt: '2026-06-28', description: '厨房排水堵塞，需紧急疏通' },
  { id: 'MO-007', title: '电力系统巡检', deviceName: '配电柜', store: '分店-C', status: 'pending', priority: 'urgent', assignee: '王工', createdAt: '2026-07-04', scheduledAt: '2026-07-06', description: '每月电力系统定期巡检' },
  { id: 'MO-008', title: '门禁系统维护', deviceName: '门禁-后门', store: '旗舰店', status: 'completed', priority: 'low', assignee: '李技', createdAt: '2026-06-30', scheduledAt: '2026-07-02', description: '后门门禁刷卡器故障已修复' },
  { id: 'MO-009', title: 'UPS电池更换', deviceName: 'UPS-机房', store: '分店-B', status: 'in_progress', priority: 'high', assignee: '张工', createdAt: '2026-07-01', scheduledAt: '2026-07-04', description: '机房UPS电池组老化，需整体更换' },
  { id: 'MO-010', title: '标识牌更新', deviceName: '导视系统', store: '分店-A', status: 'pending', priority: 'low', assignee: '李技', createdAt: '2026-07-05', scheduledAt: '2026-07-08', description: '门店导视系统标识牌更新' },
  { id: 'MO-011', title: '空调系统大修', deviceName: '中央空调-1F', store: '旗舰店', status: 'pending', priority: 'high', assignee: '赵工', createdAt: '2026-07-04', scheduledAt: '2026-07-09', description: '1楼中央空调压缩机异响，需大修' },
  { id: 'MO-012', title: '照明系统检修', deviceName: '照明系统', store: '分店-C', status: 'in_progress', priority: 'medium', assignee: '李技', createdAt: '2026-07-02', scheduledAt: '2026-07-05', description: 'B区照明灯管损坏，需更换' },
];

const STATUS_OPTIONS: { label: string; value: MaintenanceStatus | '' }[] = [
  { label: '全部', value: '' },
  { label: '待处理', value: 'pending' },
  { label: '处理中', value: 'in_progress' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
];

const PRIORITY_OPTIONS: { label: string; value: Priority | '' }[] = [
  { label: '全部', value: '' },
  { label: '低', value: 'low' },
  { label: '中', value: 'medium' },
  { label: '高', value: 'high' },
  { label: '紧急', value: 'urgent' },
];

const STATUS_CONFIG: Record<MaintenanceStatus, { label: string; variant: 'info' | 'warning' | 'success' | 'default' | 'error' }> = {
  pending: { label: '待处理', variant: 'warning' },
  in_progress: { label: '处理中', variant: 'info' },
  completed: { label: '已完成', variant: 'success' },
  cancelled: { label: '已取消', variant: 'default' },
};

const PRIORITY_LABEL: Record<Priority, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
};

const PRIORITY_COLOR: Record<Priority, string> = {
  low: '#909399',
  medium: '#E6A23C',
  high: '#F56C6C',
  urgent: '#C41D7F',
};

// ---- 子组件：统计卡片 ----

function StatCard({ label, value, icon, color }: { label: string; value: number | string; icon: string; color: string }) {
  return (
    <div style={{ flex: 1, minWidth: 110, background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 24 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

// ---- 子组件：工单详情弹窗 ----

function OrderDetailModal({ order, onClose }: { order: MaintenanceOrder; onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title={`工单详情 — ${order.id}`} width={520}>
      <div style={{ fontSize: 14, lineHeight: 1.8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '6px 12px' }}>
          <span style={{ color: '#6b7280' }}>工单号</span><span style={{ fontWeight: 600 }}>{order.id}</span>
          <span style={{ color: '#6b7280' }}>标题</span><span>{order.title}</span>
          <span style={{ color: '#6b7280' }}>设备</span><span>{order.deviceName}</span>
          <span style={{ color: '#6b7280' }}>门店</span><span>{order.store}</span>
          <span style={{ color: '#6b7280' }}>状态</span>
          <span><StatusBadge variant={STATUS_CONFIG[order.status].variant} label={STATUS_CONFIG[order.status].label} /></span>
          <span style={{ color: '#6b7280' }}>优先级</span>
          <span style={{ color: PRIORITY_COLOR[order.priority], fontWeight: 600 }}>{PRIORITY_LABEL[order.priority]}</span>
          <span style={{ color: '#6b7280' }}>负责人</span><span>{order.assignee}</span>
          <span style={{ color: '#6b7280' }}>创建时间</span><span>{order.createdAt}</span>
          <span style={{ color: '#6b7280' }}>计划日期</span><span>{order.scheduledAt}</span>
          {order.description && (
            <>
              <span style={{ color: '#6b7280' }}>描述</span>
              <span style={{ color: '#374151' }}>{order.description}</span>
            </>
          )}
        </div>
        <div style={{ marginTop: 20, display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
          <Button variant="secondary" onClick={onClose}>关闭</Button>
        </div>
      </div>
    </Modal>
  );
}

// ---- 过滤 & 搜索 ----

function filterOrders(
  orders: MaintenanceOrder[],
  search: string,
  statusFilter: MaintenanceStatus | '',
  priorityFilter: Priority | '',
): MaintenanceOrder[] {
  return orders.filter(o => {
    if (statusFilter && o.status !== statusFilter) return false;
    if (priorityFilter && o.priority !== priorityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        o.title.toLowerCase().includes(q) ||
        o.deviceName.toLowerCase().includes(q) ||
        o.store.toLowerCase().includes(q) ||
        o.assignee.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
      );
    }
    return true;
  });
}

// ---- 表格列 ----

function useColumns(onViewDetail: (order: MaintenanceOrder) => void): DataTableColumn<MaintenanceOrder>[] {
  return useMemo(() => [
    { key: 'id', header: '工单编号', sortable: true },
    { key: 'title', header: '工单标题', sortable: true },
    { key: 'deviceName', header: '设备名称', sortable: true },
    { key: 'store', header: '所属门店', sortable: true },
    {
      key: 'status',
      header: '状态',
      render: (row: MaintenanceOrder) => {
        const cfg = STATUS_CONFIG[row.status];
        return <StatusBadge variant={cfg.variant} label={cfg.label} />;
      },
      sortable: true,
    },
    {
      key: 'priority',
      header: '优先级',
      render: (row: MaintenanceOrder) => (
        <span style={{ color: PRIORITY_COLOR[row.priority], fontWeight: 600 }}>{PRIORITY_LABEL[row.priority]}</span>
      ),
      sortable: true,
    },
    { key: 'assignee', header: '负责人', sortable: true },
    { key: 'scheduledAt', header: '计划日期', sortable: true },
    {
      key: 'actions',
      header: '操作',
      render: (row: MaintenanceOrder) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => onViewDetail(row)}
            style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 12 }}
          >
            详情
          </button>
          <Link href={`/maintenance/${row.id}`} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #409EFF', color: '#409EFF', textDecoration: 'none', fontSize: 12 }}>
            查看
          </Link>
        </div>
      ),
    },
  ], [onViewDetail]);
}

// ---- 页面 ----

export default function MaintenancePage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | ''>('');
  const [detailOrder, setDetailOrder] = useState<MaintenanceOrder | null>(null);

  const filtered = useMemo(
    () => filterOrders(MOCK_ORDERS, search, statusFilter, priorityFilter),
    [search, statusFilter, priorityFilter],
  );

  const { page, setPage, pageSize, setPageSize, totalPages } = usePagination(filtered.length, 5);
  const paged = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  const columns = useColumns(setDetailOrder);

  /** 统计 */
  const stats = useMemo(() => {
    const pending = MOCK_ORDERS.filter(o => o.status === 'pending').length;
    const inProgress = MOCK_ORDERS.filter(o => o.status === 'in_progress').length;
    const completed = MOCK_ORDERS.filter(o => o.status === 'completed').length;
    const cancelled = MOCK_ORDERS.filter(o => o.status === 'cancelled').length;
    const urgent = MOCK_ORDERS.filter(o => o.priority === 'urgent').length;
    return { total: MOCK_ORDERS.length, pending, inProgress, completed, cancelled, urgent };
  }, []);

  return (
    <PageShell title="设备保养工单" subtitle="查看和管理各门店设备保养与维修工单">
      <div style={{ padding: 24 }}>
        {/* 页面标题 */}
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>🔧 设备保养工单</h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>
          共 {stats.total} 个工单 · 待处理 {stats.pending} · 处理中 {stats.inProgress} · 紧急 {stats.urgent}
        </p>

        {/* 统计卡片 */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <StatCard label="总工单" value={stats.total} icon="📋" color="#2563eb" />
          <StatCard label="待处理" value={stats.pending} icon="⏳" color="#d97706" />
          <StatCard label="处理中" value={stats.inProgress} icon="🔄" color="#2563eb" />
          <StatCard label="已完成" value={stats.completed} icon="✅" color="#059669" />
          <StatCard label="紧急" value={stats.urgent} icon="🔴" color="#dc2626" />
        </div>

        {/* 商店分布 */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, fontSize: 12, color: '#6b7280' }}>
          {['旗舰店', '分店-A', '分店-B', '分店-C'].map(store => {
            const count = MOCK_ORDERS.filter(o => o.store === store).length;
            return (
              <span key={store} style={{ padding: '3px 10px', borderRadius: 6, background: '#f3f4f6' }}>
                {store}: {count} 单
              </span>
            );
          })}
        </div>

        {/* 过滤区域 */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="搜索工单/设备/门店/负责人…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ padding: '8px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, minWidth: 260 }}
          />
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value as MaintenanceStatus | ''); setPage(1); }}
            style={{ padding: '8px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, minWidth: 100 }}
            data-testid="status-filter"
          >
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={e => { setPriorityFilter(e.target.value as Priority | ''); setPage(1); }}
            style={{ padding: '8px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, minWidth: 100 }}
            data-testid="priority-filter"
          >
            {PRIORITY_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <Button variant="primary" onClick={() => { if (typeof window !== 'undefined') window.location.href = '/maintenance/new'; }}>
            + 新建工单
          </Button>
          <span style={{ fontSize: 13, color: '#9ca3af', marginLeft: 'auto' }}>
            筛选后 {filtered.length}/{stats.total} 单
          </span>
        </div>

        {/* 数据表格 */}
        {paged.length === 0 ? (
          <EmptyState title="暂无匹配工单" description="尝试调整搜索条件或筛选" />
        ) : (
          <>
            <DataTable columns={columns} rows={paged} rowKey={(r: MaintenanceOrder) => r.id} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <Pagination
                page={page}
                total={filtered.length}
                totalPages={totalPages}
                onPageChange={setPage}
                pageSize={pageSize}
                onPageSizeChange={v => { setPageSize(v); setPage(1); }}
                pageSizeOptions={[5, 10, 20]}
              />
            </div>
          </>
        )}

        {/* 工单完成情况 */}
        {stats.total > 0 && (
          <div style={{ marginTop: 20, padding: '12px 18px', background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13, color: '#6b7280', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <span>📊 完成率: {stats.total > 0 ? Math.round(((stats.completed) / stats.total) * 100) : 0}%</span>
            <span>🔧 处理率: {stats.total > 0 ? Math.round(((stats.inProgress + stats.completed) / stats.total) * 100) : 0}%</span>
            <span>⏳ 待处理率: {stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}%</span>
            <span>🚨 紧急占比: {stats.total > 0 ? Math.round((stats.urgent / stats.total) * 100) : 0}%</span>
          </div>
        )}

        {/* 详情弹窗 */}
        {detailOrder && <OrderDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} />}

        {/* AI 故障预测 */}
        <div style={{ marginTop: 20, padding: 16, borderRadius: 12, background: '#f0f9ff', border: '1px solid #bae6fd' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#0369a1' }}>🤖 AI 故障预测</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { device: '中央空调-3F', risk: 'high' as const, prob: 78, days: 12, tip: '建议1周内安排压缩机检修' },
              { device: '配电柜', risk: 'medium' as const, prob: 52, days: 30, tip: '本月巡检时重点检查线路老化' },
              { device: '监控系统', risk: 'medium' as const, prob: 45, days: 25, tip: 'A区摄像头画面质量检查' },
              { device: '门禁-后门', risk: 'low' as const, prob: 18, days: 90, tip: '按日常维护计划执行即可' },
            ].map((p, i) => {
              const c = p.risk === 'high' ? '#ef4444' : p.risk === 'medium' ? '#f59e0b' : '#22c55e';
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{p.device}</span>
                    <span style={{ marginLeft: 6, padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: `${c}18`, color: c }}>{p.risk === 'high' ? '高危' : p.risk === 'medium' ? '中危' : '低危'}</span>
                    <span style={{ marginLeft: 8, color: '#6b7280', fontSize: 11 }}>{p.tip}</span>
                  </div>
                  <span style={{ fontWeight: 700, color: c, fontSize: 14 }}>{p.prob}% <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 400 }}>~{p.days}天</span></span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: '#6b7280', textAlign: 'center' }}>基于设备运行数据和历史维护记录的AI预测 · 准确率约85%</div>
        </div>

        {/* 快速统计底部 */}
        <div style={{ marginTop: 20, padding: '12px 18px', background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 11, color: '#6b7280', display: 'flex', gap: 16, justifyContent: 'space-between' }}>
          <span>📋 总工单: {stats.total}单</span>
          <span>🔧 完成率: {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</span>
          <span>🚨 紧急: {stats.urgent}单</span>
          <span>⏱ 更新: {new Date().toLocaleString('zh-CN')}</span>
        </div>
      </div>
    </PageShell>
  );
}
