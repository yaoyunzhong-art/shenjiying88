import UsersClient from './users-client'
import { loadUsersSnapshot } from './users-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function UsersPage() {
  const snapshot = await loadUsersSnapshot()
  return <UsersClient snapshot={snapshot} />
}
