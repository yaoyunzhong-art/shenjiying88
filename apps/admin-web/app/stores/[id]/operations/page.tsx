import OperationsClient from './operations-client'
import { loadOperationsSnapshot } from './operations-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function OperationsPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadOperationsSnapshot(id)

  return <OperationsClient snapshot={snapshot} />
}
