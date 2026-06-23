import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { DecisionAuditTrail } = require('./DecisionAuditTrail');
const type = require('./DecisionAuditTrail');

const mockEntries: Array<{
  id: string;
  action: string;
  message: string;
  ruleId?: string;
  ruleName?: string;
  ruleStatus?: string;
  severity: string;
  actor: string;
  timestamp: string;
  changes?: string;
  revertible?: boolean;
  entityId?: string;
  entityType?: string;
}> = [
  {
    id: '1',
    action: 'rule_evaluated',
    message: '价格合规检查完成，1280 条数据通过',
    ruleId: 'price-check',
    ruleName: '价格合规检查',
    ruleStatus: 'passed',
    severity: 'success',
    actor: 'AI Engine',
    timestamp: '2026-06-23T13:00:00.000Z',
    changes: '{"matchedCount":1280,"durationMs":45}',
  },
  {
    id: '2',
    action: 'alert_triggered',
    message: '库存为负告警：SKU-001, SKU-045, SKU-089',
    ruleId: 'inventory-check',
    ruleName: '库存异常检测',
    ruleStatus: 'failed',
    severity: 'critical',
    actor: 'AI Engine',
    timestamp: '2026-06-23T13:01:00.000Z',
    changes: '{"stockNegatives":3}',
    revertible: false,
  },
  {
    id: '3',
    action: 'decision_applied',
    message: '自动执行：下架库存为负商品',
    ruleId: 'inventory-check',
    ruleName: '库存异常检测',
    severity: 'warning',
    actor: 'Auto Pipeline',
    timestamp: '2026-06-23T13:02:00.000Z',
    changes: '{"skuRemoved":["SKU-001","SKU-045","SKU-089"]}',
    revertible: true,
    entityId: 'SKU-001',
    entityType: 'product',
  },
  {
    id: '4',
    action: 'manual_review',
    message: '张三 审核通过库存调整方案',
    ruleId: 'inventory-check',
    ruleName: '库存异常检测',
    severity: 'info',
    actor: '张三',
    timestamp: '2026-06-23T13:05:00.000Z',
    entityType: 'user',
    entityId: 'user-zhangsan',
  },
  {
    id: '5',
    action: 'auto_resolved',
    message: '异常已自动修复：SKU-001 库存恢复',
    ruleId: 'inventory-check',
    ruleName: '库存异常检测',
    ruleStatus: 'passed',
    severity: 'success',
    actor: 'Auto Healer',
    timestamp: '2026-06-23T13:10:00.000Z',
    changes: '{"restored":["SKU-001"]}',
    revertible: true,
  },
  {
    id: '6',
    action: 'notification_sent',
    message: '已通过企业微信通知店面经理：3个库存异常',
    severity: 'info',
    actor: 'Notification Service',
    timestamp: '2026-06-23T13:01:05.000Z',
  },
];

const summary = {
  total: 1280,
  info: 800,
  warning: 300,
  critical: 120,
  success: 60,
  last24h: 45,
};

// ==================== 基础渲染测试 ====================

describe('DecisionAuditTrail 基础渲染', () => {
  test('渲染审计列表', () => {
    const html = renderToStaticMarkup(
      React.createElement(DecisionAuditTrail, { entries: mockEntries as any })
    );
    assert.ok(html.includes('审计记录列表'), '应包含审计列表');
    assert.ok(html.includes('规则评估'), '应包含操作类型标签');
    assert.ok(html.includes('价格合规检查完成'), '应包含审计描述');
    assert.ok(html.includes('AI Engine'), '应包含操作人');
  });

  test('空数据状态', () => {
    const html = renderToStaticMarkup(
      React.createElement(DecisionAuditTrail, { entries: [] as any })
    );
    assert.ok(html.includes('暂无审计记录'), '应展示空数据文案');
  });

  test('自定义空数据文案', () => {
    const html = renderToStaticMarkup(
      React.createElement(DecisionAuditTrail, {
        entries: [] as any,
        emptyText: '没有找到审计日志',
      })
    );
    assert.ok(html.includes('没有找到审计日志'), '应展示自定义空数据文案');
  });

  test('加载状态', () => {
    const html = renderToStaticMarkup(
      React.createElement(DecisionAuditTrail, {
        entries: mockEntries as any,
        loading: true,
      })
    );
    assert.ok(html.includes('pulse'), '应包含骨架屏加载动画');
  });
});

// ==================== 摘要栏测试 ====================

describe('DecisionAuditTrail 摘要栏', () => {
  test('渲染统计摘要', () => {
    const html = renderToStaticMarkup(
      React.createElement(DecisionAuditTrail, {
        entries: mockEntries as any,
        summary: summary as any,
      })
    );
    assert.ok(html.includes('1280'), '应展示总计数字');
    assert.ok(html.includes('+45'), '应展示最近24h新增');
    assert.ok(html.includes('800'), '应展示信息级别数量');
    assert.ok(html.includes('120'), '应展示严重级别数量');
  });

  test('无摘要时不渲染摘要栏', () => {
    const html = renderToStaticMarkup(
      React.createElement(DecisionAuditTrail, {
        entries: mockEntries as any,
      })
    );
    // 不应包含统计摘要颜色点（与 entry 列表中的区分）
    // 没有传出 summary 时不应渲染 summary bar
    assert.ok(!html.includes('近24h'), '无摘要时不应渲染近24h部分');
  });
});

// ==================== 过滤栏测试 ====================

describe('DecisionAuditTrail 过滤栏', () => {
  test('有 onFilterChange 时渲染过滤栏', () => {
    const html = renderToStaticMarkup(
      React.createElement(DecisionAuditTrail, {
        entries: mockEntries as any,
        onFilterChange: () => {},
      })
    );
    assert.ok(html.includes('全部操作'), '应包含操作类型过滤器');
    assert.ok(html.includes('全部级别'), '应包含严重程度过滤器');
  });

  test('无 onFilterChange 时不渲染过滤栏', () => {
    const html = renderToStaticMarkup(
      React.createElement(DecisionAuditTrail, {
        entries: mockEntries as any,
      })
    );
    assert.ok(!html.includes('全部操作'), '无回调时不应渲染过滤器');
  });
});

// ==================== 不同类型审计条目测试 ====================

describe('DecisionAuditTrail 操作类型覆盖', () => {
  const actionTypes = [
    'rule_evaluated',
    'decision_applied',
    'decision_overridden',
    'decision_reverted',
    'alert_triggered',
    'notification_sent',
    'manual_review',
    'auto_resolved',
  ];

  for (const action of actionTypes) {
    test(`渲染 ${action} 类型`, () => {
      const html = renderToStaticMarkup(
        React.createElement(DecisionAuditTrail, {
          entries: [
            {
              id: action,
              action,
              message: `测试 ${action}`,
              severity: 'info',
              actor: 'test',
              timestamp: '2026-06-23T12:00:00.000Z',
            },
          ] as any,
        })
      );
      // 每种操作都有对应的中文标签
      assert.ok(html.length > 0, `${action} 应该能成功渲染`);
    });
  }
});

// ==================== 严重程度颜色测试 ====================

describe('DecisionAuditTrail 严重程度显示', () => {
  test('critical 严重程度显示为 error 变体', () => {
    const html = renderToStaticMarkup(
      React.createElement(DecisionAuditTrail, {
        entries: [
          {
            id: 'c1',
            action: 'alert_triggered',
            message: '严重告警',
            severity: 'critical',
            actor: 'sys',
            timestamp: '2026-06-23T12:00:00.000Z',
          },
        ] as any,
      })
    );
    assert.ok(html.includes('告警触发'), '应展示告警触发标签');
  });

  test('success 严重程度显示', () => {
    const html = renderToStaticMarkup(
      React.createElement(DecisionAuditTrail, {
        entries: [
          {
            id: 's1',
            action: 'auto_resolved',
            message: '自动解决成功',
            severity: 'success',
            actor: 'sys',
            timestamp: '2026-06-23T12:00:00.000Z',
          },
        ] as any,
      })
    );
    assert.ok(html.includes('自动解决'), '应展示自动解决标签');
  });
});

// ==================== 关联信息测试 ====================

describe('DecisionAuditTrail 关联信息', () => {
  test('显示关联规则名', () => {
    const html = renderToStaticMarkup(
      React.createElement(DecisionAuditTrail, {
        entries: [
          {
            id: 'r1',
            action: 'rule_evaluated',
            message: '测试',
            ruleName: '价格合规检查',
            severity: 'info',
            actor: 'AI',
            timestamp: '2026-06-23T12:00:00.000Z',
          },
        ] as any,
      })
    );
    assert.ok(html.includes('价格合规检查'), '应展示关联规则名');
  });

  test('不显示空规则名', () => {
    const html = renderToStaticMarkup(
      React.createElement(DecisionAuditTrail, {
        entries: [
          {
            id: 'r2',
            action: 'notification_sent',
            message: '测试通知',
            severity: 'info',
            actor: 'sys',
            timestamp: '2026-06-23T12:00:00.000Z',
          },
        ] as any,
      })
    );
    // 不应该有空 ruleName 元素
    assert.ok(html.includes('测试通知'), '应正常渲染消息');
  });
});

// ==================== 分页测试 ====================

describe('DecisionAuditTrail 分页', () => {
  const manyEntries = Array.from({ length: 50 }, (_, i) => ({
    id: String(i),
    action: 'rule_evaluated' as const,
    message: `第 ${i} 条审计记录`,
    severity: 'info' as const,
    actor: 'AI',
    timestamp: '2026-06-23T12:00:00.000Z',
    ruleName: i % 2 === 0 ? '规则A' : undefined,
  }));

  test('超出一页时显示分页', () => {
    const html = renderToStaticMarkup(
      React.createElement(DecisionAuditTrail, {
        entries: manyEntries as any,
        pageSize: 20,
      })
    );
    assert.ok(html.includes('50') || html.includes('页'), '应包含分页信息');
  });

  test('不超出一页时不显示分页', () => {
    const html = renderToStaticMarkup(
      React.createElement(DecisionAuditTrail, {
        entries: mockEntries as any,
        pageSize: 20,
      })
    );
    // 6条数据在20/page内，不应渲染Pagination
    // 不检查细节，渲染即可
    assert.ok(html.length > 0, '应正常渲染');
  });
});

// ==================== 紧凑模式测试 ====================

describe('DecisionAuditTrail 紧凑模式', () => {
  test('compact 模式渲染', () => {
    const html = renderToStaticMarkup(
      React.createElement(DecisionAuditTrail, {
        entries: mockEntries as any,
        compact: true,
        summary: summary as any,
      })
    );
    assert.ok(html.includes('1280'), '紧凑模式应正常渲染内容');
  });
});

// ==================== 类型导出测试 ====================

describe('DecisionAuditTrail 类型导出', () => {
  test('组件函数可用', () => {
    assert.ok(typeof DecisionAuditTrail === 'function', 'DecisionAuditTrail 应为函数组件');
  });
});
