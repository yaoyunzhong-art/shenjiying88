/**
 * tax.controller.ts — 税务计算 API
 */
import { Controller, Post, Body } from '@nestjs/common'
import { TaxService } from './tax.service'

@Controller('tax')
export class TaxController {
  constructor(private readonly service: TaxService) {}

  @Post('calculate')
  calculate(@Body() body: any) { return this.service.calculate(body) }

  @Post('calculate/batch')
  calculateBatch(@Body() body: any) { return this.service.calculateBatch(body) }
}
