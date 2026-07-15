// @ts-nocheck
'use client'

/**
 * settings/security/page.tsx — 安全设置
 *
 * 系统安全策略与防护配置，包括密码策略、登录保护、IP白名单等
 * 模块: 密码策略 | 登录保护 | IP白名单 | 安全审计
 */

import React from 'react';

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
};

export default function SecurityPage() {
  return (
    <div style={styles.page}>
      <h1 style={styles.title}>🔒 安全设置</h1>
      <p style={styles.subtitle}>系统安全策略与防护配置。管理密码强度要求、登录保护机制、IP访问控制及安全审计日志。</p>

      {/* 密码策略 */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>🔑 密码策略</h2>
        <div style={styles.configList}>
          <div style={styles.configItem}><span style={styles.configKey}>最小密码长度</span><span style={styles.configValue}>8 位</span></div>
          <div style={styles.configItem}><span style={styles.configKey}>需包含大写字母</span><span style={styles.configValue}>是</span></div>
          <div style={styles.configItem}><span style={styles.configKey}>需包含小写字母</span><span style={styles.configValue}>是</span></div>
          <div style={styles.configItem}><span style={styles.configKey}>需包含数字</span><span style={styles.configValue}>是</span></div>
          <div style={styles.configItem}><span style={styles.configKey}>需包含特殊字符</span><span style={styles.configValue}>是</span></div>
          <div style={styles.configItem}><span style={styles.configKey}>密码有效期</span><span style={styles.configValue}>90 天</span></div>
          <div style={styles.configItem}><span style={styles.configKey}>禁止重复次数</span><span style={styles.configValue}>最近 5 次</span></div>
        </div>
      </div>

      {/* 登录保护 */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>🛡️ 登录保护</h2>
        <div style={styles.configList}>
          <div style={styles.configItem}><span style={styles.configKey}>最大登录尝试次数</span><span style={styles.configValue}>5 次</span></div>
          <div style={styles.configItem}><span style={styles.configKey}>锁定时间</span><span style={styles.configValue}>30 分钟</span></div>
          <div style={styles.configItem}><span style={styles.configKey}>二次验证</span><span style={styles.configValue}>支持短信/邮箱验证码</span></div>
        </div>
      </div>

      {/* 安全要求 */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>✅ 安全合规要求</h2>
        <ul style={styles.checklist}>
          <li style={styles.checkItem(true)}>✓ 启用密码策略强制验证</li>
          <li style={styles.checkItem(true)}>✓ 登录失败次数限制</li>
          <li style={styles.checkItem(true)}>✓ 账户锁定自动解除</li>
          <li style={styles.checkItem(false)}>○ IP 白名单（未配置）</li>
          <li style={styles.checkItem(true)}>✓ 操作审计日志记录</li>
        </ul>
      </div>
    </div>
  )
}
