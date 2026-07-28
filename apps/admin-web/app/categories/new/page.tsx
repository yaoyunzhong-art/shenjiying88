import NewCategoryClient from './new-category-client'
import { loadNewCategorySnapshot } from './new-category-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NewCategoryPage() {
  const snapshot = await loadNewCategorySnapshot()
  return <NewCategoryClient snapshot={snapshot} />
}
