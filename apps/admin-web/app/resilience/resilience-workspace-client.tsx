'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { DataTable, DetailActionBar, StatusBadge, Tabs, type DataTableColumn } from '@m5/ui';
import {
  type ObservabilitySignalContract,
  type ObservabilityStatus,
  type RecoveryPlanContract,
  type RecoveryPlanStatus,
  type ResilienceOverview,
  type RetryPolicyContract,
  buildResilienceRecoveryPlanDetailHref,
  buildResilienceRetryPolicyDetailHref,
  buildResilienceSignalDetailHref
} from '@m5/types';
import {
  RECOVERY_PLAN_STATUS_LABEL,
  RECOVERY_PLAN_STATUS_VARIANT,
  SIGNAL_STATUS_LABEL,
  SIGNAL_STATUS_VARIANT,
  SIGNAL_TYPE_LABEL,
  isDrillStale,
  summarizeRecoveryPlan,
  summarizeRetryPolicy,
  summarizeSignal
} from '../resilience-view-model';
import { useDetailActions } from '../components/use-detail-actions';

interface ResilienceWorkspaceClientProps {
  overview: ResilienceOverview;
}

type TabKey = 'overview' | 'observability' | 'retries' | 'recovery';

const SIGNAL_STATUS_FILTERS: ReadonlyArray<ObservabilityStatus | 'ALL'> = ['ALL', 'healthy', 'warning', 'critical'];
const RECOVERY_PLAN_STATUS_FILTERS: ReadonlyArray<RecoveryPlanStatus | 'ALL'> = ['ALL', 'ready', 'attention'];

export default function ResilienceWorkspaceClient({ overview }: ResilienceWorkspaceClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [signalFilter, setSignalFilter] = useState<ObservabilityStatus | 'ALL'>('ALL');
  const [recoveryFilter, setRecoveryFilter] = useState<RecoveryPlanStatus | 'ALL'>('ALL');
  const { actions } = useDetailActions({
    workspace: 'resilience',
    detailId: 'overview',
    record: overview,
    shareTitle: '强韧性作战工作台',
    shareText: '查看信号/重试/恢复计划快照'
  });

  const signalCounts = useMemo(() => {
    const counts: Record<ObservabilityStatus | 'ALL', number> = {
      ALL: overview.observability.signals.length,
      healthy: 0,
      warning: 0,
      critical: 0
    };
    for (const signal of overview.observability.signals) {
      counts[signal.status] += 1;
    }
    return counts;
  }, [overview]);

  const recoveryCounts = useMemo(() => {
    const counts: Record<RecoveryPlanStatus | 'ALL', number> = {
      ALL: overview.recovery.plans.length,
      ready: 0,
      attention: 0
    };
    for (const plan of overview.recovery.plans) {
      counts[plan.status] += 1;
    }
    return counts;
  }, [overview]);

  const filteredSignals = useMemo(() => {
    if (signalFilter === 'ALL') {
      return overview.observability.signals;
    }
    return overview.observability.signals.filter((signal) => signal.status === signalFilter);
  }, [overview, signalFilter]);

  const filteredRecoveryPlans = useMemo(() => {
    return overview.recovery.plans.filter((plan) => {
      if (recoveryFilter !== 'ALL' && plan.status !== recoveryFilter) {
        return false;
      }
      return true;
    });
  }, [overview, recoveryFilter]);

  const staleDrillPlanKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const plan of overview.recovery.plans) {
      if (isDrillStale(plan)) {
        keys.add(plan.resource);
      }
    }
    return keys;
  }, [overview]);

  const signalColumns: DataTableColumn<ObservabilitySignalContract>[] = useMemo(
    () => [
      {
        key: 'signal',
        title: '信号',
        dataKey: 'signal',
        sortable: true,
        render: (item) => (
          <div>
            <Link
              href={buildResilienceSignalDetailHref(item.signal)}
              style={{ color: '#93c5fd', textDecoration: 'none', fontWeight: 600 }}
            >
              {SIGNAL_TYPE_LABEL[item.signal]}
            </Link>
            <div style={{ fontSize: 11, color: '#64748b' }}>{summarizeSignal(item)}</div>
          </div>
        )
      },
      {
        key: 'status',
        title: '状态',
        render: (item) => (
          <StatusBadge
            label={SIGNAL_STATUS_LABEL[item.status]}
            variant={SIGNAL_STATUS_VARIANT[item.status]}
            dot
            size="sm"
          />
        )
      },
      {
        key: 'coverage',
        title: '覆盖率',
        dataKey: 'coverage',
        render: (item) => `${item.coverage}%`
      },
      {
        key: 'collectionLagSeconds',
        title: '采集滞后',
        dataKey: 'collectionLagSeconds',
        render: (item) => `${item.collectionLagSeconds}s`
      },
      {
        key: 'owner',
        title: '负责人',
        dataKey: 'owner',
        render: (item) => item.owner
      },
      {
        key: 'alertRoutes',
        title: '告警路由',
        render: (item) => (
          <div style={{ fontSize: 12, color: '#cbd5f5' }}>{item.alertRoutes.join(' · ')}</div>
        )
      },
      {
        key: 'lastCollectedAt',
        title: '最后采集',
        dataKey: 'lastCollectedAt',
        render: (item) => new Date(item.lastCollectedAt).toLocaleString('zh-CN')
      }
    ],
    []
  );

  const retryColumns: DataTableColumn<RetryPolicyContract>[] = useMemo(
    () => [
      {
        key: 'key',
        title: '策略 Key',
        dataKey: 'key',
        sortable: true,
        render: (item) => (
          <div>
            <Link
              href={buildResilienceRetryPolicyDetailHref(item.key)}
              style={{ fontFamily: 'monospace', fontSize: 12, color: '#93c5fd', textDecoration: 'none' }}
            >
              {item.key}
            </Link>
            <div style={{ fontSize: 11, color: '#64748b' }}>{summarizeRetryPolicy(item)}</div>
          </div>
        )
      },
      {
        key: 'capability',
        title: '能力',
        dataKey: 'capability',
        sortable: true,
        render: (item) => item.capability
      },
      {
        key: 'trigger',
        title: '触发',
        dataKey: 'trigger',
        render: (item) => item.trigger
      },
      {
        key: 'maxAttempts',
        title: '重试上限',
        dataKey: 'maxAttempts',
        render: (item) => item.maxAttempts
      },
      {
        key: 'backoff',
        title: '退避',
        dataKey: 'backoff',
        render: (item) => item.backoff
      },
      {
        key: 'recoveryAction',
        title: '恢复动作',
        render: (item) => item.recoveryAction
      },
      {
        key: 'escalationTarget',
        title: '升级',
        dataKey: 'escalationTarget',
        render: (item) => item.escalationTarget
      }
    ],
    []
  );

  const recoveryColumns: DataTableColumn<RecoveryPlanContract>[] = useMemo(
    () => [
      {
        key: 'resource',
        title: '资源',
        dataKey: 'resource',
        sortable: true,
        render: (item) => (
          <div>
            <Link
              href={buildResilienceRecoveryPlanDetailHref(item.resource)}
              style={{ fontFamily: 'monospace', fontSize: 12, color: '#93c5fd', textDecoration: 'none' }}
            >
              {item.resource}
            </Link>
            <div style={{ fontSize: 11, color: '#64748b' }}>{summarizeRecoveryPlan(item)}</div>
          </div>
        )
      },
      {
        key: 'status',
        title: '状态',
        render: (item) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <StatusBadge
              label={RECOVERY_PLAN_STATUS_LABEL[item.status]}
              variant={RECOVERY_PLAN_STATUS_VARIANT[item.status]}
              dot
              size="sm"
            />
            {staleDrillPlanKeys.has(item.resource) ? (
              <StatusBadge label="演练过期" variant="warning" size="sm" />
            ) : null}
          </div>
        )
      },
      {
        key: 'rtoMinutes',
        title: 'RTO',
        dataKey: 'rtoMinutes',
        render: (item) => `${item.rtoMinutes} 分钟`
      },
      {
        key: 'rpoMinutes',
        title: 'RPO',
        dataKey: 'rpoMinutes',
        render: (item) => `${item.rpoMinutes} 分钟`
      },
      {
        key: 'dependencies',
        title: '依赖',
        render: (item) => (
          <div style={{ fontSize: 12, color: '#cbd5f5' }}>{item.dependencies.join(' · ')}</div>
        )
      },
      {
        key: 'lastDrillAt',
        title: '最后演练',
        dataKey: 'lastDrillAt',
        render: (item) => new Date(item.lastDrillAt).toLocaleString('zh-CN')
      },
      {
        key: 'runbook',
        title: 'Runbook',
        dataKey: 'runbook',
        render: (item) => (
          <span style={{ fontSize: 12, color: '#94a3b8' }}>{item.runbook}</span>
        )
      }
    ],
    [staleDrillPlanKeys]
  );

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <Tabs
          items={[
            { key: 'overview', label: '总览' },
            { key: 'observability', label: '可观测性', count: overview.observability.totalSignals },
            { key: 'retries', label: '重试策略', count: overview.retries.totalPolicies },
            { key: 'recovery', label: '恢复计划', count: overview.recovery.totalPlans }
          ]}
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as TabKey)}
          variant="pills"
        />
      </div>

      {activeTab === 'overview' ? <OverviewBoard overview={overview} /> : null}

      {activeTab === 'observability' ? (
        <>
          <Tabs
            items={SIGNAL_STATUS_FILTERS.map((status) => ({
              key: status,
              label: status === 'ALL' ? '全部' : SIGNAL_STATUS_LABEL[status],
              count: signalCounts[status]
            }))}
            activeKey={signalFilter}
            onChange={(key) => setSignalFilter(key as ObservabilityStatus | 'ALL')}
            variant="pills"
            size="sm"
          />
          <div style={{ marginTop: 14 }}>
            <DataTable
              title={`可观测信号（${filteredSignals.length}）`}
              columns={signalColumns}
              items={filteredSignals}
              rowKey={(item) => item.signal}
              striped
              compact
            />
          </div>
        </>
      ) : null}

      {activeTab === 'retries' ? (
        <DataTable
          title={`重试策略（${overview.retries.policies.length}）`}
          columns={retryColumns}
          items={overview.retries.policies}
          rowKey={(item) => item.key}
          striped
          compact
        />
      ) : null}

      {activeTab === 'recovery' ? (
        <>
          <Tabs
            items={RECOVERY_PLAN_STATUS_FILTERS.map((status) => ({
              key: status,
              label: status === 'ALL' ? '全部' : RECOVERY_PLAN_STATUS_LABEL[status],
              count: recoveryCounts[status]
            }))}
            activeKey={recoveryFilter}
            onChange={(key) => setRecoveryFilter(key as RecoveryPlanStatus | 'ALL')}
            variant="pills"
            size="sm"
          />
          <div style={{ marginTop: 14 }}>
            <DataTable
              title={`恢复计划（${filteredRecoveryPlans.length}）`}
              columns={recoveryColumns}
              items={filteredRecoveryPlans}
              rowKey={(item) => item.resource}
              striped
              compact
            />
          </div>
        </>
      ) : null}

      {overview.observability.signals.length > 0 ? (
        <p style={{ marginTop: 16, fontSize: 12, color: '#94a3b8' }}>
          {summarizeSignal(overview.observability.signals[0]!)}
        </p>
      ) : null}
      {overview.retries.policies.length > 0 ? (
        <p style={{ marginTop: 8, fontSize: 12, color: '#94a3b8' }}>
          {summarizeRetryPolicy(overview.retries.policies[0]!)}
        </p>
      ) : null}

      <DetailActionBar
        actions={actions}
        heading="工作台收口动作"
        caption="复制 / 导出 / 分享当前强韧性工作台"
      />
    </div>
  );
}

function OverviewBoard({ overview }: { overview: ResilienceOverview }) {
  const { observability, retries, recovery } = overview;
  return (
    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
      <SummaryCard
        title="可观测信号"
        primary={`${observability.totalSignals}`}
        secondary={`降级 ${observability.degradedSignals} · 平均覆盖率 ${observability.averageCoverage}%`}
        tone={observability.degradedSignals > 0 ? 'warning' : 'normal'}
      />
      <SummaryCard
        title="采集最大滞后"
        primary={`${observability.maxCollectionLagSeconds}s`}
        secondary="采集滞后超过阈值则触发告警"
      />
      <SummaryCard
        title="重试策略"
        primary={`${retries.totalPolicies}`}
        secondary={`能力维度 ${Object.keys(retries.byCapability).length} · 最大尝试 ${retries.maxAttempts}`}
      />
      <SummaryCard
        title="恢复计划"
        primary={`${recovery.totalPlans}`}
        secondary={`需关注 ${recovery.attentionRequired} · 演练过期 ${recovery.staleDrills}`}
        tone={recovery.attentionRequired > 0 || recovery.staleDrills > 0 ? 'warning' : 'normal'}
      />
    </div>
  );
}

function SummaryCard({
  title,
  primary,
  secondary,
  tone
}: {
  title: string;
  primary: string;
  secondary: string;
  tone?: 'warning' | 'normal';
}) {
  const accent = tone === 'warning' ? '#fbbf24' : '#93c5fd';
  return (
    <div
      style={{
        border: '1px solid rgba(148,163,184,0.2)',
        borderRadius: 12,
        padding: 18,
        background: 'rgba(15,23,42,0.6)',
        color: '#e2e8f0'
      }}
    >
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: accent, marginBottom: 6 }}>{primary}</div>
      <div style={{ fontSize: 12, color: '#cbd5f5' }}>{secondary}</div>
    </div>
  );
}
