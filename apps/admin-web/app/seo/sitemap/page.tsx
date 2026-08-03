import SitemapClient from './sitemap-client'
import { loadSitemapSnapshot } from './sitemap-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SitemapPage() {
  const snapshot = await loadSitemapSnapshot()

  return <SitemapClient snapshot={snapshot} />
}
