import MembersClient from './members-client'
import { loadMembersSnapshot } from './members-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function MembersPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadMembersSnapshot(id)

  return <MembersClient snapshot={snapshot} />
}
