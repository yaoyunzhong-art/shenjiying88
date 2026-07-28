import MemberDetailClient from './member-detail-client'
import { loadMemberDetailPageSnapshot } from './member-detail-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function MemberDetailPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadMemberDetailPageSnapshot(id)

  return <MemberDetailClient snapshot={snapshot} />
}
