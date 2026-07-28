import SecurityClient from './security-client'
import { loadSecuritySnapshot } from './security-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SecurityPage() {
  const snapshot = await loadSecuritySnapshot()

  return <SecurityClient snapshot={snapshot} />
}
