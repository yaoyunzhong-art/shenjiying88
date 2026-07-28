import TagsClient from './tags-client'
import { loadTagsPageSnapshot } from './tags-page-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function TagsPage() {
  const snapshot = await loadTagsPageSnapshot()

  return <TagsClient snapshot={snapshot} />
}
