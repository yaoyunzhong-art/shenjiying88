// @ts-nocheck
'use client'

/**
 * settings/tax-rates/page.tsx — 税率配置
 *
 * 管理各品类税率与税务参数
 * 模块: 品类税率 | 税务规则 | 计算配置
 */

import React from 'react';

interface TaxRatePreview {
  category: string;
  taxRate: string;
  taxType: string;
  effectiveDate: string;
}

const TAX_RATES: TaxRatePreview[] = [
  { category: '食品饮料', taxRate: '13%', taxType: '增值税', effectiveDate: '2026-01-01' },
  { category: '日用品', taxRate: '13%', taxType: '增值税', effectiveDate: '2026-01-01' },
  { category: '电子产品', taxRate: '13%', taxType: '增值税', effectiveDate: '2026-01-01' },
  { category: '服务费', taxRate: '6%', taxType: '增值税', effectiveDate: '2026-01-01' },
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
  configList: { display: 'flex', flexDirection: 'column' as const, gap: 4 },
  configItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(148, 163, 184, 0.06)' },
  configKey: { fontSize: 13, color: '#94a3b8' },
  configValue: { fontSize: 13, color: '#e2e8f0', fontWeight: 500 },
  infoBox: { padding: 16, background: 'rgba(59, 130, 246, 0.06)', borderRadius: 10, border: '1px solid rgba(59, 130, 246, 0.15)', marginTop: 16 },
  infoText: { fontSize: 13, color: '#93c5fd', lineHeight: 1.6 },
};

export default function TaxRatesPage() {
  return (
    <div style={styles.page}>
      <h1 style={styles.title}>🧾 税率配置</h1>
      <p style={styles.subtitle}>管理各品类税率与税务参数。按商品品类配置增值税率及生效日期，支持税种管理与税务计算规则。</p>

      {/* 品类税率表 */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📊 品类税率表</h2>
        <p style={styles.sectionText}>各商品品类的现行税率标准。税率变更需要提前配置生效日期。</p>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>品类</th>
              <th style={styles.th}>税率</th>
              <th style={styles.th}>税种</th>
              <th style={styles.th}>生效日期</th>
            </tr>
          </thead>
          <tbody>
            {TAX_RATES.map(r => (
              <tr key={r.category}>
                <td style={{ ...styles.td, fontWeight: 600 }}>{r.category}</td>
                <td style={styles.td}>{r.taxRate}</td>
                <td style={styles.td}>{r.taxType}</td>
                <td style={styles.td}>{r.effectiveDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 税务规则 */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>⚖️ 税务规则</h2>
        <div style={styles.configList}>
          <div style={styles.configItem}><span style={styles.configKey}>计税方式</span><span style={styles.configValue}>价外税（不含税金额 × 税率）</span></div>
          <div style={styles.configItem}><span style={styles.configKey}>舍入方式</span><span style={styles.configValue}>四舍五入到分</span></div>
          <div style={styles.configItem}><span style={styles.configKey}>含税显示</span><span style={styles.configValue}>前台展示含税价格</span></div>
          <div style={styles.configItem}><span style={styles.configKey}>发票类型</span><span style={styles.configValue}>普通发票 / 增值税专用发票</span></div>
        </div>

        <div style={styles.infoBox}>
          <div style={styles.infoText}>
            💡 温馨提示：税率变更需提前7天配置生效日期，系统将在指定日期自动切换税率。切换前创建的历史订单使用原税率。
          </div>
        </div>
      </div>
    </div>
  )
}
