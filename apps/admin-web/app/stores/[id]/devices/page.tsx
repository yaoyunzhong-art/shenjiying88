import DevicesClient from './devices-client'
import { loadDevicesSnapshot } from './devices-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function DevicesPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadDevicesSnapshot(id)

  return <DevicesClient snapshot={snapshot} />
}
