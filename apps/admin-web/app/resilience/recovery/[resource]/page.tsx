import { readResilienceRecoveryPlanDetailParam } from '@m5/types'
import ResilienceRecoveryPlanDetailClient from './resilience-recovery-plan-detail-client'
import { loadResilienceRecoveryPlanDetailPageSnapshot } from './resilience-recovery-plan-detail-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ resource?: string | string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]
  }
  return value
}

export default async function ResilienceRecoveryPlanDetailPage({ params, searchParams }: PageProps) {
  const [resolvedParams, resolvedSearch] = await Promise.all([params, searchParams])
  const resource = readResilienceRecoveryPlanDetailParam(resolvedParams.resource)
  const snapshot = await loadResilienceRecoveryPlanDetailPageSnapshot(resource ?? '', {
    capability: readQueryParam(resolvedSearch.capability),
    status: readQueryParam(resolvedSearch.status),
    resource: readQueryParam(resolvedSearch.resource),
  })
  return <ResilienceRecoveryPlanDetailClient snapshot={snapshot.detail} />
}
