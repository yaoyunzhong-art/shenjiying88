import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { PortalConsumerGovernanceSection } = require('./PortalConsumerGovernanceSection');

describe('PortalConsumerGovernanceSection', () => {
  const defaultProps = {
    deliverySummary: '交付摘要内容',
    responsibility: '责任人：张三',
    detailLines: ['明细行1', '明细行2'],
    governanceCodes: ['GOV-001', 'GOV-002', 'GOV-003'],
    governanceSummary: '治理摘要说明',
    linkedOverview: React.createElement('div', { key: 'overview' }, '关联概览'),
    runtimePanel: React.createElement('div', { key: 'runtime' }, '运行时面板'),
  };

  test('renders with default props and all sections', () => {
    const html = renderToStaticMarkup(
      React.createElement(PortalConsumerGovernanceSection, defaultProps)
    );

    assert.ok(html.includes('Contract Consumer'), 'should render default title');
    assert.ok(html.includes('交付摘要内容'), 'should render deliverySummary');
    assert.ok(html.includes('责任人：张三'), 'should render responsibility');
    assert.ok(html.includes('明细行1'), 'should render detailLine 1');
    assert.ok(html.includes('明细行2'), 'should render detailLine 2');
    assert.ok(html.includes('GOV-001 / GOV-002 / GOV-003'), 'should render governance codes joined');
    assert.ok(html.includes('治理摘要说明'), 'should render governanceSummary');
    assert.ok(html.includes('关联概览'), 'should render linkedOverview');
    assert.ok(html.includes('运行时面板'), 'should render runtimePanel');
  });

  test('renders with custom title', () => {
    const html = renderToStaticMarkup(
      React.createElement(PortalConsumerGovernanceSection, {
        ...defaultProps,
        title: '自定义消费者',
      })
    );

    assert.ok(html.includes('自定义消费者'), 'should render custom title');
    assert.ok(!html.includes('Contract Consumer'), 'should not render default title');
  });

  test('renders with custom colors', () => {
    const html = renderToStaticMarkup(
      React.createElement(PortalConsumerGovernanceSection, {
        ...defaultProps,
        titleColor: '#ff0000',
        primaryTextColor: '#00ff00',
        secondaryTextColor: '#0000ff',
        summaryTextColor: '#ffff00',
      })
    );

    assert.ok(html.includes('#ff0000'), 'should use custom titleColor');
    assert.ok(html.includes('#00ff00'), 'should use custom primaryTextColor');
    assert.ok(html.includes('#0000ff'), 'should use custom secondaryTextColor');
    assert.ok(html.includes('#ffff00'), 'should use custom summaryTextColor');
  });

  test('renders without optional detailLines', () => {
    const html = renderToStaticMarkup(
      React.createElement(PortalConsumerGovernanceSection, {
        deliverySummary: 'minimal summary',
        responsibility: 'minimal resp',
        governanceCodes: ['GOV-001'],
        governanceSummary: 'minimal governance',
        linkedOverview: null,
      })
    );

    assert.ok(html.includes('minimal summary'), 'should render minimal deliverySummary');
    assert.ok(html.includes('GOV-001'), 'should render single governance code');
    assert.ok(html.includes('minimal governance'), 'should render governanceSummary');
  });

  test('renders without runtimePanel', () => {
    const html = renderToStaticMarkup(
      React.createElement(PortalConsumerGovernanceSection, {
        deliverySummary: 'no runtime',
        responsibility: 'resp',
        governanceCodes: ['GOV-001'],
        governanceSummary: 'gov summary',
        linkedOverview: React.createElement('span', null, 'overview'),
        runtimePanel: undefined,
      })
    );

    assert.ok(html.includes('no runtime'), 'should render without runtimePanel');
    assert.ok(!html.includes('运行时面板'), 'should not have runtime content');
  });

  test('applies custom panelStyle', () => {
    const html = renderToStaticMarkup(
      React.createElement(PortalConsumerGovernanceSection, {
        ...defaultProps,
        panelStyle: { backgroundColor: '#111111', borderRadius: 8 },
      })
    );

    assert.ok(html.includes('#111111'), 'should apply custom panelStyle');
  });

  test('renders empty governanceCodes as empty string', () => {
    const html = renderToStaticMarkup(
      React.createElement(PortalConsumerGovernanceSection, {
        deliverySummary: 'empty codes',
        responsibility: 'resp',
        governanceCodes: [],
        governanceSummary: 'gov',
        linkedOverview: null,
      })
    );

    // governanceCodes array join with empty separator produces empty string
    assert.ok(html.includes('Governance：'), 'should render governance label');
  });

  test('renders detailLines list correctly', () => {
    const lines = ['第一行', '第二行', '第三行'];
    const html = renderToStaticMarkup(
      React.createElement(PortalConsumerGovernanceSection, {
        ...defaultProps,
        detailLines: lines,
      })
    );

    lines.forEach((line) => {
      assert.ok(html.includes(line), `should render detailLine: ${line}`);
    });
  });
});
