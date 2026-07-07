'use client';

import React, { useState } from 'react';

// ==================== 类型定义 ====================

/** 工具调用状态 */
export type ToolCallStatus =
  | 'pending'
  | 'running'
  | 'success'
  | 'error'
  | 'timeout';

/** 工具调用参数 */
export interface ToolCallParameter {
  /** 参数名 */
  name: string;
  /** 参数值 */
  value: string;
}

/** 单次工具调用记录 */
export interface ToolCallRecord {
  /** 工具调用 ID */
  id: string;
  /** 工具名称 */
  toolName: string;
  /** 工具显示标签 */
  toolLabel: string;
  /** 工具 emoji 图标 */
  toolIcon?: string;
  /** 调用状态 */
  status: ToolCallStatus;
  /** 调用参数 */
  parameters: ToolCallParameter[];
  /** 调用结果摘要 */
  resultSummary?: string;
  /** 错误信息 */
  errorMessage?: string;
  /** 开始时间 ISO */
  startedAt: string;
  /** 耗时(ms) */
  durationMs: number;
  /** 调用链层级（0 为根） */
  depth?: number;
  /** 子调用 */
  subCalls?: ToolCallRecord[];
}

/** AI Agent 工具调用面板 Props */
export interface AIAgentToolCallPanelProps {
  /** 工具调用记录 */
  calls: ToolCallRecord[];
  /** 面板标题 */
  title?: string;
  /** 是否默认展开所有 */
  defaultExpanded?: boolean;
  /** 是否紧凑模式 */
  compact?: boolean;
  /** 空状态文案 */
  emptyText?: string;
  /** 加载中 */
  loading?: boolean;
  /** 测试 id */
  'data-testid'?: string;
}

// ==================== 辅助函数 ====================

/** 状态样式配置 */
function statusStyle(status: ToolCallStatus): {
  label: string;
  color: string;
  bg: string;
} {
  switch (status) {
    case 'pending':
      return { label: '等待中', color: '#94a3b8', bg: 'rgba(148,163,184,0.08)' };
    case 'running':
      return { label: '执行中', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' };
    case 'success':
      return { label: '成功', color: '#4ade80', bg: 'rgba(74,222,128,0.12)' };
    case 'error':
      return { label: '失败', color: '#f87171', bg: 'rgba(248,113,113,0.12)' };
    case 'timeout':
      return { label: '超时', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' };
  }
}

/** 格式化耗时 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

/** 空状态组件 */
function EmptyState({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: 24,
        textAlign: 'center',
        color: '#475569',
        fontSize: 13,
      }}
    >
      🔧 {text}
    </div>
  );
}

/** 加载骨架 */
function LoadingState({ compact }: { compact?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            height: compact ? 36 : 48,
            borderRadius: 8,
            background: 'rgba(148,163,184,0.06)',
            animation: 'pulse 2s infinite',
          }}
        />
      ))}
    </div>
  );
}

/** 状态徽章 */
function StatusBadge({ status }: { status: ToolCallStatus }) {
  const s = statusStyle(status);
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: s.color,
        background: s.bg,
        padding: '2px 8px',
        borderRadius: 4,
        whiteSpace: 'nowrap',
      }}
    >
      {s.label}
    </span>
  );
}

/** 参数标签列表 */
function ParameterTags({ parameters }: { parameters: ToolCallParameter[] }) {
  if (!parameters.length) return null;
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {parameters.map((p, i) => (
        <span
          key={i}
          style={{
            fontSize: 11,
            color: '#94a3b8',
            background: 'rgba(15,23,42,0.5)',
            padding: '1px 6px',
            borderRadius: 4,
            border: '1px solid rgba(148,163,184,0.08)',
          }}
        >
          {p.name}
          {p.value ? (
            <span style={{ color: '#64748b', marginLeft: 2 }}>
              ={p.value.length > 20 ? `${p.value.slice(0, 20)}…` : p.value}
            </span>
          ) : null}
        </span>
      ))}
    </div>
  );
}

// ==================== 工具调用条目 ====================

function ToolCallItem({
  call,
  expanded,
  onToggle,
  depth = 0,
}: {
  call: ToolCallRecord;
  expanded: boolean;
  onToggle: () => void;
  depth: number;
}) {
  const hasChildren = call.subCalls && call.subCalls.length > 0;
  const indent = depth * 20;

  return (
    <div
      style={{
        marginLeft: indent,
      }}
    >
      {/* 主行 */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 10px',
          borderRadius: 8,
          cursor: 'pointer',
          transition: 'background 0.15s',
          background: 'rgba(15,23,42,0.3)',
          border: '1px solid rgba(148,163,184,0.06)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(30,41,59,0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(15,23,42,0.3)';
        }}
      >
        {/* 展开/折叠箭头 */}
        {hasChildren && (
          <span
            style={{
              fontSize: 10,
              color: '#64748b',
              transition: 'transform 0.2s',
              transform: expanded ? 'rotate(90deg)' : undefined,
              flexShrink: 0,
            }}
          >
            ▶
          </span>
        )}
        {!hasChildren && (
          <span style={{ width: 10, flexShrink: 0 }} />
        )}

        {/* 工具图标 */}
        <span style={{ fontSize: 16, flexShrink: 0 }}>
          {call.toolIcon ?? '🔧'}
        </span>

        {/* 工具名称 */}
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#e2e8f0',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {call.toolLabel}
        </span>

        {/* 状态 */}
        <StatusBadge status={call.status} />

        {/* 耗时 */}
        <span
          style={{
            fontSize: 11,
            color: '#64748b',
            fontVariantNumeric: 'tabular-nums',
            flexShrink: 0,
            minWidth: 48,
            textAlign: 'right',
          }}
        >
          {formatDuration(call.durationMs)}
        </span>
      </div>

      {/* 展开详情 */}
      {expanded && (
        <div
          style={{
            marginTop: 6,
            marginBottom: 6,
            padding: '10px 14px',
            borderRadius: 8,
            background: 'rgba(15,23,42,0.2)',
            border: '1px solid rgba(148,163,184,0.04)',
          }}
        >
          {/* 参数 */}
          {call.parameters.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div
                style={{
                  fontSize: 11,
                  color: '#64748b',
                  fontWeight: 500,
                  marginBottom: 4,
                }}
              >
                参数
              </div>
              <ParameterTags parameters={call.parameters} />
            </div>
          )}

          {/* 结果 */}
          {call.resultSummary && (
            <div style={{ marginBottom: call.errorMessage ? 8 : 0 }}>
              <div
                style={{
                  fontSize: 11,
                  color: '#64748b',
                  fontWeight: 500,
                  marginBottom: 4,
                }}
              >
                结果
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: '#94a3b8',
                  lineHeight: 1.5,
                  padding: '6px 10px',
                  borderRadius: 6,
                  background: 'rgba(0,0,0,0.2)',
                  fontFamily: 'monospace',
                }}
              >
                {call.resultSummary}
              </div>
            </div>
          )}

          {/* 错误 */}
          {call.errorMessage && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: '#64748b',
                  fontWeight: 500,
                  marginBottom: 4,
                }}
              >
                错误
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: '#fca5a5',
                  lineHeight: 1.5,
                  padding: '6px 10px',
                  borderRadius: 6,
                  background: 'rgba(248,113,113,0.06)',
                  border: '1px solid rgba(248,113,113,0.12)',
                }}
              >
                {call.errorMessage}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 子工具调用 */}
      {expanded && hasChildren && call.subCalls && (
        <div style={{ marginTop: 4 }}>
          {call.subCalls.map((sub) => (
            <ToolCallItem
              key={sub.id}
              call={sub}
              expanded={expanded}
              onToggle={onToggle}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== 主组件 ====================

/**
 * AIAgentToolCallPanel — AI 智能体工具调用面板。
 *
 * 展示 AI Agent 调用的工具链、参数、结果和耗时，
 * 适用于监控/调试场景，帮助开发者和运维人员追踪
 * AI Agent 的行为和执行路径。
 *
 * 特性：
 * - 工具调用链可视化（含层级缩进）
 * - 状态标签（等待中/执行中/成功/失败/超时）
 * - 耗时展示
 * - 参数/结果/错误详情展开
 * - 子调用展开折叠
 * - 加载态 / 空状态
 *
 * @example
 * // 基础用法
 * <AIAgentToolCallPanel
 *   title="工具调用链"
 *   calls={[
 *     {
 *       id: '1',
 *       toolName: 'search_products',
 *       toolLabel: '商品搜索',
 *       toolIcon: '🔍',
 *       status: 'success',
 *       parameters: [{ name: 'keyword', value: '夏季连衣裙' }],
 *       resultSummary: '找到 15 件商品',
 *       startedAt: '2026-07-07T04:00:00Z',
 *       durationMs: 320,
 *     },
 *   ]}
 * />
 */
export function AIAgentToolCallPanel({
  calls,
  title = '工具调用链',
  defaultExpanded = false,
  compact = false,
  emptyText = '暂无工具调用记录',
  loading = false,
  'data-testid': testId = 'ai-agent-tool-call-panel',
}: AIAgentToolCallPanelProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    if (defaultExpanded) {
      const allIds = new Set<string>();
      function collect(cs: ToolCallRecord[]) {
        for (const c of cs) {
          allIds.add(c.id);
          if (c.subCalls) collect(c.subCalls);
        }
      }
      collect(calls);
      return allIds;
    }
    return new Set<string>();
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  /** 所有调用是否成功 */
  const successCount = calls.filter((c) => c.status === 'success').length;
  const errorCount = calls.filter((c) => c.status === 'error' || c.status === 'timeout').length;
  const totalCount = calls.length;

  /** 汇总标签 */
  const summaryLabel = loading
    ? '加载中…'
    : calls.length === 0
      ? emptyText
      : errorCount > 0
        ? `${successCount}/${totalCount} 成功, ${errorCount} 异常`
        : `全部 ${totalCount} 个工具调用成功`;

  return (
    <div
      data-testid={testId}
      style={{
        borderRadius: 16,
        background: 'linear-gradient(135deg, rgba(30,41,59,0.6) 0%, rgba(15,23,42,0.5) 100%)',
        border: '1px solid rgba(148,163,184,0.12)',
        padding: compact ? 12 : 16,
      }}
    >
      {/* 标题栏 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: compact ? 8 : 12,
        }}
      >
        <span style={{ fontSize: compact ? 13 : 15 }}>🛠️</span>
        <span
          style={{
            fontSize: compact ? 13 : 14,
            fontWeight: 600,
            color: '#e2e8f0',
          }}
        >
          {title}
        </span>
        <span
          style={{
            fontSize: 11,
            color: errorCount > 0 ? '#f87171' : '#64748b',
            marginLeft: 4,
          }}
        >
          {summaryLabel}
        </span>
      </div>

      {/* 加载态 */}
      {loading && <LoadingState compact={compact} />}

      {/* 内容 */}
      {!loading && calls.length === 0 && <EmptyState text={emptyText} />}

      {!loading && calls.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {calls.map((call) => (
            <ToolCallItem
              key={call.id}
              call={call}
              expanded={expandedIds.has(call.id)}
              onToggle={() => toggleExpand(call.id)}
              depth={0}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default AIAgentToolCallPanel;
