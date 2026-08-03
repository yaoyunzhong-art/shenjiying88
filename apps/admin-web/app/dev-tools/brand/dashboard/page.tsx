import BrandDashboardClient from './brand-dashboard-client'
import { loadBrandDashboardSnapshot } from './brand-dashboard-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function BrandDashboardPage() {
  const snapshot = await loadBrandDashboardSnapshot()

  return <BrandDashboardClient snapshot={snapshot} />
}
