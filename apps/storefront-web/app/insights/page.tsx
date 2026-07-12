'use client';

import React, { useMemo, useState } from 'react';

import {
  AnomalyAlertPanel,
  DeviceStatusPanel,
  GaugeChart,
  HeatmapChart,
  MemberLevelDistribution,
  type AnomalyAlert,
  type DeviceEntry,
  type GaugeSegment,
  type HeatmapCell,
  type MemberLevel,
} from '@m5/ui';

// ============================================================
//  1. Mock 数据
// ============================================================

/* 会员等级数据 */
const MOCK_MEMBER_LEVELS: MemberLevel[] = [
  { name: '钻石会员', count: 28, color: '#a78bfa' },
  { name: '黄金会员', count: 86, color: '#f59e0b' },
  { name: '银卡会员', count: 134, color: '#94a3b8' },
  { name: '铜卡会员', count: 72, color: '#a0522d' },
  { name: '普通会员', count: 240, color: '#6b7280' },
];

/* 设备数据 */
const MOCK_DEVICES: DeviceEntry[] = [
  { id: 'pos-01', name: '收银台 POS-01', type: 'pos', status: 'online', lastSeen: new Date(Date.now() - 30000).toISOString(), uptimeHours: 168, cpuUsage: 45, memoryUsage: 62, temperature: 52, firmwareVersion: '3.2.1', location: '收银区', ipAddress: '192.168.1.101' },
  { id: 'pos-02', name: '收银台 POS-02', type: 'pos', status: 'online', lastSeen: new Date(Date.now() - 60000).toISOString(), uptimeHours: 120, cpuUsage: 38, memoryUsage: 55, temperature: 48, firmwareVersion: '3.2.0', location: '收银区', ipAddress: '192.168.1.102' },
  { id: 'prt-01', name: '厨房打印机', type: 'printer', status: 'warning', lastSeen: new Date(Date.now() - 120000).toISOString(), uptimeHours: 240, cpuUsage: 72, memoryUsage: 81, temperature: 68, firmwareVersion: '1.4.3', location: '后厨', ipAddress: '192.168.1.201', alertMessage: '打印头温度偏高' },
  { id: 'scn-01', name: '入库扫描枪', type: 'scanner', status: 'online', lastSeen: new Date(Date.now() - 5000).toISOString(), uptimeHours: 96, cpuUsage: 12, memoryUsage: 28, location: '仓库', ipAddress: '192.168.1.301' },
  { id: 'cam-01', name: '入口摄像头', type: 'camera', status: 'online', lastSeen: new Date(Date.now() - 10000).toISOString(), uptimeHours: 720, cpuUsage: 55, memoryUsage: 73, temperature: 44, firmwareVersion: '2.1.0', location: '入口', ipAddress: '192.168.1.401' },
  { id: 'cam-02', name: '收银区摄像头', type: 'camera', status: 'error', lastSeen: new Date(Date.now() - 1800000).toISOString(), uptimeHours: 0, cpuUsage: 0, memoryUsage: 0, temperature: 0, firmwareVersion: '2.1.0', location: '收银区', ipAddress: '192.168.1.402', alertMessage: '画面无信号' },
  { id: 'dsp-01', name: '大厅显示屏', type: 'display', status: 'maintenance', lastSeen: new Date(Date.now() - 14400000).toISOString(), uptimeHours: 12, cpuUsage: 22, memoryUsage: 45, firmwareVersion: '1.0.5', location: '大厅' },
  { id: 'net-01', name: '主交换机', type: 'network', status: 'online', lastSeen: new Date(Date.now() - 15000).toISOString(), uptimeHours: 1440, cpuUsage: 35, memoryUsage: 58, temperature: 62, firmwareVersion: '7.8.1', location: '机房', ipAddress: '10.0.0.1' },
  { id: 'sns-01', name: '温湿度传感器', type: 'sensor', status: 'warning', lastSeen: new Date(Date.now() - 60000).toISOString(), cpuUsage: 8, memoryUsage: 15, temperature: 42, firmwareVersion: '0.9.2', location: '冷库', alertMessage: '湿度异常 88%' },
  { id: 'sns-02', name: '烟雾探测器', type: 'sensor', status: 'online', lastSeen: new Date(Date.now() - 45000).toISOString(), cpuUsage: 5, memoryUsage: 10, firmwareVersion: '1.2.0', location: '大厅' },
];

/* 热力图数据 — 各时段各设备类型在线设备数 */
const HEATMAP_DATA: HeatmapCell[] = [
  // 时段: 0-4, 4-8, 8-12, 12-16, 16-20, 20-24
  { colLabel: '0-4点', rowLabel: 'POS机', value: 0 },
  { colLabel: '4-8点', rowLabel: 'POS机', value: 1 },
  { colLabel: '8-12点', rowLabel: 'POS机', value: 2 },
  { colLabel: '12-16点', rowLabel: 'POS机', value: 2 },
  { colLabel: '16-20点', rowLabel: 'POS机', value: 2 },
  { colLabel: '20-24点', rowLabel: 'POS机', value: 1 },
  { colLabel: '0-4点', rowLabel: '打印机', value: 0 },
  { colLabel: '4-8点', rowLabel: '打印机', value: 1 },
  { colLabel: '8-12点', rowLabel: '打印机', value: 1 },
  { colLabel: '12-16点', rowLabel: '打印机', value: 1 },
  { colLabel: '16-20点', rowLabel: '打印机', value: 1 },
  { colLabel: '20-24点', rowLabel: '打印机', value: 0 },
  { colLabel: '0-4点', rowLabel: '摄像头', value: 1 },
  { colLabel: '4-8点', rowLabel: '摄像头', value: 2 },
  { colLabel: '8-12点', rowLabel: '摄像头', value: 2 },
  { colLabel: '12-16点', rowLabel: '摄像头', value: 2 },
  { colLabel: '16-20点', rowLabel: '摄像头', value: 2 },
  { colLabel: '20-24点', rowLabel: '摄像头', value: 1 },
  { colLabel: '0-4点', rowLabel: '网络设备', value: 0 },
  { colLabel: '4-8点', rowLabel: '网络设备', value: 1 },
  { colLabel: '8-12点', rowLabel: '网络设备', value: 1 },
  { colLabel: '12-16点', rowLabel: '网络设备', value: 1 },
  { colLabel: '16-20点', rowLabel: '网络设备', value: 1 },
  { colLabel: '20-24点', rowLabel: '网络设备', value: 0 },
  { colLabel: '0-4点', rowLabel: '传感器', value: 1 },
  { colLabel: '4-8点', rowLabel: '传感器', value: 2 },
  { colLabel: '8-12点', rowLabel: '传感器', value: 2 },
  { colLabel: '12-16点', rowLabel: '传感器', value: 2 },
  { colLabel: '16-20点', rowLabel: '传感器', value: 2 },
  { colLabel: '20-24点', rowLabel: '传感器', value: 1 },
  { colLabel: '0-4点', rowLabel: '显示屏', value: 0 },
  { colLabel: '4-8点', rowLabel: '显示屏', value: 1 },
const LEVEL_KEY = "level" as const;

  { colLabel: '8-12点', rowLabel: '显示屏', value: 1 },
  { colLabel: '12-16点', rowLabel: '显示屏', value: 1 },
  { colLabel: '16-20点', rowLabel: '显示屏', value: 1 },
  { colLabel: '20-24点', rowLabel: '显示屏', value: 0 },
];

/* 仪表盘分段 */
const GAUGE_SEGMENTS: GaugeSegment[] = [
  { from: 0, to: 30, color: '#22c55e', label: '良好' },
  { from: 30, to: 70, color: '#f59e0b', label: '注意' },
  { from: 70, to: 100, color: '#ef4444', label: '告警' },
];

/* 异常告警 */
const MOCK_ALERTS: AnomalyAlert[] = [
  { id: 'a1', title: '打印机温度过高', description: '厨房打印机(prt-01)打印头温度68°C，超出正常范围', severity: 'medium', source: 'device', timestamp: new Date(Date.now() - 300000).toISOString(), acknowledged: false },
  { id: 'a2', title: '收银区摄像头断连', description: 'cam-02 画面无信号，最后在线时间超过30分钟', severity: 'high', source: 'device', timestamp: new Date(Date.now() - 1800000).toISOString(), acknowledged: false },
  { id: 'a3', title: '冷库湿度异常', description: '温湿度传感器(sns-01)检测到湿度88%，超过标准阈值', severity: 'medium', source: 'device', timestamp: new Date(Date.now() - 600000).toISOString(), acknowledged: true },
  { id: 'a4', title: 'POS-01交易超时', description: '12:30-12:35 连续3笔交易响应超时，请检查网络', severity: 'high', source: 'transaction', timestamp: new Date(Date.now() - 3600000).toISOString(), acknowledged: false },
  { id: 'a5', title: '库存预警', description: '钻石会员专属商品「限量礼盒」库存仅剩5件', severity: 'low', source: 'system', timestamp: new Date(Date.now() - 7200000).toISOString(), acknowledged: true },
];

const X_LABELS = ['0-4点', '4-8点', '8-12点', '12-16点', '16-20点', '20-24点'];
const Y_LABELS = ['POS机', '打印机', '摄像头', '网络设备', '传感器', '显示屏'];

// ============================================================
//  2. Dashboard Grid 样式常量
// ============================================================

const styles = {
  container: {
    maxWidth: 1280,
    margin: '0 auto',
    padding: '32px 24px',
  },
  header: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: 700,
    color: '#f1f5f9',
    margin: 0,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 600,
    color: '#cbd5e1',
    marginBottom: 16,
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  grid_2: {
    display: 'grid' as const,
    gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
    gap: 24,
    marginBottom: 32,
  },
  grid_3: {
    display: 'grid' as const,
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 24,
    marginBottom: 32,
  },
  card: {
    borderRadius: 16,
    background: 'rgba(15,23,42,0.3)',
    border: '1px solid rgba(148,163,184,0.1)',
    padding: 20,
    overflow: 'hidden' as const,
  },
  metricGrid: {
    display: 'grid' as const,
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    borderRadius: 12,
    padding: '14px 16px',
    background: 'rgba(15,23,42,0.35)',
    border: '1px solid rgba(148,163,184,0.08)',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 700,
    marginTop: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  gaugeRow: {
    display: 'grid' as const,
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16,
    marginBottom: 24,
  },
};

// ============================================================
//  3. 仪表盘组件
// ============================================================

/** 顶部关键指标卡 */
function MetricCard({ label, value, accent, unit }: { label: string; value: string; accent: string; unit?: string }) {
  return (
    <div style={styles.metricCard}>
      <div style={styles.metricLabel}>{label}</div>
      <div style={{ ...styles.metricValue, color: accent }}>
        {value}
        {unit && <span style={{ fontSize: 12, fontWeight: 400, color: '#64748b', marginLeft: 4 }}>{unit}</span>}
      </div>
    </div>
  );
}

// ============================================================
//  4. 页面主组件
// ============================================================

export default function InsightsPage() {
  const [lastUpdated] = useState(() => new Date().toLocaleTimeString('zh-CN', { hour12: false }));

  // 设备统计
  const deviceStats = useMemo(() => {
    const total = MOCK_DEVICES.length;
    const online = MOCK_DEVICES.filter(d => d.status === 'online').length;
    const warnErr = MOCK_DEVICES.filter(d => d.status === 'warning' || d.status === 'error').length;
    const uptimeAvg = Math.round(MOCK_DEVICES.reduce((s, d) => s + (d.uptimeHours ?? 0), 0) / total);
    return { total, online, warnErr, uptimeAvg };
  }, []);

  // 会员统计
  const memberStats = useMemo(() => {
    const total = MOCK_MEMBER_LEVELS.reduce((s, l) => s + l.count, 0);
    const diamond = MOCK_MEMBER_LEVELS.find(l => l.name === '钻石会员')?.count ?? 0;
    const highValue = MOCK_MEMBER_LEVELS.filter(l => l.name === '钻石会员' || l.name === '黄金会员').reduce((s, l) => s + l.count, 0);
    return { total, diamond, highValue, ratio: ((highValue / total) * 100).toFixed(1) };
  }, []);

  return (
    <div style={styles.container}>
      {/* ---- 页面标题 ---- */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>📊 数据洞察</h1>
          <p style={styles.subtitle}>门店运营数据实时看板 · 最后更新 {lastUpdated}</p>
        </div>
      </div>

      {/* ---- 关键指标行 ---- */}
      <div style={styles.metricGrid}>
        <MetricCard label="门店设备总数" value={String(deviceStats.total)} accent="#60a5fa" unit="台" />
        <MetricCard label="设备在线率" value={((deviceStats.online / deviceStats.total) * 100).toFixed(0)} accent="#4ade80" unit="%" />
        <MetricCard label="警告/故障" value={String(deviceStats.warnErr)} accent="#ef4444" unit="项" />
        <MetricCard label="平均运行时长" value={String(deviceStats.uptimeAvg)} accent="#facc15" unit="h" />
        <MetricCard label="会员总数" value={String(memberStats.total)} accent="#a78bfa" unit="人" />
        <MetricCard label="高价值会员率" value={memberStats.ratio} accent="#f59e0b" unit="%" />
      </div>

      {/* ---- 第一行：会员等级分布 + 热力图 ---- */}
      <div style={styles.sectionLabel}>
        <span>📈</span> 会员 & 设备分析
      </div>
      <div style={styles.grid_2}>
        {/* 会员等级分布 */}
        <div style={styles.card}>
          <MemberLevelDistribution
            data={MOCK_MEMBER_LEVELS}
            width={520}
            height={280}
            title="会员等级分布"
            showValues
            showPercentage
          />
        </div>

        {/* 设备时段热力图 */}
        <div style={styles.card}>
          <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>
            🌡️ 设备活跃时段热力图
          </h4>
          <HeatmapChart
            data={HEATMAP_DATA}
            colLabels={X_LABELS}
            rowLabels={Y_LABELS}
            width={500}
            height={240}
            colorScheme="cool"
          />
        </div>
      </div>

      {/* ---- 第二行：仪表盘 + 异常告警 ---- */}
      <div style={styles.sectionLabel}>
        <span>🚨</span> 运行状况 & 告警
      </div>
      <div style={styles.grid_3}>
        {/* 仪表 — CPU */}
        <div style={styles.card}>
          <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>CPU 综合使用率</h4>
          <GaugeChart
            value={42}
            min={0}
            max={100}
            segments={GAUGE_SEGMENTS}
            width={280}
            height={180}
            suffix="%"
          />
        </div>

        {/* 仪表 — 内存 */}
        <div style={styles.card}>
          <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>内存综合使用率</h4>
          <GaugeChart
            value={63}
            min={0}
            max={100}
            segments={GAUGE_SEGMENTS}
            width={280}
            height={180}
            suffix="%"
          />
        </div>

        {/* 仪表 — 在线率 */}
        <div style={styles.card}>
          <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>设备在线率</h4>
          <GaugeChart
            value={deviceStats.online / deviceStats.total * 100}
            min={0}
            max={100}
            segments={[
              { from: 0, to: 50, color: '#ef4444', label: '差' },
              { from: 50, to: 80, color: '#f59e0b', label: '一般' },
              { from: 80, to: 100, color: '#22c55e', label: '优秀' },
            ]}
            width={280}
            height={180}
            suffix="%"
          />
        </div>
      </div>

      {/* ---- 第三行：异常告警 + 设备状态 ---- */}
      <div style={styles.sectionLabel}>
        <span>🚦</span> 设备 & 告警详情
      </div>
      <div style={styles.grid_2}>
        {/* 异常告警面板 */}
        <div style={styles.card}>
          <AnomalyAlertPanel
            alerts={MOCK_ALERTS}
            maxDisplay={5}
            title="待处理告警"
            onAcknowledge={(id) => { if (process.env.NODE_ENV !== 'production') console.warn('ack:', id) }}
          />
        </div>

        {/* 设备状态面板 */}
        <div style={styles.card}>
          <DeviceStatusPanel
            devices={MOCK_DEVICES}
            title="门店设备状态"
            showSummary
            showDetails
            showFilters
            showSearch
            maxDisplay={10}
            onRefresh={() => window.location.reload()}
          />
        </div>
      </div>

      {/* ---- 底部时间戳 ---- */}
      <div style={{ textAlign: 'center', marginTop: 40, fontSize: 12, color: '#475569' }}>
        数据模拟展示 · 每15分钟自动刷新
      </div>
    </div>
  );
}
