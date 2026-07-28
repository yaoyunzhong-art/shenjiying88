import MarketingWorkbenchClient from './marketing-workbench-client'
import { loadMarketingWorkbenchSnapshot } from './marketing-workbench-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MarketingWorkbenchPage() {
  const snapshot = await loadMarketingWorkbenchSnapshot()

  return <MarketingWorkbenchClient snapshot={snapshot} />
}
