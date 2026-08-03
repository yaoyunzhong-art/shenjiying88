import SeoHealthClient from './seo-health-client'
import { loadSeoHealthSnapshot } from './seo-health-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function resolveTenantId(value: string | string[] | undefined): string {
  const tenantId = Array.isArray(value) ? value[0] : value
  return tenantId?.trim() ? tenantId.trim() : 'tenant-seo'
}

export default async function SeoHealthPage({ searchParams }: PageProps) {
  const query = await searchParams
  const snapshot = await loadSeoHealthSnapshot(resolveTenantId(query.tenantId))
  return <SeoHealthClient snapshot={snapshot} />
}
