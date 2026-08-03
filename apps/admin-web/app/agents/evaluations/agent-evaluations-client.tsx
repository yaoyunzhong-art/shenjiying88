'use client';

import { useMemo, useState } from 'react';
import {
  DataTable,
  SearchFilterInput,
  StatusBadge,
  Tabs,
  type DataTableColumn
} from '@m5/ui';
import type { QualityEvaluation } from '@m5/types';

interface AgentEvaluationsClientProps {
  evaluations: QualityEvaluation[];
  deliveryMode: 'api' | 'fallback';
  error?: string;
}

const DIMENSIONS: Array<{ key: keyof Pick<QualityEvaluation,
  'relevanceScore' | 'accuracyScore' | 'completenessScore' | 'safetyScore' | 'helpfulnessScore' | 'concisenessScore'>;
  short: string;
  full: string;
}> = [
  { key: 'relevanceScore', short: '相关性', full: '相关性' },
  { key: 'accuracyScore', short: '准确性', full: '准确性' },
  { key: 'completenessScore', short: '完整性', full: '完整性' },
  { key: 'safetyScore', short: '安全性', full: '安全性' },
  { key: 'helpfulnessScore', short: '有用性', full: '有用性' },
  { key: 'concisenessScore', short: '简洁性', full: '简洁性' }
];

function scoreColor(score: number): string {
  if (score >= 0.85) return '#4ade80';
  if (score >= 0.6) return '#fbbf24';
  return '#f87171';
}

function buildColumns(): DataTableColumn<QualityEvaluation>[] {
  return [
    {
      key: 'id',
      title: '评估 ID',
      dataKey: 'id',
      render: (item) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#93c5fd' }}>
          {item.id}
        </span>
      )
    },
    {
      key: 'sessionId',
      title: '关联会话',
      render: (item) => (
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#94a3b8' }}>
          {item.sessionId}
        </span>
      )
    },
    {
      key: 'userInput',
      title: '用户输入',
      render: (item) => (
        <div style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.userInput}
        </div>
      )
    },
    {
      key: 'overallScore',
      title: '总分',
      align: 'right',
      sortable: true,
      sortValue: (item) => item.overallScore,
      render: (item) => (
        <span style={{ fontVariantNumeric: 'tabular-nums', color: scoreColor(item.overallScore), fontWeight: 700 }}>
          {item.overallScore.toFixed(2)}
        </span>
      )
    },
    {
      key: 'scores',
      title: '6 维度评分',
      render: (item) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 280 }}>
          {DIMENSIONS.map((d) => {
            const s = item[d.key];
            return (
              <span
                key={d.key}
                title={`${d.full}: ${s.toFixed(3)}`}
                style={{
                  fontFamily: 'monospace',
                  fontSize: 10,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: `${scoreColor(s)}22`,
                  color: scoreColor(s),
                  border: `1px solid ${scoreColor(s)}44`
                }}
              >
                {d.short.slice(0, 2)} {s.toFixed(2)}
              </span>
            );
          })}
        </div>
      )
    },
    {
      key: 'passed',
      title: '结果',
      sortable: true,
      sortValue: (item) => item.overallScore,
      render: (item) => (
        <StatusBadge
          label={item.overallScore >= 0.6 ? '通过' : '未通过'}
          variant={item.overallScore >= 0.6 ? 'success' : 'danger'}
          size="sm"
          dot
        />
      )
    },
    {
      key: 'evaluatedAt',
      title: '评估时间',
      sortable: true,
      sortValue: (item) => item.evaluatedAt,
      render: (item) => (
        <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
          {item.evaluatedAt.slice(0, 19).replace('T', ' ')}
        </span>
      )
    }
  ];
}

export default function AgentEvaluationsClient({
  evaluations,
  deliveryMode,
  error
}: AgentEvaluationsClientProps) {
  const [search, setSearch] = useState('');
  const [resultFilter, setResultFilter] = useState<'all' | 'passed' | 'failed'>('all');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return evaluations.filter((e) => {
      if (resultFilter === 'passed' && e.overallScore < 0.6) return false;
      if (resultFilter === 'failed' && e.overallScore >= 0.6) return false;
      if (!term) return true;
      return `${e.id} ${e.sessionId} ${e.userInput} ${e.agentOutput}`.toLowerCase().includes(term);
    });
  }, [evaluations, search, resultFilter]);

  const columns = useMemo(() => buildColumns(), []);
  const passed = evaluations.filter((e) => e.overallScore >= 0.6).length;
  const failed = evaluations.length - passed;
  const latestEvaluatedAt = useMemo(() => {
    if (evaluations.length === 0) return '—';
    return evaluations.reduce((latest, item) =>
      item.evaluatedAt > latest ? item.evaluatedAt : latest
    , evaluations[0]!.evaluatedAt);
  }, [evaluations]);
  const sourceEvidence = useMemo(
    () => ({
      deliveryMode,
      controlPlaneSource:
        deliveryMode === 'api' ? 'loadAgentEvaluations' : 'FALLBACK_AGENT_EVALUATIONS',
      businessDataSource:
        deliveryMode === 'api' ? 'QualityEvaluation[] snapshot' : 'fallback quality evaluations',
      refreshPath: 'AgentEvaluationsPage -> loadAgentEvaluations',
      latestEvaluatedAt,
      note:
        deliveryMode === 'api'
          ? '评估中心当前直接消费实时 quality evaluation 快照，列表筛选与统计都以服务端首屏快照为准。'
          : '评估中心当前回退到 fallback quality evaluations，分数和反馈仅作为离线证据，不应误判为实时回归结果。'
    }),
    [deliveryMode, latestEvaluatedAt]
  );

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div
        style={{
          padding: '10px 14px',
          borderRadius: 8,
          background: 'rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(148, 163, 184, 0.18)',
          color: '#cbd5e1',
          fontSize: 12,
          lineHeight: 1.7
        }}
      >
        <div>
          Delivery {sourceEvidence.deliveryMode} · 控制面来源: {sourceEvidence.controlPlaneSource}
        </div>
        <div>
          业务数据: {sourceEvidence.businessDataSource} · 刷新路径: {sourceEvidence.refreshPath}
        </div>
        <div>
          latestEvaluatedAt: {sourceEvidence.latestEvaluatedAt}
        </div>
        <div style={{ color: '#94a3b8' }}>{sourceEvidence.note}</div>
      </div>
      {deliveryMode === 'fallback' ? (
        <div
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            color: '#fbbf24',
            fontSize: 12
          }}
        >
          ⚠️ 后端不可达,正在展示 fallback 数据 ({error ?? 'unknown error'})
        </div>
      ) : null}
      <Tabs
        items={[
          { key: 'all', label: '全部', count: evaluations.length },
          { key: 'passed', label: '通过', count: passed },
          { key: 'failed', label: '未通过', count: failed }
        ]}
        activeKey={resultFilter}
        onChange={(key) => setResultFilter(key as 'all' | 'passed' | 'failed')}
        variant="pills"
      />
      <SearchFilterInput
        value={search}
        onChange={setSearch}
        placeholder="搜索评估 ID、会话 ID、用户输入或输出..."
      />
      <DataTable columns={columns} data={filtered} rowKey={(item) => item.id} />
    </div>
  );
}
