import ImportMembersClient from './import-members-client'
import { loadImportMembersPageSnapshot } from './import-members-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ImportMembersPage() {
  const snapshot = await loadImportMembersPageSnapshot()

  return <ImportMembersClient snapshot={snapshot} />
}
