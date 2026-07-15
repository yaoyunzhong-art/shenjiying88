// @ts-nocheck
'use client'

/**
 * settings/notification-templates/page.tsx — 通知模板设置
 *
 * 管理各场景通知消息模板，支持变量占位符与多通道版本控制
 * 模块: 模板管理 | 变量替换 | 场景分类
 */

import React from 'react';

interface TemplatePreview {
  scene: string;
  channel: string;
  name: string;
  variables: string;
  version: number;
  isActive: boolean;
}

const TEMPLATES: TemplatePreview[] = [
  { scene: '订单确认', channel: '短信', name: '订单确认通知', variables: 'userName, orderId, deliveryDate', version: 2, isActive: true },
  { scene: '支付成功', channel: '邮件', name: '支付成功通知', variables: 'orderId, amount', version: 1, isActive: true },
  { scene: '验证码', channel: '短信', name: '验证码短信', variables: 'code, expireMinutes', version: 3, isActive: true },
  { scene: '发货通知', channel: '短信', name: '发货提醒', variables: 'orderId, trackingNo, company', version: 1, isActive: false },
  { scene: '系统告警', channel: '邮件', name: '系统异常告警', variables: 'alertName, severity, timestamp', version: 1, isActive: true },
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

export default function NotificationTemplatesPage() {
  return (
    <div style={styles.page}>
      <h1 style={styles.title}>📋 通知模板设置</h1>
      <p style={styles.subtitle}>管理各场景通知消息模板。支持模板变量占位符、多通道模板配置与版本管理。</p>

      {/* 模板列表 */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📄 通知模板列表</h2>
        <p style={styles.sectionText}>系统中已配置的通知模板，每个场景可按不同推送渠道独立配置。</p>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>场景</th>
              <th style={styles.th}>渠道</th>
              <th style={styles.th}>模板名称</th>
              <th style={styles.th}>变量</th>
              <th style={styles.th}>版本</th>
              <th style={styles.th}>状态</th>
            </tr>
          </thead>
          <tbody>
            {TEMPLATES.map(t => (
              <tr key={`${t.scene}-${t.channel}`}>
                <td style={{ ...styles.td, fontWeight: 600 }}>{t.scene}</td>
                <td style={styles.td}>{t.channel}</td>
                <td style={styles.td}>{t.name}</td>
                <td style={styles.td}>{t.variables}</td>
                <td style={styles.td}>v{t.version}</td>
                <td style={styles.td}><span style={styles.tag(t.isActive ? '#22c55e' : '#64748b')}>{t.isActive ? '启用' : '停用'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 变量规则 */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>🔤 变量使用规范</h2>
        <div style={styles.configList}>
          <div style={styles.configItem}><span style={styles.configKey}>变量格式</span><span style={styles.configValue}>{'{变量名}'} 大括号包裹</span></div>
          <div style={styles.configItem}><span style={styles.configKey}>变量命名</span><span style={styles.configValue}>camelCase，只含字母</span></div>
          <div style={styles.configItem}><span style={styles.configKey}>声明要求</span><span style={styles.configValue}>模板使用的变量必须在 variables 声明</span></div>
          <div style={styles.configItem}><span style={styles.configKey}>未闭合变量</span><span style={styles.configValue}>系统自动检测并告警</span></div>
          <div style={styles.configItem}><span style={styles.configKey}>默认值</span><span style={styles.configValue}>缺失变量保留原始 {占位符}</span></div>
        </div>
      </div>
    </div>
  )
}
