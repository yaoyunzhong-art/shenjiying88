import ProductDetailClient from './product-detail-client'
import { loadProductDetailSnapshot } from './product-detail-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadProductDetailSnapshot(id)

  return <ProductDetailClient snapshot={snapshot} />
}
