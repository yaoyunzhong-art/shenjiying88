import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { FoundationConsumerWiringSection, GovernanceQuickViewSection, LoadingSkeleton, PageShell, StatCard, WorkspaceBreadcrumb, DetailClosureBar } from '@m5/ui'
import { getRoleWorkbench, getAdminWorkbenchConsumerSnapshot, normalizeWorkbenchRoleKey } from '../../bootstrap'
import { mapToBackendRole } from '@m5/types'
import { PadModuleList } from '../../components/pad-module-list'
import { DetailPageActions } from '../../components/detail-page-actions'
import { buildStandardBreadcrumb, buildStandardClosureLinks } from '../../components/detail-workspace-registry'

export default async function PadWorkbenchPage({
  params,
}: {
  params: Promise<{ role: string }>
}) {
  const { role } = await params
  const [workbench, snapshot] = await Promise.all([getRoleWorkbench(role), getAdminWorkbenchConsumerSnapshot()])

  if (!workbench || workbench.channel !== 'PAD') {
    notFound()
  }

  // 筛选当前角色对应的 Pad 模块
  const normalizedRole = normalizeWorkbenchRoleKey(role)
  const padWorkbenches = snapshot.workbenches.filter(
    (wb) => wb.channel === 'PAD' && normalizeWorkbenchRoleKey(wb.role) === normalizedRole,
  )
  const backendRole = mapToBackendRole(workbench.role)
  const usesOperatorBridge =
    backendRole === 'operator' &&
    ['GUIDE', 'CASHIER', 'WAREHOUSE', 'FINANCE', 'COACH'].includes(workbench.role)

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: 20 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'pad', detailLabel: workbench.title })}
      />
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

        <div
          style={{
            marginTop: 16,
            padding: 16,
            borderRadius: 12,
            background: 'rgba(15, 23, 42, 0.38)',
            border: '1px solid rgba(148, 163, 184, 0.12)',
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 8 }}>
            角色来源态
          </div>
          <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.7 }}>
            Delivery: {snapshot.deliveryMode} · 前端角色: {workbench.role} · tenant-config 角色映射:{' '}
            {backendRole ?? '未映射'}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
            {usesOperatorBridge
              ? '当前 Pad 角色仍通过 operator 桥接到 tenant-config，属于 E54 M1 待正式角色落标的过渡态。'
              : '当前 Pad 角色已具备明确的前后端角色映射，可继续对齐页面/API/权限证据。'}
          </div>
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
    </main>
  )
}
