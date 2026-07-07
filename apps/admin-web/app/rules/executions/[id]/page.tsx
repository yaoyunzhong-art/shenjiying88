'use client'

/**
 * Phase-41 T172: 规则执行结果详情页 (admin-web)
 *
 * 功能:
 *  - 展示单条规则执行记录的完整信息
 *  - 状态流转：重新执行 / 取消执行 / 删除记录
 *  - 执行上下文：输入/输出/错误详情
 *  - 关联查看规则配置
 */

import { use, useCallback, useMemo, useState } from 'react'
import { notFound, useRouter } from 'next/navigation'
import { PageShell, DetailActionBar, DetailClosureBar, StatusBadge, DescriptionList, Tag } from '@m5/ui'
import type { DescriptionItem } from '@m5/ui'

// ── Types ───────────────────────────────────────────────────────────────────

type ExecutionStatus = 'SUCCESS' | 'FAILURE' | 'RUNNING' | 'TIMEOUT'

interface RuleExecution {
  id: string
  ruleName: string
  ruleId: string
  ruleVersion: string
  status: ExecutionStatus
  triggeredBy: string
  triggerEventType: string
  durationMs: number
  inputSummary: string
  inputPayload: string
  outputSummary: string
  outputPayload: string
  errorMessage?: string
  errorStackTrace?: string
  retryCount: number
  executionNode: string
  createdAt: string
  completedAt?: string
}

// ── Mock data store ─────────────────────────────────────────────────────────

const STATUS_META: Record<ExecutionStatus, { label: string; color: string; bg: string }> = {
  SUCCESS: { label: '成功', color: '#065f46', bg: '#d1fae5' },
  FAILURE: { label: '失败', color: '#991b1b', bg: '#fee2e2' },
  RUNNING: { label: '进行中', color: '#1e40af', bg: '#dbeafe' },
  TIMEOUT: { label: '超时', color: '#92400e', bg: '#fef3c7' },
}

const RULE_NAMES = ['信用评分规则', '风控拦截规则', '会员升级规则', '优惠券发放规则', '异常登录检测规则', '批量通知规则', '库存预警规则']
const TRIGGER_EVENTS = ['member.register', 'order.created', 'cron.schedule', 'manual.execute', 'webhook.inbound']
const TRIGGER_LABELS = ['会员注册事件', '订单创建事件', '定时任务', '手动执行', 'Webhook']
const EXECUTION_NODES = ['cn-beijing-1a', 'cn-shanghai-2b', 'cn-shenzhen-3c']

function generateExecutions(): RuleExecution[] {
  return Array.from({ length: 47 }, (_, i) => {
    const statuses: ExecutionStatus[] = ['SUCCESS', 'FAILURE', 'RUNNING', 'TIMEOUT']
    const status = statuses[i % 4]!
    const durationMs = [230, 1500, 3200, 8900, 12000][i % 5]!
    const inputPayload = i % 3 === 0
      ? JSON.stringify({ type: 'order.created', orderId: `ORD-${1000 + i}`, amount: Math.round(Math.random() * 5000) / 100, memberTier: ['REGULAR', 'SILVER', 'GOLD', 'VIP'][i % 4] }, null, 2)
      : JSON.stringify({ type: 'member.login', memberId: `M${10000 + i}`, device: ['iOS', 'Android', 'Web'][i % 3], ip: `192.168.${i % 255}.${(i * 7) % 255}` }, null, 2)
    const triggerIdx = i % 5
    return {
      id: `exec-${i + 1}`,
      ruleName: RULE_NAMES[i % 7]!,
      ruleId: `rule-${Math.floor(i / 4) + 1}`,
      ruleVersion: `v${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 10)}.0`,
      status,
      triggeredBy: TRIGGER_LABELS[triggerIdx]!,
      triggerEventType: TRIGGER_EVENTS[triggerIdx]!,
      durationMs,
      inputSummary: i % 3 === 0 ? `事件: { type: "order.created", orderId: "ORD-${1000 + i}" }` : `事件: { type: "member.login", memberId: "M${10000 + i}" }`,
      inputPayload,
      outputSummary: status === 'SUCCESS' ? '规则匹配成功，动作已分发至下游' : status === 'FAILURE' ? `执行失败: 上游接口超时 (HTTP 504)` : status === 'RUNNING' ? '规则逻辑执行中...' : '超时: 超过最大执行时长 10s',
      outputPayload: status === 'SUCCESS'
        ? JSON.stringify({ matched: true, actions: [{ type: 'apply_coupon', couponId: 'CP-2024', value: 50 }, { type: 'notify', channel: 'sms', template: 'order_reward' }], duration: `${durationMs}ms` }, null, 2)
        : status === 'FAILURE'
          ? JSON.stringify({ matched: false, error: { code: 'UPSTREAM_TIMEOUT', service: 'coupon-service', httpStatus: 504 }, attempt: i % 3 }, null, 2)
          : status === 'TIMEOUT'
            ? JSON.stringify({ matched: false, error: { code: 'EXECUTION_TIMEOUT', limit: '10000ms' }, elapsed: `${durationMs}ms` }, null, 2)
            : JSON.stringify({ stage: 'evaluating_condition', elapsed: `${durationMs}ms` }, null, 2),
      errorMessage: status === 'FAILURE' ? `上游服务 ${['unavailable', 'rate-limited', 'internal-error'][i % 3]}` : undefined,
      errorStackTrace: status === 'FAILURE'
        ? `Error: upstream service unavailable\n    at executeRule (/runtime/engine/executor.ts:142:15)\n    at evaluateCondition (/runtime/engine/evaluator.ts:89:11)\n    at RuleEngine.run (/runtime/engine/index.ts:56:22)\nCaused by: HTTP 504 Gateway Timeout\n    at HttpClient.request (/runtime/http/client.ts:203:18)`
        : undefined,
      retryCount: status === 'FAILURE' ? (i % 3) : 0,
      executionNode: EXECUTION_NODES[i % 3]!,
      createdAt: new Date(Date.now() - i * 3600000 - Math.random() * 86400000).toISOString(),
      completedAt: status !== 'RUNNING' ? new Date(Date.now() - i * 3600000 - Math.random() * 86400000 + durationMs).toISOString() : undefined,
    }
  })
}

const EXECUTIONS = generateExecutions()

function getExecutionById(id: string): RuleExecution | undefined {
  return EXECUTIONS.find(e => e.id === id)
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`
}

function formatDateTime(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  return `${days}天前`
}

// ── Component ───────────────────────────────────────────────────────────────

export default function RuleExecutionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const execution = useMemo(() => getExecutionById(id), [id])

  const [toast, setToast] = useState<string | null>(null)
  const [status, setStatus] = useState<ExecutionStatus | null>(null)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }, [])

  const handleRerun = useCallback(() => {
    showToast('已重新提交执行请求，请稍后查看结果')
    setStatus('RUNNING')
  }, [showToast])

  const handleCancel = useCallback(() => {
    showToast('已取消执行')
    setStatus('TIMEOUT')
  }, [showToast])

  const handleDelete = useCallback(() => {
    showToast('记录已删除')
    setTimeout(() => router.push('/rules/executions'), 300)
  }, [showToast, router])

  if (!execution) {
    notFound()
  }

  const currentStatus = status ?? execution.status
  const statusMeta = STATUS_META[currentStatus]

  const infoItems: DescriptionItem[] = [
    { label: '执行记录 ID', value: execution.id },
    { label: '规则名称', value: execution.ruleName },
    { label: '规则 ID', value: execution.ruleId },
    { label: '规则版本', value: execution.ruleVersion },
    { label: '触发上下文', value: execution.triggeredBy },
    { label: '触发事件类型', value: execution.triggerEventType },
    { label: '状态', value: currentStatus },
    { label: '耗时', value: formatDuration(execution.durationMs) },
    { label: '重试次数', value: String(execution.retryCount) },
    { label: '执行节点', value: execution.executionNode },
    { label: '执行时间', value: formatDateTime(execution.createdAt) },
    { label: '完成时间', value: formatDateTime(execution.completedAt) },
  ]

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: 32 }}>
      {toast && (
        <div
          style={{
            position: 'fixed', top: 24, right: 24, zIndex: 9999,
            padding: '12px 24px', borderRadius: 12, background: '#22c55e',
            color: '#fff', fontWeight: 600, fontSize: 14,
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}
        >
          {toast}
        </div>
      )}

      <PageShell
        title={`执行记录 · ${execution.ruleName}`}
        subtitle={`ID: ${execution.id} · ${formatRelativeTime(execution.createdAt)}`}
      >
        {/* 状态与操作 */}
        <div
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 20px', borderRadius: 12,
            background: statusMeta.bg, color: statusMeta.color,
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <StatusBadge label={statusMeta.label} />
            <span style={{ fontWeight: 600, fontSize: 15 }}>{currentStatus}</span>
            <span style={{ fontSize: 13, opacity: 0.8 }}>
              耗时 {formatDuration(execution.durationMs)}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {currentStatus === 'FAILURE' || currentStatus === 'TIMEOUT' ? (
              <button
                onClick={handleRerun}
                style={{
                  padding: '8px 20px', borderRadius: 8, border: 'none',
                  background: '#2563eb', color: '#fff', fontWeight: 600,
                  fontSize: 13, cursor: 'pointer',
                }}
              >
                重新执行
              </button>
            ) : null}
            {currentStatus === 'RUNNING' ? (
              <button
                onClick={handleCancel}
                style={{
                  padding: '8px 20px', borderRadius: 8, border: '1px solid #d1d5db',
                  background: '#fff', color: '#374151', fontWeight: 600,
                  fontSize: 13, cursor: 'pointer',
                }}
              >
                取消执行
              </button>
            ) : null}
            <button
              onClick={handleDelete}
              style={{
                padding: '8px 20px', borderRadius: 8, border: '1px solid #fca5a5',
                background: '#fff', color: '#dc2626', fontWeight: 600,
                fontSize: 13, cursor: 'pointer',
              }}
            >
              删除记录
            </button>
          </div>
        </div>

        {/* 基本信息 */}
        <div
          style={{
            background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb',
            padding: 20, marginBottom: 20,
          }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 16 }}>
            基本信息
          </h3>
          <DescriptionList items={infoItems} columns={2} />
        </div>

        {/* 输入载荷 */}
        <div
          style={{
            background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb',
            padding: 20, marginBottom: 20,
          }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
            输入载荷
          </h3>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
            {execution.inputSummary}
          </div>
          <pre
            style={{
              background: '#1e293b', color: '#e2e8f0', borderRadius: 8,
              padding: 16, fontSize: 12, lineHeight: 1.6, overflow: 'auto',
              maxHeight: 240,
            }}
          >
            {execution.inputPayload}
          </pre>
        </div>

        {/* 输出结果 */}
        <div
          style={{
            background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb',
            padding: 20, marginBottom: 20,
          }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
            输出结果
          </h3>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
            {execution.outputSummary}
          </div>
          <pre
            style={{
              background: '#1e293b', color: '#e2e8f0', borderRadius: 8,
              padding: 16, fontSize: 12, lineHeight: 1.6, overflow: 'auto',
              maxHeight: 240,
            }}
          >
            {execution.outputPayload}
          </pre>
        </div>

        {/* 错误详情 */}
        {execution.errorMessage && (
          <div
            style={{
              background: '#fef2f2', borderRadius: 12, border: '1px solid #fecaca',
              padding: 20, marginBottom: 20,
            }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#991b1b', marginBottom: 8 }}>
              错误详情
            </h3>
            <Tag variant="error">{execution.errorMessage}</Tag>
            {execution.errorStackTrace && (
              <pre
                style={{
                  marginTop: 12, background: '#450a0a', color: '#fca5a5',
                  borderRadius: 8, padding: 16, fontSize: 12, lineHeight: 1.6,
                  overflow: 'auto', maxHeight: 200,
                }}
              >
                {execution.errorStackTrace}
              </pre>
            )}
          </div>
        )}

        {/* 关联操作 */}
        <div
          style={{
            display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap',
          }}
        >
          <a
            href={`/rules/executions`}
            style={{
              padding: '8px 20px', borderRadius: 8, border: '1px solid #d1d5db',
              background: '#fff', color: '#374151', fontSize: 13,
              textDecoration: 'none', fontWeight: 500,
            }}
          >
            ← 返回执行列表
          </a>
          <a
            href={`/configuration/entries/${execution.ruleId}`}
            style={{
              padding: '8px 20px', borderRadius: 8, border: '1px solid #d1d5db',
              background: '#fff', color: '#2563eb', fontSize: 13,
              textDecoration: 'none', fontWeight: 500,
            }}
          >
            查看规则配置 →
          </a>
        </div>

        <DetailActionBar
          caption="复制 / 导出 / 分享当前执行详情"
          actions={[
            { key: 'copy', label: '复制', icon: 'copy', onClick: () => showToast('详情链接已复制') },
            { key: 'export', label: '导出', icon: 'export', onClick: () => showToast('正在导出 JSON 报告') },
            { key: 'share', label: '分享', icon: 'link', onClick: () => showToast('分享链接已生成') },
          ]}
        />

        <DetailClosureBar
          links={[
            { key: 'list', title: '返回执行列表', subtitle: '查看全部规则执行结果', href: '/rules/executions' },
            { key: 'rule', title: '规则编辑', subtitle: `编辑 ${execution.ruleName}`, href: `/configuration/entries/${execution.ruleId}` },
          ]}
        />
      </PageShell>
    </main>
  )
}
