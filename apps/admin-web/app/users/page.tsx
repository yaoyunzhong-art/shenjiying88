/**
 * 用户管理页 Users — admin-web 用户与权限管理
 * 角色: 👑超级管理员 / 👔店长
 * 功能: 用户列表、角色管理、权限配置、登录日志
 */

import { Suspense } from 'react';
import { LoadingSkeleton, PageShell, ErrorBoundary } from '@m5/ui';
import UsersClient from './users-client';

export default async function UsersPage() {
  return (
    <ErrorBoundary>
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
        <PageShell title="👥 用户管理" subtitle="用户列表 · 角色管理 · 权限配置 · 登录日志">
          <Suspense fallback={<LoadingSkeleton variant="card" rows={8} label="加载用户管理..." />}>
            <UsersClient />
          </Suspense>
        </PageShell>
      </main>
    </ErrorBoundary>
  );
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
