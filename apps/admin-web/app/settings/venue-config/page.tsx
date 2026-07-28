import VenueConfigClient from './venue-config-client'
import { loadVenueConfigSnapshot } from './venue-config-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function VenueConfigPage() {
  const snapshot = await loadVenueConfigSnapshot()

  return <VenueConfigClient snapshot={snapshot} />
}
