// @ts-nocheck
'use client'

/**
 * settings/membership-levels/page.tsx — 会员等级设置
 *
 * 定义会员等级体系、升降级规则与权益配置
 * 模块: 等级定义 | 权益配置 | 升降级策略
 */

import React from 'react';

// ============================================================
// 等级预览数据
// ============================================================
interface LevelPreview {
  level: number;
  name: string;
  minPoints: number;
  discount: string;
  benefits: string;
}

const LEVELS: LevelPreview[] = [
  { level: 1, name: '普通会员', minPoints: 0, discount: '无折扣', benefits: '基础服务、生日礼券' },
  { level: 2, name: '银卡会员', minPoints: 1000, discount: '9.5折', benefits: '基础服务、生日礼券、折扣优惠' },
  { level: 3, name: '金卡会员', minPoints: 5000, discount: '9折', benefits: '折扣优惠、免运费、优先服务' },
  { level: 4, name: '钻石会员', minPoints: 20000, discount: '8.5折', benefits: '全部特权、专属客服、生日礼物' },
];

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
  configList: { display: 'flex', flexDirection: 'column' as const, gap: 8 },
  configItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' },
  configKey: { fontSize: 13, color: '#94a3b8' },
  configValue: { fontSize: 13, color: '#e2e8f0', fontWeight: 500 },
  ruleList: { padding: 0, margin: 0, listStyle: 'none' as const, display: 'flex', flexDirection: 'column' as const, gap: 8 },
  ruleItem: { fontSize: 13, color: '#cbd5e1', padding: '8px 12px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: 8, borderLeft: '3px solid #3b82f6' },
};

export default function MembershipLevelsPage() {
  return (
    <div style={styles.page}>
      <h1 style={styles.title}>🏅 会员等级设置</h1>
      <p style={styles.subtitle}>管理会员等级定义与权益配置。支持多级会员体系，自定义升级规则与各等级专属权益。</p>

      {/* 等级列表 */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📊 等级定义</h2>
        <p style={styles.sectionText}>当前系统配置的会员等级体系。等级越高，权益越丰富。</p>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>等级</th>
              <th style={styles.th}>名称</th>
              <th style={styles.th}>最低积分</th>
              <th style={styles.th}>折扣</th>
              <th style={styles.th}>权益</th>
            </tr>
          </thead>
          <tbody>
            {LEVELS.map(l => (
              <tr key={l.level}>
                <td style={styles.td}>Lv.{l.level}</td>
                <td style={{ ...styles.td, fontWeight: 600 }}>{l.name}</td>
                <td style={styles.td}>{l.minPoints.toLocaleString()}</td>
                <td style={styles.td}>{l.discount}</td>
                <td style={styles.td}>{l.benefits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 升降级规则 */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>🔄 升降级规则</h2>
        <ul style={styles.ruleList}>
          <li style={styles.ruleItem}>普通 → 银卡：积分达到 1,000 或累计消费 ¥5,000</li>
          <li style={styles.ruleItem}>银卡 → 金卡：积分达到 5,000 或累计消费 ¥20,000</li>
          <li style={styles.ruleItem}>金卡 → 钻石：积分达到 20,000 或累计消费 ¥100,000</li>
          <li style={styles.ruleItem}>降级保护：会员等级每 12 个月重新评估，未达标自动降级</li>
        </ul>
      </div>
    </div>
  )
}
