/**
 * Phase-35: 地区配置（按国家/地区提供语言、货币、时区、社媒、日期格式）
 *
 * 从 i18n-geo.service.ts 拆出, 避免 service 文件内部 require('./region-config')
 * 在 ESM 模式下抛 "Cannot find module" 错误.
 */

export type SupportedLanguage = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR' | 'zh-TW' | 'es-ES' | 'fr-FR' | 'de-DE'

export type SupportedCurrency = 'USD' | 'CNY' | 'JPY' | 'KRW' | 'EUR' | 'GBP' | 'HKD' | 'SGD' | 'TWD'

export interface SocialChannel {
  id: string
  name: string
  icon: string
  supported: boolean
  shareUrl: string
  integrationType: 'whatsapp' | 'line' | 'telegram' | 'messenger' | 'wechat' | 'kakao' | 'discord'
}

export interface RegionConfig {
  regionCode: string
  regionName: string
  regionNameEn?: string
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

/** 地区配置映射 (国家码 -> 地域配置) */
export const REGION_CONFIGS: Record<string, RegionConfig> = {
  'CN': {
    regionCode: 'CN',
    regionName: '中国大陆',
    regionNameEn: 'China',
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
    regionNameEn: 'Hong Kong',
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
    regionNameEn: 'Taiwan',
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
    regionNameEn: 'United States',
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
    regionNameEn: 'Japan',
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
    regionNameEn: 'Korea',
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
    regionNameEn: 'Singapore',
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
    regionNameEn: 'International',
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
