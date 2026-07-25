/**
 * tax.controller.ts — 税务计算 API
 */
import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { TaxService } from './tax.service'
import { TenantGuard } from '../agent/tenant.guard'
import type { TaxCalculationRequest, BatchTaxRequest } from './tax.entity'

@Controller('tax')
@UseGuards(TenantGuard)
export class TaxController {
  constructor(private readonly service: TaxService) {}

  @Post('calculate')
  calculate(@Body() body: TaxCalculationRequest) { return this.service.calculate(body) }

  @Post('calculate/batch')
  calculateBatch(@Body() body: BatchTaxRequest) { return this.service.calculateBatch(body) }
}
