import { headers } from 'next/headers'
import {
  pickForwardedRequestHeaders,
} from '../lib/server-request-context'
import FoundationWorkspaceClient from './foundation-workspace-client'
import { loadFoundationPageSnapshot, normalizeFoundationQuery } from './foundation-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface FoundationPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function FoundationPage({ searchParams }: FoundationPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const requestHeaders = pickForwardedRequestHeaders(await headers())
  const snapshot = await loadFoundationPageSnapshot(
    normalizeFoundationQuery(resolvedSearchParams),
    { headers: requestHeaders, cache: 'no-store' },
  )
  return <FoundationWorkspaceClient workspace={snapshot.workspace} query={snapshot.query} />
}
