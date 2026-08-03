import { notFound } from 'next/navigation'
import RuleExecutionDetailClient from './execution-detail-client'
import { loadRuleExecutionDetailSnapshot } from './execution-detail-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function RuleExecutionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const snapshot = await loadRuleExecutionDetailSnapshot(id)

  if (!snapshot) {
    notFound()
  }

  return <RuleExecutionDetailClient snapshot={snapshot} />
}
