'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useTransition } from 'react'
import type { StockPageSnapshot } from './stock-data'

interface StockRow {
  sku: string
  name: string
  category: string
  totalQty: number
  availableQty: number
  warehouse: string
}
import SnapshotRefreshCard from '../components/snapshot-refresh-card'

const STOCK_ROWS: StockRow[] = [
  { sku: 'STK-1001', name: '澳洲和牛西冷', category: '牛肉', totalQty: 128, availableQty: 92, warehouse: '主仓库' },
  { sku: 'STK-1002', name: '北海道扇贝', category: '海鲜', totalQty: 48, availableQty: 12, warehouse: '冷冻库' },
  { sku: 'STK-1003', name: '藏红花', category: '调味料', totalQty: 10, availableQty: 0, warehouse: '干货库' },
  { sku: 'STK-1004', name: '总统黄油', category: '乳制品', totalQty: 64, availableQty: 21, warehouse: '前厅' },
]

const cardStyle = {
  borderRadius: 16,
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: 'rgba(15, 23, 42, 0.42)',
  padding: 20,
  color: '#e2e8f0',
} as const

export default function StockClient({ snapshot }: { snapshot: StockPageSnapshot }) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const summary = useMemo(() => {
    const totalQty = STOCK_ROWS.reduce((sum, item) => sum + item.totalQty, 0)
    const warningCount = STOCK_ROWS.filter((item) => item.availableQty > 0 && item.availableQty <= 20).length
    const outOfStockCount = STOCK_ROWS.filter((item) => item.availableQty === 0).length
    return { totalQty, warningCount, outOfStockCount }
  }, [])

  function handleRefresh() {
    startRefresh(() => router.refresh())
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          客户端快照上下文: {snapshot.sourceLabel} · 刷新路径: {snapshot.refreshPath}
        </div>
        <button type="button" onClick={handleRefresh} style={refreshButtonStyle}>
          {isRefreshing ? '刷新中...' : '刷新快照'}
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
        <div style={cardStyle}><div>品项数</div><div style={{ marginTop: 8, fontSize: 24, fontWeight: 700 }}>{STOCK_ROWS.length}</div></div>
        <div style={cardStyle}><div>总库存</div><div style={{ marginTop: 8, fontSize: 24, fontWeight: 700 }}>{summary.totalQty}</div></div>
        <div style={cardStyle}><div>低库存</div><div style={{ marginTop: 8, fontSize: 24, fontWeight: 700 }}>{summary.warningCount}</div></div>
        <div style={cardStyle}><div>缺货</div><div style={{ marginTop: 8, fontSize: 24, fontWeight: 700 }}>{summary.outOfStockCount}</div></div>
      </div>
      <div style={cardStyle}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: '#94a3b8' }}>
              <th style={{ paddingBottom: 12 }}>SKU</th>
              <th style={{ paddingBottom: 12 }}>名称</th>
              <th style={{ paddingBottom: 12 }}>品类</th>
              <th style={{ paddingBottom: 12 }}>总量</th>
              <th style={{ paddingBottom: 12 }}>可用</th>
              <th style={{ paddingBottom: 12 }}>仓位</th>
            </tr>
          </thead>
          <tbody>
            {STOCK_ROWS.map((row) => (
              <tr key={row.sku}>
                <td style={{ padding: '10px 0' }}>{row.sku}</td>
                <td>{row.name}</td>
                <td>{row.category}</td>
                <td>{row.totalQty}</td>
                <td>{row.availableQty}</td>
                <td>{row.warehouse}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
