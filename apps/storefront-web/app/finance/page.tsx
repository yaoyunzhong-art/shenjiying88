/**
 * 财务管理 — Finance Page (storefront-web)
 * 角色视角: 👔店长 / 财务主管
 * 功能: 营收总览、退款/支出、净收入、趋势、真实 ledger 对账记录
 */
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getFinanceRangeLabel,
  getFinanceTypeColor,
  loadStorefrontFinanceDashboard,
  type FinanceRange,
  type FinanceRecordType,
  type StorefrontFinanceDashboard,
} from '../../lib/storefront-finance';

const FILTER_OPTIONS: Array<{ value: 'all' | FinanceRecordType; label: string }> = [
  { value: 'all', label: '全部类型' },
  { value: 'income', label: '收入' },
  { value: 'refund', label: '退款' },
  { value: 'expense', label: '支出' },
  { value: 'adjustment', label: '调整' },
];

const RANGE_OPTIONS: Array<{ value: FinanceRange; label: string }> = [
  { value: 'week', label: '近 7 天' },
  { value: 'month', label: '近 30 天' },
  { value: 'all', label: '近 6 个月' },
];

export default function FinancePage() {
  const [dashboard, setDashboard] = useState<StorefrontFinanceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | FinanceRecordType>('all');
  const [dateRange, setDateRange] = useState<FinanceRange>('all');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const nextDashboard = await loadStorefrontFinanceDashboard(dateRange);
      setDashboard(nextDashboard);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '财务数据加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const filteredRecords = useMemo(() => {
    const records = dashboard?.records ?? [];
    const keyword = search.trim().toLowerCase();

    return records.filter((record) => {
      if (typeFilter !== 'all' && record.type !== typeFilter) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      return (
        record.description.toLowerCase().includes(keyword) ||
        record.category.toLowerCase().includes(keyword) ||
        record.orderIdLabel.toLowerCase().includes(keyword) ||
        record.transactionIdLabel.toLowerCase().includes(keyword)
      );
    });
  }, [dashboard?.records, search, typeFilter]);

  const trendMaxRevenue = useMemo(() => {
    return Math.max(...(dashboard?.trend ?? []).map((point) => point.revenue), 1);
  }, [dashboard?.trend]);

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', padding: '24px 32px', background: '#0f172a', textAlign: 'center', paddingTop: 60, color: '#94a3b8' }}>
        正在加载真实财务数据...
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ minHeight: '100vh', padding: '24px 32px', background: '#0f172a', textAlign: 'center', paddingTop: 60, color: '#f87171' }}>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>财务数据获取失败</div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 18 }}>{error}</div>
        <button
          type="button"
          onClick={() => void loadDashboard()}
          style={{ padding: '8px 22px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer' }}
        >
          重新加载
        </button>
      </main>
    );
  }

  if (!dashboard || dashboard.summary.transactionCount === 0) {
    return (
      <main style={{ minHeight: '100vh', padding: '24px 32px', background: '#0f172a', textAlign: 'center', paddingTop: 60, color: '#94a3b8' }}>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: '#e2e8f0' }}>暂无真实财务流水</div>
        <div style={{ fontSize: 13, marginBottom: 18 }}>
          当前 {getFinanceRangeLabel(dateRange)} 尚未形成可展示的 ledger 记录，请先完成真实支付或退款链路。
        </div>
        <button
          type="button"
          onClick={() => void loadDashboard()}
          style={{ padding: '8px 22px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer' }}
        >
          刷新数据
        </button>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', padding: '24px 32px', background: '#0f172a' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>💰 财务管理</h1>
            <p style={{ fontSize: 14, color: '#64748b', margin: '4px 0 0' }}>
              {getFinanceRangeLabel(dateRange)}真实营收 {dashboard.overviewCards[0]?.value ?? '-'} · 净收入 {dashboard.overviewCards[3]?.value ?? '-'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={dateRange}
              onChange={(event) => setDateRange(event.target.value as FinanceRange)}
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                background: 'rgba(15,23,42,0.5)',
                border: '1px solid rgba(148,163,184,0.15)',
                color: '#e2e8f0',
                fontSize: 12,
                outline: 'none',
              }}
            >
              {RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void loadDashboard()}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(148,163,184,0.15)', background: 'rgba(15,23,42,0.5)', color: '#e2e8f0', cursor: 'pointer' }}
            >
              刷新
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
          {dashboard.overviewCards.map((card) => (
            <div
              key={card.label}
              style={{
                padding: '16px 18px',
                borderRadius: 12,
                background: 'rgba(30,41,59,0.8)',
                border: '1px solid rgba(148,163,184,0.12)',
              }}
            >
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>
                {card.label}
                {card.hint ? (
                  <span style={{ marginLeft: 8, fontSize: 11, color: card.hint.startsWith('↑') ? '#34d399' : '#f87171' }}>
                    {card.hint}
                  </span>
                ) : null}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: card.color }}>{card.value}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            padding: 20,
            borderRadius: 12,
            marginBottom: 24,
            background: 'rgba(30,41,59,0.8)',
            border: '1px solid rgba(148,163,184,0.12)',
          }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 16 }}>📈 近 6 个月收入趋势</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 140 }}>
            {dashboard.trend.map((point) => {
              const height = (point.revenue / trendMaxRevenue) * 100;
              return (
                <div key={point.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: 9, color: '#94a3b8' }}>¥{(point.revenue / 10000).toFixed(1)}w</div>
                  <div
                    style={{
                      width: '70%',
                      background: `linear-gradient(to top, ${point.netRevenue >= 0 ? '#3b82f6' : '#f87171'}, ${point.netRevenue >= 0 ? '#60a5fa' : '#fca5a5'})`,
                      borderRadius: '4px 4px 0 0',
                      height: `${Math.max(height, 4)}%`,
                      transition: 'height 0.3s',
                    }}
                  />
                  <div style={{ fontSize: 9, color: '#64748b', marginTop: 4 }}>{point.month.slice(5)}月</div>
                  <div style={{ fontSize: 8, color: '#475569' }}>{point.transactionCount}笔</div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          style={{
            padding: 20,
            borderRadius: 12,
            marginBottom: 24,
            background: 'rgba(30,41,59,0.8)',
            border: '1px solid rgba(148,163,184,0.12)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 10, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>📋 真实财务流水</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as 'all' | FinanceRecordType)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 8,
                  background: 'rgba(15,23,42,0.5)',
                  border: '1px solid rgba(148,163,184,0.15)',
                  color: '#e2e8f0',
                  fontSize: 12,
                  outline: 'none',
                }}
              >
                {FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <input
            placeholder="🔍 搜索描述、分类、订单号、交易号..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 10,
              marginBottom: 12,
              background: 'rgba(15,23,42,0.5)',
              border: '1px solid rgba(148,163,184,0.15)',
              color: '#e2e8f0',
              fontSize: 13,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          {filteredRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', fontSize: 13 }}>
              当前筛选条件下没有匹配的真实流水
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.15)' }}>
                  <th style={{ padding: '10px 8px', textAlign: 'left', color: '#94a3b8', fontWeight: 600, fontSize: 12 }}>入账时间</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left', color: '#94a3b8', fontWeight: 600, fontSize: 12 }}>类型</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left', color: '#94a3b8', fontWeight: 600, fontSize: 12 }}>分类</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right', color: '#94a3b8', fontWeight: 600, fontSize: 12 }}>金额</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left', color: '#94a3b8', fontWeight: 600, fontSize: 12 }}>描述</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center', color: '#94a3b8', fontWeight: 600, fontSize: 12 }}>状态</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left', color: '#94a3b8', fontWeight: 600, fontSize: 12 }}>订单号</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left', color: '#94a3b8', fontWeight: 600, fontSize: 12 }}>交易号</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id} style={{ borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                    <td style={{ padding: '8px', color: '#64748b', fontSize: 12 }}>{record.timestamp}</td>
                    <td style={{ padding: '8px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          color: getFinanceTypeColor(record.type),
                          background: `${getFinanceTypeColor(record.type)}15`,
                        }}
                      >
                        {record.typeLabel}
                      </span>
                    </td>
                    <td style={{ padding: '8px', color: '#e2e8f0' }}>{record.category}</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: record.amount >= 0 ? '#34d399' : '#f87171', fontWeight: 600 }}>
                      {record.amountLabel}
                    </td>
                    <td style={{ padding: '8px', color: '#94a3b8' }}>{record.description}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <span
                        style={{
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontSize: 11,
                          color: record.statusColor,
                          border: `1px solid ${record.statusColor}30`,
                        }}
                      >
                        {record.statusLabel}
                      </span>
                    </td>
                    <td style={{ padding: '8px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: 12 }}>{record.orderIdLabel}</td>
                    <td style={{ padding: '8px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: 12 }}>{record.transactionIdLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div style={{ marginTop: 12, fontSize: 12, color: '#475569', textAlign: 'center' }}>
            共 {filteredRecords.length} 条真实流水
          </div>
        </div>

        <div style={{ fontSize: 12, color: '#475569', textAlign: 'center' }}>
          财务数据更新于 {new Date().toLocaleString('zh-CN')} · 数据源: `finance/revenue/summary` + `finance/ledgers`
        </div>
      </div>
    </main>
  );
}
