import AnnouncementDetailClient from './announcement-detail-client'
import {
  loadAnnouncementDetailSnapshot,
  normalizeAnnouncementDetailParam,
} from './announcement-detail-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id?: string | string[] }>
}

export default async function AnnouncementDetailPage({ params }: PageProps) {
  const resolvedParams = await params
  const snapshot = await loadAnnouncementDetailSnapshot(
    normalizeAnnouncementDetailParam(resolvedParams.id),
  )

  return <AnnouncementDetailClient snapshot={snapshot} />
}
