'use client';

import React from 'react';

// ==================== 类型定义 ====================

/** 规则链节点状态 */
export type RuleNodeStatus = 'pending' | 'running' | 'passed' | 'blocked' | 'skipped' | 'error';

/** 规则链节点 */
export interface RuleChainNode {
  /** 节点 ID */
  id: string;
  /** 规则名称 */
  name: string;
  /** 规则描述 */
  description?: string;
  /** 执行状态 */
  status: RuleNodeStatus;
  /** 规则类型标签 */
  tag?: string;
  /** 耗时 (ms) */
  durationMs?: number;
  /** 置信度 0-1 */
  confidence?: number;
  /** 子节点（分支） */
  children?: RuleChainNode[];
  /** 输出信息 */
  output?: string;
}

/** 决策摘要 */
export interface DecisionSummary {
  /** 总规则数 */
  totalRules: number;
  /** 已触发数 */
  triggeredRules: number;
  /** 已阻塞数 */
  blockedRules: number;
  /** 总耗时 ms */
  totalDurationMs: number;
  /** 最终决策 */
  finalDecision?: 'approve' | 'reject' | 'review';
  /** 最终决策说明 */
  finalDecisionReason?: string;
}

/** 组件 Props */
export interface AIDecisionRuleChainProps {
  /** 规则链节点 */
  rules: RuleChainNode[];
  /** 决策摘要 */
  summary?: DecisionSummary;
  /** 标题 */
  title?: string;
  /** 精简模式（仅显示状态图标 + 名称） */
  compact?: boolean;
  /** 变体 */
  variant?: 'pc' | 'h5' | 'app' | 'pad' | 'miniprogram';
}

// ==================== 常量 ====================

const STATUS_CONFIG: Record<RuleNodeStatus, { icon: string; color: string; bg: string; label: string }> = {
  pending:  { icon: '⏳', color: '#8c8c8c', bg: '#f5f5f5', label: '待执行' },
  running:  { icon: '🔄', color: '#1677ff', bg: '#e6f4ff', label: '执行中' },
  passed:   { icon: '✅', color: '#52c41a', bg: '#f6ffed', label: '已通过' },
  blocked:  { icon: '🔴', color: '#f5222d', bg: '#fff2f0', label: '已拦截' },
  skipped:  { icon: '⏭️', color: '#8c8c8c', bg: '#fafafa', label: '已跳过' },
  error:    { icon: '⚠️', color: '#faad14', bg: '#fffbe6', label: '异常' },
};

const FINAL_DECISION_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  approve: { icon: '✅', color: '#52c41a', label: '通过' },
  reject:  { icon: '🔴', color: '#f5222d', label: '拒绝' },
  review:  { icon: '🟡', color: '#faad14', label: '人工审核' },
};

// ==================== 子组件 ====================

/** 单个规则节点 */
function RuleNodeItem({
  node,
  compact,
  depth = 0,
}: {
  node: RuleChainNode;
  compact?: boolean;
  depth?: number;
}) {
  const cfg = STATUS_CONFIG[node.status];

  return (
    <div data-testid={`rule-node-${node.id}`} style={{ marginLeft: depth * 20 }}>
      {/* 节点行 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 10px',
          marginBottom: 4,
          borderRadius: 8,
          background: cfg.bg,
          border: `1px solid ${cfg.color}22`,
        }}
      >
        {/* 状态图标 */}
        <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{cfg.icon}</span>

        {/* 名称 */}
        <span
          style={{
            flex: 1,
            fontSize: compact ? 12 : 13,
            fontWeight: 500,
            color: '#1f1f1f',
          }}
        >
          {node.name}
        </span>

        {/* 标签 */}
        {node.tag && (
          <span
            style={{
              fontSize: 10,
              padding: '1px 6px',
              borderRadius: 10,
              background: '#e6f4ff',
              color: '#1677ff',
              fontWeight: 500,
            }}
          >
            {node.tag}
          </span>
        )}

        {/* 置信度 */}
        {node.confidence !== undefined && (
          <span style={{ fontSize: 11, color: '#8c8c8c', minWidth: 40, textAlign: 'right' }}>
            {(node.confidence * 100).toFixed(0)}%
          </span>
        )}

        {/* 耗时 */}
        {node.durationMs !== undefined && (
          <span style={{ fontSize: 11, color: '#8c8c8c', minWidth: 40, textAlign: 'right' }}>
            {node.durationMs}ms
          </span>
        )}

        {/* 状态文字 */}
        <span
          style={{
            fontSize: 11,
            color: cfg.color,
            fontWeight: 500,
            minWidth: 40,
            textAlign: 'right',
          }}
        >
          {cfg.label}
        </span>
      </div>

      {/* 输出信息 */}
      {!compact && node.output && (
        <div
          style={{
            fontSize: 12,
            color: '#595959',
            padding: '4px 10px 4px 28px',
            marginBottom: 4,
          }}
        >
          💡 {node.output}
        </div>
      )}

      {/* 描述 */}
      {!compact && node.description && (
        <div
          style={{
            fontSize: 11,
            color: '#8c8c8c',
            padding: '2px 10px 6px 28px',
          }}
        >
          {node.description}
        </div>
      )}

      {/* 递归渲染子节点 */}
      {node.children?.map((child) => (
        <RuleNodeItem key={child.id} node={child} compact={compact} depth={depth + 1} />
      ))}

      {node.children && node.children.length > 0 && (
        <div
          style={{
            marginLeft: depth * 20 + 24,
            borderLeft: '2px dashed #d9d9d9',
            paddingLeft: 8,
            marginBottom: 4,
          }}
        />
      )}
    </div>
  );
}

/** 决策摘要栏 */
function DecisionSummaryBar({ summary }: { summary: DecisionSummary }) {
  const decisionCfg = summary.finalDecision
    ? FINAL_DECISION_CONFIG[summary.finalDecision]
    : null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '10px 12px',
        borderRadius: 10,
        background: decisionCfg
          ? `${decisionCfg.color}10`
          : 'rgba(15,23,42,0.06)',
        border: `1px solid ${decisionCfg ? decisionCfg.color + '30' : '#e8e8e8'}`,
        marginBottom: 12,
        flexWrap: 'wrap',
      }}
      data-testid="summary-bar"
    >
      {/* 最终决策 */}
      {decisionCfg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 16 }}>{decisionCfg.icon}</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: decisionCfg.color }}>
            {decisionCfg.label}
          </span>
        </div>
      )}

      {/* 统计 */}
      <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#595959' }}>
        <span data-testid="summary-total">📋 共 {summary.totalRules} 条规则</span>
        <span data-testid="summary-triggered" style={{ color: '#52c41a' }}>
          ✅ {summary.triggeredRules} 条通过
        </span>
        <span data-testid="summary-blocked" style={{ color: '#f5222d' }}>
          🔴 {summary.blockedRules} 条拦截
        </span>
        <span data-testid="summary-duration">⏱ {summary.totalDurationMs}ms</span>
      </div>

      {/* 决策说明 */}
      {summary.finalDecisionReason && (
        <div style={{ fontSize: 12, color: '#595959', flex: '1 1 100%', marginTop: 4 }}>
          📝 {summary.finalDecisionReason}
        </div>
      )}
    </div>
  );
}

// ==================== 主组件 ====================

/**
 * AIDecisionRuleChain — AI 决策规则链可视化组件
 *
 * 展示多层级规则链的执行路径、命中状态、耗时和置信度。
 * 适用于：
 * - 风控规则链执行结果展示
 * - AI 决策路径回溯
 * - 会员等级自动评估链路
 * - 积分风控规则执行展示
 *
 * @example
 * <AIDecisionRuleChain
 *   title="会员自动升级规则链"
 *   rules={[
 *     { id: 'r1', name: '消费门槛检查', status: 'passed', tag: '风控', confidence: 0.95, durationMs: 12 },
 *     { id: 'r2', name: '积分风控检查', status: 'blocked', tag: '风控', confidence: 0.3, durationMs: 8, output: '近30天积分突增300%' },
 *   ]}
 *   summary={{ totalRules: 3, triggeredRules: 2, blockedRules: 1, totalDurationMs: 45, finalDecision: 'review' }}
 * />
 */
export function AIDecisionRuleChain({
  rules,
  summary,
  title,
  compact = false,
  variant = 'pc',
}: AIDecisionRuleChainProps) {
  return (
    <div
      data-testid="decision-rule-chain"
      data-variant={variant}
      style={{
        borderRadius: 12,
        background: '#fff',
        border: '1px solid #e8e8e8',
        padding: 16,
      }}
    >
      {/* 标题 */}
      {title && (
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: '#1f1f1f',
            marginBottom: 12,
            paddingBottom: 8,
            borderBottom: '1px solid #f0f0f0',
          }}
          data-testid="chain-title"
        >
          🤖 {title}
        </div>
      )}

      {/* 决策摘要 */}
      {summary && <DecisionSummaryBar summary={summary} />}

      {/* 规则链 */}
      {rules.length === 0 ? (
        <div
          style={{
            padding: 24,
            textAlign: 'center',
            color: '#8c8c8c',
            fontSize: 13,
          }}
          data-testid="chain-empty"
        >
          暂无规则链数据
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }} data-testid="chain-list">
          {rules.map((node) => (
            <RuleNodeItem key={node.id} node={node} compact={compact} />
          ))}
        </div>
      )}
    </div>
  );
}
