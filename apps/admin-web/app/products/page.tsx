import ProductsClient from './products-client'
import { loadProductsPageSnapshot } from './products-page-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProductsPage() {
  const snapshot = await loadProductsPageSnapshot()

  return <ProductsClient snapshot={snapshot} />
}
