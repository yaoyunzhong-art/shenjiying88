'use client'

import { useCallback, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  DataTable,
  FormField,
  FormSubmitFeedback,
  Modal,
  Pagination,
  SearchFilterInput,
  Select,
  StatCard,
  StatusBadge,
  SubmitButton,
  type DataTableColumn,
} from '@m5/ui'
import type {
  FireInspectionForm,
  FirePreventionSnapshotDelivery,
  InspectionItem,
  InspectionStatus,
  RiskLevel,
} from './fire-prevention-data'
import {
  AREA_OPTIONS,
  EQUIPMENT_OPTIONS,
  FIRE_STATUS_MAP,
  INSPECTOR_OPTIONS,
  RISK_MAP,
  buildFireInspectionCsv,
  defaultFireInspectionForm,
  filterFireInspectionItems,
  mockCreateFireInspection,
  mockUpdateFireInspection,
  summarizeFireInspectionStats,
} from './fire-prevention-data'

const PAGE_SIZE = 10

export default function FirePreventionClient({
  snapshot,
}: {
  snapshot: FirePreventionSnapshotDelivery
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [items, setItems] = useState(snapshot.items)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<InspectionStatus | 'ALL'>('ALL')
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'ALL'>('ALL')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [feedback, setFeedback] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingItem, setEditingItem] = useState<InspectionItem | null>(null)
  const [formData, setFormData] = useState<FireInspectionForm>(defaultFireInspectionForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, startSubmit] = useTransition()

  const filteredItems = useMemo(
    () => filterFireInspectionItems(items, searchQuery, statusFilter, riskFilter),
    [items, searchQuery, statusFilter, riskFilter],
  )
  const stats = useMemo(() => summarizeFireInspectionStats(items), [items])
  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageItems = useMemo(
    () => filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [currentPage, filteredItems],
  )

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const openCreateModal = useCallback(() => {
    setFormData(defaultFireInspectionForm)
    setFormErrors({})
    setShowCreateModal(true)
  }, [])

  const openEditModal = useCallback((item: InspectionItem) => {
    setEditingItem(item)
    setFormData({
      area: item.area,
      inspector: item.inspector,
      scheduledDate: item.scheduledDate,
      riskLevel: item.riskLevel,
      equipment: item.equipment,
      notes: item.notes,
    })
    setFormErrors({})
    setShowEditModal(true)
  }, [])

  const columns = useMemo<DataTableColumn<InspectionItem>[]>(
    () => [
      {
        key: 'selected',
        header: '选择',
        render: (item) => (
          <input
            type="checkbox"
            checked={selectedIds.has(item.id)}
            onChange={() => toggleSelection(item.id)}
            aria-label={`select-${item.id}`}
          />
        ),
      },
      { key: 'id', header: '编号' },
      { key: 'area', header: '检查区域' },
      { key: 'equipment', header: '设备' },
      { key: 'inspector', header: '检查人' },
      {
        key: 'status',
        header: '状态',
        render: (item) => {
          const status = FIRE_STATUS_MAP[item.status]
          return <StatusBadge label={status.label} variant={status.variant} size="sm" dot />
        },
      },
      {
        key: 'riskLevel',
        header: '风险等级',
        render: (item) => {
          const risk = RISK_MAP[item.riskLevel]
          return <StatusBadge label={risk.label} variant={risk.variant} size="sm" />
        },
      },
      {
        key: 'scheduledDate',
        header: '计划日期',
        render: (item) => <span className="font-mono text-xs text-slate-500">{item.scheduledDate}</span>,
      },
      {
        key: 'actions',
        header: '操作',
        render: (item) => (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => openEditModal(item)}>
              编辑
            </Button>
            {item.status === 'pending' ? (
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  setItems((current) =>
                    current.map((entry) =>
                      entry.id === item.id ? { ...entry, status: 'in_progress' } : entry,
                    ),
                  )
                  setFeedback(`检查记录 ${item.id} 已开始执行`)
                }}
              >
                开始检查
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [openEditModal, selectedIds, toggleSelection],
  )

  const validateForm = useCallback((candidate: FireInspectionForm) => {
    const nextErrors: Record<string, string> = {}
    if (!candidate.area) nextErrors.area = '请选择检查区域'
    if (!candidate.inspector) nextErrors.inspector = '请选择检查人'
    if (!candidate.scheduledDate) nextErrors.scheduledDate = '请选择计划日期'
    if (!candidate.equipment) nextErrors.equipment = '请选择检查设备'
    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }, [])

  function handleCreate() {
    if (!validateForm(formData)) {
      return
    }

    startSubmit(async () => {
      const created = await mockCreateFireInspection(formData, items.length + 1)
      setItems((current) => [created, ...current])
      setFeedback(`检查记录 ${created.id} 已创建`)
      setShowCreateModal(false)
      setFormData(defaultFireInspectionForm)
    })
  }

  function handleUpdate() {
    if (!editingItem || !validateForm(formData)) {
      return
    }

    startSubmit(async () => {
      const updated = await mockUpdateFireInspection(editingItem, formData)
      setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      setFeedback(`检查记录 ${updated.id} 已更新`)
      setShowEditModal(false)
      setEditingItem(null)
      setFormData(defaultFireInspectionForm)
    })
  }

  function handleBatchComplete() {
    setItems((current) =>
      current.map((item) =>
        selectedIds.has(item.id) ? { ...item, status: 'passed', actionRequired: '' } : item,
      ),
    )
    setFeedback(`已完成 ${selectedIds.size} 项检查`)
    setSelectedIds(new Set())
  }

  function handleExportReport() {
    const exportItems = selectedIds.size > 0 ? items.filter((item) => selectedIds.has(item.id)) : items
    const csv = buildFireInspectionCsv(exportItems)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `fire-report-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    setFeedback('导出报告已生成')
  }

  function handleCloseModals() {
    setShowCreateModal(false)
    setShowEditModal(false)
    setEditingItem(null)
    setFormData(defaultFireInspectionForm)
    setFormErrors({})
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">消防管理</h1>
          <p className="mt-1 text-sm text-slate-500">
            首屏检查记录来自服务端快照，创建、编辑、批量完成与导出仍为客户端本地链路。
          </p>
        </div>
        <button
          type="button"
          onClick={() => startRefresh(() => router.refresh())}
          disabled={isRefreshing}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRefreshing ? '刷新中...' : '刷新'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="总检查项" value={String(stats.total)} helper={`高风险 ${stats.highRisk}`} />
        <StatCard
          label="待检查"
          value={String(stats.pending)}
          helper={`检查中 ${stats.inProgress}`}
          variant="warning"
        />
        <StatCard label="已通过" value={String(stats.passed)} helper="通过项" variant="success" />
        <StatCard label="未通过" value={String(stats.failed)} helper="需整改" variant="error" />
      </div>

      {feedback ? (
        <FormSubmitFeedback success={feedback} onDismissSuccess={() => setFeedback(null)} />
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <SearchFilterInput
            placeholder="搜索区域、检查人、备注..."
            value={searchQuery}
            onChange={(value: string) => {
              setSearchQuery(value)
              setPage(1)
            }}
          />
          <Select
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value as InspectionStatus | 'ALL')
              setPage(1)
            }}
            options={[
              { value: 'ALL', label: '全部状态' },
              ...Object.entries(FIRE_STATUS_MAP).map(([key, value]) => ({
                value: key,
                label: value.label,
              })),
            ]}
          />
          <Select
            value={riskFilter}
            onChange={(value) => {
              setRiskFilter(value as RiskLevel | 'ALL')
              setPage(1)
            }}
            options={[
              { value: 'ALL', label: '全部风险' },
              ...Object.entries(RISK_MAP).map(([key, value]) => ({
                value: key,
                label: value.label,
              })),
            ]}
          />
          <div className="ml-auto flex gap-2">
            <SubmitButton label="新建检查" variant="primary" onClick={openCreateModal} />
            <Button variant="outline" onClick={handleExportReport}>
              导出报告
            </Button>
          </div>
        </div>

        {selectedIds.size > 0 ? (
          <div className="mt-4 flex items-center gap-3 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <span>已选 {selectedIds.size} 项</span>
            <Button size="sm" variant="primary" onClick={handleBatchComplete}>
              标记已完成
            </Button>
            <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())}>
              取消选择
            </Button>
          </div>
        ) : null}

        <div className="mt-6">
          <DataTable
            title={`消防检查 (${filteredItems.length})`}
            columns={columns}
            items={pageItems}
            rowKey={(item) => item.id}
            striped
            compact
            emptyText={searchQuery || statusFilter !== 'ALL' || riskFilter !== 'ALL' ? '没有匹配的检查记录' : '暂无检查记录'}
          />
        </div>

        <div className="mt-4">
          <Pagination
            page={currentPage}
            pageSize={PAGE_SIZE}
            total={filteredItems.length}
            onPageChange={setPage}
            onPageSizeChange={() => undefined}
          />
        </div>
      </div>

      <Modal open={showCreateModal} onClose={handleCloseModals} title="新建消防检查" width={560}>
        <InspectionForm formData={formData} onChange={setFormData} errors={formErrors} />
        <div className="mt-4 flex justify-end gap-2">
          <SubmitButton label="取消" variant="secondary" onClick={handleCloseModals} />
          <SubmitButton
            label={isSubmitting ? '创建中...' : '创建'}
            variant="primary"
            onClick={handleCreate}
          />
        </div>
      </Modal>

      <Modal open={showEditModal} onClose={handleCloseModals} title="编辑检查记录" width={560}>
        <p className="mb-3 text-sm text-slate-500">编号: {editingItem?.id}</p>
        <InspectionForm formData={formData} onChange={setFormData} errors={formErrors} />
        <div className="mt-4 flex justify-end gap-2">
          <SubmitButton label="取消" variant="secondary" onClick={handleCloseModals} />
          <SubmitButton
            label={isSubmitting ? '保存中...' : '保存修改'}
            variant="primary"
            onClick={handleUpdate}
          />
        </div>
      </Modal>
    </div>
  )
}

function InspectionForm({
  formData,
  onChange,
  errors,
}: {
  formData: FireInspectionForm
  onChange: (formData: FireInspectionForm) => void
  errors: Record<string, string>
}) {
  function updateField<K extends keyof FireInspectionForm>(key: K, value: FireInspectionForm[K]) {
    onChange({ ...formData, [key]: value })
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="检查区域" error={errors.area} required>
          <select
            value={formData.area}
            onChange={(event) => updateField('area', event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">选择区域</option>
            {AREA_OPTIONS.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="检查人" error={errors.inspector} required>
          <select
            value={formData.inspector}
            onChange={(event) => updateField('inspector', event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">选择检查人</option>
            {INSPECTOR_OPTIONS.map((inspector) => (
              <option key={inspector} value={inspector}>
                {inspector}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="计划日期" error={errors.scheduledDate} required>
          <input
            type="date"
            value={formData.scheduledDate}
            onChange={(event) => updateField('scheduledDate', event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </FormField>

        <FormField label="风险等级">
          <select
            value={formData.riskLevel}
            onChange={(event) => updateField('riskLevel', event.target.value as RiskLevel)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {Object.entries(RISK_MAP).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField label="检查设备" error={errors.equipment} required>
        <select
          value={formData.equipment}
          onChange={(event) => updateField('equipment', event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">选择设备</option>
          {EQUIPMENT_OPTIONS.map((equipment) => (
            <option key={equipment} value={equipment}>
              {equipment}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="备注">
        <textarea
          rows={3}
          value={formData.notes}
          onChange={(event) => updateField('notes', event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="备注信息"
        />
      </FormField>
    </div>
  )
}
