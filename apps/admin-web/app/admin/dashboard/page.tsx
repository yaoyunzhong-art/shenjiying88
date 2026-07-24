// @ts-nocheck
'use client';

/**
 * 管理后台 - 全局分析仪表盘
 * 角色: 👑超级管理员 / 🏢总部管理
 * 功能: 总部看板，展示平台整体运营数据
 */

import { useState, useEffect } from 'react';
import {
  PageShell,
  StatCard,
  Tabs,
  StatusBadge,
} from '@m5/ui';
import { AdminPermissionGate } from '../../components/admin-permission-gate';

// ============================================================
// Mock 数据
// ============================================================

// 1. 顶部概览
const OVERVIEW = {
  totalTenants: 128,
  tenantChange: '+12',
  totalStores: 1847,
  storeChange: '+156',
  totalRevenue: 45280000,
  revenueChange: '+18.5%',
  activeUsers: 456000,
  userChange: '+22.3%',
};

// 2. 收入趋势（最近30天）
function generateRevenueTrend(): { day: string; revenue: number }[] {
  const base = 380000;
  const trend: { day: string; revenue: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    // 模拟趋势：周末高，平时略低，整体向上
    const dayOfWeek = d.getDay();
    const weekendBoost = dayOfWeek === 0 || dayOfWeek === 6 ? 1.25 : 1.0;
    const trendFactor = 1 + (29 - i) * 0.003; // 整体微涨
    const noise = 0.85 + Math.random() * 0.3;
    const revenue = Math.round(base * weekendBoost * trendFactor * noise);
    trend.push({ day: `${mm}-${dd}`, revenue });
  }
  return trend;
}
const revenueTrend = generateRevenueTrend();
const maxRevenue = Math.max(...revenueTrend.map(d => d.revenue));
const minRevenue = Math.min(...revenueTrend.map(d => d.revenue));
const revenueRange = maxRevenue - minRevenue || 1;

// 3. 门店地理分布
const REGION_STATS = [
  { region: '华东', count: 486, percentage: 26.3 },
  { region: '华南', count: 352, percentage: 19.1 },
  { region: '华北', count: 298, percentage: 16.1 },
  { region: '华中', count: 215, percentage: 11.6 },
  { region: '西南', count: 198, percentage: 10.7 },
  { region: '西北', count: 156, percentage: 8.5 },
  { region: '东北', count: 142, percentage: 7.7 },
];
const maxRegionCount = Math.max(...REGION_STATS.map(r => r.count));

// 4. 新增租户趋势（最近12个月）
const NEW_TENANTS_TREND = [
  { month: '2025-08', label: '08月', count: 8 },
  { month: '2025-09', label: '09月', count: 10 },
  { month: '2025-10', label: '10月', count: 7 },
  { month: '2025-11', label: '11月', count: 12 },
  { month: '2025-12', label: '12月', count: 15 },
  { month: '2026-01', label: '01月', count: 11 },
  { month: '2026-02', label: '02月', count: 9 },
  { month: '2026-03', label: '03月', count: 14 },
  { month: '2026-04', label: '04月', count: 16 },
  { month: '2026-05', label: '05月', count: 13 },
  { month: '2026-06', label: '06月', count: 18 },
  { month: '2026-07', label: '07月', count: 20 },
];
const maxNewTenants = Math.max(...NEW_TENANTS_TREND.map(d => d.count));
const minNewTenants = Math.min(...NEW_TENANTS_TREND.map(d => d.count));
const newTenantRange = maxNewTenants - minNewTenants || 1;

// 5. 系统告警列表
const ALERTS = [
  { id: 'ALT-001', severity: 'critical', source: '支付网关', message: '华东区支付网关响应延迟 > 5s', time: '2026-07-12 02:15:23', status: '未处理' } as const,
  { id: 'ALT-002', severity: 'critical', source: '数据库', message: '主库写入队列堆积超过阈值 (85%)', time: '2026-07-12 01:48:07', status: '处理中' } as const,
  { id: 'ALT-003', severity: 'warning', source: 'API网关', message: '华南区API请求错误率上升至 7.2%', time: '2026-07-12 00:32:11', status: '已确认' } as const,
  { id: 'ALT-004', severity: 'warning', source: '缓存服务', message: 'Redis集群内存使用率达 82%', time: '2026-07-11 23:55:44', status: '未处理' } as const,
  { id: 'ALT-005', severity: 'info', source: '部署服务', message: 'v3.8.2 灰度发布完成 (25%流量)', time: '2026-07-11 22:30:00', status: '已关闭' } as const,
  { id: 'ALT-006', severity: 'warning', source: '文件存储', message: '华北区OSS近7日存储增长 15%', time: '2026-07-11 21:12:38', status: '未处理' } as const,
  { id: 'ALT-007', severity: 'critical', source: '消息队列', message: '订单处理队列积压 12,847 条', time: '2026-07-11 20:05:19', status: '处理中' } as const,
  { id: 'ALT-008', severity: 'info', source: '监控系统', message: '新增告警规则「店铺日报生成超时」已生效', time: '2026-07-11 18:44:52', status: '已关闭' } as const,
  { id: 'ALT-009', severity: 'warning', source: 'CDN', message: '华南CDN节点命中率下降至 78%', time: '2026-07-11 17:28:36', status: '已确认' } as const,
  { id: 'ALT-010', severity: 'critical', source: '用户认证', message: 'SSO登录失败率突增 (华北区 12次/分)', time: '2026-07-11 16:15:04', status: '未处理' } as const,
];

const SEVERITY_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info'; color: string }> = {
  critical: { label: '严重', variant: 'danger', color: '#ef4444' },
  warning: { label: '警告', variant: 'warning', color: '#eab308' },
  info: { label: '信息', variant: 'info', color: '#3b82f6' },
};

// ============================================================
// CSS 常量
// ============================================================
const card: React.CSSProperties = {
  borderRadius: 16,
  padding: 20,
  background: 'rgba(15, 23, 42, 0.38)',
  border: '1px solid rgba(148,163,184,0.18)',
};

const sectionTitle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  margin: '0 0 16px',
  color: '#f1f5f9',
};

const permissionGate = {
  requiredPermission: 'dashboard:read',
  title: '全局分析仪表盘访问受限',
  description:
    '全局分析仪表盘已接入管理员本地 session，只有具备 dashboard:read 的账号才能查看平台级收入、区域分布、租户增长与系统告警。',
} as const;

// ============================================================
// 组件
// ============================================================

/** 纯 CSS 折线图 */
function LineChart({
  data,
  dataKey,
  labelKey,
  height,
  color,
  showLabels,
  formatValue,
}: {
  data: { [key: string]: number | string }[];
  dataKey: string;
  labelKey: string;
  height?: number;
  color?: string;
  showLabels?: boolean;
  formatValue?: (v: number) => string;
}) {
  const h = height ?? 200;
  const lineColor = color ?? '#3b82f6';
  const values = data.map(d => Number(d[dataKey]));
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const padding = { top: 20, bottom: 30, left: 0, right: 0 };
  const chartH = h - padding.top - padding.bottom;
  const chartW = 100; // 百分比
  const step = chartW / (data.length - 1);

  // 折线点坐标（百分比）
  const points = values.map((v, i) => ({
    x: step * i,
    y: padding.top + chartH - ((v - min) / range) * chartH * 0.85 - chartH * 0.075,
    value: v,
    label: String(data[i][labelKey]),
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div style={{ position: 'relative', width: '100%', height: h }}>
      {/* Y轴参考线 */}
      <svg width="100%" height={h} style={{ position: 'absolute', top: 0, left: 0 }}>
        {[0, 0.25, 0.5, 0.75, 1].map(frac => {
          const y = padding.top + chartH - frac * chartH * 0.85 - chartH * 0.075;
          return (
            <line
              key={frac}
              x1="0" y1={y} x2="100%" y2={y}
              stroke="rgba(148,163,184,0.1)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          );
        })}
      </svg>
      {/* 折线 */}
      <svg width="100%" height={h} style={{ position: 'absolute', top: 0, left: 0 }}>
        <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {/* 面积填充 */}
        <path
          d={`${pathD} L ${points[points.length - 1]?.x ?? 0} ${padding.top + chartH} L ${points[0]?.x ?? 0} ${padding.top + chartH} Z`}
          fill={`url(#areaGradient-${dataKey})`}
          opacity="0.15"
        />
        <defs>
          <linearGradient id={`areaGradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* 圆点 */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill={lineColor} stroke="rgba(15,23,42,0.8)" strokeWidth="2" />
        ))}
      </svg>
      {/* 标签 */}
      {showLabels && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 0' }}>
          {data.map((d, i) => {
            // 每隔几个显示一个标签
            const skip = data.length > 20 ? 4 : data.length > 10 ? 2 : 1;
            if (i % skip !== 0) return <div key={i} style={{ width: 0 }} />;
            return (
              <div key={i} style={{ fontSize: 10, color: '#64748b', textAlign: 'center', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                {String(d[labelKey]).slice(-5)}
              </div>
            );
          })}
        </div>
      )}
      {/* 当前值工具提示 */}
      {showLabels && (
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', padding: '2px 10px', borderRadius: 8, background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', fontSize: 12, color: '#f1f5f9', whiteSpace: 'nowrap' }}>
          {formatValue ? formatValue(values[values.length - 1]!) : values[values.length - 1]!.toLocaleString()}
        </div>
      )}
    </div>
  );
}

/** 纯 CSS 柱状图 */
function BarChart({
  data,
  dataKey,
  labelKey,
  height,
  color,
  barWidth,
}: {
  data: { [key: string]: number | string }[];
  dataKey: string;
  labelKey: string;
  height?: number;
  color?: string;
  barWidth?: number;
}) {
  const h = height ?? 200;
  const barColor = color ?? '#3b82f6';
  const values = data.map(d => Number(d[dataKey]));
  const max = Math.max(...values);
  const bw = barWidth ?? 40;
  const gap = 12;
  const totalW = data.length * (bw + gap) - gap;

  return (
    <div style={{ width: '100%', height: h, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap, padding: '0 8px', position: 'relative' }}>
      {/* Y轴参考线 */}
      <svg width="100%" height={h} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
        {[0, 0.25, 0.5, 0.75, 1].map(frac => {
          const y = h - 20 - frac * (h - 50);
          return (
            <line
              key={frac}
              x1="0" y1={y} x2="100%" y2={y}
              stroke="rgba(148,163,184,0.08)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          );
        })}
      </svg>
      {data.map((d, i) => {
        const v = Number(d[dataKey]);
        const barH = (v / max) * (h - 50);
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{v}</div>
            <div
              style={{
                width: bw,
                height: barH,
                borderRadius: '4px 4px 0 0',
                background: `linear-gradient(180deg, ${barColor} 0%, ${barColor}88 100%)`,
                opacity: 0.8 + (v / max) * 0.2,
                transition: 'height 0.3s',
                minHeight: 2,
              }}
            />
            <div style={{ fontSize: 10, color: '#64748b', transform: 'rotate(0deg)', whiteSpace: 'nowrap' }}>
              {String(d[labelKey]).slice(-3)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** 水平条形图（用于区域分布） */
function HorizontalBarChart({
  data,
  dataKey,
  labelKey,
  maxValue,
  color,
}: {
  data: { [key: string]: number | string }[];
  dataKey: string;
  labelKey: string;
  maxValue?: number;
  color?: string;
}) {
  const max = maxValue ?? Math.max(...data.map(d => Number(d[dataKey])));
  const barColor = color ?? '#3b82f6';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {data.map((d, i) => {
        const v = Number(d[dataKey]);
        const pct = (v / max) * 100;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 50, fontSize: 13, color: '#cbd5e1', fontWeight: 500, textAlign: 'right', flexShrink: 0 }}>{String(d[labelKey])}</div>
            <div style={{ flex: 1, height: 22, borderRadius: 11, background: 'rgba(148,163,184,0.1)', overflow: 'hidden', position: 'relative' }}>
              <div
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  borderRadius: 11,
                  background: `linear-gradient(90deg, ${barColor}66, ${barColor})`,
                  transition: 'width 0.5s ease',
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: 10,
                  minWidth: pct > 15 ? undefined : 0,
                }}
              >
                {pct > 15 && (
                  <span style={{ fontSize: 11, color: '#fff', fontWeight: 600, textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
                    {v.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            <div style={{ width: 40, fontSize: 12, color: '#64748b', textAlign: 'right', flexShrink: 0 }}>{d.percentage as string}%</div>
          </div>
        );
      })}
    </div>
  );
}

/** 格式化金额 */
function formatMoney(n: number): string {
  if (n >= 10000) return `¥${(n / 10000).toFixed(1)}万`;
  return `¥${n.toLocaleString()}`;
}

// ============================================================
// 主页面
// ============================================================

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'trend' | 'distribution'>('overview');

  useEffect(() => {
    try {
      setData(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : '数据加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <AdminPermissionGate {...permissionGate}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: 32 }}>
          <div style={{ color: '#94a3b8', textAlign: 'center', padding: 64 }}>加载中...</div>
        </div>
      </AdminPermissionGate>
    );
  }
  if (error) {
    return (
      <AdminPermissionGate {...permissionGate}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: 32 }}>
          <div style={{ color: '#ef4444', textAlign: 'center', padding: 64 }}>数据获取失败: {error}</div>
        </div>
      </AdminPermissionGate>
    );
  }
  if (!data) {
    return (
      <AdminPermissionGate {...permissionGate}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: 32 }}>
          <div style={{ color: '#94a3b8', textAlign: 'center', padding: 64 }}>暂无数据</div>
        </div>
      </AdminPermissionGate>
    );
  }

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 32 }}>
        <PageShell title="全局分析仪表盘" subtitle="总部运营看板 · 实时数据聚合">
          {/* ==================== 1. 顶部概览 ==================== */}
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
            <StatCard
              label="总租户数"
              value={OVERVIEW.totalTenants.toLocaleString()}
              trend={{ value: OVERVIEW.tenantChange, direction: 'up' }}
              variant="default"
            />
            <StatCard
              label="总门店数"
              value={OVERVIEW.totalStores.toLocaleString()}
              trend={{ value: OVERVIEW.storeChange, direction: 'up' }}
              variant="default"
            />
            <StatCard
              label="总收入"
              value={formatMoney(OVERVIEW.totalRevenue)}
              trend={{ value: OVERVIEW.revenueChange, direction: 'up' }}
              variant="default"
            />
            <StatCard
              label="活跃用户数"
              value={OVERVIEW.activeUsers.toLocaleString()}
              trend={{ value: OVERVIEW.userChange, direction: 'up' }}
              variant="default"
            />
          </div>

        {/* ==================== 2&3. 图表区 ==================== */}
        <div style={{ display: 'grid', gap: 20, gridTemplateColumns: '1.5fr 1fr', marginBottom: 24 }}>
          {/* 收入趋势 */}
          <div style={card}>
            <h3 style={sectionTitle}>📈 收入趋势（最近30天）</h3>
            <LineChart
              data={revenueTrend}
              dataKey="revenue"
              labelKey="day"
              height={220}
              color="#22c55e"
              showLabels
              formatValue={v => formatMoney(v)}
            />
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b' }}>
              <span>最低: {formatMoney(minRevenue)}</span>
              <span>最高: {formatMoney(maxRevenue)}</span>
              <span>平均: {formatMoney(Math.round(revenueTrend.reduce((s, d) => s + d.revenue, 0) / revenueTrend.length))}</span>
            </div>
          </div>

          {/* 门店地理分布 */}
          <div style={card}>
            <h3 style={sectionTitle}>📍 门店地理分布</h3>
            <HorizontalBarChart
              data={REGION_STATS}
              dataKey="count"
              labelKey="region"
              color="#8b5cf6"
            />
          </div>
        </div>

        {/* ==================== 4&5. 底部 ==================== */}
        <div style={{ display: 'grid', gap: 20, gridTemplateColumns: '1fr 1.2fr', marginBottom: 24 }}>
          {/* 新增租户趋势 */}
          <div style={card}>
            <h3 style={sectionTitle}>🚀 新增租户趋势（最近12个月）</h3>
            <BarChart
              data={NEW_TENANTS_TREND}
              dataKey="count"
              labelKey="label"
              height={200}
              color="#f97316"
              barWidth={28}
            />
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b' }}>
              <span>最低月新增: {minNewTenants} 个</span>
              <span>最高月新增: {maxNewTenants} 个</span>
              <span>累计新增: {NEW_TENANTS_TREND.reduce((s, d) => s + d.count, 0)} 个</span>
            </div>
          </div>

          {/* 系统告警列表 */}
          <div style={card}>
            <h3 style={{ ...sectionTitle, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🔔 系统告警</span>
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>最近10条</span>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: '#ef4444', fontWeight: 500 }}>
                未处理 {ALERTS.filter(a => a.status === '未处理').length}
              </span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ALERTS.map(alert => {
                const sev = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.info!;
                const statusColor = alert.status === '未处理' ? '#ef4444' : alert.status === '处理中' ? '#eab308' : alert.status === '已确认' ? '#3b82f6' : '#22c55e';
                return (
                  <div
                    key={alert.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: 'rgba(15,23,42,0.3)',
                      border: '1px solid rgba(148,163,184,0.12)',
                      fontSize: 12,
                    }}
                  >
                    {/* 严重性指示器 */}
                    <div style={{ width: 4, height: 32, borderRadius: 2, background: sev.color, flexShrink: 0 }} />
                    {/* 严重性标签 */}
                    <StatusBadge label={sev.label} variant={sev.variant} size="sm" dot />
                    {/* 来源 */}
                    <span style={{ color: '#93c5fd', fontWeight: 600, width: 70, flexShrink: 0 }}>{alert.source}</span>
                    {/* 消息 */}
                    <span style={{ color: '#e2e8f0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {alert.message}
                    </span>
                    {/* 时间 */}
                    <span style={{ color: '#64748b', width: 100, flexShrink: 0, fontSize: 11 }}>
                      {alert.time.slice(5, 16)}
                    </span>
                    {/* 状态 */}
                    <span style={{ color: statusColor, fontWeight: 500, width: 50, textAlign: 'center', flexShrink: 0 }}>
                      {alert.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ==================== Tabs 切换图表 ==================== */}
        <div style={{ marginBottom: 8 }}>
          <Tabs
            items={[
              { key: 'overview', label: '📊 总览' },
              { key: 'trend', label: '📈 趋势详情' },
              { key: 'distribution', label: '🗺️ 分布' },
            ]}
            activeKey={activeTab}
            onChange={t => setActiveTab(t as typeof activeTab)}
            variant="pills"
          />
        </div>

        {/* Tab 内容 */}
        {activeTab === 'trend' && (
          <div style={card}>
            <h3 style={sectionTitle}>📈 30日收入趋势（全量）</h3>
            <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {revenueTrend.map((d, i) => (
                      <th key={i} style={{ padding: '4px 6px', textAlign: 'center', color: '#64748b', borderBottom: '1px solid rgba(148,163,184,0.12)' }}>
                        {d.day.slice(3)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {revenueTrend.map((d, i) => {
                      const ratio = (d.revenue - minRevenue) / revenueRange;
                      const intensity = Math.round(80 + ratio * 40);
                      return (
                        <td
                          key={i}
                          style={{
                            padding: '4px 6px',
                            textAlign: 'center',
                            color: '#f1f5f9',
                            background: `rgba(34,197,94,${0.05 + ratio * 0.2})`,
                            fontWeight: d.revenue === maxRevenue ? 700 : 400,
                          }}
                        >
                          {formatMoney(d.revenue)}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'distribution' && (
          <div style={{ display: 'grid', gap: 20, gridTemplateColumns: '1fr 1fr' }}>
            <div style={card}>
              <h3 style={sectionTitle}>🗺️ 门店区域分布</h3>
              <HorizontalBarChart
                data={REGION_STATS}
                dataKey="count"
                labelKey="region"
                color="#8b5cf6"
              />
            </div>
            <div style={card}>
              <h3 style={sectionTitle}>📋 区域汇总</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {REGION_STATS.map(r => (
                  <div
                    key={r.region}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: 'rgba(15,23,42,0.3)',
                      border: '1px solid rgba(148,163,184,0.1)',
                    }}
                  >
                    <span style={{ color: '#cbd5e1', fontWeight: 500 }}>{r.region}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ color: '#93c5fd', fontWeight: 700, fontSize: 16 }}>
                        {r.count.toLocaleString()}
                      </span>
                      <span style={{ color: '#64748b', fontSize: 12 }}>门店</span>
                      <div
                        style={{
                          padding: '2px 8px',
                          borderRadius: 8,
                          background: 'rgba(139,92,246,0.15)',
                          color: '#a78bfa',
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {r.percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 10, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', fontSize: 13, color: '#c4b5fd' }}>
                总计 <strong style={{ color: '#fff' }}>{REGION_STATS.reduce((s, r) => s + r.count, 0).toLocaleString()}</strong> 家门店，覆盖 <strong style={{ color: '#fff' }}>{REGION_STATS.length}</strong> 个区域
              </div>
            </div>
          </div>
        )}
        </PageShell>
      </div>
    </AdminPermissionGate>
  );
}
