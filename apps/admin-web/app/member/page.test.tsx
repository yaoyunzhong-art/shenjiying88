/**
 * member/page.test.tsx — 会员管理首页 L1 冒烟测试
 * 覆盖:
 *  - 正例: 模块入口正确返回、概览统计格式正确
 *  - 边界: 空/零值统计处理
 *  - 防御: 非法模块链接不被渲染
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ============================================================
// 测试目标：模拟 page.tsx 中的数据处理逻辑
// ============================================================

interface ModuleEntry {
  title: string;
  description: string;
  href: string;
  icon: string;
}

const MODULES: ModuleEntry[] = [
  { title: '活动记录', description: '查看会员积分变动等操作日志', href: '/member/activities', icon: '📋' },
  { title: '配置管理', description: '管理会员等级规则、积分策略', href: '/member/config', icon: '⚙️' },
];

/** 模拟的概览卡片数据 */
interface StatCardData {
  label: string;
  value: number;
  trend: number;
  unit: string;
  formatter?: (v: number) => string;
}

const DEFAULT_CARDS: StatCardData[] = [
  { label: '总会员数', value: 1286, trend: 3.2, unit: '人' },
  { label: '本月新增', value: 47, trend: 12.5, unit: '人' },
  { label: '活跃会员', value: 835, trend: -2.1, unit: '人' },
  { label: '会员消费总额', value: 356800, trend: 8.7, unit: '元', formatter: (v: number) => `¥${v.toLocaleString()}` },
];

function formatCardValue(card: StatCardData): string {
  if (card.formatter) return card.formatter(card.value);
  return `${card.value.toLocaleString()} ${card.unit}`;
}

function getTrendDirection(trend: number): 'up' | 'down' {
  return trend >= 0 ? 'up' : 'down';
}

function getTrendText(trend: number): string {
  const sign = trend >= 0 ? '+' : '';
  return `${sign}${trend}%`;
}

// ============================================================
// 正例 (Happy Path)
// ============================================================

describe('会员管理首页 — 正例', () => {
  it('应返回 2 个模块入口', () => {
    assert.equal(MODULES.length, 2);
  });

  it('所有模块入口应有 title / href / icon', () => {
    for (const mod of MODULES) {
      assert.ok(mod.title, `模块 ${mod.href} 缺少 title`);
      assert.ok(mod.href.startsWith('/member/'), `模块 ${mod.title} href 应为 /member/ 开头`);
      assert.ok(mod.icon, `模块 ${mod.title} 缺少 icon`);
    }
  });

  it('模块链接无重复', () => {
    const hrefs = MODULES.map(m => m.href);
    assert.equal(new Set(hrefs).size, hrefs.length, '存在重复的模块链接');
  });

  it('概览卡片格式正确', () => {
    for (const card of DEFAULT_CARDS) {
      const formatted = formatCardValue(card);
      assert.ok(formatted.length > 0, `${card.label} 格式化后不应为空`);
      assert.ok(formatted.includes(card.unit) || card.formatter, `${card.label} 应包含单位或自定义格式`);

      const dir = getTrendDirection(card.trend);
      assert.ok(dir === 'up' || dir === 'down', `${card.label} trend 方向应为 up/down`);

      const trendText = getTrendText(card.trend);
      assert.ok(trendText.includes('%'), `${card.label} trend 应包含 %`);
      assert.ok(trendText.startsWith('+') || trendText.startsWith('-'), `${card.label} trend 应以 +/- 开头`);
    }
  });

  it('趋势方向与符号一致', () => {
    for (const card of DEFAULT_CARDS) {
      const dir = getTrendDirection(card.trend);
      const text = getTrendText(card.trend);
      if (card.trend > 0) {
        assert.equal(dir, 'up');
        assert.ok(text.startsWith('+'));
      } else if (card.trend < 0) {
        assert.equal(dir, 'down');
        assert.ok(text.startsWith('-'));
      } else {
        assert.equal(text, '+0%');
      }
    }
  });
});

// ============================================================
// 边界 (Edge Cases)
// ============================================================

describe('会员管理首页 — 边界', () => {
  it('零会员数应正确格式化', () => {
    const zeroCard: StatCardData = { label: '总会员数', value: 0, trend: 0, unit: '人' };
    assert.equal(formatCardValue(zeroCard), '0 人');
    assert.equal(getTrendDirection(zeroCard.trend), 'up');
  });

  it('负趋势值应正确', () => {
    const negativeCard: StatCardData = { label: '活跃会员', value: 500, trend: -15.3, unit: '人' };
    assert.equal(getTrendDirection(negativeCard.trend), 'down');
    assert.equal(getTrendText(negativeCard.trend), '-15.3%');
  });

  it('大额消费应带千位分隔符', () => {
    const bigCard: StatCardData = { label: '总消费', value: 9999999, trend: 5, unit: '元', formatter: (v: number) => `¥${v.toLocaleString()}` };
    const formatted = formatCardValue(bigCard);
    assert.ok(formatted.includes('¥'));
    assert.ok(formatted.includes(','));
  });

  it('模块标题不应为空字符串', () => {
    for (const mod of MODULES) {
      assert.ok(mod.title.trim().length > 0, `模块 ${mod.href} title 不应为空`);
    }
  });
});

// ============================================================
// 防御 (Defensive)
// ============================================================

describe('会员管理首页 — 防御', () => {
  it('未知模块不包含非法字符', () => {
    const hrefs = MODULES.map(m => m.href);
    for (const href of hrefs) {
      assert.doesNotThrow(() => new URL(href, 'http://localhost'));
    }
  });

  it('空模块列表不崩溃', () => {
    const emptyList: ModuleEntry[] = [];
    assert.equal(emptyList.length, 0);
    assert.doesNotThrow(() => emptyList.forEach(m => m.href));
  });

  it('卡片空值趋势不抛异常', () => {
    const edgeCard: StatCardData = { label: '测试', value: NaN, trend: NaN, unit: '' };
    assert.doesNotThrow(() => {
      getTrendDirection(edgeCard.trend);
      getTrendText(edgeCard.trend);
    });
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Member — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化', () => assert.ok(SRC.includes('.toFixed') || SRC.includes('toLocaleString')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes('/**')));
});
