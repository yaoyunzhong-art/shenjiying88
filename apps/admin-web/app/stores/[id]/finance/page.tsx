import FinanceClient from './finance-client'
import { loadFinanceSnapshot } from './finance-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function FinancePage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadFinanceSnapshot(id)

  return <FinanceClient snapshot={snapshot} />
}
