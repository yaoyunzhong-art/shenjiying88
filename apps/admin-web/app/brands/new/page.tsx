import BrandFormClient from './brand-form-client'
import { loadBrandFormSnapshot } from './brand-form-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NewBrandPage() {
  const snapshot = await loadBrandFormSnapshot()

  return <BrandFormClient snapshot={snapshot} />
}
