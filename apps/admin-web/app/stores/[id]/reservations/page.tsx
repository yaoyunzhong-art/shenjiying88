import ReservationsClient from './reservations-client'
import { loadReservationsSnapshot } from './reservations-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function ReservationsPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadReservationsSnapshot(id)

  return <ReservationsClient snapshot={snapshot} />
}
