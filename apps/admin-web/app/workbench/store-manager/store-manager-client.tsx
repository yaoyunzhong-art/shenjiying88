'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { mapToBackendRole, type RoleWorkbenchContract } from '@m5/types';
import { PageShell, StatCard, StatusBadge, Tabs } from '@m5/ui';

import { AdminPermissionGate } from '../../components/admin-permission-gate';

type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
type TaskStatus = 'todo' | 'in_progress' | 'done';

interface KpiCard {
  label: string;
  value: string;
  trend: { value: string; positive: boolean };
  helper?: string;
}

interface TaskItem {
  id: string;
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadline: string;
  assignee: string;
  category: string;
}

interface StoreItem {
  id: string;
  name: string;
  category: string;
  sales: number;
  stock: number;
  margin: number;
}

interface StaffOnDuty {
  id: string;
  name: string;
  role: string;
  shift: string;
  startTime: string;
  endTime: string;
  status: string;
}

interface RevenueHour {
  hour: string;
  amount: number;
  visitors: number;
}

interface StoreManagerWorkbenchClientProps {
  deliveryMode: 'api' | 'fallback';
  roleWorkbench?: RoleWorkbenchContract;
}

const PRIORITY_MAP: Record<
  TaskPriority,
  { label: string; variant: 'danger' | 'warning' | 'neutral' }
> = {
  urgent: { label: '紧急', variant: 'danger' },
  high: { label: '高', variant: 'warning' },
  medium: { label: '中', variant: 'neutral' },
  low: { label: '低', variant: 'neutral' },
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: '待办',
  in_progress: '进行中',
  done: '已完成',
};

const permissionGate = {
  requiredPermission: 'workbench.read',
  title: '店长工作台访问受限',
  description:
    '店长工作台已接入管理员本地 session，只有具备 workbench.read 的账号才能查看运营面板、任务状态与营收走势。',
} as const;

function formatMoney(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

function mockKpi(): KpiCard[] {
  return [
    {
      label: '今日营收',
      value: formatMoney(12680 + Math.floor(Math.random() * 2000)),
      trend: { value: '+18.5%', positive: true },
      helper: '较昨日',
    },
    {
      label: '今日客流',
      value: `${320 + Math.floor(Math.random() * 80)}人`,
      trend: { value: '+12.3%', positive: true },
      helper: '较昨日',
    },
    {
      label: '设备在线率',
      value: `${88 + Math.floor(Math.random() * 10)}%`,
      trend: {
        value: `${-2 + Math.floor(Math.random() * 5)}%`,
        positive: Math.random() > 0.3,
      },
      helper: `${18 + Math.floor(Math.random() * 8)}台在线`,
    },
    {
      label: '会员消费占比',
      value: `${55 + Math.floor(Math.random() * 15)}%`,
      trend: { value: '+8.2%', positive: true },
      helper: '较上周',
    },
  ];
}

function mockTasks(): TaskItem[] {
  return [
    {
      id: 'T1',
      title: '检查娃娃机维护工单',
      priority: 'urgent',
      status: 'todo',
      deadline: '今日 18:00',
      assignee: '王强',
      category: '设备',
    },
    {
      id: 'T2',
      title: '审批排班变更申请',
      priority: 'high',
      status: 'todo',
      deadline: '今日 16:00',
      assignee: '店长',
      category: '人事',
    },
    {
      id: 'T3',
      title: '核对昨日营收数据',
      priority: 'high',
      status: 'in_progress',
      deadline: '今日 14:00',
      assignee: '李娜',
      category: '财务',
    },
    {
      id: 'T4',
      title: '处理库存补货申请',
      priority: 'medium',
      status: 'todo',
      deadline: '今日 20:00',
      assignee: '刘洋',
      category: '库存',
    },
    {
      id: 'T5',
      title: '整理促销活动物料',
      priority: 'medium',
      status: 'todo',
      deadline: '明日 10:00',
      assignee: '陈静',
      category: '营销',
    },
    {
      id: 'T6',
      title: '检查消防设备状态',
      priority: 'urgent',
      status: 'done',
      deadline: '今日 12:00',
      assignee: '赵敏',
      category: '安全',
    },
    {
      id: 'T7',
      title: '新员工入职培训安排',
      priority: 'low',
      status: 'todo',
      deadline: '明日 14:00',
      assignee: '周杰',
      category: '人事',
    },
    {
      id: 'T8',
      title: '更新会员积分活动规则',
      priority: 'medium',
      status: 'todo',
      deadline: '明日 18:00',
      assignee: '吴芳',
      category: '会员',
    },
    {
      id: 'T9',
      title: '空调维修跟进',
      priority: 'urgent',
      status: 'in_progress',
      deadline: '今日 15:00',
      assignee: '杨磊',
      category: '后勤',
    },
    {
      id: 'T10',
      title: '准备周报数据',
      priority: 'low',
      status: 'todo',
      deadline: '周五 17:00',
      assignee: '店长',
      category: '报表',
    },
  ];
}

function mockHotProducts(): StoreItem[] {
  return [
    { id: 'P1', name: '经典游戏币兑换', category: '游戏币', sales: 156, stock: 5000, margin: 85 },
    { id: 'P2', name: '大号娃娃-熊', category: '礼品', sales: 32, stock: 45, margin: 72 },
    { id: 'P3', name: 'VR体验套餐', category: '体验', sales: 28, stock: Infinity, margin: 68 },
    { id: 'P4', name: '会员充值200赠50', category: '会员', sales: 45, stock: Infinity, margin: 90 },
    { id: 'P5', name: '盲盒-动漫系列', category: '礼品', sales: 38, stock: 120, margin: 65 },
    { id: 'P6', name: '可乐(罐装)', category: '餐饮', sales: 89, stock: 240, margin: 55 },
  ];
}

function mockStaffOnDuty(): StaffOnDuty[] {
  return [
    { id: 'S1', name: '李娜', role: '值班经理', shift: '早班', startTime: '08:00', endTime: '14:00', status: '在岗' },
    { id: 'S2', name: '王强', role: '收银员', shift: '早班', startTime: '08:00', endTime: '14:00', status: '在岗' },
    { id: 'S3', name: '赵敏', role: '导玩员', shift: '早班', startTime: '08:00', endTime: '14:00', status: '在岗' },
    { id: 'S4', name: '刘洋', role: '导玩员', shift: '中班', startTime: '14:00', endTime: '20:00', status: '未到岗' },
    { id: 'S5', name: '陈静', role: '收银员', shift: '中班', startTime: '14:00', endTime: '20:00', status: '休息' },
    { id: 'S6', name: '黄丽', role: '保洁', shift: '早班', startTime: '08:00', endTime: '14:00', status: '在岗' },
    { id: 'S7', name: '杨磊', role: '技术员', shift: '全天', startTime: '10:00', endTime: '22:00', status: '在岗' },
    { id: 'S8', name: '周杰', role: '培训师', shift: '中班', startTime: '14:00', endTime: '20:00', status: '未到岗' },
  ];
}

function mockRevenueHours(): RevenueHour[] {
  const hours: RevenueHour[] = [];
  for (let hour = 8; hour <= 23; hour += 1) {
    const base = hour >= 11 && hour <= 14 ? 800 : hour >= 18 && hour <= 21 ? 1200 : 200;
    const visitors =
      hour >= 18 && hour <= 21
        ? 40 + Math.floor(Math.random() * 20)
        : 10 + Math.floor(Math.random() * 20);

    hours.push({
      hour: `${String(hour).padStart(2, '0')}:00`,
      amount: Math.round((base + Math.random() * 300) * 100) / 100,
      visitors,
    });
  }
  return hours;
}

export default function StoreManagerWorkbenchClient({
  deliveryMode,
  roleWorkbench,
}: StoreManagerWorkbenchClientProps) {
  const [tab, setTab] = useState<'kpi' | 'tasks' | 'staff' | 'revenue'>('kpi');
  const kpi = useMemo(() => mockKpi(), []);
  const tasks = useMemo(() => mockTasks(), []);
  const products = useMemo(() => mockHotProducts(), []);
  const staff = useMemo(() => mockStaffOnDuty(), []);
  const revenueHours = useMemo(() => mockRevenueHours(), []);
  const backendRole = mapToBackendRole(roleWorkbench?.role ?? 'STORE_MANAGER');

  const sourceEvidence = useMemo(
    () => ({
      deliveryMode,
      controlPlaneSource:
        deliveryMode === 'api'
          ? 'getAdminWorkbenchConsumerSnapshot / getRoleWorkbench'
          : 'fallbackRoleWorkbenches',
      businessDataSource:
        'mockKpi/mockTasks/mockHotProducts/mockStaffOnDuty/mockRevenueHours',
      note:
        deliveryMode === 'api'
          ? '店长工作台壳层已接入 bootstrap snapshot，但经营指标、待办、排班、营收仍为本地 mock 样本。'
          : '店长工作台壳层当前回退到 fallbackRoleWorkbenches，经营指标、待办、排班、营收仍为本地 mock 样本。',
    }),
    [deliveryMode],
  );

  const todoCount = tasks.filter((task) => task.status === 'todo').length;
  const urgentCount = tasks.filter(
    (task) => task.priority === 'urgent' || task.priority === 'high',
  ).length;
  const onDutyCount = staff.filter((member) => member.status === '在岗').length;
  const deviceOnline = 18;
  const marketLabel = roleWorkbench?.marketCodes.join(' / ') || '未标注';
  const navItemCount = roleWorkbench?.navItems.length ?? 0;

  // E54 控制面证据：区分 bootstrap 壳层来源与业务 mock 来源，避免页面被误判为实时面板。
  return (
    <AdminPermissionGate {...permissionGate}>
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
        <PageShell
          title="👔 店长工作台"
          subtitle={roleWorkbench?.description ?? '一键掌握门店运营全貌'}
        >
          {/* E54 控制面证据：区分 bootstrap 壳层来源与业务 mock 来源，避免页面被误判为实时面板。 */}
          <div style={evidenceCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <StatusBadge label={`Delivery ${sourceEvidence.deliveryMode}`} variant="neutral" size="sm" />
              <span style={{ fontSize: 12, color: '#cbd5e1' }}>
                控制面来源: {sourceEvidence.controlPlaneSource}
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 8, lineHeight: 1.7 }}>
              业务数据: {sourceEvidence.businessDataSource} · tenant-config 角色映射:{' '}
              {backendRole ?? '未映射'} · 工作台模块: {navItemCount} · 市场: {marketLabel}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
              {sourceEvidence.note}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gap: 14,
              gridTemplateColumns: 'repeat(4,1fr)',
              marginBottom: 20,
            }}
          >
            {kpi.map((item) => (
              <div key={item.label} style={card}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>{item.label}</div>
                <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: '#f8fafc' }}>
                  {item.value}
                </div>
                <div
                  style={{
                    marginTop: 4,
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: item.trend.positive ? '#22c55e' : '#ef4444' }}>
                    {item.trend.positive ? '↑' : '↓'} {item.trend.value}
                  </span>
                  <span style={{ color: '#94a3b8' }}>{item.helper}</span>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'grid',
              gap: 14,
              gridTemplateColumns: 'repeat(4,1fr)',
              marginBottom: 20,
            }}
          >
            <div
              style={{
                ...card,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>待办任务</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#eab308' }}>{todoCount}</div>
              </div>
              <div style={{ fontSize: 36 }}>📋</div>
            </div>
            <div
              style={{
                ...card,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>紧急事项</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>
                  {urgentCount}
                </div>
              </div>
              <div style={{ fontSize: 36 }}>🚨</div>
            </div>
            <div
              style={{
                ...card,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>当班员工</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>
                  {onDutyCount}/{staff.length}
                </div>
              </div>
              <div style={{ fontSize: 36 }}>👥</div>
            </div>
            <div
              style={{
                ...card,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>设备在线</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>
                  {deviceOnline}/22
                </div>
              </div>
              <div style={{ fontSize: 36 }}>🖥️</div>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Tabs
              items={[
                { key: 'kpi', label: '📊 运营概览' },
                { key: 'tasks', label: `📋 待办 (${todoCount})` },
                { key: 'staff', label: '👥 排班' },
                { key: 'revenue', label: '💰 时营收' },
              ]}
              activeKey={tab}
              onChange={(value) => setTab(value as typeof tab)}
              variant="pills"
            />
          </div>

          {tab === 'kpi' && (
            <>
              <section style={{ ...card, marginBottom: 20 }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>
                  🔥 今日热门商品
                </h3>
                <div style={{ display: 'grid', gap: 10 }}>
                  {products.map((product) => (
                    <div
                      key={product.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: 'rgba(15,23,42,0.3)',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{product.name}</span>
                        <span style={{ color: '#94a3b8', fontSize: 12, marginLeft: 8 }}>
                          {product.category}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 20, fontSize: 13 }}>
                        <span style={{ color: '#22c55e', fontWeight: 600 }}>
                          {product.sales}单
                        </span>
                        <span style={{ color: '#94a3b8' }}>
                          库存: {Number.isFinite(product.stock) ? product.stock : '∞'}
                        </span>
                        <span style={{ color: product.margin > 70 ? '#22c55e' : '#eab308' }}>
                          毛利{product.margin}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section style={card}>
                <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>
                  📈 今日营收时分布
                </h3>
                <div style={{ display: 'grid', gap: 4 }}>
                  {revenueHours.map((item) => {
                    const maxRevenue = Math.max(...revenueHours.map((value) => value.amount));
                    const percentage = (item.amount / maxRevenue) * 100;

                    return (
                      <div
                        key={item.hour}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}
                      >
                        <div style={{ width: 48, fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>
                          {item.hour}
                        </div>
                        <div
                          style={{
                            flex: 1,
                            height: 10,
                            borderRadius: 5,
                            background: 'rgba(148,163,184,0.12)',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${percentage}%`,
                              borderRadius: 5,
                              background:
                                percentage > 60
                                  ? '#22c55e'
                                  : percentage > 30
                                    ? '#3b82f6'
                                    : '#6b7280',
                            }}
                          />
                        </div>
                        <div
                          style={{
                            width: 80,
                            textAlign: 'right',
                            fontSize: 11,
                            color: '#cbd5e1',
                          }}
                        >
                          {formatMoney(item.amount)}
                        </div>
                        <div
                          style={{
                            width: 40,
                            textAlign: 'right',
                            fontSize: 11,
                            color: '#94a3b8',
                          }}
                        >
                          {item.visitors}人
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}

          {tab === 'tasks' && (
            <section style={card}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>待办任务</h3>
              <div style={{ display: 'grid', gap: 8 }}>
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 16px',
                      borderRadius: 10,
                      background: 'rgba(15,23,42,0.3)',
                      border:
                        task.priority === 'urgent'
                          ? '1px solid rgba(239,68,68,0.2)'
                          : 'none',
                    }}
                  >
                    <StatusBadge
                      label={PRIORITY_MAP[task.priority].label}
                      variant={PRIORITY_MAP[task.priority].variant}
                      size="sm"
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 14,
                          textDecoration: task.status === 'done' ? 'line-through' : 'none',
                          color: task.status === 'done' ? '#6b7280' : '#e2e8f0',
                        }}
                      >
                        {task.title}
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                        {task.category} · {task.assignee} · 截止: {task.deadline}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        color:
                          task.status === 'todo'
                            ? '#eab308'
                            : task.status === 'in_progress'
                              ? '#3b82f6'
                              : '#22c55e',
                        fontWeight: 600,
                      }}
                    >
                      {STATUS_LABELS[task.status]}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {tab === 'staff' && (
            <section style={card}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>当班员工</h3>
              <div style={{ display: 'grid', gap: 10 }}>
                {staff.map((member) => (
                  <div
                    key={member.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: '12px 16px',
                      borderRadius: 10,
                      background: 'rgba(15,23,42,0.3)',
                    }}
                  >
                    <span style={{ fontSize: 24 }}>👤</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{member.name}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>
                        {member.role} · {member.shift} ({member.startTime}-{member.endTime})
                      </div>
                    </div>
                    <StatusBadge
                      label={member.status}
                      variant={
                        member.status === '在岗'
                          ? 'success'
                          : member.status === '休息'
                            ? 'neutral'
                            : 'warning'
                      }
                      size="sm"
                      dot
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {tab === 'revenue' && (
            <>
              <div
                style={{
                  display: 'grid',
                  gap: 14,
                  gridTemplateColumns: 'repeat(3,1fr)',
                  marginBottom: 20,
                }}
              >
                <StatCard
                  label="累计营收"
                  value={formatMoney(revenueHours.reduce((sum, item) => sum + item.amount, 0))}
                  helper={`${revenueHours.reduce((sum, item) => sum + item.visitors, 0)}人`}
                />
                <StatCard
                  label="峰值时段"
                  value={
                    revenueHours.reduce((max, item) => (max.amount > item.amount ? max : item)).hour
                  }
                  helper="最高营收小时"
                />
                <StatCard
                  label="时均营收"
                  value={formatMoney(
                    revenueHours.reduce((sum, item) => sum + item.amount, 0) / revenueHours.length,
                  )}
                />
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={th}>时段</th>
                    <th style={th}>营收</th>
                    <th style={th}>客流</th>
                    <th style={th}>占比</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueHours.map((item) => {
                    const total = revenueHours.reduce((sum, value) => sum + value.amount, 0);

                    return (
                      <tr key={item.hour}>
                        <td style={td}>{item.hour}</td>
                        <td style={{ ...td, fontWeight: 600, color: '#22c55e' }}>
                          {formatMoney(item.amount)}
                        </td>
                        <td style={td}>{item.visitors}人</td>
                        <td style={td}>{((item.amount / total) * 100).toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </PageShell>
      </main>
    </AdminPermissionGate>
  );
}

const evidenceCard: CSSProperties = {
  marginBottom: 16,
  padding: '12px 14px',
  borderRadius: 12,
  background: 'rgba(15, 23, 42, 0.38)',
  border: '1px solid rgba(148, 163, 184, 0.12)',
};

const card: CSSProperties = {
  borderRadius: 16,
  padding: 18,
  background: 'rgba(15,23,42,0.38)',
  border: '1px solid rgba(148,163,184,0.18)',
};

const th: CSSProperties = {
  textAlign: 'left',
  padding: '10px 14px',
  color: '#94a3b8',
  fontSize: 12,
  borderBottom: '1px solid rgba(148,163,184,0.18)',
};

const td: CSSProperties = {
  padding: '10px 14px',
  color: '#e2e8f0',
  fontSize: 13,
  borderBottom: '1px solid rgba(148,163,184,0.1)',
};
