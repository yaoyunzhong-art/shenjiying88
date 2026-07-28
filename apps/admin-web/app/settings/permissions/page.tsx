import PermissionsClient from './permissions-client'
import { loadPermissionsSnapshot } from './permissions-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PermissionsPage() {
  const snapshot = await loadPermissionsSnapshot()

  return <PermissionsClient snapshot={snapshot} />
}
