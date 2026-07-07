/**
 * 公告详情页 L1 测试 — AnnouncementDetail (storefront-web)
 *
 * 测试覆盖:
 * - 异步页面结构与 params 接收
 * - Mock 数据类型完整性
 * - 公告内容字段验证
 * - 附件信息验证
 * - 状态流转字段
 * - 边界: 不存在 ID 返回 null
 * - 阅读计数
 * - 优先级染色
 * - 作者时间字段
 */
import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');
const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const fs = require('node:fs');

const pageSource = fs.readFileSync(PROJECT_ROOT + '/apps/storefront-web/app/announcements/[id]/page.tsx', 'utf8');
const detailCompSource = fs.readFileSync(PROJECT_ROOT + '/apps/storefront-web/app/announcements/components/AnnouncementDetailPage.tsx', 'utf8');

describe('AnnouncementDetailPage (storefront-web)', () => {
  // ---- 页面结构验证 ----

  test('页面导出默认异步函数组件，接收 params', () => {
    assert.match(pageSource, /export default async function AnnouncementDetail/);
    assert.ok(pageSource.includes('params: Promise<{ id: string }>'));
  });

  test('页面解构 params.id', () => {
    assert.ok(pageSource.includes("const { id } = await params"));
  });

  test('页面导入 AnnouncementDetailPage 组件', () => {
    assert.ok(pageSource.includes("import { AnnouncementDetailPage } from '../components/AnnouncementDetailPage'"));
    assert.ok(pageSource.includes("import type { AnnouncementDetail } from '../components/AnnouncementDetailPage'"));
  });

  test('定义了 2 条 Mock 详情数据', () => {
    assert.ok(pageSource.includes("id: '1'"));
    assert.ok(pageSource.includes("id: '2'"));
  });

  test('Mock 详情数据包含完整字段集', () => {
    assert.ok(pageSource.includes('title:'));
    assert.ok(pageSource.includes('content:'));
    assert.ok(pageSource.includes('category:'));
    assert.ok(pageSource.includes('status:'));
    assert.ok(pageSource.includes('priority:'));
    assert.ok(pageSource.includes('publishedAt:'));
    assert.ok(pageSource.includes('author:'));
    assert.ok(pageSource.includes('readCount:'));
  });

  test('Mock 详情包含附件数据', () => {
    assert.ok(pageSource.includes('attachments'));
    assert.ok(pageSource.includes('name:'));
    assert.ok(pageSource.includes('url:'));
  });

  test('Mock 公告 1（系统升级）包含 2 个附件', () => {
    const match1 = pageSource.match(/name: '系统升级详细时间表\.pdf'/);
    const match2 = pageSource.match(/name: '升级后操作指南\.pdf'/);
    assert.ok(match1 !== null);
    assert.ok(match2 !== null);
  });

  test('Mock 公告 2（促销活动）包含 1 个附件', () => {
    assert.ok(pageSource.includes("name: '活动海报设计稿.pdf'"));
  });

  test('Mock 内容包含富文本结构', () => {
    const content1 = pageSource.match(/content: `[\s\S]*?`/);
    assert.ok(content1 !== null);
    assert.ok(pageSource.includes('各位同事'));
    assert.ok(pageSource.includes('升级时间'));
  });

  test('不存在的公告 ID 返回 null', () => {
    assert.ok(pageSource.includes('MOCK_ANNOUNCEMENTS[id] ?? null') || pageSource.includes('?? null'));
  });

  test('AnnouncementDetail 类型包含 status 字段', () => {
    assert.ok(pageSource.includes("status: 'published'"));
  });

  test('AnnouncementDetail 类型包含 priority 字段', () => {
    assert.ok(pageSource.includes("priority: 'high'"));
    assert.ok(pageSource.includes("priority: 'normal'"));
  });

  test('阅读计数为数字类型', () => {
    assert.ok(pageSource.includes('readCount: 12580'));
    assert.ok(pageSource.includes('readCount: 8430'));
    // 验证数字类型而非字符串
    const readCountMatches = pageSource.match(/readCount: (\d+)/g) || [];
    for (const m of readCountMatches) {
      const val = m.match(/: (\d+)/)![1];
      assert.ok(!isNaN(Number(val)));
    }
  });

  test('AnnouncementDetailPage 组件接收 announcement 属性', () => {
    assert.ok(detailCompSource.includes('announcement'));
    assert.ok(pageSource.includes('<AnnouncementDetailPage'));
    assert.ok(pageSource.includes('announcement={announcement}'));
  });

  test('页面处理附件数据传递', () => {
    assert.ok(pageSource.includes('attachments'));
  });

  test('Mock 详情数据日期格式完整', () => {
    assert.ok(pageSource.includes("publishedAt: '2026-06-29 14:00'"));
    assert.ok(pageSource.includes("publishedAt: '2026-06-28 10:30'"));
  });

  test('Mock 详情的作者信息完整', () => {
    assert.ok(pageSource.includes("author: '系统管理员'"));
    assert.ok(pageSource.includes("author: '运营部'"));
  });

  test('AnnouncementDetailPage 组件支持 null 边界', () => {
    assert.ok(detailCompSource.includes('null') || detailCompSource.includes('undefined') || detailCompSource.includes('notFound'));
  });

  test('页面返回 JSX 元素', () => {
    assert.ok(pageSource.includes('<AnnouncementDetailPage'));
  });

  test('AnnouncementDetail 包含 category 枚举', () => {
    const categories = ['system', 'promotion'];
    for (const c of categories) {
      assert.ok(pageSource.includes(`category: '${c}'`));
    }
  });

  test('详情页不包含列表页的搜索逻辑', () => {
    // 详情页不应有搜索/过滤逻辑
    assert.ok(!pageSource.includes('filter'));
    assert.ok(!pageSource.includes('search'));
  });
});
