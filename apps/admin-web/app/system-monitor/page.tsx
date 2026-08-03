import SystemMonitorClient from './system-monitor-client'
import { loadSystemMonitorSnapshot } from './system-monitor-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SystemMonitorPage() {
  const snapshot = await loadSystemMonitorSnapshot()
  return <SystemMonitorClient snapshot={snapshot} />
}
