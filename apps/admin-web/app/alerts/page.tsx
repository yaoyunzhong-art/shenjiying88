/**
 * 告警中心 — Alerts Page (Next.js App Router)
 *
 * 功能:
 * - 展示审批、审计、安全、运行时与恢复演练相关治理告警
 * - 支持告警确认/认领
 * - 按告警来源、严重程度筛选
 * - 空状态 / 加载中 / 告警详情联动
 */
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoadingSkeleton, EmptyState, ErrorBoundary } from '@m5/ui'
import { loadAdminGovernanceReadModel } from '../bootstrap'
import { AdminAlertsClient } from './alerts-client'

export const metadata: Metadata = {
  title: '告警中心 - M5 指挥台',
  description:
    '统一查看审批、审计、安全、运行时与恢复演练相关治理告警。支持按来源筛选、严重程度过滤和一键确认/认领操作。',
  openGraph: {
    title: '告警中心 | 平台治理警报',
    description: '统一查看审批、审计、安全、运行时与恢复演练相关治理告警',
    type: 'website',
  },
}

/**
 * 加载中占位 — Suspense fallback
 */
function AlertsLoadingFallback() {
  return (
    <div style={{ padding: 32 }}>
      <LoadingSkeleton variant="card" rows={5} label="加载告警列表..." />
      <div style={{ height: 16 }} />
      <LoadingSkeleton variant="default" rows={3} label="加载统计摘要..." />
    </div>
  )
}

/**
 * 空状态提示 — 无可用的治理告警时展示
 */
function AlertsEmptyState() {
  return (
    <EmptyState
      title="暂无告警"
      description="当前没有任何审批、审计或运行时告警，系统运行状态正常。"
      action={<a href="/alerts">刷新页面</a>}
    />
  )
}

/**
 * 错误回退 — 告警数据加载/渲染异常时展示
 */
function AlertsErrorFallback() {
  return (
    <EmptyState
      title="告警加载异常"
      description="无法加载治理告警数据，请检查 foundation.governance.read 权限或后端服务可达性，稍后重试。"
      action={<a href="/alerts">重试</a>}
    />
  )
}

export default async function AdminAlertsPage() {
  let governance
  try {
    governance = await loadAdminGovernanceReadModel()
  } catch {
    return <AlertsEmptyState />
  }

  if (!governance || (!governance.alerts?.length && governance.deliveryMode === 'fallback')) {
    return <AlertsEmptyState />
  }

  return (
    <ErrorBoundary fallback={<AlertsErrorFallback />}>
      <Suspense fallback={<AlertsLoadingFallback />}>
        <AdminAlertsClient initialGovernance={governance} />
      </Suspense>
    </ErrorBoundary>
  )
}
