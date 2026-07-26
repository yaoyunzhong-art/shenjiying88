"use client"

import type * as React from 'react'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { PermissionRolePreview, PermissionsSnapshotDelivery } from './permissions-data'

export default function PermissionsClient({
  snapshot,
}: {
  snapshot: PermissionsSnapshotDelivery
}) {
  const router = useRouter()
  const [roles, setRoles] = useState<PermissionRolePreview[]>(snapshot.roles)
  const [isRefreshing, startRefresh] = useTransition()

  useEffect(() => {
    setRoles(snapshot.roles)
  }, [snapshot.roles])

  const summary = useMemo(
    () => ({
      systemRoles: roles.filter((item) => item.isSystem).length,
      customRoles: roles.filter((item) => !item.isSystem).length,
      governedResources: Math.max(...roles.map((item) => item.resourceCount)),
    }),
    [roles],
  )

  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <div>
          <h1 style={titleStyle}>权限管理</h1>
          <p style={subtitleStyle}>
            服务端首屏快照承载角色定义、继承规则和治理备注，客户端只负责展示与刷新。
          </p>
          <div style={metaStyle}>
            Delivery {snapshot.deliveryMode} · source {snapshot.sourceLabel} · generatedAt{' '}
            {snapshot.generatedAt}
          </div>
        </div>
        <button
          type="button"
          onClick={() => startRefresh(() => router.refresh())}
          disabled={isRefreshing}
          style={refreshButtonStyle}
        >
          {isRefreshing ? '刷新中...' : '刷新快照'}
        </button>
      </section>

      {snapshot.error ? <section style={warningStyle}>{snapshot.error}</section> : null}

      <section style={statGridStyle}>
        <StatCard label="系统角色" value={String(summary.systemRoles)} detail="高危写权限需审计留痕" />
        <StatCard label="自定义角色" value={String(summary.customRoles)} detail="按租户边界收口" />
        <StatCard
          label="治理资源上限"
          value={String(summary.governedResources)}
          detail="当前样本中可配置资源数"
        />
      </section>

      <section style={panelStyle}>
        <div style={sectionTitleStyle}>角色定义</div>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>角色名称</th>
              <th style={thStyle}>描述</th>
              <th style={thStyle}>类型</th>
              <th style={thStyle}>资源权限数</th>
              <th style={thStyle}>责任域</th>
              <th style={thStyle}>更新时间</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.name}>
                <td style={tdStrongStyle}>{role.name}</td>
                <td style={tdStyle}>{role.description}</td>
                <td style={tdStyle}>
                  <span style={role.isSystem ? systemBadgeStyle : customBadgeStyle}>
                    {role.isSystem ? '系统' : '自定义'}
                  </span>
                </td>
                <td style={tdStyle}>{role.resourceCount}</td>
                <td style={tdStyle}>{role.owners.join(' · ')}</td>
                <td style={tdStyle}>{role.updatedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={splitLayoutStyle}>
        <div style={panelStyle}>
          <div style={sectionTitleStyle}>权限继承规则</div>
          <div style={listStyle}>
            {snapshot.inheritanceRules.map((rule) => (
              <div key={rule} style={listItemStyle}>
                {rule}
              </div>
            ))}
          </div>
        </div>
        <div style={panelStyle}>
          <div style={sectionTitleStyle}>治理备注</div>
          <div style={listStyle}>
            {snapshot.governanceNotes.map((note) => (
              <div key={note} style={noteItemStyle}>
                {note}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article style={statCardStyle}>
      <div style={statLabelStyle}>{label}</div>
      <div style={statValueStyle}>{value}</div>
      <div style={statDetailStyle}>{detail}</div>
    </article>
  )
}

const pageStyle: React.CSSProperties = {
  display: 'grid',
  gap: 18,
}

const heroStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  alignItems: 'flex-start',
  flexWrap: 'wrap',
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 28,
  fontWeight: 700,
  color: '#0f172a',
}

const subtitleStyle: React.CSSProperties = {
  margin: '8px 0 6px',
  fontSize: 14,
  color: '#475569',
  maxWidth: 760,
  lineHeight: 1.6,
}

const metaStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#64748b',
}

const refreshButtonStyle: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: 10,
  border: '1px solid rgba(148, 163, 184, 0.4)',
  background: '#fff',
  color: '#0f172a',
  cursor: 'pointer',
}

const warningStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid rgba(245, 158, 11, 0.3)',
  background: 'rgba(255, 247, 237, 0.9)',
  color: '#9a3412',
  fontSize: 13,
}

const statGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
}

const statCardStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid rgba(148, 163, 184, 0.24)',
  background: '#fff',
  padding: 16,
}

const statLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#64748b',
}

const statValueStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 24,
  fontWeight: 700,
  color: '#0f172a',
}

const statDetailStyle: React.CSSProperties = {
  marginTop: 6,
  fontSize: 12,
  color: '#475569',
}

const panelStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid rgba(148, 163, 184, 0.24)',
  background: '#fff',
  padding: 18,
}

const sectionTitleStyle: React.CSSProperties = {
  marginBottom: 14,
  fontSize: 16,
  fontWeight: 700,
  color: '#0f172a',
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
}

const thStyle: React.CSSProperties = {
  padding: '10px 12px',
  textAlign: 'left',
  fontSize: 12,
  color: '#64748b',
  borderBottom: '1px solid rgba(226, 232, 240, 0.9)',
}

const tdStyle: React.CSSProperties = {
  padding: '12px',
  fontSize: 13,
  color: '#334155',
  borderBottom: '1px solid rgba(241, 245, 249, 0.9)',
}

const tdStrongStyle: React.CSSProperties = {
  ...tdStyle,
  fontWeight: 600,
  color: '#0f172a',
}

const systemBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  padding: '3px 8px',
  borderRadius: 999,
  background: 'rgba(59, 130, 246, 0.12)',
  color: '#1d4ed8',
  fontSize: 12,
  fontWeight: 600,
}

const customBadgeStyle: React.CSSProperties = {
  ...systemBadgeStyle,
  background: 'rgba(148, 163, 184, 0.16)',
  color: '#475569',
}

const splitLayoutStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 18,
}

const listStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
}

const listItemStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 10,
  background: 'rgba(248, 250, 252, 0.95)',
  color: '#334155',
  fontSize: 13,
  lineHeight: 1.6,
}

const noteItemStyle: React.CSSProperties = {
  ...listItemStyle,
  borderLeft: '3px solid #3b82f6',
}
