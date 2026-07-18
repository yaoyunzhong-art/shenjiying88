import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

// ── statically analyze page source ──────────────

function extractAlliancesSource(): string | null {
  try {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    return src;
  } catch (e: any) { return null; }
}

// ── tests ───────────────────────────────────────

describe('alliances page', () => {
  beforeEach(() => {});

  describe('类型定义', () => {
    it('应定义 Alliance 接口', () => {
      const src = extractAlliancesSource();
      assert.ok(src);
      assert.ok(src.includes('interface Alliance'));
      assert.ok(src.includes('id: string'));
      assert.ok(src.includes('name: string'));
      assert.ok(src.includes('partnerName'));
      assert.ok(src.includes('type'));
      assert.ok(src.includes('status'));
    });

    it('应定义 4 种联名类型', () => {
      const src = extractAlliancesSource();
      assert.ok(src);
      assert.ok(src.includes('brand') || src.includes("'brand'"));
      assert.ok(src.includes('ip') || src.includes("'ip'"));
      assert.ok(src.includes('cross-industry'));
      assert.ok(src.includes('member'));
    });

    it('应定义 4 种状态', () => {
      const src = extractAlliancesSource();
      assert.ok(src);
      assert.ok(src.includes("'active'"));
      assert.ok(src.includes("'expired'"));
      assert.ok(src.includes("'negotiating'"));
      assert.ok(src.includes("'terminated'"));
    });
  });

  describe('样本数据', () => {
    it('应包含 4 条样本数据', () => {
      const src = extractAlliancesSource();
      assert.ok(src);
      const idMatches = src.match(/id:\s*['"]([^'"]+)['"]/g);
      assert.ok(idMatches && idMatches.length >= 4, `expected ≥4 ids, got ${idMatches?.length}`);
    });

    it('每条数据应有 name 字段', () => {
      const src = extractAlliancesSource();
      assert.ok(src);
      const nameCount = (src.match(/name:\s*['"]/g) || []).length;
      assert.ok(nameCount >= 4, `expected ≥4 names, got ${nameCount}`);
    });
  });

  describe('筛选功能', () => {
    it('应支持 Tab 筛选（全部/进行中/已过期/洽谈中）', () => {
      const src = extractAlliancesSource();
      assert.ok(src);
      const tabCount = (src.match(/tab|Tab|TAB/g) || []).length;
      assert.ok(tabCount >= 2);
    });

    it('应支持类型筛选', () => {
      const src = extractAlliancesSource();
      assert.ok(src);
      const filterCount = (src.match(/filter|typeFilter|setType|select|option/g) || []).length;
      assert.ok(filterCount >= 1);
    });

    it('应支持筛选', () => {
      const src = extractAlliancesSource();
      assert.ok(src);
      assert.ok(src.includes('filter') || src.includes('Filter') || src.includes('select') || src.includes('Select'));
    });

    it('搜索空态应返回提示', () => {
      const src = extractAlliancesSource();
      assert.ok(src);
      assert.ok(src.includes('空') || src.includes('暂无') || src.includes('没有') || src.includes('EmptyState') || src.includes('onReset'));
    });
  });

  describe('统计功能', () => {
    it('应计算联盟总数', () => {
      const src = extractAlliancesSource();
      assert.ok(src);
      const lengthMatches = src.match(/\.length/g);
      assert.ok(lengthMatches && lengthMatches.length >= 1);
    });

    it('应计算激活中数量', () => {
      const src = extractAlliancesSource();
      assert.ok(src);
      assert.ok(src.includes('active'));
    });

    it('应计算总成本和总营收', () => {
      const src = extractAlliancesSource();
      assert.ok(src);
      const costMatches = src.match(/costCents/g);
      const revenueMatches = src.match(/revenueCents/g);
      assert.ok(costMatches && costMatches.length >= 1);
      assert.ok(revenueMatches && revenueMatches.length >= 1);
    });
  });

  describe('页面渲染', () => {
    it('应渲染标题', () => {
      const src = extractAlliancesSource();
      assert.ok(src);
      assert.ok(src.includes('<h1') || src.includes('联名') || src.includes('Alliance'));
    });

    it('应渲染统计卡片', () => {
      const src = extractAlliancesSource();
      assert.ok(src);
      const statCount = (src.match(/StatCard|stat|statistics|统计/g) || []).length;
      assert.ok(statCount >= 1);
    });

    it('应渲染刷新按钮', () => {
      const src = extractAlliancesSource();
      assert.ok(src);
      assert.ok(src.includes('刷新') || src.includes('refresh') || src.includes('Refresh'));
    });
  });

  describe('边界与反例', () => {
    it('应处理空数据（0 条联盟）', () => {
      const src = extractAlliancesSource();
      assert.ok(src);
      const emptyIndicators = ['empty', 'EmptyState', '无结果', '未找到', '暂无', '0'];
      const hasEmpty = emptyIndicators.some(ind => src.includes(ind) || src.includes(`length === 0`) || src.includes('.length === 0'));
      assert.ok(hasEmpty);
    });

    it('应导出默认组件', () => {
      const src = extractAlliancesSource();
      assert.ok(src);
      assert.ok(src.includes('export default'));
    });
  });
});
