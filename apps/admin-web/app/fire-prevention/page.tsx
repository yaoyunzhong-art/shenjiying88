import FirePreventionClient from './fire-prevention-client'
import { loadFirePreventionSnapshot } from './fire-prevention-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function FirePreventionPage() {
  const snapshot = await loadFirePreventionSnapshot()
  return <FirePreventionClient snapshot={snapshot} />
}
