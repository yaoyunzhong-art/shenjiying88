import InventoryRulesClient from './inventory-rules-client'
import { loadInventoryRulesSnapshot } from './inventory-rules-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function resolveTenantId(value: string | string[] | undefined): string {
  const tenantId = Array.isArray(value) ? value[0] : value
  return tenantId?.trim() ? tenantId.trim() : 'demo-tenant'
}

export default async function InventoryRulesPage({ searchParams }: PageProps) {
  const query = await searchParams
  const snapshot = await loadInventoryRulesSnapshot(resolveTenantId(query.tenantId))

  return <InventoryRulesClient snapshot={snapshot} />
}
