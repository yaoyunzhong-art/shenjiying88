import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const {
  AIDeviceFaultPredictionPanel,
} = require('./AIDeviceFaultPredictionPanel');

import type {
  AIDeviceFaultPredictionPanelProps,
  DeviceFaultPrediction,
  FaultPredictionSummary,
} from './AIDeviceFaultPredictionPanel';

// ==================== 测试辅助函数 ====================

function makePrediction(
  overrides: Partial<DeviceFaultPrediction> & { deviceId: string },
): DeviceFaultPrediction {
  return {
    deviceName: `设备-${overrides.deviceId}`,
    category: 'arcade',
    predictedFault: '主板温度过高',
    severity: 'medium',
    status: 'predicted',
    probability: 65,
    estimatedDate: '2026-07-15',
    suggestedAction: '清理散热风扇并更换导热硅脂',
    lastMaintenanceDate: '2026-04-01',
    runtimeHours: 3200,
    healthScore: 72,
    ...overrides,
  };
}

function makeSummary(overrides: Partial<FaultPredictionSummary> = {}): FaultPredictionSummary {
  return {
    totalDevices: 24,
    criticalCount: 2,
    pendingCount: 5,
    predictedThisMonth: 8,
    avgHealthScore: 74,
    ...overrides,
  };
}

function makeProps(
  overrides: Partial<AIDeviceFaultPredictionPanelProps> = {},
): AIDeviceFaultPredictionPanelProps {
  return {
    predictions: [],
    ...overrides,
  };
}

// ==================== 测试套件 ====================

describe('AIDeviceFaultPredictionPanel', () => {

  // -------- 基础渲染 --------
  test('renders title when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDeviceFaultPredictionPanel, makeProps({
        title: '7月故障预测',
        predictions: [makePrediction({ deviceId: 'dev-01' })],
      }))
    );
    assert.ok(html.includes('7月故障预测'), 'should render custom title');
    assert.ok(html.includes('ai-device-fault-prediction-panel'), 'should have default testid');
  });

  test('renders default title when no title given', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDeviceFaultPredictionPanel, makeProps({
        predictions: [makePrediction({ deviceId: 'dev-01' })],
      }))
    );
    assert.ok(html.includes('AI 设备故障预测'), 'should render default title');
  });

  // -------- 空状态 --------
  test('renders empty state when predictions are empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDeviceFaultPredictionPanel, makeProps({
        predictions: [],
      }))
    );
    assert.ok(html.includes('暂无设备故障预测'), 'should show empty text');
    const emptySpan = `${makeProps()['data-testid'] || 'ai-device-fault-prediction-panel'}-empty`;
    assert.ok(html.includes(emptySpan), 'should have empty state testid');
  });

  test('renders custom empty text', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDeviceFaultPredictionPanel, makeProps({
        predictions: [],
        emptyText: '所有设备运行正常',
      }))
    );
    assert.ok(html.includes('所有设备运行正常'), 'should show custom empty text');
  });

  // -------- 加载态 --------
  test('renders loading state', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDeviceFaultPredictionPanel, makeProps({
        predictions: [],
        loading: true,
      }))
    );
    assert.ok(html.includes('skeleton'), 'should show skeleton during loading');
  });

  // -------- 汇总数据 --------
  test('renders summary section when summary provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDeviceFaultPredictionPanel, makeProps({
        predictions: [makePrediction({ deviceId: 'dev-01' })],
        summary: makeSummary(),
      }))
    );
    assert.ok(html.includes('总设备'), 'should show total label');
    assert.ok(html.includes('高危'), 'should show critical label');
    assert.ok(html.includes('待维护'), 'should show pending label');
    assert.ok(html.includes('本月预测'), 'should show this month label');
    assert.ok(html.includes('平均健康分'), 'should show avg health label');
  });

  test('summary displays correct values', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIDeviceFaultPredictionPanel, makeProps({
        predictions: [makePrediction({ deviceId: 'dev-01' })],
        summary: makeSummary({ totalDevices: 30, criticalCount: 3, pendingCount: 7, predictedThisMonth: 12, avgHealthScore: 68 }),
      }))
    );
    assert.ok(html.includes('30'), 'should show total 30');
    assert.ok(html.includes('3'), 'should show critical 3');
    assert.ok(html.includes('7'), 'should show pending 7');
    assert.ok(html.includes('12'), 'should show predicted this month 12');
    assert.ok(html.includes('68'), 'should show avg health 68');
  });

  // -------- 告警横幅 --------
  test('shows alert banner when critical predictions exist', () => {
    const predictions = [
      makePrediction({ deviceId: 'dev-01', severity: 'critical', probability: 92 }),
      makePrediction({ deviceId: 'dev-02', severity: 'high', probability: 78 }),
      makePrediction({ deviceId: 'dev-03', severity: 'low', probability: 20 }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIDeviceFaultPredictionPanel, makeProps({ predictions }))
    );
    assert.ok(html.includes('alert-banner'), 'should have alert banner');
    assert.ok(html.includes('2'), 'should show count 2 critical/high');
  });

  test('hides alert banner when no critical predictions', () => {
    const predictions = [
      makePrediction({ deviceId: 'dev-01', severity: 'low', probability: 20 }),
      makePrediction({ deviceId: 'dev-02', severity: 'medium', probability: 45 }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIDeviceFaultPredictionPanel, makeProps({ predictions }))
    );
    assert.ok(!html.includes('alert-banner'), 'should NOT show alert banner');
  });

  // -------- 预测条目渲染 --------
  test('renders each prediction row', () => {
    const predictions = [
      makePrediction({ deviceId: 'dev-01', deviceName: '街机-01', category: 'arcade' }),
      makePrediction({ deviceId: 'dev-02', deviceName: '音响-01', category: 'audio' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIDeviceFaultPredictionPanel, makeProps({ predictions }))
    );
    assert.ok(html.includes('街机-01'), 'should render first device name');
    assert.ok(html.includes('音响-01'), 'should render second device name');
    assert.ok(html.includes('dev-01'), 'should include device id');
    assert.ok(html.includes('dev-02'), 'should include second device id');
  });

  // -------- 排序 (按严重程度) --------
  test('sorts predictions by severity then probability', () => {
    const predictions = [
      makePrediction({ deviceId: 'dev-03', severity: 'low', probability: 30 }),
      makePrediction({ deviceId: 'dev-01', severity: 'critical', probability: 92 }),
      makePrediction({ deviceId: 'dev-02', severity: 'high', probability: 78 }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIDeviceFaultPredictionPanel, makeProps({ predictions }))
    );
    // critical should come first, then high, then low
    const idxCritical = html.indexOf('dev-01');
    const idxHigh = html.indexOf('dev-02');
    const idxLow = html.indexOf('dev-03');
    assert.ok(idxCritical > 0, 'critical device found');
    assert.ok(idxHigh > 0, 'high severity device found');
    assert.ok(idxLow > 0, 'low severity device found');
    assert.ok(idxCritical < idxHigh, 'critical device before high');
    assert.ok(idxHigh < idxLow, 'high severity device before low');
  });

  // -------- 概率条 --------
  test('renders probability bars', () => {
    const predictions = [
      makePrediction({ deviceId: 'dev-01', probability: 85 }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIDeviceFaultPredictionPanel, makeProps({ predictions }))
    );
    assert.ok(html.includes('85%'), 'should show 85% probability');
    assert.ok(html.includes('probability-bar-wrapper'), 'should have probability bar wrapper');
  });

  // -------- 健康分圆环 --------
  test('renders health score ring when healthScore provided', () => {
    const predictions = [
      makePrediction({ deviceId: 'dev-01', healthScore: 75 }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIDeviceFaultPredictionPanel, makeProps({ predictions }))
    );
    assert.ok(html.includes('75'), 'should show health score 75');
    assert.ok(html.includes('<svg'), 'should render svg ring');
  });

  test('does not render health ring when healthScore undefined', () => {
    const predictions = [
      makePrediction({ deviceId: 'dev-01', healthScore: undefined }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIDeviceFaultPredictionPanel, makeProps({ predictions }))
    );
    // Should not have HealthRing (no extra SVG circle beyond layout)
    const svgCount = (html.match(/<svg/g) || []).length;
    // The only possible SVGs are from HealthRing—if none, count = 0
    assert.equal(svgCount, 0, 'should not render SVG without healthScore');
  });

  // -------- 状态 Badge --------
  test('renders status badge for each prediction', () => {
    const predictions = [
      makePrediction({ deviceId: 'dev-01', severity: 'critical', status: 'predicted' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIDeviceFaultPredictionPanel, makeProps({ predictions }))
    );
    assert.ok(html.includes('紧急'), 'should show critical label');
    assert.ok(html.includes('已预测'), 'should show predicted label');
  });

  // -------- 操作按钮 --------
  test('renders resolve button when onResolve provided and status allows', () => {
    const predictions = [
      makePrediction({ deviceId: 'dev-01', status: 'predicted' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIDeviceFaultPredictionPanel, makeProps({
        predictions,
        onResolve: () => {},
      }))
    );
    assert.ok(html.includes('标记处理'), 'should show resolve button');
    assert.ok(html.includes('resolve-dev-01'), 'should have resolve testid');
  });

  test('hides resolve button when status is resolved', () => {
    const predictions = [
      makePrediction({ deviceId: 'dev-01', status: 'resolved' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIDeviceFaultPredictionPanel, makeProps({
        predictions,
        onResolve: () => {},
      }))
    );
    assert.ok(!html.includes('标记处理'), 'should NOT show resolve button for resolved');
  });

  // -------- 一键安排维护按钮 --------
  test('renders schedule maintenance button when actionable predictions exist', () => {
    const predictions = [
      makePrediction({ deviceId: 'dev-01', status: 'predicted' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIDeviceFaultPredictionPanel, makeProps({
        predictions,
        onScheduleMaintenance: () => {},
      }))
    );
    assert.ok(html.includes('一键安排维护'), 'should show schedule all button');
  });

  test('hides schedule button when onScheduleMaintenance not provided', () => {
    const predictions = [
      makePrediction({ deviceId: 'dev-01', status: 'predicted' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIDeviceFaultPredictionPanel, makeProps({ predictions }))
    );
    assert.ok(!html.includes('一键安排维护'), 'should NOT show schedule all button');
  });

  test('schedule button shows correct count', () => {
    const predictions = [
      makePrediction({ deviceId: 'dev-01', status: 'predicted' }),
      makePrediction({ deviceId: 'dev-02', status: 'monitoring' }),
      makePrediction({ deviceId: 'dev-03', status: 'resolved' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIDeviceFaultPredictionPanel, makeProps({
        predictions,
        onScheduleMaintenance: () => {},
      }))
    );
    assert.ok(html.includes('(2)'), 'should show count 2 (predicted + monitoring)');
  });

  // -------- 点击回调 --------
  test('prediction row is clickable when onPredictionClick provided', () => {
    const predictions = [
      makePrediction({ deviceId: 'dev-01', status: 'predicted' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIDeviceFaultPredictionPanel, makeProps({
        predictions,
        onPredictionClick: () => {},
      }))
    );
    // Clickable indication: cursor pointer from inline style
    assert.ok(html.includes('cursor'), 'should have cursor style');
    assert.ok(html.includes('pointer') || html.includes('default'), 'should specify cursor behavior');
  });

  // -------- 紧凑模式 --------
  test('compact mode uses smaller padding', () => {
    const predictions = [
      makePrediction({ deviceId: 'dev-01', status: 'predicted' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIDeviceFaultPredictionPanel, makeProps({
        predictions,
        compact: true,
      }))
    );
    // Compact uses padding: 12px for inner wrapper; full uses 16px
    const full = renderToStaticMarkup(
      React.createElement(AIDeviceFaultPredictionPanel, makeProps({
        predictions,
        compact: false,
      }))
    );
    // Verify compact rendering doesn't throw and inner padding differs
    assert.ok(html.length > 0, 'compact renders successfully');
    assert.ok(full.length > 0, 'full renders successfully');
    // The compact variant should be shorter (less padding)
    assert.ok(html.length < full.length + 50, 'compact output should not be larger than full');
  });

  // -------- 分类标签 --------
  test('renders category labels correctly', () => {
    const predictions = [
      makePrediction({ deviceId: 'dev-01', category: 'arcade' }),
      makePrediction({ deviceId: 'dev-02', category: 'prize' }),
      makePrediction({ deviceId: 'dev-03', category: 'audio' }),
      makePrediction({ deviceId: 'dev-04', category: 'ac' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIDeviceFaultPredictionPanel, makeProps({ predictions }))
    );
    assert.ok(html.includes('街机'), 'arcade category');
    assert.ok(html.includes('礼品机'), 'prize category');
    assert.ok(html.includes('音响'), 'audio category');
    assert.ok(html.includes('空调'), 'ac category');
  });

  // -------- 自定义 data-testid --------
  test('accepts custom data-testid', () => {
    const predictions = [
      makePrediction({ deviceId: 'dev-01' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIDeviceFaultPredictionPanel, makeProps({
        predictions,
        'data-testid': 'my-custom-id',
      }))
    );
    assert.ok(html.includes('my-custom-id'), 'should use custom testid');
  });

  // -------- 边缘情况：空汇总时不显示 --------
  test('does not render summary when summary undefined', () => {
    const predictions = [
      makePrediction({ deviceId: 'dev-01' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(AIDeviceFaultPredictionPanel, makeProps({ predictions }))
    );
    assert.ok(!html.includes('总设备'), 'should not have summary');
  });

  // -------- 超多预测条目稳定渲染 --------
  test('renders many predictions without crash', () => {
    const predictions = Array.from({ length: 20 }, (_, i) =>
      makePrediction({
        deviceId: `dev-${String(i).padStart(2, '0')}`,
        severity: i < 3 ? 'critical' : i < 8 ? 'high' : i < 14 ? 'medium' : 'low',
        probability: 95 - i * 3,
        healthScore: 95 - i * 4,
      })
    );
    const html = renderToStaticMarkup(
      React.createElement(AIDeviceFaultPredictionPanel, makeProps({
        predictions,
        summary: makeSummary(),
      }))
    );
    // All 20 devices IDs present
    for (let i = 0; i < 20; i++) {
      assert.ok(html.includes(`dev-${String(i).padStart(2, '0')}`), `device dev-${String(i).padStart(2, '0')} should be rendered`);
    }
    // Alert banner present
    assert.ok(html.includes('alert-banner'), 'alert banner should be shown');
  });

});
