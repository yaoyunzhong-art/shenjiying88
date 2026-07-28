import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
  CreateVersionDto,
  SetInjectScriptDto,
  UpdateInjectScriptDto,
  RegisterFontDto,
  SetLocaleDto,
} from './brand-custom.dto'
import type {
  BrandTheme,
  DomainConfig,
  EmailTemplate,
  DNSRecord,
  TenantBrand,
  RenderedEmail,
  PresetTheme,
  BrandVersion,
  VersionDiffResult,
  InjectScript,
  InjectScriptLocation,
  CustomFont,
  LocaleSetting,
  BrandHealthScore,
  CompletenessReport,
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

  // ═══════════════════════════════════════════════════════════════════════════
  // 品牌版本管理
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('tenants/:tenantId/versions')
  createVersion(
    @Param('tenantId') tenantId: string,
    @Body() body: CreateVersionDto,
  ): BrandVersion {
    return this.brandCustomService.createVersion(tenantId, body.note)
  }

  @Get('tenants/:tenantId/versions')
  listVersions(@Param('tenantId') tenantId: string): BrandVersion[] {
    return this.brandCustomService.listVersions(tenantId)
  }

  @Post('tenants/:tenantId/versions/:versionId/rollback')
  rollbackToVersion(
    @Param('tenantId') tenantId: string,
    @Param('versionId') versionId: string,
  ): { theme: BrandTheme; domain: DomainConfig } {
    return this.brandCustomService.rollbackToVersion(tenantId, versionId)
  }

  @Get('tenants/:tenantId/versions/:versionId1/diff/:versionId2')
  getVersionDiff(
    @Param('tenantId') tenantId: string,
    @Param('versionId1') versionId1: string,
    @Param('versionId2') versionId2: string,
  ): VersionDiffResult {
    return this.brandCustomService.getVersionDiff(tenantId, versionId1, versionId2)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 自定义脚本注入
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('tenants/:tenantId/inject-scripts')
  setInjectScript(
    @Param('tenantId') tenantId: string,
    @Body() body: SetInjectScriptDto,
  ): InjectScript {
    return this.brandCustomService.setInjectScript(tenantId, {
      location: body.location,
      name: body.name,
      content: body.content,
      enabled: body.enabled,
    })
  }

  @Get('tenants/:tenantId/inject-scripts')
  getInjectScripts(@Param('tenantId') tenantId: string): InjectScript[] {
    return this.brandCustomService.getInjectScripts(tenantId)
  }

  @Patch('tenants/:tenantId/inject-scripts/:scriptId')
  updateInjectScript(
    @Param('tenantId') tenantId: string,
    @Param('scriptId') scriptId: string,
    @Body() body: UpdateInjectScriptDto,
  ): InjectScript {
    return this.brandCustomService.updateInjectScript(tenantId, scriptId, body)
  }

  @Delete('tenants/:tenantId/inject-scripts/:scriptId')
  removeInjectScript(
    @Param('tenantId') tenantId: string,
    @Param('scriptId') scriptId: string,
  ): { success: boolean } {
    this.brandCustomService.removeInjectScript(tenantId, scriptId)
    return { success: true }
  }

  @Get('tenants/:tenantId/inject-scripts/render/:location')
  renderInjectScripts(
    @Param('tenantId') tenantId: string,
    @Param('location') location: string,
  ): { html: string } {
    const html = this.brandCustomService.renderInjectScripts(
      tenantId,
      location as InjectScriptLocation,
    )
    return { html }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 自定义字体管理
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('tenants/:tenantId/fonts')
  registerCustomFont(
    @Param('tenantId') tenantId: string,
    @Body() body: RegisterFontDto,
  ): CustomFont {
    return this.brandCustomService.registerCustomFont(tenantId, body)
  }

  @Get('tenants/:tenantId/fonts')
  listCustomFonts(@Param('tenantId') tenantId: string): CustomFont[] {
    return this.brandCustomService.listCustomFonts(tenantId)
  }

  @Delete('tenants/:tenantId/fonts/:fontId')
  removeCustomFont(
    @Param('tenantId') tenantId: string,
    @Param('fontId') fontId: string,
  ): { success: boolean } {
    this.brandCustomService.removeCustomFont(tenantId, fontId)
    return { success: true }
  }

  @Get('tenants/:tenantId/fonts/css')
  generateFontCSS(@Param('tenantId') tenantId: string): { css: string } {
    const css = this.brandCustomService.generateFontCSS(tenantId)
    return { css }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 多语言品牌设置
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('tenants/:tenantId/locales')
  setLocale(
    @Param('tenantId') tenantId: string,
    @Body() body: SetLocaleDto,
  ): LocaleSetting {
    return this.brandCustomService.setLocale(
      tenantId,
      body.locale,
      body.brandName,
      body.description,
      body.tagline,
    )
  }

  @Get('tenants/:tenantId/locales/:locale')
  getLocale(
    @Param('tenantId') tenantId: string,
    @Param('locale') locale: string,
  ): LocaleSetting | null {
    return this.brandCustomService.getLocale(tenantId, locale)
  }

  @Get('tenants/:tenantId/locales')
  listLocales(@Param('tenantId') tenantId: string): LocaleSetting[] {
    return this.brandCustomService.listLocales(tenantId)
  }

  @Get('tenants/:tenantId/localized-brand/:locale')
  getLocalizedBrand(
    @Param('tenantId') tenantId: string,
    @Param('locale') locale: string,
  ): {
    brandName: string
    description?: string
    tagline?: string
    locale: string
    theme: BrandTheme
  } {
    return this.brandCustomService.getLocalizedBrand(tenantId, locale)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 品牌健康检查
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('tenants/:tenantId/health')
  healthCheck(@Param('tenantId') tenantId: string): BrandHealthScore {
    return this.brandCustomService.healthCheck(tenantId)
  }

  @Get('health/report')
  getCompletenessReport(): CompletenessReport {
    return this.brandCustomService.getCompletenessReport()
  }
}
