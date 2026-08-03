'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import {
  MOCK_PRODUCTS,
  PRODUCT_CATEGORY_MAP,
  PRODUCT_STATUS_MAP,
} from '../../products-data'
import type { ProductDetailSnapshot } from './product-detail-data'
import SnapshotRefreshCard from '../../components/snapshot-refresh-card'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

const shellStyle = {
  display: 'grid',
  gap: 16,
} as const

const cardStyle = {
  borderRadius: 16,
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: 'rgba(15, 23, 42, 0.42)',
  padding: 20,
  color: '#e2e8f0',
} as const

export default function ProductDetailClient({ snapshot }: { snapshot: ProductDetailSnapshot }) {
  const { isRefreshing, handleRefresh } = useSnapshotRefresh()
  const product = useMemo(
    () => MOCK_PRODUCTS.find((item) => item.id === snapshot.id),
    [snapshot.id]
  )

  if (!product) {
    return (
      <div style={cardStyle}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>商品未找到</div>
        <div style={{ marginTop: 8, color: '#94a3b8' }}>未命中商品 `{snapshot.id}` 的 mock 明细。</div>
        <Link href="/products" style={{ display: 'inline-block', marginTop: 12, color: '#93c5fd' }}>
          返回商品列表
        </Link>
      </div>
    )
  }

  const status = PRODUCT_STATUS_MAP[product.status]
  const category = PRODUCT_CATEGORY_MAP[product.category]
  const margin = product.price > 0 ? (((product.price - product.cost) / product.price) * 100).toFixed(1) : '0.0'

  return (
    <div style={shellStyle}>
      <SnapshotRefreshCard
        sourceLabel={snapshot.sourceLabel}
        refreshPath={snapshot.refreshPath}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{product.name}</div>
            <div style={{ marginTop: 6, color: '#94a3b8' }}>
              {product.sku} · {category.label} · {product.marketCode}
            </div>
          </div>
          <Link href="/products" style={{ color: '#93c5fd' }}>
            返回商品列表
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginTop: 20 }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>状态</div>
            <div style={{ marginTop: 6, fontWeight: 700 }}>{status.label}</div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>售价 / 成本</div>
            <div style={{ marginTop: 6, fontWeight: 700 }}>¥{product.price.toFixed(2)} / ¥{product.cost.toFixed(2)}</div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>毛利率</div>
            <div style={{ marginTop: 6, fontWeight: 700 }}>{margin}%</div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>库存</div>
            <div style={{ marginTop: 6, fontWeight: 700 }}>{product.stock} {product.unit}</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, marginTop: 20 }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>品牌</div>
            <div style={{ marginTop: 6 }}>{product.brandName}</div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>门店</div>
            <div style={{ marginTop: 6 }}>{product.storeName}</div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>创建时间</div>
            <div style={{ marginTop: 6 }}>{product.createdAt}</div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>最近更新</div>
            <div style={{ marginTop: 6 }}>{product.updatedAt}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
