import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
  ParseBoolPipe,
  UseGuards,
} from '@nestjs/common'

import { TenantGuard } from '../agent/tenant.guard'
import { BrandCustomService } from './brand-custom.service'
import {
  RegisterTenantDto,
  ApplyThemeDto,
  ApplyPresetDto,
  ConfigureDomainDto,
  EmailTemplateDto,
  RenderEmailDto,
  SendTestEmailDto,
  PreviewThemeDto,
  BrandThemeDto as BrandThemePartialDto,
} from './brand-custom.dto'
import type {
  BrandTheme,
  DomainConfig,
  EmailTemplate,
  DNSRecord,
  TenantBrand,
  RenderedEmail,
  PresetTheme,
} from './brand-custom.entity'

@UseGuards(TenantGuard)
@Controller('brand-custom')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class BrandCustomController {
  constructor(private readonly brandCustomService: BrandCustomService) {}

  // ── 租户品牌管理 ─────────────────────────────────────────────────────────

  @Post('tenants')
  registerTenant(@Body() body: RegisterTenantDto): TenantBrand {
    return this.brandCustomService.registerTenant(body.tenantId, body.brandName)
  }

  @Get('tenants')
  listBrands(): TenantBrand[] {
    return this.brandCustomService.listBrands()
  }

  @Patch('tenants/:tenantId/active')
  setActive(
    @Param('tenantId') tenantId: string,
    @Body('active', ParseBoolPipe) active: boolean,
  ): { success: boolean } {
    this.brandCustomService.setActive(tenantId, active)
    return { success: true }
  }

  // ── 主题定制 ─────────────────────────────────────────────────────────────

  @Get('tenants/:tenantId/theme')
  getTheme(@Param('tenantId') tenantId: string): BrandTheme | null {
    return this.brandCustomService.getTheme(tenantId)
  }

  @Patch('tenants/:tenantId/theme')
  applyTheme(
    @Param('tenantId') tenantId: string,
    @Body() theme: ApplyThemeDto,
  ): BrandTheme {
    return this.brandCustomService.applyTheme(tenantId, theme)
  }

  @Post('tenants/:tenantId/theme/presets/:presetId')
  applyPreset(
    @Param('tenantId') tenantId: string,
    @Param('presetId') presetId: string,
  ): BrandTheme {
    return this.brandCustomService.applyPreset(tenantId, presetId)
  }

  @Get('presets')
  getPresetThemes(): PresetTheme[] {
    return this.brandCustomService.getPresetThemes()
  }

  @Get('tenants/:tenantId/theme/css')
  generateCSSVariables(@Param('tenantId') tenantId: string): { css: string } {
    const css = this.brandCustomService.generateCSSVariables(tenantId)
    return { css }
  }

  // ── 域名配置 ─────────────────────────────────────────────────────────────

  @Get('tenants/:tenantId/domain')
  getDomainConfig(@Param('tenantId') tenantId: string): DomainConfig | null {
    return this.brandCustomService.getDomainConfig(tenantId)
  }

  @Patch('tenants/:tenantId/domain')
  configureDomain(
    @Param('tenantId') tenantId: string,
    @Body() config: ConfigureDomainDto,
  ): DomainConfig {
    return this.brandCustomService.configureDomain(tenantId, config)
  }

  @Get('tenants/:tenantId/domain/dns')
  generateDNSGuide(@Param('tenantId') tenantId: string): DNSRecord[] {
    return this.brandCustomService.generateDNSGuide(tenantId)
  }

  // ── 邮件模板 ─────────────────────────────────────────────────────────────

  @Post('tenants/:tenantId/email-templates')
  setEmailTemplate(
    @Param('tenantId') tenantId: string,
    @Body() template: EmailTemplateDto,
  ): EmailTemplate {
    return this.brandCustomService.setEmailTemplate(tenantId, template)
  }

  @Get('tenants/:tenantId/email-templates/:templateType')
  getEmailTemplate(
    @Param('tenantId') tenantId: string,
    @Param('templateType') templateType: string,
  ): EmailTemplate | null {
    return this.brandCustomService.getEmailTemplate(
      tenantId,
      templateType as EmailTemplate['templateType'],
    )
  }

  @Post('tenants/:tenantId/email-templates/:templateType/render')
  renderEmail(
    @Param('tenantId') tenantId: string,
    @Param('templateType') templateType: string,
    @Body() body: RenderEmailDto,
  ): RenderedEmail {
    return this.brandCustomService.renderEmail(
      tenantId,
      templateType as EmailTemplate['templateType'],
      body.variables,
    )
  }

  @Post('tenants/:tenantId/email-templates/:templateType/test-send')
  async sendTestEmail(
    @Param('tenantId') tenantId: string,
    @Param('templateType') templateType: string,
    @Body() body: SendTestEmailDto,
  ): Promise<{ success: boolean }> {
    const result = await this.brandCustomService.sendTestEmail(
      tenantId,
      templateType as EmailTemplate['templateType'],
      body.recipient,
    )
    return { success: result }
  }

  // ── 预览主题 ─────────────────────────────────────────────────────────────

  @Post('preview')
  previewTheme(@Body() theme: PreviewThemeDto): { html: string } {
    const html = this.brandCustomService.previewTheme(theme)
    return { html }
  }
}
