import BrandClient from './brand-client'
import { loadBrandSnapshot } from './brand-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function BrandPage() {
  const snapshot = await loadBrandSnapshot()

  return <BrandClient snapshot={snapshot} />
}
