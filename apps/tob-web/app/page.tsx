'use client';

import Link from 'next/link';
import React from 'react';
import { PageShell, StatCard, Tooltip } from '@m5/ui';

export default function DashboardPage() {
  return (
    <PageShell title="ToB Admin Dashboard" description="System overview and quick access">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard label="Open Alerts" value={5} variant="error" />
        <StatCard label="Critical Errors" value={2} variant="error" />
        <StatCard label="Resolved" value={18} variant="success" />
        <StatCard label="Total Alerts" value={25} variant="info" />
      </div>
      <div style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 12, padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: '0 0 16px' }}>Quick Access</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Tooltip content="查看和管理所有基础设施告警，包含确认、静默等操作" placement="bottom">
            <Link href="/alerts" style={{ padding: '10px 20px', fontSize: 14, fontWeight: 500, borderRadius: 8, background: 'rgba(59,130,246,0.12)', color: '#93c5fd', textDecoration: 'none' }}>
              📋 Alert List
            </Link>
          </Tooltip>
          <Tooltip content="查看部署、回滚、扩缩容等运维操作记录" placement="bottom">
            <Link href="/operations" style={{ padding: '10px 20px', fontSize: 14, fontWeight: 500, borderRadius: 8, background: 'rgba(168,85,247,0.12)', color: '#c4b5fd', textDecoration: 'none' }}>
              ⚙️ Operations
            </Link>
          </Tooltip>
        </div>
      </div>
    </PageShell>
  );
}
