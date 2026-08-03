import LicenseRenewalClient from './license-renewal-client'
import { loadLicenseRenewalSnapshot } from './license-renewal-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function LicenseRenewalPage() {
  const snapshot = await loadLicenseRenewalSnapshot()

  return <LicenseRenewalClient snapshot={snapshot} />
}
