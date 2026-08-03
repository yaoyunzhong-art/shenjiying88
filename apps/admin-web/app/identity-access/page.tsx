import type { IdentityAccessWorkspaceQuery } from '@m5/types'
import { loadIdentityAccessPageSnapshot } from './identity-access-data'
import IdentityAccessWorkspaceClient from './identity-access-workspace-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface IdentityAccessPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]
  }
  return value
}

function normalizeIdentityAccessQuery(
  params: Record<string, string | string[] | undefined> = {},
): IdentityAccessWorkspaceQuery {
  return {
    tenantId: readQueryParam(params.tenantId),
    brandId: readQueryParam(params.brandId),
    storeId: readQueryParam(params.storeId),
    marketCode: readQueryParam(params.marketCode),
  }
}

export default async function IdentityAccessPage({ searchParams }: IdentityAccessPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const snapshot = await loadIdentityAccessPageSnapshot(
    normalizeIdentityAccessQuery(resolvedSearchParams),
  )
  return <IdentityAccessWorkspaceClient snapshot={snapshot} />
}
