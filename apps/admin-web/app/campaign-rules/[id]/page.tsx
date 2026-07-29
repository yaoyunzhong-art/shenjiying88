import { notFound } from 'next/navigation'
import CampaignRuleDetailClient from './campaign-rule-detail-client'
import { loadCampaignRuleDetailSnapshot } from './campaign-rule-detail-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CampaignRuleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const snapshot = await loadCampaignRuleDetailSnapshot(id)

  if (!snapshot) {
    notFound()
  }

  return <CampaignRuleDetailClient snapshot={snapshot} />
}
