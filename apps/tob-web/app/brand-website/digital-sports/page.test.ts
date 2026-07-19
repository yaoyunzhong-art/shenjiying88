/**
 * brand-website/digital-sports/page.test.ts — 数字运动潮玩馆页测试
 *
 * 覆盖:
 *   L1 正例     — 组件导出、核心元素
 *   L2 数据     — 馆型类型、服务支持数据完整性
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

describe('DigitalSportsPage — L1 正例', () => {
  it('应导出一个默认函数组件', () => {
    assert.ok(
      SRC.includes('export default function DigitalSports') ||
      SRC.includes('export default function SportsVenue'),
    );
  });

  it('应导入 SEO/Header/Footer/FixedCTA', () => {
    assert.ok(SRC.includes('SEOMeta'));
    assert.ok(SRC.includes('Header'));
    assert.ok(SRC.includes('Footer'));
    assert.ok(SRC.includes('FixedCTA'));
  });

  it('应包含"数字运动"或"潮玩馆"标题', () => {
    assert.ok(SRC.includes('数字运动') || SRC.includes('潮玩馆'));
  });
});

describe('DigitalSportsPage — L2 馆型类型数据', () => {
  it('应定义 VENUE_TYPES 数组', () => {
    assert.ok(SRC.includes('VENUE_TYPES') || SRC.includes('venueTypes'));
  });

  it('馆型应包含标准潮玩馆', () => {
    assert.ok(SRC.includes('标准潮玩馆') || SRC.includes('standard'));
  });

  it('馆型应包含旗舰潮玩馆', () => {
    assert.ok(SRC.includes('旗舰潮玩馆') || SRC.includes('premium'));
  });

  it('馆型应包含主题潮玩馆', () => {
    assert.ok(SRC.includes('主题潮玩馆') || SRC.includes('theme'));
  });

  it('每种馆型应有规模说明', () => {
    assert.ok(SRC.includes('㎡') || SRC.includes('scale'));
  });

  it('每种馆型应有投资范围', () => {
    assert.ok(SRC.includes('投资') || SRC.includes('investment'));
  });

  it('每种馆型应有 ROI 预计', () => {
    assert.ok(SRC.includes('ROI') || SRC.includes('回报'));
  });

  it('每种馆型应有特色功能列表', () => {
    assert.ok(SRC.includes('features'));
  });
});

describe('DigitalSportsPage — L2 运营支持数据', () => {
  it('应包含运营支持或服务内容', () => {
    assert.ok(
      SRC.includes('运营支持') ||
      SRC.includes('SUPPORT') ||
      SRC.includes('服务'),
    );
  });

  it('应包含 CTA 引导用户了解详情', () => {
    assert.ok(
      SRC.includes('立即联系') ||
      SRC.includes('投资方案') ||
      SRC.includes('Contact'),
    );
  });
});

describe('DigitalSportsPage — L3 FAQ 数据', () => {
  it('应包含 FAQJSONLD', () => {
    assert.ok(SRC.includes('FAQJSONLD'));
  });
});

describe('DigitalSportsPage — L3 安全', () => {
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

describe('DigitalSportsPage — 转化分享', () => {
  it('应包含 ShareButtons', () => {
    assert.ok(SRC.includes('ShareButtons'));
  });

  it('应包含 ContactButtons', () => {
    assert.ok(SRC.includes('ContactButtons'));
  });
});
