import IntelligenceClient from './intelligence-client'
import { loadIntelligenceSnapshot } from './intelligence-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function IntelligencePage() {
  const snapshot = await loadIntelligenceSnapshot()
  return <IntelligenceClient snapshot={snapshot} />
}
