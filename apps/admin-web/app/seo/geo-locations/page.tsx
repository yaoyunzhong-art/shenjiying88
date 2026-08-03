import GeoLocationsClient from './geo-locations-client'
import { loadGeoLocationsSnapshot } from './geo-locations-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function GeoLocationsPage() {
  const snapshot = await loadGeoLocationsSnapshot()

  return <GeoLocationsClient snapshot={snapshot} />
}
