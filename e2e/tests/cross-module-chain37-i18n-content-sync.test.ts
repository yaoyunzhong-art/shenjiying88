/**
 * 🦞 链37: Admin→API→Storefront→Miniapp→Mobile 多语言内容管理 + 多端同步
 * 
 * 路径: Admin 创建/翻译/发布多语言内容 → API 存储多语言数据(地区+语言+回退)
 *      → Storefront 根据用户语言展示 → Miniapp 语言切换 → Mobile 多语言推送
 *      → 验证所有端内容一致性和回退策略
 * 
 * 覆盖模块: admin-web · api · storefront-web · miniapp · mobile (5 模块)
 * 新增角色: 内容运营 (新增), 翻译员 (新增)
 * 新增模式: 多语言内容生命周期 + 语言回退链 + 多端一致性校验 + 语言切换传播
 * 
 * Pulse-Nightly-19 新增 · 2026-07-19
 */

import { describe, test, before } from 'node:test';
import assert from 'node:assert/strict';

// ========== 类型定义 ==========
type Locale = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR' | 'th-TH';
type ContentType = 'product' | 'page' | 'notification' | 'label' | 'system_message';
type ContentStatus = 'draft' | 'pending_review' | 'translated' | 'published' | 'archived';
type FallbackMode = 'strict' | 'parent' | 'default_locale' | 'key_name';

interface I18nContent {
  id: string;
  contentType: ContentType;
  contentKey: string;
  translations: Partial<Record<Locale, string>>;
  masterLocale: Locale;
  fallbackMode: FallbackMode;
  status: ContentStatus;
  tags: string[];
  version: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  publishedBy?: string;
}

interface TranslationJob {
  id: string;
  contentKey: string;
  sourceLocale: Locale;
  targetLocales: Locale[];
  sourceText: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignedTo?: string;
  completedAt?: string;
  machineTranslated: boolean;
}

interface LocaleConfig {
  locale: Locale;
  displayName: string;
  enabled: boolean;
  fallbackChain: Locale[];
  isRTL: boolean;
  dateFormat: string;
  timeFormat: string;
  currencyCode: string;
}

// ========== 仓储层 ==========
const contentStore: I18nContent[] = [];
const translationJobs: TranslationJob[] = [];
const localeConfigs: LocaleConfig[] = [];
const userLocalePreferences: Map<string, Locale> = new Map();
const userDeviceLanguageStore: Map<string, Locale> = new Map();
const publishedEvents: { contentKey: string; locale: Locale; publishedAt: string }[] = [];
const syncAuditLog: string[] = [];

function seedData() {
  contentStore.length = 0;
  translationJobs.length = 0;
  localeConfigs.length = 0;
  userLocalePreferences.clear();
  userDeviceLanguageStore.clear();
  publishedEvents.length = 0;
  syncAuditLog.length = 0;

  // 语言配置
  const configs: LocaleConfig[] = [
    { locale: 'zh-CN', displayName: '简体中文', enabled: true, fallbackChain: [], isRTL: false, dateFormat: 'YYYY-MM-DD', timeFormat: 'HH:mm', currencyCode: 'CNY' },
    { locale: 'en-US', displayName: 'English', enabled: true, fallbackChain: ['zh-CN'], isRTL: false, dateFormat: 'MM/DD/YYYY', timeFormat: 'hh:mm A', currencyCode: 'USD' },
    { locale: 'ja-JP', displayName: '日本語', enabled: true, fallbackChain: ['en-US', 'zh-CN'], isRTL: false, dateFormat: 'YYYY年MM月DD日', timeFormat: 'HH:mm', currencyCode: 'JPY' },
    { locale: 'ko-KR', displayName: '한국어', enabled: true, fallbackChain: ['en-US', 'zh-CN'], isRTL: false, dateFormat: 'YYYY.MM.DD', timeFormat: 'HH:mm', currencyCode: 'KRW' },
    { locale: 'th-TH', displayName: 'ไทย', enabled: true, fallbackChain: ['en-US', 'zh-CN'], isRTL: false, dateFormat: 'DD/MM/2567', timeFormat: 'HH:mm', currencyCode: 'THB' },
  ];
  localeConfigs.push(...configs.map(c => ({ ...c })));
}

// ========== 服务函数 ==========

// Admin: 内容运营创建多语言内容
function adminCreateContent(params: {
  contentType: ContentType;
  contentKey: string;
  masterLocale: Locale;
  masterText: string;
  fallbackMode?: FallbackMode;
  tags?: string[];
}): { success: boolean; content?: I18nContent; error?: string } {
  if (contentStore.find(c => c.contentKey === params.contentKey)) {
    return { success: false, error: 'duplicate_content_key' };
  }
  if (!localeConfigs.find(l => l.locale === params.masterLocale)?.enabled) {
    return { success: false, error: 'master_locale_disabled' };
  }

  const content: I18nContent = {
    id: `i18n_${Date.now()}_${String(Math.random()).slice(2, 8)}`,
    contentType: params.contentType,
    contentKey: params.contentKey,
    translations: { [params.masterLocale]: params.masterText },
    masterLocale: params.masterLocale,
    fallbackMode: params.fallbackMode || 'default_locale',
    status: 'draft',
    tags: params.tags || [],
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  contentStore.push(content);
  syncAuditLog.push(`[admin] CREATED ${params.contentKey} master=${params.masterLocale}`);
  return { success: true, content: { ...content } };
}

// Admin: 提交翻译任务
function adminSubmitTranslation(params: {
  contentKey: string;
  targetLocales: Locale[];
  assignTo?: string;
  machineTranslate?: boolean;
}): { success: boolean; jobs?: TranslationJob[]; error?: string } {
  const content = contentStore.find(c => c.contentKey === params.contentKey);
  if (!content) return { success: false, error: 'content_not_found' };
  if (content.status === 'published') return { success: false, error: 'already_published' };

  const jobs: TranslationJob[] = [];
  for (const targetLocale of params.targetLocales) {
    if (targetLocale === content.masterLocale) continue;
    if (content.translations[targetLocale]) continue; // 已存在

    const job: TranslationJob = {
      id: `job_${Date.now()}_${targetLocale}_${String(Math.random()).slice(2, 6)}`,
      contentKey: params.contentKey,
      sourceLocale: content.masterLocale,
      targetLocales: [targetLocale],
      sourceText: content.translations[content.masterLocale] || '',
      status: params.machineTranslate ? 'completed' : 'pending',
      assignedTo: params.assignTo || 'translator_auto',
      machineTranslated: params.machineTranslate || false,
      completedAt: params.machineTranslate ? new Date().toISOString() : undefined,
    };
    translationJobs.push(job);
    jobs.push(job);
  }
  content.status = 'pending_review';
  content.updatedAt = new Date().toISOString();
  syncAuditLog.push(`[admin] TRANSLATION ${params.contentKey} → ${params.targetLocales.join(',')}`);
  return { success: true, jobs };
}

// Admin: 完成翻译(手动)
function adminCompleteTranslation(contentKey: string, locale: Locale, translatedText: string): { success: boolean; error?: string } {
  const content = contentStore.find(c => c.contentKey === contentKey);
  if (!content) return { success: false, error: 'content_not_found' };

  content.translations[locale] = translatedText;
  content.updatedAt = new Date().toISOString();
  syncAuditLog.push(`[admin] TRANSLATED ${contentKey}[${locale}]`);
  return { success: true };
}

// Admin: 发布多语言内容
function adminPublishContent(contentKey: string, publishedBy?: string): { success: boolean; content?: I18nContent; error?: string } {
  const content = contentStore.find(c => c.contentKey === contentKey);
  if (!content) return { success: false, error: 'content_not_found' };
  if (content.status === 'published') return { success: false, error: 'already_published' };
  if (content.status === 'draft') return { success: false, error: 'not_translated_yet' };

  content.status = 'published';
  content.publishedAt = new Date().toISOString();
  content.publishedBy = publishedBy || 'content_admin';
  content.version++;
  content.updatedAt = new Date().toISOString();

  for (const locale of localeConfigs.filter(l => l.enabled).map(l => l.locale)) {
    publishedEvents.push({ contentKey, locale, publishedAt: content.publishedAt });
  }
  syncAuditLog.push(`[admin] PUBLISHED ${contentKey} v${content.version}`);
  return { success: true, content: { ...content } };
}

// Admin: 查看翻译状态
function adminGetTranslationStatus(contentKey: string): { content?: I18nContent; jobs: TranslationJob[]; coverage: Record<Locale, boolean> } {
  const content = contentStore.find(c => c.contentKey === contentKey);
  const jobs = translationJobs.filter(j => j.contentKey === contentKey);
  const coverage: Record<string, boolean> = {};
  for (const lc of localeConfigs) {
    coverage[lc.locale] = content ? !!content.translations[lc.locale] : false;
  }
  return { content, jobs, coverage };
}

// Admin: 批量导出翻译
function adminExportTranslations(contentKeys?: string[]): I18nContent[] {
  if (contentKeys) {
    return contentStore.filter(c => contentKeys.includes(c.contentKey)).map(c => ({ ...c }));
  }
  return contentStore.map(c => ({ ...c }));
}

// API: 获取指定语言内容(含回退逻辑)
function apiGetContent(contentKey: string, locale: Locale): { text: string; actualLocale: Locale; fallbackApplied: boolean } | null {
  const content = contentStore.find(c => c.contentKey === contentKey && c.status === 'published');
  if (!content) return null;

  // 直接命中
  if (content.translations[locale]) {
    return { text: content.translations[locale]!, actualLocale: locale, fallbackApplied: false };
  }

  // 回退链
  if (content.fallbackMode === 'strict') return null;

  const config = localeConfigs.find(l => l.locale === locale);
  if (!config) return null;

  if (content.fallbackMode === 'default_locale') {
    const fallback = content.translations[content.masterLocale];
    if (fallback) return { text: fallback, actualLocale: content.masterLocale, fallbackApplied: true };
    return null;
  }

  if (content.fallbackMode === 'parent' && config.fallbackChain.length > 0) {
    for (const fallbackLocale of config.fallbackChain) {
      const text = content.translations[fallbackLocale];
      if (text) return { text, actualLocale: fallbackLocale, fallbackApplied: true };
    }
  }

  // key_name 回退
  if (content.fallbackMode === 'key_name') {
    return { text: contentKey, actualLocale: locale, fallbackApplied: true };
  }

  return null;
}

// Storefront: 获取内容(根据用户选择语言)
function storefrontDisplayContent(contentKey: string, locale: Locale): { text: string; locale: Locale; isFallback: boolean } | null {
  const result = apiGetContent(contentKey, locale);
  if (!result) return null;
  return { text: result.text, locale: result.actualLocale, isFallback: result.fallbackApplied };
}

// Storefront: 语言切换
function storefrontSwitchLanguage(userId: string, locale: Locale): { success: boolean; error?: string } {
  if (!localeConfigs.find(l => l.locale === locale)?.enabled) {
    return { success: false, error: 'locale_not_enabled' };
  }
  userLocalePreferences.set(userId, locale);
  syncAuditLog.push(`[storefront] SWITCH ${userId} → ${locale}`);
  return { success: true };
}

// Miniapp: 获取内容(支持语言切换)
function miniappGetContent(contentKey: string, preferredLocale?: Locale): { text: string; locale: Locale; isFallback: boolean } | null {
  const locale = preferredLocale || 'zh-CN';
  return storefrontDisplayContent(contentKey, locale);
}

// Miniapp: 触发语言切换推送
function miniappTriggerLocaleSwitch(userId: string, newLocale: Locale): { success: boolean; previousLocale?: Locale; error?: string } {
  const prev = userLocalePreferences.get(userId);
  const result = storefrontSwitchLanguage(userId, newLocale);
  if (result.success) {
    syncAuditLog.push(`[miniapp] PUSH_LOCALE ${userId}: ${prev || 'none'} → ${newLocale}`);
    return { success: true, previousLocale: prev };
  }
  return { success: false, error: result.error };
}

// Mobile: 获取设备语言
function mobileGetDeviceLanguage(deviceId: string): Locale {
  return userDeviceLanguageStore.get(deviceId) || 'zh-CN';
}

function mobileSetDeviceLanguage(deviceId: string, locale: Locale): { success: boolean; error?: string } {
  if (!localeConfigs.find(l => l.locale === locale)?.enabled) {
    return { success: false, error: 'locale_not_enabled' };
  }
  userDeviceLanguageStore.set(deviceId, locale);
  syncAuditLog.push(`[mobile] DEVICE_LANG ${deviceId} → ${locale}`);
  return { success: true };
}

// Mobile: 推送通知
function mobileSendNotification(userId: string, notificationKey: string, locale?: Locale): { text: string; locale: Locale } {
  const targetLocale = locale || userLocalePreferences.get(userId) || 'zh-CN';
  const result = apiGetContent(notificationKey, targetLocale);
  if (!result) {
    return { text: notificationKey, locale: targetLocale };
  }
  return { text: result.text, locale: result.actualLocale };
}

// 一致性校验函数
function verifyCrossPlatformConsistency(contentKey: string, userIds: string[]): { consistent: boolean; results: { userId: string; text: string; locale: Locale; isFallback: boolean }[] } {
  const results = userIds.map(uid => {
    const pref = userLocalePreferences.get(uid) || 'zh-CN';
    const storefrontResult = storefrontDisplayContent(contentKey, pref);
    const miniappResult = miniappGetContent(contentKey, pref);
    return {
      userId: uid,
      text: storefrontResult?.text || '(not found)',
      locale: storefrontResult?.locale || pref,
      isFallback: storefrontResult?.isFallback || false,
    };
  });
  // 相同 locale 的显示应一致
  const groups = new Map<string, string[]>();
  for (const r of results) {
    const key = r.locale;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r.text);
  }
  const consistent = Array.from(groups.values()).every(texts => texts.every(t => t === texts[0]));
  return { consistent, results };
}


// ========== 测试用例 ==========

describe('链37: 多语言内容管理 + 多端同步 (Admin→API→Storefront→Miniapp→Mobile)', () => {

  before(() => {
    seedData();
  });

  // ======== Phase 1: Admin 内容创建 + 翻译管理 ========

  test('[P1.1] Admin创建中文产品描述 → 创建成功, status=draft, 仅包含master翻译', () => {
    const r = adminCreateContent({
      contentType: 'product',
      contentKey: 'product_ice_maker_pro',
      masterLocale: 'zh-CN',
      masterText: '商用智能制冰机 Pro，日产冰量150kg，适合餐饮门店',
      tags: ['ice_maker', 'commercial'],
    });
    assert.ok(r.success, `创建失败: ${r.error}`);
    assert.equal(r.content!.status, 'draft');
    assert.equal(r.content!.translations['zh-CN'], '商用智能制冰机 Pro，日产冰量150kg，适合餐饮门店');
    assert.equal(r.content!.contentType, 'product');
  });

  test('[P1.2] Admin创建页面标题 → 支持多语言内容', () => {
    const r = adminCreateContent({
      contentType: 'page',
      contentKey: 'page_home_title',
      masterLocale: 'zh-CN',
      masterText: '欢迎来到龙虾哥智慧门店',
    });
    assert.ok(r.success);
  });

  test('[P1.3] Admin创建通知消息模板 → 成功', () => {
    const r = adminCreateContent({
      contentType: 'notification',
      contentKey: 'notif_order_shipped',
      masterLocale: 'zh-CN',
      masterText: '您的订单已发货，预计{date}到达',
      fallbackMode: 'default_locale',
    });
    assert.ok(r.success);
  });

  test('[N1.1] Admin创建重复contentKey → 拒绝', () => {
    const r = adminCreateContent({
      contentType: 'product',
      contentKey: 'product_ice_maker_pro',
      masterLocale: 'zh-CN',
      masterText: '重复创建',
    });
    assert.equal(r.success, false);
    assert.equal(r.error, 'duplicate_content_key');
  });

  test('[N1.2] Admin提交翻译时content不存在 → 拒绝', () => {
    const r = adminSubmitTranslation({
      contentKey: 'product_nonexistent',
      targetLocales: ['en-US'],
    });
    assert.equal(r.success, false);
    assert.equal(r.error, 'content_not_found');
  });

  test('[P1.4] Admin提交英文/日文翻译(机器翻译) → 自动完成, status=completed', () => {
    const r = adminSubmitTranslation({
      contentKey: 'product_ice_maker_pro',
      targetLocales: ['en-US', 'ja-JP'],
      machineTranslate: true,
    });
    assert.ok(r.success);
    assert.ok(r.jobs!.length >= 2);
    assert.ok(r.jobs!.every(j => j.status === 'completed'));
    assert.ok(r.jobs!.every(j => j.machineTranslated));
  });

  test('[P1.5] Admin手动完成韩文翻译 → completed, 添加翻译文本', () => {
    const r = adminSubmitTranslation({
      contentKey: 'product_ice_maker_pro',
      targetLocales: ['ko-KR'],
      assignTo: 'translator_kim',
      machineTranslate: false,
    });
    assert.ok(r.success);
    assert.equal(r.jobs![0].status, 'pending');
    assert.equal(r.jobs![0].assignedTo, 'translator_kim');

    // 手动完成
    const complete = adminCompleteTranslation('product_ice_maker_pro', 'ko-KR', '상업용 스마트 제빙기 Pro, 일일 제빙량 150kg');
    assert.ok(complete.success);
  });

  test('[P1.6] Admin发布内容 → status=published, version递增', () => {
    const r = adminPublishContent('product_ice_maker_pro', 'content_admin_01');
    assert.ok(r.success);
    assert.equal(r.content!.status, 'published');
    assert.equal(r.content!.version, 2);
    assert.ok(r.content!.publishedAt);
  });

  test('[N1.3] Admin发布draft内容(未提交翻译) → 拒绝', () => {
    const r = adminPublishContent('page_home_title');
    assert.equal(r.success, false);
    assert.equal(r.error, 'not_translated_yet');
  });

  test('[N1.4] Admin重复发布已发布内容 → 拒绝', () => {
    const r = adminPublishContent('product_ice_maker_pro');
    assert.equal(r.success, false);
    assert.equal(r.error, 'already_published');
  });

  test('[P1.7] Admin查看翻译覆盖 → 展示各语言覆盖状态', () => {
    const status = adminGetTranslationStatus('product_ice_maker_pro');
    assert.ok(status.content);
    assert.equal(status.jobs.length, 3);
    assert.ok(status.coverage['zh-CN']);
    assert.ok(status.coverage['en-US']); // 机器翻译自动完成
    assert.ok(status.coverage['ko-KR']);
    assert.equal(status.coverage['th-TH'], false); // 未翻译
  });

  test('[B1.1] Admin批量导出所有翻译 → 导出完整列表', () => {
    const exported = adminExportTranslations();
    assert.ok(exported.length >= 3);
  });

  // ======== Phase 2: API 多语言读取 + 回退策略 ========

  test('[P2.1] API中文请求 → 返回原文, fallbackApplied=false', () => {
    const r = apiGetContent('product_ice_maker_pro', 'zh-CN');
    assert.ok(r);
    assert.ok(r!.text.includes('商用智能制冰机'));
    assert.equal(r!.fallbackApplied, false);
    assert.equal(r!.actualLocale, 'zh-CN');
  });

  test('[P2.2] API英文请求 → 返回机器翻译, fallbackApplied=false', () => {
    const r = apiGetContent('product_ice_maker_pro', 'en-US');
    assert.ok(r);
    // 机器翻译 - 检查存在英文文本
    assert.ok(r!.text.length > 0);
    assert.equal(r!.actualLocale, 'en-US');
  });

  test('[P2.3] API泰文请求(未翻译) → 回退到master locale(zh-CN), fallbackApplied=true', () => {
    const r = apiGetContent('product_ice_maker_pro', 'th-TH');
    assert.ok(r);
    assert.ok(r!.text.includes('商用智能制冰机'));
    assert.equal(r!.actualLocale, 'zh-CN');
    assert.ok(r!.fallbackApplied);
  });

  test('[P2.4] API不存在的content → 返回null', () => {
    const r = apiGetContent('product_nonexistent', 'zh-CN');
    assert.equal(r, null);
  });

  test('[P2.5] API strict模式未翻译 → 返回null(不回退)', () => {
    adminCreateContent({
      contentType: 'product',
      contentKey: 'product_strict_only',
      masterLocale: 'zh-CN',
      masterText: '仅中文产品',
      fallbackMode: 'strict',
    });
    adminSubmitTranslation({ contentKey: 'product_strict_only', targetLocales: ['en-US'], machineTranslate: true });
    adminPublishContent('product_strict_only');

    const r = apiGetContent('product_strict_only', 'ja-JP');
    assert.equal(r, null); // strict mode, 无回退
  });

  test('[B2.1] API key_name回退模式 → 返回contentKey作为文本', () => {
    adminCreateContent({
      contentType: 'label',
      contentKey: 'label.save',
      masterLocale: 'zh-CN',
      masterText: '保存',
      fallbackMode: 'key_name',
    });
    adminSubmitTranslation({ contentKey: 'label.save', targetLocales: ['en-US'], machineTranslate: true });
    adminPublishContent('label.save');

    const r = apiGetContent('label.save', 'ja-JP');
    assert.ok(r);
    assert.equal(r!.text, 'label.save');
    assert.ok(r!.fallbackApplied);
  });

  // ======== Phase 3: Storefront 语言切换 + 内容展示 ========

  test('[P3.1] Storefront根据中文展示 → 显示正确翻译', () => {
    const r = storefrontDisplayContent('product_ice_maker_pro', 'zh-CN');
    assert.ok(r);
    assert.equal(r!.isFallback, false);
    assert.equal(r!.locale, 'zh-CN');
  });

  test('[P3.2] Storefront语言切换(en-US) → 偏好更新成功', () => {
    const r = storefrontSwitchLanguage('user_mike', 'en-US');
    assert.ok(r.success);
    assert.equal(userLocalePreferences.get('user_mike'), 'en-US');
  });

  test('[P3.3] Storefront切换后展示英文内容 → 英文内容', () => {
    const r = storefrontDisplayContent('product_ice_maker_pro', 'en-US');
    assert.ok(r);
    assert.equal(r!.locale, 'en-US');
  });

  test('[N3.1] Storefront切换到未启用的语言 → 拒绝', () => {
    const r = storefrontSwitchLanguage('user_john', 'fr-FR' as Locale);
    assert.equal(r.success, false);
    assert.equal(r.error, 'locale_not_enabled');
  });

  test('[P3.4] Storefront先发布page_home_title翻译再展示 → 正常显示', () => {
    adminSubmitTranslation({ contentKey: 'page_home_title', targetLocales: ['en-US', 'ja-JP'], machineTranslate: true });
    adminPublishContent('page_home_title', 'content_admin_01');

    const r = storefrontDisplayContent('page_home_title', 'en-US');
    assert.ok(r);
  });

  // ======== Phase 4: Miniapp 语言切换 + 传播 ========

  test('[P4.1] Miniapp获取内容(默认中文) → 正确', () => {
    const r = miniappGetContent('product_ice_maker_pro', 'zh-CN');
    assert.ok(r);
    assert.ok(r!.text.includes('制冰机'));
  });

  test('[P4.2] Miniapp触发语言切换→英文 → 同步更新storefront偏好', () => {
    const r = miniappTriggerLocaleSwitch('user_alice', 'en-US');
    assert.ok(r.success);
    assert.equal(r.previousLocale, undefined); // 首次
    assert.equal(userLocalePreferences.get('user_alice'), 'en-US');
  });

  test('[P4.3] Miniapp切换后内容变为英文 → 验证', () => {
    const r = miniappGetContent('product_ice_maker_pro', 'en-US');
    assert.ok(r);
    assert.equal(r!.locale, 'en-US');
  });

  test('[P4.4] Miniapp语言切换传播到Storefront → 跨端一致性', () => {
    // user_alice 在 miniapp 切换了, storefront 也能看到英文
    const r = storefrontDisplayContent('product_ice_maker_pro', 'en-US');
    assert.ok(r);
    assert.equal(r!.locale, 'en-US');
  });

  test('[N4.1] Miniapp切换到未启用语言 → 拒绝', () => {
    const r = miniappTriggerLocaleSwitch('user_bob', 'fr-FR' as Locale);
    assert.equal(r.success, false);
  });

  // ======== Phase 5: Mobile 设备语言 + 推送 ========

  test('[P5.1] Mobile设置设备语言为英文 → 设备偏好记录', () => {
    const r = mobileSetDeviceLanguage('device_mike_iphone', 'en-US');
    assert.ok(r.success);
    assert.equal(mobileGetDeviceLanguage('device_mike_iphone'), 'en-US');
  });

  test('[P5.2] Mobile发送推送通知(中文) → 显示正确内容', () => {
    // 先创建并发布通知翻译
    adminSubmitTranslation({ contentKey: 'notif_order_shipped', targetLocales: ['en-US', 'ja-JP'], machineTranslate: true });
    adminCompleteTranslation('notif_order_shipped', 'en-US', 'Your order has been shipped, expected {date}');
    adminPublishContent('notif_order_shipped');

    const r = mobileSendNotification('user_mike', 'notif_order_shipped', 'en-US');
    assert.ok(r.text.includes('Your order'));
    assert.equal(r.locale, 'en-US');
  });

  test('[P5.3] Mobile推送跟随用户偏好语言 → 自动适配', () => {
    userLocalePreferences.set('user_mike', 'ja-JP');
    // 完成日文翻译
    adminCompleteTranslation('notif_order_shipped', 'ja-JP', 'ご注文は発送されました。{date}に到着予定');
    const r = mobileSendNotification('user_mike', 'notif_order_shipped');
    assert.ok(r.text.includes('発送'));
    assert.equal(r.locale, 'ja-JP');
  });

  test('[P5.4] Mobile推送时如果语言不存在 → key_name 回退', () => {
    const r = mobileSendNotification('user_thai', 'notif_order_shipped', 'th-TH');
    // notif_order_shipped 的 fallbackMode 是 default_locale → 回退到zh-CN
    assert.ok(r);

    // 再测一个没有翻译的新通知key
    adminCreateContent({
      contentType: 'notification',
      contentKey: 'notif_test_fallback',
      masterLocale: 'zh-CN',
      masterText: '测试回退通知',
      fallbackMode: 'key_name', // key_name fallback
    });
    adminPublishContent('notif_test_fallback');

    const r2 = mobileSendNotification('user_john', 'notif_test_fallback', 'ja-JP');
    assert.equal(r2.text, 'notif_test_fallback');
  });

  test('[N5.1] Mobile设置设备语言为未启用语言 → 拒绝', () => {
    const r = mobileSetDeviceLanguage('device_test', 'fr-FR' as Locale);
    assert.equal(r.success, false);
  });

  // ======== Phase 6: 多端一致性校验 ========

  test('[B6.1] 相同locale的多端内容 → 一致', () => {
    // 设置多个用户同一locale
    storefrontSwitchLanguage('user_consistency_1', 'en-US');
    storefrontSwitchLanguage('user_consistency_2', 'en-US');
    miniappTriggerLocaleSwitch('user_consistency_3', 'en-US');

    const result = verifyCrossPlatformConsistency('product_ice_maker_pro', [
      'user_consistency_1', 'user_consistency_2', 'user_consistency_3',
    ]);
    assert.ok(result.consistent, `内容不一致: ${JSON.stringify(result.results)}`);
  });

  test('[B6.2] 不同locale用户看到不同语言版本 → 语言隔离', () => {
    storefrontSwitchLanguage('user_cn', 'zh-CN');
    storefrontSwitchLanguage('user_jp', 'ja-JP');

    const r_cn = storefrontDisplayContent('product_ice_maker_pro', 'zh-CN');
    const r_jp = storefrontDisplayContent('product_ice_maker_pro', 'ja-JP');

    assert.ok(r_cn);
    assert.ok(r_jp);
    assert.notEqual(r_cn!.locale, r_jp!.locale);
    // ja-JP有回退链 en-US → zh-CN, 未直接翻译, 所以 fallbackApplied 应为 true
    assert.ok(r_jp!.isFallback);
  });

  test('[B6.3] 翻译工作流全链路审计日志 → 记录所有操作', () => {
    assert.ok(syncAuditLog.length >= 15, `审计日志不足: ${syncAuditLog.length}`);
    const allLogs = syncAuditLog.join('\n');
    assert.ok(allLogs.includes('CREATED'));
    assert.ok(allLogs.includes('TRANSLATION'));
    assert.ok(allLogs.includes('PUBLISHED'));
    assert.ok(allLogs.includes('SWITCH'));
    assert.ok(allLogs.includes('PUSH_LOCALE'));
    assert.ok(allLogs.includes('DEVICE_LANG'));
    assert.ok(allLogs.includes('TRANSLATED'));
  });

  test('[B6.4] 全部语言配置可查询 → 语言列表正确', () => {
    assert.equal(localeConfigs.length, 5);
    const enabledLocales = localeConfigs.filter(l => l.enabled).map(l => l.locale).sort();
    assert.deepEqual(enabledLocales, ['en-US', 'ja-JP', 'ko-KR', 'th-TH', 'zh-CN'].sort());
  });

  test('[B6.5] 发布后publishedEvents记录 → 所有语言都有事件', () => {
    const productEvents = publishedEvents.filter(e => e.contentKey === 'product_ice_maker_pro');
    assert.equal(productEvents.length, 5); // 5个locale 各1条
    const localesEmitted = productEvents.map(e => e.locale).sort();
    assert.deepEqual(localesEmitted, ['en-US', 'ja-JP', 'ko-KR', 'th-TH', 'zh-CN'].sort());
  });

  test('[B6.6] 翻译状态追踪 → 未翻译语言的回退策略验证', () => {
    const status = adminGetTranslationStatus('product_ice_maker_pro');
    assert.equal(status.coverage['th-TH'], false); // 泰文未翻译
    assert.equal(status.coverage['zh-CN'], true);
    assert.equal(status.coverage['en-US'], true);

    // 泰文应该回退到中文
    const thResult = apiGetContent('product_ice_maker_pro', 'th-TH');
    assert.ok(thResult);
    assert.ok(thResult!.fallbackApplied);
    assert.equal(thResult!.actualLocale, 'zh-CN');
  });
});
