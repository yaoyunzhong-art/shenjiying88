/**
 * brand-website/contact/page.test.ts — 咨询落地页测试
 *
 * 覆盖:
 *   L1 正例     — 组件导出、核心元素
 *   L2 数据     — 合作类型、服务渠道数据完整性
 *   L3 状态逻辑 — 表单状态切换、提交处理
 *   L3 安全     — 无危险代码
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('ContactPage — L1 正例', () => {
  it('应导出一个默认函数组件 ContactPage', () => {
    assert.ok(SRC.includes('export default function ContactPage'));
  });

  it('应包含 use client 指令', () => {
    assert.ok(SRC.includes("'use client'"));
  });

  it('应导入 SEO 元数据组件', () => {
    assert.ok(SRC.includes('SEOMeta'));
  });

  it('应导入 Header/Footer', () => {
    assert.ok(SRC.includes('import Header'));
    assert.ok(SRC.includes('import Footer'));
  });

  it('页面标题应为"联系我们"', () => {
    assert.ok(SRC.includes('联系我们'));
  });

  it('应包含联系方式区块', () => {
    assert.ok(SRC.includes('联系方式'));
  });
});

describe('ContactPage — L2 合作类型数据', () => {
  it('应定义 COOPERATION_TYPES 数组', () => {
    assert.ok(SRC.includes('COOPERATION_TYPES'));
  });

  it('COOPERATION_TYPES 应包含 7 种合作类型', () => {
    const match = SRC.match(/COOPERATION_TYPES\s*=\s*\[([\s\S]*?)\];/);
    assert.ok(match !== null, 'COOPERATION_TYPES 未找到');
    const count = (match[1].match(/\{/g) || []).length;
    assert.equal(count, 7, `预期 7 种合作类型，实际 ${count}`);
  });

  it('应包含产品销售合作类型', () => {
    assert.ok(SRC.includes("'product'"));
    assert.ok(SRC.includes('产品销售合作'));
  });

  it('应包含 EPC+O 全流程服务', () => {
    assert.ok(SRC.includes("'epc'"));
    assert.ok(SRC.includes('EPC+O全流程服务'));
  });

  it('应包含数字运动合作', () => {
    assert.ok(SRC.includes("'digital-sports'"));
    assert.ok(SRC.includes('数字运动合作'));
  });

  it('应包含招商加盟', () => {
    assert.ok(SRC.includes("'franchise'"));
    assert.ok(SRC.includes('招商加盟'));
  });

  it('应包含供应链合作', () => {
    assert.ok(SRC.includes("'supply'"));
    assert.ok(SRC.includes('供应链合作'));
  });

  it('应包含品牌合作和其他合作', () => {
    assert.ok(SRC.includes("'brand'"));
    assert.ok(SRC.includes("'other'"));
  });
});

describe('ContactPage — L2 服务渠道数据', () => {
  it('应定义 SERVICE_CHANNELS 数组', () => {
    assert.ok(SRC.includes('SERVICE_CHANNELS'));
  });

  it('SERVICE_CHANNELS 应包含 3 个渠道', () => {
    const match = SRC.match(/SERVICE_CHANNELS\s*=\s*\[([\s\S]*?)\];/);
    assert.ok(match !== null, 'SERVICE_CHANNELS 未找到');
    const count = (match[1].match(/\{/g) || []).length;
    assert.equal(count, 3, `预期 3 个渠道，实际 ${count}`);
  });

  it('应包含商务热线 400', () => {
    assert.ok(SRC.includes('商务热线'));
    assert.ok(SRC.includes('400-'));
  });

  it('应包含企业微信', () => {
    assert.ok(SRC.includes('企业微信'));
  });

  it('应包含商务邮箱', () => {
    assert.ok(SRC.includes('商务邮箱'));
  });
});

describe('ContactPage — L3 表单状态逻辑', () => {
  it('应使用 useState 管理表单状态', () => {
    assert.ok(SRC.includes('useState'));
  });

  it('应管理 submitted 状态', () => {
    assert.ok(SRC.includes('submitted'));
  });

  it('应管理 formData 状态', () => {
    assert.ok(SRC.includes('formData'));
  });

  it('提交后应显示成功面板', () => {
    assert.ok(SRC.includes('提交成功！'));
  });

  it('成功面板应含"继续填写"按钮', () => {
    assert.ok(SRC.includes('继续填写'));
  });

  it('应使用 handleChange 处理输入变化', () => {
    assert.ok(SRC.includes('handleChange'));
  });

  it('应使用 handleSubmit 处理提交', () => {
    assert.ok(SRC.includes('handleSubmit'));
  });

  it('表单包含公司名称字段', () => {
    assert.ok(SRC.includes('companyName'));
  });

  it('表单包含联系电话字段', () => {
    assert.ok(SRC.includes('phone'));
  });

  it('表单包含需求描述字段', () => {
    assert.ok(SRC.includes('message'));
  });
});

describe('ContactPage — L3 安全', () => {
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
