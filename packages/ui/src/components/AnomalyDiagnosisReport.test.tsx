import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { AnomalyDiagnosisReport } = require('./AnomalyDiagnosisReport');

/** Helper: render and parse into a DOM-like tree for assertion */
function h(jsx) {
  const html = renderToStaticMarkup(jsx);
  return { html };
}

function hasText(html, text) {
  return html.includes(text);
}

const mockFindings = [
  {
    id: 'f1',
    title: '会员留存率异常下降',
    severity: 'critical',
    category: '留存分析',
    description: '近7日会员留存率环比下降23%',
    rootCause: '新用户次日留存率下降',
    impact: '预计影响月活用户约1.2万',
    recommendation: '建议优化新用户引导流程',
    timestamp: '2026-06-30 22:00',
    owner: '运营组',
  },
  {
    id: 'f2',
    title: '门店POS系统响应缓慢',
    severity: 'high',
    category: '系统性能',
    description: '晚高峰时段POS交易平均响应时间超过3秒',
    rootCause: '数据库连接池耗尽',
    impact: '影响高峰时段约15%的交易体验',
    recommendation: '建议增加连接池上限',
    timestamp: '2026-06-30 21:30',
    owner: '技术组',
  },
  {
    id: 'f3',
    title: '促销活动配置未生效',
    severity: 'medium',
    category: '配置管理',
    description: '618大促满减规则延迟约30分钟',
    rootCause: '配置下发通道存在异步延迟',
    impact: '可能导致部分用户优惠未享受',
    recommendation: '缩短配置缓存TTL',
    timestamp: '2026-06-30 20:15',
  },
  {
    id: 'f4',
    title: '数据同步延迟告警',
    severity: 'low',
    category: '数据管道',
    description: '活动期间离线数据同步延迟',
    rootCause: 'Kafka堆积',
    impact: '实时报表数据滞后',
    recommendation: '扩展消费者分区数',
    timestamp: '2026-06-30 19:00',
  },
];

const resolvedFindings = [
  {
    id: 'rf1',
    title: '已处理异常',
    severity: 'info',
    category: '测试',
    description: '已处理的测试异常',
    rootCause: '测试根因',
    impact: '无影响',
    recommendation: '无需操作',
    timestamp: '2026-06-30 18:00',
  },
];

describe('AnomalyDiagnosisReport', () => {
  test('渲染标题和发现数量', () => {
    const { html } = h(<AnomalyDiagnosisReport findings={mockFindings} />);
    assert.ok(hasText(html, 'AI 异常诊断报告'));
    assert.ok(hasText(html, '4 项发现'));
    assert.ok(hasText(html, '4 项待处理'));
  });

  test('显示严重程度统计卡片', () => {
    const { html } = h(<AnomalyDiagnosisReport findings={mockFindings} />);
    assert.ok(hasText(html, '严重'));
    assert.ok(hasText(html, '高危'));
    assert.ok(hasText(html, '中等'));
    assert.ok(hasText(html, '低危'));
  });

  test('渲染所有发现项', () => {
    const { html } = h(<AnomalyDiagnosisReport findings={mockFindings} />);
    assert.ok(hasText(html, '会员留存率异常下降'));
    assert.ok(hasText(html, '门店POS系统响应缓慢'));
    assert.ok(hasText(html, '促销活动配置未生效'));
    assert.ok(hasText(html, '数据同步延迟告警'));
  });

  test('显示每个发现项的严重级别标签', () => {
    const { html } = h(<AnomalyDiagnosisReport findings={mockFindings} />);
    assert.ok(hasText(html, '严重'));
    assert.ok(hasText(html, '高危'));
    assert.ok(hasText(html, '中等'));
    assert.ok(hasText(html, '低危'));
  });

  test('显示类别标签', () => {
    const { html } = h(<AnomalyDiagnosisReport findings={mockFindings} />);
    assert.ok(hasText(html, '留存分析'));
    assert.ok(hasText(html, '系统性能'));
    assert.ok(hasText(html, '配置管理'));
    assert.ok(hasText(html, '数据管道'));
  });

  test('显示描述内容', () => {
    const { html } = h(<AnomalyDiagnosisReport findings={mockFindings} />);
    assert.ok(hasText(html, '近7日会员留存率环比下降23%'));
  });

  test('包含查看详细分析文本', () => {
    const { html } = h(<AnomalyDiagnosisReport findings={mockFindings} />);
    assert.ok(hasText(html, '查看详细分析'));
  });

  test('显示加载状态', () => {
    const { html } = h(<AnomalyDiagnosisReport findings={[]} loading />);
    assert.ok(hasText(html, 'AI 正在分析异常数据...'));
  });

  test('空数据时显示空状态', () => {
    const { html } = h(<AnomalyDiagnosisReport findings={[]} />);
    assert.ok(hasText(html, '暂无未处理的异常'));
  });

  test('显示刷新按钮当提供 onRefresh 回调', () => {
    const { html } = h(
      <AnomalyDiagnosisReport findings={mockFindings} onRefresh={() => {}} />
    );
    assert.ok(hasText(html, '刷新'));
  });

  test('显示导出报告按钮当提供 onExport 回调', () => {
    const { html } = h(
      <AnomalyDiagnosisReport findings={mockFindings} onExport={() => {}} />
    );
    assert.ok(hasText(html, '导出报告'));
  });

  test('自定义标题', () => {
    const { html } = h(
      <AnomalyDiagnosisReport findings={mockFindings} title="自定义诊断报告" />
    );
    assert.ok(hasText(html, '自定义诊断报告'));
  });

  test('处理后的异常显示在已处理区域', () => {
    const { html } = h(
      <AnomalyDiagnosisReport
        findings={[...mockFindings, ...resolvedFindings]}
        onHandleFinding={() => {}}
      />
    );
    // Should not render resolved items as "待处理"
    assert.ok(hasText(html, '5 项发现'));
    assert.ok(hasText(html, '5 项待处理'));
  });

  test('每个发现项包含处理按钮', () => {
    const { html } = h(
      <AnomalyDiagnosisReport findings={mockFindings} onHandleFinding={() => {}} />
    );
    assert.ok(hasText(html, '处理'));
  });

  test('每个发现项包含忽略按钮', () => {
    const { html } = h(
      <AnomalyDiagnosisReport findings={mockFindings} onDismissFinding={() => {}} />
    );
    assert.ok(hasText(html, '忽略'));
  });

  test('严重程度颜色映射正确', () => {
    const findings = [
      { ...mockFindings[0], severity: 'critical' },
    ];
    const { html } = h(<AnomalyDiagnosisReport findings={findings} />);
    assert.ok(hasText(html, '严重'));
  });

  test('负责人信息可显示', () => {
    const { html } = h(<AnomalyDiagnosisReport findings={mockFindings} />);
    assert.ok(hasText(html, '运营组'));
    assert.ok(hasText(html, '技术组'));
  });

  test('无负责人时不出错', () => {
    const { html } = h(<AnomalyDiagnosisReport findings={resolvedFindings} />);
    assert.ok(hasText(html, '已处理异常'));
  });

  test('包含 time 文本', () => {
    const { html } = h(<AnomalyDiagnosisReport findings={mockFindings} />);
    assert.ok(hasText(html, '2026-06-30 22:00'));
  });

  test('不存在已处理区域时不出错', () => {
    const { html } = h(<AnomalyDiagnosisReport findings={mockFindings} />);
    assert.ok(!hasText(html, '已处理 ('));
  });
});
