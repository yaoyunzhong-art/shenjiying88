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
  { id: 'net-02', name: '备用路由器', type: 'network', status: 'online', lastSeen: new Date(Date.now() - 20000).toISOString(), uptimeHours: 720, cpuUsage: 12, memoryUsage: 30, firmwareVersion: '1.0.1', location: '机房' },
  { id: 'dsp-02', name: '广告显示屏', type: 'display', status: 'online', lastSeen: new Date(Date.now() - 8000).toISOString(), uptimeHours: 480, cpuUsage: 18, memoryUsage: 35, firmwareVersion: '2.0.3', location: '入口' },
];

/* 热力图数据 */
const HEATMAP_DATA: HeatmapCell[] = [
  { colLabel: '0-4点', rowLabel: 'POS机', value: 0 }, { colLabel: '4-8点', rowLabel: 'POS机', value: 1 }, { colLabel: '8-12点', rowLabel: 'POS机', value: 2 }, { colLabel: '12-16点', rowLabel: 'POS机', value: 2 }, { colLabel: '16-20点', rowLabel: 'POS机', value: 2 }, { colLabel: '20-24点', rowLabel: 'POS机', value: 1 },
  { colLabel: '0-4点', rowLabel: '打印机', value: 0 }, { colLabel: '4-8点', rowLabel: '打印机', value: 1 }, { colLabel: '8-12点', rowLabel: '打印机', value: 1 }, { colLabel: '12-16点', rowLabel: '打印机', value: 1 }, { colLabel: '16-20点', rowLabel: '打印机', value: 1 }, { colLabel: '20-24点', rowLabel: '打印机', value: 0 },
  { colLabel: '0-4点', rowLabel: '摄像头', value: 1 }, { colLabel: '4-8点', rowLabel: '摄像头', value: 2 }, { colLabel: '8-12点', rowLabel: '摄像头', value: 2 }, { colLabel: '12-16点', rowLabel: '摄像头', value: 2 }, { colLabel: '16-20点', rowLabel: '摄像头', value: 2 }, { colLabel: '20-24点', rowLabel: '摄像头', value: 1 },
  { colLabel: '0-4点', rowLabel: '网络设备', value: 0 }, { colLabel: '4-8点', rowLabel: '网络设备', value: 1 }, { colLabel: '8-12点', rowLabel: '网络设备', value: 1 }, { colLabel: '12-16点', rowLabel: '网络设备', value: 1 }, { colLabel: '16-20点', rowLabel: '网络设备', value: 1 }, { colLabel: '20-24点', rowLabel: '网络设备', value: 0 },
  { colLabel: '0-4点', rowLabel: '传感器', value: 1 }, { colLabel: '4-8点', rowLabel: '传感器', value: 2 }, { colLabel: '8-12点', rowLabel: '传感器', value: 2 }, { colLabel: '12-16点', rowLabel: '传感器', value: 2 }, { colLabel: '16-20点', rowLabel: '传感器', value: 2 }, { colLabel: '20-24点', rowLabel: '传感器', value: 1 },
  { colLabel: '0-4点', rowLabel: '显示屏', value: 0 }, { colLabel: '4-8点', rowLabel: '显示屏', value: 1 }, { colLabel: '8-12点', rowLabel: '显示屏', value: 1 }, { colLabel: '12-16点', rowLabel: '显示屏', value: 1 }, { colLabel: '16-20点', rowLabel: '显示屏', value: 1 }, { colLabel: '20-24点', rowLabel: '显示屏', value: 0 },
];

/* 告警数据 */
const MOCK_ALERTS: AnomalyAlert[] = [
  { id: 'alt-01', title: '摄像头画面无信号', description: '收银区摄像头画面无信号', severity: 'high', source: 'device', timestamp: new Date(Date.now() - 1800000).toISOString(), acknowledged: true },
  { id: 'alt-02', title: '打印头温度偏高', description: '厨房打印机打印头温度偏高 (68°C)', severity: 'medium', source: 'device', timestamp: new Date(Date.now() - 120000).toISOString(), acknowledged: false },
  { id: 'alt-03', title: '湿度异常', description: '冷库湿度异常 88%', severity: 'medium', source: 'system', timestamp: new Date(Date.now() - 60000).toISOString(), acknowledged: false },
  { id: 'alt-04', title: '网络延迟偏高', description: 'POS-01 网络延迟偏高', severity: 'low', source: 'network', timestamp: new Date(Date.now() - 3600000).toISOString(), acknowledged: false },
  { id: 'alt-05', title: '冷库温度异常', description: '冷库温度异常 12°C', severity: 'high', source: 'system', timestamp: new Date(Date.now() - 7200000).toISOString(), acknowledged: true },
  { id: 'alt-06', title: '备用路由器升级提醒', description: '备用路由器固件版本过低', severity: 'low', source: 'system', timestamp: new Date(Date.now() - 10800000).toISOString(), acknowledged: false },
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

// ============================================================
//  3. 子组件
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
        <div style={{ fontSize: 11, color: '#64748b' }}> / {total.toLocaleString()} | {pct}%</div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, sublabel }: { label: string; value: string | number; icon: string; color: string; sublabel?: string }) {
  return (
    <div style={{ flex: 1, minWidth: 160, background: 'rgba(15,23,42,0.6)', borderRadius: 12, border: '1px solid rgba(148,163,184,0.1)', padding: '16px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: '#64748b' }}>{label}</span>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
      {sublabel && <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{sublabel}</div>}
    </div>
  );
}

// ============================================================
//  4. 详情展板 (Tab 面板)
// ============================================================

function DeviceDetailPanel({ devices, onFilterChange }: { devices: DeviceEntry[]; onFilterChange: (filter: string) => void }) {
  const filters = ['all', 'online', 'warning', 'error', 'maintenance'] as const;
  const [activeFilter, setActiveFilter] = useState<string>('all');
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button key={f} onClick={() => { setActiveFilter(f); onFilterChange(f); }} style={{
            padding: '4px 12px', borderRadius: 6, fontSize: 12,
            background: activeFilter === f ? 'rgba(59,130,246,0.15)' : 'rgba(148,163,184,0.08)',
            border: activeFilter === f ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
            color: activeFilter === f ? '#93c5fd' : '#94a3b8', cursor: 'pointer',
          }}>
            {f === 'all' ? '全部' : f === 'online' ? '在线' : f === 'warning' ? '注意' : f === 'error' ? '离线' : '维护'}
          </button>
        ))}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.15)' }}>
            <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>名称</th>
            <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>类型</th>
            <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>位置</th>
            <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>状态</th>
          </tr>
        </thead>
        <tbody>
          {devices.map(d => (
            <tr key={d.id} style={{ borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
              <td style={{ padding: '7px 12px', color: '#e2e8f0' }}>{d.name}</td>
              <td style={{ padding: '7px 12px', color: '#94a3b8' }}>{d.type}</td>
              <td style={{ padding: '7px 12px', color: '#94a3b8' }}>{d.location}</td>
              <td style={{ padding: '7px 12px' }}>
                <span style={{
                  display: 'inline-block', padding: '1px 8px', borderRadius: 4, fontSize: 11,
                  background: d.status === 'online' ? 'rgba(34,197,94,0.15)' : d.status === 'warning' ? 'rgba(245,158,11,0.15)' : d.status === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(148,163,184,0.15)',
                  color: d.status === 'online' ? '#4ade80' : d.status === 'warning' ? '#fbbf24' : d.status === 'error' ? '#f87171' : '#94a3b8',
                }}>
                  {d.status === 'online' ? '在线' : d.status === 'warning' ? '注意' : d.status === 'error' ? '离线' : '维护'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DataInsights() {
  const [filter, setFilter] = useState<'all' | 'online' | 'warning' | 'error' | 'maintenance'>('all');
  const [activeSection, setActiveSection] = useState<'overview' | 'devices' | 'members' | 'alerts'>('overview');

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

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto', color: '#e2e8f0' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px' }}>📊 数据洞察</h1>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>门店运营数据总览 · 会员等级分布 · 设备在线状态 · 异常告警</p>
      </div>

      {/* 概览指标 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard label="会员总数" value={total} icon="👥" color="#fbbf24" sublabel={`钻石 ${diamond} · 高价值 ${highValue}`} />
        <StatCard label="设备在线率" value={`${onlineCount}/${MOCK_DEVICES.length}`} icon="🖥️" color="#4ade80" sublabel={`平均 ${avgUptime}h 正常运行`} />
        <StatCard label="异常告警" value={MOCK_ALERTS.filter(a => !a.acknowledged).length} icon="🔔" color="#f87171" sublabel={`${MOCK_ALERTS.length} 条告警`} />
        <StatCard label="高价值占比" value={`${percent(highValue, total)}%`} icon="💎" color="#a78bfa" sublabel={`${highValue} 位`} />
      </div>

      {/* 分区导航 */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid rgba(148,163,184,0.15)' }}>
        {(['overview', 'members', 'devices', 'alerts'] as const).map(s => (
          <button key={s} onClick={() => setActiveSection(s)} style={{
            padding: '8px 16px', border: 'none', background: 'transparent', cursor: 'pointer',
            fontSize: 13, fontWeight: activeSection === s ? 700 : 400,
            color: activeSection === s ? '#60a5fa' : '#94a3b8',
            borderBottom: activeSection === s ? '2px solid #60a5fa' : '2px solid transparent',
            marginBottom: -1,
          }}>
            {s === 'overview' ? '📊 概览' : s === 'members' ? '👥 会员' : s === 'devices' ? '🖥️ 设备' : '🔔 告警'}
          </button>
        ))}
      </div>

      {/* 概览区 */}
      {activeSection === 'overview' && (
        <div>
          {/* 仪表盘 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div style={{ borderRadius: 12, padding: 20, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.1)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 12 }}>设备运行状态</div>
              <UsageGauge used={onlineCount} total={MOCK_DEVICES.length} label="在线率" accent="#22c55e" />
            </div>
            <div style={{ borderRadius: 12, padding: 20, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.1)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 12 }}>会员高价值占比</div>
              <UsageGauge used={highValue} total={total} label="高价值" accent="#fbbf24" />
            </div>
          </div>
          {/* 热力图 */}
          <div style={{ borderRadius: 12, padding: 20, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.1)', marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 12 }}>📈 设备在线热力图</div>
            <HeatmapChart data={HEATMAP_DATA} />
          </div>
        </div>
      )}

      {/* 会员区 */}
      {activeSection === 'members' && (
        <div style={{ borderRadius: 12, padding: 20, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.1)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
            <span>📊 会员等级分布</span>
            <span style={{ fontSize: 11, color: '#64748b' }}>total: {total} · 高价值: {percent(highValue, total)}%</span>
          </div>
          <MemberLevelDistribution data={MOCK_MEMBER_LEVELS} />
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {MOCK_MEMBER_LEVELS.map(level => (
              <div key={level.name} style={{ textAlign: 'center', padding: 10, borderRadius: 8, background: 'rgba(148,163,184,0.06)' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: level.color }}>{level.count}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{level.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 设备区 */}
      {activeSection === 'devices' && (
        <div style={{ borderRadius: 12, padding: 20, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.1)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
            <span>🖥️ 设备在线状态</span>
            <span style={{ fontSize: 11 }}>{onlineCount}/{MOCK_DEVICES.length} 在线</span>
          </div>
          <DeviceDetailPanel devices={MOCK_DEVICES} onFilterChange={(f) => setFilter(f as typeof filter)} />
          <div style={{ marginTop: 16 }}>
            <DeviceStatusPanel devices={filteredDevices} />
          </div>
        </div>
      )}

      {/* 告警区 */}
      {activeSection === 'alerts' && (
        <div style={{ borderRadius: 12, padding: 20, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.1)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
            <span>🔔 异常告警</span>
            <span style={{ fontSize: 11 }}>{MOCK_ALERTS.filter(a => !a.acknowledged).length} 条未处理</span>
          </div>
          <AnomalyAlertPanel alerts={MOCK_ALERTS} />
          <div style={{ marginTop: 12, fontSize: 11, color: '#64748b', textAlign: 'center' }}>
            {MOCK_ALERTS.filter(a => a.severity === 'high').length} 条高危 · {MOCK_ALERTS.filter(a => a.acknowledged).length} 条已处理
          </div>
        </div>
      )}

      {/* 设备故障频率分布 */}
      <div style={{ marginBottom: 24, padding: 16, borderRadius: 12, background: '#0f172a', border: '1px solid rgba(148,163,184,0.15)' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>🔧 设备故障频率分布</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
          {[
            { type: '收银机', count: 3, trend: 'down' },
            { type: '摄像头', count: 7, trend: 'up' },
            { type: '打印机', count: 5, trend: 'stable' },
            { type: '网络设备', count: 2, trend: 'down' },
            { type: '传感器', count: 4, trend: 'up' },
            { type: '显示屏', count: 1, trend: 'stable' },
          ].map((item, i) => (
            <div key={i} style={{ padding: 10, borderRadius: 8, background: 'rgba(148,163,184,0.06)', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>{item.type}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: item.count > 5 ? '#f87171' : item.count > 3 ? '#fbbf24' : '#4ade80' }}>{item.count}</div>
              <div style={{ fontSize: 11, color: item.trend === 'up' ? '#f87171' : item.trend === 'down' ? '#4ade80' : '#94a3b8' }}>
                {item.trend === 'up' ? '↑ 上升' : item.trend === 'down' ? '↓ 下降' : '→ 持平'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 快速统计摘要 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        <div style={{ borderRadius: 12, padding: 14, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.1)', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#4ade80' }}>{percent(onlineCount, MOCK_DEVICES.length)}%</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>设备在线率</div>
        </div>
        <div style={{ borderRadius: 12, padding: 14, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.1)', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fbbf24' }}>{percent(highValue, total)}%</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>高价值会员占比</div>
        </div>
        <div style={{ borderRadius: 12, padding: 14, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.1)', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#f87171' }}>{MOCK_ALERTS.filter(a => !a.acknowledged).length}</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>未处理告警</div>
        </div>
      </div>

          {/* 实时活动日志 */}
      <div style={{ marginBottom: 24, padding: 16, borderRadius: 12, background: '#0f172a', border: '1px solid rgba(148,163,184,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>📋 实时活动日志</h3>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>最新 {8} 条门店活动</p>
          </div>
          <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(34,197,94,0.15)', color: '#4ade80', fontSize: 11 }}>实时</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            { time: '14:32', event: '会员 张伟 充值 ¥500', type: 'transaction' as const },
            { time: '14:28', event: 'POS-01 完成订单 #202607161482', type: 'transaction' as const },
            { time: '14:20', event: '新会员注册: 李明 (推荐码 M003)', type: 'registration' as const },
            { time: '14:15', event: '打印机 打印头温度恢复正常', type: 'system' as const },
            { time: '14:08', event: '库存预警: 游戏币 < 2000枚', type: 'alert' as const },
            { time: '13:55', event: '收银区摄像头 重连成功', type: 'system' as const },
            { time: '13:42', event: '会员 王芳 兑换免费游戏券', type: 'reward' as const },
            { time: '13:30', event: '广告显示屏 播放列表更新', type: 'system' as const },
          ].map((log, i) => {
            const colors: Record<string, string> = { transaction: '#60a5fa', registration: '#34d399', system: '#94a3b8', alert: '#f87171', reward: '#fbbf24' };
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', borderRadius: 6, background: 'rgba(148,163,184,0.04)', fontSize: 12 }}>
                <span style={{ color: '#64748b', minWidth: 40, fontSize: 11 }}>{log.time}</span>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors[log.type] || '#94a3b8' }} />
                <span style={{ color: '#cbd5e1' }}>{log.event}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI分析面板 */}
      <div style={{ marginBottom: 24, padding: 18, borderRadius: 12, background: '#0f172a', border: '1px solid rgba(148,163,184,0.15)' }}>
        <div style={{ marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>🤖 AI 智能分析</h3>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>基于历史数据的自动化运营洞察</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
          <div style={{ padding: 12, borderRadius: 8, background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.1)' }}>
            <div style={{ color: '#93c5fd', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>📈 会员增长预测</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#60a5fa' }}>+23%</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>下月预计新增{Math.round(total * 0.23)}位高价值会员</div>
          </div>
          <div style={{ padding: 12, borderRadius: 8, background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.1)' }}>
            <div style={{ color: '#fca5a5', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>⚠️ 设备风险提醒</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#f87171' }}>{warningCount}台</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>设备存在异常，建议安排运维巡检</div>
          </div>
          <div style={{ padding: 12, borderRadius: 8, background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.1)' }}>
            <div style={{ color: '#86efac', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>💡 运营优化建议</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>客单价提升机会</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>钻石会员人均消费是铜卡4.2倍，重点维护</div>
          </div>
          <div style={{ padding: 12, borderRadius: 8, background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.1)' }}>
            <div style={{ color: '#fbbf24', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>⏰ 峰值时段预警</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fbbf24' }}>16-20点</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>当前时段设备调用率最高，建议增加备用设备</div>
          </div>
        </div>
      </div>

      {/* 设备类型分布 */}
      <div style={{ marginBottom: 24, padding: 16, borderRadius: 12, background: '#0f172a', border: '1px solid rgba(148,163,184,0.15)' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>📊 设备类型分布</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {(() => {
            const byType: Record<string, number> = {};
            MOCK_DEVICES.forEach(d => { byType[d.type] = (byType[d.type] || 0) + 1; });
            const colors: Record<string, string> = { pos: '#60a5fa', printer: '#34d399', scanner: '#fbbf24', camera: '#f87171', display: '#a78bfa', network: '#f472b6', sensor: '#06b6d4' };
            return Object.entries(byType).map(([type, count]) => (
              <div key={type} style={{ flex: 1, minWidth: 100, padding: 10, borderRadius: 8, background: 'rgba(148,163,184,0.06)', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: colors[type] || '#94a3b8' }}>{count}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{type === 'pos' ? '收银机' : type === 'printer' ? '打印机' : type === 'scanner' ? '扫描枪' : type === 'camera' ? '摄像头' : type === 'display' ? '显示屏' : type === 'network' ? '网络' : '传感器'}</div>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* 会员活跃度 */}
      <div style={{ marginBottom: 24, padding: 16, borderRadius: 12, background: '#0f172a', border: '1px solid rgba(148,163,184,0.15)' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>👥 会员活跃度</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
          {[
            { label: '月活跃会员', value: Math.round(total * 0.72), color: '#4ade80', sub: '占比72%' },
            { label: '周活跃会员', value: Math.round(total * 0.45), color: '#60a5fa', sub: '占比45%' },
            { label: '日活跃会员', value: Math.round(total * 0.18), color: '#fbbf24', sub: '占比18%' },
            { label: '沉睡会员', value: Math.round(total * 0.12), color: '#f87171', sub: '超过30天未到店' },
          ].map((item, i) => (
            <div key={i} style={{ padding: 12, borderRadius: 8, background: 'rgba(148,163,184,0.06)', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: item.color }}>{item.value.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{item.label}</div>
              <div style={{ fontSize: 10, color: '#475569' }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 设备运行趋势 */}
      <div style={{ marginBottom: 24, padding: 16, borderRadius: 12, background: '#0f172a', border: '1px solid rgba(148,163,184,0.15)' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>🕒 设备运行趋势（近7天）</h3>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 70, padding: '10px 0' }}>
          {[
            { day: '周一', active: 38, fault: 2 },
            { day: '周二', active: 35, fault: 1 },
            { day: '周三', active: 40, fault: 3 },
            { day: '周四', active: 37, fault: 0 },
            { day: '周五', active: 42, fault: 1 },
            { day: '周六', active: 45, fault: 4 },
            { day: '周日', active: 44, fault: 2 },
          ].map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
              <div style={{ width: '100%', display: 'flex', gap: 2, alignItems: 'flex-end', justifyContent: 'center' }}>
                <div style={{ width: 20, height: `${(d.active / 45) * 50}px`, borderRadius: '3px 3px 0 0', background: 'rgba(96,165,250,0.5)', transition: 'height 0.3s' }} />
                <div style={{ width: 20, height: `${(d.fault / 4) * 50}px`, borderRadius: '3px 3px 0 0', background: 'rgba(248,113,113,0.5)', transition: 'height 0.3s' }} />
              </div>
              <div style={{ fontSize: 9, color: '#64748b', marginTop: 4, textAlign: 'center' }}>{d.day}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#64748b' }}>
          <span><span style={{ color: 'rgba(96,165,250,0.7)' }}>■</span> 运行台数</span>
          <span><span style={{ color: 'rgba(248,113,113,0.7)' }}>■</span> 故障台数</span>
        </div>
      </div>

      {/* 销售时段分布 */}
      <div style={{ marginBottom: 24, padding: 16, borderRadius: 12, background: '#0f172a', border: '1px solid rgba(148,163,184,0.15)' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>⏱ 销售时段热点</h3>
        <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 80, padding: '10px 0' }}>
          {[
            { hour: '09', sales: 5 }, { hour: '10', sales: 15 }, { hour: '11', sales: 22 },
            { hour: '12', sales: 18 }, { hour: '13', sales: 12 }, { hour: '14', sales: 20 },
            { hour: '15', sales: 28 }, { hour: '16', sales: 25 }, { hour: '17', sales: 30 },
            { hour: '18', sales: 35 }, { hour: '19', sales: 42 }, { hour: '20', sales: 38 },
            { hour: '21', sales: 25 }, { hour: '22', sales: 15 },
          ].map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
              <div style={{ width: '100%', height: `${(d.sales / 42) * 65}px`, borderRadius: '3px 3px 0 0', background: d.sales >= 30 ? 'rgba(251,191,36,0.6)' : d.sales >= 20 ? 'rgba(96,165,250,0.5)' : 'rgba(148,163,184,0.3)', transition: 'height 0.3s' }} />
              <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>{d.hour}:00</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, color: '#64748b', textAlign: 'center' }}>
          🌟 高峰时段: 18:00-20:00（建议加派人手）
        </div>
      </div>

      {/* 会员消费力评级 */}
      <div style={{ marginBottom: 24, padding: 16, borderRadius: 12, background: '#0f172a', border: '1px solid rgba(148,163,184,0.15)' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>💳 会员消费力评级</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
          {[
            { label: '高价值', count: Math.round(total * 0.15), avgSpend: '¥320/次', color: '#fbbf24', desc: '月均≥3次消费' },
            { label: '中等价值', count: Math.round(total * 0.35), avgSpend: '¥180/次', color: '#60a5fa', desc: '月均1-2次消费' },
            { label: '低价值', count: Math.round(total * 0.30), avgSpend: '¥80/次', color: '#94a3b8', desc: '季度1次消费' },
            { label: '沉睡激活', count: Math.round(total * 0.20), avgSpend: '¥0/次', color: '#f87171', desc: '60天未到店' },
          ].map((t, i) => (
            <div key={i} style={{ padding: 12, borderRadius: 8, background: 'rgba(148,163,184,0.06)', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: t.color }}>{t.count.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{t.label}</div>
              <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{t.avgSpend} · {t.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 门店坪效对比 */}
      <div style={{ marginBottom: 24, padding: 16, borderRadius: 12, background: '#0f172a', border: '1px solid rgba(148,163,184,0.15)' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>🏪 门店坪效对比 (本月)</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['旗舰店', '社区店', '商场店', '街边店'].map((type, i) => {
            const colors = ['#a78bfa', '#60a5fa', '#34d399', '#fbbf24'];
            return (
              <div key={i} style={{ flex: '1 1 120px', padding: 12, borderRadius: 8, background: 'rgba(148,163,184,0.06)', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#64748b' }}>{type}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: colors[i] }}>¥{(Math.random() * 500 + 200).toFixed(0)}</div>
                <div style={{ fontSize: 10, color: '#475569' }}>元/㎡/月</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 设备维护告警 */}
      <div style={{ marginBottom: 24, padding: 16, borderRadius: 12, background: '#0f172a', border: '1px solid rgba(148,163,184,0.15)' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>🔧 需要维护的设备 (TOP 5)</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { name: 'POS机-03', type: '收银机', lastMaint: '60天前', daysLeft: 5, priority: '紧急', color: '#f87171' },
            { name: '游戏主机-A05', type: '游戏机', lastMaint: '45天前', daysLeft: 12, priority: '高', color: '#fbbf24' },
            { name: '空调-02', type: '空调', lastMaint: '90天前', daysLeft: 0, priority: '过期', color: '#f87171' },
            { name: '打印机-01', type: '打印机', lastMaint: '30天前', daysLeft: 15, priority: '中', color: '#60a5fa' },
            { name: '摄像头-08', type: '监控', lastMaint: '120天前', daysLeft: 7, priority: '高', color: '#fbbf24' },
          ].map((d, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 8, background: 'rgba(148,163,184,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{d.name}</span>
                <span style={{ fontSize: 11, color: '#64748b' }}>({d.type})</span>
              </div>
              <div style={{ fontSize: 11, color: '#64748b', display: 'flex', gap: 8 }}>
                <span>上次: {d.lastMaint}</span>
                <span>剩余: {d.daysLeft}天</span>
                <span style={{ color: d.color, fontWeight: 600 }}>{d.priority}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 时段客流统计 */}
      <div style={{ marginBottom: 24, padding: 16, borderRadius: 12, background: '#0f172a', border: '1px solid rgba(148,163,184,0.15)' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>👤 客流量统计</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
          {[
            { label: '本周总客流', value: '2,350', change: '+12%', color: '#34d399' },
            { label: '日均', value: '335', change: '+8%', color: '#60a5fa' },
            { label: '周末日均', value: '520', change: '+15%', color: '#fbbf24' },
            { label: '工作日均', value: '250', change: '+5%', color: '#a78bfa' },
            { label: '新客占比', value: '28%', change: '+3%', color: '#f472b6' },
          ].map((s, i) => (
            <div key={i} style={{ padding: 12, borderRadius: 8, background: 'rgba(148,163,184,0.06)', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#64748b' }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: s.change.startsWith('+') ? '#34d399' : '#f87171' }}>{s.change}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 设备使用率排行 */}
      <div style={{ marginBottom: 24, padding: 16, borderRadius: 12, background: '#0f172a', border: '1px solid rgba(148,163,184,0.15)' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>⚙️ 设备使用率排行</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {[
            { name: '跳舞机', icon: '🕺', usage: 85, idle: 10, repair: 5, color: '#06b6d4' },
            { name: '抓娃娃机', icon: '🧸', usage: 78, idle: 15, repair: 7, color: '#f59e0b' },
            { name: '模拟赛车', icon: '🏎️', usage: 72, idle: 18, repair: 10, color: '#22c55e' },
            { name: '音游机', icon: '🎵', usage: 68, idle: 22, repair: 10, color: '#a855f7' },
            { name: '射击游戏', icon: '🔫', usage: 65, idle: 20, repair: 15, color: '#ef4444' },
            { name: 'VR体验', icon: '🥽', usage: 60, idle: 25, repair: 15, color: '#3b82f6' },
            { name: '台球桌', icon: '🎱', usage: 55, idle: 30, repair: 15, color: '#f97316' },
          ].map(function(d, i) {
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', borderRadius: 6, background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.1)', fontSize: 12 }}>
                <span style={{ fontSize: 14, minWidth: 22 }}>{d.icon}</span>
                <span style={{ fontWeight: 600, color: '#e2e8f0', width: 80 }}>{d.name}</span>
                <div style={{ flex: 1, display: 'flex', gap: 2, height: 12, borderRadius: 4, overflow: 'hidden', background: '#1e293b' }}>
                  <div style={{ width: d.usage + '%', background: d.color, height: '100%' }} title="使用率" />
                  <div style={{ width: d.idle + '%', background: '#475569', height: '100%' }} title="空闲率" />
                  <div style={{ width: d.repair + '%', background: '#dc2626', height: '100%' }} title="维修率" />
                </div>
                <span style={{ fontSize: 10, color: '#06b6d4', minWidth: 32, textAlign: 'right' }}>{d.usage}%</span>
                <span style={{ fontSize: 10, color: '#94a3b8', minWidth: 32, textAlign: 'right' }}>{d.idle}%</span>
                <span style={{ fontSize: 10, color: '#f87171', minWidth: 32, textAlign: 'right' }}>{d.repair}%</span>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 16, justifyContent: 'center', fontSize: 10, color: '#94a3b8' }}>
          <span style={{ color: '#06b6d4' }}>■ 使用率</span>
          <span style={{ color: '#475569' }}>■ 空闲率</span>
          <span style={{ color: '#f87171' }}>■ 维修率</span>
        </div>
      </div>

      {/* 会员活跃时段分布 */}
      <div style={{ marginBottom: 24, padding: 16, borderRadius: 12, background: '#0f172a', border: '1px solid rgba(148,163,184,0.15)' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>⏰ 会员活跃时段分布</h3>
        <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 70, padding: '4px 0' }}>
          {[
            { hour: '6-9', pct: 8, color: '#c4b5fd' },
            { hour: '9-12', pct: 25, color: '#a78bfa' },
            { hour: '12-14', pct: 18, color: '#8b5cf6' },
            { hour: '14-17', pct: 22, color: '#7c3aed' },
            { hour: '17-19', pct: 15, color: '#6d28d9' },
            { hour: '19-22', pct: 35, color: '#5b21b6' },
            { hour: '22-6', pct: 5, color: '#4c1d95' },
          ].map(function(s, i) {
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '70%', height: (s.pct * 2) + 'px', borderRadius: '4px 4px 0 0', background: s.color, opacity: 0.8 }} />
                <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>{s.hour}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 门店效率TOP5 */}
      <div style={{ marginBottom: 24, padding: 16, borderRadius: 12, background: '#0f172a', border: '1px solid rgba(148,163,184,0.15)' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>🏪 门店效率 TOP5</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {[
            { store: '北京朝阳店', revenue: 12.5, visitors: 1850, satisfaction: 0.94 },
            { store: '上海浦东店', revenue: 11.8, visitors: 1720, satisfaction: 0.92 },
            { store: '广州天河店', revenue: 9.2, visitors: 1450, satisfaction: 0.90 },
            { store: '深圳南山店', revenue: 8.6, visitors: 1380, satisfaction: 0.89 },
            { store: '成都锦江店', revenue: 7.9, visitors: 1220, satisfaction: 0.88 },
          ].map(function(st, i) {
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', borderRadius: 6, background: '#1e293b', border: '1px solid rgba(148,163,184,0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#34d399', width: 18, textAlign: 'center' }}>#{i + 1}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{st.store}</span>
                </div>
                <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#94a3b8' }}>
                  <span>¥{st.revenue}w</span>
                  <span>{st.visitors}人</span>
                  <span>满意度 {Math.round(st.satisfaction * 100)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 会员来源渠道分布 */}
      <div style={{ marginBottom: 24, padding: 16, borderRadius: 12, background: '#0f172a', border: '1px solid rgba(148,163,184,0.15)' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>📱 会员来源渠道分布</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
          {[
            { channel: '扫码注册', pct: 38, count: 216, color: '#60a5fa', icon: '📱', trend: 'up' },
            { channel: '老客推荐', pct: 28, count: 160, color: '#34d399', icon: '🤝', trend: 'up' },
            { channel: '线上广告', pct: 18, count: 102, color: '#fbbf24', icon: '📢', trend: 'down' },
            { channel: '自然流量', pct: 12, count: 68, color: '#a78bfa', icon: '🚶', trend: 'stable' },
            { channel: '活动导入', pct: 4, count: 24, color: '#f472b6', icon: '🎪', trend: 'up' },
          ].map(function(src, i) {
            return (
              <div key={i} style={{ padding: 12, borderRadius: 8, background: 'rgba(148,163,184,0.06)', textAlign: 'center' }}>
                <div style={{ fontSize: 24 }}>{src.icon}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{src.channel}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: src.color, marginTop: 2 }}>{src.pct}%</div>
                <div style={{ fontSize: 10, color: '#475569' }}>{src.count}人</div>
                <div style={{ fontSize: 10, color: src.trend === 'up' ? '#34d399' : src.trend === 'down' ? '#f87171' : '#94a3b8', marginTop: 2 }}>
                  {src.trend === 'up' ? '↑ 增长' : src.trend === 'down' ? '↓ 下降' : '→ 持平'}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: 'rgba(148,163,184,0.06)', fontSize: 11, color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
          <span>📊 来源分布健康度: <span style={{ color: '#34d399', fontWeight: 600 }}>良好</span></span>
          <span>扫码+推荐占比 <span style={{ color: '#60a5fa', fontWeight: 600 }}>{38 + 28}%</span> · 自然增长动力充足</span>
        </div>
      </div>

      {/* 月度增长趋势对比 */}
      <div style={{ marginBottom: 24, padding: 16, borderRadius: 12, background: '#0f172a', border: '1px solid rgba(148,163,184,0.15)' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>📈 月度增长趋势对比 (新增 vs 流失)</h3>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 90, padding: '6px 0' }}>
          {[
            { month: '2月', add: 28, lost: 5 },
            { month: '3月', add: 35, lost: 8 },
            { month: '4月', add: 42, lost: 12 },
            { month: '5月', add: 38, lost: 15 },
            { month: '6月', add: 52, lost: 9 },
            { month: '7月', add: 48, lost: 11 },
          ].map(function(m, i) {
            const maxVal = 55;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end' }}>
                  <div style={{
                    width: 22, height: Math.max(3, (m.add / maxVal) * 70) + 'px',
                    borderRadius: '4px 4px 0 0', background: 'rgba(52,211,153,0.6)',
                    transition: 'height 0.3s', position: 'relative',
                  }}>
                    <span style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', fontSize: 9, color: '#34d399', fontWeight: 600, whiteSpace: 'nowrap' }}>+{m.add}</span>
                  </div>
                  <div style={{
                    width: 22, height: Math.max(3, (m.lost / maxVal) * 70) + 'px',
                    borderRadius: '4px 4px 0 0', background: 'rgba(248,113,113,0.5)',
                    transition: 'height 0.3s', position: 'relative',
                  }}>
                    <span style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', fontSize: 9, color: '#f87171', fontWeight: 600, whiteSpace: 'nowrap' }}>-{m.lost}</span>
                  </div>
                </div>
                <div style={{ fontSize: 9, color: '#64748b', marginTop: 14 }}>{m.month}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
          <span><span style={{ color: 'rgba(52,211,153,0.7)' }}>■</span> 新增会员</span>
          <span><span style={{ color: 'rgba(248,113,113,0.7)' }}>■</span> 流失会员</span>
          <span>净增长: <span style={{ color: '#34d399', fontWeight: 600 }}>+{28 + 35 + 42 + 38 + 52 + 48 - 5 - 8 - 12 - 15 - 9 - 11}</span></span>
        </div>
      </div>

      {/* 会员沉睡唤醒分析 */}
      <div style={{ marginBottom: 24, padding: 16, borderRadius: 12, background: '#0f172a', border: '1px solid rgba(148,163,184,0.15)' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>💤 会员沉睡唤醒分析</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { tier: '30天沉睡', days: '30-60天未到店', count: 68, pct: 22, color: '#fbbf24', desc: '轻度沉睡·唤醒容易' },
            { tier: '60天沉睡', days: '60-90天未到店', count: 45, pct: 14, color: '#f97316', desc: '中度沉睡·需优惠刺激' },
            { tier: '90天沉睡', days: '90天以上未到店', count: 32, pct: 10, color: '#ef4444', desc: '深度沉睡·高流失风险' },
          ].map(function(st, i) {
            return (
              <div key={i} style={{ flex: '1 1 140px', padding: 14, borderRadius: 8, background: 'rgba(148,163,184,0.06)', textAlign: 'center', border: '1px solid rgba(148,163,184,0.1)' }}>
                <div style={{ fontSize: 11, color: '#64748b' }}>{st.tier}</div>
                <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600 }}>{st.days}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: st.color, marginTop: 4 }}>{st.count}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>占总会员 {st.pct}%</div>
                <div style={{ marginTop: 6, height: 6, borderRadius: 3, background: 'rgba(148,163,184,0.15)', overflow: 'hidden' }}>
                  <div style={{ width: st.pct * 3 + '%', height: '100%', borderRadius: 3, background: st.color, opacity: 0.7 }} />
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>{st.desc}</div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(148,163,184,0.06)', fontSize: 11, color: '#94a3b8' }}>
          💡 <span style={{ color: '#fbbf24' }}>唤醒建议</span>: 30天沉睡发送提醒 → 60天沉睡发放优惠券 → 90天沉睡电话回访
          · 可唤醒会员 <span style={{ color: '#34d399', fontWeight: 600 }}>{68 + 45}人</span> (占比 {22 + 14}%)
          · 总沉睡会员 <span style={{ color: '#f87171', fontWeight: 600 }}>{68 + 45 + 32}人</span>
        </div>
      </div>

      {/* 会员生命周期阶段分析 */}
      <div style={{ marginBottom: 24, padding: 16, borderRadius: 12, background: '#0f172a', border: '1px solid rgba(148,163,184,0.15)' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>🔄 会员生命周期阶段分析</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { stage: '新客', count: 85, pct: 27, color: '#60a5fa', icon: '🆕', avgDays: '<7天', desc: '首次到店≤7天', action: '推送欢迎礼包+首充优惠' },
            { stage: '活跃', count: 128, pct: 41, color: '#34d399', icon: '🔥', avgDays: '7-30天', desc: '近30天有到店', action: '定期推送新游+积分翻倍' },
            { stage: '沉默', count: 58, pct: 18, color: '#fbbf24', icon: '💤', avgDays: '31-60天', desc: '31-60天未到店', action: '推送召回优惠+发短信提醒' },
            { stage: '流失', count: 44, pct: 14, color: '#f87171', icon: '🚪', avgDays: '>60天', desc: '>60天未到店', action: '电话回访+大额优惠券刺激' },
          ].map(function(s, i) {
            return (
              <div key={i} style={{ padding: 14, borderRadius: 8, background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.1)', textAlign: 'center' }}>
                <div style={{ fontSize: 26 }}>{s.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginTop: 4 }}>{s.stage}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: s.color, marginTop: 2 }}>{s.count}<span style={{ fontSize: 13, fontWeight: 400, color: '#64748b' }}>人</span></div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>占比 {s.pct}%</div>
                <div style={{ marginTop: 6, height: 8, borderRadius: 4, background: 'rgba(148,163,184,0.12)', overflow: 'hidden' }}>
                  <div style={{ width: s.pct * 2.5 + '%', height: '100%', borderRadius: 4, background: s.color, opacity: 0.7 }} />
                </div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 6 }}>{s.avgDays} · {s.desc}</div>
                <div style={{ marginTop: 6, padding: '4px 8px', borderRadius: 6, background: 'rgba(148,163,184,0.08)', fontSize: 10, color: '#94a3b8' }}>
                  💡 {s.action}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: 'rgba(148,163,184,0.06)', fontSize: 11, color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
          <span>总会员: {85 + 128 + 58 + 44}人</span>
          <span>活跃率: {Math.round(128 / (85 + 128 + 58 + 44) * 100)}%</span>
          <span>健康度: <span style={{ color: (128 / (85 + 128 + 58 + 44)) > 0.35 ? '#34d399' : '#fbbf24', fontWeight: 600 }}>{(128 / (85 + 128 + 58 + 44) * 100).toFixed(0)}%</span></span>
          <span>沉默+流失: <span style={{ color: '#f87171', fontWeight: 600 }}>{58 + 44}人 ({Math.round((58 + 44) / (85 + 128 + 58 + 44) * 100)}%)</span></span>
        </div>
      </div>

      {/* 门店收益排行榜 */}
      <div style={{ marginBottom: 24, padding: 16, borderRadius: 12, background: '#0f172a', border: '1px solid rgba(148,163,184,0.15)' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>🏪 门店收益排行榜</h3>
        <p style={{ margin: '0 0 12px', fontSize: 11, color: '#64748b' }}>各门店月收益与利润对比，按收益降序排列</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {function(stores, idx) {
            const maxRevenue = Math.max(...stores.map(s => s.revenue));
            return stores.map(function(s, i) {
              const barPct = (s.revenue / maxRevenue) * 100;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 6, background: '#1e293b', border: '1px solid rgba(148,163,184,0.15)' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: i < 3 ? '#fbbf24' : '#94a3b8', minWidth: 28, textAlign: 'center' }}>#{i + 1}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', minWidth: 90 }}>{s.store}</span>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ flex: 1, height: 14, borderRadius: 7, background: 'rgba(148,163,184,0.1)', overflow: 'hidden', position: 'relative' }}>
                      <div style={{
                        width: barPct + '%', height: '100%', borderRadius: 7,
                        background: `linear-gradient(90deg, rgba(96,165,250,0.7), ${i === 0 ? 'rgba(251,191,36,0.8)' : 'rgba(96,165,250,0.4)'})`,
                        transition: 'width 0.4s',
                      }} />
                    </div>
                    <span style={{ fontSize: 11, color: '#93c5fd', fontWeight: 600, minWidth: 45, textAlign: 'right' }}>¥{s.revenue}w</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#94a3b8' }}>
                    <span>利润 <span style={{ color: '#34d399', fontWeight: 600 }}>{s.profitPct}%</span></span>
                    <span>客流 {s.visitors}人</span>
                  </div>
                </div>
              );
            });
          }([
            { store: '北京朝阳店', revenue: 12.5, profitPct: 32, visitors: 1850 },
            { store: '上海浦东店', revenue: 11.8, profitPct: 30, visitors: 1720 },
            { store: '广州天河店', revenue: 9.2, profitPct: 28, visitors: 1450 },
            { store: '深圳南山店', revenue: 8.6, profitPct: 26, visitors: 1380 },
            { store: '成都锦江店', revenue: 7.9, profitPct: 25, visitors: 1220 },
          ], 0)}
        </div>
        <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: 'rgba(148,163,184,0.06)', fontSize: 11, color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
          <span>📊 总收益: <span style={{ color: '#fbbf24', fontWeight: 600 }}>¥{(12.5 + 11.8 + 9.2 + 8.6 + 7.9).toFixed(1)}w</span></span>
          <span>平均利润率: <span style={{ color: '#34d399', fontWeight: 600 }}>{Math.round((32 + 30 + 28 + 26 + 25) / 5)}%</span></span>
          <span>🏆 <span style={{ color: '#fbbf24' }}>北京朝阳店</span> 收益领先 {((12.5 - 7.9) / 7.9 * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* 会员忠诚度指数 */}
      <div style={{ marginBottom: 24, padding: 16, borderRadius: 12, background: '#0f172a', border: '1px solid rgba(148,163,184,0.15)' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>⭐ 会员忠诚度指数</h3>
        <p style={{ margin: '0 0 12px', fontSize: 11, color: '#64748b' }}>各等级会员忠诚度评分（复购率/推荐率/活跃度综合）</p>
        {function(members, i) {
          var maxVal = Math.max.apply(null, members.map(function(m) { return m.score; }));
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {members.map(function(m, idx) {
                var barPct = maxVal > 0 ? Math.round((m.score / maxVal) * 100) : 0;
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6, background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.1)', fontSize: 12 }}>
                    <span style={{ width: 64, fontWeight: 600, color: '#e2e8f0' }}>{m.name}</span>
                    <div style={{ flex: 1, height: 10, borderRadius: 5, background: 'rgba(148,163,184,0.12)', overflow: 'hidden' }}>
                      <div style={{ width: barPct + '%', height: '100%', borderRadius: 5, background: m.color, opacity: 0.8, transition: 'width 0.4s' }} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 14, color: m.color, minWidth: 32, textAlign: 'right' }}>{m.score}</span>
                    <span style={{ fontSize: 10, color: '#64748b', minWidth: 80, textAlign: 'right' }}>复购{m.repurchasePct}% 推荐{m.referralPct}% 活跃{m.activityPct}%</span>
                  </div>
                );
              })}
            </div>
          );
        }([
          { name: '钻石会员', score: 95, color: '#a78bfa', repurchasePct: 92, referralPct: 88, activityPct: 90 },
          { name: '黄金会员', score: 82, color: '#f59e0b', repurchasePct: 78, referralPct: 72, activityPct: 80 },
          { name: '银卡会员', score: 68, color: '#94a3b8', repurchasePct: 62, referralPct: 58, activityPct: 70 },
          { name: '铜卡会员', score: 52, color: '#a0522d', repurchasePct: 48, referralPct: 42, activityPct: 55 },
          { name: '普通会员', score: 35, color: '#6b7280', repurchasePct: 30, referralPct: 22, activityPct: 40 },
        ], 0)}
        <div style={{ marginTop: 8, padding: '6px 12px', borderRadius: 6, background: 'rgba(148,163,184,0.06)', fontSize: 11, color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
          <span>🏆 钻石会员忠诚度最高 (<span style={{ color: '#a78bfa', fontWeight: 600 }}>95分</span>)</span>
          <span>📊 整体忠诚度均值: {Math.round([95, 82, 68, 52, 35].reduce(function(a, b) { return a + b; }) / 5)}分</span>
          <span>💡 推荐提升铜卡/普通会员的复购激励</span>
        </div>
      </div>

      {/* 会员增长漏斗 */}
      <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: '#fffbeb', border: '1px solid #fde68a' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#92400e' }}>🔄 会员增长漏斗</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {function(s, i) {
            var colors = ['#3b82f6','#8b5cf6','#f59e0b','#ef4444','#6b7280'];
            var icons = ['👀','📝','🛒','🔄','📢'];
            var stages = ['访问','注册','消费','复购','推荐'];
            return s.map(function(e, idx) {
              var fill = e.rate / e.maxRate * 100;
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12 }}>{icons[idx]}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#374151', minWidth: 36 }}>{stages[idx]}</span>
                  <div style={{ flex: 1, height: 12, borderRadius: 6, background: '#fef3c7', overflow: 'hidden' }}>
                    <div style={{ width: fill + '%', height: '100%', borderRadius: 6, background: colors[idx] }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: colors[idx], minWidth: 72, textAlign: 'right' }}>{e.rate}% (N={e.count})</span>
                  <span style={{ fontSize: 10, color: '#9ca3af', minWidth: 40, textAlign: 'right' }}>↓{idx > 0 && s[idx - 1] ? Math.round((1 - e.rate / (s[idx - 1] as { rate: number }).rate) * 100) + '%' : '-'}</span>
                </div>
              );
            });
          }([
            { rate: 100, maxRate: 100, count: 5000 },
            { rate: 38, maxRate: 100, count: 1900 },
            { rate: 22, maxRate: 100, count: 1100 },
            { rate: 14, maxRate: 100, count: 700 },
            { rate: 6, maxRate: 100, count: 300 },
          ])}
        </div>
        <div style={{ marginTop: 8, padding: '6px 12px', borderRadius: 6, background: 'rgba(251,191,36,0.06)', fontSize: 11, color: '#6b7280', display: 'flex', justifyContent: 'space-between' }}>
          <span>👀 访问→注册: 38%</span>
          <span>📝 注册→消费: 57.9%</span>
          <span>🛒 消费→复购: 63.6%</span>
          <span>💡 注册转化需重点优化</span>
        </div>
      </div>

      {/* 门店会员转化率 */}
      <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#166534' }}>🏪 门店会员转化率</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {function(data, idx) { var colors = ['#22c55e','#16a34a','#ca8a04','#dc2626','#9333ea']; var max = Math.max.apply(null, data.map(function(d) { return d.rate; })); return data.map(function(d, i) { var barPct = d.rate / max * 100; return (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11, fontWeight: 600, color: '#374151', minWidth: 80 }}>{d.name}</span><div style={{ flex: 1, height: 14, borderRadius: 7, background: '#dcfce7', overflow: 'hidden' }}><div style={{ width: barPct + '%', height: '100%', borderRadius: 7, background: colors[i % colors.length], display: 'flex', alignItems: 'center', paddingLeft: 8 }}><span style={{ fontSize: 10, fontWeight: 600, color: '#fff' }}>{d.rate}%</span></div></div><span style={{ fontSize: 10, color: '#6b7280', minWidth: 24, textAlign: 'right' }}>{i === 0 ? '🏆' : (i === data.length - 1 ? '📉' : '')}</span></div>); }); }([{ name: '北京朝阳店', rate: 65 }, { name: '上海浦东店', rate: 72 }, { name: '广州天河店', rate: 58 }, { name: '深圳南山店', rate: 61 }, { name: '成都锦江店', rate: 55 }])}
        </div>
        <div style={{ marginTop: 8, padding: '6px 12px', borderRadius: 6, background: 'rgba(34,197,94,0.06)', fontSize: 11, color: '#6b7280', display: 'flex', justifyContent: 'space-between' }}>
          <span>🥇 上海浦东店转化率最高 (72%)</span>
          <span>📊 平均转化率: {Math.round([65,72,58,61,55].reduce(function(a,b){return a+b;})/5)}%</span>
          <span>💡 成都锦江店需重点优化注册引导</span>
        </div>
      </div>

      {/* 脚注 */}
      <div style={{ textAlign: 'center', fontSize: 11, color: '#475569', marginTop: 24 }}>
        数据洞察系统 · 数据更新于 {new Date().toLocaleString('zh-CN')} · 共 {MOCK_DEVICES.length} 台设备 · {total} 位会员
        <div style={{ marginTop: 6, fontSize: 10, color: '#475569' }}>💡 系统运行正常 · 建议关注高峰时段排班和会员沉睡率</div>
      </div>
    </div>
  );
}
