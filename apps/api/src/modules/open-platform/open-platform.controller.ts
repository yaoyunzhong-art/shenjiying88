// open-platform.controller.ts · WP-07 开放平台与ISV
// BS-0100~BS-0113

import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OpenPlatformService } from './open-platform.service';
import {
  IsvAppStatus,
  SdkLanguage,
} from './open-platform.entity';

@Controller('open-platform')
export class OpenPlatformController {
  constructor(private readonly svc: OpenPlatformService) {}

  // ══════════════════════════════════════════════════════
  // BS-0112: 开发者注册
  // ══════════════════════════════════════════════════════

  /**
   * POST /open-platform/developers — 注册 ISV 开发者
   */
  @Post('developers')
  @HttpCode(HttpStatus.CREATED)
  registerDeveloper(
    @Body() body: {
      name: string;
      email: string;
      bio?: string;
      website?: string;
      phone?: string;
    },
  ): any {
    return this.svc.registerDeveloper(body);
  }

  /**
   * GET /open-platform/developers/:id — 开发者信息
   */
  @Get('developers/:id')
  getDeveloper(@Param('id') id: string): any {
    return this.svc.getDeveloper(id);
  }

  /**
   * GET /open-platform/developers — 开发者列表
   */
  @Get('developers')
  listDevelopers(): any {
    return { developers: this.svc.listDevelopers() };
  }

  // ══════════════════════════════════════════════════════
  // BS-0100: ISV 应用注册
  // ══════════════════════════════════════════════════════

  /**
   * POST /open-platform/apps — 注册 ISV 应用
   */
  @Post('apps')
  @HttpCode(HttpStatus.CREATED)
  registerApp(
    @Body() body: {
      name: string;
      description: string;
      developerId: string;
      iconUrl?: string;
      category?: string;
    },
  ): any {
    return this.svc.registerApp(body);
  }

  /**
   * GET /open-platform/apps — 应用列表
   */
  @Get('apps')
  listApps(
    @Query('developerId') developerId?: string,
    @Query('status') status?: IsvAppStatus,
    @Query('category') category?: string,
  ): any {
    return { apps: this.svc.listApps({ developerId, status, category }) };
  }

  /**
   * GET /open-platform/apps/:id — 应用详情
   */
  @Get('apps/:id')
  getApp(@Param('id') id: string): any {
    return this.svc.getApp(id);
  }

  /**
   * PATCH /open-platform/apps/:id/status — 审核/上架/下架应用
   */
  @Patch('apps/:id/status')
  @HttpCode(HttpStatus.OK)
  updateAppStatus(
    @Param('id') id: string,
    @Body() body: { status: IsvAppStatus; reviewNote?: string; reviewer: string },
  ): any {
    return this.svc.updateAppStatus(id, body);
  }

  // ══════════════════════════════════════════════════════
  // BS-0101: API 密钥管理
  // ══════════════════════════════════════════════════════

  /**
   * POST /open-platform/keys/generate — 生成 API 密钥
   */
  @Post('keys/generate')
  @HttpCode(HttpStatus.CREATED)
  generateKey(
    @Body() body: { appId: string; createdBy: string },
  ): any {
    return this.svc.generateApiKeyPair(body.appId, body.createdBy);
  }

  /**
   * POST /open-platform/keys/rotate — 轮换密钥
   */
  @Post('keys/rotate')
  @HttpCode(HttpStatus.OK)
  rotateKey(
    @Body() body: { keyId: string; createdBy: string },
  ): any {
    return this.svc.rotateApiKey(body.keyId, body.createdBy);
  }

  /**
   * POST /open-platform/keys/revoke — 吊销密钥
   */
  @Post('keys/revoke')
  @HttpCode(HttpStatus.OK)
  revokeKey(
    @Body() body: { keyId: string; reason: string },
  ): any {
    return this.svc.revokeApiKey(body.keyId, body.reason);
  }

  // ══════════════════════════════════════════════════════
  // BS-0103: 调用量统计
  // ══════════════════════════════════════════════════════

  /**
   * GET /open-platform/usage — 调用量统计
   */
  @Get('usage')
  getUsage(
    @Query('appId') appId?: string,
    @Query('developerId') developerId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): any {
    return this.svc.getUsageStats({ appId, developerId, startDate, endDate });
  }

  /**
   * POST /open-platform/usage/record — 记录调用
   */
  @Post('usage/record')
  @HttpCode(HttpStatus.CREATED)
  recordCall(
    @Body() body: {
      appId: string;
      developerId: string;
      endpoint: string;
      cost: number;
      statusCode: number;
      signature: string;
      ipAddress?: string;
      durationMs: number;
    },
  ): any {
    return this.svc.recordCall(body);
  }

  // ══════════════════════════════════════════════════════
  // BS-0108~BS-0110: 计费
  // ══════════════════════════════════════════════════════

  /**
   * POST /open-platform/billing — 生成账单
   */
  @Post('billing')
  @HttpCode(HttpStatus.CREATED)
  generateBilling(
    @Body() body: { billingMonth: string; appId: string },
  ): any {
    return this.svc.generateBilling(body.billingMonth, body.appId);
  }

  /**
   * POST /open-platform/billing/:id/settle — 结算账单
   */
  @Post('billing/:id/settle')
  @HttpCode(HttpStatus.OK)
  settleBilling(@Param('id') id: string): any {
    return this.svc.settleBilling(id);
  }

  // ══════════════════════════════════════════════════════
  // BS-0109: SLA 管理
  // ══════════════════════════════════════════════════════

  /**
   * POST /open-platform/sla — 创建 SLA
   */
  @Post('sla')
  @HttpCode(HttpStatus.CREATED)
  createSla(
    @Body() body: {
      appId: string;
      tierName: string;
      uptimeGuarantee: number;
      penaltyRate: number;
      monthlyCallCommitment: number;
      overageUnitPrice: number;
    },
  ): any {
    return this.svc.createSla(body);
  }

  /**
   * GET /open-platform/sla — 查询 SLA
   */
  @Get('sla')
  getSla(
    @Query('appId') appId?: string,
    @Query('slaId') slaId?: string,
  ): any {
    return this.svc.getSla({ appId, slaId });
  }

  // ══════════════════════════════════════════════════════
  // BS-0106~BS-0107: API 版本管理
  // ══════════════════════════════════════════════════════

  /**
   * POST /open-platform/versions — 注册 API 版本
   */
  @Post('versions')
  @HttpCode(HttpStatus.CREATED)
  registerApiVersion(
    @Body() body: { version: string; basePath: string; changelog?: string },
  ): any {
    return this.svc.registerApiVersion(body);
  }

  /**
   * POST /open-platform/versions/:id/deprecate — 废弃版本
   */
  @Post('versions/:id/deprecate')
  @HttpCode(HttpStatus.OK)
  deprecateVersion(
    @Param('id') id: string,
    @Body() body: { sunsetDate: string },
  ): any {
    return this.svc.deprecateApiVersion(id, body.sunsetDate);
  }

  /**
   * GET /open-platform/versions — 版本列表
   */
  @Get('versions')
  listApiVersions(): any {
    return { versions: this.svc.listApiVersions() };
  }

  // ══════════════════════════════════════════════════════
  // BS-0104~BS-0105: SDK
  // ══════════════════════════════════════════════════════

  /**
   * POST /open-platform/sdks — 发布 SDK
   */
  @Post('sdks')
  @HttpCode(HttpStatus.CREATED)
  publishSdk(
    @Body() body: {
      appId: string;
      language: SdkLanguage;
      version: string;
      downloadUrl: string;
      docContent?: string;
      changelog?: string;
    },
  ): any {
    return this.svc.publishSdk(body);
  }

  /**
   * GET /open-platform/sdks/:appId — SDK 列表
   */
  @Get('sdks/:appId')
  listSdks(@Param('appId') appId: string): any {
    return { sdks: this.svc.listSdks(appId) };
  }

  // ══════════════════════════════════════════════════════
  // BS-0113: 应用市场
  // ══════════════════════════════════════════════════════

  /**
   * POST /open-platform/market — 上架应用市场
   */
  @Post('market')
  @HttpCode(HttpStatus.CREATED)
  publishToMarket(
    @Body() body: {
      appId: string;
      displayName: string;
      summary: string;
      description: string;
      tags: string[];
      price: number;
      screenshots: string[];
    },
  ): any {
    return this.svc.publishToMarketplace(body.appId, body);
  }

  /**
   * GET /open-platform/market — 应用市场列表
   */
  @Get('market')
  listMarketplace(
    @Query('tag') tag?: string,
    @Query('search') search?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
  ): any {
    return {
      items: this.svc.listMarketplace({
        tag,
        search,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
      }),
    };
  }
}
