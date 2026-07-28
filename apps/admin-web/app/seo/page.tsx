import SeoClient from './seo-client'
import { loadSeoSnapshot } from './seo-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SeoPage() {
  const snapshot = await loadSeoSnapshot()

  return <SeoClient snapshot={snapshot} />
}
