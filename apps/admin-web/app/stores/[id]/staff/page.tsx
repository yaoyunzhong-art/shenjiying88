import StaffClient from './staff-client'
import { loadStaffSnapshot } from './staff-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function StaffPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadStaffSnapshot(id)

  return <StaffClient snapshot={snapshot} />
}
