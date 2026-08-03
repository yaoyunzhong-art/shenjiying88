import EquipmentClient from './equipment-client'
import { loadEquipmentSnapshot } from './equipment-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function EquipmentPage() {
  const snapshot = await loadEquipmentSnapshot()
  return <EquipmentClient snapshot={snapshot} />
}
