// @ts-nocheck
'use client'

/**
 * settings/security/page.tsx — 安全设置
 *
 * 系统安全策略与防护配置，包括密码策略、登录保护、IP白名单等
 * 模块: 密码策略 | 登录保护 | 安全审计
 * 三态: loading / empty / error
 */

import React, { useEffect, useState } from 'react';
import { AdminPermissionGate } from '../../components/admin-permission-gate';

const PASSWORD_POLICIES = [
  { key: '最小密码长度', value: '8 位' },
  { key: '需包含大写字母', value: '是' },
  { key: '需包含小写字母', value: '是' },
  { key: '需包含数字', value: '是' },
  { key: '需包含特殊字符', value: '是' },
  { key: '密码有效期', value: '90 天' },
  { key: '禁止重复次数', value: '最近 5 次' },
];

const LOGIN_PROTECTION = [
  { key: '最大登录尝试次数', value: '5 次' },
  { key: '锁定时间', value: '30 分钟' },
  { key: '二次验证', value: '支持短信/邮箱验证码' },
];

const COMPLIANCE_ITEMS = [
  { label: '启用密码策略强制验证', enabled: true },
  { label: '登录失败次数限制', enabled: true },
  { label: '账户锁定自动解除', enabled: true },
  { label: 'IP 白名单（未配置）', enabled: false },
  { label: '操作审计日志记录', enabled: true },
];

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 32, maxWidth: 960, margin: '0 auto' },
  title: { fontSize: 22, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 28 },
  section: { background: 'rgba(30, 41, 59, 0.8)', borderRadius: 12, border: '1px solid rgba(148, 163, 184, 0.1)', padding: 24, marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 },
  sectionText: { fontSize: 13, color: '#94a3b8', lineHeight: 1.6, marginBottom: 16 },
  configList: { display: 'flex', flexDirection: 'column' as const, gap: 4 },
  configItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(148, 163, 184, 0.06)' },
  configKey: { fontSize: 13, color: '#94a3b8' },
  configValue: { fontSize: 13, color: '#e2e8f0', fontWeight: 500 },
  checklist: { padding: 0, margin: 0, listStyle: 'none' as const, display: 'flex', flexDirection: 'column' as const, gap: 6 },
  checkItem: (enabled: boolean) => ({ fontSize: 13, color: enabled ? '#22c55e' : '#94a3b8', padding: '6px 0', display: 'flex', alignItems: 'center', gap: 8 }),
  empty: { textAlign: 'center' as const, padding: '48px 24px', color: '#94a3b8' },
  error: { textAlign: 'center' as const, padding: '48px 24px', color: '#ef4444' },
  loading: { textAlign: 'center' as const, padding: '80px 24px', color: '#94a3b8' },
};

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '安全设置访问受限',
  description:
    '安全设置页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看密码策略、登录保护、IP 白名单与审计配置。',
} as const;

export default function SecurityPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    queueMicrotask(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AdminPermissionGate {...permissionGate}>
        <div style={{ ...styles.page, ...styles.loading }}><div style={{ fontSize: 14 }}>加载中...</div></div>
      </AdminPermissionGate>
    );
  }

  if (error) {
    return (
      <AdminPermissionGate {...permissionGate}>
        <div style={{ ...styles.page, ...styles.error }}><div style={{ fontSize: 14 }}>错误: {error}</div></div>
      </AdminPermissionGate>
    );
  }

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={styles.page}>
        <h1 style={styles.title}>🔒 安全设置</h1>
        <p style={styles.subtitle}>系统安全策略与防护配置。管理密码强度要求、登录保护机制、IP访问控制及安全审计日志。</p>

        {/* 密码策略 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🔑 密码策略</h2>
          <div style={styles.configList}>
            {PASSWORD_POLICIES.length === 0 ? (
              <div style={styles.empty}><div style={{ fontSize: 14 }}>暂无数据</div></div>
            ) : (
              PASSWORD_POLICIES.map(item => (
                <div key={item.key} style={styles.configItem}><span style={styles.configKey}>{item.key}</span><span style={styles.configValue}>{item.value}</span></div>
              ))
            )}
          </div>
        </div>

        {/* 登录保护 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🛡️ 登录保护</h2>
          <div style={styles.configList}>
            {LOGIN_PROTECTION.map(item => (
              <div key={item.key} style={styles.configItem}><span style={styles.configKey}>{item.key}</span><span style={styles.configValue}>{item.value}</span></div>
            ))}
          </div>
        </div>

        {/* 安全要求 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>✅ 安全合规要求</h2>
          <ul style={styles.checklist}>
            {COMPLIANCE_ITEMS.map(item => (
              <li key={item.label} style={styles.checkItem(item.enabled)}>
                {item.enabled ? '✓' : '○'} {item.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AdminPermissionGate>
  )
}
