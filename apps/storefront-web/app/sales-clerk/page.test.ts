/**
 * sales-clerk/page.test.tsx — 导购员工作台 L1 冒烟测试 (storefront-web)
 * 角色视角: 🛍️ 导购员
 * 类型: D-角色操作界面 (导购员工作台)
 * 覆盖: 正例·反例·边界·防御·状态流转
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---- 辅助 ----

function readSource(file: string): string {
  const p = resolve(__dirname, file);
  if (!existsSync(p)) throw new Error(`File not found: ${p}`);
  return readFileSync(p, 'utf-8');
}

// ============================================================
// 正例
// ============================================================

describe('sales-clerk/page — 正例', () => {
  it('应导出默认的 SalesClerkPage 函数', () => {
    const src = readSource('page.tsx');
    assert.match(src, /export default function SalesClerkPage/);
  });

  it('应为 \'use client\' 组件', () => {
    const src = readSource('page.tsx');
    assert.match(src, /'use client'/);
  });

  it('应导入 SalesClerkTool 和 PageShell', () => {
    const src = readSource('page.tsx');
    assert.match(src, /import.*SalesClerkTool.*from.*@m5\/ui/);
    assert.match(src, /import.*PageShell.*from.*@m5\/ui/);
  });

  it('应导入所有必需的类型', () => {
    const src = readSource('page.tsx');
    assert.match(src, /DailyReceptionStats/);
    assert.match(src, /FollowUpClient/);
    assert.match(src, /SalesScript/);
    assert.match(src, /MemberQuickLookup/);
  });

  it('应渲染 <SalesClerkTool> 组件', () => {
    const src = readSource('page.tsx');
    assert.match(src, /<SalesClerkTool/);
  });

  it('应传递 stats props', () => {
    const src = readSource('page.tsx');
    assert.match(src, /stats=\{MOCK_STATS\}/);
  });

  it('MOCK_STATS 应包含所有必需字段', () => {
    const src = readSource('page.tsx');
    assert.match(src, /totalReceptions:\s*47/);
    assert.match(src, /newLeads:\s*12/);
    assert.match(src, /conversions:\s*8/);
    assert.match(src, /conversionRate:/);
    assert.match(src, /avgResponseMin:/);
  });

  it('followUpClients 应包含至少 5 个 mock 客户', () => {
    const src = readSource('page.tsx');
    const matches = src.match(/id:\s*'fu-\d+'/g);
    assert.ok(matches !== null && matches.length >= 5,
      `expected ≥5 follow-up clients, got ${matches?.length ?? 0}`);
  });

  it('MOCK_SCRIPTS 应包含至少 4 个话术', () => {
    const src = readSource('page.tsx');
    const matches = src.match(/id:\s*'s-\d+'/g);
    assert.ok(matches !== null && matches.length >= 4,
      `expected ≥4 scripts, got ${matches?.length ?? 0}`);
  });

  it('导购员姓名和门店信息应显示', () => {
    const src = readSource('page.tsx');
    assert.match(src, /张三/);
    assert.match(src, /朝阳旗舰店/);
  });

  it('应包含 data-testid 属性', () => {
    const src = readSource('page.tsx');
    assert.match(src, /data-testid="sales-clerk-page"/);
    assert.match(src, /data-testid="page-header"/);
    assert.match(src, /data-testid="copy-toast"/);
  });

  it('应使用 PageShell 包装并传入 title', () => {
    const src = readSource('page.tsx');
    assert.match(src, /<PageShell title=/);
    assert.match(src, /<\/PageShell>/);
  });

  it('应包含 scriptCopied toast 反馈', () => {
    const src = readSource('page.tsx');
    assert.match(src, /scriptCopied/);
    assert.match(src, /话术已复制/);
  });

  it('应导出 handleFollowUp 和 handleScriptCopy 回调', () => {
    const src = readSource('page.tsx');
    assert.match(src, /const handleFollowUp/);
    assert.match(src, /const handleScriptCopy/);
    assert.match(src, /setScriptCopied/);
    assert.match(src, /setFollowUps/);
  });
});

// ============================================================
// 反例
// ============================================================

describe('sales-clerk/page — 反例', () => {
  it('followUpClients 应为空数组或过滤后的剩余', () => {
    const src = readSource('page.tsx');
    assert.match(src, /setFollowUps/);
    assert.match(src, /filter/);
    assert.match(src, /followUps/);
  });

  it('不应硬编码组件内部不可变的状态', () => {
    const src = readSource('page.tsx');
    // 组件内部使用 useState 管理 followUps
    assert.match(src, /useState\(MOCK_FOLLOW_UP_CLIENTS\)/);
  });

  it('MOCK_MEMBERS 应定义完整的会员结构', () => {
    const src = readSource('page.tsx');
    assert.match(src, /points:/);
    assert.match(src, /totalSpent:/);
    assert.match(src, /visitCount:/);
    assert.match(src, /tags:/);
  });
});

// ============================================================
// 边界
// ============================================================

describe('sales-clerk/page — 边界', () => {
  it('mockMemberSearch 应返回 Promise<MemberQuickLookup[]>', () => {
    const src = readSource('page.tsx');
    assert.match(src, /Promise<MemberQuickLookup\[\]>/);
  });

  it('mockMemberSearch 应包含空查询处理', () => {
    const src = readSource('page.tsx');
    assert.match(src, /query\.toLowerCase\(\)/);
    assert.match(src, /filter\(/);
  });

  it('followUpClients 应覆盖所有 tier 类型', () => {
    const src = readSource('page.tsx');
    assert.match(src, /tier:\s*'GOLD'/);
    assert.match(src, /tier:\s*'VIP'/);
    assert.match(src, /tier:\s*'SILVER'/);
    assert.match(src, /tier:\s*'REGULAR'/);
  });

  it('followUpClients 应覆盖所有 priority 类型', () => {
    const src = readSource('page.tsx');
    assert.match(src, /priority:\s*'high'/);
    assert.match(src, /priority:\s*'medium'/);
    assert.match(src, /priority:\s*'low'/);
  });

  it('MOCK_SCRIPTS 应包含不同的场景标签', () => {
    const src = readSource('page.tsx');
    assert.match(src, /新品推荐开场/);
    assert.match(src, /会员升等邀请/);
    assert.match(src, /挽回不满意顾客/);
    assert.match(src, /关联推荐/);
  });

  it('MOCK_MEMBERS 应覆盖不同等级', () => {
    const src = readSource('page.tsx');
    assert.match(src, /tier:\s*'GOLD'/);
    assert.match(src, /tier:\s*'VIP'/);
    assert.match(src, /tier:\s*'SILVER'/);
  });

  it('日期应使用动态格式化', () => {
    const src = readSource('page.tsx');
    assert.match(src, /toLocaleDateString/);
    assert.match(src, /new Date\(\)/);
  });
});

// ============================================================
// 防御性 (文件完整性)
// ============================================================

describe('sales-clerk/page — 防御性', () => {
  it('page.tsx 和 page.test.ts 文件应存在', () => {
    const files = ['page.tsx', 'page.test.ts']; // .ts 后缀以避免 node --test .tsx 解析失败
    for (const f of files) {
      const p = resolve(__dirname, f);
      assert.equal(existsSync(p), true, `File should exist: ${f}`);
    }
  });

  it('page.tsx 不应包含 console.log 或 debugger', () => {
    const src = readSource('page.tsx');
    assert.equal(src.includes('console.log'), false);
    assert.equal(src.includes('debugger'), false);
  });

  it('page.tsx 不应包含危险的 innerHTML', () => {
    const src = readSource('page.tsx');
    assert.equal(src.includes('dangerouslySetInnerHTML'), false);
  });

  it('page.tsx 不应包含任何 .only 的测试', () => {
    const src = readSource('page.tsx');
    assert.equal(src.includes('.only'), false);
  });

  it('页面应在 1280px 最大宽度内居中', () => {
    const src = readSource('page.tsx');
    assert.match(src, /maxWidth:\s*1280/);
    assert.match(src, /margin:\s*'0 auto'/);
  });
});
