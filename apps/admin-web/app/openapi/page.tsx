import OpenApiWorkbenchClient from './openapi-client'
import { loadOpenApiWorkbenchSnapshot } from './openapi-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function OpenApiWorkbenchPage() {
  const snapshot = await loadOpenApiWorkbenchSnapshot()

  return <OpenApiWorkbenchClient snapshot={snapshot} />
}
