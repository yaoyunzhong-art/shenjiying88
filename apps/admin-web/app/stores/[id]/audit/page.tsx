import AuditClient from './audit-client'
import { loadAuditSnapshot } from './audit-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function AuditPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadAuditSnapshot(id)

  return <AuditClient snapshot={snapshot} />
}
