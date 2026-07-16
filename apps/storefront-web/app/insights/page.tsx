'use client';

import React, { useMemo, useState } from 'react';

import React from 'react';

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

      {/* 脚注 */}
      <div style={{ textAlign: 'center', fontSize: 11, color: '#475569', marginTop: 24 }}>
        数据洞察系统 · 数据更新于 {new Date().toLocaleString('zh-CN')} · 共 {MOCK_DEVICES.length} 台设备 · {total} 位会员
      </div>
    </div>
  );
}
