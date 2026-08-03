import FinanceInvoicesClient from './invoices-client'
import { loadFinanceInvoicesSnapshot } from './invoices-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function FinanceInvoicesPage() {
  const snapshot = await loadFinanceInvoicesSnapshot()

  return <FinanceInvoicesClient snapshot={snapshot} />
}
