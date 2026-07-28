import RulesClient from './rules-client'
import { loadRulesSnapshot } from './rules-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function RulesPage() {
  const snapshot = await loadRulesSnapshot()
  return <RulesClient snapshot={snapshot} />
}
