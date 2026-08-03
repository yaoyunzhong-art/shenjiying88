import PurchasingClient from './purchasing-client'
import { loadPurchasingSnapshot } from './purchasing-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function PurchasingPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadPurchasingSnapshot(id)

  return <PurchasingClient snapshot={snapshot} />
}
