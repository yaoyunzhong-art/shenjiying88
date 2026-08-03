import RuleDetailClient from './rule-detail-client'
import { loadRuleDetailSnapshot } from './rule-detail-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function RuleDetailPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadRuleDetailSnapshot(id)

  return <RuleDetailClient snapshot={snapshot} />
}
