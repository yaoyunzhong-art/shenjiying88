import CategoriesListClient from './categories-list-client'
import { loadCategoriesListSnapshot } from './categories-list-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CategoriesListPage() {
  const snapshot = await loadCategoriesListSnapshot()
  return <CategoriesListClient snapshot={snapshot} />
}
