import SupplierFormClient from './supplier-form-client'
import { loadSupplierFormSnapshot } from './supplier-form-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SupplierFormPage() {
  const snapshot = await loadSupplierFormSnapshot()

  return <SupplierFormClient snapshot={snapshot} />
}
