import MemberTierDetailClient from './member-tier-detail-client'
import { loadMemberTierDetailPageSnapshot } from './member-tier-detail-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function MemberTierDetailPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadMemberTierDetailPageSnapshot(id)

  return <MemberTierDetailClient snapshot={snapshot} />
}
