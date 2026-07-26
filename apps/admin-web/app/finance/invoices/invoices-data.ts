export type InvoiceType = 'ELECTRONIC' | 'PAPER' | 'SPECIAL'
export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'CANCELLED'

export interface Invoice {
  id: string
  invoiceNo: string
  orderId: string | null
  type: InvoiceType
  amountCents: number
  taxAmountCents: number
  taxRate: number
  status: InvoiceStatus
  buyerName: string | null
  buyerTaxId: string | null
  buyerEmail: string | null
  remark: string | null
  issuedAt: string | null
  cancelledAt: string | null
  createdAt: string
}

export interface InvoiceCreateForm {
  orderId: string
  type: InvoiceType
  amountCents: number
  taxRate: number
  buyerName: string
  buyerTaxId: string
  buyerEmail: string
  remark: string
}

export interface FinanceInvoicesSnapshotDelivery {
  deliveryMode: 'mock'
  invoices: Invoice[]
  generatedAt: string
}

export const defaultInvoiceCreateForm: InvoiceCreateForm = {
  orderId: '',
  type: 'ELECTRONIC',
  amountCents: 0,
  taxRate: 0.13,
  buyerName: '',
  buyerTaxId: '',
  buyerEmail: '',
  remark: '',
}

export const defaultInvoices: Invoice[] = [
  {
    id: 'inv-demo-1',
    invoiceNo: 'INV-20260719-001',
    orderId: 'ORD-20260719-1001',
    type: 'ELECTRONIC',
    amountCents: 36800,
    taxAmountCents: 4230,
    taxRate: 0.13,
    status: 'ISSUED',
    buyerName: '神机营科技',
    buyerTaxId: '91110108MA01XXXXX',
    buyerEmail: 'billing@sjy.tech',
    remark: null,
    issuedAt: '2026-07-19T10:00:00Z',
    cancelledAt: null,
    createdAt: '2026-07-19T09:30:00Z',
  },
  {
    id: 'inv-demo-2',
    invoiceNo: 'INV-20260719-002',
    orderId: 'ORD-20260719-1002',
    type: 'ELECTRONIC',
    amountCents: 12500,
    taxAmountCents: 1438,
    taxRate: 0.13,
    status: 'DRAFT',
    buyerName: '体验店A',
    buyerTaxId: null,
    buyerEmail: null,
    remark: '等待客户确认抬头信息',
    issuedAt: null,
    cancelledAt: null,
    createdAt: '2026-07-19T10:30:00Z',
  },
  {
    id: 'inv-demo-3',
    invoiceNo: 'INV-20260718-003',
    orderId: 'ORD-20260718-2008',
    type: 'SPECIAL',
    amountCents: 56000,
    taxAmountCents: 7280,
    taxRate: 0.13,
    status: 'CANCELLED',
    buyerName: '华北联营门店',
    buyerTaxId: '91110105MA88XXXXX',
    buyerEmail: 'finance@huabei.example',
    remark: '原单作废后待重开',
    issuedAt: '2026-07-18T08:00:00Z',
    cancelledAt: '2026-07-18T12:00:00Z',
    createdAt: '2026-07-18T07:45:00Z',
  },
]

function getInvoiceEvidenceTime(invoice: Invoice): string {
  return invoice.cancelledAt ?? invoice.issuedAt ?? invoice.createdAt
}

function getLatestInvoiceTimestamp(invoices: Invoice[]): string {
  if (invoices.length === 0) return '—'
  return invoices.reduce(
    (latest, invoice) => {
      const current = getInvoiceEvidenceTime(invoice)
      return current > latest ? current : latest
    },
    getInvoiceEvidenceTime(invoices[0]!)
  )
}

export async function loadFinanceInvoicesSnapshot(): Promise<FinanceInvoicesSnapshotDelivery> {
  return {
    deliveryMode: 'mock',
    invoices: defaultInvoices,
    generatedAt: getLatestInvoiceTimestamp(defaultInvoices),
  }
}
