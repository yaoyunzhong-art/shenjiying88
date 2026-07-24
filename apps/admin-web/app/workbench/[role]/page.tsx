import Link from 'next/link';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { FoundationConsumerWiringSection, GovernanceQuickViewSection, LoadingSkeleton, WorkspaceBreadcrumb, DetailClosureBar } from '@m5/ui';
import { AdminPermissionGate } from '../../components/admin-permission-gate';
import { GovernanceLinkedOverview } from '../../components/governance-linked-overview';
import { RuntimeGovernancePanel } from '../../components/runtime-governance-panel';
import { getAdminWorkbenchConsumerSnapshot, getRoleWorkbench } from '../../bootstrap';
import { accessMeta, buildCapabilityEntrypoints, isStoreScopedWorkbenchRole, loadStoreCapabilityAccessSnapshot, readinessMeta } from '../../lyt-capability-access';
import { DetailPageActions } from '../../components/detail-page-actions';
import { buildStandardBreadcrumb, buildStandardClosureLinks } from '../../components/detail-workspace-registry';

export default async function RoleWorkbenchPage({
  params
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  const [workbench, snapshot] = await Promise.all([getRoleWorkbench(role), getAdminWorkbenchConsumerSnapshot()]);

  if (!workbench) {
    notFound();
  }

  const capabilityStoreId = snapshot.tenantContext.storeId ?? 'store-001';
  const storeScopedRole = isStoreScopedWorkbenchRole(workbench.role);
  const capabilitySnapshot = storeScopedRole
    ? await loadStoreCapabilityAccessSnapshot(capabilityStoreId, snapshot.tenantContext)
    : null;
  const visibleEntrypoints = capabilitySnapshot
    ? buildCapabilityEntrypoints(capabilityStoreId, capabilitySnapshot.capabilityAccess).filter((item) => item.visibility === 'visible')
    : [];

  return (
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: 32 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'workbench', detailLabel: workbench.title })}
      />
      <AdminPermissionGate
        requiredPermission="workbench.read"
        title="角色工作台访问受限"
        description="角色工作台详情页已接入管理员本地 session，只有具备 workbench.read 的账号才能查看工作台模块与治理信息。"
      >
        <section
          style={{
            borderRadius: 24,
            padding: 28,
            color: '#f8fafc',
            background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)'
          }}
        >
          <div style={{ fontSize: 13, color: '#93c5fd' }}>{workbench.channel}</div>
          <h1 style={{ marginBottom: 12 }}>{workbench.title}</h1>
          <p style={{ marginTop: 0, color: '#cbd5e1' }}>{workbench.description}</p>

          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            {workbench.navItems.map((item) => (
              <article
                key={item.key}
                style={{ borderRadius: 16, padding: 18, background: 'rgba(15, 23, 42, 0.38)' }}
              >
                <div style={{ fontSize: 18, fontWeight: 700 }}>{item.label}</div>
                <div style={{ marginTop: 8, color: '#cbd5e1' }}>{item.description}</div>
                <Link href={item.href} style={{ marginTop: 12, display: 'inline-block', color: '#93c5fd' }}>
                  进入模块
                </Link>
              </article>
            ))}
          </div>
          {capabilitySnapshot ? (
            <section
              style={{
                marginTop: 20,
                borderRadius: 18,
                padding: 20,
                background: 'rgba(15, 23, 42, 0.35)',
                border: '1px solid rgba(148, 163, 184, 0.18)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>门店能力入口治理</div>
                  <div style={{ marginTop: 8, color: '#cbd5e1', fontSize: 14 }}>
                    当前门店 {capabilityStoreId} 的 capability access 已接入工作台首页，数据源：{capabilitySnapshot.deliveryMode === 'api' ? '真实 access view' : 'fallback access view'}。
                  </div>
                </div>
                <Link href={`/stores/${capabilityStoreId}/capability-access`} style={{ color: '#93c5fd' }}>
                  查看完整能力矩阵
                </Link>
              </div>
              <div style={{ marginTop: 16, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                {visibleEntrypoints.slice(0, 4).map((entry) => (
                  <article
                    key={entry.key}
                    style={{ borderRadius: 16, padding: 16, background: 'rgba(15, 23, 42, 0.38)', border: '1px solid rgba(148, 163, 184, 0.18)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700 }}>{entry.label}</div>
                        <div style={{ marginTop: 6, color: '#94a3b8', fontSize: 13 }}>{entry.description}</div>
                      </div>
                      <span>{accessMeta[entry.access].label}</span>
                    </div>
                    <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', color: '#cbd5e1', fontSize: 13 }}>
                      <span>{entry.capability}</span>
                      <span>·</span>
                      <span>{readinessMeta[entry.readiness].label}</span>
                      <span>·</span>
                      <span>{accessMeta[entry.access].label}</span>
                    </div>
                    <div style={{ marginTop: 10, color: '#cbd5e1', lineHeight: 1.6, fontSize: 13 }}>{entry.reason}</div>
                    {entry.isNavigable ? (
                      <Link href={entry.href} style={{ marginTop: 12, display: 'inline-block', color: '#93c5fd' }}>
                        {entry.actionLabel}
                      </Link>
                    ) : (
                      <div style={{ marginTop: 12, color: '#fca5a5', fontSize: 13 }}>{entry.hint}</div>
                    )}
                  </article>
                ))}
              </div>
              {!visibleEntrypoints.length ? (
                <div style={{ marginTop: 14, color: '#94a3b8', fontSize: 14 }}>
                  当前门店角色暂无可见能力入口，建议先前往完整能力矩阵排查 blocked / hidden 原因。
                </div>
              ) : null}
            </section>
          ) : null}
          <GovernanceQuickViewSection
            summaryLine={`待审批 ${snapshot.governance.summary.approvalsPending} / 高风险审计 ${snapshot.governance.summary.highRiskAudits} / top risks ${snapshot.governance.topRisks.length}`}
            triageLine={`当前 triage：${snapshot.governance.alerts.slice(0, 3).map((item) => item.code).join(' / ')}`}
          >
            <Suspense fallback={<LoadingSkeleton variant="card" rows={1} label="加载治理联动概览..." />}>
              <GovernanceLinkedOverview governance={snapshot.governance} />
            </Suspense>
          </GovernanceQuickViewSection>
          <FoundationConsumerWiringSection
            responsibility={snapshot.consumerDescriptor.responsibility}
            sequenceLine={`启动顺序：${snapshot.consumerDescriptor.recommendedSequence.join(' -> ')}`}
            highRiskLine={`高风险入口：${snapshot.consumerDescriptor.highRiskEntrypoints.join(' / ')}`}
            touchpointsLine={`治理触点：${snapshot.consumerDescriptor.governanceTouchpoints.slice(0, 3).join(' / ')}`}
          />
          <RuntimeGovernancePanel tenantContext={snapshot.tenantContext} />
        </section>

        <DetailPageActions
          workspace="workbench"
          detailId={role}
          record={{ role, title: workbench.title, channel: workbench.channel }}
          shareTitle={`工作台 · ${workbench.title}`}
          shareText={`查看 ${role} 工作台详情`}
          caption="复制 / 导出 / 分享当前工作台"
        />

        <DetailClosureBar
          links={buildStandardClosureLinks({
            workspace: 'workbench',
            detailId: role,
            extraLinks: [
              {
                key: 'pad',
                title: '查看 Pad 版',
                subtitle: `Pad 端 ${workbench.title} 工作台`,
                href: `/pad/${role}`
              }
            ]
          })}
        />
      </AdminPermissionGate>
    </main>
  );
}
