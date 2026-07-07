/**
 * store-locator/page.test.ts — 门店定位页面 L1 冒烟测试
 * 覆盖: 正例·边界·防御
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

// ---- 正例 ----

describe('store-locator — 正例', () => {
  it('应导出一个默认组件 StoreLocatorPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function StoreLocatorPage'), '缺少默认导出组件');
  });

  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'") || src.includes('"use client"'), '缺少 use client');
  });

  it('应包含 storeLocatorService 调用', () => {
    const src = readSource();
    assert.ok(src.includes('storeLocatorService'), '缺少 storeLocatorService');
  });

  it('应包含 cities / keyword / selectedCity 筛选状态', () => {
    const src = readSource();
    assert.ok(src.includes('cities'), '缺少 cities');
    assert.ok(src.includes('keyword'), '缺少 keyword');
    assert.ok(src.includes('selectedCity'), '缺少 selectedCity');
  });

  it('应包含 filteredStores 根据关键词过滤', () => {
    const src = readSource();
    assert.ok(src.includes('filteredStores'), '缺少 filteredStores');
    assert.ok(src.includes('filterStoreByKeyword'), '缺少 filterStoreByKeyword');
  });
});

// ---- 边界 ----

describe('store-locator — 边界', () => {
  it('全部城市按钮 selectedCity 为空字符串时激活', () => {
    const src = readSource();
    assert.ok(src.includes("setSelectedCity('')"), '缺少全部城市重置');
  });

  it('无门店时显示 "暂无门店数据"', () => {
    const src = readSource();
    assert.ok(src.includes('暂无门店数据'), '缺少空数据提示');
  });

  it('加载中显示 "加载中..."', () => {
    const src = readSource();
    assert.ok(src.includes('加载中'), '缺少加载状态');
  });

  it('门店卡片包含 storeName / address / businessHours', () => {
    const src = readSource();
    assert.ok(src.includes('storeName'), '缺少 storeName');
    assert.ok(src.includes('address'), '缺少 address');
    assert.ok(src.includes('businessHours'), '缺少 businessHours');
  });

  it('门店卡片包含 电话 和 导航 操作按钮', () => {
    const src = readSource();
    assert.ok(src.includes('tel:'), '缺少电话');
    assert.ok(src.includes('maps.apple.com') || src.includes('encodeURIComponent'), '缺少地图导航');
  });
});

// ---- 防御 ----

describe('store-locator — 防御', () => {
  it('应包含底部导航 (首页/门店/卡券/我的)', () => {
    const src = readSource();
    assert.ok(src.includes('首页'), '缺少首页');
    assert.ok(src.includes('门店'), '缺少门店');
    assert.ok(src.includes('卡券'), '缺少卡券');
    assert.ok(src.includes('我的'), '缺少我的');
  });

  it('门店卡片应以 Link 包裹可点击', () => {
    const src = readSource();
    assert.ok(src.includes('href={`/store-locator/'), '缺少门店详情路由');
  });

  it('应包含 STATUS_INFO 状态信息', () => {
    const src = readSource();
    assert.ok(src.includes('STATUS_INFO'), '缺少 STATUS_INFO');
  });

  it('城市筛选按钮使用 getCityButtonStyle 样式函数', () => {
    const src = readSource();
    assert.ok(src.includes('getCityButtonStyle'), '缺少 getCityButtonStyle');
  });

  it('门店卡片使用 getStoreCardStyle 获取样式', () => {
    const src = readSource();
    assert.ok(src.includes('getStoreCardStyle'), '缺少 getStoreCardStyle');
  });
});
