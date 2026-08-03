import HrClient from './hr-client'
import { loadHrSnapshot } from './hr-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HrPage() {
  const snapshot = await loadHrSnapshot()
  return <HrClient snapshot={snapshot} />
}
