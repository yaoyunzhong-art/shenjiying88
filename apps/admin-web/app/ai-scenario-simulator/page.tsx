import AiScenarioSimulatorClient from './ai-scenario-simulator-client'
import { loadAiScenarioSimulatorSnapshot } from './ai-scenario-simulator-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AiScenarioSimulatorPage() {
  const snapshot = await loadAiScenarioSimulatorSnapshot()
  return <AiScenarioSimulatorClient snapshot={snapshot} />
}
