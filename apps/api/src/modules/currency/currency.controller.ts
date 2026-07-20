import {
  Controller,
  Get,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common'

import { TenantGuard } from '../agent/tenant.guard'

import { CurrencyService } from './currency.service'
import type { CurrencyCode, Money, ConvertResponse, SetRateRequest, RateItem } from './currency.entity'
import {
  ConvertRequestDto,
  SetRateRequestDto,
  ArithmeticRequestDto,
  ConfigUpdateDto
} from './currency.dto'

@UseGuards(TenantGuard)
@Controller('currency')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  /**
   * 获取所有汇率
   * GET /currency/rates
   */
  @Get('rates')
  getAllRates(): RateItem[] {
    const rates = this.currencyService.getAllRates()
    return rates.map(r => ({
      from: r.from,
      to: r.to,
      rate: r.rate,
      source: r.source,
      updatedAt: r.updatedAt.toISOString()
    }))
  }

  /**
   * 获取本位币对所有货币的汇率
   * GET /currency/rates/base
   */
  @Get('rates/base')
  getBaseRates(): Record<string, number> {
    const config = this.currencyService.getConfig()
    return this.currencyService.getRatesFromBase(config.baseCurrency)
  }

  /**
   * 货币转换
   * POST /currency/convert
   */
  @Post('convert')
  convert(@Body() body: ConvertRequestDto): ConvertResponse {
    const { amount, from, to } = body
    const fromCode = from as CurrencyCode
    const toCode = to as CurrencyCode

    const rate = this.currencyService.getRate(fromCode, toCode)
    const convertedAmount = this.currencyService.convertAmount(amount, fromCode, toCode)

    return {
      originalAmount: amount,
      originalCurrency: fromCode,
      convertedAmount,
      targetCurrency: toCode,
      rate: rate?.rate ?? 0,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * 设置汇率
   * POST /currency/rates
   */
  @Post('rates')
  setRate(@Body() body: SetRateRequestDto): { success: true; rate: number; from: string; to: string } {
    const { from, to, rate, source } = body
    this.currencyService.setRate(from as CurrencyCode, to as CurrencyCode, rate, source)
    return { success: true, rate, from, to }
  }

  /**
   * 金额加法
   * POST /currency/add
   */
  @Post('add')
  add(@Body() body: ArithmeticRequestDto): Money {
    return this.currencyService.add(
      { amount: body.a.amount, currency: body.a.currency as CurrencyCode },
      { amount: body.b.amount, currency: body.b.currency as CurrencyCode }
    )
  }

  /**
   * 金额减法
   * POST /currency/subtract
   */
  @Post('subtract')
  subtract(@Body() body: ArithmeticRequestDto): Money {
    return this.currencyService.subtract(
      { amount: body.a.amount, currency: body.a.currency as CurrencyCode },
      { amount: body.b.amount, currency: body.b.currency as CurrencyCode }
    )
  }

  /**
   * 获取当前配置
   * GET /currency/config
   */
  @Get('config')
  getConfig() {
    return this.currencyService.getConfig()
  }

  /**
   * 更新配置
   * POST /currency/config
   */
  @Post('config')
  updateConfig(@Body() body: ConfigUpdateDto): { config: ReturnType<CurrencyService['getConfig']> } {
    this.currencyService.setConfig(body as Partial<import('./currency.entity').CurrencyConfig>)
    return { config: this.currencyService.getConfig() }
  }
}
