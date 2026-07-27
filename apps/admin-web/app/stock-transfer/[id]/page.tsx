import type { Metadata } from 'next'
import { AdminPermissionGate } from '../../components/admin-permission-gate'
import StockTransferDetailClient from './stock-transfer-detail-client'
import { loadStockTransferDetailSnapshot } from './stock-transfer-detail-data'

type PageProps = {
  params: Promise<{ id: string }>
}

const permissionGate = {
  requiredPermission: 'stock-transfer:read',
  title: '库存调拨详情访问受限',
  description: '库存调拨详情页已切换到 E54 三层模板，仅具备 stock-transfer:read 权限的账号可查看流程状态、商品明细与来源态证据。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  return {
    title: `库存调拨单 ${id} - M5 指挥台`,
    description: `查看库存调拨单 ${id} 的详细信息、状态流转、商品明细及操作记录。`,
  }
}

export default async function StockTransferDetailPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadStockTransferDetailSnapshot(id)
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource: snapshot.controlPlaneSource,
    businessDataSource: snapshot.businessDataSource,
    refreshPath: snapshot.refreshPath,
    generatedAt: snapshot.generatedAt,
    note: snapshot.note,
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 24 }}>
        <div
          style={{
            marginBottom: 24,
            borderRadius: 16,
            border: '1px solid rgba(148, 163, 184, 0.18)',
            background: 'rgba(248, 250, 252, 0.92)',
            padding: 16,
            color: '#334155',
            fontSize: 12,
            lineHeight: 1.8,
          }}
        >
          <div>
            Delivery {sourceEvidence.deliveryMode} · 来源标签: {sourceEvidence.sourceLabel} · 控制面来源:{' '}
            {sourceEvidence.controlPlaneSource}
          </div>
          <div>
            业务数据: {sourceEvidence.businessDataSource} · 刷新路径: {sourceEvidence.refreshPath}
          </div>
          <div>
            generatedAt: {sourceEvidence.generatedAt} · {sourceEvidence.note}
          </div>
        </div>
        <StockTransferDetailClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
