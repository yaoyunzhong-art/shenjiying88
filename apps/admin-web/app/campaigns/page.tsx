import CampaignsClient from './campaigns-client'
import { loadCampaignsSnapshot } from './campaigns-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CampaignsPage() {
  const snapshot = await loadCampaignsSnapshot()
  return <CampaignsClient snapshot={snapshot} />
}
