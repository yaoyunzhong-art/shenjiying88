'use client'

import { useCallback, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  AIDecisionPanel,
  Button,
  DataTable,
  FormField,
  FormSubmitFeedback,
  Modal,
  PageShell,
  Pagination,
  SearchFilterInput,
  Select,
  StatCard,
  StatusBadge,
  SubmitButton,
  type DataTableColumn,
  type DataTableSortConfig,
  usePagination,
  useSortedItems,
} from '@m5/ui'
import {
  CATEGORY_OPTS,
  DEFAULT_FORM,
  STATUS_MAP,
  STATUS_OPTS,
  type AiDecisionFormState,
  type AiDecisionSnapshot,
  type DecisionRecord,
} from './ai-decision-data'
import SnapshotRefreshCard from '../components/snapshot-refresh-card'

function buildColumns(): DataTableColumn<DecisionRecord>[] {
  return [
    {
      key: 'ruleName',
      title: '规则名称',
      dataKey: 'ruleName',
      sortable: true,
      render: (record) => <span style={{ color: '#93c5fd', fontWeight: 500 }}>{record.ruleName}</span>,
    },
    { key: 'ruleCategory', title: '类别', dataKey: 'ruleCategory', sortable: true, width: '80px' },
    {
      key: 'status',
      title: '状态',
      dataKey: 'status',
      sortable: true,
      width: '90px',
      render: (record) => {
        const item = STATUS_MAP[record.status]
        return <StatusBadge label={item.label} variant={item.variant} size="sm" />
      },
    },
    {
      key: 'confidence',
      title: '置信度',
      dataKey: 'confidence',
      sortable: true,
      width: '90px',
      render: (record) => (
        <span style={{ fontFamily: 'monospace', color: '#e2e8f0' }}>
          {(record.confidence * 100).toFixed(0)}%
        </span>
      ),
    },
    { key: 'triggeredCount', title: '触发次数', dataKey: 'triggeredCount', sortable: true, width: '90px', align: 'right' },
    { key: 'source', title: '来源', dataKey: 'source', sortable: true, width: '120px' },
    { key: 'targetAudience', title: '目标人群', dataKey: 'targetAudience', sortable: true, width: '120px' },
    {
      key: 'createdAt',
      title: '时间',
      dataKey: 'createdAt',
      sortable: true,
      width: '150px',
      render: (record) => <span style={{ fontSize: 12, color: '#94a3b8' }}>{record.createdAt}</span>,
    },
    { key: 'description', title: '描述', dataKey: 'description', render: (record) => record.description },
  ]
}

export default function AiDecisionClient({ snapshot }: { snapshot: AiDecisionSnapshot }) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [decisions, setDecisions] = useState<DecisionRecord[]>(snapshot.decisions)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>({ key: 'createdAt', direction: 'desc' })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState<AiDecisionFormState>(DEFAULT_FORM)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const pagination = usePagination({ initialPageSize: 8, pageSizeOptions: [5, 8, 15] })

  const filtered = useMemo(() => {
    let items = decisions
    if (search.trim()) {
      const keyword = search.toLowerCase()
      items = items.filter(
        (record) =>
          record.ruleName.toLowerCase().includes(keyword) ||
          record.source.toLowerCase().includes(keyword) ||
          record.description.toLowerCase().includes(keyword) ||
          record.targetAudience.toLowerCase().includes(keyword),
      )
    }
    if (statusFilter) items = items.filter((record) => record.status === statusFilter)
    if (categoryFilter) items = items.filter((record) => record.ruleCategory === categoryFilter)
    return items
  }, [categoryFilter, decisions, search, statusFilter])

  const stats = useMemo(() => {
    const total = decisions.length
    return {
      total,
      approved: decisions.filter((record) => record.status === 'approved').length,
      pending: decisions.filter((record) => record.status === 'pending').length,
      rejected: decisions.filter((record) => record.status === 'rejected').length,
      avgConf: total > 0 ? decisions.reduce((sum, record) => sum + record.confidence, 0) / total : 0,
      totalTriggered: decisions.reduce((sum, record) => sum + record.triggeredCount, 0),
    }
  }, [decisions])

  const columns = useMemo(() => buildColumns(), [])
  const sorted = useSortedItems(filtered, columns, sortConfig)
  const pageItems = pagination.paginate(sorted)

  const validateForm = useCallback((data: AiDecisionFormState) => {
    const nextErrors: Record<string, string> = {}
    if (!data.ruleName.trim()) nextErrors.ruleName = '规则名称不能为空'
    if (!data.description.trim()) nextErrors.description = '规则描述不能为空'
    if (!data.ruleCategory) nextErrors.ruleCategory = '请选择类别'
    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }, [])

  const handleCreate = useCallback(() => {
    if (!validateForm(formData)) return
    const nextDecision: DecisionRecord = {
      id: `dec-${String(decisions.length + 1).padStart(3, '0')}`,
      ruleName: formData.ruleName,
      status: 'pending',
      confidence: 0.5,
      source: formData.source || '手动创建',
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      targetAudience: formData.targetAudience || '全部会员',
      description: formData.description,
      ruleCategory: formData.ruleCategory,
      triggeredCount: 0,
    }
    setDecisions((current) => [nextDecision, ...current])
    setFeedback({ type: 'success', message: `规则「${nextDecision.ruleName}」已创建` })
    setShowCreateModal(false)
    setFormData(DEFAULT_FORM)
  }, [decisions.length, formData, validateForm])

  const handleBatchApprove = useCallback(() => {
    setDecisions((current) =>
      current.map((record) =>
        selectedIds.has(record.id)
          ? { ...record, status: 'approved' as const, confidence: Math.max(record.confidence, 0.7) }
          : record,
      ),
    )
    setFeedback({ type: 'success', message: `已批量批准 ${selectedIds.size} 条` })
    setSelectedIds(new Set())
  }, [selectedIds])

  const handleBatchReject = useCallback(() => {
    setDecisions((current) =>
      current.map((record) =>
        selectedIds.has(record.id) ? { ...record, status: 'rejected' as const } : record,
      ),
    )
    setFeedback({ type: 'success', message: `已批量拒绝 ${selectedIds.size} 条` })
    setSelectedIds(new Set())
  }, [selectedIds])

  const handleExport = useCallback(() => {
    const exportItems =
      selectedIds.size > 0 ? decisions.filter((record) => selectedIds.has(record.id)) : decisions
    const csv = ['ruleName,status,confidence,source,targetAudience,createdAt']
      .concat(
        exportItems.map(
          (record) =>
            `${record.ruleName},${STATUS_MAP[record.status].label},${(record.confidence * 100).toFixed(0)}%,${record.source},${record.targetAudience},${record.createdAt}`,
        ),
      )
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `ai-decisions-${new Date().toISOString().slice(0, 10)}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }, [decisions, selectedIds])

  function handleRefresh() {
    startRefresh(() => router.refresh())
    setFeedback({ type: 'success', message: '已请求刷新服务端快照' })
  }

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <PageShell
        title="AI 决策中心"
        subtitle="AI 规则引擎决策事件面板 — 查看命中规则、置信度分析、决策快照与建议操作"
      >
        <SnapshotRefreshCard
        sourceLabel={snapshot.sourceLabel}
        refreshPath={snapshot.refreshPath}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        contextLabel="客户端快照上下文"
        loadingLabel="刷新中..."
        idleLabel="刷新快照"
      />

        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', marginBottom: 24 }}>
          <StatCard label="决策总数" value={stats.total.toString()} helper="今日" />
          <StatCard label="平均置信度" value={`${(stats.avgConf * 100).toFixed(0)}%`} helper={`总触发 ${stats.totalTriggered.toLocaleString()} 次`} />
          <StatCard label="已批准" value={stats.approved.toString()} helper={stats.total > 0 ? `${((stats.approved / stats.total) * 100).toFixed(0)}%` : '0%'} variant="success" />
          <StatCard label="待处理" value={stats.pending.toString()} helper="需人工审核" variant="warning" />
          <StatCard label="已拒绝" value={stats.rejected.toString()} helper={stats.total > 0 ? `${((stats.rejected / stats.total) * 100).toFixed(0)}%` : '0%'} variant="error" />
        </div>

        {feedback && (
          <FormSubmitFeedback
            success={feedback.type === 'success' ? feedback.message : undefined}
            onDismissSuccess={() => setFeedback(null)}
          />
        )}

        <div style={{ marginBottom: 24 }}>
          <AIDecisionPanel variant="pc" />
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <SearchFilterInput
            placeholder="搜索规则名称/来源..."
            value={search}
            onChange={(value) => {
              setSearch(value)
              pagination.setPage(1)
            }}
            width="auto"
          />
          <Select
            options={STATUS_OPTS}
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(String(value))
              pagination.setPage(1)
            }}
            placeholder="状态"
          />
          <Select
            options={CATEGORY_OPTS}
            value={categoryFilter}
            onChange={(value) => {
              setCategoryFilter(String(value))
              pagination.setPage(1)
            }}
            placeholder="类别"
          />
          <div style={{ flex: 1 }} />
          <SubmitButton
            label="＋ 创建规则"
            variant="primary"
            onClick={() => {
              setFormData(DEFAULT_FORM)
              setFormErrors({})
              setShowCreateModal(true)
            }}
          />
          <Button variant="outline" onClick={handleRefresh}>刷新</Button>
          <Button variant="outline" onClick={handleExport}>导出</Button>
        </div>

        {selectedIds.size > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(59,130,246,0.08)', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#93c5fd', fontWeight: 600 }}>已选 {selectedIds.size} 条</span>
            <Button variant="primary" size="sm" onClick={handleBatchApprove}>批量批准</Button>
            <Button variant="outline" size="sm" onClick={handleBatchReject}>批量拒绝</Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>取消选择</Button>
          </div>
        )}

        <div style={{ marginTop: 8 }}>
          <DataTable<DecisionRecord>
            title={`决策历史 (${sorted.length})`}
            columns={columns}
            items={pageItems}
            sort={sortConfig}
            onSortChange={setSortConfig}
            striped
            compact
            emptyText={search || statusFilter || categoryFilter ? '未找到匹配的决策记录' : '暂无决策数据'}
            rowKey={(record) => record.id}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <Pagination
              page={pagination.page}
              pageSize={pagination.pageSize}
              total={sorted.length}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
            />
          </div>
        </div>

        <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="创建决策规则" width={560}>
          <div style={{ display: 'grid', gap: 14 }}>
            <FormField label="规则名称" error={formErrors.ruleName} required>
              <input
                type="text"
                value={formData.ruleName}
                onChange={(event) => setFormData((current) => ({ ...current, ruleName: event.target.value }))}
                placeholder="规则名称"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d9d9d9' }}
              />
            </FormField>

            <FormField label="规则类别" error={formErrors.ruleCategory} required>
              <select
                value={formData.ruleCategory}
                onChange={(event) => setFormData((current) => ({ ...current, ruleCategory: event.target.value }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d9d9d9' }}
              >
                <option value="">选择类别</option>
                {CATEGORY_OPTS.filter((item) => item.value).map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </FormField>

            <FormField label="规则来源">
              <select
                value={formData.source}
                onChange={(event) => setFormData((current) => ({ ...current, source: event.target.value }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d9d9d9' }}
              >
                <option value="">默认</option>
                <option value="规则引擎-A">规则引擎-A</option>
                <option value="规则引擎-B">规则引擎-B</option>
                <option value="规则引擎-C">规则引擎-C</option>
                <option value="手动创建">手动创建</option>
              </select>
            </FormField>

            <FormField label="目标人群">
              <input
                type="text"
                value={formData.targetAudience}
                onChange={(event) => setFormData((current) => ({ ...current, targetAudience: event.target.value }))}
                placeholder="全部会员 / 高活跃会员..."
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d9d9d9' }}
              />
            </FormField>

            <FormField label="规则描述" error={formErrors.description} required>
              <textarea
                value={formData.description}
                onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))}
                rows={3}
                placeholder="规则描述"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d9d9d9', resize: 'vertical' }}
              />
            </FormField>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <SubmitButton label="取消" variant="secondary" onClick={() => setShowCreateModal(false)} />
            <SubmitButton label="创建规则" variant="primary" onClick={handleCreate} />
          </div>
        </Modal>
      </PageShell>
    </main>
  )
}
