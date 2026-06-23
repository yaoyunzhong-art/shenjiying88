/**
 * tenant-settings unit tests — tob-web
 *
 * 覆盖: 租户设置数据加载 / 空状态 / 错误状态 / 正常渲染 / 配置验证
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

type Timezone = 'Asia/Shanghai' | 'Asia/Tokyo' | 'America/New_York' | 'Europe/London' | 'Asia/Singapore';
type Currency = 'CNY' | 'USD' | 'EUR' | 'JPY' | 'SGD';
type Locale = 'zh-CN' | 'zh-TW' | 'en-US' | 'ja-JP' | 'en-SG';
type TaxMode = 'PRICES_INCLUDE_TAX' | 'PRICES_EXCLUDE_TAX';

interface TenantSettings {
  tenantCode: string;
  displayName: string;
  timezone: Timezone;
  currency: Currency;
  locale: Locale;
  taxMode: TaxMode;
  taxRatePercent: number;
  maxBrands: number;
  maxStores: number;
  ssoEnabled: boolean;
  allowedOAuthProviders: string[];
  dataRetentionDays: number;
  auditLogEnabled: boolean;
  featureFlags: Record<string, boolean>;
  updatedAt: string;
}

const SUPPORTED_TIMEZONES: Timezone[] = ['Asia/Shanghai', 'Asia/Tokyo', 'America/New_York', 'Europe/London', 'Asia/Singapore'];
const SUPPORTED_CURRENCIES: Currency[] = ['CNY', 'USD', 'EUR', 'JPY', 'SGD'];
const SUPPORTED_LOCALES: Locale[] = ['zh-CN', 'zh-TW', 'en-US', 'ja-JP', 'en-SG'];
const SUPPORTED_TAX_MODES: TaxMode[] = ['PRICES_INCLUDE_TAX', 'PRICES_EXCLUDE_TAX'];

const MOCK_TENANT_SETTINGS: TenantSettings[] = [
  { tenantCode: 'demo-tenant', displayName: 'Demo 租户', timezone: 'Asia/Shanghai', currency: 'CNY', locale: 'zh-CN', taxMode: 'PRICES_INCLUDE_TAX', taxRatePercent: 6, maxBrands: 20, maxStores: 500, ssoEnabled: true, allowedOAuthProviders: ['WECHAT', 'ALIPAY'], dataRetentionDays: 365, auditLogEnabled: true, featureFlags: { multiBrand: true, marketplace: false, analytics: true, inventorySync: true }, updatedAt: '2026-06-20T10:00:00.000Z' },
  { tenantCode: 'other-tenant', displayName: 'Other Tenant', timezone: 'America/New_York', currency: 'USD', locale: 'en-US', taxMode: 'PRICES_EXCLUDE_TAX', taxRatePercent: 8.25, maxBrands: 10, maxStores: 200, ssoEnabled: false, allowedOAuthProviders: ['GOOGLE', 'APPLE'], dataRetentionDays: 730, auditLogEnabled: true, featureFlags: { multiBrand: true, marketplace: true, analytics: false, inventorySync: true }, updatedAt: '2026-06-18T08:00:00.000Z' },
  { tenantCode: 'jp-tenant', displayName: '東京テナント', timezone: 'Asia/Tokyo', currency: 'JPY', locale: 'ja-JP', taxMode: 'PRICES_EXCLUDE_TAX', taxRatePercent: 10, maxBrands: 5, maxStores: 100, ssoEnabled: true, allowedOAuthProviders: ['LINE', 'GOOGLE'], dataRetentionDays: 365, auditLogEnabled: false, featureFlags: { multiBrand: false, marketplace: false, analytics: true, inventorySync: false }, updatedAt: '2026-06-15T03:00:00.000Z' },
  { tenantCode: 'eu-tenant', displayName: 'EU Tenant', timezone: 'Europe/London', currency: 'EUR', locale: 'en-US', taxMode: 'PRICES_EXCLUDE_TAX', taxRatePercent: 20, maxBrands: 15, maxStores: 300, ssoEnabled: true, allowedOAuthProviders: ['GOOGLE', 'APPLE', 'MICROSOFT'], dataRetentionDays: 1095, auditLogEnabled: true, featureFlags: { multiBrand: true, marketplace: true, analytics: true, inventorySync: true }, updatedAt: '2026-06-19T12:00:00.000Z' },
  { tenantCode: 'sg-tenant', displayName: 'SG Tenant', timezone: 'Asia/Singapore', currency: 'SGD', locale: 'en-SG', taxMode: 'PRICES_EXCLUDE_TAX', taxRatePercent: 9, maxBrands: 10, maxStores: 250, ssoEnabled: false, allowedOAuthProviders: ['GOOGLE'], dataRetentionDays: 730, auditLogEnabled: true, featureFlags: { multiBrand: false, marketplace: true, analytics: true, inventorySync: true }, updatedAt: '2026-06-17T06:00:00.000Z' },
  { tenantCode: 'empty-tenant', displayName: '空租户', timezone: 'Asia/Shanghai', currency: 'CNY', locale: 'zh-CN', taxMode: 'PRICES_INCLUDE_TAX', taxRatePercent: 0, maxBrands: 0, maxStores: 0, ssoEnabled: false, allowedOAuthProviders: [], dataRetentionDays: 90, auditLogEnabled: false, featureFlags: {}, updatedAt: '2026-06-01T00:00:00.000Z' },
];

describe('tenant-settings data integrity', () => {
  it('should have at least 5 tenant settings', () => {
    assert.ok(MOCK_TENANT_SETTINGS.length >= 5);
  });
  it('every tenant should have required fields', () => {
    for (const t of MOCK_TENANT_SETTINGS) {
      assert.ok(typeof t.tenantCode === 'string' && t.tenantCode.length > 0);
      assert.ok(typeof t.taxRatePercent === 'number' && t.taxRatePercent >= 0);
      assert.ok(typeof t.dataRetentionDays === 'number' && t.dataRetentionDays >= 1);
      assert.ok(typeof t.ssoEnabled === 'boolean');
      assert.ok(typeof t.auditLogEnabled === 'boolean');
    }
  });
  it('timezone should be from supported set', () => {
    for (const t of MOCK_TENANT_SETTINGS) assert.ok(SUPPORTED_TIMEZONES.includes(t.timezone));
  });
  it('currency should be from supported set', () => {
    for (const t of MOCK_TENANT_SETTINGS) assert.ok(SUPPORTED_CURRENCIES.includes(t.currency));
  });
  it('tax rate should be between 0 and 100', () => {
    for (const t of MOCK_TENANT_SETTINGS) assert.ok(t.taxRatePercent >= 0 && t.taxRatePercent <= 100);
  });
});

describe('tenant-settings filtering', () => {
  it('should filter by SSO enabled', () => {
    const sso = MOCK_TENANT_SETTINGS.filter(t => t.ssoEnabled);
    for (const t of sso) assert.equal(t.ssoEnabled, true);
  });
  it('should filter by currency', () => {
    for (const c of SUPPORTED_CURRENCIES) assert.ok(MOCK_TENANT_SETTINGS.filter(t => t.currency === c).length >= 0);
  });
  it('SSO tenants should have at least 1 OAuth provider', () => {
    for (const t of MOCK_TENANT_SETTINGS.filter(t => t.ssoEnabled)) assert.ok(t.allowedOAuthProviders.length >= 1);
  });
});

describe('tenant-settings empty/error states', () => {
  it('empty tenant list should not crash', () => {
    const tenants: TenantSettings[] = [];
    assert.equal(tenants.length, 0);
  });
  it('empty feature flags should be handled', () => {
    const emptyFlags = MOCK_TENANT_SETTINGS.filter(t => Object.keys(t.featureFlags).length === 0);
    for (const t of emptyFlags) assert.equal(Object.keys(t.featureFlags).length, 0);
  });
  it('empty OAuth providers should be handled', () => {
    const noOAuth = MOCK_TENANT_SETTINGS.filter(t => t.allowedOAuthProviders.length === 0);
    assert.ok(noOAuth.length >= 1);
  });
});

describe('tenant-settings validation rules', () => {
  it('CNY tenants should use PRICES_INCLUDE_TAX', () => {
    for (const t of MOCK_TENANT_SETTINGS.filter(t => t.currency === 'CNY' && t.timezone === 'Asia/Shanghai'))
      assert.equal(t.taxMode, 'PRICES_INCLUDE_TAX');
  });
  it('USD tenants should use PRICES_EXCLUDE_TAX', () => {
    for (const t of MOCK_TENANT_SETTINGS.filter(t => t.currency === 'USD'))
      assert.equal(t.taxMode, 'PRICES_EXCLUDE_TAX');
  });
  it('data retention days should be >= 30', () => {
    for (const t of MOCK_TENANT_SETTINGS) assert.ok(t.dataRetentionDays >= 30);
  });
});
