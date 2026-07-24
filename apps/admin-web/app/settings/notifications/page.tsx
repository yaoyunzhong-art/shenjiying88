// @ts-nocheck
'use client'

/**
 * settings/notifications/page.tsx — 通知设置
 *
 * 配置通知规则与推送渠道，包括频率限制与静默时段
 * 模块: 通知规则 | 渠道管理 | 频率控制
 */

import React, { useState, useEffect } from 'react';
import { AdminPermissionGate } from '../../components/admin-permission-gate';

interface NotifRulePreview {
  category: string;
  channels: string;
  maxPerHour: number;
  quietPeriod: string;
  enabled: boolean;
}

const RULES: NotifRulePreview[] = [
  { category: '订单通知', channels: 'Push, App内', maxPerHour: 10, quietPeriod: '22:00-08:00', enabled: true },
  { category: '支付通知', channels: '短信, 邮件, Push', maxPerHour: 5, quietPeriod: '22:00-08:00', enabled: true },
  { category: '促销推送', channels: '邮件', maxPerHour: 1, quietPeriod: '22:00-08:00', enabled: true },
  { category: '系统告警', channels: '短信, 邮件, App内', maxPerHour: 100, quietPeriod: '无', enabled: true },
  { category: '安全通知', channels: '短信, 邮件, App内', maxPerHour: 5, quietPeriod: '无', enabled: true },
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
  channelGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 12 },
  channelCard: { padding: 16, background: 'rgba(15, 23, 42, 0.4)', borderRadius: 10, border: '1px solid rgba(148, 163, 184, 0.08)' },
  channelIcon: { fontSize: 20, marginBottom: 6 },
  channelName: { fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 },
  channelDesc: { fontSize: 12, color: '#64748b' },
};

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '通知设置访问受限',
  description:
    '通知设置页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看通知规则、静默时段与推送渠道配置。',
} as const;

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<NotifRulePreview[] | null>(null);

  useEffect(() => {
    try {
      setData(RULES);
    } catch (e) {
      setError(e instanceof Error ? e.message : '数据加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) return <AdminPermissionGate {...permissionGate}><div style={styles.page}><div style={{ color: '#94a3b8', textAlign: 'center', padding: 64 }}>加载中...</div></div></AdminPermissionGate>;
  if (error) return <AdminPermissionGate {...permissionGate}><div style={styles.page}><div style={{ color: '#ef4444', textAlign: 'center', padding: 64 }}>数据获取失败: {error}</div></div></AdminPermissionGate>;
  if (!data || data.length === 0) return <AdminPermissionGate {...permissionGate}><div style={styles.page}><div style={{ color: '#94a3b8', textAlign: 'center', padding: 64 }}>暂无数据</div></div></AdminPermissionGate>;

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={styles.page}>
        <h1 style={styles.title}>🔔 通知设置</h1>
        <p style={styles.subtitle}>配置通知规则与推送渠道。按业务类别设置通知频率上限、静默时段与推送渠道，支持多通道并行推送。</p>

        {/* 通知规则 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📋 通知规则</h2>
          <p style={styles.sectionText}>各类业务通知的发送规则配置。安全类通知不受静默时段限制。</p>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>类别</th>
                <th style={styles.th}>推送渠道</th>
                <th style={styles.th}>频率上限</th>
                <th style={styles.th}>静默时段</th>
                <th style={styles.th}>状态</th>
              </tr>
            </thead>
            <tbody>
              {RULES.map(r => (
                <tr key={r.category}>
                  <td style={{ ...styles.td, fontWeight: 600 }}>{r.category}</td>
                  <td style={styles.td}>{r.channels}</td>
                  <td style={styles.td}>{r.maxPerHour}次/小时</td>
                  <td style={styles.td}>{r.quietPeriod}</td>
                  <td style={styles.td}><span style={styles.tag(r.enabled ? '#22c55e' : '#ef4444')}>● {r.enabled ? '启用' : '停用'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 推送渠道 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📡 推送渠道</h2>
          <p style={styles.sectionText}>系统支持以下通知推送渠道，每个通知规则可自定义渠道组合。</p>
          <div style={styles.channelGrid}>
            <div style={styles.channelCard}><div style={styles.channelIcon}>📱</div><div style={styles.channelName}>Push 推送</div><div style={styles.channelDesc}>App 消息推送</div></div>
            <div style={styles.channelCard}><div style={styles.channelIcon}>💬</div><div style={styles.channelName}>短信</div><div style={styles.channelDesc}>短信平台发送</div></div>
            <div style={styles.channelCard}><div style={styles.channelIcon}>📧</div><div style={styles.channelName}>邮件</div><div style={styles.channelDesc}>SMTP 邮件服务</div></div>
            <div style={styles.channelCard}><div style={styles.channelIcon}>📋</div><div style={styles.channelName}>App内</div><div style={styles.channelDesc}>应用内消息中心</div></div>
          </div>
        </div>
      </div>
    </AdminPermissionGate>
  )
}
