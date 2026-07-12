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
  { colLabel: '8-12点', rowLabel: '显示屏', value: 1 },
  { colLabel: '12-16点', rowLabel: '显示屏', value: 1 },
  { colLabel: '16-20点', rowLabel: '显示屏', value: 1 },
  { colLabel: '20-24点', rowLabel: '显示屏', value: 0 },
];

/* 告警数据 */
const MOCK_ALERTS: AnomalyAlert[] = [
  { deviceId: 'cam-02', id: 'alt-01', type: 'camera_down', severity: 'high', message: '收银区摄像头画面无信号', timestamp: new Date(Date.now() - 1800000).toISOString(), status: 'acknowledged' },
  { id: 'alt-02', id: 'prt-01', type: 'thermal', severity: 'medium', message: '厨房打印机打印头温度偏高 (68°C)', timestamp: new Date(Date.now() - 120000).toISOString(), status: 'open' },
  { id: 'alt-03', id: 'sns-01', type: 'humidity', severity: 'medium', message: '冷库湿度异常 88%', timestamp: new Date(Date.now() - 60000).toISOString(), status: 'open' },
  { id: 'alt-04', id: 'pos-01', type: 'network', severity: 'low', message: 'POS-01 网络延迟偏高', timestamp: new Date(Date.now() - 3600000).toISOString(), status: 'resolved' },
  { id: 'alt-05', id: 'sns-01', type: 'temperature', severity: 'high', message: '冷库温度异常 12°C', timestamp: new Date(Date.now() - 7200000).toISOString(), status: 'resolved' },
];
const gaugeSegments: GaugeSegment[] = [
  { from: 0, to: 30, color: '#22c55e', label: '良好' },
  { from: 30, to: 70, color: '#f59e0b', label: '注意' },
  { from: 70, to: 100, color: '#ef4444', label: '告警' },
];

// ============================================================
//  2. 工具
// ============================================================

function percent(a: number, b: number): number {
  return b === 0 ? 0 : Math.round((a / b) * 100);
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 24, maxWidth: 1200, margin: '0 auto', color: '#e2e8f0' },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px' },
  subtitle: { fontSize: 13, color: '#64748b', margin: 0 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16, marginBottom: 24 },
  card: { borderRadius: 12, padding: 20, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.1)' },
  cardTitle: { fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 12 },
  metricRow: { display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', marginBottom: 16 },
  metricValue: { fontSize: 28, fontWeight: 700 } as React.CSSProperties,
  metricLabel: { fontSize: 12, color: '#94a3b8' },
  flexRow: { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 },
  chip: { padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500 },
  sectionTitle: { fontSize: 16, fontWeight: 600, color: '#f1f5f9', marginBottom: 12 },
};

// ============================================================
//  3. 仪表盘
// ============================================================

function UsageGauge({ used, total, label, accent }: { used: number; total: number; label: string; accent: string }) {
  const pct = total === 0 ? 0 : Math.round((used / total) * 100);
  return (
    <div>
      <GaugeChart segments={gaugeSegments} value={pct} size={120} label={label} />
      <div style={{ textAlign: 'center', marginTop: 4 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: accent }}>
          {used.toLocaleString()}
        </div>
        <div style={{ fontSize: 11, color: '#64748b' }}>
          / {total.toLocaleString()} | {pct}%
        </div>
      </div>
    </div>
  );
}

export default function DataInsights() {
  const [filter, setFilter] = useState<'all' | 'online' | 'warning' | 'error' | 'maintenance'>('all');

  const filteredDevices = useMemo(
    () => filter === 'all' ? MOCK_DEVICES : MOCK_DEVICES.filter(d => d.status === filter),
    [filter]
  );

  const total = MOCK_MEMBER_LEVELS.reduce((s, l) => s + l.count, 0);
  const diamond = MOCK_MEMBER_LEVELS.find(l => l.name === '钻石会员')?.count ?? 0;
  const highValue = MOCK_MEMBER_LEVELS.filter(l => l.name === '钻石会员' || l.name === '黄金会员').reduce((s, l) => s + l.count, 0);
  const onlineCount = MOCK_DEVICES.filter(d => d.status === 'online').length;
  const warningCount = MOCK_DEVICES.filter(d => d.status === 'warning' || d.status === 'error').length;
  const avgUptime = Math.round(MOCK_DEVICES.reduce((s, d) => s + (d.uptimeHours ?? 0), 0) / MOCK_DEVICES.length);
  const deviceUptime = avgUptime;

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>📊 数据洞察</h1>
        <p style={styles.subtitle}>门店运营数据总览 · 数据洞察系统</p>
      </div>

      {/* 概览指标 */}
      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardTitle}>会员总数</div>
          <div style={styles.metricRow}>
            <span style={{ ...styles.metricValue, color: '#fbbf24' }}>{total}</span>
            <span style={styles.metricLabel}>人</span>
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            钻石会员 {diamond} · 高价值会员 {highValue}
          </div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardTitle}>设备在线率</div>
          <div style={styles.metricRow}>
            <span style={{ ...styles.metricValue, color: '#22c55e' }}>{onlineCount}</span>
            <span style={styles.metricLabel}>/ {MOCK_DEVICES.length} 在线</span>
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            平均正常运行 {avgUptime}h · {warningCount} 台异常
          </div>
        </div>
      </div>

      {/* 会员等级分布 */}
      <div style={{ ...styles.card, marginBottom: 16 }}>
        <div style={styles.cardTitle}>📊 会员等级分布</div>
        <MemberLevelDistribution data={MOCK_MEMBER_LEVELS} />
        <div style={{ marginTop: 8, fontSize: 12, color: '#64748b', textAlign: 'center' }}>
          total: {total} · level count: {MOCK_MEMBER_LEVELS.length} · high-value: {percent(highValue, total)}%
        </div>
      </div>

      {/* 设备状态 */}
      <div style={{ ...styles.card, marginBottom: 16 }}>
        <div style={{ ...styles.cardTitle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>🖥️ 设备在线状态</span>
          <div style={styles.flexRow}>
            {(['all', 'online', 'warning', 'error', 'maintenance'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                style={{
                  ...styles.chip,
                  background: filter === s ? 'rgba(59,130,246,0.15)' : 'rgba(148,163,184,0.08)',
                  border: filter === s ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                  color: filter === s ? '#93c5fd' : '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                {s === 'all' ? '全部' : s === 'online' ? '在线' : s === 'warning' ? '注意' : s === 'error' ? '离线' : '维护'}
              </button>
            ))}
          </div>
        </div>
        <DeviceStatusPanel devices={filteredDevices} />
      </div>

      {/* 异常告警 */}
      <div style={{ ...styles.card, marginBottom: 16 }}>
        <div style={styles.cardTitle}>🔔 异常告警</div>
        <AnomalyAlertPanel alerts={MOCK_ALERTS} />
      </div>

      {/* 热力图 */}
      <div style={{ ...styles.card, marginBottom: 16 }}>
        <div style={styles.cardTitle}>📈 设备在线热力图</div>
        <HeatmapChart data={HEATMAP_DATA} />
      </div>

      {/* 仪表盘 */}
      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardTitle}>设备运行状态</div>
          <UsageGauge used={onlineCount} total={MOCK_DEVICES.length} label="在线率" accent="#22c55e" />
        </div>
        <div style={styles.card}>
          <div style={styles.cardTitle}>会员高价值占比</div>
          <UsageGauge used={highValue} total={total} label="高价值" accent="#fbbf24" />
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: 11, color: '#475569', marginTop: 24 }}>
        数据洞察系统 · 数据更新于 {new Date().toLocaleString('zh-CN')}
      </div>
    </main>
  );
}
