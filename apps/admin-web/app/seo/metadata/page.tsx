import MetadataClient from './metadata-client'
import { loadMetadataSnapshot } from './metadata-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SEOMetadataPage() {
  const snapshot = await loadMetadataSnapshot()

  return <MetadataClient snapshot={snapshot} />
}
