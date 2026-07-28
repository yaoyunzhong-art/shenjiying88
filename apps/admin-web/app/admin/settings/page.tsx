import AdminSettingsClient from './admin-settings-client'
import { loadAdminSettingsSnapshot } from './admin-settings-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminSettingsPage() {
  const snapshot = await loadAdminSettingsSnapshot()

  return <AdminSettingsClient snapshot={snapshot} />
}
