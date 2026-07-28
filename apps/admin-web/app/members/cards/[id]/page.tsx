import MemberCardDetailClient from './member-card-detail-client'
import { loadMemberCardDetailSnapshot } from './member-card-detail-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function MemberCardDetailPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadMemberCardDetailSnapshot(id)
  return <MemberCardDetailClient snapshot={snapshot} />
}
