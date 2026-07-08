/**
 * announcements/page.test.ts — 公告管理列表页 L1 冒烟测试
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

describe('announcements 列表页 — 正例', () => {
  it('1. 导出一个默认组件 AnnouncementsPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function AnnouncementsPage'), '缺少默认导出');
  });

  it('2. 包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('3. 调用 announcementService.listAnnouncements', () => {
    const src = readSource();
    assert.ok(src.includes('announcementService'), '缺少 announcementService');
    assert.ok(src.includes('listAnnouncements'), '缺少 listAnnouncements');
  });

  it('4. 包含 keyword / page / pageSize 状态', () => {
    const src = readSource();
    assert.ok(src.includes('keyword'), '缺少 keyword');
    assert.ok(src.includes('page'), '缺少 page');
    assert.ok(src.includes('pageSize'), '缺少 pageSize');
  });

  it('5. 包含分类筛选和状态筛选', () => {
    const src = readSource();
    assert.ok(src.includes('categoryFilter'), '缺少 categoryFilter');
    assert.ok(src.includes('statusFilter'), '缺少 statusFilter');
  });
});

// ---- 边界 ----

describe('announcements 列表页 — 边界', () => {
  it('6. 无数据时显示 "暂无公告数据"', () => {
    const src = readSource();
    assert.ok(src.includes('暂无公告数据'), '缺少空数据提示');
  });

  it('7. 加载中显示 "加载中..."', () => {
    const src = readSource();
    assert.ok(src.includes('加载中'), '缺少加载状态');
  });

  it('8. 分页按钮包含页码和总数', () => {
    const src = readSource();
    assert.ok(src.includes('上一页'), '缺少上一页');
    assert.ok(src.includes('下一页'), '缺少下一页');
    assert.ok(src.includes('totalPages'), '缺少 totalPages 函数');
  });

  it('9. 五种分类标签定义', () => {
    const src = readSource();
    assert.ok(src.includes('system'), '缺少 system');
    assert.ok(src.includes('promotion'), '缺少 promotion');
    assert.ok(src.includes('operation'), '缺少 operation');
    assert.ok(src.includes('emergency'), '缺少 emergency');
    assert.ok(src.includes('training'), '缺少 training');
  });

  it('10. 每页 pageSize = 10', () => {
    const src = readSource();
    assert.ok(src.includes('const pageSize = 10'), '缺少 pageSize 定义');
  });
});

// ---- 防御 ----

describe('announcements 列表页 — 防御', () => {
  it('11. 未登录跳转 /enterprise/login', () => {
    const src = readSource();
    assert.ok(src.includes('enterprise_access_token'), '缺少 token 检查');
    assert.ok(src.includes('router.push'), '缺少 router.push');
  });

  it('12. 包含 + 发布公告 按钮', () => {
    const src = readSource();
    assert.ok(src.includes('发布公告'), '缺少发布公告');
  });

  it('13. 每行包含 /announcements/ 详情链接', () => {
    const src = readSource();
    assert.ok(src.includes('/announcements/'), '缺少详情路由');
  });

  it('14. 搜索表单使用 handleSearch', () => {
    const src = readSource();
    assert.ok(src.includes('handleSearch'), '缺少 handleSearch');
    assert.ok(src.includes('e.preventDefault'), '缺少 preventDefault');
  });

  it('15. 分页保护页码最小值', () => {
    const src = readSource();
    assert.ok(src.includes('Math.max'), '缺少 Math.max 边界');
  });
});
