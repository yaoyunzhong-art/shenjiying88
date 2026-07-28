import CategoryDetailClient from './category-detail-client'
import { loadCategoryDetailSnapshot } from './category-detail-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const snapshot = await loadCategoryDetailSnapshot(id)
  return <CategoryDetailClient snapshot={snapshot} />
}
