'use client';

import React from 'react';
import type { PermissionRolePreview } from './permissions-data';

// ─── 能力域定义 ──────────────────────────────

const CAPABILITY_DOMAINS = [
  { key: 'dashboard', label: '指挥台', icon: '🏠' },
  { key: 'stores', label: '门店运营', icon: '🏪' },
  { key: 'orders', label: '交易管理', icon: '📦' },
  { key: 'members', label: '会员管理', icon: '👥' },
  { key: 'products', label: '商品管理', icon: '🏷️' },
  { key: 'content', label: '内容营销', icon: '📢' },
  { key: 'finance', label: '财务供应链', icon: '💰' },
  { key: 'governance', label: '平台治理', icon: '⚖️' },
  { key: 'ai', label: 'AI 智能', icon: '🤖' },
  { key: 'system', label: '系统设置', icon: '⚙️' },
] as const;

// ─── 角色能力推断规则 ───────────────────────

type AccessLevel = 'full' | 'limited' | 'view' | 'none';

function inferCapabilityMatrix(roles: PermissionRolePreview[]): Record<string, Record<string, AccessLevel>> {
  const matrix: Record<string, Record<string, AccessLevel>> = {};

  for (const role of roles) {
    matrix[role.name] = {};
    for (const domain of CAPABILITY_DOMAINS) {
      if (role.isSystem && role.resourceCount >= 7) {
        // 系统管理员：全部 full
        matrix[role.name][domain.key] = 'full';
      } else if (role.resourceCount <= 2) {
        // 浏览者：全部 view
        matrix[role.name][domain.key] = 'view';
      } else if (role.resourceCount >= 5) {
        // 高级角色：核心域 full，边缘域 limited
        const coreDomains = ['orders', 'members', 'stores', 'products', 'dashboard'];
        matrix[role.name][domain.key] = coreDomains.includes(domain.key) ? 'full' : 'limited';
      } else {
        // 中级角色：核心域 limited，边缘域 view
        const coreDomains = ['orders', 'stores', 'dashboard'];
        matrix[role.name][domain.key] = coreDomains.includes(domain.key) ? 'limited' : 'view';
      }
    }
  }

  return matrix;
}

// ─── 样式常量 ─────────────────────────────

const accessStyle: Record<AccessLevel, React.CSSProperties> = {
  full: {
    background: 'rgba(34, 197, 94, 0.15)',
    color: '#4ade80',
    border: '1px solid rgba(34, 197, 94, 0.3)',
  },
  limited: {
    background: 'rgba(251, 191, 36, 0.12)',
    color: '#fbbf24',
    border: '1px solid rgba(251, 191, 36, 0.25)',
  },
  view: {
    background: 'rgba(148, 163, 184, 0.1)',
    color: '#94a3b8',
    border: '1px solid rgba(148, 163, 184, 0.2)',
  },
  none: {
    background: 'rgba(127, 29, 29, 0.08)',
    color: '#64748b',
    border: '1px solid rgba(148, 163, 184, 0.08)',
  },
};

const accessLabel: Record<AccessLevel, string> = {
  full: '完全',
  limited: '受限',
  view: '只读',
  none: '无',
};

// ─── 组件 ──────────────────────────────────

export default function RoleCapabilityMatrix({
  roles,
}: {
  roles: PermissionRolePreview[];
}) {
  const matrix = React.useMemo(() => inferCapabilityMatrix(roles), [roles]);

  if (roles.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>
        暂无角色数据，无法生成能力矩阵。
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
          🔐 角色-能力矩阵
        </span>
        <span style={{ fontSize: 12, color: '#64748b' }}>
          {roles.length} 个角色 × {CAPABILITY_DOMAINS.length} 个能力域
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={cornerStyle}>角色 \ 能力域</th>
              {roles.map((role) => (
                <th key={role.name} style={roleHeaderStyle}>
                  <div style={{ fontWeight: 600 }}>{role.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    {role.isSystem ? '系统' : '自定义'} · {role.resourceCount} 资源
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CAPABILITY_DOMAINS.map((domain) => (
              <tr key={domain.key}>
                <td style={domainCellStyle}>
                  <span style={{ marginRight: 6 }}>{domain.icon}</span>
                  {domain.label}
                </td>
                {roles.map((role) => {
                  const level = matrix[role.name]?.[domain.key] ?? 'none';
                  return (
                    <td key={`${role.name}-${domain.key}`} style={matrixCellStyle}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          minWidth: 48,
                          ...accessStyle[level],
                        }}
                      >
                        {accessLabel[level]}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 图例 */}
      <div style={legendStyle}>
        {(['full', 'limited', 'view', 'none'] as AccessLevel[]).map((level) => (
          <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                display: 'inline-block',
                width: 12,
                height: 12,
                borderRadius: 3,
                ...accessStyle[level],
              }}
            />
            <span style={{ fontSize: 12, color: '#475569' }}>{accessLabel[level]}权限</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 样式 ──────────────────────────────────

const containerStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid rgba(148, 163, 184, 0.24)',
  background: '#fff',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 18px 12px',
  borderBottom: '1px solid rgba(226, 232, 240, 0.9)',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

const cornerStyle: React.CSSProperties = {
  padding: '10px 14px',
  textAlign: 'left',
  fontSize: 12,
  fontWeight: 600,
  color: '#64748b',
  borderBottom: '1px solid rgba(226, 232, 240, 0.9)',
  borderRight: '1px solid rgba(226, 232, 240, 0.6)',
  minWidth: 100,
  background: 'rgba(248, 250, 252, 0.95)',
};

const roleHeaderStyle: React.CSSProperties = {
  padding: '8px 10px',
  textAlign: 'center',
  fontSize: 13,
  color: '#0f172a',
  borderBottom: '1px solid rgba(226, 232, 240, 0.9)',
  minWidth: 100,
  background: 'rgba(248, 250, 252, 0.95)',
};

const domainCellStyle: React.CSSProperties = {
  padding: '10px 14px',
  fontSize: 13,
  fontWeight: 600,
  color: '#334155',
  borderBottom: '1px solid rgba(241, 245, 249, 0.8)',
  borderRight: '1px solid rgba(226, 232, 240, 0.6)',
};

const matrixCellStyle: React.CSSProperties = {
  padding: '8px 6px',
  textAlign: 'center',
  borderBottom: '1px solid rgba(241, 245, 249, 0.8)',
};

const legendStyle: React.CSSProperties = {
  display: 'flex',
  gap: 20,
  padding: '12px 18px',
  borderTop: '1px solid rgba(226, 232, 240, 0.6)',
  background: 'rgba(248, 250, 252, 0.5)',
};
