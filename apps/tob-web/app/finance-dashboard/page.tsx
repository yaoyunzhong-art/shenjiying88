'use client';

import React, { useState, useEffect } from 'react';
import { PageShell } from '@m5/ui';
import {
  MOCK_STORE_PANDL,
  MOCK_BRAND_PANDL,
  MOCK_TRANSACTION_LOGS,
  TRANSACTION_STATUS_LABELS,
  TRANSACTION_STATUS_COLORS,
  formatCurrency,
  formatPercent,
  formatDate,
  getAccountTypeLabel,
  type StorePAndL,
  type BrandPAndL,
  type AccountTransactionLog,
  type TransactionStatus,
} from './finance-dashboard-data';
import {
  getAllStorePAndL,
  getBrandPAndL,
  getTransactionLogs,
  formatPeriodDisplay,
} from './finance-dashboard-service';

type Tab = 'store-pandl' | 'brand-pandl' | 'transaction-logs';

export default function FinanceDashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('store-pandl');
  const [storePAndL, setStorePAndL] = useState<StorePAndL[]>(MOCK_STORE_PANDL);
  const [brandPAndL, setBrandPAndL] = useState<BrandPAndL | null>(MOCK_BRAND_PANDL);
  const [transactionLogs, setTransactionLogs] = useState<AccountTransactionLog[]>(MOCK_TRANSACTION_LOGS);
  const [selectedPeriod, setSelectedPeriod] = useState('2026-06');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | ''>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  async function loadData() {
    setLoading(true);
    try {
      const [stores, brand, logs] = await Promise.all([
        getAllStorePAndL({ year: 2026, month: 6 }),
        getBrandPAndL('BRAND001', { year: 2026, month: 6 }),
        getTransactionLogs(statusFilter ? { status: statusFilter as TransactionStatus } : undefined),
      ]);
      setStorePAndL(stores);
      setBrandPAndL(brand);
      setTransactionLogs(logs);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === 'transaction-logs') {
      loadData();
    }
  }, [statusFilter]);

  function handleStatusFilterChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setStatusFilter(e.target.value as TransactionStatus | '');
  }

  return (
    <PageShell title="财务看板" description="门店损益、品牌损益、分账日志">
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid rgba(148,163,184,0.2)', paddingBottom: 12 }}>
        {(['store-pandl', 'brand-pandl', 'transaction-logs'] as Tab[]).map(tab => {
          const labels: Record<Tab, string> = {
            'store-pandl': '门店损益',
            'brand-pandl': '品牌损益',
            'transaction-logs': '分账日志',
          };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 20px',
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === tab ? 'linear-gradient(135deg, #3b82f6, #60a5fa)' : 'rgba(148,163,184,0.1)',
                color: activeTab === tab ? '#ffffff' : '#94a3b8',
                transition: 'all 0.2s ease',
              }}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* ===================== 门店损益 ===================== */}
      {activeTab === 'store-pandl' && (
        <div>
          {/* Period Selector */}
          <div style={{ marginBottom: 20 }}>
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              style={{
                padding: '10px 16px',
                fontSize: 14,
                borderRadius: 8,
                border: '1px solid rgba(148,163,184,0.2)',
                background: 'rgba(30,41,59,0.9)',
                color: '#e2e8f0',
                minWidth: 160,
              }}
            >
              <option value="2026-06">2026年6月</option>
              <option value="2026-05">2026年5月</option>
              <option value="2026-04">2026年4月</option>
            </select>
          </div>

          {/* Store Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {storePAndL.map(store => (
              <div key={store.storeId} style={{
                padding: 20,
                background: 'rgba(30,41,59,0.9)',
                border: '1px solid rgba(148,163,184,0.12)',
                borderRadius: 12,
              }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc', margin: '0 0 16px' }}>{store.storeName}</h3>
                <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px' }}>{formatPeriodDisplay(store.period)}</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <MetricCard label="营收" value={formatCurrency(store.revenue)} color="#3b82f6" />
                  <MetricCard label="成本" value={formatCurrency(store.costOfGoods)} color="#ef4444" />
                  <MetricCard label="毛利" value={formatCurrency(store.grossProfit)} color="#22c55e" />
                  <MetricCard label="毛利率" value={formatPercent(store.grossMargin)} color="#22c55e" />
                  <MetricCard label="营业利润" value={formatCurrency(store.operatingProfit)} color="#8b5cf6" />
                  <MetricCard label="利润率" value={formatPercent(store.operatingMargin)} color="#8b5cf6" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== 品牌损益 ===================== */}
      {activeTab === 'brand-pandl' && brandPAndL && (
        <div>
          {/* Brand Summary */}
          <div style={{
            padding: 24,
            background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))',
            border: '1px solid rgba(148,163,184,0.12)',
            borderRadius: 12,
            marginBottom: 24,
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: '0 0 16px' }}>
              {brandPAndL.brandName} {formatPeriodDisplay(brandPAndL.period)} 汇总
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
              <MetricCard label="营收合计" value={formatCurrency(brandPAndL.totalRevenue)} color="#3b82f6" />
              <MetricCard label="成本合计" value={formatCurrency(brandPAndL.totalCostOfGoods)} color="#ef4444" />
              <MetricCard label="毛利合计" value={formatCurrency(brandPAndL.totalGrossProfit)} color="#22c55e" />
              <MetricCard label="内部往来抵销" value={formatCurrency(brandPAndL.internalTransaction_elimination)} color="#f59e0b" />
              <MetricCard label="品牌净收入" value={formatCurrency(brandPAndL.brandNetRevenue)} color="#8b5cf6" large />
            </div>
          </div>

          {/* Store Details Table */}
          <div style={{
            background: 'rgba(30,41,59,0.9)',
            border: '1px solid rgba(148,163,184,0.12)',
            borderRadius: 12,
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(15,23,42,0.8)' }}>
                  <th style={thStyle}>门店</th>
                  <th style={thStyle}>营收</th>
                  <th style={thStyle}>成本</th>
                  <th style={thStyle}>毛利</th>
                  <th style={thStyle}>毛利率</th>
                  <th style={thStyle}>营业利润</th>
                  <th style={thStyle}>利润率</th>
                </tr>
              </thead>
              <tbody>
                {brandPAndL.stores.map(store => (
                  <tr key={store.storeId} style={{ borderTop: '1px solid rgba(148,163,184,0.08)' }}>
                    <td style={tdStyle}>{store.storeName}</td>
                    <td style={tdStyle}>{formatCurrency(store.revenue)}</td>
                    <td style={tdStyle}>{formatCurrency(store.costOfGoods)}</td>
                    <td style={tdStyle}>{formatCurrency(store.grossProfit)}</td>
                    <td style={tdStyle}>{formatPercent(store.grossMargin)}</td>
                    <td style={{ ...tdStyle, color: '#8b5cf6', fontWeight: 600 }}>{formatCurrency(store.operatingProfit)}</td>
                    <td style={{ ...tdStyle, color: '#8b5cf6', fontWeight: 600 }}>{formatPercent(store.operatingMargin)}</td>
                  </tr>
                ))}
                <tr style={{ background: 'rgba(59,130,246,0.1)', fontWeight: 700 }}>
                  <td style={{ ...tdStyle, color: '#f8fafc' }}>合计</td>
                  <td style={{ ...tdStyle, color: '#3b82f6' }}>{formatCurrency(brandPAndL.totalRevenue)}</td>
                  <td style={{ ...tdStyle, color: '#ef4444' }}>{formatCurrency(brandPAndL.totalCostOfGoods)}</td>
                  <td style={{ ...tdStyle, color: '#22c55e' }}>{formatCurrency(brandPAndL.totalGrossProfit)}</td>
                  <td style={{ ...tdStyle, color: '#22c55e' }}>{formatPercent(brandPAndL.totalGrossProfit / brandPAndL.totalRevenue)}</td>
                  <td style={{ ...tdStyle, color: '#8b5cf6' }}>{formatCurrency(brandPAndL.totalGrossProfit - brandPAndL.internalTransaction_elimination)}</td>
                  <td style={{ ...tdStyle, color: '#8b5cf6' }}>{formatPercent((brandPAndL.totalGrossProfit - brandPAndL.internalTransaction_elimination) / brandPAndL.totalRevenue)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== 分账日志 ===================== */}
      {activeTab === 'transaction-logs' && (
        <div>
          {/* Status Filter */}
          <div style={{ marginBottom: 20 }}>
            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              style={{
                padding: '10px 16px',
                fontSize: 14,
                borderRadius: 8,
                border: '1px solid rgba(148,163,184,0.2)',
                background: 'rgba(30,41,59,0.9)',
                color: '#e2e8f0',
                minWidth: 160,
              }}
            >
              <option value="">全部状态</option>
              <option value="pending">待分账</option>
              <option value="split">已分账</option>
              <option value="transferred">已划转</option>
              <option value="completed">已完成</option>
              <option value="failed">失败</option>
            </select>
          </div>

          {/* Transaction Logs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {transactionLogs.map(log => (
              <div key={log.logId} style={{
                padding: 18,
                background: 'rgba(30,41,59,0.9)',
                border: '1px solid rgba(148,163,184,0.12)',
                borderRadius: 10,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', margin: '0 0 4px' }}>
                      {log.transactionId}
                    </p>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                      {log.accountName} <span style={{ color: '#64748b' }}>({getAccountTypeLabel(log.accountType)})</span>
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: 4,
                      background: TRANSACTION_STATUS_COLORS[log.status],
                      color: ['pending', 'failed'].includes(log.status) ? '#ffffff' : '#0f172a',
                    }}>
                      {TRANSACTION_STATUS_LABELS[log.status]}
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>
                      {formatCurrency(log.amount)}
                    </span>
                    {log.splitRatio > 0 && (
                      <span style={{ fontSize: 11, color: '#64748b' }}>分账比例 {formatPercent(log.splitRatio)}</span>
                    )}
                  </div>
                </div>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{log.remarks}</p>
                {/* Status Timeline */}
                <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>创建: {formatDate(log.createdAt)}</span>
                  {log.updatedAt !== log.createdAt && (
                    <>
                      <span style={{ color: '#475569' }}>→</span>
                      <span style={{ fontSize: 11, color: '#64748b' }}>更新: {formatDate(log.updatedAt)}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 14 }}>
          加载中...
        </div>
      )}
    </PageShell>
  );
}

// ===================== Sub-components =====================

function MetricCard({ label, value, color, large }: { label: string; value: string; color: string; large?: boolean }) {
  return (
    <div>
      <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 4px' }}>{label}</p>
      <p style={{
        fontSize: large ? 18 : 15,
        fontWeight: 700,
        color: color,
        margin: 0,
      }}>
        {value}
      </p>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: 12,
  fontWeight: 600,
  color: '#94a3b8',
  textAlign: 'right',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: 13,
  color: '#e2e8f0',
  textAlign: 'right',
};
