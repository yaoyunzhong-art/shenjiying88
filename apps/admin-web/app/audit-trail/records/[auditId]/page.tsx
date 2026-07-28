import { readAuditTrailRecordDetailParam } from '@m5/types'

import AuditTrailRecordDetailShellClient from './audit-trail-record-detail-shell-client'
import { loadAuditTrailRecordDetailSnapshot } from './audit-trail-record-detail-data'

interface PageProps {
  params: Promise<{ auditId?: string | string[] }>
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AuditTrailRecordDetailPage({ params }: PageProps) {
  const resolved = await params
  const auditId = readAuditTrailRecordDetailParam(resolved.auditId)
  const snapshot = await loadAuditTrailRecordDetailSnapshot(auditId)
  return <AuditTrailRecordDetailShellClient snapshot={snapshot} />
}
