import MaintenanceClient from './maintenance-client'
import { loadMaintenanceSnapshot } from './maintenance-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MaintenancePage() {
  const snapshot = await loadMaintenanceSnapshot()
  return <MaintenanceClient snapshot={snapshot} />
}
