/**
 * salesperson-workbench/page.tsx — 导购员工作台
 * 角色: 张三 (旗舰店·上海)
 * 功能: 今日数据概览 / 待办任务 / 近期客户 / 快速操作
 */
'use client';

import { useMemo, useState } from 'react';

import {
  PageShell,
  StatusBadge,
  DataTable,
  type DataTableColumn,
} from '@m5/ui';

import {
  getCurrentSalesperson,
  MOCK_TASKS,
  MOCK_DAILY_METRICS,
  MOCK_RECENT_CUSTOMERS,
  TASK_PRIORITY_MAP,
  TASK_STATUS_MAP,
  CUSTOMER_INTENT_MAP,
  type SalesTask,
  type RecentCustomer,
} from './salesperson-data';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RecentDataTable = DataTable as any;

// ---- 样式 ----

const pageStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: '#f1f5f9',
  marginBottom: 12,
};

const headerCard: React.CSSProperties = {
  borderRadius: 16,
  padding: '20px 24px',
  background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
  border: '1px solid rgba(148,163,184,0.15)',
};

const gridContainer: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
};

const metricCard: React.CSSProperties = {
  borderRadius: 12,
  padding: '14px 16px',
  background: 'rgba(15,23,42,0.4)',
  border: '1px solid rgba(148,163,184,0.12)',
};

const flexRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
};

// ---- 快捷操作按钮 ----

const quickActions = [
  { label: '新增客户', icon: '➕', href: '/members/new' },
  { label: '会员查询', icon: '🔍', href: '/members' },
  { label: '开单收银', icon: '💳', href: '/cashier-pos' },
  { label: '查看业绩', icon: '📊', href: '/performance-dashboard' },
];

function QuickActionCard({ label, icon, href }: { label: string; icon: string; href: string }) {
  return (
    <a
      href={href}
      style={{
        borderRadius: 12,
        padding: '16px 20px',
        background: 'rgba(15,23,42,0.4)',
        border: '1px solid rgba(148,163,184,0.12)',
        color: '#e2e8f0',
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontSize: 14,
        fontWeight: 600,
        transition: 'all 0.15s',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(59,130,246,0.15)';
        e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(15,23,42,0.4)';
        e.currentTarget.style.borderColor = 'rgba(148,163,184,0.12)';
      }}
    >
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span>{label}</span>
    </a>
  );
}

// ---- 任务列表 ----

function TaskList({ tasks }: { tasks: SalesTask[] }) {
  const visibleTasks = tasks.filter((t) => t.status !== 'completed').slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {visibleTasks.length === 0 && (
        <div style={{ color: '#64748b', fontSize: 14, padding: 12 }}>
          暂无待办任务
        </div>
      )}
      {visibleTasks.map((task) => {
        const pm = TASK_PRIORITY_MAP[task.priority];
        const sm = TASK_STATUS_MAP[task.status];
        return (
          <div
            key={task.id}
            style={{
              borderRadius: 10,
              padding: '10px 14px',
              background: 'rgba(15,23,42,0.3)',
              border: '1px solid rgba(148,163,184,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>
                {task.title}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                {task.customerName} · {task.customerPhone.slice(0, 7)}****
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <StatusBadge label={pm.label} variant={pm.variant} size="sm" />
              <StatusBadge label={sm.label} variant={sm.variant} size="sm" />
              <span style={{ fontSize: 12, color: '#64748b' }}>
                截止: {task.dueAt}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---- 近期客户表格列 ----

function buildRecentColumns(): DataTableColumn<RecentCustomer>[] {
  return [
    {
      key: 'name',
      title: '姓名',
      dataKey: 'name',
      sortable: true,
      render: (item: RecentCustomer) => (
        <span style={{ color: '#93c5fd', fontWeight: 500 }}>{item.name}</span>
      ),
    },
    {
      key: 'phone',
      title: '手机号',
      dataKey: 'phone',
      sortable: true,
      render: (item: RecentCustomer) => (
        <span style={{ color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
          {item.phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1****$3')}
        </span>
      ),
    },
    {
      key: 'lastVisit',
      title: '最近到店',
      dataKey: 'lastVisit',
      sortable: true,
    },
    {
      key: 'intent',
      title: '意向',
      render: (item: RecentCustomer) => {
        const im = CUSTOMER_INTENT_MAP[item.intent];
        return (
          <StatusBadge
            label={im.label}
            variant={
              item.intent === 'ready' ? 'success' :
              item.intent === 'comparing' ? 'warning' :
              item.intent === 'follow_up' ? 'info' : 'neutral'
            }
            size="sm"
          />
        );
      },
    },
    {
      key: 'estimatedValue',
      title: '预估价值',
      dataKey: 'estimatedValue',
      sortable: true,
      align: 'right',
      render: (item: RecentCustomer) => (
        <span style={{ color: '#4ade80', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          ¥{item.estimatedValue.toLocaleString()}
        </span>
      ),
    },
  ];
}

// ---- 主页面 ----

export default function SalespersonWorkbenchPage() {
  const salesperson = getCurrentSalesperson();
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'urgent'>('all');

  const filteredTasks = useMemo(() => {
    if (taskFilter === 'urgent') return MOCK_TASKS.filter((t) => t.priority === 'urgent');
    if (taskFilter === 'pending') return MOCK_TASKS.filter((t) => t.status !== 'completed');
    return MOCK_TASKS;
  }, [taskFilter]);

  const recentColumns = useMemo(() => buildRecentColumns(), []);

  const totalEstimatedValue = useMemo(
    () => MOCK_RECENT_CUSTOMERS.reduce((sum, c) => sum + c.estimatedValue, 0),
    []
  );

  const pendingCount = useMemo(
    () => MOCK_TASKS.filter((t) => t.status !== 'completed').length,
    []
  );

  return (
    <PageShell title="导购员工作台">
      <div style={pageStyle}>
        {/* 个人信息头 */}
        <div style={headerCard}>
          <div style={flexRow}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                fontWeight: 700,
                color: '#fff',
              }}
            >
              {salesperson[0]}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>
                {salesperson} 导购
              </div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
                旗舰店(上海) · {new Date().toLocaleDateString('zh-CN')}
              </div>
            </div>
          </div>
        </div>

        {/* 今日数据 */}
        <div>
          <div style={sectionTitle}>📈 今日数据</div>
          <div style={gridContainer}>
            {MOCK_DAILY_METRICS.map((m) => (
              <div key={m.label} style={metricCard}>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{m.label}</div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#f1f5f9',
                    marginTop: 4,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {m.unit === '元'
                    ? `¥${m.value.toLocaleString()}`
                    : `${m.value}${m.unit}`}
                </div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  <span
                    style={{
                      color: m.trend === 'up' ? '#4ade80' : m.trend === 'down' ? '#ef4444' : '#94a3b8',
                      fontWeight: 600,
                    }}
                  >
                    {m.trend === 'up' ? '↑' : m.trend === 'down' ? '↓' : '→'} {m.changePercent}%
                  </span>
                  <span style={{ color: '#64748b', marginLeft: 4 }}>vs 昨日</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 快捷操作 */}
        <div>
          <div style={sectionTitle}>⚡ 快捷操作</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
            {quickActions.map((action) => (
              <QuickActionCard key={action.label} {...action} />
            ))}
          </div>
        </div>

        {/* 待办任务 */}
        <div>
          <div style={{ ...flexRow, justifyContent: 'space-between' }}>
            <div style={sectionTitle}>📋 待办任务 ({pendingCount})</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['all', 'pending', 'urgent'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setTaskFilter(f)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 8,
                    border: '1px solid',
                    borderColor: taskFilter === f ? 'rgba(59,130,246,0.5)' : 'rgba(148,163,184,0.15)',
                    background: taskFilter === f ? 'rgba(59,130,246,0.15)' : 'transparent',
                    color: taskFilter === f ? '#93c5fd' : '#94a3b8',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {f === 'all' ? '全部' : f === 'pending' ? '待处理' : '紧急'}
                </button>
              ))}
            </div>
          </div>
          <TaskList tasks={filteredTasks} />
        </div>

        {/* 近期客户 */}
        <div>
          <div style={{ ...flexRow, justifyContent: 'space-between' }}>
            <div style={sectionTitle}>👥 近期客户</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              预估总价值: <span style={{ color: '#4ade80', fontWeight: 600 }}>¥{totalEstimatedValue.toLocaleString()}</span>
            </div>
          </div>
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(148,163,184,0.1)' }}>
            <RecentDataTable
              columns={recentColumns}
              items={MOCK_RECENT_CUSTOMERS}
              rowKey={(item: RecentCustomer) => item.id}
            />
          </div>
        </div>

        {/* 底部导航提示 */}
        <div
          style={{
            textAlign: 'center',
            fontSize: 12,
            color: '#475569',
            padding: '16px 0',
            borderTop: '1px solid rgba(148,163,184,0.08)',
          }}
        >
          导购员工作台 v1.0 · 数据每 15 分钟自动刷新
        </div>
      </div>
    </PageShell>
  );
}
