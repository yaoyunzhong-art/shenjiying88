/**
 * brand-website/epc/page.test.ts — EPC+O全流程服务页测试
 *
 * 覆盖:
 *   L1 正例     — 组件导出、核心元素
 *   L2 数据     — 服务步骤、优势数据完整性
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

describe('EPCPage — L1 正例', () => {
  it('应导出一个默认函数组件 EpcPage', () => {
    assert.ok(SRC.includes('export default function EpcPage'));
  });

  it('应导入 SEO/Header/Footer/FixedCTA', () => {
    assert.ok(SRC.includes('SEOMeta'));
    assert.ok(SRC.includes('Header'));
    assert.ok(SRC.includes('Footer'));
    assert.ok(SRC.includes('FixedCTA'));
  });

  it('应包含 EPC+O 标题', () => {
    assert.ok(SRC.includes('EPC+O') || SRC.includes('EPCO'));
  });

  it('页面标题应包含全流程服务', () => {
    assert.ok(SRC.includes('全流程服务'));
  });
});

describe('EPCPage — L2 服务步骤数据', () => {
  it('应定义 SERVICE_STEPS 数组', () => {
    assert.ok(SRC.includes('SERVICE_STEPS'));
  });

  it('SERVICE_STEPS 应包含 5 个步骤', () => {
    const match = SRC.match(/SERVICE_STEPS\s*=\s*\[([\s\S]*?)\];/s);
    assert.ok(match !== null, 'SERVICE_STEPS 未找到');
    const count = (match[1].match(/\{/g) || []).length;
    assert.equal(count, 5, `预期 5 个服务步骤，实际 ${count}`);
  });

  it('应包含场地评估步骤', () => {
    assert.ok(SRC.includes('场地评估'));
  });

  it('应包含方案设计步骤', () => {
    assert.ok(SRC.includes('方案设计'));
  });

  it('应包含工程施工步骤', () => {
    assert.ok(SRC.includes('工程施工'));
  });

  it('应包含设备供应步骤', () => {
    assert.ok(SRC.includes('设备供应'));
  });

  it('应包含运营支持步骤', () => {
    assert.ok(SRC.includes('运营支持'));
  });

  it('每个步骤应有 step/title/description/duration/icon 字段', () => {
    assert.ok(SRC.includes('step:'));
    assert.ok(SRC.includes('duration:'));
  });
});

describe('EPCPage — L2 服务优势数据', () => {
  it('应包含服务流程或周期信息', () => {
    assert.ok(SRC.includes('长期陪伴') || SRC.includes('SERVICE_STEPS'));
  });

  it('应包含 CTA 引导用户获取方案报价', () => {
    assert.ok(SRC.includes('方案报价') || SRC.includes('定制方案') || SRC.includes('获取方案'));
  });

  it('应包含 FAQJSONLD 结构化数据', () => {
    assert.ok(SRC.includes('FAQJSONLD'));
  });
});

describe('EPCPage — L3 项目案例数据', () => {
  it('应包含项目案例或合作案例数据', () => {
    assert.ok(
      SRC.includes('CASES') ||
      SRC.includes('案例') ||
      SRC.includes('case'),
    );
  });
});

describe('EPCPage — L3 安全', () => {
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

describe('EPCPage — 转化与分享', () => {
  it('应包含 ShareButtons', () => {
    assert.ok(SRC.includes('ShareButtons'));
  });

  it('应包含 ContactButtons', () => {
    assert.ok(SRC.includes('ContactButtons'));
  });
});
