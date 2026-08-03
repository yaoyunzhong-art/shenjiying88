import SchedulingClient from './scheduling-client'
import { loadSchedulingSnapshot } from './scheduling-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function SchedulingPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadSchedulingSnapshot(id)

  return <SchedulingClient snapshot={snapshot} />
}
