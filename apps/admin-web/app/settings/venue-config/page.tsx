// @ts-nocheck
'use client'

/**
 * settings/venue-config/page.tsx — 场馆配置
 *
 * 管理场馆运营参数与设施配置
 * 模块: 场馆信息 | 营业时间 | 设施管理
 */

import React from 'react';

interface VenueFacility {
  name: string;
  count: number;
  status: string;
}

const FACILITIES: VenueFacility[] = [
  { name: '羽毛球场地', count: 8, status: '运营中' },
  { name: '篮球场地', count: 4, status: '运营中' },
  { name: '乒乓球台', count: 6, status: '运营中' },
  { name: '游泳馆', count: 1, status: '维护中' },
];

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 32, maxWidth: 960, margin: '0 auto' },
  title: { fontSize: 22, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 28 },
  section: { background: 'rgba(30, 41, 59, 0.8)', borderRadius: 12, border: '1px solid rgba(148, 163, 184, 0.1)', padding: 24, marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 },
  sectionText: { fontSize: 13, color: '#94a3b8', lineHeight: 1.6, marginBottom: 16 },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { textAlign: 'left' as const, padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#64748b', borderBottom: '1px solid rgba(148, 163, 184, 0.1)' },
  td: { padding: '10px 12px', fontSize: 13, color: '#cbd5e1', borderBottom: '1px solid rgba(148, 163, 184, 0.06)' },
  tag: (color: string) => ({ fontSize: 11, color, background: `${color}15`, padding: '2px 8px', borderRadius: 6, display: 'inline-block' }),
  configList: { display: 'flex', flexDirection: 'column' as const, gap: 4 },
  configItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(148, 163, 184, 0.06)' },
  configKey: { fontSize: 13, color: '#94a3b8' },
  configValue: { fontSize: 13, color: '#e2e8f0', fontWeight: 500 },
};

export default function VenueConfigPage() {
  return (
    <div style={styles.page}>
      <h1 style={styles.title}>🏟 场馆配置</h1>
      <p style={styles.subtitle}>管理场馆运营参数与设施配置。配置场馆基础信息、营业时间、设施数量与运营状态。</p>

      {/* 营业时间 */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>🕐 营业时间</h2>
        <div style={styles.configList}>
          <div style={styles.configItem}><span style={styles.configKey}>工作日</span><span style={styles.configValue}>09:00 — 22:00</span></div>
          <div style={styles.configItem}><span style={styles.configKey}>周末及节假日</span><span style={styles.configValue}>08:00 — 23:00</span></div>
          <div style={styles.configItem}><span style={styles.configKey}>预约提前时间</span><span style={styles.configValue}>提前 30 分钟</span></div>
          <div style={styles.configItem}><span style={styles.configKey}>最长预约时长</span><span style={styles.configValue}>4 小时</span></div>
          <div style={styles.configItem}><span style={styles.configKey}>取消预约时限</span><span style={styles.configValue}>提前 2 小时</span></div>
        </div>
      </div>

      {/* 设施列表 */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>🏟️ 设施列表</h2>
        <p style={styles.sectionText}>场馆内各运动设施的数量与当前运营状态。</p>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>设施名称</th>
              <th style={styles.th}>数量</th>
              <th style={styles.th}>状态</th>
            </tr>
          </thead>
          <tbody>
            {FACILITIES.map(f => (
              <tr key={f.name}>
                <td style={{ ...styles.td, fontWeight: 600 }}>{f.name}</td>
                <td style={styles.td}>{f.count}</td>
                <td style={styles.td}><span style={styles.tag(f.status === '运营中' ? '#22c55e' : '#eab308')}>● {f.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
