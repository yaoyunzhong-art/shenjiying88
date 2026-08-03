import AuditLogsClient from './audit-logs-client'
import { loadAuditLogsPageSnapshot } from './audit-logs-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AuditLogsPage() {
  const snapshot = await loadAuditLogsPageSnapshot()

  return <AuditLogsClient snapshot={snapshot} />
}
