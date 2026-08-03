import FinanceDetailClient from './finance-detail-client'
import { loadFinanceDetailSnapshot } from './finance-detail-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function FinanceDetailPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadFinanceDetailSnapshot(id)

  return <FinanceDetailClient snapshot={snapshot} />
}
