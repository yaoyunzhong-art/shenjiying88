import AdminDashboardClient from './dashboard-client'
import { loadAdminDashboardSnapshot } from './dashboard-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminDashboardPage() {
  const snapshot = await loadAdminDashboardSnapshot()
  return <AdminDashboardClient snapshot={snapshot} />
}
