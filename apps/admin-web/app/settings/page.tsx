import SettingsClient from './settings-client'
import { loadSettingsSnapshot } from './settings-page-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SettingsPage() {
  const snapshot = await loadSettingsSnapshot()

  return <SettingsClient snapshot={snapshot} />
}
