import ReconciliationClient from './reconciliation-client'
import { loadReconciliationSnapshot } from './reconciliation-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function ReconciliationPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadReconciliationSnapshot(id)

  return <ReconciliationClient snapshot={snapshot} />
}
