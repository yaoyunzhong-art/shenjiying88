// @ts-nocheck
'use client'

/**
 * settings/payment-config/page.tsx — 支付配置
 *
 * 管理支付通道与结算参数，支持多种支付方式接入与费率配置
 * 模块: 通道管理 | 费率配置 | 结算周期
 */

import React from 'react';

// ============================================================
// 配置预览数据
// ============================================================
interface PaymentChannelPreview {
  name: string;
  provider: string;
  status: string;
  feeRate: string;
}

const ACTIVE_CHANNELS: PaymentChannelPreview[] = [
  { name: '微信支付', provider: 'wechat', status: '正常运行', feeRate: '0.6% + 0.30元' },
  { name: '支付宝', provider: 'alipay', status: '正常运行', feeRate: '0.6% + 0.30元' },
  { name: '现金', provider: 'cash', status: '正常运行', feeRate: '免费' },
];

// ============================================================
// 样式
// ============================================================
const styles: Record<string, React.CSSProperties> = {
  page: { padding: 32, maxWidth: 960, margin: '0 auto' },
  title: { fontSize: 22, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 28 },
  section: { background: 'rgba(30, 41, 59, 0.8)', borderRadius: 12, border: '1px solid rgba(148, 163, 184, 0.1)', padding: 24, marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 8 },
  sectionText: { fontSize: 13, color: '#94a3b8', lineHeight: 1.6, marginBottom: 16 },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { textAlign: 'left' as const, padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#64748b', borderBottom: '1px solid rgba(148, 163, 184, 0.1)' },
  td: { padding: '10px 12px', fontSize: 13, color: '#cbd5e1', borderBottom: '1px solid rgba(148, 163, 184, 0.06)' },
  tag: (color: string) => ({ fontSize: 11, color, background: `${color}15`, padding: '2px 8px', borderRadius: 6, display: 'inline-block' }),
  configList: { display: 'flex', flexDirection: 'column' as const, gap: 12 },
  configItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(148, 163, 184, 0.06)' },
  configKey: { fontSize: 13, color: '#94a3b8' },
  configValue: { fontSize: 13, color: '#e2e8f0', fontWeight: 500 },
};

export default function PaymentConfigPage() {
  return (
    <div style={styles.page}>
      <h1 style={styles.title}>💳 支付配置</h1>
      <p style={styles.subtitle}>管理支付通道与结算参数。支持微信支付、支付宝、银联、现金等多种支付方式，灵活配置各通道费率与结算规则。</p>

      {/* 概览 */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📊 通道概览</h2>
        <p style={styles.sectionText}>当前系统已配置的支付通道及运行状态。</p>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>通道名称</th>
              <th style={styles.th}>标识</th>
              <th style={styles.th}>状态</th>
              <th style={styles.th}>费率</th>
            </tr>
          </thead>
          <tbody>
            {ACTIVE_CHANNELS.map(ch => (
              <tr key={ch.provider}>
                <td style={styles.td}>{ch.name}</td>
                <td style={styles.td}>{ch.provider}</td>
                <td style={styles.td}><span style={styles.tag('#22c55e')}>● {ch.status}</span></td>
                <td style={styles.td}>{ch.feeRate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 结算配置 */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📅 结算配置</h2>
        <div style={styles.configList}>
          <div style={styles.configItem}>
            <span style={styles.configKey}>默认结算周期</span>
            <span style={styles.configValue}>T+1（次日到账）</span>
          </div>
          <div style={styles.configItem}>
            <span style={styles.configKey}>结算延迟天数</span>
            <span style={styles.configValue}>0 ~ 3 天（按通道）</span>
          </div>
          <div style={styles.configItem}>
            <span style={styles.configKey}>最大单笔金额</span>
            <span style={styles.configValue}>¥500,000</span>
          </div>
          <div style={styles.configItem}>
            <span style={styles.configKey}>支持币种</span>
            <span style={styles.configValue}>CNY, USD, EUR</span>
          </div>
        </div>
      </div>
    </div>
  )
}
