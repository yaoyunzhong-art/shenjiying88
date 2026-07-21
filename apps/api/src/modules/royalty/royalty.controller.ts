import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'

import { TenantGuard } from '../../agent/tenant.guard'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  toRoyaltyRuleContract,
  toRoyaltyCalculationContract,
} from './royalty.contract'
import {
  CreateRoyaltyRuleDto,
  UpdateRoyaltyRuleDto,
  RoyaltyRuleFilterDto,
  CalculateRoyaltyDto,
  RoyaltyCalculationFilterDto,
  SettleRoyaltyDto,
} from './dto/royalty.dto'
import { RoyaltyService } from './royalty.service'

@UseGuards(TenantGuard)
@Controller('royalty')
export class RoyaltyController {
  constructor(private readonly royaltyService: RoyaltyService) {}

  // ── 分润规则 CRUD ──

  @Post('rules')
  createRule(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreateRoyaltyRuleDto,
  ) {
    const rule = this.royaltyService.createRule({
      tenantContext,
      brandId: body.brandId,
      collabProjectId: body.collabProjectId,
      name: body.name,
      royaltyType: body.royaltyType,
      rate: body.rate,
      fixedAmount: body.fixedAmount,
      tierConfig: body.tierConfig,
      effectiveDate: body.effectiveDate,
      expirationDate: body.expirationDate,
      description: body.description,
    })
    return toRoyaltyRuleContract(rule)
  }

  @Get('rules')
  findAllRules(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() filter?: RoyaltyRuleFilterDto,
  ) {
    const rules = this.royaltyService.findAllRules(tenantContext.tenantId, filter)
    return rules.map((r) => toRoyaltyRuleContract(r))
  }

  @Get('rules/:ruleId')
  findRuleById(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('ruleId') ruleId: string,
  ) {
    const rule = this.royaltyService.findRuleById(ruleId, tenantContext.tenantId)
    return rule ? toRoyaltyRuleContract(rule) : null
  }

  @Patch('rules/:ruleId')
  updateRule(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('ruleId') ruleId: string,
    @Body() body: UpdateRoyaltyRuleDto,
  ) {
    const rule = this.royaltyService.updateRule(ruleId, tenantContext.tenantId, {
      name: body.name,
      royaltyType: body.royaltyType,
      rate: body.rate,
      fixedAmount: body.fixedAmount,
      tierConfig: body.tierConfig,
      status: body.status,
      effectiveDate: body.effectiveDate,
      expirationDate: body.expirationDate,
      description: body.description,
    })
    return toRoyaltyRuleContract(rule)
  }

  @Delete('rules/:ruleId')
  deleteRule(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('ruleId') ruleId: string,
  ) {
    this.royaltyService.deleteRule(ruleId, tenantContext.tenantId)
    return { success: true, ruleId }
  }

  // ── 分润计算 ──

  @Post('calculate')
  calculate(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CalculateRoyaltyDto,
  ) {
    const calc = this.royaltyService.calculate(
      {
        brandId: body.brandId,
        orderId: body.orderId,
        orderAmount: body.orderAmount,
        ruleId: body.ruleId,
        collabProjectId: body.collabProjectId,
        description: body.description,
      },
      tenantContext.tenantId,
    )
    return toRoyaltyCalculationContract(calc)
  }

  // ── 分润计算结果查询 ──

  @Get('calculations')
  findAllCalculations(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() filter?: RoyaltyCalculationFilterDto,
  ) {
    const calcs = this.royaltyService.findAllCalculations(tenantContext.tenantId, {
      brandId: filter?.brandId,
      ruleId: filter?.ruleId,
      settled: filter?.settled,
      startDate: filter?.startDate,
      endDate: filter?.endDate,
    })
    return calcs.map((c) => toRoyaltyCalculationContract(c))
  }

  @Get('calculations/:calculationId')
  findCalculationById(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('calculationId') calculationId: string,
  ) {
    const calc = this.royaltyService.findCalculationById(calculationId, tenantContext.tenantId)
    return calc ? toRoyaltyCalculationContract(calc) : null
  }

  // ── 分润结算回流 ──

  @Post('settle')
  settle(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: SettleRoyaltyDto,
  ) {
    const settledCount = this.royaltyService.settleCalculations(body.calculationIds, tenantContext.tenantId)
    return { success: true, settledCount }
  }
}
