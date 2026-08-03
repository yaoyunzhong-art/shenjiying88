import CapabilityAccessClient from './capability-access-client'
import { loadCapabilityAccessSnapshot } from './capability-access-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function CapabilityAccessPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadCapabilityAccessSnapshot(id)

  return <CapabilityAccessClient snapshot={snapshot} />
}
