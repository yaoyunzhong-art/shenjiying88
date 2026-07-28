import TenantDetailClient from './tenant-detail-client'
import { loadTenantDetailSnapshot } from './tenant-detail-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function TenantDetailPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadTenantDetailSnapshot(id)

  return <TenantDetailClient snapshot={snapshot} />
}
