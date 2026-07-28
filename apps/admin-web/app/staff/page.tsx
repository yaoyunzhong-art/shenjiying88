import StaffClient from './staff-client'
import { loadStaffSnapshot } from './staff-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function StaffPage() {
  const snapshot = await loadStaffSnapshot()

  return <StaffClient snapshot={snapshot} />
}
