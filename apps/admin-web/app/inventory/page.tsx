import InventoryClient from './inventory-client'
import { loadInventoryPageSnapshot } from './inventory-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function resolveTenantId(value: string | string[] | undefined): string {
  const tenantId = Array.isArray(value) ? value[0] : value
  return tenantId?.trim() ? tenantId.trim() : 'demo-tenant'
}

export default async function InventoryPage({ searchParams }: PageProps) {
  const query = await searchParams
  const snapshot = await loadInventoryPageSnapshot(resolveTenantId(query.tenantId))

  return <InventoryClient snapshot={snapshot} />
}
