import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { FoundationConsumerWiringSection, GovernanceQuickViewSection, LoadingSkeleton, PageShell, StatCard, WorkspaceBreadcrumb, DetailClosureBar } from '@m5/ui';
import { getRoleWorkbench, getAdminWorkbenchConsumerSnapshot, normalizeWorkbenchRoleKey } from '../../bootstrap';
import { AdminPermissionGate } from '../../components/admin-permission-gate';
import { PadModuleList } from '../../components/pad-module-list';
import { DetailPageActions } from '../../components/detail-page-actions';
import { buildStandardBreadcrumb, buildStandardClosureLinks } from '../../components/detail-workspace-registry';

export default async function PadWorkbenchPage({
  params
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  const [workbench, snapshot] = await Promise.all([getRoleWorkbench(role), getAdminWorkbenchConsumerSnapshot()]);

  if (!workbench || workbench.channel !== 'PAD') {
    notFound();
  }

  // 筛选当前角色对应的 Pad 模块
  const normalizedRole = normalizeWorkbenchRoleKey(role);
  const padWorkbenches = snapshot.workbenches.filter(
    (wb) => wb.channel === 'PAD' && normalizeWorkbenchRoleKey(wb.role) === normalizedRole
  );

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: 20 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'pad', detailLabel: workbench.title })}
      />
      <AdminPermissionGate
        requiredPermission="workbench.read"
        title="Pad 角色工作台访问受限"
        description="Pad 角色详情页已接入管理员本地 session，只有具备 workbench.read 的账号才能查看 Pad 模块与治理快照。"
      >
        <PageShell
          title={workbench.title}
          subtitle="Pad 端偏现场作业，适配导购接待、收银、排队叫号、门店执行和赛事现场控制。"
        >
          {/* 概览统计 */}
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
            <StatCard label="渠道" value={workbench.channel} helper="工作台载体" />
            <StatCard label="模块数" value={String(workbench.navItems.length)} helper="可执行功能模块" />
            <StatCard label="市场" value={String(workbench.marketCodes.length)} helper={workbench.marketCodes.join(' / ')} />
          </div>

          {/* 治理告警快速视图 */}
          <GovernanceQuickViewSection
            summaryLine={`待审批 ${snapshot.governance.summary.approvalsPending} / 高风险审计 ${snapshot.governance.summary.highRiskAudits} / top risks ${snapshot.governance.topRisks.length}`}
            triageLine={`当前 triage：${snapshot.governance.alerts.slice(0, 3).map((item) => item.code).join(' / ')}`}
          />

          {/* Pad 模块列表（含搜索过滤） */}
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>Pad 功能模块</div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>
              可搜索、过滤、快速定位需要使用的功能模块
            </div>
            <Suspense fallback={<LoadingSkeleton variant="card" rows={2} label="加载 Pad 模块列表..." />}>
              <PadModuleList workbenches={padWorkbenches} />
            </Suspense>
          </div>

          {/* 底座接线说明 */}
          <FoundationConsumerWiringSection
            panelStyle={{ marginTop: 24 }}
            responsibility={snapshot.consumerDescriptor.responsibility}
            sequenceLine={`启动顺序：${snapshot.consumerDescriptor.recommendedSequence.join(' -> ')}`}
            highRiskLine={`高风险入口：${snapshot.consumerDescriptor.highRiskEntrypoints.join(' / ')}`}
            touchpointsLine={`治理触点：${snapshot.consumerDescriptor.governanceTouchpoints.slice(0, 3).join(' / ')}`}
          />
        </PageShell>

        <DetailPageActions
          workspace="pad"
          detailId={role}
          record={{ role, title: workbench.title, channel: workbench.channel }}
          shareTitle={`Pad 工作台 · ${workbench.title}`}
          shareText={`查看 Pad ${role} 工作台详情`}
          caption="复制 / 导出 / 分享当前 Pad 工作台"
        />

        <DetailClosureBar
          links={buildStandardClosureLinks({ workspace: 'pad', detailId: role })}
        />
      </AdminPermissionGate>
    </main>
  );
}
