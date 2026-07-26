import { PageShell, StatCard } from '@m5/ui';
import type { AuditRiskLevel, AuditTrailQuery } from '@m5/types';
import { AdminPermissionGate } from '../components/admin-permission-gate';
import AuditTrailClient from './audit-trail-client';
import { loadAuditTrail } from '../audit-trail-view-model';

export const dynamic = 'force-dynamic';

interface AuditTrailPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function readRiskLevelParam(value: string | string[] | undefined): AuditRiskLevel | undefined {
  const raw = readQueryParam(value);
  if (raw === 'low' || raw === 'medium' || raw === 'high') {
    return raw;
  }
  return undefined;
}

function readLimitParam(value: string | string[] | undefined): number | undefined {
  const raw = readQueryParam(value);
  if (!raw) return undefined;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }
  return Math.min(parsed, 100);
}

export default async function AuditLogsPage({ searchParams }: AuditTrailPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const query: AuditTrailQuery = {
    riskLevel: readRiskLevelParam(resolvedSearchParams?.riskLevel),
    source: readQueryParam(resolvedSearchParams?.source),
    limit: readLimitParam(resolvedSearchParams?.limit)
  };
  const snapshot = await loadAuditTrail(query, { cache: 'no-store' });
  const records = snapshot.trail.records;
  const byRiskLevel = snapshot.summary?.byRiskLevel ?? { low: 0, medium: 0, high: 0 };
  const uniqueSources = new Set(records.map((record) => record.source).filter(Boolean)).size;
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadAuditTrail (listAuditRecords + summarizeAuditRecords)'
        : 'loadAuditTrail fallback empty snapshot',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'AuditTrailResponse.records + AuditTrailSummary'
        : 'empty audit trail fallback',
    refreshPath: 'AuditLogsPage -> loadAuditTrail',
    generatedAt: snapshot.generatedAt,
    query: `riskLevel=${snapshot.query.riskLevel ?? 'ALL'} · source=${snapshot.query.source ?? 'ALL'} · limit=${snapshot.query.limit ?? 50}`,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前审计工作台直接消费 audit trail 读模型快照。'
        : '当前列表已回退为空快照，不可作为真实审计链复签证据。'
  } as const;
  const permissionGate = {
    requiredPermission: 'foundation.governance.read',
    title: '审计日志访问受限',
    description:
      '审计日志页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看配置变更、权限操作与系统审计记录。'
  } as const;

  return (
    <AdminPermissionGate {...permissionGate}>
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
        <PageShell title="审计日志" subtitle="查看所有租户配置变更与操作审计记录，支持风险和来源筛选。">
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 24 }}>
            <StatCard label="总记录" value={snapshot.trail.total} helper="当前快照匹配结果" />
            <StatCard label="高风险" value={byRiskLevel.high} helper={`${byRiskLevel.medium} 中风险 / ${byRiskLevel.low} 低风险`} tone={byRiskLevel.high > 0 ? 'warning' : 'neutral'} />
            <StatCard label="来源数" value={uniqueSources} helper="当前结果中的 source 去重计数" tone="info" />
            <StatCard label="Delivery" value={snapshot.deliveryMode} helper={sourceEvidence.generatedAt} tone={snapshot.deliveryMode === 'api' ? 'success' : 'warning'} />
          </div>

          <div className="bg-white/5 border border-slate-700 rounded-xl p-4 mb-4 text-xs text-slate-300 leading-6">
            <div>
              Delivery {sourceEvidence.deliveryMode} · 控制面来源: {sourceEvidence.controlPlaneSource}
            </div>
            <div>
              业务数据: {sourceEvidence.businessDataSource} · 刷新路径: {sourceEvidence.refreshPath}
            </div>
            <div>
              generatedAt: {sourceEvidence.generatedAt} · 查询条件: {sourceEvidence.query}
            </div>
            <div>{sourceEvidence.note}</div>
          </div>

          <AuditTrailClient
            records={snapshot.trail.records}
            total={snapshot.trail.total}
            query={snapshot.query}
          />
        </PageShell>
      </main>
    </AdminPermissionGate>
  );
}
