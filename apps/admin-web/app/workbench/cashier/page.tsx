import CashierWorkbenchClient from './cashier-workbench-client'
import { loadCashierWorkbenchSnapshot } from './cashier-workbench-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function WorkbenchCashierPage() {
  const snapshot = await loadCashierWorkbenchSnapshot()

  return <CashierWorkbenchClient snapshot={snapshot} />
}
