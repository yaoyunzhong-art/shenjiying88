import StoresClient from './stores-client'
import { loadStoresPageSnapshot } from './stores-page-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function StoresPage() {
  const snapshot = await loadStoresPageSnapshot()
  return <StoresClient snapshot={snapshot} />
}
