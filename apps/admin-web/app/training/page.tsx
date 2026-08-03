import TrainingPageClient from './training-page-client'
import { loadTrainingPageSnapshot } from './training-page-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function TrainingPage() {
  const snapshot = await loadTrainingPageSnapshot()

  return <TrainingPageClient snapshot={snapshot} />
}
