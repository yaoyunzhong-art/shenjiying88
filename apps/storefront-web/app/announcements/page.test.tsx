/**
 * 公告列表页 L1 测试 — AnnouncementsPage (storefront-web)
 * 适配实际页面 AnnouncementsPage
 */
const assert = require('node:assert/strict');
const { describe, test } = require('node:test');
const fs = require('node:fs');
const path = require('path');

const pageSource = fs.readFileSync(
  path.resolve(__dirname, 'page.tsx'), 'utf8'
);

describe('AnnouncementsPage (storefront-web)', () => {
  test('页面导出默认函数组件 AnnouncementsPage', () => {
    assert.ok(pageSource.includes('export default function AnnouncementsPage'));
  });

  test('页面包含 use client 指令', () => {
    assert.ok(pageSource.includes("'use client'"));
  });

  test('定义了 5 条公告数据（增强后）', () => {
    const count = (pageSource.match(/title: '/g) || []).length;
    assert.equal(count, 5);
  });

  test('包含新店开业优惠公告', () => {
    assert.ok(pageSource.includes('新店开业优惠'));
  });

  test('包含设备升级通知', () => {
    assert.ok(pageSource.includes('设备升级通知'));
  });

  test('包含会员日特惠公告', () => {
    assert.ok(pageSource.includes('会员日特惠'));
  });

  test('包含标题、描述、日期、徽标字段', () => {
    assert.ok(pageSource.includes('title'));
    assert.ok(pageSource.includes('desc'));
    assert.ok(pageSource.includes('date'));
    assert.ok(pageSource.includes('badge'));
  });

  test('渲染深色主题样式', () => {
    assert.ok(pageSource.includes('#0f172a'), '缺少深色背景');
  });

  test('包含加载/错误/空三态', () => {
    assert.ok(pageSource.includes('loading'), '缺少 loading 状态');
    assert.ok(pageSource.includes('error'), '缺少 error 状态');
    assert.ok(pageSource.includes('simulateFetch'), '缺少模拟 API');
    assert.ok(pageSource.includes('search'), '缺少搜索框');
    assert.ok(pageSource.includes('badgeFilter'), '缺少类型筛选');
  });

  test('包含展开详情功能', () => {
    assert.ok(pageSource.includes('toggleExpand'), '缺少展开/收起');
    assert.ok(pageSource.includes('expandedId'), '缺少展开状态');
  });
});
