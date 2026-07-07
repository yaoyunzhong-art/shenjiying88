// sandbox.controller.ts - T116-2
// 沙箱环境 + ISV 应用商店控制器

import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { SandboxService, ISVAppStore, SDKMultiLangService } from './sandbox-isv.service';
import type {
  SandboxInstance,
  CodeExecutionResult,
  ISVApp,
  AppInstall,
  AppFilter,
  SDKLanguage,
  SDKPackage,
} from './sandbox-isv.service';
import {
  CreateSandboxDto,
  ExecuteCodeDto,
  PublishAppDto,
  InstallAppDto,
  RateAppDto,
  AppFilterDto,
  GenerateSDKDto,
  SandboxResponseDto,
  CodeExecutionResponseDto,
  AppResponseDto,
  AppInstallResponseDto,
  SDKResponseDto,
} from './sandbox.dto';

@Controller('sandbox')
export class SandboxController {
  constructor(
    private readonly sandboxService: SandboxService,
    private readonly appStore: ISVAppStore,
    private readonly sdkService: SDKMultiLangService,
  ) {}

  // ── Sandbox CRUD ──────────────────────────────────────────────────────────

  @Post()
  async createSandbox(@Body() dto: CreateSandboxDto): Promise<SandboxResponseDto> {
    const instance = await this.sandboxService.createSandbox(dto.appId, dto.developerId);
    return this.toSandboxResponse(instance);
  }

  @Post(':id/destroy')
  async destroySandbox(@Param('id') id: string): Promise<{ success: boolean }> {
    const result = await this.sandboxService.destroySandbox(id);
    return { success: result };
  }

  @Get(':id/status')
  async getSandboxStatus(@Param('id') id: string): Promise<{ status: string | undefined }> {
    const status = await this.sandboxService.getSandboxStatus(id);
    return { status };
  }

  @Post(':id/execute')
  async executeCode(
    @Param('id') id: string,
    @Body() dto: ExecuteCodeDto,
  ): Promise<CodeExecutionResponseDto> {
    const result = await this.sandboxService.executeCode(id, dto.code, dto.language);
    return result;
  }

  @Post(':id/reset')
  async resetSandbox(@Param('id') id: string): Promise<SandboxResponseDto | { error: string }> {
    const instance = await this.sandboxService.resetSandbox(id);
    if (!instance) {
      return { error: 'Sandbox not found' };
    }
    return this.toSandboxResponse(instance);
  }

  @Get()
  async listSandboxes(
    @Query('developerId') developerId?: string,
  ): Promise<SandboxResponseDto[]> {
    const list = this.sandboxService.listSandboxes(developerId);
    return list.map((s) => this.toSandboxResponse(s));
  }

  @Get(':id')
  async getSandbox(@Param('id') id: string): Promise<SandboxResponseDto | { error: string }> {
    const instance = this.sandboxService.getSandbox(id);
    if (!instance) {
      return { error: 'Sandbox not found' };
    }
    return this.toSandboxResponse(instance);
  }

  // ── ISV App Store ───────────────────────────────────────────────────────

  @Post('isv/apps')
  async publishApp(@Body() dto: PublishAppDto): Promise<AppResponseDto> {
    const app = await this.appStore.publishApp({
      ...dto,
      status: 'DRAFT' as const,
      rating: 0,
      ratingCount: 0,
      installCount: 0,
      tags: dto.tags ?? [],
      screenshots: dto.screenshots ?? [],
    });
    return this.toAppResponse(app);
  }

  @Get('isv/apps')
  async listApps(@Query() filter?: AppFilterDto): Promise<AppResponseDto[]> {
    const apps = await this.appStore.listApps(filter as AppFilter | undefined);
    return apps.map((a) => this.toAppResponse(a));
  }

  @Post('isv/apps/:id/install')
  async installApp(
    @Param('id') id: string,
    @Body() dto: InstallAppDto,
  ): Promise<AppInstallResponseDto | { error: string }> {
    const install = await this.appStore.installApp(id, dto.tenantId);
    if (!install) {
      return { error: 'App not found or not published' };
    }
    return this.toInstallResponse(install);
  }

  @Post('isv/apps/:id/uninstall')
  async uninstallApp(
    @Param('id') id: string,
    @Body() dto: InstallAppDto,
  ): Promise<{ success: boolean }> {
    const result = await this.appStore.uninstallApp(id, dto.tenantId);
    return { success: result };
  }

  @Post('isv/apps/:id/rate')
  async rateApp(
    @Param('id') id: string,
    @Body() dto: RateAppDto,
  ): Promise<AppResponseDto | { error: string }> {
    const app = await this.appStore.rateApp(id, dto.rating);
    if (!app) {
      return { error: 'App not found or invalid rating' };
    }
    return this.toAppResponse(app);
  }

  @Get('isv/apps/:id')
  async getApp(@Param('id') id: string): Promise<AppResponseDto | { error: string }> {
    const app = this.appStore.getApp(id);
    if (!app) {
      return { error: 'App not found' };
    }
    return this.toAppResponse(app);
  }

  @Get('isv/apps/:id/installs')
  async listInstalls(@Param('id') id: string): Promise<AppInstallResponseDto[]> {
    const installs = this.appStore.listInstalls(id);
    return installs.map((i) => this.toInstallResponse(i));
  }

  // ── SDK ─────────────────────────────────────────────────────────────────

  @Post('isv/apps/:id/sdk/generate')
  async generateSDK(
    @Param('id') id: string,
    @Body() dto: GenerateSDKDto,
  ): Promise<SDKResponseDto> {
    const sdk = await this.sdkService.generateSDK(id, dto.language);
    return this.toSDKResponse(sdk);
  }

  @Get('isv/apps/:id/sdk/download')
  async getSDKDownloadURL(
    @Param('id') id: string,
    @Query('language') language: string,
    @Query('version') version?: string,
  ): Promise<{ url: string }> {
    const url = await this.sdkService.getSDKDownloadURL(
      id,
      language as SDKLanguage,
      version,
    );
    return { url };
  }

  @Get('isv/sdk/languages')
  async listSDKLanguages(): Promise<{ languages: string[] }> {
    return { languages: this.sdkService.listSupportedLanguages() };
  }

  // ── DTO 转换辅助 ──────────────────────────────────────────────────────────

  private toSandboxResponse(s: SandboxInstance): SandboxResponseDto {
    return {
      id: s.id,
      appId: s.appId,
      developerId: s.developerId,
      status: s.status,
      language: s.language,
      createdAt: s.createdAt,
      lastActiveAt: s.lastActiveAt,
      resources: { ...s.resources },
      snapshot: s.snapshot,
    };
  }

  private toAppResponse(a: ISVApp): AppResponseDto {
    return {
      id: a.id,
      name: a.name,
      description: a.description,
      developerId: a.developerId,
      category: a.category,
      status: a.status,
      version: a.version,
      rating: a.rating,
      ratingCount: a.ratingCount,
      installCount: a.installCount,
      publishedAt: a.publishedAt,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      tags: [...a.tags],
      screenshots: [...a.screenshots],
      price: a.price,
      isFree: a.isFree,
    };
  }

  private toInstallResponse(i: AppInstall): AppInstallResponseDto {
    return {
      id: i.id,
      appId: i.appId,
      tenantId: i.tenantId,
      installedAt: i.installedAt,
      status: i.status,
    };
  }

  private toSDKResponse(p: SDKPackage): SDKResponseDto {
    return {
      language: p.language,
      version: p.version,
      downloadURL: p.downloadURL,
      size: p.size,
      checksum: p.checksum,
      generatedAt: p.generatedAt,
    };
  }
}
