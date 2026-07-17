/**
 * 用户账户页 Account — storefront-web 个人中心
 * 角色: 👤会员
 * 功能: 个人信息、订单记录、积分余额、设置
 */

import { Suspense } from 'react';
import { LoadingSkeleton, PageShell, ErrorBoundary } from '@m5/ui';
import AccountClient from './account-client';

export default async function AccountPage() {
  return (
    <ErrorBoundary>
      <main style={{ maxWidth: 960, margin: '0 auto', padding: 32 }}>
        <PageShell title="👤 个人中心" subtitle="个人信息 · 订单 · 积分 · 设置">
          <Suspense fallback={<LoadingSkeleton variant="card" rows={6} label="加载账户信息..." />}>
            <AccountClient />
          </Suspense>
        </PageShell>
      </main>
    </ErrorBoundary>
  );
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
