'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import {
  MOCK_TRANSFERS,
  STATUS_LABEL,
  TYPE_LABEL,
  URGENCY_LABEL,
  type TransferStatus,
} from './stock-transfer-data'
import type { StockTransferPageSnapshot } from './stock-transfer-page-data'
import SnapshotRefreshCard from '../components/snapshot-refresh-card'

const cardStyle = {
  borderRadius: 16,
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: 'rgba(15, 23, 42, 0.42)',
  padding: 20,
  color: '#e2e8f0',
} as const

const buttonStyle = {
  borderRadius: 8,
  border: '1px solid rgba(96, 165, 250, 0.35)',
  background: 'rgba(59, 130, 246, 0.12)',
  color: '#bfdbfe',
  padding: '8px 14px',
  cursor: 'pointer',
} as const

const STATUS_FILTERS: Array<TransferStatus | 'ALL'> = ['ALL', 'pending', 'approved', 'shipped', 'received', 'rejected', 'cancelled']

export default function StockTransferClient({ snapshot }: { snapshot: StockTransferPageSnapshot }) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<TransferStatus | 'ALL'>('ALL')

  const filteredItems = useMemo(() => {
    return MOCK_TRANSFERS.filter((item) => {
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter
      const keyword = searchTerm.trim().toLowerCase()
      const matchesKeyword =
        keyword.length === 0
        || item.transferNo.toLowerCase().includes(keyword)
        || item.productName.toLowerCase().includes(keyword)
        || item.productSku.toLowerCase().includes(keyword)
        || item.sourceStoreName.toLowerCase().includes(keyword)
        || item.targetStoreName.toLowerCase().includes(keyword)
      return matchesStatus && matchesKeyword
    })
  }, [searchTerm, statusFilter])

  const summary = useMemo(() => {
    return {
      total: MOCK_TRANSFERS.length,
      pending: MOCK_TRANSFERS.filter((item) => item.status === 'pending').length,
      critical: MOCK_TRANSFERS.filter((item) => item.urgency === 'critical').length,
      shipped: MOCK_TRANSFERS.filter((item) => item.status === 'shipped').length,
    }
  }, [])

  function handleRefresh() {
    startRefresh(() => router.refresh())
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gap: 12 }}>
        <SnapshotRefreshCard
          sourceLabel={snapshot.sourceLabel}
          refreshPath={snapshot.refreshPath}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Link href="/stock-transfer/form" style={{ ...buttonStyle, textDecoration: 'none' }}>
            新建调拨
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
        <div style={cardStyle}><div>调拨单总数</div><div style={{ marginTop: 8, fontSize: 24, fontWeight: 700 }}>{summary.total}</div></div>
        <div style={cardStyle}><div>待审核</div><div style={{ marginTop: 8, fontSize: 24, fontWeight: 700 }}>{summary.pending}</div></div>
        <div style={cardStyle}><div>特急调拨</div><div style={{ marginTop: 8, fontSize: 24, fontWeight: 700 }}>{summary.critical}</div></div>
        <div style={cardStyle}><div>已发货</div><div style={{ marginTop: 8, fontSize: 24, fontWeight: 700 }}>{summary.shipped}</div></div>
      </div>

      <div style={{ ...cardStyle, display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="搜索调拨单号 / 商品 / SKU / 门店"
            style={{
              flex: '1 1 280px',
              minHeight: 40,
              borderRadius: 10,
              border: '1px solid rgba(148, 163, 184, 0.2)',
              background: 'rgba(15, 23, 42, 0.5)',
              color: '#e2e8f0',
              padding: '0 12px',
            }}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                style={{
                  ...buttonStyle,
                  background: statusFilter === filter ? 'rgba(59, 130, 246, 0.22)' : buttonStyle.background,
                }}
              >
                {filter === 'ALL' ? '全部' : STATUS_LABEL[filter]}
              </button>
            ))}
          </div>
        </div>

        <div style={{ color: '#94a3b8', fontSize: 13 }}>
          当前匹配 {filteredItems.length} 条，保留共享 `stock-transfer-data.ts` 作为业务数据来源。
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#94a3b8' }}>
                <th style={{ paddingBottom: 12 }}>调拨单号</th>
                <th style={{ paddingBottom: 12 }}>状态</th>
                <th style={{ paddingBottom: 12 }}>类型</th>
                <th style={{ paddingBottom: 12 }}>紧急度</th>
                <th style={{ paddingBottom: 12 }}>调出门店</th>
                <th style={{ paddingBottom: 12 }}>调入门店</th>
                <th style={{ paddingBottom: 12 }}>商品</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id} style={{ borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
                  <td style={{ padding: '12px 0' }}>
                    <Link href={`/stock-transfer/${item.id}`} style={{ color: '#93c5fd', textDecoration: 'underline' }}>
                      {item.transferNo}
                    </Link>
                  </td>
                  <td>{STATUS_LABEL[item.status]}</td>
                  <td>{TYPE_LABEL[item.type]}</td>
                  <td>{URGENCY_LABEL[item.urgency]}</td>
                  <td>{item.sourceStoreName}</td>
                  <td>{item.targetStoreName}</td>
                  <td>{item.productName} / {item.productSku}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
