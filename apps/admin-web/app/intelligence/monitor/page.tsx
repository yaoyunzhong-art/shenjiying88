import MonitorClient from './monitor-client'
import { loadMonitorSnapshot } from './monitor-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MonitorPage() {
  const snapshot = await loadMonitorSnapshot()
  return <MonitorClient snapshot={snapshot} />
}
