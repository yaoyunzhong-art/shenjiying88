import PaymentChannelsClient from './payment-channels-client'
import { loadPaymentChannelsSnapshot } from './payment-channels-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PaymentChannelsPage() {
  const snapshot = await loadPaymentChannelsSnapshot()

  return <PaymentChannelsClient snapshot={snapshot} />
}
