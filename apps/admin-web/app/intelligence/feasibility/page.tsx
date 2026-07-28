import FeasibilityClient from './feasibility-client'
import { loadFeasibilitySnapshot } from './feasibility-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface FeasibilityPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function FeasibilityPage({ searchParams }: FeasibilityPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const snapshot = await loadFeasibilitySnapshot(resolvedSearchParams)
  return <FeasibilityClient snapshot={snapshot} />
}
