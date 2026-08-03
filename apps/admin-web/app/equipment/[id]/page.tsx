import EquipmentDetailClient from './equipment-detail-client'
import { loadEquipmentDetailSnapshot } from './equipment-detail-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EquipmentDetailPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadEquipmentDetailSnapshot(id)

  return <EquipmentDetailClient snapshot={snapshot} />
}
