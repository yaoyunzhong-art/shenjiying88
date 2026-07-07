'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageShell, StatCard } from '@m5/ui';
import type { EnterpriseUser } from '../../../lib/enterprise-auth-service';

export default function EnterpriseConsolePage() {
  const router = useRouter();
  const [user, setUser] = useState<EnterpriseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem('enterprise_access_token');
    const userStr = localStorage.getItem('enterprise_user');

    if (!token || !userStr) {
      router.push('/enterprise/login');
      return;
    }

    try {
      const userData = JSON.parse(userStr) as EnterpriseUser;
      setUser(userData);
    } catch {
      router.push('/enterprise/login');
      return;
    } finally {
      setLoading(false);
    }
  }, [router]);

  function handleLogout() {
    localStorage.removeItem('enterprise_access_token');
    localStorage.removeItem('enterprise_refresh_token');
    localStorage.removeItem('enterprise_user');
    router.push('/enterprise/login');
  }

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0f172a' }}>
        <div style={{ color: '#94a3b8', fontSize: 14 }}>加载中...</div>
      </main>
    );
  }

  const userName = user?.nickname || user?.email || '管理员';

  return (
    <PageShell
      title="企业控制台"
      subtitle={`欢迎回来，${userName}`}
      actions={
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 14, color: '#94a3b8' }}>{user?.email}</span>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            退出登录
          </button>
        </div>
      }
    >
      {/* 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard label="门店总数" value={12} variant="info" />
        <StatCard label="员工总数" value={48} variant="success" />
        <StatCard label="本月订单" value={1234} variant="warning" />
        <StatCard label="待处理告警" value={3} variant="error" />
      </div>

      {/* 快捷入口 */}
      <div style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: '0 0 16px' }}>快捷入口</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/stores" style={{ padding: '12px 24px', fontSize: 14, fontWeight: 500, borderRadius: 8, background: 'rgba(59, 130, 246, 0.12)', color: '#93c5fd', textDecoration: 'none' }}>
            门店管理
          </Link>
          <Link href="/employees" style={{ padding: '12px 24px', fontSize: 14, fontWeight: 500, borderRadius: 8, background: 'rgba(168, 85, 247, 0.12)', color: '#c4b5fd', textDecoration: 'none' }}>
            员工管理
          </Link>
          <Link href="/orders" style={{ padding: '12px 24px', fontSize: 14, fontWeight: 500, borderRadius: 8, background: 'rgba(34, 197, 94, 0.12)', color: '#86efac', textDecoration: 'none' }}>
            订单管理
          </Link>
          <Link href="/campaigns" style={{ padding: '12px 24px', fontSize: 14, fontWeight: 500, borderRadius: 8, background: 'rgba(249, 115, 22, 0.12)', color: '#fdba74', textDecoration: 'none' }}>
            营销活动
          </Link>
          <Link href="/finance" style={{ padding: '12px 24px', fontSize: 14, fontWeight: 500, borderRadius: 8, background: 'rgba(236, 72, 153, 0.12)', color: '#f9a8d4', textDecoration: 'none' }}>
            财务对账
          </Link>
          <Link href="/alerts" style={{ padding: '12px 24px', fontSize: 14, fontWeight: 500, borderRadius: 8, background: 'rgba(239, 68, 68, 0.12)', color: '#fca5a5', textDecoration: 'none' }}>
            告警中心
          </Link>
        </div>
      </div>

      {/* 角色信息 */}
      <div style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 12, padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: '0 0 16px' }}>账户信息</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#94a3b8', width: 80 }}>用户ID</span>
            <code style={{ fontSize: 13, color: '#e2e8f0', background: 'rgba(15, 23, 42, 0.8)', padding: '4px 8px', borderRadius: 4 }}>{user?.userId}</code>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#94a3b8', width: 80 }}>租户ID</span>
            <code style={{ fontSize: 13, color: '#e2e8f0', background: 'rgba(15, 23, 42, 0.8)', padding: '4px 8px', borderRadius: 4 }}>{user?.tenantId}</code>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#94a3b8', width: 80 }}>角色</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {user?.roles?.map((role: string) => (
                <span key={role} style={{ fontSize: 12, padding: '4px 8px', borderRadius: 4, background: 'rgba(102, 126, 234, 0.2)', color: '#a5b4fc' }}>
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
