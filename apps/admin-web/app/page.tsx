import { Suspense } from 'react';
import Link from 'next/link';
import { LoadingSkeleton, PageShell, StatCard } from '@m5/ui';
import { buildFoundationWorkspaceHref } from '@m5/types';
import { getAdminWorkbenchConsumerSnapshot } from './bootstrap';
import { adminGovernanceApprovalsRoute } from './approvals-data';
import { AdminPermissionGate } from './components/admin-permission-gate';
import { GovernanceLinkedOverview } from './components/governance-linked-overview';
import { WorkbenchList } from './components/workbench-list';
import { buildConfigurationHref } from './configuration-view-model';
import { adminRuntimeOperationsRoute } from './operations-data';

export default async function HomePage() {
  const snapshot = await getAdminWorkbenchConsumerSnapshot();
  const configurationHref = buildConfigurationHref({
    tenantId: snapshot.tenantContext.tenantId,
    brandId: snapshot.tenantContext.brandId,
    storeId: snapshot.tenantContext.storeId,
    marketCode: snapshot.tenantContext.marketCode
  });
  const foundationHref = buildFoundationWorkspaceHref({
    moduleKey: 'configuration-governance',
    consumer: 'workbench'
  });

  return (
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: 32 }}>
      <AdminPermissionGate
        requiredPermission="dashboard:read"
        title="指挥台访问受限"
        description="M5 指挥台首页已接入管理员本地 session，只有具备 dashboard:read 的账号才能查看总览卡片、治理快照与工作台目录。"
      >
        <PageShell
          title="M5 指挥台"
          subtitle="每个门店支持 ToC 官网 / H5 / 小程序 / App / PC 后台，每个工作角色拥有独立工作台。"
        >
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
            <StatCard label="Bootstrap" value={snapshot.deliveryMode.toUpperCase()} helper={snapshot.wiring.bootstrapEndpoint} />
            <StatCard
              label="租户作用域"
              value={snapshot.scope.mismatchStrategy}
              helper={`${snapshot.tenantContext.tenantId} / ${snapshot.tenantContext.brandId ?? '-'} / ${snapshot.tenantContext.storeId ?? '-'}`}
            />
            <StatCard
              label="治理告警"
              value={String(snapshot.governance.alerts.length)}
              helper={snapshot.governance.deliveryMode === 'api' ? '实时 catalog' : 'fallback catalog'}
            />
          </div>
          <div
            style={{
              marginTop: 24,
              borderRadius: 18,
              padding: 20,
              background: 'rgba(15, 23, 42, 0.35)',
              border: '1px solid rgba(148, 163, 184, 0.18)'
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700 }}>Foundation Consumer Snapshot</div>
            <div style={{ marginTop: 10, color: '#cbd5e1' }}>作用域解析：{snapshot.scope.resolver}</div>
            <div style={{ marginTop: 8, color: '#cbd5e1' }}>
              降级策略：feature flags {snapshot.degradation.featureFlagFallback}，默认脱敏 {snapshot.degradation.desensitizationMode}
            </div>
            <div style={{ marginTop: 8, color: '#cbd5e1' }}>
              挑战治理：{snapshot.challenge.enforcement} / {snapshot.challenge.notes.join(' / ')}
            </div>
            <div style={{ marginTop: 8, color: '#cbd5e1' }}>
              支持客户端：{snapshot.supportedClients.join(' / ')}；缓存能力：{snapshot.degradation.cacheableCapabilities.join(' / ')}
            </div>
            <div style={{ marginTop: 8, color: '#93c5fd' }}>
              Foundation contracts：{snapshot.foundationContracts.join(' / ') || 'waiting for API bootstrap'}
            </div>
            <div style={{ marginTop: 8, color: '#93c5fd' }}>Governance alert codes：{snapshot.governance.alerts.map((item) => item.code).join(' / ')}</div>
            <Suspense fallback={<LoadingSkeleton variant="card" rows={1} label="加载治理联动概览..." />}>
              <GovernanceLinkedOverview governance={snapshot.governance} />
            </Suspense>
          </div>
          <div
            style={{
              marginTop: 24,
              display: 'grid',
              gap: 16,
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))'
            }}
          >
            <Link
              href={foundationHref}
              style={{
                display: 'block',
                borderRadius: 18,
                padding: 20,
                color: '#e2e8f0',
                textDecoration: 'none',
                background: 'rgba(15, 23, 42, 0.35)',
                border: '1px solid rgba(148, 163, 184, 0.18)'
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700 }}>Foundation 总览</div>
              <div style={{ marginTop: 8, color: '#cbd5e1' }}>查看模块目录、消费者依赖、治理基线与模块 drilldown 总入口。</div>
              <div style={{ marginTop: 12, color: '#93c5fd' }}>
                模块数：{snapshot.consumerDescriptor.dependsOn.length} / 默认 consumer：{snapshot.consumerDescriptor.consumer}
              </div>
            </Link>
            <Link
              href={configurationHref}
              style={{
                display: 'block',
                borderRadius: 18,
                padding: 20,
                color: '#e2e8f0',
                textDecoration: 'none',
                background: 'rgba(15, 23, 42, 0.35)',
                border: '1px solid rgba(148, 163, 184, 0.18)'
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700 }}>配置治理</div>
              <div style={{ marginTop: 8, color: '#cbd5e1' }}>进入功能开关、配置项、密钥与证书治理工作台。</div>
              <div style={{ marginTop: 12, color: '#93c5fd' }}>
                租户：{snapshot.tenantContext.tenantId} / 门店：{snapshot.tenantContext.storeId ?? '—'}
              </div>
            </Link>
            <Link
              href="/configuration/three-level"
              style={{
                display: 'block',
                borderRadius: 18,
                padding: 20,
                color: '#e2e8f0',
                textDecoration: 'none',
                background: 'rgba(15, 23, 42, 0.35)',
                border: '1px solid rgba(148, 163, 184, 0.18)'
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700 }}>三级独立配置 (W-S / W-T / W-B)</div>
              <div style={{ marginTop: 8, color: '#cbd5e1' }}>
                门店/租户/品牌三级工作台配置:POS/打印/会员/营销/库存/合规/计费,支持批量编辑与版本回滚。
              </div>
              <div style={{ marginTop: 12, color: '#93c5fd' }}>
                端点：GET /tenant-config/workbench/:code · 角色：{snapshot.tenantContext.tenantId}
              </div>
            </Link>
            <Link
              href={adminRuntimeOperationsRoute.href}
              style={{
                display: 'block',
                borderRadius: 18,
                padding: 20,
                color: '#e2e8f0',
                textDecoration: 'none',
                background: 'rgba(15, 23, 42, 0.35)',
                border: '1px solid rgba(148, 163, 184, 0.18)'
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700 }}>{adminRuntimeOperationsRoute.title}</div>
              <div style={{ marginTop: 8, color: '#cbd5e1' }}>{adminRuntimeOperationsRoute.description}</div>
              <div style={{ marginTop: 12, color: '#93c5fd' }}>
                高风险入口：{snapshot.consumerDescriptor.highRiskEntrypoints.join(' / ')}
              </div>
            </Link>
            <Link
              href="/alerts"
              style={{
                display: 'block',
                borderRadius: 18,
                padding: 20,
                color: '#e2e8f0',
                textDecoration: 'none',
                background: 'rgba(15, 23, 42, 0.35)',
                border: '1px solid rgba(148, 163, 184, 0.18)'
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700 }}>治理告警中心</div>
              <div style={{ marginTop: 8, color: '#cbd5e1' }}>查看 foundation 概览、catalog 告警与 drilldown 详情。</div>
              <div style={{ marginTop: 12, color: '#93c5fd' }}>
                当前告警量：{snapshot.governance.alerts.length} / 数据模式：{snapshot.governance.deliveryMode}
              </div>
            </Link>
            <Link
              href={adminGovernanceApprovalsRoute.href}
              style={{
                display: 'block',
                borderRadius: 18,
                padding: 20,
                color: '#e2e8f0',
                textDecoration: 'none',
                background: 'rgba(15, 23, 42, 0.35)',
                border: '1px solid rgba(148, 163, 184, 0.18)'
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700 }}>{adminGovernanceApprovalsRoute.title}</div>
              <div style={{ marginTop: 8, color: '#cbd5e1' }}>{adminGovernanceApprovalsRoute.description}</div>
              <div style={{ marginTop: 12, color: '#93c5fd' }}>
                待审批：{snapshot.governance.summary.approvalsPending} / 执行失败：{snapshot.governance.summary.approvalsWithFailures}
              </div>
            </Link>
          </div>
          <div style={{ marginTop: 24 }}>
            <WorkbenchList workbenches={snapshot.workbenches} />
          </div>
        </PageShell>
      </AdminPermissionGate>
    </main>
  );
}
