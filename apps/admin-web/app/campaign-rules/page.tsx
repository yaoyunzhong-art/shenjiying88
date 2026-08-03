import CampaignRulesClient from './campaign-rules-client'
import { loadCampaignRulesSnapshot } from './campaign-rules-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CampaignRulesPage() {
  const snapshot = await loadCampaignRulesSnapshot()

  return <CampaignRulesClient snapshot={snapshot} />
}
