import FeedbackClient from './feedback-client'
import { loadFeedbackSnapshot } from './feedback-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function FeedbackPage() {
  const snapshot = await loadFeedbackSnapshot()
  return <FeedbackClient snapshot={snapshot} />
}
