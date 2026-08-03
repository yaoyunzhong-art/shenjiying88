import ReportsClient from './reports-client'
import { loadReportsSnapshot } from './reports-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function ReportsPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadReportsSnapshot(id)

  return <ReportsClient snapshot={snapshot} />
}
