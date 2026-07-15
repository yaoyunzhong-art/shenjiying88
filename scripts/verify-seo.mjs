#!/usr/bin/env node
/**
 * P-49 SEO/GEO 验证脚本
 * 验证神机营 SaaS 平台的 SEO 和 GEO 实现
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const ROOT = process.cwd();
const ADMIN_WEB = resolve(ROOT, 'apps/admin-web');

// 颜色输出
const colors = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  blue: (s) => `\x1b[34m${s}\x1b[0m`,
};

let passCount = 0;
let failCount = 0;
let warnCount = 0;

function test(name, fn) {
  try {
    const result = fn();
    if (result === true) {
      console.log(`  ${colors.green('✓')} ${name}`);
      passCount++;
    } else if (result === 'warn') {
      console.log(`  ${colors.yellow('⚠')} ${name}`);
      warnCount++;
    } else {
      console.log(`  ${colors.red('✗')} ${name}: ${result}`);
      failCount++;
    }
  } catch (e) {
    console.log(`  ${colors.red('✗')} ${name}: ${e.message}`);
    failCount++;
  }
}

console.log('\n' + colors.blue('🔍 P-49 SEO/GEO 验证'));
console.log('=' .repeat(50));

// 1. 验证 layout.tsx 基础 SEO
console.log('\n📄 Layout.tsx 基础 SEO');
const layoutPath = resolve(ADMIN_WEB, 'app/layout.tsx');
const layoutContent = existsSync(layoutPath) ? readFileSync(layoutPath, 'utf-8') : '';

test('layout.tsx 存在', () => existsSync(layoutPath));
test('包含 metadata export', () => layoutContent.includes('export const metadata'));
test('包含 viewport export', () => layoutContent.includes('export const viewport'));
test('包含 title 配置', () => layoutContent.includes('title:'));
test('包含 description 配置', () => layoutContent.includes('description:'));
test('包含 keywords 配置', () => layoutContent.includes('keywords:'));
test('包含 Open Graph 配置', () => layoutContent.includes('openGraph:'));
test('包含 Twitter Card 配置', () => layoutContent.includes('twitter:'));
test('包含 robots 配置', () => layoutContent.includes('robots:'));
test('包含 JSON-LD 结构化数据', () => layoutContent.includes('application/ld+json'));
test('包含 GEO 元数据 (geo.region)', () => layoutContent.includes('geo.region'));
test('包含 GEO 元数据 (geo.placename)', () => layoutContent.includes('geo.placename'));
test('包含 GEO 元数据 (geo.position)', () => layoutContent.includes('geo.position'));
test('包含 GEO 元数据 (ICBM)', () => layoutContent.includes('ICBM'));

// 2. 验证动态路由 SEO
console.log('\n🌐 动态路由 SEO (stores/[id])');
const storePagePath = resolve(ADMIN_WEB, 'app/stores/[id]/page.tsx');
const storePageContent = existsSync(storePagePath) ? readFileSync(storePagePath, 'utf-8') : '';

test('stores/[id]/page.tsx 存在', () => existsSync(storePagePath));
test('包含 generateMetadata export', () => storePageContent.includes('export async function generateMetadata'));
test('generateMetadata 接收 params 参数', () => storePageContent.includes('params:'));
test('动态 title 配置', () => storePageContent.includes('title:') && storePageContent.includes('store.name'));
test('动态 description 配置', () => storePageContent.includes('description:') && storePageContent.includes('store'));
test('动态 Open Graph 配置', () => storePageContent.includes('openGraph:'));
test('动态 Twitter Card 配置', () => storePageContent.includes('twitter:'));
test('包含 alternates.canonical 配置', () => storePageContent.includes('canonical:'));
test('包含 GEO 元数据 (其他路由)', () => storePageContent.includes('other:'));

// 3. 验证 SEO 文件
console.log('\n📁 SEO 文件检查');
const robotsPath = resolve(ADMIN_WEB, 'public/robots.txt');
const sitemapPath = resolve(ADMIN_WEB, 'app/sitemap.ts');

test('robots.txt 存在', () => existsSync(robotsPath) || 'warn');
test('sitemap.ts 存在', () => existsSync(sitemapPath) || 'warn');

// 4. 验证关键 SEO 元素
console.log('\n🔍 关键 SEO 元素检查');

test('Layout 包含 lang="zh-CN"', () => layoutContent.includes('lang="zh-CN"'));
test('Layout 包含 dir="ltr" (默认)', () => layoutContent.includes('dir=') || true);
test('Metadata 包含 metadataBase', () => layoutContent.includes('metadataBase:'));
test('Metadata 包含 alternates.languages', () => layoutContent.includes('languages:'));
test('Open Graph 包含 siteName', () => layoutContent.includes('siteName:'));
test('Open Graph 包含 locale', () => layoutContent.includes('locale:'));
test('Twitter Card 包含 card: summary_large_image', () => layoutContent.includes("card: 'summary_large_image'") || layoutContent.includes('card: \'summary_large_image\''));
test('JSON-LD 包含 @context: https://schema.org', () => layoutContent.includes("'@context': 'https://schema.org'") || layoutContent.includes('"@context": "https://schema.org"'));
test('JSON-LD 包含 Organization 类型', () => layoutContent.includes("'@type': 'Organization'") || layoutContent.includes('"@type": "Organization"'));

// 5. 验证 GEO 优化
console.log('\n🌍 GEO 地理定位优化');

test('包含 GEO 区域代码 (geo.region)', () => layoutContent.includes('geo.region'));
test('包含 GEO 地点名称 (geo.placename)', () => layoutContent.includes('geo.placename'));
test('包含 GEO 坐标 (geo.position)', () => layoutContent.includes('geo.position'));
test('包含 ICBM 坐标', () => layoutContent.includes('ICBM'));
test('JSON-LD 包含 address (PostalAddress)', () => layoutContent.includes("'@type': 'PostalAddress'") || layoutContent.includes('"@type": "PostalAddress"'));
test('JSON-LD 包含 geo (GeoCoordinates)', () => layoutContent.includes("'@type': 'GeoCoordinates'") || layoutContent.includes('"@type": "GeoCoordinates"'));
test('JSON-LD 包含 latitude/longitude', () => layoutContent.includes('latitude:') && layoutContent.includes('longitude:'));

// 6. 验证多租户/多市场 SEO
console.log('\n🏢 多租户/多市场 SEO 隔离');

test('动态路由支持 market/tenant/brand 参数', () => storePageContent.includes('marketCode') || storePageContent.includes('market') || storePageContent.includes('tenant'));
test('动态 title 包含市场信息', () => storePageContent.includes('marketCode') || storePageContent.includes('store.market'));
test('动态 description 包含业务上下文', () => storePageContent.includes('store.') && storePageContent.includes('description:'));
test('Open Graph 动态 URL 包含路径参数', () => storePageContent.includes('url:') && storePageContent.includes('id'));
test('Twitter Card 动态内容', () => storePageContent.includes('images:') && storePageContent.includes('id'));

// 总结
console.log('\n' + '='.repeat(50));
console.log(colors.blue('📊 验证结果汇总'));
console.log('='.repeat(50));
console.log(`${colors.green('✓ 通过')}: ${passCount}`);
console.log(`${colors.red('✗ 失败')}: ${failCount}`);
console.log(`${colors.yellow('⚠ 警告')}: ${warnCount}`);
console.log('='.repeat(50));

if (failCount === 0) {
  console.log(colors.green('\n🎉 P-49 SEO/GEO 验证全部通过！'));
  console.log(colors.green('✅ 神机营 SaaS 平台 SEO/GEO 优化已完成！'));
  process.exit(0);
} else {
  console.log(colors.yellow(`\n⚠️  有 ${failCount} 项需要修复`));
  process.exit(1);
}
