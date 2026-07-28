import StaffDetailClient from './staff-detail-client'
import { loadStaffDetailSnapshot } from './staff-detail-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function StaffDetailPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadStaffDetailSnapshot(id)

  return <StaffDetailClient snapshot={snapshot} />
}
