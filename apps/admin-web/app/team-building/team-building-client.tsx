'use client'
import { useSnapshotRefresh } from '../components/use-snapshot-refresh'

import { useCallback, useMemo, useState, useTransition } from 'react'
import {
  Badge,
  Button,
  DataTable,
  Modal,
  SearchFilterInput,
  StatCard,
  StatusBadge,
  useToast,
  type DataTableColumn,
} from '@m5/ui'
import type {
  ActivityStatus,
  NewActivityForm,
  TeamBuildingRecord,
  TeamBuildingSnapshotDelivery,
} from './team-building-data'
import {
  ACTIVITY_STATUS_LABEL,
  ACTIVITY_STATUS_VARIANT,
  ACTIVITY_TYPES,
  ACTIVITY_TYPE_LABEL,
  TEAM_BUILDING_STATUSES,
  computeTeamBuildingStats,
  emptyActivityForm,
  filterActivities,
  formatCurrency,
  mockCreateTeamBuildingActivity,
} from './team-building-data'

const inputClassName =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400'

export default function TeamBuildingClient({
  snapshot,
}: {
  snapshot: TeamBuildingSnapshotDelivery
}) {
    const toast = useToast()
  const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [activities, setActivities] = useState(snapshot.activities)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<ActivityStatus | 'all'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<NewActivityForm>(emptyActivityForm)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof NewActivityForm, string>>>({})
  const [isSubmitting, startSubmit] = useTransition()

  const filtered = useMemo(
    () => filterActivities(activities, searchTerm, statusFilter),
    [activities, searchTerm, statusFilter],
  )
  const stats = useMemo(() => computeTeamBuildingStats(activities), [activities])

  const columns = useMemo<DataTableColumn<TeamBuildingRecord>[]>(
    () => [
      {
        key: 'name',
        header: '活动名称',
        render: (item) => <span className="font-medium text-slate-900">{item.name}</span>,
      },
      {
        key: 'date',
        header: '活动日期',
        render: (item) => <span className="font-mono text-xs text-slate-500">{item.date}</span>,
      },
      {
        key: 'type',
        header: '类型',
        render: (item) => <Badge variant="default">{ACTIVITY_TYPE_LABEL[item.type]}</Badge>,
      },
      {
        key: 'status',
        header: '状态',
        render: (item) => (
          <StatusBadge
            label={ACTIVITY_STATUS_LABEL[item.status]}
            variant={'default' as never}
          />
        ),
      },
      { key: 'participantCount', header: '预计人数' },
      {
        key: 'budget',
        header: '预算',
        render: (item) => formatCurrency(item.budget),
      },
      {
        key: 'location',
        header: '地点',
        render: (item) => <span className="text-sm text-slate-600">{item.location}</span>,
      },
    ],
    [],
  )

  const validateForm = useCallback(() => {
    const nextErrors: Partial<Record<keyof NewActivityForm, string>> = {}
    if (!form.name.trim()) nextErrors.name = '请输入活动名称'
    if (!form.date) nextErrors.date = '请选择活动日期'
    if (!form.location.trim()) nextErrors.location = '请输入活动地点'
    if (!form.budget || Number(form.budget) <= 0 || Number.isNaN(Number(form.budget))) {
      nextErrors.budget = '请输入有效的预算金额'
    }
    if (
      !form.participantCount ||
      Number(form.participantCount) <= 0 ||
      Number.isNaN(Number(form.participantCount))
    ) {
      nextErrors.participantCount = '请输入有效的参与人数'
    }
    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }, [form])

  function updateFormField(key: keyof NewActivityForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
    if (formErrors[key]) {
      setFormErrors((current) => ({ ...current, [key]: undefined }))
    }
  }

  function handleCloseModal() {
    setModalOpen(false)
    setForm(emptyActivityForm)
    setFormErrors({})
  }

  function handleCreate() {
    if (!validateForm()) {
      return
    }

    startSubmit(async () => {
      const nextActivity = await mockCreateTeamBuildingActivity(form, activities.length + 1)
      setActivities((current) => [nextActivity, ...current])
      toast.success('团建活动已创建')
      handleCloseModal()
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">团建活动管理</h1>
          <p className="mt-1 text-sm text-slate-500">
            首屏列表来自服务端快照，新建活动链路仍为客户端 fake write。
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            新建活动
          </Button>
          <button
            type="button"
            onClick={() => handleRefresh()}
            disabled={isRefreshing}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRefreshing ? '刷新中...' : '刷新'}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="总活动数" value={stats.total} />
        <StatCard label="进行中" value={stats.inProgress} variant="info" />
        <StatCard label="已完成" value={stats.completed} variant="success" />
        <StatCard label="总参与人次" value={stats.totalParticipants} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索活动名称、地点、描述..."
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as ActivityStatus | 'all')}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
            aria-label="状态筛选"
          >
            <option value="all">全部状态</option>
            {TEAM_BUILDING_STATUSES.map((status) => (
              <option key={status} value={status}>
                {ACTIVITY_STATUS_LABEL[status]}
              </option>
            ))}
          </select>
          <div className="text-sm text-slate-500">共 {filtered.length} 条记录</div>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-slate-300 px-6 py-12 text-center text-sm text-slate-500">
            {searchTerm ? `搜索 "${searchTerm}" 未找到相关团建活动。` : '暂无团建活动。'}
          </div>
        ) : (
          <div className="mt-6">
            <DataTable columns={columns} items={filtered} rowKey={(item) => item.id} striped />
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={handleCloseModal} title="新建团建活动">
        <div className="grid gap-4 py-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">活动名称</label>
            <input
              value={form.name}
              onChange={(event) => updateFormField('name', event.target.value)}
              placeholder="请输入活动名称"
              className={inputClassName}
            />
            {formErrors.name ? (
              <div className="mt-1 text-xs text-rose-500">{formErrors.name}</div>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">活动日期</label>
              <input
                type="date"
                value={form.date}
                onChange={(event) => updateFormField('date', event.target.value)}
                className={inputClassName}
              />
              {formErrors.date ? (
                <div className="mt-1 text-xs text-rose-500">{formErrors.date}</div>
              ) : null}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">活动类型</label>
              <select
                value={form.type}
                onChange={(event) => updateFormField('type', event.target.value)}
                className={inputClassName}
              >
                {ACTIVITY_TYPES.map((activityType) => (
                  <option key={activityType.value} value={activityType.value}>
                    {activityType.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">活动地点</label>
            <input
              value={form.location}
              onChange={(event) => updateFormField('location', event.target.value)}
              placeholder="请输入活动地点"
              className={inputClassName}
            />
            {formErrors.location ? (
              <div className="mt-1 text-xs text-rose-500">{formErrors.location}</div>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">预算</label>
              <input
                type="number"
                min={0}
                value={form.budget}
                onChange={(event) => updateFormField('budget', event.target.value)}
                placeholder="请输入预算金额"
                className={inputClassName}
              />
              {formErrors.budget ? (
                <div className="mt-1 text-xs text-rose-500">{formErrors.budget}</div>
              ) : null}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">预计参与人数</label>
              <input
                type="number"
                min={1}
                value={form.participantCount}
                onChange={(event) => updateFormField('participantCount', event.target.value)}
                placeholder="请输入预计参与人数"
                className={inputClassName}
              />
              {formErrors.participantCount ? (
                <div className="mt-1 text-xs text-rose-500">{formErrors.participantCount}</div>
              ) : null}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">活动描述</label>
            <textarea
              value={form.description}
              onChange={(event) => updateFormField('description', event.target.value)}
              placeholder="请输入活动描述"
              className={`${inputClassName} min-h-24 resize-y`}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
          <Button variant="secondary" onClick={handleCloseModal}>
            取消
          </Button>
          <Button variant="primary" onClick={handleCreate} disabled={isSubmitting}>
            {isSubmitting ? '创建中...' : '确认创建'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
