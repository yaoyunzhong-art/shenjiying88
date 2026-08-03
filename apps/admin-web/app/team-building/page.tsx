import TeamBuildingClient from './team-building-client'
import { loadTeamBuildingSnapshot } from './team-building-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function TeamBuildingPage() {
  const snapshot = await loadTeamBuildingSnapshot()
  return <TeamBuildingClient snapshot={snapshot} />
}
