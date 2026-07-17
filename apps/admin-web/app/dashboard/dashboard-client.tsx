/**
 * DashboardClient — 仪表盘客户端组件
 * 功能: 营收趋势、设备状态、待办事项、实时客流
 */

'use client';

import { useState } from 'react';
import { Card, StatusBadge, DataTable, Tabs, type DataTableColumn } from '@m5/ui';

interface DashboardStats {
  todayRevenue: number;
  todayOrders: number;
  activeDevices: number;
  totalDevices: number;
  currentCustomers: number;
  pendingAlerts: number;
  completionRate: number;
  avgVisitDuration: number;
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

const STATUS_VARIANTS: Record<string, 'success' | 'danger' | 'warning' | 'neutral'> = {
  online: 'success',
  offline: 'danger',
  maintenance: 'warning',
  error: 'danger',
};

export default function DashboardClient({ stats }: { stats: DashboardStats }) {
  const [activeTab, setActiveTab] = useState<'trend' | 'devices' | 'todos'>('trend');

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
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as typeof activeTab)}
        variant="pills"
      />

      {activeTab === 'trend' && (
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

      {activeTab === 'devices' && (
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

      {activeTab === 'todos' && (
        <DataTable
          columns={todoColumns}
          items={MOCK_TODOS}
          rowKey={item => item.id}
          striped
          compact
        />
      )}

      {/* 空状态: 无待办 */}
      {stats.pendingAlerts === 0 && activeTab === 'todos' && (
        <Card variant="outlined" style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: '#22c55e', fontWeight: 600 }}>✓ 所有待办已完成</div>
        </Card>
      )}
    </div>
  );
}
