import SecurityClient from './security-client'
import { loadSecuritySnapshot } from './security-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function SecurityPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadSecuritySnapshot(id)

  return <SecurityClient snapshot={snapshot} />
}
