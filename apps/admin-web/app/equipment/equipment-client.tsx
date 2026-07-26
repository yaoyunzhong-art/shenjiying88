'use client'

import { useMemo, useState, useTransition, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import {
  DataTable,
  EmptyState,
  PageShell,
  Pagination,
  SearchFilterInput,
  StatusBadge,
  Tabs,
  usePagination,
  useSortedItems,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui'
import {
  EQUIPMENT_STATUS_MAP,
  EQUIPMENT_TYPE_MAP,
  computeEquipmentStats,
  type EquipmentItem,
  type EquipmentSnapshotDelivery,
  type EquipmentStatus,
  type EquipmentType,
} from './equipment-data'

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

function warrantyColor(days: number): string {
  if (days < 0) return '#ef4444'
  if (days < 90) return '#eab308'
  return '#94a3b8'
}

const cardStyle: CSSProperties = {
  borderRadius: 16,
  padding: 18,
  background: 'rgba(15,23,42,0.38)',
  border: '1px solid rgba(148,163,184,0.18)',
}

export default function EquipmentClient({
  snapshot,
}: {
  snapshot: EquipmentSnapshotDelivery
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | 'ALL'>('ALL')
  const [typeFilter, setTypeFilter] = useState<EquipmentType | 'ALL'>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null)
  const equipment = snapshot.equipment
  const stats = useMemo(() => computeEquipmentStats(equipment), [equipment])
  const equipmentTypes = useMemo(
    () => [...new Set(equipment.map((item) => item.type))],
    [equipment]
  )

  const searchFiltered = useMemo(() => {
    const normalized = searchTerm.toLowerCase().trim()
    if (!normalized) return equipment
    return equipment.filter((item) =>
      [item.name, item.model, item.store, item.supplier, item.type]
        .join(' ')
        .toLowerCase()
        .includes(normalized)
    )
  }, [equipment, searchTerm])

  const statusFiltered = useMemo(() => {
    if (statusFilter === 'ALL') return searchFiltered
    return searchFiltered.filter((item) => item.status === statusFilter)
  }, [searchFiltered, statusFilter])

  const typeFiltered = useMemo(() => {
    if (typeFilter === 'ALL') return statusFiltered
    return statusFiltered.filter((item) => item.type === typeFilter)
  }, [statusFilter, typeFilter, statusFiltered])

  const columns = useMemo<DataTableColumn<EquipmentItem>[]>(
    () => [
      {
        key: 'name',
        title: '设备名称',
        dataKey: 'name',
        sortable: true,
        render: (item) => <span style={{ color: '#93c5fd', fontWeight: 600 }}>{item.name}</span>,
      },
      {
        key: 'model',
        title: '型号',
        dataKey: 'model',
        sortable: true,
      },
      {
        key: 'type',
        title: '设备类型',
        sortable: true,
        sortValue: (item) => item.type,
        render: (item) => EQUIPMENT_TYPE_MAP[item.type],
      },
      {
        key: 'store',
        title: '所属门店',
        dataKey: 'store',
        sortable: true,
      },
      {
        key: 'supplier',
        title: '供应商',
        dataKey: 'supplier',
        sortable: true,
      },
      {
        key: 'warrantyEnd',
        title: '保修期',
        dataKey: 'warrantyEnd',
        sortable: true,
        render: (item) => {
          const days = daysUntil(item.warrantyEnd)
          const label = days < 0 ? '已过期' : days < 90 ? `剩余 ${days} 天` : item.warrantyEnd
          return <span style={{ color: warrantyColor(days) }}>{label}</span>
        },
      },
      {
        key: 'status',
        title: '状态',
        sortable: true,
        sortValue: (item) => item.status,
        render: (item) => (
          <StatusBadge
            label={EQUIPMENT_STATUS_MAP[item.status].label}
            variant={EQUIPMENT_STATUS_MAP[item.status].variant}
            size="sm"
            dot
          />
        ),
      },
      {
        key: 'updatedAt',
        title: '快照更新时间',
        dataKey: 'updatedAt',
        sortable: true,
      },
    ],
    []
  )

  const sortedItems = useSortedItems(typeFiltered, columns, sortConfig)
  const pagination = usePagination({ initialPageSize: 10 })
  const pageItems = pagination.paginate(sortedItems)

  return (
    <PageShell
      title="设备管理"
      subtitle={`${stats.total} 台设备 · ${stats.normal} 正常 · ${stats.maintaining} 维修中 · ${stats.scrapPending} 待报废`}
    >
      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#cbd5e1' }}>总设备数</div>
          <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700 }}>{stats.total}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#22c55e' }}>正常</div>
          <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: '#22c55e' }}>{stats.normal}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#eab308' }}>维修中</div>
          <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: '#eab308' }}>
            {stats.maintaining}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#f97316' }}>待报废</div>
          <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: '#f97316' }}>
            {stats.scrapPending}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        <SearchFilterInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="搜索设备名称/型号/门店/供应商..."
          width={360}
        />
        <button
          type="button"
          onClick={() => startRefresh(() => router.refresh())}
          disabled={isRefreshing}
          style={refreshButtonStyle}
        >
          {isRefreshing ? '刷新中...' : '刷新'}
        </button>
      </div>

      <div style={{ display: 'grid', gap: 16, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>设备状态</div>
          <Tabs
            items={[
              { key: 'ALL', label: '全部', count: searchFiltered.length },
              ...Object.entries(EQUIPMENT_STATUS_MAP).map(([status, meta]) => ({
                key: status,
                label: meta.label,
                count: searchFiltered.filter((item) => item.status === status).length,
              })),
            ]}
            activeKey={statusFilter}
            onChange={(key: string) => setStatusFilter(key as EquipmentStatus | 'ALL')}
            variant="pills"
            size="sm"
          />
        </div>

        <div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>设备类型</div>
          <Tabs
            items={[
              { key: 'ALL', label: '全部', count: statusFiltered.length },
              ...equipmentTypes.map((type) => ({
                key: type,
                label: EQUIPMENT_TYPE_MAP[type],
                count: statusFiltered.filter((item) => item.type === type).length,
              })),
            ]}
            activeKey={typeFilter}
            onChange={(key: string) => setTypeFilter(key as EquipmentType | 'ALL')}
            variant="pills"
            size="sm"
          />
        </div>
      </div>

      {sortedItems.length === 0 ? (
        <EmptyState
          title="未找到匹配设备"
          description="请调整设备状态、类型或搜索关键词后重试。"
        />
      ) : (
        <>
          <DataTable
            title={`设备列表 (${sortedItems.length})`}
            columns={columns}
            items={pageItems}
            rowKey={(item) => item.id}
            sort={sortConfig}
            onSortChange={setSortConfig}
            striped
            compact
          />
          <Pagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={sortedItems.length}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
          />
        </>
      )}

      <div style={tipBoxStyle}>
        <strong style={{ color: '#e2e8f0' }}>运维提示</strong>
        <br />
        设备状态由门店运维人员定期更新。待报废设备需提交报废审批单，保修期不足 90 天的设备以黄色标记。
      </div>
    </PageShell>
  )
}

const refreshButtonStyle: CSSProperties = {
  padding: '8px 18px',
  borderRadius: 8,
  border: '1px solid rgba(148,163,184,0.2)',
  background: 'rgba(15,23,42,0.4)',
  color: '#e2e8f0',
  fontSize: 13,
  cursor: 'pointer',
  outline: 'none',
}

const tipBoxStyle: CSSProperties = {
  marginTop: 24,
  padding: '8px 16px',
  borderRadius: 8,
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(148,163,184,0.08)',
  fontSize: 12,
  color: '#94a3b8',
  lineHeight: 1.6,
}
