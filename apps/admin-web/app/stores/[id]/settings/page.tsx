import SettingsClient from './settings-client'
import { loadSettingsSnapshot } from './settings-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function SettingsPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadSettingsSnapshot(id)

  return <SettingsClient snapshot={snapshot} />
}
