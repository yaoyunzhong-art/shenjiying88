import ProfitLossClient from './profit-loss-client'
import { loadProfitLossSnapshot } from './profit-loss-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type ProfitLossPageProps = {
  searchParams?: Promise<{ period?: string | string[] }>
}

export default async function ProfitLossPage({ searchParams }: ProfitLossPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const requestedPeriod = Array.isArray(resolvedSearchParams?.period)
    ? resolvedSearchParams?.period[0]
    : resolvedSearchParams?.period
  const snapshot = await loadProfitLossSnapshot(requestedPeriod)
  return <ProfitLossClient snapshot={snapshot} />
}
