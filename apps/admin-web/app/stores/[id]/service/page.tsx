import ServiceClient from './service-client'
import { loadServiceSnapshot } from './service-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function ServicePage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadServiceSnapshot(id)

  return <ServiceClient snapshot={snapshot} />
}
