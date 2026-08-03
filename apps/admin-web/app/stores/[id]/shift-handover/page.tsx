import ShiftHandoverClient from './shift-handover-client'
import { loadShiftHandoverSnapshot } from './shift-handover-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function ShiftHandoverPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadShiftHandoverSnapshot(id)

  return <ShiftHandoverClient snapshot={snapshot} />
}
