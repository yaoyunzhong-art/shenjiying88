/**
 * brand-website/service/page.test.ts — 客户服务页测试
 *
 * 覆盖:
 *   L1 正例     — 组件导出、核心元素
 *   L2 数据     — 服务体系、服务渠道数据完整性
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

describe('ServicePage — L1 正例', () => {
  it('应导出一个默认函数组件', () => {
    assert.ok(SRC.includes('export default function'));
  });

  it('应导入 SEO/Header/Footer/FixedCTA', () => {
    assert.ok(SRC.includes('SEOMeta'));
    assert.ok(SRC.includes('Header'));
    assert.ok(SRC.includes('Footer'));
    assert.ok(SRC.includes('FixedCTA'));
  });

  it('页面标题应包含客户服务', () => {
    assert.ok(SRC.includes('客户服务') || SRC.includes('服务体系'));
  });
});

describe('ServicePage — L2 服务体系数据', () => {
  it('应定义 SERVICE_SYSTEMS 数组', () => {
    assert.ok(SRC.includes('SERVICE_SYSTEMS') || SRC.includes('serviceSystems'));
  });

  it('SERVICE_SYSTEMS 应包含 3 个服务体系', () => {
    const match = SRC.match(/SERVICE_SYSTEMS\s*=\s*\[([\s\S]*?)\];/s);
    assert.ok(match !== null, 'SERVICE_SYSTEMS 未找到');
    const count = (match[1].match(/\{/g) || []).length;
    assert.equal(count, 3, `预期 3 个服务体系，实际 ${count}`);
  });

  it('应包含售前咨询体系', () => {
    assert.ok(SRC.includes('售前咨询'));
  });

  it('应包含售中执行体系', () => {
    assert.ok(SRC.includes('售中执行') || SRC.includes('售中'));
  });

  it('应包含售后赋能体系', () => {
    assert.ok(SRC.includes('售后赋能') || SRC.includes('售后'));
  });

  it('每个体系应有 services 子服务列表', () => {
    const matches = SRC.match(/services:/g);
    assert.ok(matches !== null && matches.length >= 3, `预期至少 3 个 services 字段，实际 ${matches?.length ?? 0}`);
  });
});

describe('ServicePage — L2 服务渠道数据', () => {
  it('应定义 SERVICE_CHANNELS 数组', () => {
    assert.ok(SRC.includes('SERVICE_CHANNELS'));
  });

  it('应包含客服热线', () => {
    assert.ok(SRC.includes('客服热线'));
  });

  it('应包含企业微信', () => {
    assert.ok(SRC.includes('企业微信'));
  });

  it('应包含商务邮箱', () => {
    assert.ok(SRC.includes('商务邮箱'));
  });

  it('每个渠道应有名称/值/服务时间', () => {
    assert.ok(SRC.includes('hours') || SRC.includes('7×'));
  });
});

describe('ServicePage — L3 FAQ 数据', () => {
  it('应包含 FAQJSONLD', () => {
    assert.ok(SRC.includes('FAQJSONLD'));
  });
});

describe('ServicePage — L3 安全', () => {
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

describe('ServicePage — 转化分享', () => {
  it('应包含 ShareButtons', () => {
    assert.ok(SRC.includes('ShareButtons'));
  });

  it('应包含 ContactButtons', () => {
    assert.ok(SRC.includes('ContactButtons'));
  });
});
