/**
 * tax.controller.ts — 税务计算 API
 */
import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { TaxService } from './tax.service'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('tax')
@UseGuards(TenantGuard)
export class TaxController {
  constructor(private readonly service: TaxService) {}

  @Post('calculate')
  calculate(@Body() body: any) { return this.service.calculate(body) }

  @Post('calculate/batch')
  calculateBatch(@Body() body: any) { return this.service.calculateBatch(body) }
}
