import PromotionsClient from './promotions-client'
import { loadPromotionsSnapshot } from './promotions-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function PromotionsPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadPromotionsSnapshot(id)

  return <PromotionsClient snapshot={snapshot} />
}
