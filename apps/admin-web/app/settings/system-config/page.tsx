import SystemConfigClient from './system-config-client'
import { loadSystemConfigSnapshot } from './system-config-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SystemConfigPage() {
  const snapshot = await loadSystemConfigSnapshot()

  return <SystemConfigClient snapshot={snapshot} />
}
