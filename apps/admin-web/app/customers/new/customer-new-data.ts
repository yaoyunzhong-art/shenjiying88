export interface CustomerNewSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'customers-new-mock'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadCustomerNewSnapshot(): Promise<CustomerNewSnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'customers-new-mock',
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadCustomerNewSnapshot -> local customer form shell snapshot',
    businessDataSource: 'legacy customers/new workflow preserved under E54 wrapper',
    refreshPath: 'NewCustomerPage -> loadCustomerNewSnapshot()',
    note: 'E54 shell enabled for customer creation form.',
  }
}
