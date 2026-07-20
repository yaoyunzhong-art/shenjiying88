/**
 * 财务管理 — Finance Page (storefront-web)
 * 角色视角: 👔店长 / 财务主管
 * 功能: 营收总览、支出分析、利润统计、月度趋势、对账记录
 * 数据源: 真实 API — GET /finance/revenue/summary + GET /finance/ledgers
 */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  loadStorefrontFinanceDashboard,
  getFinanceTypeLabel,
  getFinanceTypeColor,
  type FinanceRecordViewModel,
  type FinanceOverviewCard,
  type FinanceTrendPoint,
  type StorefrontFinanceDashboard,
} from '../../lib/storefront-finance';

/* ── UI Constants ── */
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | 'week' | 'month'>('all');

  // ── 真实数据状态 ──
  const [dashboard, setDashboard] = useState<StorefrontFinanceDashboard | null>(null);

  // ── 数据加载 ──
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await loadStorefrontFinanceDashboard(dateRange);
      setDashboard(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '数据加载异常');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── 筛选流水 ──
  const filteredTransactions = useMemo(() => {
    if (!dashboard) return [];
    const kw = search.trim().toLowerCase();
    return dashboard.records.filter(tx => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (kw && !tx.description.toLowerCase().includes(kw) && !tx.category.toLowerCase().includes(kw) && !(tx.orderIdLabel || '').toLowerCase().includes(kw)) return false;
      return true;
    });
  }, [dashboard, search, typeFilter]);

  // ── 三态判断 ──
  if (loading) {
    return (
      <main style={{ minHeight: '100vh', padding: '24px 32px', background: '#0f172a', textAlign: 'center', paddingTop: 60 }}>
        <div style={{ color: '#94a3b8', fontSize: 14 }}>加载中...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ minHeight: '100vh', padding: '24px 32px', background: '#0f172a', textAlign: 'center', paddingTop: 60 }}>
        <div style={{ color: '#f87171', fontSize: 14, marginBottom: 16 }}>数据获取失败: {error}</div>
        <button
          onClick={loadData}
          style={{
            padding: '8px 20px', borderRadius: 8, cursor: 'pointer',
            background: '#3b82f6', color: '#fff', border: 'none', fontSize: 13,
          }}
        >
          重新加载
        </button>
      </main>
    );
  }

  if (!dashboard || dashboard.records.length === 0) {
    return (
      <main style={{ minHeight: '100vh', padding: '24px 32px', background: '#0f172a', textAlign: 'center', paddingTop: 60 }}>
        <div style={{ color: '#94a3b8', fontSize: 14, marginBottom: 12 }}>暂无财务数据</div>
        <div style={{ color: '#64748b', fontSize: 12 }}>系统将在产生订单后自动生成财务流水</div>
      </main>
    );
  }

  // ── 渲染 ──
  return (
    <main style={{ minHeight: '100vh', padding: '24px 32px', background: '#0f172a' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* 标题 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>💰 财务管理</h1>
            <p style={{ fontSize: 14, color: '#64748b', margin: '4px 0 0' }}>
              近半年营收 {formatCurrency(dashboard.summary.totalRevenue)} · 净收入 {formatCurrency(dashboard.summary.netRevenue)}
            </p>
          </div>
        </div>

        {/* 核心指标卡片 */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14, marginBottom: 24,
        }}>
          {dashboard.overviewCards.map((card, index) => (
            <div key={index} style={{
              padding: '16px 18px', borderRadius: 12,
              background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.12)',
            }}>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>
                {card.label}
                {card.hint && (
                  <span style={{ marginLeft: 8, fontSize: 11, color: card.hint.startsWith('↑') ? '#34d399' : '#f87171' }}>
                    {card.hint}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: card.color }}>{card.value}</div>
            </div>
          ))}
        </div>

        {/* 月度营收趋势 */}
        <div style={{
          padding: 20, borderRadius: 12, marginBottom: 24,
          background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.12)',
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 16 }}>📈 月度营收趋势</h3>
          {dashboard.trend.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748b', fontSize: 13 }}>
              暂无趋势数据
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 140 }}>
              {dashboard.trend.map(m => {
                const maxRev = Math.max(...dashboard.trend.map(x => x.revenue), 1);
                const h = (m.revenue / maxRev) * 100;
                return (
                  <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: 9, color: '#94a3b8' }}>¥{(m.revenue / 10000).toFixed(1)}w</div>
                    <div style={{
                      width: '70%',
                      background: `linear-gradient(to top, ${m.netRevenue > 0 ? '#3b82f6' : '#f87171'}, ${m.netRevenue > 0 ? '#60a5fa' : '#fca5a5'})`,
                      borderRadius: '4px 4px 0 0', height: `${Math.max(h, 4)}%`, transition: 'height 0.3s',
                    }} />
                    <div style={{ fontSize: 9, color: '#64748b', marginTop: 4 }}>{m.month.slice(5)}月</div>
                    <div style={{ fontSize: 8, color: '#475569' }}>{m.transactionCount}单</div>
                  </div>
                );
              })}
            </div>
          )}
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
                <option value="refund">退款</option>
              </select>
            </div>
          </div>

          <input
            placeholder="🔍 搜索描述、分类..."
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
                  <th style={{ padding: '10px 8px', textAlign: 'left', color: '#94a3b8', fontWeight: 600, fontSize: 12 }}>关联订单</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(tx => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                    <td style={{ padding: '8px', color: '#64748b', fontSize: 12 }}>{tx.date}</td>
                    <td style={{ padding: '8px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                        color: getFinanceTypeColor(tx.type),
                        background: `${getFinanceTypeColor(tx.type)}15`,
                      }}>
                        {getFinanceTypeLabel(tx.type)}
                      </span>
                    </td>
                    <td style={{ padding: '8px', color: '#e2e8f0' }}>{tx.category}</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: tx.type === 'income' ? '#34d399' : '#f87171', fontWeight: 600 }}>
                      {tx.amountLabel}
                    </td>
                    <td style={{ padding: '8px', color: '#94a3b8' }}>{tx.description}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <span style={{
                        padding: '2px 6px', borderRadius: 4, fontSize: 11,
                        color: tx.statusColor, border: `1px solid ${tx.statusColor}30`,
                      }}>
                        {tx.statusLabel}
                      </span>
                    </td>
                    <td style={{ padding: '8px', color: '#e2e8f0', fontSize: 11 }}>{tx.orderIdLabel}</td>
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
