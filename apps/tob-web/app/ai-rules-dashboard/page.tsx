/**
 * ai-rules-dashboard/page.tsx — AI 决策规则仪表盘
 *
 * 角色视角: 👔 租户管理员 / 🧠 AI 运营
 * 功能: 展示 AI 决策规则的概览、分类统计、规则列表，支持按状态/分类筛选
 */
'use client';

import React, { useMemo, useState } from 'react';
import {
  PageShell,
  StatCard,
  StatusBadge,
} from '@m5/ui';
import {
  MOCK_AI_RULES,
  RULE_CATEGORY_LABEL,
  RULE_CATEGORY_EMOJI,
  RULE_STATUS_LABEL,
  RULE_PRIORITY_LABEL,
  formatExecutionCount,
  formatLatency,
  getSuccessRateVariant,
  computeSummary,
  RULE_CATEGORIES,
  RULE_STATUSES,
  type AiRuleItem,
  type RuleCategory,
  type RuleStatus,
} from './rules-data';

function getStatusVariant(status: RuleStatus): 'success' | 'warning' | 'error' | 'info' {
  switch (status) {
    case 'active':
      return 'success';
    case 'paused':
      return 'warning';
    case 'draft':
      return 'info';
    case 'archived':
      return 'error';
  }
}

export default function AiRulesDashboardPage() {
  const [filterCategory, setFilterCategory] = useState<RuleCategory | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<RuleStatus | 'all'>('all');

  const summary = useMemo(() => computeSummary(MOCK_AI_RULES), []);

  const filteredRules = useMemo(() => {
    return MOCK_AI_RULES.filter((r) => {
      if (filterCategory !== 'all' && r.category !== filterCategory) return false;
      if (filterStatus !== 'all' && r.status !== filterStatus) return false;
      return true;
    });
  }, [filterCategory, filterStatus]);

  return (
    <PageShell
      title="AI 决策规则"
      subtitle={`实时查看 AI 决策规则执行状态，共 ${summary.totalRules} 条规则`}
    >
      {/* 概览卡片 */}
      <div
        style={{
          display: 'grid',
          gap: 14,
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          marginBottom: 24,
        }}
      >
        <StatCard
          label="启用规则"
          value={String(summary.activeCount)}
          helper={`/ ${summary.totalRules} 条`}
          variant="success"
        />
        <StatCard
          label="总执行次数"
          value={formatExecutionCount(summary.totalExecutions)}
          helper="累计执行"
        />
        <StatCard
          label="平均成功率"
          value={`${summary.avgSuccessRate}%`}
          helper={summary.avgSuccessRate >= 95 ? '良好' : summary.avgSuccessRate >= 80 ? '一般' : '需关注'}
        />
        <StatCard
          label="平均延迟"
          value={formatLatency(summary.avgLatencyMs)}
          helper={summary.avgLatencyMs < 100 ? '低延迟' : '中延迟'}
        />
      </div>

      {/* 分类统计快速入口 */}
      <div
        style={{
          display: 'grid',
          gap: 10,
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          marginBottom: 24,
        }}
      >
        {RULE_CATEGORIES.map((cat) => {
          const count = MOCK_AI_RULES.filter((r) => r.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(filterCategory === cat ? 'all' : cat)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 14px',
                borderRadius: 10,
                background:
                  filterCategory === cat
                    ? 'rgba(102, 126, 234, 0.2)'
                    : 'rgba(15, 23, 42, 0.5)',
                border:
                  filterCategory === cat
                    ? '1px solid rgba(102, 126, 234, 0.5)'
                    : '1px solid rgba(148, 163, 184, 0.12)',
                color: filterCategory === cat ? '#a5b4fc' : '#cbd5e1',
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.15s',
                textAlign: 'left' as const,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(102, 126, 234, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  filterCategory === cat
                    ? 'rgba(102, 126, 234, 0.2)'
                    : 'rgba(15, 23, 42, 0.5)';
                e.currentTarget.style.borderColor =
                  filterCategory === cat
                    ? 'rgba(102, 126, 234, 0.5)'
                    : 'rgba(148, 163, 184, 0.12)';
              }}
            >
              <span style={{ fontSize: 18 }}>{RULE_CATEGORY_EMOJI[cat]}</span>
              <div>
                <div style={{ fontWeight: 600 }}>{RULE_CATEGORY_LABEL[cat]}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{count} 条规则</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 状态过滤条 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilterStatus('all')}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            background: filterStatus === 'all' ? 'rgba(102, 126, 234, 0.2)' : 'rgba(15, 23, 42, 0.3)',
            border: `1px solid ${filterStatus === 'all' ? 'rgba(102, 126, 234, 0.5)' : 'rgba(148, 163, 184, 0.12)'}`,
            color: filterStatus === 'all' ? '#a5b4fc' : '#94a3b8',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          全部
        </button>
        {RULE_STATUSES.map((st) => {
          const count = MOCK_AI_RULES.filter((r) => r.status === st).length;
          return (
            <button
              key={st}
              onClick={() => setFilterStatus(filterStatus === st ? 'all' : st)}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                background: filterStatus === st ? 'rgba(102, 126, 234, 0.2)' : 'rgba(15, 23, 42, 0.3)',
                border: `1px solid ${filterStatus === st ? 'rgba(102, 126, 234, 0.5)' : 'rgba(148, 163, 184, 0.12)'}`,
                color: filterStatus === st ? '#a5b4fc' : '#94a3b8',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {RULE_STATUS_LABEL[st]} ({count})
            </button>
          );
        })}
      </div>

      {/* 规则列表 */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.5)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {filteredRules.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
            暂无匹配的规则
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
                }}
              >
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: '#94a3b8' }}>
                  规则名称
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: '#94a3b8' }}>
                  分类
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#94a3b8' }}>
                  优先级
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#94a3b8' }}>
                  执行次数
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#94a3b8' }}>
                  成功率
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#94a3b8' }}>
                  延迟
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#94a3b8' }}>
                  状态
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRules.map((rule, index) => (
                <tr
                  key={rule.id}
                  style={{
                    borderBottom:
                      index < filteredRules.length - 1
                        ? '1px solid rgba(148, 163, 184, 0.08)'
                        : 'none',
                    transition: 'background 0.15s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontSize: 14, color: '#f8fafc', fontWeight: 500 }}>
                      {rule.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                      {rule.description}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span
                      style={{
                        fontSize: 13,
                        color: '#cbd5e1',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {RULE_CATEGORY_EMOJI[rule.category]} {RULE_CATEGORY_LABEL[rule.category]}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <span
                      style={{
                        fontSize: 12,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background:
                          rule.priority <= 2
                            ? 'rgba(239, 68, 68, 0.15)'
                            : rule.priority <= 3
                              ? 'rgba(234, 179, 8, 0.15)'
                              : 'rgba(148, 163, 184, 0.1)',
                        color:
                          rule.priority <= 2
                            ? '#fca5a5'
                            : rule.priority <= 3
                              ? '#fde047'
                              : '#94a3b8',
                      }}
                    >
                      {RULE_PRIORITY_LABEL[rule.priority]}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center', fontSize: 13, color: '#cbd5e1', fontFamily: 'monospace' }}>
                    {formatExecutionCount(rule.executionCount)}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <StatusBadge
                      label={`${rule.successRate}%`}
                      variant={getSuccessRateVariant(rule.successRate)}
                      size="sm"
                    />
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center', fontSize: 13, color: '#cbd5e1', fontFamily: 'monospace' }}>
                    {rule.avgLatencyMs > 0 ? formatLatency(rule.avgLatencyMs) : '-'}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <StatusBadge
                      label={RULE_STATUS_LABEL[rule.status]}
                      variant={getStatusVariant(rule.status)}
                      size="sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PageShell>
  );
}
