import AiCsClient from './ai-cs-client'
import { loadAiCsSnapshot } from './ai-cs-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  searchParams?: Promise<{ tenantId?: string | string[] }>
}

export default async function AiCsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const tenantIdParam = resolvedSearchParams?.tenantId
  const tenantId = Array.isArray(tenantIdParam) ? tenantIdParam[0] : tenantIdParam
  const snapshot = await loadAiCsSnapshot(tenantId ?? 'demo-tenant')
  return <AiCsClient snapshot={snapshot} />
}
