import { Injectable, Optional, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import type { RequestTenantContext } from '../tenant/tenant.types'

/**
 * InvoiceV2 service — Prisma-backed invoice persistence (B2-5)
 *
 * Replaces the in-memory invoice Map in FinanceService with proper
 * database storage via Prisma.
 *
 * Invoice states:
 *   DRAFT → ISSUED → CANCELLED
 *        → RED_FLUSH
 *        → ARCHIVED
 *
 * Only DRAFT invoices can be issued.
 * Already-cancelled invoices cannot be cancelled again.
 */

export interface CreateInvoiceV2Input {
  tenantId: string
  orderId?: string | null
  type: string
  amountCents: number
  taxAmountCents?: number
  taxRate?: number
  buyerName?: string | null
  buyerTaxId?: string | null
  buyerEmail?: string | null
  remark?: string | null
}

export interface InvoiceV2Record {
  id: string
  tenantId: string
  invoiceNo: string
  orderId: string | null
  type: string
  amountCents: number
  taxAmountCents: number
  taxRate: number
  status: string
  buyerName: string | null
  buyerTaxId: string | null
  buyerEmail: string | null
  remark: string | null
  issuedAt: Date | null
  cancelledAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface ListInvoiceV2Filter {
  tenantId: string
  orderId?: string
  type?: string
  status?: string
  limit?: number
  offset?: number
}

export interface ListInvoiceV2Result {
  items: InvoiceV2Record[]
  total: number
}

@Injectable()
export class FinanceInvoiceService {
  constructor(
    @Optional() private readonly prisma?: PrismaService
  ) {}

  /**
   * Generate invoice number: INV-YYYYMMDD-NNNNNN
   * Sequential within the same day, 6-digit padded.
   */
  private async generateInvoiceNo(): Promise<string> {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    const prefix = `INV-${y}${m}${d}-`

    if (!this.prisma) {
      // Fallback for legacy tests without DB
      return `${prefix}000001`
    }

    // Find the last invoice with today's prefix
    const last = await this.prisma.invoiceV2.findFirst({
      where: { invoiceNo: { startsWith: prefix } },
      orderBy: { invoiceNo: 'desc' },
      select: { invoiceNo: true },
    })

    let seq = 1
    if (last) {
      const lastSeq = parseInt(last.invoiceNo.slice(prefix.length), 10)
      if (!Number.isNaN(lastSeq)) {
        seq = lastSeq + 1
      }
    }

    return `${prefix}${String(seq).padStart(6, '0')}`
  }

  /**
   * Create a new invoice in DRAFT status.
   */
  async createInvoice(
    tenantContext: RequestTenantContext,
    input: CreateInvoiceV2Input
  ): Promise<InvoiceV2Record> {
    const invoiceNo = await this.generateInvoiceNo()

    const created = await this.prisma!.invoiceV2.create({
      data: {
        tenantId: input.tenantId,
        invoiceNo,
        orderId: input.orderId ?? null,
        type: input.type,
        amountCents: input.amountCents,
        taxAmountCents: input.taxAmountCents ?? 0,
        taxRate: input.taxRate ?? 0.13,
        status: 'DRAFT',
        buyerName: input.buyerName ?? null,
        buyerTaxId: input.buyerTaxId ?? null,
        buyerEmail: input.buyerEmail ?? null,
        remark: input.remark ?? null,
      },
    })

    return this.toRecord(created)
  }

  /**
   * Issue a DRAFT invoice (transition to ISSUED).
   * Throws if not in DRAFT status.
   */
  async issueInvoice(
    invoiceId: string,
    tenantContext: RequestTenantContext
  ): Promise<InvoiceV2Record> {
    const invoice = await this.getInvoiceEntity(invoiceId, tenantContext.tenantId)

    if (invoice.status !== 'DRAFT') {
      throw new BadRequestException(
        `Cannot issue invoice ${invoiceId}: current status is ${invoice.status}, expected DRAFT`
      )
    }

    const updated = await this.prisma!.invoiceV2.update({
      where: { id: invoiceId },
      data: {
        status: 'ISSUED',
        issuedAt: new Date(),
      },
    })

    return this.toRecord(updated)
  }

  /**
   * Cancel an invoice.
   * Throws if already cancelled.
   */
  async cancelInvoice(
    invoiceId: string,
    tenantContext: RequestTenantContext
  ): Promise<InvoiceV2Record> {
    const invoice = await this.getInvoiceEntity(invoiceId, tenantContext.tenantId)

    if (invoice.status === 'CANCELLED') {
      throw new ConflictException(
        `Invoice ${invoiceId} is already cancelled`
      )
    }

    const updated = await this.prisma!.invoiceV2.update({
      where: { id: invoiceId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    })

    return this.toRecord(updated)
  }

  /**
   * Get a single invoice by ID.
   */
  async getInvoice(
    invoiceId: string,
    tenantContext: RequestTenantContext
  ): Promise<InvoiceV2Record> {
    const invoice = await this.getInvoiceEntity(invoiceId, tenantContext.tenantId)
    return this.toRecord(invoice)
  }

  /**
   * List invoices with optional filtering.
   */
  async listInvoices(
    filter: ListInvoiceV2Filter
  ): Promise<ListInvoiceV2Result> {
    const where: Record<string, unknown> = {
      tenantId: filter.tenantId,
    }
    if (filter.orderId) where.orderId = filter.orderId
    if (filter.type) where.type = filter.type
    if (filter.status) where.status = filter.status

    const limit = filter.limit && filter.limit > 0 ? Math.min(filter.limit, 100) : 20
    const offset = filter.offset && filter.offset > 0 ? filter.offset : 0

    const [items, total] = await Promise.all([
      this.prisma!.invoiceV2.findMany({
        where: where as any,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma!.invoiceV2.count({ where: where as any }),
    ])

    return {
      items: items.map(i => this.toRecord(i)),
      total,
    }
  }

  // ═══════════════════════════════════════════════════
  // Internal helpers
  // ═══════════════════════════════════════════════════

  private async getInvoiceEntity(
    invoiceId: string,
    tenantId: string
  ): Promise<any> {
    if (!this.prisma) {
      throw new Error('PrismaService not available')
    }
    const invoice = await this.prisma.invoiceV2.findUnique({
      where: { id: invoiceId },
    })

    if (!invoice || invoice.tenantId !== tenantId) {
      throw new NotFoundException(`Invoice ${invoiceId} not found`)
    }

    return invoice
  }

  private toRecord(raw: any): InvoiceV2Record {
    return {
      id: raw.id,
      tenantId: raw.tenantId,
      invoiceNo: raw.invoiceNo,
      orderId: raw.orderId,
      type: raw.type,
      amountCents: raw.amountCents,
      taxAmountCents: raw.taxAmountCents,
      taxRate: raw.taxRate,
      status: raw.status,
      buyerName: raw.buyerName,
      buyerTaxId: raw.buyerTaxId,
      buyerEmail: raw.buyerEmail,
      remark: raw.remark,
      issuedAt: raw.issuedAt,
      cancelledAt: raw.cancelledAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    }
  }
}
