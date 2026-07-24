// @ts-nocheck
'use client'

/**
 * settings/promotion-rules/page.tsx — 促销规则设置
 *
 * 配置促销活动规则与触发条件，支持多种促销类型
 * 模块: 规则管理 | 优惠计算 | 时效管理
 * 三态: loading / empty / error
 */

import React, { useEffect, useState } from 'react';
import { AdminPermissionGate } from '../../components/admin-permission-gate';

interface RulePreview {
  name: string;
  type: string;
  status: string;
  period: string;
  condition: string;
}

const RULES: RulePreview[] = [
  { name: '618满200减50', type: '满减', status: 'active', period: '2026-06-18 ~ 2026-06-20', condition: '满200元减50元' },
  { name: '全场9折', type: '折扣', status: 'active', period: '2026-07-01 ~ 2026-07-31', condition: '全场商品9折，最高减50元' },
  { name: '满99包邮', type: '包邮', status: 'active', period: '2026-01-01 ~ 2026-12-31', condition: '订单满99元免运费' },
];

const PROMOTION_TYPES = [
  { icon: '💰', name: '满减', desc: '订单满额立减固定金额' },
  { icon: '📉', name: '折扣', desc: '按百分比打折，可设封顶' },
  { icon: '🎁', name: '赠品', desc: '满条件赠送指定商品' },
  { icon: '🚚', name: '包邮', desc: '满条件免运费' },
  { icon: '🛒', name: '加价购', desc: '加价换购指定商品' },
  { icon: '⚡', name: '秒杀', desc: '限时限量特价活动' },
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
  typeGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12 },
  typeCard: { padding: 16, background: 'rgba(15, 23, 42, 0.4)', borderRadius: 10, border: '1px solid rgba(148, 163, 184, 0.08)' },
  typeIcon: { fontSize: 20, marginBottom: 6 },
  typeName: { fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 },
  typeDesc: { fontSize: 12, color: '#64748b', lineHeight: 1.5 },
  empty: { textAlign: 'center' as const, padding: '48px 24px', color: '#94a3b8' },
  error: { textAlign: 'center' as const, padding: '48px 24px', color: '#ef4444' },
  loading: { textAlign: 'center' as const, padding: '80px 24px', color: '#94a3b8' },
};

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '促销规则访问受限',
  description:
    '促销规则页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看活动规则、类型说明与时效配置。',
} as const;

export default function PromotionRulesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    queueMicrotask(() => setLoading(false));
  }, []);

  if (loading) {
    return <AdminPermissionGate {...permissionGate}><div style={{ ...styles.page, ...styles.loading }}><div style={{ fontSize: 14 }}>加载中...</div></div></AdminPermissionGate>;
  }

  if (error) {
    return <AdminPermissionGate {...permissionGate}><div style={{ ...styles.page, ...styles.error }}><div style={{ fontSize: 14 }}>错误: {error}</div></div></AdminPermissionGate>;
  }

  if (RULES.length === 0) {
    return (
      <AdminPermissionGate {...permissionGate}>
        <div style={styles.page}>
          <h1 style={styles.title}>🎁 促销规则设置</h1>
          <p style={styles.subtitle}>配置促销活动规则与触发条件。</p>
          <div style={styles.empty}><div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#e2e8f0' }}>暂无数据</div></div>
        </div>
      </AdminPermissionGate>
    );
  }

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={styles.page}>
        <h1 style={styles.title}>🎁 促销规则设置</h1>
        <p style={styles.subtitle}>配置促销活动规则与触发条件。支持满减、折扣、赠品、包邮、加价购、秒杀六种促销类型，灵活设置优先级与时效。</p>

        {/* 活动规则列表 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📋 当前活动规则</h2>
          <p style={styles.sectionText}>系统中正在运行或已配置的促销规则。</p>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>规则名称</th>
                <th style={styles.th}>类型</th>
                <th style={styles.th}>状态</th>
                <th style={styles.th}>有效期</th>
                <th style={styles.th}>条件</th>
              </tr>
            </thead>
            <tbody>
              {RULES.map(r => (
                <tr key={r.name}>
                  <td style={{ ...styles.td, fontWeight: 600 }}>{r.name}</td>
                  <td style={styles.td}>{r.type}</td>
                  <td style={styles.td}><span style={styles.tag('#22c55e')}>● 进行中</span></td>
                  <td style={styles.td}>{r.period}</td>
                  <td style={styles.td}>{r.condition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 促销类型说明 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🏷️ 促销类型说明</h2>
          <div style={styles.typeGrid}>
            {PROMOTION_TYPES.map(pt => (
              <div key={pt.name} style={styles.typeCard}>
                <div style={styles.typeIcon}>{pt.icon}</div>
                <div style={styles.typeName}>{pt.name}</div>
                <div style={styles.typeDesc}>{pt.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminPermissionGate>
  )
}
