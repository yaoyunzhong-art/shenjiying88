/**
 * i18n.controller.ts - Phase-20 T44
 * 用途: 国际化模块 HTTP 控制器
 *
 * 路由:
 *   POST   /i18n/translations         - 创建翻译条目
 *   GET    /i18n/translations          - 查询翻译条目
 *   PUT    /i18n/translations/:id      - 更新翻译条目
 *   POST   /i18n/translations/bulk     - 批量注册翻译
 *   GET    /i18n/translations/extract  - 从源码提取 key
 *   GET    /i18n/locales               - 列出所有区域配置
 *   GET    /i18n/validate              - 校验翻译完整性
 *   POST   /i18n/validate             - 校验并返回报告
 */
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
UseGuards,
} from '@nestjs/common'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import type { Locale } from './i18n.entity'
import { I18nService } from './i18n.service'
import {
  BulkRegisterTranslationDto,
  CreateTranslationDto,
  ExtractKeysDto,
  UpdateTranslationDto,
  UpdateLocaleConfigDto,
  ValidateTranslationsDto,
} from './i18n.dto'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('i18n')
@UseGuards(TenantGuard)
export class I18nController {
  constructor(private readonly i18nService: I18nService) {}

  /**
   * 创建单条翻译条目
   */
  @Post('translations')
  createTranslation(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreateTranslationDto,
  ) {
    const namespace = body.namespace ?? 'default'
    const map: Record<string, string> = { [body.key]: body.value }
    this.i18nService.registerTranslations(body.locale, map)

    return {
      success: true,
      key: body.key,
      locale: body.locale,
      namespace,
    }
  }

  /**
   * 查询翻译条目
   */
  @Get('translations')
  queryTranslations(
    @Query('locale') locale?: string,
    @Query('namespace') namespace?: string,
    @Query('keyword') keyword?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const localeStr = (locale ?? 'zh-CN') as Locale
    const keys = this.i18nService.extractKeys(localeStr)

    let filtered = keys
    if (keyword) {
      filtered = filtered.filter((k) => k.includes(keyword))
    }

    const totalCount = filtered.length
    const p = Math.max(1, parseInt(page ?? '1', 10))
    const ps = Math.max(1, Math.min(100, parseInt(pageSize ?? '20', 10)))
    const start = (p - 1) * ps
    const paginated = filtered.slice(start, start + ps)

    const translations: Record<string, string> = {}
    for (const key of paginated) {
      translations[key] = this.i18nService.t(key, undefined, localeStr)
    }

    return {
      totalCount,
      page: p,
      pageSize: ps,
      locale: localeStr,
      translations,
    }
  }

  /**
   * 更新单条翻译条目
   */
  @Put('translations/:id')
  updateTranslation(
    @Param('id') id: string,
    @Body() body: UpdateTranslationDto,
    @TenantContext() tenantContext: RequestTenantContext,
  ) {
    const [localeStr, ...keyParts] = id.split(':')
    const key = keyParts.join(':')

    if (body.value !== undefined) {
      this.i18nService.registerTranslations(localeStr as Locale, { [key]: body.value })
    }

    return {
      success: true,
      id,
      updated: true,
    }
  }

  /**
   * 批量注册翻译
   */
  @Post('translations/bulk')
  bulkRegister(
    @Body() body: BulkRegisterTranslationDto,
    @TenantContext() tenantContext: RequestTenantContext,
  ) {
    this.i18nService.registerTranslations(body.locale, body.translations)
    return {
      success: true,
      locale: body.locale,
      count: Object.keys(body.translations).length,
    }
  }

  /**
   * 从源码提取翻译 key
   */
  @Get('translations/extract')
  extractKeysFromSource(
    @Query('source') source?: string,
  ) {
    if (!source) {
      return { keys: [], totalCount: 0 }
    }

    const { extractKeysFromSource } = require('./i18n-extract')
    const keys = extractKeysFromSource(source)
    return { keys, totalCount: keys.length }
  }

  /**
   * 列出所有区域配置
   */
  @Get('locales')
  listLocales() {
    const locales = this.i18nService.getRegisteredLocales()
    return {
      locales,
      defaultLocale: 'zh-CN',
      supportedLocales: ['zh-CN', 'en-US', 'ja-JP'],
    }
  }

  /**
   * 校验翻译完整性
   */
  @Get('validate')
  validate(
    @Query('referenceLocale') referenceLocale?: string,
  ) {
    const refLocale = (referenceLocale ?? 'zh-CN') as Locale
    return this.i18nService.validateCompleteness(refLocale)
  }

  /**
   * 校验并返回结构化报告
   */
  @Post('validate')
  validateWithBody(
    @Body() body: ValidateTranslationsDto,
  ) {
    const refLocale = body.referenceLocale ?? 'zh-CN'
    return this.i18nService.validateCompleteness(refLocale as Locale)
  }
}
