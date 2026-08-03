import EquipmentEditClient from './equipment-edit-client'
import { loadEquipmentEditSnapshot } from './equipment-edit-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EquipmentEditPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadEquipmentEditSnapshot(id)

  return <EquipmentEditClient snapshot={snapshot} />
}
