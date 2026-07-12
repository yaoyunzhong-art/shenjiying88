/**
 * 日志审计 - Audit Logs (服务端数据加载版)
 *
 * Phase-FP P0-E1 修复:
 *   - 移除 Math.random() 假数据 (commit 9bb256c6b 之前)
 *   - 通过 @m5/sdk.listTenantConfigAuditLogs 真实拉取 tenant-config 审计日志
 *   - SSR fetch + try/catch 处理空态
 *   - UI 结构 (StatCard + Tabs + DataTable + Pagination) 由 tenant-config-audit-client.tsx 提供
 */

import { loadTenantConfigAuditTrail } from './tenant-config-audit-view-model';
import TenantConfigAuditClient from './tenant-config-audit-client';

export const dynamic = 'force-dynamic';

export default async function AuditLogsPage() {
  const snapshot = await loadTenantConfigAuditTrail('tenant-demo', 200, { cache: 'no-store' });

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <TenantConfigAuditClient
        deliveryMode={snapshot.deliveryMode}
        generatedAt={snapshot.generatedAt}
        tenantId={snapshot.tenantId}
        records={snapshot.records}
        total={snapshot.total}
        error={snapshot.error}
      />
    </main>
  );
}
