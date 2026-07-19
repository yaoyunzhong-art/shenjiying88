/**
 * 财务管理 — Finance Page (storefront-web)
 * 角色视角: 👔店长 / 财务主管
 * 功能: 营收总览、支出分析、利润统计、月度趋势、对账记录
 */
'use client';

import React, { useState, useMemo } from 'react';

/* ── Types ── */
type TransactionType = 'income' | 'expense' | 'transfer';

interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod: string;
  operator: string;
}

interface MonthlyFinance {
  month: string;
  revenue: number;
  cost: number;
  profit: number;
  orderCount: number;
}

/* ── Mock Data ── */
const MONTHLY_DATA: MonthlyFinance[] = [
  { month: '2026-01', revenue: 385200, cost: 231120, profit: 154080, orderCount: 1240 },
  { month: '2026-02', revenue: 356800, cost: 214080, profit: 142720, orderCount: 1100 },
  { month: '2026-03', revenue: 423500, cost: 254100, profit: 169400, orderCount: 1380 },
  { month: '2026-04', revenue: 458000, cost: 274800, profit: 183200, orderCount: 1450 },
  { month: '2026-05', revenue: 489600, cost: 293760, profit: 195840, orderCount: 1520 },
  { month: '2026-06', revenue: 512300, cost: 307380, profit: 204920, orderCount: 1610 },
];

const TRANSACTIONS: Transaction[] = [
  { id: 'tx-001', date: '2026-06-28', type: 'income', category: '零售收入', amount: 28560, description: '日营业收入', status: 'completed', paymentMethod: '微信支付', operator: '赵强' },
  { id: 'tx-002', date: '2026-06-28', type: 'income', category: '会员充值', amount: 12000, description: '会员卡充值收入', status: 'completed', paymentMethod: '支付宝', operator: '李华' },
  { id: 'tx-003', date: '2026-06-28', type: 'expense', category: '采购支出', amount: 8530, description: '饮品原料采购', status: 'completed', paymentMethod: '银行转账', operator: '黄丽' },
  { id: 'tx-004', date: '2026-06-28', type: 'expense', category: '水电物业', amount: 3200, description: '月度水电费', status: 'pending', paymentMethod: '银行转账', operator: '系统' },
  { id: 'tx-005', date: '2026-06-27', type: 'income', category: '设备租赁', amount: 4800, description: '游戏设备租赁收入', status: 'completed', paymentMethod: '现金', operator: '刘洋' },
  { id: 'tx-006', date: '2026-06-27', type: 'expense', category: '员工薪资', amount: 35000, description: '6月基本工资', status: 'completed', paymentMethod: '银行转账', operator: '系统' },
  { id: 'tx-007', date: '2026-06-27', type: 'expense', category: '营销推广', amount: 5200, description: '端午节活动费用', status: 'completed', paymentMethod: '支付宝', operator: '胡伟' },
  { id: 'tx-008', date: '2026-06-26', type: 'income', category: '零售收入', amount: 26340, description: '日营业收入', status: 'completed', paymentMethod: '微信支付', operator: '赵强' },
  { id: 'tx-009', date: '2026-06-26', type: 'expense', category: '维修保养', amount: 1800, description: '设备维保费用', status: 'failed', paymentMethod: '微信支付', operator: '周杰' },
  { id: 'tx-010', date: '2026-06-25', type: 'income', category: '活动收入', amount: 15000, description: '电竞赛事场地费', status: 'completed', paymentMethod: '支付宝', operator: '马超' },
  { id: 'tx-011', date: '2026-06-25', type: 'expense', category: '办公用品', amount: 680, description: '办公耗材采购', status: 'completed', paymentMethod: '微信支付', operator: '王芳' },
  { id: 'tx-012', date: '2026-06-24', type: 'income', category: '零售收入', amount: 22100, description: '日营业收入', status: 'completed', paymentMethod: '现金', operator: '赵强' },
];

const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  income: '收入',
  expense: '支出',
  transfer: '转账',
};

const TRANSACTION_TYPE_COLORS: Record<TransactionType, string> = {
  income: '#34d399',
  expense: '#f87171',
  transfer: '#60a5fa',
};

const STATUS_LABELS: Record<string, string> = {
  completed: '已完成',
  pending: '处理中',
  failed: '失败',
};

const STATUS_COLORS: Record<string, string> = {
  completed: '#34d399',
  pending: '#fbbf24',
  failed: '#f87171',
};

/* ── Helpers ── */
function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

/* ── 主组件 ── */
export default function FinancePage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | 'week' | 'month'>('all');

  const filteredTransactions = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return TRANSACTIONS.filter(tx => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (kw && !tx.description.toLowerCase().includes(kw) && !tx.category.toLowerCase().includes(kw) && !tx.operator.toLowerCase().includes(kw)) return false;
      return true;
    });
  }, [search, typeFilter]);

  const stats = useMemo(() => {
    const totalRevenue = MONTHLY_DATA.reduce((s, m) => s + m.revenue, 0);
    const totalCost = MONTHLY_DATA.reduce((s, m) => s + m.cost, 0);
    const totalProfit = MONTHLY_DATA.reduce((s, m) => s + m.profit, 0);
    const totalOrders = MONTHLY_DATA.reduce((s, m) => s + m.orderCount, 0);
    const profitRate = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const latestMonth = MONTHLY_DATA[MONTHLY_DATA.length - 1];
    const prevMonth = MONTHLY_DATA.length >= 2 ? MONTHLY_DATA[MONTHLY_DATA.length - 2] : null;
    const momGrowth = prevMonth && prevMonth.revenue > 0
      ? ((latestMonth!.revenue - prevMonth.revenue) / prevMonth.revenue) * 100
      : 0;
    return { totalRevenue, totalCost, totalProfit, totalOrders, profitRate, momGrowth };
  }, []);

  return (
    <main style={{ minHeight: '100vh', padding: '24px 32px', background: '#0f172a' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* 标题 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>💰 财务管理</h1>
            <p style={{ fontSize: 14, color: '#64748b', margin: '4px 0 0' }}>
              近半年营收 {formatCurrency(stats.totalRevenue)} · 净利润 {formatCurrency(stats.totalProfit)}
            </p>
          </div>
        </div>

        {/* 核心指标卡片 */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14, marginBottom: 24,
        }}>
          <div style={{
            padding: '16px 18px', borderRadius: 12,
            background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.12)',
          }}>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>
              近半年总营收
              <span style={{ marginLeft: 8, fontSize: 11, color: stats.momGrowth >= 0 ? '#34d399' : '#f87171' }}>
                {stats.momGrowth >= 0 ? '↑' : '↓'} {Math.abs(stats.momGrowth).toFixed(1)}%
              </span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#34d399' }}>{formatCurrency(stats.totalRevenue)}</div>
          </div>
          <div style={{
            padding: '16px 18px', borderRadius: 12,
            background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.12)',
          }}>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>总支出</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#f87171' }}>{formatCurrency(stats.totalCost)}</div>
          </div>
          <div style={{
            padding: '16px 18px', borderRadius: 12,
            background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.12)',
          }}>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>净利润</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#60a5fa' }}>{formatCurrency(stats.totalProfit)}</div>
          </div>
          <div style={{
            padding: '16px 18px', borderRadius: 12,
            background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.12)',
          }}>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>利润率</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: stats.profitRate >= 35 ? '#34d399' : '#fbbf24' }}>
              {stats.profitRate.toFixed(1)}%
            </div>
          </div>
          <div style={{
            padding: '16px 18px', borderRadius: 12,
            background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.12)',
          }}>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>总订单量</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#a78bfa' }}>{stats.totalOrders.toLocaleString()}</div>
          </div>
        </div>

        {/* 月度营收趋势 */}
        <div style={{
          padding: 20, borderRadius: 12, marginBottom: 24,
          background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.12)',
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 16 }}>📈 月度营收趋势</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 140 }}>
            {MONTHLY_DATA.map(m => {
              const maxRev = Math.max(...MONTHLY_DATA.map(x => x.revenue), 1);
              const h = (m.revenue / maxRev) * 100;
              return (
                <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: 9, color: '#94a3b8' }}>¥{(m.revenue / 10000).toFixed(1)}w</div>
                  <div style={{
                    width: '70%',
                    background: `linear-gradient(to top, ${m.profit > 0 ? '#3b82f6' : '#f87171'}, ${m.profit > 0 ? '#60a5fa' : '#fca5a5'})`,
                    borderRadius: '4px 4px 0 0', height: `${Math.max(h, 4)}%`, transition: 'height 0.3s',
                  }} />
                  <div style={{ fontSize: 9, color: '#64748b', marginTop: 4 }}>{m.month.slice(5)}月</div>
                  <div style={{ fontSize: 8, color: '#475569' }}>{m.orderCount}单</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 对账记录 */}
        <div style={{
          padding: 20, borderRadius: 12, marginBottom: 24,
          background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.12)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>📋 对账记录</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                style={{
                  padding: '6px 10px', borderRadius: 8,
                  background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(148,163,184,0.15)',
                  color: '#e2e8f0', fontSize: 12, outline: 'none',
                }}
              >
                <option value="all">全部类型</option>
                <option value="income">收入</option>
                <option value="expense">支出</option>
              </select>
            </div>
          </div>

          <input
            placeholder="🔍 搜索描述、分类、操作人..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 10, marginBottom: 12,
              background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(148,163,184,0.15)',
              color: '#e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box',
            }}
          />

          {filteredTransactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', fontSize: 13 }}>
              未找到匹配的对账记录
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.15)' }}>
                  <th style={{ padding: '10px 8px', textAlign: 'left', color: '#94a3b8', fontWeight: 600, fontSize: 12 }}>日期</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left', color: '#94a3b8', fontWeight: 600, fontSize: 12 }}>类型</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left', color: '#94a3b8', fontWeight: 600, fontSize: 12 }}>分类</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right', color: '#94a3b8', fontWeight: 600, fontSize: 12 }}>金额</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left', color: '#94a3b8', fontWeight: 600, fontSize: 12 }}>描述</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center', color: '#94a3b8', fontWeight: 600, fontSize: 12 }}>状态</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left', color: '#94a3b8', fontWeight: 600, fontSize: 12 }}>操作人</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(tx => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                    <td style={{ padding: '8px', color: '#64748b', fontSize: 12 }}>{tx.date}</td>
                    <td style={{ padding: '8px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                        color: TRANSACTION_TYPE_COLORS[tx.type],
                        background: `${TRANSACTION_TYPE_COLORS[tx.type]}15`,
                      }}>
                        {TRANSACTION_TYPE_LABELS[tx.type]}
                      </span>
                    </td>
                    <td style={{ padding: '8px', color: '#e2e8f0' }}>{tx.category}</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: tx.type === 'income' ? '#34d399' : '#f87171', fontWeight: 600 }}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                    <td style={{ padding: '8px', color: '#94a3b8' }}>{tx.description}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <span style={{
                        padding: '2px 6px', borderRadius: 4, fontSize: 11,
                        color: STATUS_COLORS[tx.status], border: `1px solid ${STATUS_COLORS[tx.status]}30`,
                      }}>
                        {STATUS_LABELS[tx.status]}
                      </span>
                    </td>
                    <td style={{ padding: '8px', color: '#e2e8f0' }}>{tx.operator}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div style={{ marginTop: 12, fontSize: 12, color: '#475569', textAlign: 'center' }}>
            共 {filteredTransactions.length} 条记录
          </div>
        </div>

        {/* 数据时间脚注 */}
        <div style={{ fontSize: 12, color: '#475569', textAlign: 'center' }}>
          财务数据更新于 {new Date().toLocaleString('zh-CN')} · 仅供参考
        </div>
      </div>
    </main>
  );
}
