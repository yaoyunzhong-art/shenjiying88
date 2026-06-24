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
  buildFoundationModuleDetailHref,
  type FoundationConsumerDescriptor,
  type FoundationGovernanceBaseline,
  type FoundationModuleDescriptor,
  type FoundationModuleKey,
  type FoundationWorkspaceQuery
} from '@m5/types';
import {
  formatFoundationHealthLabel,
  summarizeFoundationConsumer,
  summarizeFoundationModule,
  summarizeGovernanceBaseline,
  type FoundationWorkspaceData
} from '../foundation-view-model';
import { useDetailActions } from '../components/use-detail-actions';

interface FoundationWorkspaceClientProps {
  workspace: FoundationWorkspaceData;
  query: Required<FoundationWorkspaceQuery>;
}

type TabKey = 'overview' | 'modules' | 'consumers' | 'baselines';

export default function FoundationWorkspaceClient({ workspace, query }: FoundationWorkspaceClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [search, setSearch] = useState('');
  const { actions } = useDetailActions({
    workspace: 'foundation',
    detailId: query.moduleKey ?? 'overview',
    record: workspace,
    shareTitle: 'Foundation 工作台',
    shareText: '查看 Foundation 模块/消费方/治理基线'
  });

  const filteredModules = useMemo(() => {
    return workspace.blueprint.modules.filter((item) => {
      if (!search.trim()) {
        return true;
      }
      return `${item.key} ${item.name} ${item.purpose}`.toLowerCase().includes(search.toLowerCase());
    });
  }, [search, workspace.blueprint.modules]);

  const filteredConsumers = useMemo(() => {
    return workspace.blueprint.consumers.filter((item) => {
      if (!search.trim()) {
        return true;
      }
      return `${item.consumer} ${item.modulePath} ${item.responsibility} ${item.dependsOn.join(' ')}`
        .toLowerCase()
        .includes(search.toLowerCase());
    });
  }, [search, workspace.blueprint.consumers]);

  const filteredBaselines = useMemo(() => {
    return workspace.blueprint.governanceBaselines.filter((item) => {
      if (!search.trim()) {
        return true;
      }
      return `${item.key} ${item.name} ${item.ownerModule} ${item.summary}`.toLowerCase().includes(search.toLowerCase());
    });
  }, [search, workspace.blueprint.governanceBaselines]);

  const moduleColumns: DataTableColumn<FoundationModuleDescriptor>[] = [
    {
      key: 'module',
      title: '模块',
      render: (item) => (
        <div>
          <Link
            href={buildFoundationModuleDetailHref(item.key)}
            style={{ fontFamily: 'monospace', fontSize: 12, color: '#93c5fd', textDecoration: 'none' }}
          >
            {item.key}
          </Link>
          <div style={{ fontSize: 11, color: '#64748b' }}>{summarizeFoundationModule(item)}</div>
        </div>
      )
    },
    {
      key: 'purpose',
      title: '职责',
      render: (item) => item.purpose
    },
    {
      key: 'capabilities',
      title: '能力数',
      render: (item) => `${item.capabilities.length}`
    },
    {
      key: 'contracts',
      title: '关键契约',
      render: (item) => `${item.inboundContracts.length} 入站 / ${item.outboundContracts.length} 出站`
    },
    {
      key: 'workspace',
      title: '工作台',
      render: (item) => {
        const href = getModuleWorkspaceHref(item.key);
        return href ? (
          <Link href={href} style={linkStyle}>
            打开工作台
          </Link>
        ) : '—';
      }
    }
  ];

  const consumerColumns: DataTableColumn<FoundationConsumerDescriptor>[] = [
    {
      key: 'consumer',
      title: '消费方',
      render: (item) => (
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#93c5fd' }}>{item.consumer}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>{summarizeFoundationConsumer(item)}</div>
        </div>
      )
    },
    {
      key: 'responsibility',
      title: '责任',
      render: (item) => item.responsibility
    },
    {
      key: 'dependsOn',
      title: '依赖模块',
      render: (item) => item.dependsOn.join(', ')
    },
    {
      key: 'highRiskEntrypoints',
      title: '高风险入口',
      render: (item) => item.highRiskEntrypoints.join(', ') || '—'
    }
  ];

  const baselineColumns: DataTableColumn<FoundationGovernanceBaseline>[] = [
    {
      key: 'name',
      title: '治理基线',
      render: (item) => (
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#93c5fd' }}>{item.key}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>{summarizeGovernanceBaseline(item)}</div>
        </div>
      )
    },
    {
      key: 'ownerModule',
      title: 'Owner',
      render: (item) => item.ownerModule
    },
    {
      key: 'summary',
      title: '摘要',
      render: (item) => item.summary
    },
    {
      key: 'controls',
      title: '控制项',
      render: (item) => item.controls.join(', ')
    }
  ];

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ marginBottom: 4 }}>
        <Tabs
          items={[
            { key: 'overview', label: '总览' },
            { key: 'modules', label: '模块目录', count: workspace.summary.modules },
            { key: 'consumers', label: '消费方', count: workspace.summary.consumers },
            { key: 'baselines', label: '治理基线', count: workspace.summary.governanceBaselines }
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
          placeholder={`搜索${activeTab === 'modules' ? '模块' : activeTab === 'consumers' ? '消费方' : '治理基线'}...`}
        />
      ) : null}

      {activeTab === 'overview' ? (
        <>
          <div style={overviewGridStyle}>
            <SummaryCard title="模块数" value={`${workspace.summary.modules}`} detail="foundation module catalog" />
            <SummaryCard title="能力数" value={`${workspace.summary.capabilities}`} detail="模块 capability 总数" />
            <SummaryCard title="消费方" value={`${workspace.summary.consumers}`} detail="market / portal / workbench / adapter" />
            <SummaryCard title="治理基线" value={`${workspace.summary.governanceBaselines}`} detail="统一 guardrails 与证据要求" />
            <SummaryCard title="告警" value={`${workspace.summary.alerts}`} detail="foundation overview 当前可见 alerts" />
            <SummaryCard title="Top Risk" value={`${workspace.summary.topRisks}`} detail="overview top risks 数量" />
          </div>

          <div style={panelGridStyle}>
            <div style={panelStyle}>
              <div style={panelTitleStyle}>当前模块</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>
                  {workspace.selectedModule?.name ?? query.moduleKey}
                </div>
                <StatusBadge
                  label={formatFoundationHealthLabel(workspace.selectedModuleDetail.health?.status)}
                  variant={toBadgeVariant(workspace.selectedModuleDetail.health?.status)}
                  dot
                  size="sm"
                />
              </div>
              <div style={subtleTextStyle}>{workspace.selectedModule?.purpose ?? '暂无模块说明'}</div>
              <div style={{ marginTop: 10, fontSize: 12, color: '#cbd5f5' }}>
                评分 {workspace.selectedModuleDetail.health?.score ?? '—'} · 高风险 {workspace.selectedModuleDetail.health?.indicators.highRiskAudits ?? 0}
                {' / '}待处理 {workspace.selectedModuleDetail.health?.indicators.pendingApprovals ?? 0}
              </div>
              {getModuleWorkspaceHref(query.moduleKey as FoundationModuleKey) ? (
                <div style={{ marginTop: 12 }}>
                  <Link href={getModuleWorkspaceHref(query.moduleKey as FoundationModuleKey)!} style={linkStyle}>
                    进入对应工作台
                  </Link>
                </div>
              ) : null}
            </div>

            <div style={panelStyle}>
              <div style={panelTitleStyle}>当前消费方</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', marginBottom: 10 }}>
                {workspace.selectedConsumer?.consumer ?? query.consumer}
              </div>
              <div style={subtleTextStyle}>{workspace.selectedConsumer?.responsibility ?? '暂无消费方说明'}</div>
              <div style={{ marginTop: 10, fontSize: 12, color: '#cbd5f5' }}>
                依赖 {workspace.selectedConsumer?.dependsOn.join(', ') || '—'}
              </div>
            </div>
          </div>

          <div style={panelGridStyle}>
            <ListPanel title="文档" items={workspace.blueprint.docs} />
            <ListPanel title="Guardrails" items={workspace.blueprint.guardrails} />
          </div>
        </>
      ) : null}

      {activeTab === 'modules' ? (
        <DataTable
          title={`模块目录（${filteredModules.length}）`}
          columns={moduleColumns}
          items={filteredModules}
          rowKey={(item) => item.key}
          striped
          compact
        />
      ) : null}

      {activeTab === 'consumers' ? (
        <DataTable
          title={`消费方（${filteredConsumers.length}）`}
          columns={consumerColumns}
          items={filteredConsumers}
          rowKey={(item) => item.consumer}
          striped
          compact
        />
      ) : null}

      {activeTab === 'baselines' ? (
        <DataTable
          title={`治理基线（${filteredBaselines.length}）`}
          columns={baselineColumns}
          items={filteredBaselines}
          rowKey={(item) => item.key}
          striped
          compact
        />
      ) : null}

      <DetailActionBar
        actions={actions}
        heading="工作台收口动作"
        caption="复制 / 导出 / 分享当前 Foundation 工作台"
      />
    </div>
  );
}

function SummaryCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <div style={summaryCardStyle}>
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#93c5fd', marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#cbd5f5' }}>{detail}</div>
    </div>
  );
}

function ListPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <div style={panelStyle}>
      <div style={panelTitleStyle}>{title}</div>
      <div style={{ display: 'grid', gap: 8 }}>
        {items.map((item) => (
          <div key={item} style={listItemStyle}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function toBadgeVariant(status?: 'healthy' | 'warning' | 'critical') {
  if (status === 'critical') {
    return 'danger';
  }
  if (status === 'warning') {
    return 'warning';
  }
  return 'success';
}

function getModuleWorkspaceHref(moduleKey: FoundationModuleKey): string | null {
  if (moduleKey === 'identity-access') {
    return '/identity-access';
  }
  if (moduleKey === 'configuration-governance') {
    return '/configuration';
  }
  if (moduleKey === 'integration-orchestration') {
    return '/integration-orchestration';
  }
  if (moduleKey === 'trust-governance') {
    return '/audit-trail';
  }
  if (moduleKey === 'resilience-operations') {
    return '/resilience';
  }
  if (moduleKey === 'runtime-governance') {
    return '/operations';
  }
  return null;
}

const overviewGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'
};

const panelGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'
};

const summaryCardStyle: React.CSSProperties = {
  border: '1px solid rgba(148,163,184,0.18)',
  borderRadius: 12,
  padding: 16,
  background: 'rgba(15,23,42,0.55)'
};

const panelStyle: React.CSSProperties = {
  border: '1px solid rgba(148,163,184,0.18)',
  borderRadius: 12,
  padding: 16,
  background: 'rgba(15,23,42,0.55)'
};

const panelTitleStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#94a3b8',
  marginBottom: 12
};

const subtleTextStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#cbd5f5',
  lineHeight: 1.6
};

const listItemStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#e2e8f0',
  padding: '10px 12px',
  borderRadius: 10,
  background: 'rgba(30,41,59,0.65)'
};

const linkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  color: '#93c5fd',
  textDecoration: 'none',
  fontSize: 13,
  fontWeight: 600
};
