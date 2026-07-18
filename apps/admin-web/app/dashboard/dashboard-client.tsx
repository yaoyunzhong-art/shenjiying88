/**
 * DashboardClient — 仪表盘客户端组件
 * 功能: 营收趋势、设备状态、待办事项、实时客流、多视图Tab切换(总览/运营/财务/增长)
 */

'use client';

import { useState } from 'react';
import { Card, StatusBadge, DataTable, Tabs, type DataTableColumn } from '@m5/ui';

export type DashboardView = 'overview' | 'operations' | 'financial' | 'growth';

interface DashboardStats {
  todayRevenue: number;
  todayOrders: number;
  activeDevices: number;
  totalDevices: number;
  currentCustomers: number;
  pendingAlerts: number;
  completionRate: number;
  avgVisitDuration: number;
  monthlyRevenue: number;
  monthlyOrders: number;
  weeklyGrowth: number;
  customerSatisfaction: number;
}

// 模拟趋势数据（最近7天）
const MOCK_REVENUE_TREND = [
  { date: '07-11', revenue: 11200, orders: 72 },
  { date: '07-12', revenue: 13500, orders: 88 },
  { date: '07-13', revenue: 9800, orders: 65 },
  { date: '07-14', revenue: 14200, orders: 95 },
  { date: '07-15', revenue: 11800, orders: 78 },
  { date: '07-16', revenue: 15600, orders: 102 },
  { date: '07-17', revenue: 12580, orders: 86 },
];

interface TodoItem {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  deadline: string;
}

const MOCK_TODOS: TodoItem[] = [
  { id: 't1', title: '审批VR设备采购单', priority: 'high', status: 'pending', deadline: '今日' },
  { id: 't2', title: '检查A区空调维修情况', priority: 'high', status: 'pending', deadline: '今日' },
  { id: 't3', title: '审核618活动报销', priority: 'medium', status: 'in_progress', deadline: '明日' },
  { id: 't4', title: '盘点周末库存', priority: 'medium', status: 'pending', deadline: '周六' },
  { id: 't5', title: '安排下周班表', priority: 'low', status: 'pending', deadline: '周五' },
];

interface DeviceStatus {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  uptime: string;
}

const MOCK_DEVICES: DeviceStatus[] = [
  { id: 'd1', name: 'VR体验区 #1', status: 'online', uptime: '99.2%' },
  { id: 'd2', name: 'VR体验区 #2', status: 'online', uptime: '98.5%' },
  { id: 'd3', name: '投篮机 #1', status: 'maintenance', uptime: '—' },
  { id: 'd4', name: '娃娃机 A区', status: 'online', uptime: '99.8%' },
  { id: 'd5', name: '收银台 #1', status: 'online', uptime: '100%' },
  { id: 'd6', name: '空调系统', status: 'error', uptime: '—' },
];

// 模拟财务数据（月度）
const MOCK_FINANCIAL_MONTHS = [
  { month: '2月', revenue: 285000, cost: 195000, profit: 90000 },
  { month: '3月', revenue: 302000, cost: 208000, profit: 94000 },
  { month: '4月', revenue: 278000, cost: 190000, profit: 88000 },
  { month: '5月', revenue: 325000, cost: 215000, profit: 110000 },
  { month: '6月', revenue: 298000, cost: 202000, profit: 96000 },
  { month: '7月', revenue: 312800, cost: 210000, profit: 102800 },
];

// 模拟增长指标
const MOCK_GROWTH_METRICS = [
  { metric: '月营收增长率', value: '+8.5%', trend: 'up' as const, description: '环比上月增长' },
  { metric: '月订单增长率', value: '+12.3%', trend: 'up' as const, description: '环比上月增长' },
  { metric: '客单价', value: '¥146.50', trend: 'up' as const, description: '同比 +5.2%' },
  { metric: '会员复购率', value: '67%', trend: 'up' as const, description: '同比 +3.1%' },
  { metric: '新客占比', value: '32%', trend: 'down' as const, description: '环比 -1.2%' },
  { metric: '流失率', value: '5.8%', trend: 'down' as const, description: '环比 -0.3% ✅' },
];

// 模拟运营数据
const MOCK_OPERATIONS = [
  { area: 'VR体验区', occupancy: 78, peakTime: '14:00-17:00', status: 'normal' as const },
  { area: '街机区', occupancy: 65, peakTime: '13:00-16:00', status: 'normal' as const },
  { area: '娃娃机区', occupancy: 45, peakTime: '15:00-18:00', status: 'normal' as const },
  { area: '休息区', occupancy: 82, peakTime: '12:00-14:00', status: 'busy' as const },
];

const STATUS_VARIANTS: Record<string, 'success' | 'danger' | 'warning' | 'neutral'> = {
  online: 'success',
  offline: 'danger',
  maintenance: 'warning',
  error: 'danger',
};

/** 总览视图 - 营收趋势 + 设备状态 + 待办 */
function OverviewView({
  stats,
  activeSubTab,
  setActiveSubTab,
}: {
  stats: DashboardStats;
  activeSubTab: string;
  setActiveSubTab: (v: string) => void;
}) {
  const todoColumns: DataTableColumn<TodoItem>[] = [
    { key: 'title', title: '待办事项', dataKey: 'title', sortable: true, render: (item) => <span style={{ color: item.priority === 'high' ? '#f87171' : item.priority === 'medium' ? '#fbbf24' : '#94a3b8' }}>{item.title}</span> },
    { key: 'priority', title: '优先级', dataKey: 'priority', sortable: true, render: (item) => <StatusBadge label={item.priority === 'high' ? '🔴紧急' : item.priority === 'medium' ? '🟡普通' : '🟢低优'} variant={item.priority === 'high' ? 'danger' : item.priority === 'medium' ? 'warning' : 'success'} size="sm" /> },
    { key: 'status', title: '状态', dataKey: 'status', sortable: true, render: (item) => <StatusBadge label={item.status === 'pending' ? '待处理' : item.status === 'in_progress' ? '进行中' : '已完成'} variant={item.status === 'completed' ? 'success' : item.status === 'in_progress' ? 'warning' : 'default'} size="sm" /> },
    { key: 'deadline', title: '截止', dataKey: 'deadline', sortable: true },
  ];

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* 营收趋势预览 */}
      <Card title="营收趋势" style={{ padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginTop: 12 }}>
          {MOCK_REVENUE_TREND.map(day => {
            const maxRevenue = Math.max(...MOCK_REVENUE_TREND.map(d => d.revenue));
            const heightPercent = (day.revenue / maxRevenue) * 100;
            return (
              <div key={day.date} style={{ textAlign: 'center' }}>
                <div style={{ height: 120, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: 4 }}>
                  <div style={{
                    width: '100%',
                    height: `${heightPercent}%`,
                    backgroundColor: day.date === '07-17' ? '#3b82f6' : '#1e293b',
                    borderRadius: '4px 4px 0 0',
                    minHeight: 8,
                    transition: 'height 0.3s',
                  }} />
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{day.date}</div>
                <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>¥{(day.revenue / 1000).toFixed(1)}k</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Tab 面板: 设备 · 待办 */}
      <Tabs
        items={[
          { key: 'trend', label: '📈 趋势', count: MOCK_REVENUE_TREND.length },
          { key: 'devices', label: '🔧 设备状态', count: MOCK_DEVICES.filter(d => d.status !== 'online').length },
          { key: 'todos', label: '📋 待办', count: MOCK_TODOS.filter(t => t.status !== 'completed').length },
        ]}
        activeKey={activeSubTab}
        onChange={(key) => setActiveSubTab(key)}
        variant="pills"
      />

      {activeSubTab === 'trend' && (
        <Card title="7日营收对比" style={{ padding: 16 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            {MOCK_REVENUE_TREND.map(day => (
              <div key={day.date} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>{day.date}</span>
                <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>¥{day.revenue.toLocaleString()}</span>
                <span style={{ color: '#64748b', fontSize: 13 }}>{day.orders} 单</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeSubTab === 'devices' && (
        <div style={{ display: 'grid', gap: 8 }}>
          {MOCK_DEVICES.map(device => (
            <div key={device.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 10, background: 'rgba(15,23,42,0.3)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{device.name}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>在线率: {device.uptime}</div>
              </div>
              <StatusBadge
                label={device.status === 'online' ? '🟢在线' : device.status === 'offline' ? '🔴离线' : device.status === 'maintenance' ? '🟡维护中' : '❌故障'}
                variant={STATUS_VARIANTS[device.status]}
                size="sm"
                dot
              />
            </div>
          ))}
        </div>
      )}

      {activeSubTab === 'todos' && (
        <DataTable
          columns={todoColumns}
          items={MOCK_TODOS}
          rowKey={item => item.id}
          striped
          compact
        />
      )}

      {/* 空状态: 无待办 */}
      {stats.pendingAlerts === 0 && activeSubTab === 'todos' && (
        <Card variant="outlined" style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: '#22c55e', fontWeight: 600 }}>✓ 所有待办已完成</div>
        </Card>
      )}
    </div>
  );
}

/** 运营视图 - 区域运营数据 */
function OperationsView() {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card title="各区域运营数据" style={{ padding: 16 }}>
        <div style={{ display: 'grid', gap: 12 }}>
          {MOCK_OPERATIONS.map(op => (
            <div key={op.area} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{op.area}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>高峰: {op.peakTime}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{op.occupancy}%</div>
                <StatusBadge
                  label={op.status === 'busy' ? '🔴繁忙' : '🟢正常'}
                  variant={op.status === 'busy' ? 'danger' : 'success'}
                  size="sm"
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card title="设备概览" style={{ padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: '总设备', value: '48' },
            { label: '在线', value: '42', color: '#22c55e' },
            { label: '维护中', value: '1', color: '#eab308' },
            { label: '故障', value: '1', color: '#ef4444' },
          ].map(item => (
            <div key={item.label} style={{ textAlign: 'center', padding: 12, borderRadius: 8, background: 'rgba(15,23,42,0.3)' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: item.color ?? '#e2e8f0' }}>{item.value}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/** 财务视图 - 月度营收/成本/利润对比 */
function FinancialView({ stats }: { stats: DashboardStats }) {
  const maxRevenue = Math.max(...MOCK_FINANCIAL_MONTHS.map(m => m.revenue));
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card title="月度财务数据" style={{ padding: 16 }}>
        <div style={{ display: 'grid', gap: 8 }}>
          {MOCK_FINANCIAL_MONTHS.map(month => {
            const barWidth = (month.revenue / maxRevenue) * 100;
            return (
              <div key={month.month}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                  <span>{month.month}</span>
                  <span>¥{month.revenue.toLocaleString()}</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: 'rgba(15,23,42,0.3)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${barWidth}%`, borderRadius: 4, background: 'linear-gradient(90deg, #3b82f6, #60a5fa)' }} />
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#64748b', marginTop: 2 }}>
                  <span>成本: ¥{month.cost.toLocaleString()}</span>
                  <span style={{ color: '#22c55e' }}>利润: ¥{month.profit.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      <Card title="月度汇总" style={{ padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <div style={{ textAlign: 'center', padding: 12, borderRadius: 8, background: 'rgba(15,23,42,0.3)' }}>
            <div style={{ fontSize: 12, color: '#64748b' }}>本月营收</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#60a5fa' }}>¥{stats.monthlyRevenue.toLocaleString()}</div>
          </div>
          <div style={{ textAlign: 'center', padding: 12, borderRadius: 8, background: 'rgba(15,23,42,0.3)' }}>
            <div style={{ fontSize: 12, color: '#64748b' }}>本月订单</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>{stats.monthlyOrders}</div>
          </div>
          <div style={{ textAlign: 'center', padding: 12, borderRadius: 8, background: 'rgba(15,23,42,0.3)' }}>
            <div style={{ fontSize: 12, color: '#64748b' }}>满意度</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#22c55e' }}>{stats.customerSatisfaction}%</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

/** 增长视图 - 关键增长指标 */
function GrowthView() {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card title="增长指标" style={{ padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {MOCK_GROWTH_METRICS.map(metric => (
            <div key={metric.metric} style={{ padding: 16, borderRadius: 10, background: 'rgba(15,23,42,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{metric.metric}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4, color: metric.trend === 'up' ? '#22c55e' : '#f87171' }}>
                    {metric.value}
                  </div>
                </div>
                <div style={{ fontSize: 24 }}>{metric.trend === 'up' ? '📈' : '📉'}</div>
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>{metric.description}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/** 默认视图（无匹配fallback） */
function FallbackView({ view }: { view: string }) {
  return (
    <Card variant="outlined" style={{ padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 14, color: '#ef4444', fontWeight: 600 }}>
        ⚠️ 未知视图: {view}
      </div>
    </Card>
  );
}

export default function DashboardClient({ stats }: { stats: DashboardStats }) {
  const [activeView, setActiveView] = useState<DashboardView>('overview');
  const [activeSubTab, setActiveSubTab] = useState<string>('trend');

  const viewTabs = [
    { key: 'overview' as const, label: '📊 总览' },
    { key: 'operations' as const, label: '⚙️ 运营' },
    { key: 'financial' as const, label: '💰 财务' },
    { key: 'growth' as const, label: '📈 增长' },
  ];

  const renderView = () => {
    switch (activeView) {
      case 'overview':
        return <OverviewView stats={stats} activeSubTab={activeSubTab} setActiveSubTab={setActiveSubTab} />;
      case 'operations':
        return <OperationsView />;
      case 'financial':
        return <FinancialView stats={stats} />;
      case 'growth':
        return <GrowthView />;
      default:
        return <FallbackView view={activeView} />;
    }
  };

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* 视图切换Tab: 总览/运营/财务/增长 */}
      <Tabs
        items={viewTabs}
        activeKey={activeView}
        onChange={(key) => setActiveView(key as DashboardView)}
        variant="segment"
        fill
      />

      {renderView()}
    </div>
  );
}
