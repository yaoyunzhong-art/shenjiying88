import MemberEditClient from './member-edit-client'
import { loadMemberEditPageSnapshot } from './member-edit-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EditMemberPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadMemberEditPageSnapshot(id)

  return <MemberEditClient snapshot={snapshot} />
}
