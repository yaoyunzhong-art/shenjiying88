import TenantClient from './tenant-client'
import { loadTenantSnapshot } from './tenant-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function resolveTenantId(value: string | string[] | undefined): string {
  const tenantId = Array.isArray(value) ? value[0] : value;
  return tenantId?.trim() ? tenantId.trim() : 'tenant-dwy';
}

export default async function TenantPage({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  const snapshot = await loadTenantSnapshot(id, resolveTenantId(query.tenantId))

  return <TenantClient snapshot={snapshot} />
}
