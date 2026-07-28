import PaymentConfigClient from './payment-config-client'
import { loadPaymentConfigSnapshot } from './payment-config-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PaymentConfigPage() {
  const snapshot = await loadPaymentConfigSnapshot()

  return <PaymentConfigClient snapshot={snapshot} />
}
