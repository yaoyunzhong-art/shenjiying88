import RuleExecutionsClient from './executions-client'
import { loadRuleExecutionsSnapshot } from './executions-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function RuleExecutionsPage() {
  const snapshot = await loadRuleExecutionsSnapshot()

  return <RuleExecutionsClient snapshot={snapshot} />
}
