import BrandCampaignsClient from './brand-campaigns-client'
import { loadBrandCampaignsSnapshot } from './brand-campaigns-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function BrandCampaignsPage() {
  const snapshot = await loadBrandCampaignsSnapshot()

  return <BrandCampaignsClient snapshot={snapshot} />
}
