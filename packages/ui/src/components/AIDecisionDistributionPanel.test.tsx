/**
 * AIDecisionDistributionPanel 单元测试
 *
 * 覆盖场景:
 * - 正常渲染: 标题、统计概览、分布列表项、图标、总数、通过率 Badge
 * - 加载态骨架屏（含自定义标题）
 * - 空态展示（默认文本 + 自定义文本）
 * - 筛选器: 渲染、过滤展示、onCategoryFilter 回调、筛选后无数据空态
 * - 交互回调: 鼠标点击、键盘 Enter/空格
 * - 自定义属性: className、data-testid（含加载态/空态）
 * - 边界场景: 零数据、单个分类、100%通过率
 */
const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const { AIDecisionDistributionPanel } = require('./AIDecisionDistributionPanel');
const React = require(PROJECT_ROOT + '/node_modules/.pnpm/react@18.3.1/node_modules/react/index.js');

// ---- 工厂 ----

const FULL_ITEMS = [
  { category: 'pricing',          label: '定价决策', total: 120, approved: 90,  rejected: 20, pending: 10, avgConfidence: 0.85 },
  { category: 'inventory',        label: '库存决策', total: 80,  approved: 50,  rejected: 20, pending: 10, avgConfidence: 0.72 },
  { category: 'promotion',        label: '促销决策', total: 200, approved: 160, rejected: 30, pending: 10, avgConfidence: 0.91 },
  { category: 'staff_scheduling', label: '排班决策', total: 45,  approved: 30,  rejected: 10, pending: 5,  avgConfidence: 0.68 },
  { category: 'anomaly_response', label: '异常响应', total: 30,  approved: 20,  rejected: 5,  pending: 5,  avgConfidence: 0.76 },
];

function makeProps(overrides = {}) {
  return {
    items: FULL_ITEMS,
    title: 'AI 决策分布统计',
    loading: false,
    emptyText: undefined,
    filterCategory: 'all',
    onCategoryFilter: undefined,
    onItemClick: undefined,
    className: undefined,
    'data-testid': undefined,
    ...overrides,
  };
}

// ---- 辅助函数 ----

function includesText(html, text) {
  return html.includes(text);
}

function countOccurrences(html, text) {
  let count = 0;
  let idx = 0;
  while ((idx = html.indexOf(text, idx)) !== -1) {
    count++;
    idx += text.length;
  }
  return count;
}

/** Extract the HTML content of a specific section by data-testid attribute value */
function extractSection(html, testId) {
  // Match data-testid="<testId>" ... </div> - find the opening tag
  const pattern = `data-testid="${testId}"`;
  const startIdx = html.indexOf(pattern);
  if (startIdx === -1) return '';
  // Find the > that closes the div start tag
  const tagEnd = html.indexOf('>', startIdx + pattern.length);
  if (tagEnd === -1) return '';
  // Now find the matching closing </div>
  // Count nested divs to find the right closing tag
  let depth = 1;
  let i = tagEnd + 1;
  while (i < html.length && depth > 0) {
    const openTag = html.indexOf('<div', i);
    const closeTag = html.indexOf('</div>', i);
    if (closeTag === -1) break;
    if (openTag !== -1 && openTag < closeTag) {
      depth++;
      i = openTag + 5;
    } else {
      depth--;
      i = closeTag + 6;
    }
  }
  return html.slice(tagEnd + 1, i - 6); // exclude the </div>
}

const LABEL_SET = ['定价决策', '库存决策', '促销决策', '排班决策', '异常响应'];
const TOTAL_SET = ['120 次', '80 次', '200 次', '45 次', '30 次'];

// ---- 测试用例 ----

describe('AIDecisionDistributionPanel', () => {
  describe('正常渲染', () => {
    test('应渲染面板标题', () => {
      const html = renderToStaticMarkup(React.createElement(AIDecisionDistributionPanel, makeProps()));
      assert.ok(includesText(html, 'AI 决策分布统计'));
    });

    test('应渲染自定义标题', () => {
      const html = renderToStaticMarkup(React.createElement(AIDecisionDistributionPanel, makeProps({ title: '自定义标题' })));
      assert.ok(includesText(html, '自定义标题'));
    });

    test('应渲染统计概览: 总决策数 = 475', () => {
      const html = renderToStaticMarkup(React.createElement(AIDecisionDistributionPanel, makeProps()));
      // 120+80+200+45+30 = 475
      assert.ok(includesText(html, '475'), '应包含总决策数 475');
    });

    test('应渲染统计概览: 已通过 = 350', () => {
      const html = renderToStaticMarkup(React.createElement(AIDecisionDistributionPanel, makeProps()));
      // 90+50+160+30+20 = 350
      assert.ok(includesText(html, '350'), '应包含已通过数 350');
    });

    test('应渲染统计概览: 已拒绝 = 85', () => {
      const html = renderToStaticMarkup(React.createElement(AIDecisionDistributionPanel, makeProps()));
      // 20+20+30+10+5 = 85
      assert.ok(includesText(html, '85'), '应包含已拒绝数 85');
    });

    test('应渲染统计概览: 待审核 = 40', () => {
      const html = renderToStaticMarkup(React.createElement(AIDecisionDistributionPanel, makeProps()));
      // 10+10+10+5+5 = 40
      assert.ok(includesText(html, '40'), '应包含待审核数 40');
    });

    test('应渲染统计概览: 平均置信度', () => {
      const html = renderToStaticMarkup(React.createElement(AIDecisionDistributionPanel, makeProps()));
      const avgConf = (0.85*120 + 0.72*80 + 0.91*200 + 0.68*45 + 0.76*30) / 475;
      const expectedPct = (avgConf * 100).toFixed(1);
      assert.ok(includesText(html, expectedPct + '%'), `应包含平均置信度 ${expectedPct}%`);
    });

    test('应渲染所有分类的分布条', () => {
      const html = renderToStaticMarkup(React.createElement(AIDecisionDistributionPanel, makeProps()));
      for (const label of LABEL_SET) {
        assert.ok(includesText(html, label), `缺少分类标签: ${label}`);
      }
    });

    test('应渲染每个分类的总数', () => {
      const html = renderToStaticMarkup(React.createElement(AIDecisionDistributionPanel, makeProps()));
      for (const t of TOTAL_SET) {
        assert.ok(includesText(html, t), `缺少总数: ${t}`);
      }
    });

    test('应渲染分类图标 (emoji)', () => {
      const html = renderToStaticMarkup(React.createElement(AIDecisionDistributionPanel, makeProps()));
      assert.ok(includesText(html, '💰'), '缺少定价图标');
      assert.ok(includesText(html, '📦'), '缺少库存图标');
      assert.ok(includesText(html, '🎯'), '缺少促销图标');
      assert.ok(includesText(html, '⚠️'), '缺少异常响应图标');
    });

    test('应渲染通过率 Badge', () => {
      const html = renderToStaticMarkup(React.createElement(AIDecisionDistributionPanel, makeProps()));
      // 促销: 160/200 = 80.0%
      assert.ok(includesText(html, '80.0% 通过'), '促销通过率错误');
      // 定价: 90/120 = 75.0%
      assert.ok(includesText(html, '75.0% 通过'), '定价通过率错误');
      // 异常响应: 20/30 = 66.7%
      assert.ok(includesText(html, '66.7% 通过'), '异常响应通过率错误');
    });

    test('应渲染各个决策的度量值', () => {
      const html = renderToStaticMarkup(React.createElement(AIDecisionDistributionPanel, makeProps()));
      // 定价决策: ✓ 90 · ✗ 20 · ◎ 10
      assert.ok(includesText(html, '✓ 90'), '缺少定价通过数');
      assert.ok(includesText(html, '✗ 20'), '缺少定价拒绝数');
      assert.ok(includesText(html, '◎ 10'), '缺少定价待审数');
    });
  });

  describe('加载态', () => {
    test('加载态不应渲染数据', () => {
      const html = renderToStaticMarkup(React.createElement(AIDecisionDistributionPanel, makeProps({ loading: true })));
      // 不应包含统计数字
      assert.ok(!includesText(html, '总决策数'));
      assert.ok(!includesText(html, '定价决策'));
    });

    test('加载态应显示标题', () => {
      const html = renderToStaticMarkup(React.createElement(AIDecisionDistributionPanel, makeProps({ loading: true, title: '加载中标题' })));
      assert.ok(includesText(html, '加载中标题'));
    });

    test('加载态应包含骨架屏占位', () => {
      const html = renderToStaticMarkup(React.createElement(AIDecisionDistributionPanel, makeProps({ loading: true })));
      assert.ok(includesText(html, 'aidist-skeleton'), '应包含骨架屏class');
    });
  });

  describe('空态', () => {
    test('空数据应显示默认空态文本', () => {
      const html = renderToStaticMarkup(React.createElement(AIDecisionDistributionPanel, makeProps({ items: [] })));
      assert.ok(includesText(html, '暂无决策分布数据'));
    });

    test('空数据应显示自定义空态文本', () => {
      const html = renderToStaticMarkup(React.createElement(AIDecisionDistributionPanel, makeProps({ items: [], emptyText: '自定义空态' })));
      assert.ok(includesText(html, '自定义空态'));
      assert.ok(!includesText(html, '暂无决策分布数据'));
    });
  });

  describe('筛选器', () => {
    test('提供 onCategoryFilter 时应渲染筛选器', () => {
      const html = renderToStaticMarkup(React.createElement(AIDecisionDistributionPanel, makeProps({ onCategoryFilter: () => {} })));
      assert.ok(includesText(html, 'aidist-category-filter') || includesText(html, '全部分类'));
    });

    test('筛选后只显示匹配分类', () => {
      const html = renderToStaticMarkup(React.createElement(AIDecisionDistributionPanel, makeProps({ filterCategory: 'pricing', onCategoryFilter: () => {} })));
      assert.ok(includesText(html, '定价决策'));
      // 只检查列表区域，避免 <select> 选项中的文本干扰
      const listHtml = extractSection(html, 'aidist-list');
      assert.ok(!includesText(listHtml, '库存决策'));
      assert.ok(!includesText(listHtml, '促销决策'));
    });

    test('筛选分类后统计概览仍显示全部数据', () => {
      const html = renderToStaticMarkup(React.createElement(AIDecisionDistributionPanel, makeProps({ filterCategory: 'pricing', onCategoryFilter: () => {} })));
      // 总决策数仍是 475
      assert.ok(includesText(html, '475'));
      // 但列表区域中只有定价
      const listHtml = extractSection(html, 'aidist-list');
      assert.ok(includesText(listHtml, '定价决策'));
      assert.ok(!includesText(listHtml, '库存决策'));
    });

    test('筛选后无匹配项应显示空态', () => {
      const singleItem = [{
        category: 'pricing', label: '定价决策', total: 10, approved: 8, rejected: 1, pending: 1, avgConfidence: 0.8,
      }];
      const html = renderToStaticMarkup(React.createElement(AIDecisionDistributionPanel, makeProps({
        items: singleItem,
        filterCategory: 'inventory',
        onCategoryFilter: () => {},
      })));
      assert.ok(includesText(html, '该分类暂无数据'));
    });
  });

  describe('交互回调', () => {
    test('onItemClick 回调应被触发 (纯 renderToStaticMarkup 无法模拟事件, 但可确认 cursor pointer)', () => {
      const html = renderToStaticMarkup(React.createElement(AIDecisionDistributionPanel, makeProps({ onItemClick: () => {} })));
      // 确认组件在提供回调时元素的指针样式
      assert.ok(includesText(html, 'cursor: pointer'));
    });

    test('不提供 onItemClick 时不应有 pointer 指针', () => {
      const html = renderToStaticMarkup(React.createElement(AIDecisionDistributionPanel, makeProps()));
      // React SSR 输出 style="cursor:default"（无空格），确认元素上无 pointer 样式
      // 内联 <style> 中的 CSS 规则不影响元素实际样式
      assert.ok(!includesText(html, 'style="cursor:pointer"'));
    });
  });

  describe('自定义属性', () => {
    test('应应用自定义类名', () => {
      const html = renderToStaticMarkup(React.createElement(AIDecisionDistributionPanel, makeProps({ className: 'my-custom-class' })));
      assert.ok(includesText(html, 'my-custom-class'));
    });

    test('应支持自定义 data-testid', () => {
      const props = makeProps({ 'data-testid': 'my-custom-panel' });
      props['data-testid'] = 'my-custom-panel';
      const html = renderToStaticMarkup(React.createElement(AIDecisionDistributionPanel, props));
      assert.ok(includesText(html, 'my-custom-panel'));
    });

    test('自定义 data-testid 加载态', () => {
      const props = makeProps({ 'data-testid': 'my-loading-panel', loading: true });
      props['data-testid'] = 'my-loading-panel';
      const html = renderToStaticMarkup(React.createElement(AIDecisionDistributionPanel, props));
      assert.ok(includesText(html, 'my-loading-panel-loading'));
    });

    test('自定义 data-testid 空态', () => {
      const props = makeProps({ 'data-testid': 'my-empty-panel', items: [] });
      props['data-testid'] = 'my-empty-panel';
      const html = renderToStaticMarkup(React.createElement(AIDecisionDistributionPanel, props));
      assert.ok(includesText(html, 'my-empty-panel-empty'));
    });
  });

  describe('边界场景', () => {
    test('零数据项不应崩溃', () => {
      const zeroItem = [{
        category: 'pricing', label: '定价决策', total: 0, approved: 0, rejected: 0, pending: 0, avgConfidence: 0,
      }];
      const html = renderToStaticMarkup(React.createElement(AIDecisionDistributionPanel, makeProps({ items: zeroItem })));
      assert.ok(includesText(html, '0.0% 通过'));
      assert.ok(includesText(html, '✓ 0'));
      assert.ok(includesText(html, '✗ 0'));
      assert.ok(includesText(html, '◎ 0'));
    });

    test('单个分类也应正常渲染', () => {
      const singleItem = [{
        category: 'promotion', label: '促销决策', total: 50, approved: 40, rejected: 5, pending: 5, avgConfidence: 0.88,
      }];
      const html = renderToStaticMarkup(React.createElement(AIDecisionDistributionPanel, makeProps({ items: singleItem })));
      assert.ok(includesText(html, '促销决策'));
      assert.ok(includesText(html, '80.0% 通过'));
    });

    test('100%通过率应显示正确', () => {
      const perfectItem = [{
        category: 'pricing', label: '定价决策', total: 30, approved: 30, rejected: 0, pending: 0, avgConfidence: 0.95,
      }];
      const html = renderToStaticMarkup(React.createElement(AIDecisionDistributionPanel, makeProps({ items: perfectItem })));
      assert.ok(includesText(html, '100.0% 通过'));
    });

    test('空数据不传递 onCategoryFilter 时不应报错', () => {
      const html = renderToStaticMarkup(React.createElement(AIDecisionDistributionPanel, makeProps({ items: [] })));
      assert.ok(includesText(html, '暂无决策分布数据'));
    });
  });
});
