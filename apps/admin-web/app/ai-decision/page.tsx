import AiDecisionClient from './ai-decision-client'
import { loadAiDecisionSnapshot } from './ai-decision-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AiDecisionPage() {
  const snapshot = await loadAiDecisionSnapshot()

  return <AiDecisionClient snapshot={snapshot} />
}
