/**
 * AI决策详情页 — AI Decision Detail (Next.js App Router Page)
 * 展示单条规则执行的完整结果、决策过程、影响范围及处置建议
 */
'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { notFound } from 'next/navigation';
import {
  AIDecisionPanel,
  DecisionAuditTrail,
  DrilldownTrendCard,
  StatusBadge,
  DetailShell,
  DetailActionBar,
  DetailClosureBar,
  Spinner,
} from '@m5/ui';
import type {
  DecisionRuleResult,
  DecisionPanelConfig,
  AuditEntry,
  SparklinePoint,
  AuditAction,
} from '@m5/ui';

// ============================================================
// Mock 数据 — 使用 DecisionRuleResult
// ============================================================

const MOCK_RESULTS: DecisionRuleResult[] = [
  {
    ruleId: 'r1',
    ruleName: '会员折扣合规校验',
    detail: '检查折扣是否超过会员等级允许的上限',
    triggered: false,
    confidence: 0.95,
    suggestion: '所有折扣均在合规范围内',
    executedAt: new Date(Date.now() - 60000).toISOString(),
  },
  {
    ruleId: 'r2',
    ruleName: '库存流动性检测',
    detail: '检查近7天未动销商品',
    triggered: true,
    confidence: 0.78,
    suggestion: '建议对以下15个SKU执行促销清仓方案',
    executedAt: new Date(Date.now() - 120000).toISOString(),
  },
  {
    ruleId: 'r3',
    ruleName: '价格一致性校验',
    detail: '检查门店价与平台价是否一致',
    triggered: true,
    confidence: 0.85,
    suggestion: '3个商品存在价差，请立即更新门店价格',
    executedAt: new Date(Date.now() - 180000).toISOString(),
  },
  {
    ruleId: 'r4',
    ruleName: '促销叠加规则检测',
    detail: '检测是否存在多个促销叠加导致亏损风险',
    triggered: false,
    confidence: 0.97,
    suggestion: '未发现风险叠加',
    executedAt: new Date(Date.now() - 240000).toISOString(),
  },
];

const MOCK_DECISION_CONFIG: DecisionPanelConfig = {
  autoRefreshMs: 15000,
  maxEvents: 10,
};

const MOCK_AUDIT_ENTRIES: AuditEntry[] = [
  { id: 'a1', action: 'trigger' as AuditAction, message: '定时任务触发规则评估', actor: '系统自动', timestamp: new Date(Date.now() - 300000).toISOString(), severity: 'info' as const },
  { id: 'a2', action: 'collect' as AuditAction, message: '完成136条相关数据采集', actor: '系统自动', timestamp: new Date(Date.now() - 240000).toISOString(), severity: 'info' as const },
  { id: 'a3', action: 'evaluate' as AuditAction, message: '完成6条规则评估', actor: 'AI引擎', timestamp: new Date(Date.now() - 180000).toISOString(), severity: 'info' as const },
  { id: 'a4', action: 'generate' as AuditAction, message: '生成执行结果及建议', actor: 'AI引擎', timestamp: new Date(Date.now() - 60000).toISOString(), severity: 'success' as const },
  { id: 'a5', action: 'review' as AuditAction, message: '已查看决策结果', actor: '张店长', timestamp: new Date(Date.now() - 5000).toISOString(), severity: 'info' as const },
];

const MOCK_SPARKLINE: SparklinePoint[] = [
  { label: '06-21', value: 45 },
  { label: '06-22', value: 52 },
  { label: '06-23', value: 38 },
  { label: '06-24', value: 61 },
  { label: '06-25', value: 55 },
  { label: '06-26', value: 73 },
  { label: '06-27', value: 128 },
];

// ============================================================
// Page Component
// ============================================================

interface AIDecisionDetailPageProps {
  params: Promise<{ id: string }>;
}

/** Map triggered status to variant label */
function statusToVariant(triggered: boolean): 'success' | 'warning' | 'error' {
  return triggered ? 'warning' : 'success';
}

/** Map triggered status to Chinese label */
function statusToLabel(triggered: boolean): string {
  return triggered ? '已触发' : '通过';
}

export default function AIDecisionDetailPage({ params }: AIDecisionDetailPageProps) {
  const [resolved, setResolved] = useState(false);
  const [decisionId, setDecisionId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Resolve route params
  React.useEffect(() => {
    params.then((p) => {
      setDecisionId(p.id);
      setResolved(true);
    });
  }, [params]);

  const focusedResult = useMemo(() => {
    if (!decisionId) return null;
    return MOCK_RESULTS.find((r) => r.ruleId === decisionId) ?? null;
  }, [decisionId]);

  const handleAction = useCallback(async (action: string) => {
    setActionLoading(action);
    await new Promise((r) => setTimeout(r, 800));
    setActionLoading(null);
  }, []);

  // Loading state
  if (!resolved) {
    return (
      <DetailShell
        title="AI决策详情"
        subtitle="加载中…"
        loading
      />
    );
  }

  // Not found
  if (!focusedResult) {
    notFound();
    return null;
  }

  const variant = statusToVariant(focusedResult.triggered);
  const statusLabel = statusToLabel(focusedResult.triggered);
  /* Approximate "matched count" from confidence for display */
  const approxMatched = focusedResult.triggered ? Math.round(focusedResult.confidence * 50) : 0;

  const actionBar = (
    <DetailActionBar
      actions={[
        {
          key: 're-run',
          label: actionLoading === 're-run' ? '重新执行中…' : '重新执行',
          variant: 'primary' as const,
          disabled: actionLoading !== null,
          onClick: () => { handleAction('re-run'); },
        },
        {
          key: 'override',
          label: actionLoading === 'override' ? '提交中…' : '覆盖结果',
          disabled: actionLoading !== null,
          onClick: () => { handleAction('override'); },
        },
      ]}
    />
  );

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{focusedResult.ruleName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge variant={variant} label={statusLabel} />
            <span className="text-sm text-muted-foreground">
              执行于 {new Date(focusedResult.executedAt ?? '').toLocaleString('zh-CN')}
            </span>
          </div>
        </div>
        {actionBar}
      </div>

      {/* 决策面板 — 使用新版 props */}
      <AIDecisionPanel variant="pc" config={MOCK_DECISION_CONFIG} />

      {/* 命中趋势 */}
      <DrilldownTrendCard
        label="命中数（近7天）"
        value={approxMatched}
        trendDirection={approxMatched > 50 ? 'up' : 'down'}
        trendValue={approxMatched > 50 ? '+↑ 偏高' : '正常'}
        variant={focusedResult.triggered ? 'warning' : 'success'}
        sparklineData={MOCK_SPARKLINE}
        description={`规则 ${focusedResult.ruleName} 共命中 ${approxMatched} 条记录`}
      />

      {/* 审计追踪 */}
      <DecisionAuditTrail entries={MOCK_AUDIT_ENTRIES} />

      {/* 底部导航 */}
      <DetailClosureBar
        links={[
          { key: 'back', title: '← 返回决策列表', subtitle: '回到 AI 决策管理', href: '/ai-decisions' },
          { key: 'ops', title: '查看运营面板 →', subtitle: '打开运营管理面板', href: '/operations' },
        ]}
      />
    </div>
  );
}
