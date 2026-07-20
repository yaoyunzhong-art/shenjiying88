import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CrossModuleService } from './cross-module.service';
import type { CrossModuleValidateDto } from './cross-module.dto';
import { TenantGuard } from '../agent/tenant.guard';

export interface CrossModuleChainStatus {
  chains: {
    name: string;
    modules: string[];
    status: string;
    lastVerifiedAt?: string;
    brokenNodes?: string[];
  }[];
  total: number;
  runtime: 'cross-module-e2e';
}

@Controller('cross-module')
@UseGuards(TenantGuard)
export class CrossModuleController {
  constructor(private readonly crossModuleService: CrossModuleService) {}

  /** 返回跨模块 E2E 验证链路清单 */
  @Get('chain-status')
  getChainStatus(): CrossModuleChainStatus {
    const chains = this.crossModuleService.listChains();
    return {
      chains: chains.map((c) => ({
        name: c.name,
        modules: c.modules,
        status: c.status,
        lastVerifiedAt: c.lastVerifiedAt,
        brokenNodes: c.brokenNodes
      })),
      total: chains.length,
      runtime: 'cross-module-e2e',
    };
  }

  /** 返回验证摘要统计 */
  @Get('summary')
  getSummary() {
    return this.crossModuleService.getSummary();
  }

  /** 执行跨模块链路验证 */
  @Post('validate')
  async validate(@Body() body: CrossModuleValidateDto) {
    return this.crossModuleService.validate(body.chainNames, {
      tenantId: body.tenantId,
      storeId: body.storeId,
      marketCode: body.marketCode
    });
  }

  /** 验证单条链路 */
  @Post('validate/:chainName')
  async validateChain(@Param('chainName') chainName: string, @Body() body: CrossModuleValidateDto) {
    const results = await this.crossModuleService.validate([chainName], {
      tenantId: body.tenantId,
      storeId: body.storeId,
      marketCode: body.marketCode
    });
    return results[0] ?? null;
  }

  /** 检查是否所有链路已验证通过 */
  @Get('all-verified')
  getAllVerified() {
    const verified = this.crossModuleService.checkAllVerified();
    return { allVerified: verified, checkedAt: new Date().toISOString() };
  }

  /** 检查是否有断开链路 */
  @Get('has-broken')
  getHasBroken() {
    const broken = this.crossModuleService.checkHasBroken();
    return { hasBroken: broken, checkedAt: new Date().toISOString() };
  }

  /** 重置所有链路状态到 Defined */
  @Post('reset')
  resetAll() {
    this.crossModuleService.resetAll();
    return { reset: true, resetAt: new Date().toISOString() };
  }
}
