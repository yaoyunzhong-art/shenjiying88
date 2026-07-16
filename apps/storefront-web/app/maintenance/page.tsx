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

        {/* 设备分类统计 */}
        <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#5b21b6' }}>🔩 设备分类统计</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
            {[
              { name: '收银POS', active: 6, total: 8, faultRate: 12 },
              { name: '游戏主机', active: 24, total: 30, faultRate: 8 },
              { name: '打印机', active: 4, total: 6, faultRate: 15 },
              { name: '网络设备', active: 3, total: 3, faultRate: 5 },
              { name: '监控', active: 12, total: 14, faultRate: 3 },
              { name: '空调', active: 5, total: 6, faultRate: 10 },
            ].map((cat, i) => (
              <div key={i} style={{ padding: 10, borderRadius: 8, background: '#fff', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{cat.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b7280' }}>
                  <span>运行 {cat.active}/{cat.total}</span>
                  <span style={{ color: cat.faultRate > 10 ? '#dc2626' : '#059669' }}>{cat.faultRate}%故障</span>
                </div>
                <div style={{ marginTop: 4, height: 4, borderRadius: 2, background: '#e5e7eb', overflow: 'hidden' }}>
                  <div style={{ width: `${(cat.active / cat.total) * 100}%`, height: '100%', borderRadius: 2, background: cat.faultRate > 10 ? '#f87171' : '#34d399' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 维护周期设置 */}
        <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: '#fff7ed', border: '1px solid #fed7aa' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#9a3412' }}>⏰ 定期维护计划</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 8 }}>
            {[
              { name: '收银系统维护', type: '月度', nextDate: '2026-07-20', assignee: '王工', priority: '高' },
              { name: '游戏机固件更新', type: '季度', nextDate: '2026-08-05', assignee: '李工', priority: '中' },
              { name: '空调清洗保养', type: '月度', nextDate: '2026-07-25', assignee: '张工', priority: '中' },
              { name: '网络设备巡检', type: '每周', nextDate: '2026-07-18', assignee: '赵工', priority: '高' },
              { name: '消防设备检查', type: '季度', nextDate: '2026-09-01', assignee: '陈工', priority: '紧急' },
              { name: '照明系统更换', type: '半年', nextDate: '2026-12-15', assignee: '周工', priority: '低' },
            ].map((plan, i) => (
              <div key={i} style={{ padding: 10, borderRadius: 8, background: '#fff', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{plan.name}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{plan.type} · 负责人: {plan.assignee}</div>
                <div style={{ fontSize: 11, color: plan.priority === '紧急' ? '#dc2626' : plan.priority === '高' ? '#d97706' : '#6b7280', marginTop: 2 }}>
                  下次: {plan.nextDate} · {plan.priority}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 历史维护趋势 */}
        <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: '#ecfeff', border: '1px solid #a5f3fc' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#0e7490' }}>📈 月度维护趋势</h3>
          <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 80, padding: '10px 0' }}>
            {[
              { month: '1月', completed: 18, urgent: 3 },
              { month: '2月', completed: 22, urgent: 2 },
              { month: '3月', completed: 15, urgent: 5 },
              { month: '4月', completed: 25, urgent: 1 },
              { month: '5月', completed: 20, urgent: 4 },
              { month: '6月', completed: 28, urgent: 2 },
            ].map((m, i) => {
              const maxVal = 28;
              const barH = (m.completed / maxVal) * 65;
              const urgentH = (m.urgent / maxVal) * 65;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ width: '100%', display: 'flex', gap: 2, alignItems: 'flex-end', justifyContent: 'center' }}>
                    <div style={{ width: 16, height: `${barH}px`, borderRadius: '3px 3px 0 0', background: 'rgba(6,182,212,0.5)' }} />
                    <div style={{ width: 16, height: `${urgentH}px`, borderRadius: '3px 3px 0 0', background: 'rgba(248,113,113,0.5)' }} />
                  </div>
                  <div style={{ fontSize: 9, color: '#6b7280', marginTop: 4 }}>{m.month}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#6b7280' }}>
            <span><span style={{ color: 'rgba(6,182,212,0.7)' }}>■</span> 已完成</span>
            <span><span style={{ color: 'rgba(248,113,113,0.7)' }}>■</span> 紧急</span>
          </div>
        </div>

        {/* 备件库存告警 */}
        <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#991b1b' }}>📦 备件库存告警</h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { name: '打印机墨盒', current: 2, min: 10, unit: '个' },
              { name: 'USB数据线', current: 5, min: 20, unit: '条' },
              { name: '屏幕膜', current: 3, min: 15, unit: '张' },
              { name: '电源适配器', current: 1, min: 5, unit: '个' },
              { name: '鼠标键盘', current: 4, min: 10, unit: '套' },
            ].map((item, i) => (
              <div key={i} style={{ flex: '1 1 100px', padding: 10, borderRadius: 8, background: '#fff', border: '1px solid #fecaca', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#374151', marginBottom: 2 }}>{item.name}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#dc2626' }}>{item.current}<span style={{ fontSize: 11, color: '#9ca3af' }}>/{item.min}{item.unit}</span></div>
                <div style={{ fontSize: 10, color: '#dc2626' }}>需补货</div>
              </div>
            ))}
          </div>
        </div>

        {/* 最近维护工单记录 */}
        <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#166534' }}>📋 最近维护工单 (5条)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { id: 'WO-001', device: 'POS机-01', desc: '系统卡顿重启', status: '已完成', priority: '高', date: '07-15' },
              { id: 'WO-002', device: '游戏机-03', desc: '投币器故障', status: '已完成', priority: '紧急', date: '07-15' },
              { id: 'WO-003', device: '空调-02', desc: '制冷异常', status: '进行中', priority: '高', date: '07-16' },
              { id: 'WO-004', device: '打印机-01', desc: '打印模糊', status: '待处理', priority: '中', date: '07-16' },
              { id: 'WO-005', device: '摄像头-05', desc: '画面黑屏', status: '待处理', priority: '中', date: '07-16' },
            ].map((wo, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#fff', borderRadius: 8, border: '1px solid #dcfce7', fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 500, color: '#6b7280' }}>{wo.id}</span>
                  <span style={{ fontWeight: 600 }}>{wo.device}</span>
                  <span style={{ color: '#9ca3af' }}>{wo.desc}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 10, background: wo.status === '已完成' ? '#f0fdf4' : wo.status === '进行中' ? '#fffbeb' : '#f3f4f6', color: wo.status === '已完成' ? '#16a34a' : wo.status === '进行中' ? '#d97706' : '#6b7280' }}>{wo.status}</span>
                  <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 10, background: wo.priority === '紧急' ? '#fef2f2' : wo.priority === '高' ? '#fff7ed' : '#f3f4f6', color: wo.priority === '紧急' ? '#dc2626' : wo.priority === '高' ? '#d97706' : '#6b7280' }}>{wo.priority}</span>
                  <span style={{ color: '#9ca3af' }}>{wo.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 维护人员业绩排行 */}
        <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: '#fff7ed', border: '1px solid #fed7aa' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#9a3412' }}>🏆 维护人员业绩排行</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[
              { name: '王工', completed: 42, urgent: 8, score: 98, satisfaction: '4.9' },
              { name: '李工', completed: 38, urgent: 5, score: 92, satisfaction: '4.7' },
              { name: '张工', completed: 35, urgent: 6, score: 88, satisfaction: '4.5' },
              { name: '赵工', completed: 30, urgent: 3, score: 82, satisfaction: '4.3' },
              { name: '陈工', completed: 28, urgent: 10, score: 78, satisfaction: '4.1' },
            ].map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                <span style={{ fontWeight: 700, color: i < 3 ? '#d97706' : '#6b7280', minWidth: 20 }}>#{i + 1}</span>
                <span style={{ flex: 1, fontWeight: 500, fontSize: 13 }}>{p.name}</span>
                <div style={{ fontSize: 11, color: '#6b7280' }}>
                  完成 {p.completed}单 · 紧急 {p.urgent}单
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#d97706' }}>{p.score}分</div>
                  <div style={{ fontSize: 10, color: '#9ca3af' }}>满意度 {p.satisfaction}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 维护成本分析 */}
        <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#166534' }}>💰 维护成本分析 (本月)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
            {[
              { label: '配件采购', value: '¥3,850', percent: 42, color: '#22c55e' },
              { label: '人工费用', value: '¥2,600', percent: 28, color: '#3b82f6' },
              { label: '外包服务', value: '¥1,800', percent: 19, color: '#a855f7' },
              { label: '其他', value: '¥1,000', percent: 11, color: '#f59e0b' },
            ].map((c, i) => (
              <div key={i} style={{ padding: 10, borderRadius: 8, background: '#fff', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{c.label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: c.color }}>{c.value}</div>
                <div style={{ marginTop: 4, height: 4, borderRadius: 2, background: '#e5e7eb', overflow: 'hidden' }}>
                  <div style={{ width: `${c.percent}%`, height: '100%', borderRadius: 2, background: c.color }} />
                </div>
                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{c.percent}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* 快速统计底部 */}
        <div style={{ marginTop: 20, padding: '12px 18px', background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 11, color: '#6b7280', display: 'flex', gap: 16, justifyContent: 'space-between' }}>

        {/* 维护工程师能力评分 */}
        <div style={{ marginTop: 20, padding: 16, borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#166534' }}>👨‍🔧 维护工程师能力评分</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[
              { name: '李明', title: '高级工程师', completed: 48, avgTime: '1.2h', praise: 98, color: '#22c55e' },
              { name: '王飞', title: '工程师', completed: 36, avgTime: '1.5h', praise: 94, color: '#16a34a' },
              { name: '张浩', title: '高级工程师', completed: 42, avgTime: '1.3h', praise: 96, color: '#15803d' },
              { name: '刘洋', title: '工程师', completed: 29, avgTime: '1.8h', praise: 91, color: '#65a30d' },
              { name: '陈磊', title: '初级工程师', completed: 22, avgTime: '2.1h', praise: 87, color: '#84cc16' },
            ].map(function(e, i) {
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6, background: '#fff', border: '1px solid #bbf7d0', fontSize: 12 }}>
                  <span style={{ fontWeight: 600, color: '#166534', width: 56 }}>{e.name}</span>
                  <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#f0fdf4', color: '#15803d', minWidth: 72 }}>{e.title}</span>
                  <span style={{ fontSize: 10, color: '#374151', minWidth: 70, textAlign: 'center' }}>完成 {e.completed}单</span>
                  <span style={{ fontSize: 10, color: '#6b7280', minWidth: 56, textAlign: 'center' }}>⏱ {e.avgTime}/单</span>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#e5e7eb', overflow: 'hidden' }}>
                    <div style={{ width: e.praise + '%', height: '100%', borderRadius: 3, background: e.color }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#166534', minWidth: 40, textAlign: 'right' }}>{e.praise}%</span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: '#15803d', textAlign: 'center' }}>
            📊 团队平均好评率 {(94).toFixed(1)}% · 人均完成工单 {((48+36+42+29+22)/5).toFixed(0)}单
          </div>
          <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, fontSize: 10 }}>
            <div style={{ padding: '4px 6px', borderRadius: 4, background: '#f0fdf4', border: '1px solid #d1fae5', textAlign: 'center' }}>
              <div style={{ fontWeight: 600, color: '#166534' }}>最佳工程师</div>
              <span style={{ color: '#059669' }}>李明 98%</span>
            </div>
            <div style={{ padding: '4px 6px', borderRadius: 4, background: '#f0fdf4', border: '1px solid #d1fae5', textAlign: 'center' }}>
              <div style={{ fontWeight: 600, color: '#166534' }}>最多工单</div>
              <span style={{ color: '#16a34a' }}>李明 48单</span>
            </div>
            <div style={{ padding: '4px 6px', borderRadius: 4, background: '#f0fdf4', border: '1px solid #d1fae5', textAlign: 'center' }}>
              <div style={{ fontWeight: 600, color: '#166534' }}>最快维修</div>
              <span style={{ color: '#06b6d4' }}>李明 1.2h</span>
            </div>
            <div style={{ padding: '4px 6px', borderRadius: 4, background: '#f0fdf4', border: '1px solid #d1fae5', textAlign: 'center' }}>
              <div style={{ fontWeight: 600, color: '#166534' }}>待提升</div>
              <span style={{ color: '#d97706' }}>陈磊 87%</span>
            </div>
          </div>
        </div>

        {/* 维护工单按优先级分布 */}
        <div style={{ marginTop: 20, padding: 16, borderRadius: 12, background: '#fefce8', border: '1px solid #fde68a' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#92400e' }}>🔴 维护工单按优先级分布</h3>
          {function(orders: MaintenanceOrder[]) {
            var urgent = orders.filter(function(o) { return o.priority === 'urgent'; }).length;
            var high = orders.filter(function(o) { return o.priority === 'high'; }).length;
            var medium = orders.filter(function(o) { return o.priority === 'medium'; }).length;
            var low = orders.filter(function(o) { return o.priority === 'low'; }).length;
            var total = orders.length;
            var items = [
              { label: '紧急', count: urgent, color: '#dc2626', bg: '#fef2f2' },
              { label: '高', count: high, color: '#f97316', bg: '#fff7ed' },
              { label: '中', count: medium, color: '#eab308', bg: '#fefce8' },
              { label: '低', count: low, color: '#6b7280', bg: '#f3f4f6' },
            ];
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {items.map(function(item, idx) {
                  var pct = total > 0 ? Math.round(item.count / total * 100) : 0;
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: '#fff', border: '1px solid ' + item.color + '40' }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: item.color, minWidth: 32 }}>{item.label}</span>
                      <div style={{ flex: 1, height: 10, borderRadius: 5, background: '#e5e7eb', overflow: 'hidden' }}>
                        <div style={{ width: pct + '%', height: '100%', borderRadius: 5, background: item.color, transition: 'width 0.3s' }} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 14, color: item.color, minWidth: 60, textAlign: 'right' }}>{item.count}单</span>
                      <span style={{ fontSize: 11, color: '#9ca3af', minWidth: 36, textAlign: 'right' }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            );
          }(MOCK_ORDERS)}
        </div>

        {/* 工单按门店分布 */}
        <div style={{ marginTop: 20, padding: 16, borderRadius: 12, background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#5b21b6' }}>🏪 各门店工单分布</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[
              { store: '北京朝阳店', open: 3, inProgress: 5, completed: 18, total: 26 },
              { store: '上海浦东店', open: 2, inProgress: 4, completed: 22, total: 28 },
              { store: '广州天河店', open: 1, inProgress: 6, completed: 15, total: 22 },
              { store: '深圳南山店', open: 4, inProgress: 3, completed: 12, total: 19 },
              { store: '成都锦江店', open: 2, inProgress: 2, completed: 10, total: 14 },
            ].map(function(st, i) {
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6, background: '#fff', border: '1px solid #e9d5ff', fontSize: 12 }}>
                  <span style={{ fontWeight: 600, color: '#5b21b6', width: 90 }}>{st.store}</span>
                  <div style={{ flex: 1, display: 'flex', gap: 4 }}>
                    <span style={{ fontSize: 10, color: '#ef4444' }}>待处理 {st.open}</span>
                    <span style={{ fontSize: 10, color: '#f59e0b' }}>进行中 {st.inProgress}</span>
                    <span style={{ fontSize: 10, color: '#16a34a' }}>已完成 {st.completed}</span>
                  </div>
                  <span style={{ color: '#6b7280' }}>总计 {st.total}单</span>
                  <div style={{ width: 50, height: 6, borderRadius: 3, background: '#e5e7eb', overflow: 'hidden' }}>
                    <div style={{ width: Math.round(st.completed / st.total * 100) + '%', height: '100%', borderRadius: 3, background: '#7c3aed' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 设备维护周期合规率 */}
        <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#5b21b6' }}>🔁 设备维护周期合规率</h3>
          <p style={{ margin: '0 0 12px', fontSize: 11, color: '#6b7280' }}>各设备类型的定期维护执行率 — 按时完成维护的工单占比</p>
          {function(deviceTypes, i) {
            var maxRate = Math.max.apply(null, deviceTypes.map(function(d) { return d.rate; }));
            return (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {deviceTypes.map(function(d, idx) {
                    var barPct = maxRate > 0 ? Math.round((d.rate / maxRate) * 100) : 0;
                    var statusColor = d.rate >= 90 ? '#22c55e' : d.rate >= 75 ? '#f59e0b' : '#ef4444';
                    var statusLabel = d.rate >= 90 ? '优秀' : d.rate >= 75 ? '注意' : '告警';
                    return (
                      <div key={idx} style={{ padding: '8px 12px', borderRadius: 8, background: '#fff', border: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 16 }}>{d.icon}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{d.name}</span>
                            <span style={{ fontSize: 11, color: '#6b7280' }}>{d.type}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 16, fontWeight: 700, color: statusColor }}>{d.rate}%</span>
                            <span style={{ padding: '1px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: statusColor + '18', color: statusColor }}>{statusLabel}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 8, borderRadius: 4, background: '#e5e7eb', overflow: 'hidden' }}>
                            <div style={{ width: barPct + '%', height: '100%', borderRadius: 4, background: statusColor, transition: 'width 0.4s' }} />
                          </div>
                        </div>
                        <div style={{ marginTop: 4, display: 'flex', gap: 12, fontSize: 10, color: '#9ca3af' }}>
                          <span>🕒 周期: {d.cycleDays}天/次</span>
                          <span>✅ 按时完成: {d.completed}次</span>
                          <span>⏳ 延误: {d.overdue}次</span>
                          <span>📋 计划: {d.planned}次</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  <div style={{ padding: '8px 12px', borderRadius: 6, background: '#f0fdf4', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#22c55e' }}>
                      {Math.round(deviceTypes.reduce(function(s, d) { return s + d.rate; }, 0) / deviceTypes.length)}%
                    </div>
                    <div style={{ fontSize: 10, color: '#16a34a' }}>整体合规率</div>
                  </div>
                  <div style={{ padding: '8px 12px', borderRadius: 6, background: '#fef2f2', border: '1px solid #fecaca', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#ef4444' }}>
                      {deviceTypes.filter(function(d) { return d.rate < 75; }).length}类
                    </div>
                    <div style={{ fontSize: 10, color: '#dc2626' }}>需改进设备</div>
                  </div>
                  <div style={{ padding: '8px 12px', borderRadius: 6, background: '#fffbeb', border: '1px solid #fde68a', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#f59e0b' }}>
                      {deviceTypes.reduce(function(s, d) { return s + d.overdue; }, 0)}次
                    </div>
                    <div style={{ fontSize: 10, color: '#d97706' }}>累计延误</div>
                  </div>
                </div>
                {function(types) {
                  if (types.length === 0) return <span>暂无设备数据</span>;
                  var best: any = types[0];
                  var worst: any = types[0];
                  for (var j = 1; j < types.length; j++) {
                    var t: any = types[j];
                    if (t.rate > best.rate) { best = t; }
                    if (t.rate < worst.rate) { worst = t; }
                  }
                  return (
                    <div style={{ marginTop: 8, padding: '6px 12px', borderRadius: 6, background: '#f9fafb', border: '1px solid #e5e7eb', fontSize: 11, color: '#6b7280', display: 'flex', justifyContent: 'space-between' }}>
                      <span>🏆 最佳: {best.name} ({best.rate}%)</span>
                      <span>⚠️ 最差: {worst.name} ({worst.rate}%)</span>
                      <span>💡 建议加大空调和打印机的巡检频率</span>
                    </div>
                  );
                }(deviceTypes)}
              </div>
            );
          }([
            { name: '中央空调系统', icon: '❄️', type: '暖通', rate: 88, cycleDays: 30, completed: 22, overdue: 3, planned: 25 },
            { name: '收银POS机', icon: '💳', type: 'IT设备', rate: 96, cycleDays: 15, completed: 48, overdue: 2, planned: 50 },
            { name: '监控系统', icon: '📹', type: '安防', rate: 92, cycleDays: 45, completed: 12, overdue: 1, planned: 13 },
            { name: '消防设备', icon: '🔥', type: '安全', rate: 100, cycleDays: 90, completed: 4, overdue: 0, planned: 4 },
            { name: '打印机', icon: '🖨️', type: 'IT设备', rate: 72, cycleDays: 60, completed: 8, overdue: 3, planned: 11 },
            { name: '网络设备', icon: '🌐', type: 'IT设备', rate: 94, cycleDays: 20, completed: 28, overdue: 2, planned: 30 },
            { name: '照明系统', icon: '💡', type: '电气', rate: 85, cycleDays: 90, completed: 5, overdue: 1, planned: 6 },
            { name: '游戏终端', icon: '🎮', type: '娱乐', rate: 78, cycleDays: 14, completed: 42, overdue: 12, planned: 54 },
            { name: '门禁系统', icon: '🚪', type: '安防', rate: 90, cycleDays: 60, completed: 6, overdue: 1, planned: 7 },
          ], 0)}
        </div>

        {/* 维护工程师紧急响应时效 */}
        <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca' }}>
          <h3 style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 600, color: '#b91c1c' }}>🚨 维护工程师紧急响应时效</h3>
          {function(s,i) { return ( <div style={{display:'flex',gap:4,alignItems:'flex-end',height:60,padding:'2px 0'}}>{[{n:'张',t:12},{n:'李',t:18},{n:'王',t:25},{n:'陈',t:8},{n:'刘',t:35}].map(function(e,idx){var h=e.t/35*48;return (<div key={idx} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center'}}><span style={{fontSize:9,fontWeight:600,color:e.t>30?'#ef4444':e.t>15?'#f59e0b':'#22c55e'}}>{e.t}min</span><div style={{width:24,height:h,borderRadius:'3px 3px 0 0',background:e.t>30?'#ef4444':e.t>15?'#f59e0b':'#22c55e',marginTop:1}}/><span style={{fontSize:8,color:'#6b7280',marginTop:1}}>{e.n}师傅</span></div>);})}</div>); }([])}
          <div style={{ marginTop: 2, fontSize: 9, color: '#9ca3af', textAlign: 'center' }}>平均 {Math.round([12,18,25,8,35].reduce(function(a,b){return a+b})/5)}min · 🏆 陈师傅最快  ⚠️ 刘师傅最慢</div>
        </div>

        {/* 维护工单趋势 */}
        <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: '#f0f9ff', border: '1px solid #bae6fd' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#0369a1' }}>📈 近半年工单趋势</h3>
          <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 80, padding: '4px 0' }}>
            {[
              { month: '2月', total: 82, completed: 60, color: '#3b82f6' },
              { month: '3月', total: 95, completed: 72, color: '#3b82f6' },
              { month: '4月', total: 78, completed: 65, color: '#3b82f6' },
              { month: '5月', total: 110, completed: 88, color: '#3b82f6' },
              { month: '6月', total: 98, completed: 82, color: '#3b82f6' },
            ].map(function(m, i) {
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 65 }}>
                    <div style={{ width: 12, height: (m.total / 2) + 'px', borderRadius: '2px 2px 0 0', background: '#93c5fd' }} />
                    <div style={{ width: 12, height: (m.completed / 2) + 'px', borderRadius: '2px 2px 0 0', background: '#3b82f6' }} />
                  </div>
                  <div style={{ fontSize: 9, color: '#6b7280', marginTop: 2 }}>{m.month}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
            <span><span style={{ color: '#93c5fd' }}>■</span> 总工单</span>
            <span><span style={{ color: '#3b82f6' }}>■</span> 已完成</span>
          </div>
        </div>

        {/* 维护耗材库存预警 */}
        <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: '#fffbeb', border: '1px solid #fde68a' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#92400e' }}>📦 维护耗材库存预警</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
            {[
              { name: '空调滤网', stock: 3, threshold: 20, unit: '个', status: '告警', color: '#ef4444' },
              { name: '润滑油', stock: 8, threshold: 15, unit: '桶', status: '不足', color: '#f59e0b' },
              { name: '螺丝套装', stock: 45, threshold: 30, unit: '套', status: '正常', color: '#22c55e' },
              { name: '传感器', stock: 2, threshold: 10, unit: '个', status: '告警', color: '#ef4444' },
              { name: '电源模块', stock: 4, threshold: 8, unit: '块', status: '不足', color: '#f59e0b' },
              { name: '数据线', stock: 25, threshold: 20, unit: '条', status: '正常', color: '#22c55e' },
              { name: '保险丝', stock: 1, threshold: 12, unit: '盒', status: '告警', color: '#ef4444' },
              { name: '轴承', stock: 6, threshold: 10, unit: '个', status: '不足', color: '#f59e0b' },
            ].map(function(item, i) {
              return (
                <div key={i} style={{ padding: 10, borderRadius: 8, background: '#fff', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{item.name}</span>
                    <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: item.status === '告警' ? '#fef2f2' : item.status === '不足' ? '#fffbeb' : '#f0fdf4', color: item.color }}>{item.status}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.stock}<span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 400 }}>/{item.threshold}{item.unit}</span></div>
                  <div style={{ marginTop: 4, height: 4, borderRadius: 2, background: '#e5e7eb', overflow: 'hidden' }}>
                    <div style={{ width: Math.min(100, (item.stock / item.threshold) * 100) + '%', height: '100%', borderRadius: 2, background: item.color }} />
                  </div>
                  <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 2 }}>{item.stock < item.threshold ? '需补货 ' + (item.threshold - item.stock) + item.unit : '库存充足'}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 维护成本分布 */}
        <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: '#f0f9ff', border: '1px solid #bae6fd' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#0369a1' }}>💰 维护成本分布（月度趋势）</h3>
          <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 80, padding: '4px 0' }}>
            {[
              { month: '3月', parts: 3200, labor: 2400, outsource: 1500, color: '#22c55e' },
              { month: '4月', parts: 2800, labor: 2600, outsource: 1800, color: '#22c55e' },
              { month: '5月', parts: 4100, labor: 2200, outsource: 1200, color: '#22c55e' },
              { month: '6月', parts: 3600, labor: 2800, outsource: 2000, color: '#22c55e' },
              { month: '本月', parts: 3850, labor: 2600, outsource: 1800, color: '#22c55e' },
            ].map(function(m, i) {
              const maxVal = 4100;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 65 }}>
                    <div style={{ width: 10, height: (m.parts / maxVal) * 60 + 'px', borderRadius: '2px 2px 0 0', background: '#22c55e' }} />
                    <div style={{ width: 10, height: (m.labor / maxVal) * 60 + 'px', borderRadius: '2px 2px 0 0', background: '#3b82f6' }} />
                    <div style={{ width: 10, height: (m.outsource / maxVal) * 60 + 'px', borderRadius: '2px 2px 0 0', background: '#a855f7' }} />
                  </div>
                  <div style={{ fontSize: 9, color: '#6b7280', marginTop: 2 }}>{m.month}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#64748b', marginTop: 4 }}>
            <span><span style={{ color: '#22c55e' }}>■</span> 配件</span>
            <span><span style={{ color: '#3b82f6' }}>■</span> 人工</span>
            <span><span style={{ color: '#a855f7' }}>■</span> 外包</span>
          </div>
          <div style={{ marginTop: 8, padding: 8, borderRadius: 8, background: '#fff', border: '1px solid #e5e7eb', fontSize: 11, color: '#6b7280', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { label: '配件采购', value: '¥3,850', pct: 42, color: '#22c55e' },
              { label: '人工费用', value: '¥2,600', pct: 28, color: '#3b82f6' },
              { label: '外包服务', value: '¥1,800', pct: 19, color: '#a855f7' },
            ].map(function(c, i) {
              return (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#9ca3af' }}>{c.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: c.color }}>{c.value}</div>
                  <div style={{ fontSize: 10, color: '#c026d3' }}>{c.pct}%</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 设备故障率排行 */}
        <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: '#faf5ff', border: '1px solid #e9d5ff' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#6b21a8' }}>🔝 设备故障率排行 TOP5</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[
              { rank: 1, name: '抓娃娃机', incidents: 24, totalUnits: 32, rate: 75, trend: '+8%' },
              { rank: 2, name: '赛车模拟器', incidents: 18, totalUnits: 28, rate: 64, trend: '+12%' },
              { rank: 3, name: '投篮机', incidents: 22, totalUnits: 40, rate: 55, trend: '-3%' },
              { rank: 4, name: '射击机', incidents: 12, totalUnits: 25, rate: 48, trend: '+5%' },
              { rank: 5, name: 'VR设备', incidents: 7, totalUnits: 18, rate: 39, trend: '-2%' },
            ].map(function(d, i) {
              const barColor = d.rate >= 70 ? '#ef4444' : d.rate >= 50 ? '#f59e0b' : '#22c55e';
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: '#fff', border: '1px solid #e5e7eb', fontSize: 12 }}>
                  <span style={{ fontWeight: 700, color: i < 3 ? '#d97706' : '#6b7280', minWidth: 20 }}>#{d.rank}</span>
                  <span style={{ fontWeight: 600, width: 80 }}>{d.name}</span>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#e5e7eb', overflow: 'hidden' }}>
                    <div style={{ width: d.rate + '%', height: '100%', borderRadius: 3, background: barColor }} />
                  </div>
                  <span style={{ color: barColor, fontWeight: 700, minWidth: 32 }}>{d.rate}%</span>
                  <span style={{ color: d.trend.startsWith('+') ? '#ef4444' : '#22c55e', fontSize: 10 }}>{d.trend}</span>
                  <span style={{ fontSize: 10, color: '#9ca3af' }}>{d.incidents}次/{d.totalUnits}台</span>
                </div>
              );
            })}
          </div>
        </div>

          <span>📋 总工单: {stats.total}单</span>
          <span>🔧 完成率: {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</span>
          <span>🚨 紧急: {stats.urgent}单</span>
          <span>⏱ 更新: {new Date().toLocaleString('zh-CN')}</span>
        </div>
      </div>
    </PageShell>
  );
}
