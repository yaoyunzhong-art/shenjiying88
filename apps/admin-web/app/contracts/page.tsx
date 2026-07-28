import ContractsClient from './contracts-client'
import { loadContractsSnapshot } from './contracts-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ContractsPage() {
  const snapshot = await loadContractsSnapshot()
  return <ContractsClient snapshot={snapshot} />
}
