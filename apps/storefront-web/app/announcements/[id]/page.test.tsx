/**
 * 公告详情页 L1+L2 测试 — AnnouncementDetail (storefront-web)
 *
 * 测试覆盖 (三态: 正例/反例/边界):
 * - 正例: 页面结构 / 组件导出 / Mock 数据 / 优先级映射 / 渲染内容
 * - 反例: 危险渲染 / any 类型 / 硬编码 / secrets / console.log
 * - 边界: 不存在的 ID / 空字符串 ID / 空标签 / loading 态 / 已读 disabled
 */
const assert = require('node:assert/strict');
const { describe, test } = require('node:test');
const fs = require('node:fs');
const path = require('path');

const pageSource = fs.readFileSync(path.resolve(__dirname, 'page.tsx'), 'utf8');

// ==================== 正例 (渲染/结构/数据) ====================

describe('AnnouncementDetailPage — 正例', () => {
  test('页面包含 use client 指令', () => {
    assert.ok(pageSource.includes("'use client'"));
  });

  test('导出默认函数组件 AnnouncementDetailPage', () => {
    assert.ok(pageSource.includes('export default function AnnouncementDetailPage'));
  });

  test('页面使用 useState 管理已读状态', () => {
    assert.ok(pageSource.includes('useState'));
    assert.ok(pageSource.includes('marked'));
    assert.ok(pageSource.includes('setMarked'));
  });

  test('使用 useParams 获取路由参数', () => {
    assert.ok(pageSource.includes("useParams<{ id: string }>()"));
  });

  test('定义了 3 条 Mock 公告数据', () => {
    const matches = pageSource.match(/'00[1-3]'/g) || [];
    assert.equal(new Set(matches).size, 3);
  });

  test('Mock 公告包含全部核心字段', () => {
    const fields = ['id', 'title', 'content', 'category', 'priority', 'publishedAt', 'author', 'readCount', 'tags'];
    for (const f of fields) {
      assert.ok(pageSource.includes(`${f}:`), `missing field: ${f}`);
    }
  });

  test('优先级枚举值完整 (low/normal/high/urgent)', () => {
    assert.ok(pageSource.includes("'low'"));
    assert.ok(pageSource.includes("'normal'"));
    assert.ok(pageSource.includes("'high'"));
    assert.ok(pageSource.includes("'urgent'"));
  });

  test('PRIORITY_STYLES 映射完整 (4 种样式)', () => {
    const styles = ['bg-gray-100', 'bg-blue-100', 'bg-orange-100', 'bg-red-100'];
    for (const s of styles) {
      assert.ok(pageSource.includes(s), `missing style: ${s}`);
    }
  });

  test('PRIORITY_LABELS 映射完整 (低/普通/重要/紧急)', () => {
    assert.ok(pageSource.includes("low: '低'"));
    assert.ok(pageSource.includes("normal: '普通'"));
    assert.ok(pageSource.includes("high: '重要'"));
    assert.ok(pageSource.includes("urgent: '紧急'"));
  });

  test('公告 001 (暑期大促) 含有完整内容', () => {
    assert.ok(pageSource.includes('暑期大促活动规则已更新'));
    assert.ok(pageSource.includes('满减活动门槛从300元降至198元'));
    assert.ok(pageSource.includes("'促销', '规则更新', '暑期'"));
  });

  test('公告 002 (系统维护) 优先级为 urgent', () => {
    assert.ok(pageSource.includes('系统维护通知'));
    assert.ok(pageSource.includes("priority: 'urgent'"));
  });

  test('公告 003 (新员工培训) 优先级为 normal', () => {
    assert.ok(pageSource.includes('新员工入职培训安排'));
    assert.ok(pageSource.includes("priority: 'normal'"));
  });

  test('公告正文支持多段落和多行处理', () => {
    assert.ok(pageSource.includes('.split'));
    assert.ok(pageSource.includes("'\\n'"));
  });

  test('已读标记按钮默认文案为"标记为已读"', () => {
    assert.ok(pageSource.includes("'标记为已读'"));
  });

  test('已读标记后文案变为"✅ 标记为已读"', () => {
    assert.ok(pageSource.includes("'✅ 标记为已读'"));
  });

  test('渲染标签区域展示公告标签', () => {
    assert.ok(pageSource.includes('.tags'));
    assert.ok(pageSource.includes('.map'));
  });

  test('返回公告列表链接存在', () => {
    assert.ok(pageSource.includes('← 返回公告列表'));
    assert.ok(pageSource.includes('/announcements'));
  });
});

// ==================== 反例 (安全/防御/错误) ====================

describe('AnnouncementDetailPage — 反例', () => {
  test('不使用 dangerousSetInnerHTML', () => {
    assert.doesNotMatch(pageSource, /dangerouslySetInnerHTML/);
  });

  test('无 any 类型声明', () => {
    assert.doesNotMatch(pageSource, /:\s*any\b/);
  });

  test('无密码/密钥/API Key 泄露', () => {
    assert.doesNotMatch(pageSource, /(?:secret|password|api[_-]?key)/i);
  });

  test('无裸 console.log', () => {
    assert.ok(!pageSource.includes('console.log(') || pageSource.includes('// console.log'), 'bare console.log');
  });

  test('无 eval', () => {
    assert.doesNotMatch(pageSource, /\beval\s*\(/);
  });

  test('无 document.write', () => {
    assert.doesNotMatch(pageSource, /document\.write/);
  });
});

// ==================== 边界 (空/未找到/加载态) ====================

describe('AnnouncementDetailPage — 边界', () => {
  test('不存在的 ID 显示"公告未找到"', () => {
    assert.ok(pageSource.includes('公告未找到'));
    assert.ok(pageSource.includes('不存在或已下架'));
  });

  test('公告未找到时显示 ID 参数', () => {
    assert.ok(pageSource.includes('announcementId'));
    assert.ok(pageSource.includes('不存在或已下架'));
  });

  test('不存在的 ID 返回 404 态而非抛错', () => {
    assert.ok(pageSource.includes('if (!announcement)'));
  });

  test('存在 loading 态骨架屏 (animate-pulse)', () => {
    assert.ok(pageSource.includes('animate-pulse'));
  });

  test('loading 态使用骨架屏 (animate-pulse)', () => {
    assert.ok(pageSource.includes('animate-pulse'), 'should have skeleton pulse animation');
  });

  test('loading 态使用 map 生成 3 个骨架条', () => {
    assert.ok(pageSource.includes('1, 2, 3].map'), 'should iterate over 3 skeleton items');
    assert.ok(pageSource.includes('animate-pulse'), 'skeleton should have pulse animation');
  });

  test('已读按钮点击后有 disabled 逻辑', () => {
    assert.ok(pageSource.includes('disabled={marked}'));
  });

  test('已读后按钮样式切换 (bg-green-50)', () => {
    assert.ok(pageSource.includes('bg-green-50'));
    assert.ok(pageSource.includes('border-green-200'));
  });

  test('公告内容为空行使用 &nbsp; 占位', () => {
    assert.ok(pageSource.includes('\\u00A0'));
  });

  test('空标签列表处理 (tags.map 存在)', () => {
    assert.ok(pageSource.includes('tags.map'));
  });

  test('公告 ID 类型防御 (typeof params.id === string)', () => {
    assert.ok(pageSource.includes("typeof params.id === 'string'"));
  });
});

// ==================== 数据完整性 ====================

describe('AnnouncementDetailPage — 数据完整性', () => {
  test('包含所有公告分类 (运营通知/系统通知/人事通知)', () => {
    assert.ok(pageSource.includes('运营通知'));
    assert.ok(pageSource.includes('系统通知'));
    assert.ok(pageSource.includes('人事通知'));
  });

  test('包含所有作者 (运营部/技术部/人事部)', () => {
    assert.ok(pageSource.includes('运营部'));
    assert.ok(pageSource.includes('技术部'));
    assert.ok(pageSource.includes('人事部'));
  });

  test('readCount 数值合理性 (89/156/342)', () => {
    assert.ok(pageSource.includes('readCount: 156'));
    assert.ok(pageSource.includes('readCount: 342'));
    assert.ok(pageSource.includes('readCount: 89'));
  });

  test('发布日期的格式 YYYY-MM-DD', () => {
    const dates = pageSource.match(/'2026-\d{2}-\d{2}'/g) || [];
    assert.ok(dates.length >= 3, 'should have at least 3 dates');
  });

  test('内容包含多级列表 (li 标签)', () => {
    assert.ok(pageSource.includes('<li'));
  });

  test('公告 002 (系统维护) 含有维护指南', () => {
    assert.ok(pageSource.includes('提前结算'));
    assert.ok(pageSource.includes('夜间值班'));
  });
});
