'use client';
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

import { useCallback, useMemo, useState, useTransition } from 'react';
import {
  DataTable,
  PageShell,
  StatusBadge,
  SubmitButton,
  Tabs,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

import type {
  ProfitFilter,
  StoreReportRow,
  StoreReportsSnapshot,
} from './store-reports-data';

function formatYuan(cents: number): string {
  return `¥${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function buildColumns(): DataTableColumn<StoreReportRow>[] {
  return [
    { key: 'storeName', title: '门店', dataKey: 'storeName', sortable: true },
    {
      key: 'admissionFee',
      title: '门票',
      sortable: true,
      align: 'right',
      render: (item) => formatYuan(item.admissionFee),
    },
    {
      key: 'coinRevenue',
      title: '游戏币',
      sortable: true,
      align: 'right',
      render: (item) => formatYuan(item.coinRevenue),
    },
    {
      key: 'diningRevenue',
      title: '餐饮',
      sortable: true,
      align: 'right',
      render: (item) => formatYuan(item.diningRevenue),
    },
    {
      key: 'otherRevenue',
      title: '其他',
      sortable: true,
      align: 'right',
      render: (item) => formatYuan(item.otherRevenue),
    },
    {
      key: 'totalRevenue',
      title: '总营收',
      sortable: true,
      align: 'right',
      render: (item) => formatYuan(item.totalRevenue),
    },
    {
      key: 'cost',
      title: '成本',
      sortable: true,
      align: 'right',
      render: (item) => formatYuan(item.cost),
    },
    {
      key: 'profit',
      title: '利润',
      sortable: true,
      align: 'right',
      render: (item) => (
        <span style={{ color: item.profit >= 0 ? '#4ade80' : '#f87171', fontWeight: 600 }}>
          {formatYuan(item.profit)}
        </span>
      ),
    },
    {
      key: 'profitRate',
      title: '净利率',
      sortable: true,
      align: 'right',
      sortValue: (item) => item.profitRate,
      render: (item) => (
        <span style={{ color: item.profitRate >= 0 ? '#4ade80' : '#f87171' }}>
          {(item.profitRate * 100).toFixed(2)}%
        </span>
      ),
    },
  ];
}

const statCardStyle = {
  borderRadius: 16,
  padding: 18,
  background: 'rgba(15, 23, 42, 0.38)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
} as const;

const emptyContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '64px 24px',
  textAlign: 'center',
  color: '#94a3b8',
} as const;

export default function StoreReportsClient({
  snapshot,
}: {
  snapshot: StoreReportsSnapshot;
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const columns = useMemo(() => buildColumns(), []);
  const [profitFilter, setProfitFilter] = useState<ProfitFilter>('ALL');
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);

  const filteredRows = useMemo(() => {
    switch (profitFilter) {
      case 'PROFIT':
        return snapshot.rows.filter((row) => row.profit > 0);
      case 'LOSS':
        return snapshot.rows.filter((row) => row.profit < 0);
      default:
        return snapshot.rows;
    }
  }, [profitFilter, snapshot.rows]);

  const sortedRows = useMemo(() => {
    if (!sortConfig?.key) return filteredRows;
    const column = columns.find((item) => item.key === sortConfig.key);
    if (!column) return filteredRows;
    const direction = sortConfig.direction === 'desc' ? -1 : 1;

    return [...filteredRows].sort((left, right) => {
      const leftValue = column.sortValue
        ? column.sortValue(left)
        : (left as unknown as Record<string, unknown>)[column.dataKey ?? column.key];
      const rightValue = column.sortValue
        ? column.sortValue(right)
        : (right as unknown as Record<string, unknown>)[column.dataKey ?? column.key];

      if (leftValue == null) return 1;
      if (rightValue == null) return -1;
      if (typeof leftValue === 'string' || typeof rightValue === 'string') {
        return String(leftValue).localeCompare(String(rightValue)) * direction;
      }
      return (Number(leftValue) - Number(rightValue)) * direction;
    });
  }, [columns, filteredRows, sortConfig]);

  const isEmpty = snapshot.rows.length === 0;
  const showFilteredEmpty = !isEmpty && sortedRows.length === 0;
  

  return (
    <PageShell
      title="门店经营报表"
      subtitle={`查看各门店的营收、成本、利润及净利率明细。当前来源：${
        snapshot.deliveryMode === 'api' ? '真实 API 快照' : 'fallback 样本'
      }。`}
    >
      {snapshot.error ? (
        <div
          style={{
            marginBottom: 16,
            borderRadius: 12,
            padding: '12px 14px',
            border: '1px solid rgba(245, 158, 11, 0.28)',
            background: 'rgba(120, 53, 15, 0.22)',
            color: '#fcd34d',
            fontSize: 13,
          }}
        >
          {snapshot.error}
        </div>
      ) : null}

      {isRefreshing ? (
        <div
          style={{
            marginBottom: 16,
            borderRadius: 12,
            padding: '12px 14px',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            background: 'rgba(15, 23, 42, 0.35)',
            color: '#cbd5e1',
            fontSize: 13,
          }}
        >
          正在通过服务端快照刷新门店报表...
        </div>
      ) : null}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <SubmitButton variant="secondary" onClick={handleRefresh}>
          {isRefreshing ? '刷新中...' : '刷新快照'}
        </SubmitButton>
      </div>

      <div
        style={{
          display: 'grid',
          gap: 14,
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          marginBottom: 20,
        }}
      >
        <article style={statCardStyle}>
          <div style={{ fontSize: 13, color: '#cbd5e1' }}>总营收</div>
          <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#60a5fa' }}>
            {formatYuan(snapshot.summary.totalRevenue)}
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>全部门店累计</div>
        </article>
        <article style={statCardStyle}>
          <div style={{ fontSize: 13, color: '#cbd5e1' }}>总利润</div>
          <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#4ade80' }}>
            {formatYuan(snapshot.summary.totalProfit)}
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>扣除成本后净利</div>
        </article>
        <article style={statCardStyle}>
          <div style={{ fontSize: 13, color: '#cbd5e1' }}>盈利门店</div>
          <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#4ade80' }}>
            {snapshot.summary.profitableCount}
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
            <StatusBadge label="利润 > 0" variant="success" size="sm" />
          </div>
        </article>
        <article style={statCardStyle}>
          <div style={{ fontSize: 13, color: '#cbd5e1' }}>亏损门店</div>
          <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#f87171' }}>
            {snapshot.summary.lossCount}
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
            <StatusBadge label="利润 < 0" variant="danger" size="sm" />
          </div>
        </article>
      </div>

      {isEmpty ? (
        <div style={emptyContainerStyle}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>
            暂无门店报表数据
          </div>
          <div style={{ fontSize: 13 }}>请先检查门店报表数据源是否可用</div>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: snapshot.rows.length },
                { key: 'PROFIT', label: '盈利', count: snapshot.summary.profitableCount },
                { key: 'LOSS', label: '亏损', count: snapshot.summary.lossCount },
              ]}
              activeKey={profitFilter}
              onChange={(key) => setProfitFilter(key as ProfitFilter)}
              variant="pills"
              size="sm"
            />
          </div>

          {showFilteredEmpty ? (
            <div style={emptyContainerStyle}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>
                未匹配到数据
              </div>
              <div style={{ fontSize: 13 }}>当前筛选条件下没有符合的记录，请尝试调整筛选条件</div>
            </div>
          ) : (
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
          )}
        </>
      )}
    </PageShell>
  );
}
