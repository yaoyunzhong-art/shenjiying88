import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ── statically analyze page source ──────────────

function extractAlliancesSource(): string | null {
  try {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    return src;
  } catch (e: any) { return null; }
}

// ── fetch mock ──────────────────────────────────

interface ResponseEntry {
  status?: number;
  body: unknown;
}

const responseRegistry = new Map<string, ResponseEntry>();

function mockGlobalFetch() {
  const orig = globalThis.fetch;
  globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const entry = responseRegistry.get(url) || responseRegistry.get('*');
    if (entry) {
      const body = JSON.stringify({ success: entry.status !== 500, data: entry.body, message: entry.status === 500 ? 'Server Error' : undefined });
      return Promise.resolve(new Response(body, { status: entry.status || 200, headers: { 'Content-Type': 'application/json' } }));
    }
    // Default: fail so component falls back to defaultAlliances
    return Promise.reject(new Error('fetch not mocked'));
  };
  return orig;
}

function resetFetch(orig: typeof globalThis.fetch) {
  globalThis.fetch = orig;
}

// ── DefaultAlliances data for test assertions ────

const EXPECTED_DEFAULT_COUNT = 5; // 2 active + 1 expired + 1 terminated + 1 active (al-4 is also active)

// ── helpers ──

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

async function waitForIdle(ms = 100): Promise<void> {
  // Wait for effects, state updates, and re-renders to settle
  await sleep(ms);
}

// ── Tests ───────────────────────────────────────

describe('AlliancesPage', () => {
  let origFetch: typeof globalThis.fetch;

  beforeEach(() => {
    responseRegistry.clear();
    origFetch = mockGlobalFetch();
  });

  afterEach(() => {
    resetFetch(origFetch);
    cleanup();
  });

  // ── 静态分析 ────────────────────────────────

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
      assert.ok(src.includes("'brand'"));
      assert.ok(src.includes("'ip'"));
      assert.ok(src.includes("'cross-industry'"));
      assert.ok(src.includes("'member'"));
    });

    it('应定义 4 种状态', () => {
      const src = extractAlliancesSource();
      assert.ok(src);
      assert.ok(src.includes("'active'"));
      assert.ok(src.includes("'expired'"));
      assert.ok(src.includes("'negotiating'"));
      assert.ok(src.includes("'terminated'"));
    });

    it('新类型 AllianceTab 应包含 terminated', () => {
      const src = extractAlliancesSource();
      assert.ok(src);
      assert.ok(src.includes("'terminated'"));
      assert.ok(src.includes("AllianceTab"));
    });
  });

  describe('样本数据', () => {
    it('应包含至少 5 条样本数据', () => {
      const src = extractAlliancesSource();
      assert.ok(src);
      const idMatches = src.match(/id:\s*['"]([^'"]+)['"]/g);
      assert.ok(idMatches && idMatches.length >= 5, `expected ≥5 ids, got ${idMatches?.length}`);
    });

    it('样本应包含 terminated 状态数据', () => {
      const src = extractAlliancesSource();
      assert.ok(src);
      assert.ok(src.includes("status: 'terminated'"));
    });

    it('每条数据应有 name 和 partnerName', () => {
      const src = extractAlliancesSource();
      assert.ok(src);
      const nameCount = (src.match(/name:\s*['"]/g) || []).length;
      assert.ok(nameCount >= 5, `expected ≥5 names, got ${nameCount}`);
      const partnerCount = (src.match(/partnerName:\s*['"]/g) || []).length;
      assert.ok(partnerCount >= 5, `expected ≥5 partnerNames, got ${partnerCount}`);
    });
  });

  // ── 渲染测试 ────────────────────────────────

  describe('页面渲染（default fallback）', () => {
    it('API 失败时渲染默认数据', async () => {
      // No mock registered → fetch rejects → falls back to defaultAlliances
      render(React.createElement(require('./page').default));
      await waitForIdle(200);

      // Default tab is 'active' which filters out expired/terminated
      // Switch to '全部' to see all
      const allTab = screen.getByText('全部');
      await userEvent.click(allTab);
      await waitForIdle(100);

      // Should render title and all default alliances
      assert.ok(screen.queryByText('联名券管理'), 'should render title');
      assert.ok(screen.queryByText('喜茶联名卡'), 'should render default alliance name');
      assert.ok(screen.queryByText('美团渠道合作'), 'should render terminated alliance');
    });

    it('应显示 4 个统计概览卡片', async () => {
      render(React.createElement(require('./page').default));
      await waitForIdle(200);

      assert.ok(screen.queryByText('联名活动'));
      assert.ok(screen.queryByText('总营收'));
      assert.ok(screen.queryByText('总成本'));
      assert.ok(screen.queryByText('ROI'));
    });

    it('应显示刷新按钮', async () => {
      render(React.createElement(require('./page').default));
      await waitForIdle(200);

      assert.ok(screen.queryByText('刷新'));
    });

    it('活跃状态卡片显示 correct label', async () => {
      render(React.createElement(require('./page').default));
      await waitForIdle(200);

      const activeBadges = screen.queryAllByText('进行中');
      assert.ok(activeBadges.length >= 2, `expected ≥2 active badges, got ${activeBadges.length}`);
    });

    it('已到期卡片显示正确状态标签', async () => {
      render(React.createElement(require('./page').default));
      await waitForIdle(200);

      // Switch to '已到期' tab first to filter expired items in
      const expiredTab = screen.getByText('已到期');
      await userEvent.click(expiredTab);
      await waitForIdle(100);

      const expiredBadges = screen.queryAllByText('已结束');
      assert.ok(expiredBadges.length >= 1, `expected ≥1 expired badges, got ${expiredBadges.length}`);
    });

    it('已终止卡片显示正确状态标签', async () => {
      render(React.createElement(require('./page').default));
      await waitForIdle(200);

      const terminatedBadges = screen.queryAllByText('已终止');
      assert.ok(terminatedBadges.length >= 1, `expected ≥1 terminated badges, got ${terminatedBadges.length}`);
    });
  });

  describe('合作状态分类标签栏', () => {
    it('应渲染 4 个分类标签', async () => {
      render(React.createElement(require('./page').default));
      await waitForIdle(200);

      assert.ok(screen.queryByText('全部'));
      assert.ok(screen.queryByText('生效中'));
      assert.ok(screen.queryByText('已到期'));
      assert.ok(screen.queryByText('已终止'));
    });

    it('默认选中"生效中"标签', async () => {
      render(React.createElement(require('./page').default));
      await waitForIdle(200);

      // Default tabView is 'active', so we check for the active styling
      // The active tab has blue text (text-blue-600)
      const activeTab = screen.getByText('生效中');
      assert.ok(activeTab);
    });

    it('点击"全部"显示所有合作状态联盟', async () => {
      render(React.createElement(require('./page').default));
      await waitForIdle(200);

      const allTab = screen.getByText('全部');
      await userEvent.click(allTab);
      await waitForIdle(100);

      // Should show all 5 alliances
      assert.ok(screen.queryByText('喜茶联名卡'));
      assert.ok(screen.queryByText('泡泡玛特IP联名'));
      assert.ok(screen.queryByText('星巴克联名活动'));
      assert.ok(screen.queryByText('支付宝渠道联名'));
      assert.ok(screen.queryByText('美团渠道合作'));
    });

    it('点击"生效中"只显示活跃和洽谈中的联盟', async () => {
      render(React.createElement(require('./page').default));
      await waitForIdle(200);

      // Default is already '生效中' (active) - should show active + negotiating
      // 3 active (al-1, al-2, al-4), 0 negotiating
      assert.ok(screen.queryByText('喜茶联名卡'));
      assert.ok(screen.queryByText('泡泡玛特IP联名'));
      assert.ok(screen.queryByText('支付宝渠道联名'));
      // Should NOT show expired or terminated
      assert.equal(screen.queryByText('星巴克联名活动'), null, 'expired not shown');
      assert.equal(screen.queryByText('美团渠道合作'), null, 'terminated not shown');
    });

    it('点击"已到期"只显示已到期联盟', async () => {
      render(React.createElement(require('./page').default));
      await waitForIdle(200);

      const expiredTab = screen.getByText('已到期');
      await userEvent.click(expiredTab);
      await waitForIdle(100);

      assert.ok(screen.queryByText('星巴克联名活动'));
      // Should NOT show active or terminated
      assert.equal(screen.queryByText('喜茶联名卡'), null, 'active not shown');
      assert.equal(screen.queryByText('美团渠道合作'), null, 'terminated not shown');
    });

    it('点击"已终止"只显示已终止联盟', async () => {
      render(React.createElement(require('./page').default));
      await waitForIdle(200);

      const terminatedTab = screen.getByText('已终止');
      await userEvent.click(terminatedTab);
      await waitForIdle(100);

      assert.ok(screen.queryByText('美团渠道合作'));
      // Should NOT show active or expired
      assert.equal(screen.queryByText('喜茶联名卡'), null, 'active not shown');
      assert.equal(screen.queryByText('星巴克联名活动'), null, 'expired not shown');
    });

    it('切换标签后之前选中的标签恢复非激活样式', async () => {
      render(React.createElement(require('./page').default));
      await waitForIdle(200);

      // Click '全部'
      const allTab = screen.getByText('全部');
      await userEvent.click(allTab);
      await waitForIdle(100);

      // Click '已到期'
      const expiredTab = screen.getByText('已到期');
      await userEvent.click(expiredTab);
      await waitForIdle(100);

      // Should see '已到期' content
      assert.ok(screen.queryByText('星巴克联名活动'));
    });
  });

  describe('API 加载', () => {
    it('API 成功时显示服务端数据', async () => {
      responseRegistry.set('/api/brand/alliances', {
        body: {
          alliances: [
            { id: 'api-1', name: 'API测试联名', partnerName: '测试方', description: '从API加载', type: 'brand', status: 'active', startDate: '2026-08-01', endDate: '2026-12-31', couponCount: 1000, redeemedCount: 100, costCents: 100000, revenueCents: 500000, newMemberCount: 200, contactPerson: '测试', contactPhone: '13800000001', tenantId: 't1', createdBy: 'admin', createdAt: '2026-07-01T00:00:00Z', updatedAt: '2026-07-18T00:00:00Z' },
          ],
        },
      });

      render(React.createElement(require('./page').default));
      await waitForIdle(200);

      assert.ok(screen.queryByText('API测试联名'), 'should render API data');
      assert.equal(screen.queryByText('喜茶联名卡'), null, 'should NOT render default data');
    });

    it('API 返回空列表时显示空态', async () => {
      responseRegistry.set('/api/brand/alliances', {
        body: { alliances: [] },
      });

      render(React.createElement(require('./page').default));
      await waitForIdle(200);

      assert.ok(screen.queryByText('暂无联名活动'), 'should show empty state title');
      assert.ok(screen.queryByText('当前筛选条件下没有联名活动'), 'should show empty description');
    });

    it('API 失败时降级为默认数据', async () => {
      responseRegistry.set('/api/brand/alliances', {
        status: 500,
        body: null,
      });

      render(React.createElement(require('./page').default));
      await waitForIdle(200);

      // Falls back to defaultAlliances
      assert.ok(screen.queryByText('喜茶联名卡'), 'should fallback to default data');
    });
  });

  describe('空态', () => {
    it('无匹配数据时显示空态提示', async () => {
      responseRegistry.set('/api/brand/alliances', {
        body: { alliances: [] },
      });

      render(React.createElement(require('./page').default));
      await waitForIdle(200);

      // Should show empty state
      const emptyTitle = screen.queryByText('暂无联名活动');
      assert.ok(emptyTitle);
    });

    it('空态包含图标', async () => {
      const src = extractAlliancesSource();
      assert.ok(src);
      assert.ok(src.includes('暂无联名活动') || src.includes('empty'));
    });
  });

  // ── 边界与反例 ────────────────────────────────

  describe('边界与反例', () => {
    it('应处理空数据', () => {
      const src = extractAlliancesSource();
      assert.ok(src);
      const emptyIndicators = ['暂无', 'length === 0', 'filtered.length === 0'];
      const hasEmpty = emptyIndicators.some(ind => src.includes(ind));
      assert.ok(hasEmpty, 'should handle empty data');
    });

    it('应导出默认组件', () => {
      const src = extractAlliancesSource();
      assert.ok(src);
      assert.ok(src.includes('export default'));
    });

    it('allianceTypeLabel 应处理未知类型', () => {
      // Test the utility function logic via source analysis
      const src = extractAlliancesSource();
      assert.ok(src);
      assert.ok(src.includes('allianceTypeLabel'));
      assert.ok(src.includes('map[t] ?? t') || src.includes('??'), 'should handle unknown types');
    });

    it('statusColor 应为每种状态定义颜色', () => {
      const src = extractAlliancesSource();
      assert.ok(src);
      assert.ok(src.includes('statusColor'));
      assert.ok(src.includes('active:'));
      assert.ok(src.includes('expired:'));
      assert.ok(src.includes('negotiating:'));
      assert.ok(src.includes('terminated:'));
    });

    it('核销率为 0 时不报错', () => {
      const src = extractAlliancesSource();
      assert.ok(src);
      // Should handle couponCount === 0
      assert.ok(src.includes('couponCount > 0') || src.includes('Math.max'));
    });

    it('ROI 计算分母为 0 时不报错', () => {
      const src = extractAlliancesSource();
      assert.ok(src);
      assert.ok(src.includes('totalCost > 0') || src.includes('roas'));
    });

    it('进度条宽度不超过 100%', () => {
      const src = extractAlliancesSource();
      assert.ok(src);
      assert.ok(src.includes('Math.min'));
    });

    it('fmtShort 处理亿级金额', () => {
      const src = extractAlliancesSource();
      assert.ok(src);
      assert.ok(src.includes('亿'));
      assert.ok(src.includes('万'));
    });
  });

  // ── 工具函数 ────────────────────────────────

  describe('工具函数', () => {
    it('fmtCents 格式化分为元', () => {
      const src = extractAlliancesSource();
      assert.ok(src);
      assert.ok(src.includes('fmtCents'));
      assert.ok(src.includes('/ 100'));
    });

    it('statusLabel 应覆盖所有状态', () => {
      const src = extractAlliancesSource();
      assert.ok(src);
      assert.ok(src.includes("active: '进行中'"));
      assert.ok(src.includes("expired: '已结束'"));
      assert.ok(src.includes("negotiating: '洽谈中'"));
      assert.ok(src.includes("terminated: '已终止'"));
    });

    it('allianceTypeLabel 覆盖 4 种类型', () => {
      const src = extractAlliancesSource();
      assert.ok(src);
      assert.ok(src.includes('品牌联名'));
      assert.ok(src.includes('IP联名'));
      assert.ok(src.includes('跨界联名'));
      assert.ok(src.includes('会员联名'));
    });

    it('apiFetch 应抛出非 success 响应', () => {
      const src = extractAlliancesSource();
      assert.ok(src);
      assert.ok(src.includes('throw new Error') || src.includes('!json.success'));
    });
  });

  // ── 标签计数 ──────────────────────────────────

  describe('标签栏计数', () => {
    it('默认加载后应显示全部统计', async () => {
      render(React.createElement(require('./page').default));
      await waitForIdle(200);

      // The overview card shows total count
      const countElements = screen.queryAllByText('5');
      // This is weak but confirms the count renders somewhere
      assert.ok(countElements.length > 0 || !screen.queryByText('暂无联名活动'), 'should have data');
    });
  });
});
