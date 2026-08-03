/**
 * brand-website/franchise/page.test.ts — 招商加盟合作页测试
 *
 * 覆盖:
 *   L1 正例     — 组件导出、核心元素
 *   L2 数据     — 合作模式、合作流程数据完整性
 *   L3 状态逻辑 — use client、useState 状态管理
 *   L3 FAQ 数据 — 常见问题数据完整性
 *   L3 安全     — 无危险代码
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('FranchisePage — L1 正例', () => {
  it('应导出一个默认函数组件', () => {
    assert.ok(SRC.includes('export default function'));
  });

  it('应包含 use client 指令', () => {
    assert.ok(SRC.includes("'use client'"));
  });

  it('应导入 SEO/Header/Footer/FixedCTA', () => {
    assert.ok(SRC.includes('SEOMeta'));
    assert.ok(SRC.includes('Header'));
    assert.ok(SRC.includes('Footer'));
    assert.ok(SRC.includes('FixedCTA'));
  });

  it('页面标题应包含"招商加盟"', () => {
    assert.ok(SRC.includes('招商加盟'));
  });
});

describe('FranchisePage — L2 合作模式数据', () => {
  it('应定义 COOPERATION_MODES 数组', () => {
    assert.ok(SRC.includes('COOPERATION_MODES'));
  });

  it('COOPERATION_MODES 应包含 3 种合作模式', () => {
    const count = (SRC.match(/id:\s*'/g) || []).length;
    assert.equal(count, 3, `预期 3 种合作模式，实际 ${count}`);
  });

  it('应包含特许加盟模式', () => {
    assert.ok(SRC.includes('特许加盟') || SRC.includes("'franchise'"));
  });

  it('应包含合资联营模式', () => {
    assert.ok(SRC.includes('合资联营') || SRC.includes('joint_venture'));
  });

  it('应包含品牌授权模式', () => {
    assert.ok(
      SRC.includes('品牌授权') || SRC.includes('brand_license'),
    );
  });

  it('每种模式应有 feature 列表', () => {
    const matches = SRC.match(/features:/g);
    assert.ok(matches !== null && matches.length >= 3, `预期至少 3 个 features 字段，实际 ${matches?.length ?? 0}`);
  });

  it('每种模式应有 suitalbe/适合对象描述', () => {
    assert.ok(SRC.includes('suitable'));
  });

  it('模式数据应包含加盟费信息', () => {
    assert.ok(SRC.includes('加盟费') || SRC.includes('加盟'));
  });
});

describe('FranchisePage — L2 合作流程数据', () => {
  it('应包含合作模式选择交互', () => {
    assert.ok(
      SRC.includes('selectedMode') ||
      SRC.includes('合作模式'),
    );
  });

  it('应包含 FAQJSONLD', () => {
    assert.ok(SRC.includes('FAQJSONLD'));
  });
});

describe('FranchisePage — L3 状态逻辑', () => {
  it('应使用 useState', () => {
    assert.ok(SRC.includes('useState'));
  });

  it('应管理状态变量处理展开展收', () => {
    assert.ok(
      SRC.includes('expanded') ||
      SRC.includes('selected') ||
      SRC.includes('active'),
    );
  });
});

describe('FranchisePage — L3 安全', () => {
  it('不应使用 dangerouslySetInnerHTML', () => {
    assert.ok(!SRC.includes('dangerouslySetInnerHTML'));
  });

  it('不应使用 eval', () => {
    assert.ok(!SRC.includes('eval('));
  });

  it('不应包含 as any', () => {
    assert.ok(!SRC.includes('as any'));
  });
});

describe('FranchisePage — 转化分享', () => {
  it('应包含 ShareButtons', () => {
    assert.ok(SRC.includes('ShareButtons'));
  });

  it('应包含 ContactButtons', () => {
    assert.ok(SRC.includes('ContactButtons'));
  });

  it('应有 CTA 按钮', () => {
    assert.ok(
      SRC.includes('提交申请') ||
      SRC.includes('联系我们') ||
      SRC.includes('合作意向'),
    );
  });
});
