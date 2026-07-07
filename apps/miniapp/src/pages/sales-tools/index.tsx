/**
 * 导购员工具面板 — 小程序端 (Taro)
 * 角色视角: 🛍️导购员
 * 功能: 今日待办、快速服务、最近交易、快捷操作
 */
import { View, Text, Button, Input } from '@tarojs/components';
import { useState, useMemo } from 'react';
import Taro from '@tarojs/taro';

// ---- 类型 ----

type TaskPriority = 'high' | 'medium' | 'low';
type TaskStatus = 'pending' | 'done';
type TransactionType = 'sale' | 'return' | 'exchange';

interface TaskItem {
  id: string;
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadline: string;
}

interface CustomerQuick {
  id: string;
  name: string;
  level: string;
  lastVisit: string;
  phone: string;
}

interface TransactionRecord {
  id: string;
  customer: string;
  type: TransactionType;
  amount: number;
  time: string;
  items: number;
}

const PRIORITY_LABELS: Record<TaskPriority, string> = { high: '紧急', medium: '重要', low: '普通' };
const PRIORITY_COLORS: Record<TaskPriority, string> = { high: '#ef4444', medium: '#f59e0b', low: '#64748b' };
const TRANSACTION_LABELS: Record<TransactionType, string> = { sale: '销售', return: '退货', exchange: '换货' };
const TRANSACTION_COLORS: Record<TransactionType, string> = { sale: '#22c55e', return: '#ef4444', exchange: '#3b82f6' };

// ---- Mock 数据 ----

const MOCK_TASKS: TaskItem[] = [
  { id: 't1', title: '跟进会员李女士的预约服务', priority: 'high', status: 'pending', deadline: '今日 15:00' },
  { id: 't2', title: '整理新品陈列展示区', priority: 'medium', status: 'pending', deadline: '今日 18:00' },
  { id: 't3', title: '提交上周客户反馈汇总', priority: 'low', status: 'pending', deadline: '明日 10:00' },
  { id: 't4', title: '回访三位VIP会员(产品满意度)', priority: 'high', status: 'pending', deadline: '今日 17:00' },
  { id: 't5', title: '盘点库存 - 精华液系列', priority: 'medium', status: 'done', deadline: '已完成' },
  { id: 't6', title: '更新客户生日关怀名单', priority: 'low', status: 'done', deadline: '已完成' },
];

const MOCK_CUSTOMERS: CustomerQuick[] = [
  { id: 'c1', name: '王芳', level: 'SVIP', lastVisit: '2026-06-28', phone: '138****5678' },
  { id: 'c2', name: '张丽', level: 'VIP', lastVisit: '2026-06-25', phone: '139****1234' },
  { id: 'c3', name: '陈静', level: '金卡', lastVisit: '2026-06-20', phone: '136****9012' },
  { id: 'c4', name: '刘洋', level: '银卡', lastVisit: '2026-06-15', phone: '137****3456' },
  { id: 'c5', name: '赵敏', level: 'VIP', lastVisit: '2026-06-10', phone: '135****7890' },
];

const MOCK_TRANSACTIONS: TransactionRecord[] = [
  { id: 'tr1', customer: '王芳', type: 'sale', amount: 2680, time: '14:32', items: 3 },
  { id: 'tr2', customer: '孙悦', type: 'sale', amount: 890, time: '13:15', items: 1 },
  { id: 'tr3', customer: '周莉', type: 'return', amount: 299, time: '11:40', items: 1 },
  { id: 'tr4', customer: '吴敏', type: 'sale', amount: 1560, time: '10:20', items: 2 },
  { id: 'tr5', customer: '李娟', type: 'exchange', amount: 0, time: '09:55', items: 1 },
  { id: 'tr6', customer: '郑婷', type: 'sale', amount: 4200, time: '09:10', items: 5 },
];

// ---- 工具函数 ----

const formatAmount = (v: number): string => v >= 10000 ? `¥${(v / 10000).toFixed(1)}万` : `¥${v.toLocaleString()}`;
const formatPhone = (phone: string): string => {
  if (phone.length === 11) return `${phone.slice(0, 3)}****${phone.slice(7)}`;
  return phone;
};

// ---- 组件 ----

export default function SalesToolsPage() {
  const [activeTab, setActiveTab] = useState<'task' | 'customer' | 'transaction'>('task');
  const [searchCustomer, setSearchCustomer] = useState('');

  // 今日数据
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // 待办任务
  const pendingTasks = MOCK_TASKS.filter((t) => t.status === 'pending');
  const highPriorityCount = pendingTasks.filter((t) => t.priority === 'high').length;

  // 今日交易
  const todaySales = MOCK_TRANSACTIONS.filter((t) => t.type === 'sale');
  const todayRevenue = todaySales.reduce((s, t) => s + t.amount, 0);
  const todayTransactions = MOCK_TRANSACTIONS.length;

  // 客户搜索
  const filteredCustomers = useMemo(() => {
    if (!searchCustomer) return MOCK_CUSTOMERS;
    const q = searchCustomer.toLowerCase();
    return MOCK_CUSTOMERS.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.level.toLowerCase().includes(q),
    );
  }, [searchCustomer]);

  // 快捷操作
  const quickActions = [
    { label: '扫码开单', icon: '📷', action: 'scan' },
    { label: '会员查询', icon: '🔍', action: 'member' },
    { label: '库存查询', icon: '📦', action: 'inventory' },
    { label: '服务记录', icon: '📝', action: 'service' },
  ];

  const handleQuickAction = (action: string) => {
    const labels: Record<string, string> = {
      scan: '打开扫码开单…',
      member: '打开会员查询…',
      inventory: '打开库存查询…',
      service: '打开服务记录…',
    };
    Taro.showToast({ title: labels[action] ?? '功能开发中', icon: 'none' });
  };

  const handleCompleteTask = (id: string) => {
    Taro.showToast({ title: `任务 ${id} 已完成 ✅`, icon: 'success' });
  };

  const handleCallCustomer = (name: string) => {
    Taro.showToast({ title: `呼叫 ${name} …`, icon: 'none' });
  };

  /* ---- 渲染: 待办任务 ---- */
  const renderTasks = () => (
    <View>
      {/* 进度摘要 */}
      <View style={statRow}>
        <View style={statCard}>
          <Text style={statLabel}>今日待办</Text>
          <Text style={{...statValue, color: '#60a5fa'}}>{pendingTasks.length}</Text>
        </View>
        <View style={statCard}>
          <Text style={statLabel}>紧急事项</Text>
          <Text style={{...statValue, color: '#ef4444'}}>{highPriorityCount}</Text>
        </View>
        <View style={statCard}>
          <Text style={statLabel}>已完成</Text>
          <Text style={{...statValue, color: '#22c55e'}}>{MOCK_TASKS.filter((t) => t.status === 'done').length}</Text>
        </View>
      </View>

      <View style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {MOCK_TASKS.map((task) => (
          <View
            key={task.id}
            style={{
              padding: '12px',
              borderRadius: 10,
              background: 'rgba(15, 23, 42, 0.5)',
              border: `1px solid ${task.status === 'done' ? 'rgba(34,197,94,0.2)' : 'rgba(148,163,184,0.1)'}`,
              opacity: task.status === 'done' ? 0.5 : 1,
            }}
          >
            <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    background: PRIORITY_COLORS[task.priority],
                    flexShrink: 0,
                  }}
                />
                <Text style={{ fontSize: 14, color: task.status === 'done' ? '#64748b' : '#e2e8f0', flex: 1 }}>
                  {task.title}
                </Text>
              </View>
              <View
                style={{
                  padding: '2px 8px',
                  borderRadius: 8,
                  background: `${PRIORITY_COLORS[task.priority]}22`,
                  border: `1px solid ${PRIORITY_COLORS[task.priority]}44`,
                  flexShrink: 0,
                }}
              >
                <Text style={{ fontSize: 11, color: PRIORITY_COLORS[task.priority] }}>
                  {PRIORITY_LABELS[task.priority]}
                </Text>
              </View>
            </View>
            <View style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <Text style={{ fontSize: 12, color: '#64748b' }}>截止: {task.deadline}</Text>
              {task.status === 'pending' ? (
                <Button
                  style={smallBtn}
                  onClick={() => handleCompleteTask(task.id)}
                >
                  完成
                </Button>
              ) : (
                <Text style={{ fontSize: 12, color: '#22c55e' }}>✅ 已完成</Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  /* ---- 渲染: 客户搜索 ---- */
  const renderCustomers = () => (
    <View>
      <Input
        style={searchInput}
        placeholder="输入客户姓名/手机号搜索…"
        value={searchCustomer}
        onInput={(e) => setSearchCustomer(e.detail.value)}
        onConfirm={() => {}}
      />
      <View style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filteredCustomers.length === 0 ? (
          <View style={{ padding: 24, textAlign: 'center' }}>
            <Text style={{ color: '#64748b', fontSize: 14 }}>未找到匹配客户</Text>
          </View>
        ) : (
          filteredCustomers.map((cust) => (
            <View
              key={cust.id}
              style={{
                padding: '12px',
                borderRadius: 10,
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(148,163,184,0.1)',
              }}
            >
              <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>{cust.name}</Text>
                <View
                  style={{
                    padding: '2px 8px',
                    borderRadius: 8,
                    background: cust.level === 'SVIP' ? 'rgba(250,204,21,0.2)' : 'rgba(59,130,246,0.2)',
                    border: `1px solid ${cust.level === 'SVIP' ? 'rgba(250,204,21,0.4)' : 'rgba(59,130,246,0.4)'}`,
                  }}
                >
                  <Text style={{ fontSize: 11, color: cust.level === 'SVIP' ? '#facc15' : '#60a5fa' }}>
                    {cust.level}
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                {formatPhone(cust.phone)} · 上次到店: {cust.lastVisit}
              </Text>
              <View style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <Button
                  style={{...smallBtn, ...{ flex: 1 }}}
                  onClick={() => handleCallCustomer(cust.name)}
                >
                  联系
                </Button>
                <Button
                  style={{...smallBtn, flex: 1, background: '#1e40af'}}
                  onClick={() => Taro.showToast({ title: `查看 ${cust.name} 详情`, icon: 'none' })}
                >
                  详情
                </Button>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );

  /* ---- 渲染: 最近交易 ---- */
  const renderTransactions = () => (
    <View>
      {/* 交易摘要 */}
      <View style={statRow}>
        <View style={statCard}>
          <Text style={statLabel}>今日交易</Text>
          <Text style={{...statValue, color: '#60a5fa'}}>{todayTransactions}</Text>
        </View>
        <View style={statCard}>
          <Text style={statLabel}>销售额</Text>
          <Text style={{...statValue, color: '#22c55e', fontSize: 16}}>{formatAmount(todayRevenue)}</Text>
        </View>
        <View style={statCard}>
          <Text style={statLabel}>笔均</Text>
          <Text style={{...statValue, color: '#facc15', fontSize: 16}}>
            {todaySales.length > 0 ? formatAmount(Math.round(todayRevenue / todaySales.length)) : '¥0'}
          </Text>
        </View>
      </View>

      <View style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {MOCK_TRANSACTIONS.map((tr) => (
          <View
            key={tr.id}
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              background: 'rgba(15, 23, 42, 0.5)',
              border: '1px solid rgba(148,163,184,0.1)',
            }}
          >
            <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: 500, color: '#e2e8f0' }}>{tr.customer}</Text>
              <View
                style={{
                  padding: '2px 8px',
                  borderRadius: 8,
                  background: `${TRANSACTION_COLORS[tr.type]}22`,
                  border: `1px solid ${TRANSACTION_COLORS[tr.type]}44`,
                }}
              >
                <Text style={{ fontSize: 11, color: TRANSACTION_COLORS[tr.type] }}>
                  {TRANSACTION_LABELS[tr.type]}
                </Text>
              </View>
            </View>
            <View style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <Text style={{ fontSize: 12, color: '#94a3b8' }}>{tr.time} · {tr.items}件商品</Text>
              {tr.type === 'sale' ? (
                <Text style={{ fontSize: 14, fontWeight: 600, color: '#facc15' }}>¥{tr.amount.toLocaleString()}</Text>
              ) : (
                <Text style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>-</Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={{ padding: '16px', color: '#e2e8f0', background: '#0f172a', minHeight: '100vh' }}>
      {/* 顶栏 */}
      <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>导购工具</Text>
        <Text style={{ fontSize: 12, color: '#64748b' }}>{todayStr}</Text>
      </View>

      {/* 快捷操作区 */}
      <View style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        {quickActions.map((qa) => (
          <View
            key={qa.action}
            style={{
              flex: 1,
              padding: '12px 4px',
              borderRadius: 12,
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(148,163,184,0.1)',
              alignItems: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
            onClick={() => handleQuickAction(qa.action)}
          >
            <Text style={{ fontSize: 20 }}>{qa.icon}</Text>
            <Text style={{ fontSize: 11, color: '#94a3b8' }}>{qa.label}</Text>
          </View>
        ))}
      </View>

      {/* Tab 切换 */}
      <View
        style={{
          display: 'flex',
          gap: 0,
          marginTop: 20,
          background: '#1e293b',
          borderRadius: 10,
          padding: 3,
        }}
      >
        {[
          { key: 'task' as const, label: '待办任务', badge: pendingTasks.length },
          { key: 'customer' as const, label: '客户查询' },
          { key: 'transaction' as const, label: '今日交易', badge: todayTransactions },
        ].map((tab) => (
          <View
            key={tab.key}
            style={{
              flex: 1,
              padding: '8px 4px',
              borderRadius: 8,
              background: activeTab === tab.key ? '#334155' : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              display: 'flex',
              gap: 4,
            }}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text style={{ fontSize: 13, fontWeight: activeTab === tab.key ? 600 : 400, color: activeTab === tab.key ? '#e2e8f0' : '#64748b' }}>
              {tab.label}
            </Text>
            {tab.badge !== undefined && tab.badge > 0 ? (
              <View style={{
                padding: '1px 6px',
                borderRadius: 8,
                background: activeTab === tab.key ? '#3b82f6' : '#475569',
              }}>
                <Text style={{ fontSize: 10, color: '#fff' }}>{tab.badge}</Text>
              </View>
            ) : null}
          </View>
        ))}
      </View>

      {/* Tab 内容 */}
      <View style={{ marginTop: 16 }}>
        {activeTab === 'task' && renderTasks()}
        {activeTab === 'customer' && renderCustomers()}
        {activeTab === 'transaction' && renderTransactions()}
      </View>
    </View>
  );
}

// ---- 样式常量 ----

const statRow: React.CSSProperties = {
  display: 'flex',
  gap: 8,
};

const statCard: React.CSSProperties = {
  flex: 1,
  padding: '10px',
  borderRadius: 8,
  background: 'rgba(15, 23, 42, 0.4)',
  border: '1px solid rgba(148,163,184,0.1)',
};

const statLabel: React.CSSProperties = {
  fontSize: 11,
  color: '#94a3b8',
};

const statValue: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  marginTop: 4,
};

const searchInput: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 8,
  background: '#1e293b',
  color: '#e2e8f0',
  fontSize: 14,
  border: '1px solid rgba(148,163,184,0.2)',
};

const smallBtn: React.CSSProperties = {
  padding: '4px 12px',
  borderRadius: 6,
  background: '#2563eb',
  color: '#fff',
  fontSize: 12,
  border: 'none',
  lineHeight: '20px',
  minWidth: 60,
};
