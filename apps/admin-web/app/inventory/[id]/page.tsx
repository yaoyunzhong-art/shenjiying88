import InventoryDetailClient from './inventory-detail-client'
import { loadInventoryDetailSnapshot } from './inventory-detail-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function resolveTenantId(value: string | string[] | undefined): string {
  const tenantId = Array.isArray(value) ? value[0] : value
  return tenantId?.trim() ? tenantId.trim() : 'demo-tenant'
}

export default async function InventoryDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  const snapshot = await loadInventoryDetailSnapshot(id, resolveTenantId(query.tenantId))

  return <InventoryDetailClient snapshot={snapshot} />
}
