/**
 * Phase-35: 智能体接入模块 - 全球化i18n-geo适配服务
 *
 * 提供多语言、多货币、当时区、社媒渠道的自动适配能力
 */

import { Injectable } from '@nestjs/common'

/** 支持的语言 */
export type SupportedLanguage = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR' | 'zh-TW' | 'es-ES' | 'fr-FR' | 'de-DE'

/** 支持的货币 */
export type SupportedCurrency = 'USD' | 'CNY' | 'JPY' | 'KRW' | 'EUR' | 'GBP' | 'HKD' | 'SGD' | 'TWD'

/** 地区配置 */
export interface RegionConfig {
  regionCode: string
  regionName: string
  language: SupportedLanguage
  currency: SupportedCurrency
  timezone: string
  socialChannels: SocialChannel[]
  dateFormat: string
  numberFormat: {
    decimal: string
    thousands: string
  }
}

/** 社交媒体渠道 */
export interface SocialChannel {
  id: string
  name: string
  icon: string
  supported: boolean
  shareUrl: string
  integrationType: 'whatsapp' | 'line' | 'telegram' | 'messenger' | 'wechat' | 'kakao' | 'discord'
}

/** 用户地域上下文 */
export interface GeoContext {
  country: string
  province?: string
  city?: string
  language: SupportedLanguage
  currency: SupportedCurrency
  timezone: string
  regionCode: string
}

/** 货币换算汇率（简化版，生产应接入实时API） */
const EXCHANGE_RATES: Record<SupportedCurrency, number> = {
  USD: 1,
  CNY: 7.24,
  JPY: 149.5,
  KRW: 1330,
  EUR: 0.92,
  GBP: 0.79,
  HKD: 7.82,
  SGD: 1.34,
  TWD: 31.5,
}

/** 地区配置映射 */
const REGION_CONFIGS: Record<string, RegionConfig> = {
  'CN': {
    regionCode: 'CN',
    regionName: '中国大陆',
    language: 'zh-CN',
    currency: 'CNY',
    timezone: 'Asia/Shanghai',
    socialChannels: [
      { id: 'wechat', name: '微信', icon: 'wechat', supported: true, shareUrl: 'https://api.addthis.com', integrationType: 'wechat' },
      { id: 'weibo', name: '微博', icon: 'weibo', supported: true, shareUrl: 'https://service.weibo.com', integrationType: 'wechat' },
      { id: 'douyin', name: '抖音', icon: 'douyin', supported: true, shareUrl: 'https://www.douyin.com', integrationType: 'wechat' },
      { id: 'whatsapp', name: 'WhatsApp', icon: 'whatsapp', supported: true, shareUrl: 'https://api.whatsapp.com', integrationType: 'whatsapp' },
    ],
    dateFormat: 'YYYY-MM-DD',
    numberFormat: { decimal: '.', thousands: ',' },
  },
  'HK': {
    regionCode: 'HK',
    regionName: '中国香港',
    language: 'zh-TW',
    currency: 'HKD',
    timezone: 'Asia/Hong_Kong',
    socialChannels: [
      { id: 'whatsapp', name: 'WhatsApp', icon: 'whatsapp', supported: true, shareUrl: 'https://api.whatsapp.com', integrationType: 'whatsapp' },
      { id: 'wechat', name: '微信', icon: 'wechat', supported: true, shareUrl: 'https://api.addthis.com', integrationType: 'wechat' },
      { id: 'messenger', name: 'Messenger', icon: 'messenger', supported: true, shareUrl: 'https://m.me', integrationType: 'messenger' },
    ],
    dateFormat: 'DD/MM/YYYY',
    numberFormat: { decimal: '.', thousands: ',' },
  },
  'TW': {
    regionCode: 'TW',
    regionName: '中国台湾',
    language: 'zh-TW',
    currency: 'TWD',
    timezone: 'Asia/Taipei',
    socialChannels: [
      { id: 'line', name: 'LINE', icon: 'line', supported: true, shareUrl: 'https://line.me', integrationType: 'line' },
      { id: 'messenger', name: 'Messenger', icon: 'messenger', supported: true, shareUrl: 'https://m.me', integrationType: 'messenger' },
      { id: 'whatsapp', name: 'WhatsApp', icon: 'whatsapp', supported: true, shareUrl: 'https://api.whatsapp.com', integrationType: 'whatsapp' },
    ],
    dateFormat: 'YYYY/MM/DD',
    numberFormat: { decimal: '.', thousands: ',' },
  },
  'US': {
    regionCode: 'US',
    regionName: '美国',
    language: 'en-US',
    currency: 'USD',
    timezone: 'America/New_York',
    socialChannels: [
      { id: 'messenger', name: 'Messenger', icon: 'messenger', supported: true, shareUrl: 'https://m.me', integrationType: 'messenger' },
      { id: 'whatsapp', name: 'WhatsApp', icon: 'whatsapp', supported: true, shareUrl: 'https://api.whatsapp.com', integrationType: 'whatsapp' },
      { id: 'telegram', name: 'Telegram', icon: 'telegram', supported: true, shareUrl: 'https://t.me', integrationType: 'telegram' },
    ],
    dateFormat: 'MM/DD/YYYY',
    numberFormat: { decimal: '.', thousands: ',' },
  },
  'JP': {
    regionCode: 'JP',
    regionName: '日本',
    language: 'ja-JP',
    currency: 'JPY',
    timezone: 'Asia/Tokyo',
    socialChannels: [
      { id: 'line', name: 'LINE', icon: 'line', supported: true, shareUrl: 'https://line.me', integrationType: 'line' },
      { id: 'whatsapp', name: 'WhatsApp', icon: 'whatsapp', supported: true, shareUrl: 'https://api.whatsapp.com', integrationType: 'whatsapp' },
    ],
    dateFormat: 'YYYY/MM/DD',
    numberFormat: { decimal: '.', thousands: ',' },
  },
  'KR': {
    regionCode: 'KR',
    regionName: '韩国',
    language: 'ko-KR',
    currency: 'KRW',
    timezone: 'Asia/Seoul',
    socialChannels: [
      { id: 'kakao', name: 'KakaoTalk', icon: 'kakao', supported: true, shareUrl: 'https://kakao.com', integrationType: 'kakao' },
      { id: 'whatsapp', name: 'WhatsApp', icon: 'whatsapp', supported: true, shareUrl: 'https://api.whatsapp.com', integrationType: 'whatsapp' },
    ],
    dateFormat: 'YYYY.MM.DD',
    numberFormat: { decimal: '.', thousands: ',' },
  },
  'SG': {
    regionCode: 'SG',
    regionName: '新加坡',
    language: 'en-US',
    currency: 'SGD',
    timezone: 'Asia/Singapore',
    socialChannels: [
      { id: 'whatsapp', name: 'WhatsApp', icon: 'whatsapp', supported: true, shareUrl: 'https://api.whatsapp.com', integrationType: 'whatsapp' },
      { id: 'messenger', name: 'Messenger', icon: 'messenger', supported: true, shareUrl: 'https://m.me', integrationType: 'messenger' },
    ],
    dateFormat: 'DD/MM/YYYY',
    numberFormat: { decimal: '.', thousands: ',' },
  },
  'DEFAULT': {
    regionCode: 'DEFAULT',
    regionName: '国际',
    language: 'en-US',
    currency: 'USD',
    timezone: 'UTC',
    socialChannels: [
      { id: 'whatsapp', name: 'WhatsApp', icon: 'whatsapp', supported: true, shareUrl: 'https://api.whatsapp.com', integrationType: 'whatsapp' },
      { id: 'messenger', name: 'Messenger', icon: 'messenger', supported: true, shareUrl: 'https://m.me', integrationType: 'messenger' },
      { id: 'telegram', name: 'Telegram', icon: 'telegram', supported: true, shareUrl: 'https://t.me', integrationType: 'telegram' },
    ],
    dateFormat: 'YYYY-MM-DD',
    numberFormat: { decimal: '.', thousands: ',' },
  },
}

/** IP到国家的简化映射（生产应使用GeoIP库） */
const COUNTRY_IP_PREFIX: Record<string, string> = {
  '1.0.1': 'CN', '1.0.2': 'CN', '36.152': 'CN', '42.176': 'CN',
  '27.115': 'CN', '58.14': 'CN', '116.52': 'CN',
  '103.0': 'JP', '106.0': 'JP', '114.1': 'JP', '125.0': 'JP',
  '175.0': 'KR', '210.0': 'KR',
  '14.0': 'SG', '27.0': 'SG',
  '52.0': 'US', '54.0': 'US', '104.0': 'US', '172.0': 'US',
  '202.0': 'TW', '220.0': 'TW',
}

@Injectable()
export class I18nGeoService {
  /**
   * 根据IP地址获取地域上下文
   */
  getGeoContext(ip: string): GeoContext {
    const country = this.resolveCountryFromIP(ip)
    const regionConfig = REGION_CONFIGS[country] || REGION_CONFIGS['DEFAULT']

    return {
      country,
      language: regionConfig.language,
      currency: regionConfig.currency,
      timezone: regionConfig.timezone,
      regionCode: regionConfig.regionCode,
    }
  }

  /**
   * 根据IP地址获取国家码 (便捷方法)
   */
  detectCountryFromIP(ip: string): string {
    return this.resolveCountryFromIP(ip)
  }

  /**
   * 根据国家码获取locale映射 (便捷方法)
   */
  getIPLocaleMapping(countryCode: string): string {
    const config = REGION_CONFIGS[countryCode] || REGION_CONFIGS['DEFAULT']
    return `${config.language}-${countryCode}`
  }

  /**
   * 根据国家码获取地区配置
   */
  getRegionConfig(countryCode: string): RegionConfig {
    return REGION_CONFIGS[countryCode] || REGION_CONFIGS['DEFAULT']
  }

  /**
   * 转换货币
   */
  convertCurrency(amount: number, from: SupportedCurrency, to: SupportedCurrency): number {
    if (from === to) return amount
    const inUSD = amount / EXCHANGE_RATES[from]
    return inUSD * EXCHANGE_RATES[to]
  }

  /**
   * 格式化货币
   */
  formatCurrency(amount: number, currency: SupportedCurrency): string {
    const localeMap: Record<SupportedCurrency, string> = {
      USD: 'en-US',
      CNY: 'zh-CN',
      JPY: 'ja-JP',
      KRW: 'ko-KR',
      EUR: 'de-DE',
      GBP: 'en-GB',
      HKD: 'zh-HK',
      SGD: 'en-SG',
      TWD: 'zh-TW',
    }

    return new Intl.NumberFormat(localeMap[currency], {
      style: 'currency',
      currency,
    }).format(amount)
  }

  /**
   * 获取支持的语言列表
   */
  getSupportedLanguages(): Array<{ code: SupportedLanguage; name: string; nativeName: string }> {
    return [
      { code: 'zh-CN', name: '简体中文', nativeName: '简体中文' },
      { code: 'en-US', name: 'English', nativeName: 'English' },
      { code: 'ja-JP', name: 'Japanese', nativeName: '日本語' },
      { code: 'ko-KR', name: 'Korean', nativeName: '한국어' },
      { code: 'zh-TW', name: 'Traditional Chinese', nativeName: '繁體中文' },
      { code: 'es-ES', name: 'Spanish', nativeName: 'Español' },
      { code: 'fr-FR', name: 'French', nativeName: 'Français' },
      { code: 'de-DE', name: 'German', nativeName: 'Deutsch' },
    ]
  }

  /**
   * 获取支持的国家/地区列表
   */
  getSupportedRegions(): RegionConfig[] {
    return Object.values(REGION_CONFIGS).filter((r) => r.regionCode !== 'DEFAULT')
  }

  /**
   * 获取特定地区的社交媒体渠道
   */
  getSocialChannels(countryCode: string): SocialChannel[] {
    const config = REGION_CONFIGS[countryCode] || REGION_CONFIGS['DEFAULT']
    return config.socialChannels
  }

  /**
   * 格式化日期
   */
  formatDate(date: Date, countryCode: string): string {
    const config = REGION_CONFIGS[countryCode] || REGION_CONFIGS['DEFAULT']
    const localeMap: Record<string, string> = {
      'zh-CN': 'zh-CN',
      'en-US': 'en-US',
      'ja-JP': 'ja-JP',
      'ko-KR': 'ko-KR',
      'zh-TW': 'zh-TW',
      'es-ES': 'es-ES',
      'fr-FR': 'fr-FR',
      'de-DE': 'de-DE',
    }

    return new Intl.DateTimeFormat(localeMap[config.language] || 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date)
  }

  /**
   * 解析IP地址获取国家（简化版）
   */
  private resolveCountryFromIP(ip: string): string {
    if (!ip || ip === '127.0.0.1' || ip === 'localhost' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return 'CN' // 默认返回中国
    }

    const parts = ip.split('.')
    if (parts.length < 2) return 'DEFAULT'

    const prefix = `${parts[0]}.${parts[1]}`

    for (const [ipPrefix, country] of Object.entries(COUNTRY_IP_PREFIX)) {
      if (ip.startsWith(ipPrefix)) {
        return country
      }
    }

    return 'DEFAULT'
  }

  // ── Missing methods for test compatibility ──

  private getRegionConfigOrFallback(countryOrRegion: string): any {
    // @ts-ignore - runtime import
    const { REGION_CONFIGS } = require('./region-config')
    return REGION_CONFIGS[countryOrRegion] || REGION_CONFIGS['DEFAULT']
  }

  suggestLocale(acceptLanguage: string, ipFallback?: string): string {
    if (acceptLanguage) {
      const preferred = acceptLanguage.split(',')[0]?.trim()
      if (preferred) {
        const langCode = preferred.split(';')[0]
        if (langCode && this.isSupportedLocale(langCode as any)) {
          return langCode
        }
      }
    }
    if (ipFallback) {
      const country = this.detectCountryFromIP(ipFallback)
      return this.getLocaleForRegion(country)
    }
    return 'zh-CN'
  }

  isSupportedLocale(locale: string): boolean {
    const supported = this.getSupportedLanguages()
    return supported.some(l => l.code === locale)
  }

  getLocaleForRegion(regionName: string): string {
    const { REGION_CONFIGS } = require('./region-config')
    for (const [, raw] of Object.entries(REGION_CONFIGS)) {
      const config = raw as any
      if (config.regionName === regionName) {
        return `${config.language}-${config.regionCode}`
      }
    }
    return 'zh-CN'
  }

  formatCurrencyForRegion(amount: number, countryCode: string): string {
    const { REGION_CONFIGS } = require('./region-config')
    const config = REGION_CONFIGS[countryCode] || REGION_CONFIGS['DEFAULT']
    return this.formatCurrency(amount, config.currency)
  }

  isGeoRestricted(contentType: string): boolean {
    const restricted = ['streaming', 'gambling', 'political']
    return restricted.includes(contentType)
  }

  getSupportedCountries(): string[] {
    const { REGION_CONFIGS } = require('./region-config')
    return Object.keys(REGION_CONFIGS).filter(k => k !== 'DEFAULT')
  }

  getTimezoneForRegion(countryCode: string): string {
    const { REGION_CONFIGS } = require('./region-config')
    const config = REGION_CONFIGS[countryCode] || REGION_CONFIGS['DEFAULT']
    return config.timezone
  }

  formatDateForRegion(date: Date, countryCode: string): string {
    return this.formatDate(date, countryCode)
  }

}