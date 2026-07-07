import React from 'react';

// ---- 类型定义 ----

export interface StoreComparisonMetric {
  revenue: number;
  orderCount: number;
  avgOrderValue: number;
  activeMembers: number;
  deviceUtilization: number;
  customerSatisfaction: number;
}

export interface StoreComparisonItem {
  id: string;
  name: string;
  region: string;
  status: 'online' | 'offline' | 'maintenance';
  trend: 'up' | 'down' | 'stable';
  metrics: StoreComparisonMetric;
}

export interface StoreComparisonPanelProps {
  stores: StoreComparisonItem[];
  loading?: boolean;
  baselineStoreId?: string;
  'data-testid'?: string;
}

// ---- 工具函数 ----

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('zh-CN').format(value);
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    online: '在线',
    offline: '离线',
    maintenance: '维护中',
  };
  return map[status] ?? status;
}

function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    online: '#22c55e',
    offline: '#9ca3af',
    maintenance: '#f59e0b',
  };
  return map[status] ?? '#9ca3af';
}

function getTrendIcon(trend: string): string {
  const map: Record<string, string> = {
    up: '↑',
    down: '↓',
    stable: '→',
  };
  return map[trend] ?? '→';
}

function getTrendColor(trend: string): string {
  const map: Record<string, string> = {
    up: '#22c55e',
    down: '#ef4444',
    stable: '#6b7280',
  };
  return map[trend] ?? '#6b7280';
}

// ---- 柱状图（简易内嵌） ----

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  maxBarWidth?: number;
}

const BarChart: React.FC<BarChartProps> = ({ data, height = 200, maxBarWidth = 60 }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height, padding: '0 4px' }}>
      {data.map((d, i) => {
        const barHeight = (d.value / maxValue) * (height - 20);
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, maxWidth: maxBarWidth }}>
            <span style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, whiteSpace: 'nowrap' }}>
              {formatCurrency(d.value)}
            </span>
            <div
              style={{
                width: '100%',
                height: Math.max(barHeight, 4),
                backgroundColor: d.color ?? '#3b82f6',
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.3s ease',
                minWidth: 24,
              }}
            />
            <span style={{ fontSize: 11, color: '#374151', marginTop: 6, textAlign: 'center', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ---- 骨架屏 ----

const SkeletonBlock: React.FC<{ width?: string; height?: string; mb?: string }> = ({
  width = '100%',
  height = '16px',
  mb = '8px',
}) => (
  <div
    style={{
      width,
      height,
      backgroundColor: '#e5e7eb',
      borderRadius: 4,
      marginBottom: mb,
      animation: 'pulse 1.5s ease-in-out infinite',
    }}
  />
);

const LoadingSkeleton: React.FC = () => (
  <div style={{ padding: 24 }}>
    <SkeletonBlock width="200px" height="24px" mb="20px" />
    <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{ flex: 1, padding: 16, backgroundColor: '#f9fafb', borderRadius: 8 }}>
          <SkeletonBlock width="60%" height="14px" mb="12px" />
          <SkeletonBlock width="80%" height="28px" mb="8px" />
          <SkeletonBlock width="40%" height="12px" />
        </div>
      ))}
    </div>
    <SkeletonBlock height="160px" mb="24px" />
    <SkeletonBlock height="120px" />
  </div>
);

// ---- 空态提示 ----

const EmptyState: React.FC = () => (
  <div style={{ textAlign: 'center', padding: '48px 24px', color: '#9ca3af' }}>
    <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
    <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#6b7280' }}>暂无门店数据</div>
    <div style={{ fontSize: 14 }}>当前没有可对比的门店数据</div>
  </div>
);

// ---- 主组件 ----

export const StoreComparisonPanel: React.FC<StoreComparisonPanelProps> = ({
  stores,
  loading = false,
  baselineStoreId,
  'data-testid': testId,
}) => {
  // ---- 加载态 ----
  if (loading) {
    return <div data-testid={testId}><LoadingSkeleton /></div>;
  }

  // ---- 空态 ----
  if (!stores || stores.length === 0) {
    return (
      <div data-testid={testId} style={{ border: '1px solid #e5e7eb', borderRadius: 12, backgroundColor: '#fff' }}>
        <EmptyState />
      </div>
    );
  }

  const metricsList = stores.map(s => s.metrics);
  const totalRevenue = sum(metricsList.map(m => m.revenue));
  const avgRevenue = avg(metricsList.map(m => m.revenue));
  const avgOrderCount = avg(metricsList.map(m => m.orderCount));
  const avgAOV = avg(metricsList.map(m => m.avgOrderValue));
  const totalMembers = sum(metricsList.map(m => m.activeMembers));
  const avgUtilization = avg(metricsList.map(m => m.deviceUtilization));
  const avgSatisfaction = avg(metricsList.map(m => m.customerSatisfaction));
  const onlineCount = stores.filter(s => s.status === 'online').length;

  // ---- 颜色分配 ----
  const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e', '#ef4444', '#ec4899'];

  // ---- 概览指标卡片 ----
  const overviewCards = [
    { label: '总营收', value: formatCurrency(totalRevenue) },
    { label: '平均订单数', value: formatNumber(Math.round(avgOrderCount)) },
    { label: '在线门店', value: `${onlineCount}/${stores.length}` },
    { label: '平均满意度', value: `${Math.round(avgSatisfaction)}分` },
  ];

  // ---- 表格列定义 ----
  const tableHeaders = ['门店名称', '区域', '状态', '趋势', '营收', '订单数', '客单价', '活跃会员', '设备利用率', '满意度'];
  const tableKeys: (keyof StoreComparisonMetric | 'name' | 'region' | 'status' | 'trend')[] = [
    'name', 'region', 'status', 'trend',
    'revenue', 'orderCount', 'avgOrderValue', 'activeMembers', 'deviceUtilization', 'customerSatisfaction',
  ];

  function getCellValue(store: StoreComparisonItem, key: string): string {
    if (key === 'name') return store.name;
    if (key === 'region') return store.region;
    if (key === 'status') return getStatusLabel(store.status);
    if (key === 'trend') return getTrendIcon(store.trend);
    const metricKey = key as keyof StoreComparisonMetric;
    const val = store.metrics[metricKey];
    if (metricKey === 'revenue' || metricKey === 'avgOrderValue') return formatCurrency(val);
    if (metricKey === 'customerSatisfaction') return `${val}分`;
    if (metricKey === 'deviceUtilization') return `${val}%`;
    return formatNumber(val);
  }

  return (
    <div
      data-testid={testId}
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        backgroundColor: '#fff',
        overflow: 'hidden',
      }}
    >
      {/* 概览 KPI */}
      <div style={{ display: 'flex', gap: 16, padding: '20px 24px', borderBottom: '1px solid #f3f4f6' }}>
        {overviewCards.map((card, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              padding: '12px 16px',
              backgroundColor: '#f9fafb',
              borderRadius: 8,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{card.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* 图表区域：各门店营收对比 */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 16 }}>
          各门店营收对比
        </div>
        <BarChart
          data={stores.map((s, i) => ({
            label: s.name,
            value: s.metrics.revenue,
            color: s.id === baselineStoreId ? '#f59e0b' : COLORS[i % COLORS.length],
          }))}
        />
      </div>

      {/* 表格：门店详细对比 */}
      <div style={{ padding: '20px 24px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>
          门店详细对比
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                {tableHeaders.map((h, i) => (
                  <th
                    key={i}
                    style={{
                      padding: '10px 12px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: '#374151',
                      borderBottom: '2px solid #e5e7eb',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stores.map((store, idx) => (
                <tr
                  key={store.id}
                  style={{
                    backgroundColor: store.id === baselineStoreId ? '#fffbeb' : idx % 2 === 0 ? '#fff' : '#fafafa',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  {tableKeys.map((key) => (
                    <td
                      key={key}
                      style={{
                        padding: '10px 12px',
                        borderBottom: '1px solid #f3f4f6',
                        color: '#374151',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {key === 'status' ? (
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 12,
                            backgroundColor: getStatusColor(store.status) + '20',
                            color: getStatusColor(store.status),
                            fontWeight: 500,
                          }}
                        >
                          {getCellValue(store, key)}
                        </span>
                      ) : key === 'trend' ? (
                        <span style={{ color: getTrendColor(store.trend), fontWeight: 600 }}>
                          {getCellValue(store, key)}
                        </span>
                      ) : (
                        getCellValue(store, key)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 内联动画 keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default StoreComparisonPanel;
