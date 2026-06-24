'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  DataTable,
  DetailActionBar,
  SearchFilterInput,
  StatusBadge,
  Tabs,
  type DataTableColumn
} from '@m5/ui';
import {
  type QuotaLedgerRecord,
  type RateLimitPolicyRecord,
  type RateLimitWorkspace,
  buildRateLimitsLedgerDetailHref,
  buildRateLimitsPolicyDetailHref
} from '@m5/types';
import {
  RATE_LIMIT_ALGORITHM_LABEL,
  RATE_LIMIT_PERIOD_LABEL,
  RATE_LIMIT_SCOPE_LABEL,
  isLedgerBlocked,
  ledgerConsumptionRatio,
  summarizeLedger,
  summarizePolicy
} from '../rate-limits-view-model';
import { useDetailActions } from '../components/use-detail-actions';

interface RateLimitsWorkspaceClientProps {
  workspace: RateLimitWorkspace;
}

type TabKey = 'overview' | 'policies' | 'ledgers';

const STATUS_FILTER_OPTIONS = ['ALL', 'healthy', 'warning', 'blocked'] as const;

export default function RateLimitsWorkspaceClient({ workspace }: RateLimitsWorkspaceClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTER_OPTIONS)[number]>('ALL');
  const { actions } = useDetailActions({
    workspace: 'rate-limits',
    detailId: 'overview',
    record: workspace,
    shareTitle: '限流与配额工作台',
    shareText: '查看策略/账本快照'
  });

  const policyCounts = useMemo(() => {
    const counts = { total: workspace.policies.length, active: 0, inactive: 0 };
    for (const policy of workspace.policies) {
      if ((policy.limit ?? 0) > 0) {
        counts.active += 1;
      } else {
        counts.inactive += 1;
      }
    }
    return counts;
  }, [workspace]);

  const ledgerCounts = useMemo(() => {
    const counts: Record<(typeof STATUS_FILTER_OPTIONS)[number], number> = {
      ALL: workspace.ledgers.length,
      healthy: 0,
      warning: 0,
      blocked: 0
    };
    for (const ledger of workspace.ledgers) {
      if (isLedgerBlocked(ledger)) {
        counts.blocked += 1;
        continue;
      }
      const ratio = ledgerConsumptionRatio(ledger);
      counts[ratio >= 0.8 ? 'warning' : 'healthy'] += 1;
    }
    return counts;
  }, [workspace]);

  const filteredPolicies = useMemo(() => {
    return workspace.policies.filter((policy) => {
      if (search.trim().length === 0) {
        return true;
      }
      const haystack = `${policy.code} ${policy.tenantId ?? ''} ${policy.brandId ?? ''} ${policy.storeId ?? ''}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [workspace, search]);

  const filteredLedgers = useMemo(() => {
    return workspace.ledgers.filter((ledger) => {
      if (statusFilter === 'ALL') {
        return true;
      }
      if (statusFilter === 'blocked') {
        return isLedgerBlocked(ledger);
      }
      if (statusFilter === 'warning') {
        return ledgerConsumptionRatio(ledger) >= 0.8 && ledgerConsumptionRatio(ledger) < 1;
      }
      if (statusFilter === 'healthy') {
        return ledgerConsumptionRatio(ledger) < 0.8;
      }
      return true;
    }).filter((ledger) => {
      if (search.trim().length === 0) {
        return true;
      }
      const haystack = `${ledger.subjectKey} ${ledger.policy.code}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [workspace, statusFilter, search]);

  const policyColumns: DataTableColumn<RateLimitPolicyRecord>[] = useMemo(
    () => [
      {
        key: 'code',
        title: '策略 Code',
        dataKey: 'code',
        sortable: true,
        render: (item) => (
          <div>
            <Link
              href={buildRateLimitsPolicyDetailHref(item.id)}
              style={{ fontFamily: 'monospace', fontSize: 12, color: '#93c5fd', textDecoration: 'none' }}
            >
              {item.code}
            </Link>
            <div style={{ fontSize: 11, color: '#64748b' }}>{summarizePolicy(item)}</div>
          </div>
        )
      },
      {
        key: 'scopeType',
        title: '作用域',
        dataKey: 'scopeType',
        sortable: true,
        render: (item) => RATE_LIMIT_SCOPE_LABEL[item.scopeType as string] ?? item.scopeType
      },
      {
        key: 'period',
        title: '周期',
        dataKey: 'period',
        sortable: true,
        render: (item) => RATE_LIMIT_PERIOD_LABEL[item.period as string] ?? item.period
      },
      {
        key: 'limit',
        title: '限额',
        dataKey: 'limit',
        render: (item) => `${item.limit}${item.burstLimit ? ` · 突增 ${item.burstLimit}` : ''}`
      },
      {
        key: 'algorithm',
        title: '算法',
        dataKey: 'algorithm',
        render: (item) => RATE_LIMIT_ALGORITHM_LABEL[item.algorithm ?? ''] ?? item.algorithm ?? '—'
      },
      {
        key: 'updatedAt',
        title: '更新时间',
        dataKey: 'updatedAt',
        render: (item) => new Date(item.updatedAt).toLocaleString('zh-CN')
      }
    ],
    []
  );

  const ledgerColumns: DataTableColumn<QuotaLedgerRecord>[] = useMemo(
    () => [
      {
        key: 'subjectKey',
        title: '主题',
        dataKey: 'subjectKey',
        sortable: true,
        render: (item) => (
          <div>
            <Link
              href={buildRateLimitsLedgerDetailHref(item.id)}
              style={{ fontFamily: 'monospace', fontSize: 12, color: '#93c5fd', textDecoration: 'none' }}
            >
              {item.subjectKey}
            </Link>
            <div style={{ fontSize: 11, color: '#64748b' }}>{summarizeLedger(item)}</div>
          </div>
        )
      },
      {
        key: 'policyCode',
        title: '策略',
        render: (item) => (
          <Link
            href={buildRateLimitsPolicyDetailHref(item.policy.id)}
            style={{ color: '#93c5fd', textDecoration: 'none' }}
          >
            {item.policy.code}
          </Link>
        )
      },
      {
        key: 'consumed',
        title: '已用 / 上限',
        render: (item) => `${item.consumed} / ${item.policy.limit}`
      },
      {
        key: 'ratio',
        title: '占比',
        render: (item) => `${Math.round(ledgerConsumptionRatio(item) * 100)}%`
      },
      {
        key: 'status',
        title: '状态',
        render: (item) => {
          if (isLedgerBlocked(item)) {
            return <StatusBadge label="封禁" variant="danger" dot size="sm" />;
          }
          const ratio = ledgerConsumptionRatio(item);
          if (ratio >= 0.8) {
            return <StatusBadge label="告警" variant="warning" dot size="sm" />;
          }
          return <StatusBadge label="健康" variant="success" dot size="sm" />;
        }
      },
      {
        key: 'resetAt',
        title: '重置时间',
        dataKey: 'resetAt',
        render: (item) => new Date(item.resetAt).toLocaleString('zh-CN')
      }
    ],
    []
  );

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <Tabs
          items={[
            { key: 'overview', label: '总览' },
            { key: 'policies', label: '策略', count: policyCounts.total },
            { key: 'ledgers', label: '账本', count: workspace.totals.ledgers }
          ]}
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as TabKey)}
          variant="pills"
        />
      </div>

      {activeTab !== 'overview' ? (
        <SearchFilterInput
          value={search}
          onChange={setSearch}
          placeholder={`搜索 ${activeTab === 'policies' ? '策略' : '账本主题/策略'}...`}
        />
      ) : null}

      {activeTab === 'overview' ? <OverviewBoard workspace={workspace} /> : null}

      {activeTab === 'policies' ? (
        <div style={{ marginTop: 14 }}>
          <DataTable
            title={`策略（${filteredPolicies.length}）`}
            columns={policyColumns}
            items={filteredPolicies}
            rowKey={(item) => item.id}
            striped
            compact
          />
        </div>
      ) : null}

      {activeTab === 'ledgers' ? (
        <>
          <Tabs
            items={STATUS_FILTER_OPTIONS.map((option) => ({
              key: option,
              label: option === 'ALL' ? '全部' : option === 'healthy' ? '健康' : option === 'warning' ? '告警' : '封禁',
              count: ledgerCounts[option]
            }))}
            activeKey={statusFilter}
            onChange={(key) => setStatusFilter(key as (typeof STATUS_FILTER_OPTIONS)[number])}
            variant="pills"
            size="sm"
          />
          <div style={{ marginTop: 14 }}>
            <DataTable
              title={`配额账本（${filteredLedgers.length}）`}
              columns={ledgerColumns}
              items={filteredLedgers}
              rowKey={(item) => item.id}
              striped
              compact
            />
          </div>
        </>
      ) : null}

      <DetailActionBar
        actions={actions}
        heading="工作台收口动作"
        caption="复制 / 导出 / 分享当前限流工作台"
      />
    </div>
  );
}

function OverviewBoard({ workspace }: { workspace: RateLimitWorkspace }) {
  const { totals } = workspace;
  return (
    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
      <SummaryCard title="策略" primary={`${totals.policies}`} secondary={`活跃 ${totals.activePolicies}`} />
      <SummaryCard title="账本" primary={`${totals.ledgers}`} secondary="当前生效的配额账本" />
      <SummaryCard
        title="封禁账本"
        primary={`${totals.blockedLedgers}`}
        secondary="blockedUntil 仍处于未来时间窗"
        tone={totals.blockedLedgers > 0 ? 'danger' : 'normal'}
      />
      <SummaryCard
        title="高消耗账本"
        primary={`${totals.highConsumptionLedgers}`}
        secondary="剩余比例 < 20%"
        tone={totals.highConsumptionLedgers > 0 ? 'warning' : 'normal'}
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
  tone?: 'warning' | 'danger' | 'normal';
}) {
  const accent = tone === 'warning' ? '#fbbf24' : tone === 'danger' ? '#f87171' : '#93c5fd';
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
