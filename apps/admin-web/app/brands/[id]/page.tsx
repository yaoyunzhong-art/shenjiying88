import BrandDetailClient from './brand-detail-shell-client'
import { loadBrandDetailSnapshot } from './brand-detail-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function BrandDetailPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadBrandDetailSnapshot(id)

  return <BrandDetailClient snapshot={snapshot} />
}
