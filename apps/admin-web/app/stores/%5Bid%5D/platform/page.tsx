import PlatformClient from './platform-client'
import { loadPlatformSnapshot } from './platform-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PlatformPage() {
  const snapshot = await loadPlatformSnapshot()
  return <PlatformClient snapshot={snapshot} />
}
