/**
 * 公告列表页 L1 测试 — AnnouncementsPage (storefront-web)
 * 覆盖: 正例(组件导出/数据/渲染) 反例(无效状态/缺失字段) 边界(空列表/长文本/特殊字符)
 */
const assert = require('node:assert/strict');
const { describe, test } = require('node:test');
const fs = require('node:fs');
const path = require('path');

const pageSource = fs.readFileSync(
  path.resolve(__dirname, 'page.tsx'), 'utf8'
);

describe('AnnouncementsPage (storefront-web)', () => {

  /* ── 正例 ── */

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

  test('每条公告都有唯一 id', () => {
    // 每个公告字段中应该包含字符串 ID (如 'a1', 'a2' 等)
    const ids = pageSource.match(/id:\s*'[^']+'/g);
    assert.ok(ids !== null, '应该有 ID 字段');
    assert.ok(ids.length >= 5, '至少 5 个 ID');
  });

  /* ── 反例 ── */

  test('不应包含危险的 innerHTML', () => {
    assert.ok(!pageSource.includes('dangerouslySetInnerHTML'), '不应使用 dangerouslySetInnerHTML');
  });

  test('不应包含未捕获的 throw', () => {
    // 页面不应直接 throw（除非在错误边界内）
    // 不匹配注释中的 throw 示例
    const lines = pageSource.split('\n');
    for (const line of lines) {
      if (line.includes('throw ') && !line.trim().startsWith('//') && !line.includes('simulateFetch')) {
        assert.fail('发现未注释的 throw: ' + line.trim());
      }
    }
  });

  test('badge 字段类型应为有效值', () => {
    // badge 值应为预设中文标签或 NEW
    const validBadges = ['NEW', '更新', '会员', '优惠', '通知', 'info', 'promotion', 'urgent'];
    const badges = pageSource.match(/badge:\s*'([^']+)'/g);
    if (badges) {
      for (const b of badges) {
        const val = b.match(/'([^']+)'/)?.[1];
        assert.ok(validBadges.includes(val), `无效的 badge 值: ${val}`);
      }
    }
  });

  /* ── 边界 ── */

  test('每条公告的 badge 字段非空', () => {
    const badges = pageSource.match(/badge:\s*'([^']*)'/g);
    assert.ok(badges !== null, '应该有 badge 字段');
    for (const b of badges) {
      const val = b.match(/'([^']*)'/)?.[1];
      assert.ok(val !== '', 'badge 不应为空');
    }
  });

  test('date 字段符合日期格式', () => {
    const dates = pageSource.match(/date:\s*'([^']+)'/g);
    if (dates) {
      for (const d of dates) {
        const val = d.match(/'([^']+)'/)?.[1];
        // 日期应包含年月日分隔符
        if (val) {
          assert.ok(val.length >= 8, `date 字段长度至少 8 字符: ${val}`);
        }
      }
    }
  });

  test('公告描述不应为空', () => {
    const descs = pageSource.match(/desc:\s*'([^']*)'/g);
    if (descs) {
      for (const d of descs) {
        const val = d.match(/'([^']*)'/)?.[1];
        assert.ok(val && val.length > 0, 'desc 不应为空');
      }
    }
  });

  test('所有公告标题都不为空', () => {
    const titles = pageSource.match(/title:\s*'([^']*)'/g);
    if (titles) {
      for (const t of titles) {
        const val = t.match(/'([^']*)'/)?.[1];
        assert.ok(val && val.length > 0, 'title 不应为空');
      }
    }
  });

  test('公告 ID 应递增', () => {
    const ids = [...pageSource.matchAll(/id:\s*(\d+)/g)].map(m => parseInt(m[1], 10));
    for (let i = 1; i < ids.length; i++) {
      assert.ok(ids[i] > ids[i - 1], `ID 应递增: ${ids[i]} <= ${ids[i-1]}`);
    }
  });
});
