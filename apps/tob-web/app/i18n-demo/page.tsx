'use client'

import React, { useState, useEffect } from 'react'
import { LocaleProvider, useLocale, useTranslation, SUPPORTED_LOCALES, LOCALE_LABELS, type Locale } from '../../components/locale-provider'
import { Heartbeat } from '../openapi-portal/components/Heartbeat'

const CURRENCIES = [
  { code: 'CNY', symbol: '¥', locale: 'zh-CN' as const },
  { code: 'JPY', symbol: '¥', locale: 'ja-JP' as const },
  { code: 'KRW', symbol: '₩', locale: 'ko-KR' as const },
  { code: 'THB', symbol: '฿', locale: 'th-TH' as const },
  { code: 'VND', symbol: '₫', locale: 'vi-VN' as const },
  { code: 'IDR', symbol: 'Rp', locale: 'id-ID' as const },
  { code: 'MYR', symbol: 'RM', locale: 'ms-MY' as const },
  { code: 'USD', symbol: '$', locale: 'en-US' as const },
]

const TIMEZONES = [
  { label: '北京时间 (UTC+8)', tz: 'Asia/Shanghai', flag: '🇨🇳' },
  { label: '东京时间 (UTC+9)', tz: 'Asia/Tokyo', flag: '🇯🇵' },
  { label: '纽约时间 (UTC-5)', tz: 'America/New_York', flag: '🇺🇸' },
  { label: '首尔时间 (UTC+9)', tz: 'Asia/Seoul', flag: '🇰🇷' },
]

function formatDateInLocale(date: Date, locale: string, tz: string, style: 'short' | 'long' = 'long'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: tz,
  }).format(date)
}

function formatNumberInLocale(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value)
}

function formatCurrencyInLocale(value: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
}

function formatPercentInLocale(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value)
}

function I18nDemoContent() {
  const { locale, setLocale, t } = useLocale()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const intlLocale = locale === 'zh-TW' ? 'zh-Hant-TW' : locale === 'zh-CN' ? 'zh-Hans-CN' : locale

  const translationKeys = [
    // Common
    { category: '通用', keys: ['common.ok', 'common.cancel', 'common.confirm', 'common.search', 'common.loading', 'common.success', 'common.error'] },
    // Member
    { category: '会员', keys: ['member.level', 'member.points', 'member.svip', 'member.upgrade', 'member.birthday'] },
    // Order
    { category: '订单', keys: ['order.created', 'order.paid', 'order.refunded', 'order.cancelled', 'order.completed'] },
    // Points
    { category: '积分', keys: ['points.earned', 'points.redeemed', 'points.expired', 'points.insufficient', 'points.converted'] },
    // Coupon
    { category: '优惠券', keys: ['coupon.issued', 'coupon.used', 'coupon.expired', 'coupon.redeemed', 'coupon.minimum'] },
  ]

  const cardStyle: React.CSSProperties = {
    background: 'rgba(30,41,59,0.9)',
    border: '1px solid rgba(148,163,184,0.12)',
    borderRadius: 12,
    padding: 20,
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  }

  const valueStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 600,
    color: '#f8fafc',
  }

  return (
    <div style={{ padding: '24px 0' }}>
      {/* Hero Section */}
      <div style={{
        ...cardStyle,
        marginBottom: 24,
        background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.15))',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc', margin: '0 0 8px' }}>
              {t('common.success')} — {t('member.points')}
            </h1>
            <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>
              {t('common.loading')} / {t('order.completed')} / {t('coupon.issued')}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>当前语言:</span>
            <select
              value={locale}
              onChange={e => setLocale(e.target.value as Locale)}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid rgba(148,163,184,0.2)',
                background: 'rgba(15,23,42,0.8)',
                color: '#e2e8f0',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              {SUPPORTED_LOCALES.map(l => (
                <option key={l} value={l}>{LOCALE_LABELS[l]}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {/* Date Formatting */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc', margin: '0 0 16px' }}>日期格式化</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <p style={labelStyle}>short</p>
              <p style={valueStyle}>{formatDateInLocale(now, intlLocale, 'Asia/Shanghai', 'short')}</p>
            </div>
            <div>
              <p style={labelStyle}>long</p>
              <p style={valueStyle}>{formatDateInLocale(now, intlLocale, 'Asia/Shanghai', 'long')}</p>
            </div>
          </div>
        </div>

        {/* Number Formatting */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc', margin: '0 0 16px' }}>数字格式化</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: '1,234', value: 1234 },
              { label: '100,000', value: 100000 },
              { label: '1,000,000', value: 1000000 },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={labelStyle}>{label}</p>
                <p style={valueStyle}>{formatNumberInLocale(value, intlLocale)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Currency Formatting */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc', margin: '0 0 16px' }}>货币格式化</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {CURRENCIES.slice(0, 6).map(({ code, locale: cl }) => (
              <div key={code} style={{ background: 'rgba(15,23,42,0.6)', padding: 12, borderRadius: 8 }}>
                <p style={{ ...labelStyle, margin: 0 }}>{code}</p>
                <p style={{ ...valueStyle, fontSize: 14 }}>{formatCurrencyInLocale(1000, code, cl)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Percent Formatting */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc', margin: '0 0 16px' }}>百分比格式化</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: '0.123', value: 0.123 },
              { label: '0.5', value: 0.5 },
              { label: '0.999', value: 0.999 },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={labelStyle}>{label}</p>
                <p style={valueStyle}>{formatPercentInLocale(value, intlLocale)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Translation Keys Display */}
      <div style={{ ...cardStyle, marginTop: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc', margin: '0 0 16px' }}>翻译 Key 展示</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {translationKeys.map(({ category, keys }) => (
            <div key={category}>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: '#60a5fa', margin: '0 0 8px' }}>{category}</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {keys.map(key => (
                  <div
                    key={key}
                    style={{
                      background: 'rgba(15,23,42,0.6)',
                      padding: '6px 12px',
                      borderRadius: 6,
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: '#94a3b8', marginRight: 8 }}>{key}</span>
                    <span style={{ color: '#22c55e' }}>{t(key)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timezone Demo */}
      <div style={{ ...cardStyle, marginTop: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc', margin: '0 0 16px' }}>时区演示</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {TIMEZONES.map(({ label, tz, flag }) => (
            <div key={tz} style={{ background: 'rgba(15,23,42,0.6)', padding: 14, borderRadius: 8 }}>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 6px' }}>{flag} {label}</p>
              <p style={{ ...valueStyle, fontSize: 15 }}>{formatDateInLocale(now, intlLocale, tz, 'long')}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Heartbeat */}
      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <Heartbeat id="HEARTBEAT-67" />
      </div>
    </div>
  )
}

export default function I18nDemoPage() {
  return (
    <LocaleProvider>
      <I18nDemoContent />
    </LocaleProvider>
  )
}
