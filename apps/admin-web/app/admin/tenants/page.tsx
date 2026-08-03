import { loadTenantsSnapshot } from '../../tenants-data'
import TenantsClient from './tenants-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminTenantsPage() {
  const snapshot = await loadTenantsSnapshot()
  return <TenantsClient snapshot={snapshot} />
}
