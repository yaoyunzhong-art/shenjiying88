import TrainingClient from './training-client'
import { loadTrainingSnapshot } from './training-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function TrainingPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadTrainingSnapshot(id)

  return <TrainingClient snapshot={snapshot} />
}
