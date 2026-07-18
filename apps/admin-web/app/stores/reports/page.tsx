'use client';

/**
 * 门店报表页 — 门店维度经营报表
 * 展示门店/日期/门票/游戏币/餐饮/其他/总营收/成本/利润/净利率
 */
import { useState, useMemo, useCallback, useEffect } from 'react';

import {
  DataTable,
  PageShell,
  Tabs,
  StatusBadge,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

// ─── 类型 ────────────────────────────────────────────────

export interface StoreReportRow {
  storeId: string;
  storeName: string;
  date: string;
  admissionFee: number;    // 门票（营收费）
  coinRevenue: number;     // 游戏币收入
  diningRevenue: number;   // 餐饮收入
  otherRevenue: number;    // 其他收入
  totalRevenue: number;    // 总营收
  cost: number;            // 成本
  profit: number;          // 利润
  profitRate: number;      // 净利率（小数）
}

export type ProfitFilter = 'ALL' | 'PROFIT' | 'LOSS';

export interface StoreReportSummary {
  totalRevenue: number;
  totalProfit: number;
  profitableCount: number;
  lossCount: number;
}

// ─── 默认样本数据 ─────────────────────────────────────────

export const DEFAULT_STORE_REPORTS: StoreReportRow[] = [
  { storeId: 's1', storeName: '朝阳大悦城旗舰店', date: '2026-07-18', admissionFee: 28500, coinRevenue: 62300, diningRevenue: 41800, otherRevenue: 3400, totalRevenue: 136000, cost: 88700, profit: 47300, profitRate: 0.3478 },
  { storeId: 's2', storeName: '上海陆家嘴中心店', date: '2026-07-18', admissionFee: 19200, coinRevenue: 48600, diningRevenue: 35200, otherRevenue: 5000, totalRevenue: 108000, cost: 75600, profit: 32400, profitRate: 0.3000 },
  { storeId: 's3', storeName: '深圳万象天地店', date: '2026-07-18', admissionFee: 8100, coinRevenue: 21500, diningRevenue: 12400, otherRevenue: 1000, totalRevenue: 43000, cost: 35800, profit: 7200, profitRate: 0.1674 },
  { storeId: 's4', storeName: '成都太古里体验店', date: '2026-07-18', admissionFee: 15600, coinRevenue: 37900, diningRevenue: 28600, otherRevenue: 3900, totalRevenue: 86000, cost: 61100, profit: 24900, profitRate: 0.2895 },
  { storeId: 's5', storeName: '杭州银泰旗舰店', date: '2026-07-18', admissionFee: 9800, coinRevenue: 14200, diningRevenue: 8700, otherRevenue: 1300, totalRevenue: 34000, cost: 39600, profit: -5600, profitRate: -0.1647 },
];

const API_PATH = '/api/stores/reports';

// ─── 数据获取 ─────────────────────────────────────────────

async function fetchStoreReports(): Promise<StoreReportRow[]> {
  try {
    const res = await fetch(API_PATH);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    if (body.success && Array.isArray(body.data)) {
      return body.data as StoreReportRow[];
    }
    return DEFAULT_STORE_REPORTS;
  } catch {
    return DEFAULT_STORE_REPORTS;
  }
}

// ─── 列定义 ───────────────────────────────────────────────

function formatYuan(cents: number): string {
  return `¥${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function buildColumns(): DataTableColumn<StoreReportRow>[] {
  return [
    { key: 'storeName', title: '门店', dataKey: 'storeName', sortable: true },
    { key: 'admissionFee', title: '门票', sortable: true, align: 'right', render: (item: StoreReportRow) => formatYuan(item.admissionFee) },
    { key: 'coinRevenue', title: '游戏币', sortable: true, align: 'right', render: (item: StoreReportRow) => formatYuan(item.coinRevenue) },
    { key: 'diningRevenue', title: '餐饮', sortable: true, align: 'right', render: (item: StoreReportRow) => formatYuan(item.diningRevenue) },
    { key: 'otherRevenue', title: '其他', sortable: true, align: 'right', render: (item: StoreReportRow) => formatYuan(item.otherRevenue) },
    { key: 'totalRevenue', title: '总营收', sortable: true, align: 'right', render: (item: StoreReportRow) => formatYuan(item.totalRevenue) },
    { key: 'cost', title: '成本', sortable: true, align: 'right', render: (item: StoreReportRow) => formatYuan(item.cost) },
    {
      key: 'profit', title: '利润', sortable: true, align: 'right',
      render: (item: StoreReportRow) => {
        const color = item.profit >= 0 ? '#4ade80' : '#f87171';
        return <span style={{ color, fontWeight: 600 }}>{formatYuan(item.profit)}</span>;
      },
    },
    {
      key: 'profitRate', title: '净利率', sortable: true, align: 'right',
      sortValue: (item: StoreReportRow) => item.profitRate,
      render: (item: StoreReportRow) => {
        const color = item.profitRate >= 0 ? '#4ade80' : '#f87171';
        return <span style={{ color }}>{(item.profitRate * 100).toFixed(2)}%</span>;
      },
    },
  ];
}

// ─── 样式 ─────────────────────────────────────────────────

const card: React.CSSProperties = {
  borderRadius: 16,
  padding: 18,
  background: 'rgba(15, 23, 42, 0.38)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
};

const emptyContainer: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '64px 24px',
  textAlign: 'center',
  color: '#94a3b8',
};

// ─── 页面组件 ─────────────────────────────────────────────

export default function StoreReportsPage() {
  const [rows, setRows] = useState<StoreReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [profitFilter, setProfitFilter] = useState<ProfitFilter>('ALL');
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchStoreReports().then((data) => {
      setRows(data);
      setLoading(false);
    });
  }, []);

  const columns = useMemo(() => buildColumns(), []);

  // Tab 筛选: 全部/盈利/亏损
  const filteredRows = useMemo(() => {
    switch (profitFilter) {
      case 'PROFIT': return rows.filter((r) => r.profit > 0);
      case 'LOSS': return rows.filter((r) => r.profit < 0);
      default: return rows;
    }
  }, [rows, profitFilter]);

  // 排序
  const sortedRows = useMemo(() => {
    if (!sortConfig || !sortConfig.key) return filteredRows;
    const col = columns.find((c) => c.key === sortConfig.key);
    if (!col) return filteredRows;
    const dir = sortConfig.direction === 'desc' ? -1 : 1;
    const sorted = [...filteredRows].sort((a, b) => {
      const aVal = col.sortValue ? col.sortValue(a) : (a as any)[col.dataKey ?? col.key];
      const bVal = col.sortValue ? col.sortValue(b) : (b as any)[col.dataKey ?? col.key];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'string') return aVal.localeCompare(bVal) * dir;
      return ((aVal as number) - (bVal as number)) * dir;
    });
    return sorted;
  }, [filteredRows, sortConfig, columns]);

  // 概要统计
  const summary = useMemo<StoreReportSummary>(() => ({
    totalRevenue: rows.reduce((s, r) => s + r.totalRevenue, 0),
    totalProfit: rows.reduce((s, r) => s + r.profit, 0),
    profitableCount: rows.filter((r) => r.profit > 0).length,
    lossCount: rows.filter((r) => r.profit < 0).length,
  }), [rows]);

  const isEmpty = !loading && rows.length === 0;
  const showEmpty = !loading && sortedRows.length === 0;

  return (
    <main style={{ maxWidth: 1220, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="门店经营报表"
        subtitle="查看各门店的营收、成本、利润及净利率明细"
      >
        {/* 概要统计卡片 */}
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 20 }}>
          <article style={card}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>总营收</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#60a5fa' }}>
              {formatYuan(summary.totalRevenue)}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>全部门店累计</div>
          </article>
          <article style={card}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>总利润</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#4ade80' }}>
              {formatYuan(summary.totalProfit)}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>扣除成本后净利</div>
          </article>
          <article style={card}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>盈利门店</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#4ade80' }}>
              {summary.profitableCount}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>{'利润 > 0'}</div>
          </article>
          <article style={card}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>亏损门店</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#f87171' }}>
              {summary.lossCount}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>{'利润 < 0'}</div>
          </article>
        </div>

        {/* 加载态 */}
        {loading && (
          <div style={emptyContainer}>
            <div style={{ fontSize: 14 }}>加载中...</div>
          </div>
        )}

        {/* 空态 */}
        {isEmpty && (
          <div style={emptyContainer}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>暂无门店报表数据</div>
            <div style={{ fontSize: 13 }}>请先选择门店和日期范围，或检查数据源是否可用</div>
          </div>
        )}

        {/* 筛选后无数据 */}
        {showEmpty && !isEmpty && (
          <div style={emptyContainer}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>未匹配到数据</div>
            <div style={{ fontSize: 13 }}>当前筛选条件下没有符合的记录，请尝试调整筛选条件</div>
          </div>
        )}

        {/* Tab 筛选 */}
        {!loading && rows.length > 0 && (
          <>
            <div style={{ marginBottom: 16 }}>
              <Tabs
                items={[
                  { key: 'ALL', label: '全部', count: rows.length },
                  { key: 'PROFIT', label: '盈利', count: summary.profitableCount },
                  { key: 'LOSS', label: '亏损', count: summary.lossCount },
                ]}
                activeKey={profitFilter}
                onChange={(key) => setProfitFilter(key as ProfitFilter)}
                variant="pills"
                size="sm"
              />
            </div>

            {/* 数据表格 */}
            <DataTable
              title={`门店经营明细（${sortedRows.length} 条）`}
              columns={columns}
              items={sortedRows}
              rowKey={(item) => `${item.storeId}-${item.date}`}
              sort={sortConfig}
              onSortChange={setSortConfig}
              striped
              compact
            />
          </>
        )}
      </PageShell>
    </main>
  );
}
