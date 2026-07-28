import SupplierDetailClient from './supplier-detail-client'
import { loadSupplierDetailSnapshot } from './supplier-detail-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function SupplierDetailPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadSupplierDetailSnapshot(id)
  return <SupplierDetailClient snapshot={snapshot} />
}
