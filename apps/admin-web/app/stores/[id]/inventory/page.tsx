import InventoryClient from './inventory-client'
import { loadInventorySnapshot } from './inventory-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function resolveTenantId(value: string | string[] | undefined): string {
  const tenantId = Array.isArray(value) ? value[0] : value;
  return tenantId?.trim() ? tenantId.trim() : 'tenant-p30';
}

export default async function InventoryPage({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  const snapshot = await loadInventorySnapshot(id, resolveTenantId(query.tenantId))

  return <InventoryClient snapshot={snapshot} />
}
