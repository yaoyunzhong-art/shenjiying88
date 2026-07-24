// @ts-nocheck
'use client'

/**
 * settings/permissions/page.tsx — 权限管理
 *
 * 管理用户角色与权限分配，支持角色继承与资源级授权
 * 模块: 角色定义 | 权限矩阵 | 角色继承
 * 三态: loading / empty / error
 */

import React, { useEffect, useState } from 'react';
import { AdminPermissionGate } from '../../components/admin-permission-gate';

interface RolePreview {
  name: string;
  description: string;
  isSystem: boolean;
  resourceCount: number;
}

const ROLES: RolePreview[] = [
  { name: '系统管理员', description: '全部权限，系统内置角色', isSystem: true, resourceCount: 7 },
  { name: '运营经理', description: '订单、报表、用户管理权限', isSystem: false, resourceCount: 3 },
  { name: '运营专员', description: '订单查看与处理权限', isSystem: false, resourceCount: 1 },
  { name: '浏览者', description: '只读查看权限', isSystem: false, resourceCount: 2 },
];

const INHERITANCE_RULES = [
  '子角色自动继承父角色的全部权限',
  '权限向下传递，上级角色的新增权限自动同步至下级',
  '系统管理员不受权限继承限制，拥有全部资源访问权限',
  '系统自动检测循环继承链并阻止配置',
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
  ruleList: { padding: 0, margin: 0, listStyle: 'none' as const, display: 'flex', flexDirection: 'column' as const, gap: 8 },
  ruleItem: { fontSize: 13, color: '#cbd5e1', padding: '8px 12px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: 8, borderLeft: '3px solid #3b82f6' },
  empty: { textAlign: 'center' as const, padding: '48px 24px', color: '#94a3b8' },
  error: { textAlign: 'center' as const, padding: '48px 24px', color: '#ef4444' },
  loading: { textAlign: 'center' as const, padding: '80px 24px', color: '#94a3b8' },
};

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '权限管理访问受限',
  description:
    '权限管理页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看角色定义、资源权限数与继承规则。',
} as const;

export default function PermissionsPage() {
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

  if (ROLES.length === 0) {
    return (
      <AdminPermissionGate {...permissionGate}>
        <div style={styles.page}>
          <h1 style={styles.title}>🔑 权限管理</h1>
          <p style={styles.subtitle}>管理用户角色与权限分配。</p>
          <div style={styles.empty}><div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#e2e8f0' }}>暂无数据</div></div>
        </div>
      </AdminPermissionGate>
    );
  }

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={styles.page}>
        <h1 style={styles.title}>🔑 权限管理</h1>
        <p style={styles.subtitle}>管理用户角色与权限分配。基于角色的访问控制（RBAC），支持角色继承、资源级权限配置与循环依赖检测。</p>

        {/* 角色列表 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>👥 角色定义</h2>
          <p style={styles.sectionText}>当前系统内置及自定义角色。系统角色拥有全部权限，不可删除。</p>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>角色名称</th>
                <th style={styles.th}>描述</th>
                <th style={styles.th}>类型</th>
                <th style={styles.th}>资源权限数</th>
              </tr>
            </thead>
            <tbody>
              {ROLES.map(r => (
                <tr key={r.name}>
                  <td style={{ ...styles.td, fontWeight: 600 }}>{r.name}</td>
                  <td style={styles.td}>{r.description}</td>
                  <td style={styles.td}><span style={styles.tag(r.isSystem ? '#3b82f6' : '#94a3b8')}>{r.isSystem ? '系统' : '自定义'}</span></td>
                  <td style={styles.td}>{r.resourceCount} / 7</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 权限继承规则 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🔗 权限继承规则</h2>
          <ul style={styles.ruleList}>
            {INHERITANCE_RULES.map((rule, i) => (
              <li key={i} style={styles.ruleItem}>{rule}</li>
            ))}
          </ul>
        </div>
      </div>
    </AdminPermissionGate>
  )
}
