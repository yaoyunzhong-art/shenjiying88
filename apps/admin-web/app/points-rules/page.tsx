import PointsRulesClient from './points-rules-client'
import { loadPointsRulesSnapshot } from './points-rules-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PointsRulesPage() {
  const snapshot = await loadPointsRulesSnapshot()
  return <PointsRulesClient snapshot={snapshot} />
}
