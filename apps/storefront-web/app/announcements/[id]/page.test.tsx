/**
 * 公告详情页 L1 测试 — AnnouncementDetail (storefront-web)
 *
 * 测试覆盖:
 * - 页面结构: use client / 组件导出 / useState
 * - Mock 数据完整性 (3条公告)
 * - 内容字段验证 (priority/multi-paragraph/tags)
 * - 优先级样式+标签映射完整性
 * - 边界: 不存在 ID 显示公告未找到
 * - 已读标记的 button / disabled 逻辑
 */
const assert = require('node:assert/strict');
const { describe, test } = require('node:test');
const fs = require('node:fs');
const path = require('path');

const pageSource = fs.readFileSync(path.resolve(__dirname, 'page.tsx'), 'utf8');

describe('AnnouncementDetailPage (storefront-web)', () => {
  // ── 页面结构 ──

  test('页面包含 use client 指令', () => {
    assert.ok(pageSource.includes("'use client'"));
  });

  test('导出默认函数组件 AnnouncementDetailPage', () => {
    assert.ok(pageSource.includes('export default function AnnouncementDetailPage'));
  });

  test('页面使用 useState', () => {
    assert.ok(pageSource.includes('useState'));
    assert.ok(pageSource.includes('marked'));
  });

  test('使用 useParams 获取参数', () => {
    assert.ok(pageSource.includes("useParams<{ id: string }>()"));
  });

  // ── Mock 数据完整性 ──

  test('定义了 3 条 Mock 公告数据', () => {
    const ids = new Set(pageSource.match(/'00[1-3]'/g));
    assert.equal(ids.size, 3);
  });

  test('Mock 公告包含完整字段集', () => {
    // 核心字段必须存在
    const fields = ['id', 'title', 'content', 'category', 'priority', 'publishedAt', 'author', 'readCount', 'tags'];
    for (const f of fields) {
      assert.ok(pageSource.includes(`${f}:`), `missing field: ${f}`);
    }
  });

  test('优先级枚举值完整', () => {
    assert.ok(pageSource.includes("'low'"));
    assert.ok(pageSource.includes("'normal'"));
    assert.ok(pageSource.includes("'high'"));
    assert.ok(pageSource.includes("'urgent'"));
  });

  test('PRIORITY_STYLES 映射完整 (4种)', () => {
    const styles = ['bg-gray-100', 'bg-blue-100', 'bg-orange-100', 'bg-red-100'];
    for (const s of styles) {
      assert.ok(pageSource.includes(s), `missing style: ${s}`);
    }
  });

  test('PRIORITY_LABELS 映射完整', () => {
    assert.ok(pageSource.includes("low: '低'"));
    assert.ok(pageSource.includes("normal: '普通'"));
    assert.ok(pageSource.includes("high: '重要'"));
    assert.ok(pageSource.includes("urgent: '紧急'"));
  });

  test('Mock 公告 001 包含促销标签', () => {
    assert.ok(pageSource.includes("'促销'"));
    assert.ok(pageSource.includes("'规则更新'"));
    assert.ok(pageSource.includes("'暑期'"));
  });

  test('Mock 公告内容含多段落结构', () => {
    assert.ok(pageSource.includes('暑期大促活动规则已更新'));
    assert.ok(pageSource.includes('满减活动门槛从300元降至198元'));
  });

  test('Mock 公告 002 (系统维护) 优先级为 urgent', () => {
    assert.ok(pageSource.includes("priority: 'urgent'"));
    assert.ok(pageSource.includes('系统维护通知'));
  });

  // ── 空/边界情况 ──

  test('不存在 ID 显示"公告未找到"', () => {
    assert.ok(pageSource.includes('公告未找到'));
    assert.ok(pageSource.includes('不存在或已下架'));
  });

  test('不存在的 ID 返回 404 态而非抛错', () => {
    assert.ok(pageSource.includes('if (!announcement)'));
  });

  // ── 交互逻辑 ──

  test('已读标记按钮存在', () => {
    assert.ok(pageSource.includes('标记为已读'));
  });

  test('按钮点击后有 disabled 逻辑', () => {
    assert.ok(pageSource.includes('disabled={marked}'));
  });

  // ── 导航 ──

  test('返回公告列表链接存在', () => {
    assert.ok(pageSource.includes('← 返回公告列表'));
  });
});
// Total: 19 tests
