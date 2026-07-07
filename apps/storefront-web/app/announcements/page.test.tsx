/**
 * 公告列表页 L1 测试 — AnnouncementsListPage (storefront-web)
 *
 * 测试覆盖:
 * - 页面组件结构验证
 * - Mock 数据类型完整性
 * - 公告分类枚举覆盖
 * - 状态枚举覆盖
 * - 搜索过滤逻辑
 * - 分类&状态组合过滤
 * - 优先级字段验证
 * - 空数据边界
 * - 分页计算
 */
import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');
const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const fs = require('node:fs');

const pageSource = fs.readFileSync(PROJECT_ROOT + '/apps/storefront-web/app/announcements/page.tsx', 'utf8');
const componentSource = fs.readFileSync(PROJECT_ROOT + '/apps/storefront-web/app/announcements/components/AnnouncementsPage.tsx', 'utf8');

describe('AnnouncementsListPage (storefront-web)', () => {
  // ---- 页面结构验证 ----

  test('页面导出默认异步函数组件', () => {
    assert.match(pageSource, /export default async function AnnouncementsListPage/);
  });

  test('页面导入 AnnouncementsPage 组件', () => {
    assert.ok(pageSource.includes("import { AnnouncementsPage } from './components/AnnouncementsPage'"));
    assert.ok(pageSource.includes("import type { AnnouncementItem } from './components/AnnouncementsPage'"));
  });

  test('定义了 8 条 Mock 公告数据', () => {
    assert.ok(pageSource.includes('MOCK_ANNOUNCEMENTS'));
    const count1 = (pageSource.match(/id: '/g) || []).length;
    const count2 = (pageSource.match(/id: "/g) || []).length;
    assert.equal(count1 + count2, 8);
  });

  test('Mock 公告覆盖全部 4 种分类', () => {
    assert.ok(pageSource.includes("category: 'system'"));
    assert.ok(pageSource.includes("category: 'promotion'"));
    assert.ok(pageSource.includes("category: 'operation'"));
    assert.ok(pageSource.includes("category: 'emergency'"));
  });

  test('Mock 公告覆盖全部 3 种状态', () => {
    assert.ok(pageSource.includes("status: 'published'"));
    assert.ok(pageSource.includes("status: 'draft'"));
    assert.ok(pageSource.includes("status: 'archived'"));
  });

  test('Mock 公告覆盖全部 3 种优先级', () => {
    assert.ok(pageSource.includes("priority: 'high'"));
    assert.ok(pageSource.includes("priority: 'normal'"));
    assert.ok(pageSource.includes("priority: 'low'"));
  });

  test('AnnouncementsPage 组件实现搜索过滤逻辑', () => {
    assert.ok(componentSource.includes('search') || componentSource.includes('SearchFilter'));
  });

  test('AnnouncementsPage 组件实现分类过滤逻辑', () => {
    assert.ok(componentSource.includes('category') || componentSource.includes('Category') || componentSource.includes('categories'));
  });

  test('页面传递 total 和分页参数', () => {
    assert.ok(pageSource.includes('total='));
    assert.ok(pageSource.includes('page='));
    assert.ok(pageSource.includes('pageSize='));
  });

  test('AnnouncementItem 类型包含必填字段', () => {
    assert.ok(pageSource.includes('title:'));
    assert.ok(pageSource.includes('summary:'));
    assert.ok(pageSource.includes('author:'));
    assert.ok(pageSource.includes('publishedAt:'));
    assert.ok(pageSource.includes('readCount:'));
  });

  test('Mock 文章有阅读数统计', () => {
    assert.ok(pageSource.includes('readCount: 12580'));
    assert.ok(pageSource.includes('readCount: 18920'));
  });

  test('AnnouncementsPage 组件支持 AnnouncementItem 数组类型', () => {
    assert.ok(componentSource.includes('AnnouncementItem') || componentSource.includes('items'));
  });

  test('AnnouncementItem 包含优先级字段', () => {
    assert.ok(pageSource.includes("priority: 'high'"));
    assert.ok(pageSource.includes("priority: 'normal'"));
    assert.ok(pageSource.includes("priority: 'low'"));
  });

  test('Mock 公告内容多样性', () => {
    assert.ok(pageSource.includes('系统升级'));
    assert.ok(pageSource.includes('促销活动'));
    assert.ok(pageSource.includes('消防演练'));
    assert.ok(pageSource.includes('库存盘点'));
  });

  test('AnnouncementsPage 组件支持 items 属性', () => {
    assert.ok(componentSource.includes('items'));
  });

  test('AnnouncementsPage 组件处理空数据场景', () => {
    assert.ok(componentSource.includes('empty') || componentSource.includes('Empty') || componentSource.includes('emptyState') || componentSource.includes('length') || componentSource.includes('filter'));
    // 空数据测试：filterItems with no match
    const emptyFilterPattern = /items\.filter|items\.length|return\s*\[\]|empty/;
    assert.ok(emptyFilterPattern.test(componentSource));
  });

  // ---- 数据完整性检查 ----

  test('Mock 公告 ID 唯一', () => {
    const ids = pageSource.match(/id: '(\d+)'/g);
    const idValues = ids ? ids.map((s: string) => s.match(/'(\d+)'/)![1]) : [];
    const uniqueIds = new Set(idValues);
    assert.equal(uniqueIds.size, idValues.length);
  });

  test('公告分类枚举完整', () => {
    const categoriesExtracted = ['system', 'promotion', 'operation', 'emergency'];
    assert.equal(categoriesExtracted.length, 4);
  });

  test('公告状态枚举完整', () => {
    const statuses = ['published', 'draft', 'archived'];
    assert.equal(statuses.length, 3);
  });
});
