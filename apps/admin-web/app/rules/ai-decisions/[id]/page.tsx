import AiDecisionDetailClient from './ai-decision-detail-client'
import { loadAiDecisionDetailSnapshot } from './ai-decision-detail-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id?: string | string[] }>
}

function readDecisionId(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }
  return value ?? null
}

export default async function AiDecisionDetailPage({ params }: PageProps) {
  const resolvedParams = await params
  const id = readDecisionId(resolvedParams.id) ?? ''
  const snapshot = await loadAiDecisionDetailSnapshot(id)
  return <AiDecisionDetailClient snapshot={snapshot} />
}
