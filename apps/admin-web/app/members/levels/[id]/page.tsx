import MemberLevelDetailClient from './member-level-detail-client'
import { loadMemberLevelDetailSnapshot } from './member-level-detail-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function MemberLevelDetailPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadMemberLevelDetailSnapshot(id)
  return <MemberLevelDetailClient snapshot={snapshot} />
}
