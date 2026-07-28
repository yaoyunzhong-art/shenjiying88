import InspectionClient from './inspection-client'
import { loadInspectionSnapshot } from './inspection-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function InspectionPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadInspectionSnapshot(id)

  return <InspectionClient snapshot={snapshot} />
}
