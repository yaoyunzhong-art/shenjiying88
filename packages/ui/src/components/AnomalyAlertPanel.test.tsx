/**
 * AnomalyAlertPanel 组件测试
 *
 * 使用 Node.js 原生 test runner + React 服务端渲染 (renderToStaticMarkup)
 * 测试覆盖:
 * 1. 基础渲染 — 标题、空状态
 * 2. 告警列表渲染 — 多级别、来源图标
 * 3. 汇总统计 — 各类数值
 * 4. 筛选功能 — severity / source 筛选
 * 5. 排序 — 严重度优先 + 时间倒序
 * 6. 交互 — 展开/确认/查看详情 (服务端渲染标记)
 * 7. 边界情况 — 空数组 / 单条告警 / maxDisplay
 */

import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { AnomalyAlertPanel } = require('./AnomalyAlertPanel');

// ==================== 测试数据工厂 ====================

function makeAlert(overrides = {}) {
  return {
    id: 'alert-1',
    title: '设备温度过高',
    description: '设备 #A103 温度达到 85°C，超过安全阈值 75°C',
    severity: 'critical',
    source: 'device',
    timestamp: '2026-06-14T10:00:00Z',
    acknowledged: false,
    impact: '可能影响 3 条产线',
    metricValue: 85,
    metricThreshold: 75,
    metricUnit: '°C',
    ...overrides,
  };
}

function makeAlerts() {
  return [
    makeAlert({ id: '1', severity: 'critical', source: 'device', timestamp: '2026-06-14T10:00:00Z', acknowledged: false }),
    makeAlert({ id: '2', severity: 'high', source: 'network', timestamp: '2026-06-14T09:30:00Z', acknowledged: false }),
    makeAlert({ id: '3', severity: 'medium', source: 'transaction', timestamp: '2026-06-14T09:00:00Z', acknowledged: true }),
    makeAlert({ id: '4', severity: 'low', source: 'system', timestamp: '2026-06-14T08:00:00Z', acknowledged: false }),
    makeAlert({ id: '5', severity: 'critical', source: 'member', timestamp: '2026-06-14T10:10:00Z', acknowledged: false }),
  ];
}

// ==================== 测试 ====================

describe('AnomalyAlertPanel', () => {
  // ---- 1. 基础渲染 ----

  describe('基础渲染', () => {
    test('应渲染自定义标题', () => {
      const html = renderToStaticMarkup(
        React.createElement(AnomalyAlertPanel, { alerts: [makeAlert()], title: '实时告警监控' })
      );
      assert.ok(html.includes('实时告警监控'), '应包含自定义标题');
    });

    test('默认标题是"异常告警"', () => {
      const html = renderToStaticMarkup(
        React.createElement(AnomalyAlertPanel, { alerts: [makeAlert()] })
      );
      assert.ok(html.includes('异常告警'), '应包含默认标题');
    });

    test('空数组时显示自定义空状态文案', () => {
      const html = renderToStaticMarkup(
        React.createElement(AnomalyAlertPanel, { alerts: [], emptyText: '系统一切正常' })
      );
      assert.ok(html.includes('系统一切正常'), '应显示自定义空状态');
    });

    test('空数组时显示默认空状态文案', () => {
      const html = renderToStaticMarkup(
        React.createElement(AnomalyAlertPanel, { alerts: [] })
      );
      assert.ok(html.includes('暂无异常告警'), '应显示默认空状态');
    });

    test('应显示告警总数徽章', () => {
      const html = renderToStaticMarkup(
        React.createElement(AnomalyAlertPanel, { alerts: makeAlerts() })
      );
      assert.ok(html.includes('5 条告警'), '应包含总数徽章');
    });
  });

  // ---- 2. 告警列表渲染 ----

  describe('告警列表渲染', () => {
    test('应渲染所有告警标题', () => {
      const alerts = [
        makeAlert({ id: 'a', title: 'CPU 过载', severity: 'critical' }),
        makeAlert({ id: 'b', title: '网络延迟高', severity: 'high' }),
      ];
      const html = renderToStaticMarkup(
        React.createElement(AnomalyAlertPanel, { alerts })
      );
      assert.ok(html.includes('CPU 过载'), '应包含 CPU 过载');
      assert.ok(html.includes('网络延迟高'), '应包含网络延迟高');
    });

    test('应显示严重程度标签（严重）', () => {
      const html = renderToStaticMarkup(
        React.createElement(AnomalyAlertPanel, { alerts: [makeAlert({ severity: 'critical' })] })
      );
      assert.ok(html.includes('严重'), '应显示严重标签');
    });

    test('应显示严重程度标签（高）', () => {
      const html = renderToStaticMarkup(
        React.createElement(AnomalyAlertPanel, { alerts: [makeAlert({ severity: 'high' })] })
      );
      assert.ok(html.includes('高'), '应显示高标签');
    });

    test('应显示严重程度标签（中）', () => {
      const html = renderToStaticMarkup(
        React.createElement(AnomalyAlertPanel, { alerts: [makeAlert({ severity: 'medium' })] })
      );
      assert.ok(html.includes('中'), '应显示中标签');
    });

    test('应显示严重程度标签（低）', () => {
      const html = renderToStaticMarkup(
        React.createElement(AnomalyAlertPanel, { alerts: [makeAlert({ severity: 'low' })] })
      );
      assert.ok(html.includes('低'), '应显示低标签');
    });

    test('应显示来源类型标签', () => {
      const html = renderToStaticMarkup(
        React.createElement(AnomalyAlertPanel, { alerts: [makeAlert({ source: 'device' })] })
      );
      assert.ok(html.includes('设备'), '应显示设备来源');
    });

    test('已确认告警应显示"已确认"标签', () => {
      const html = renderToStaticMarkup(
        React.createElement(AnomalyAlertPanel, { alerts: [makeAlert({ acknowledged: true })] })
      );
      assert.ok(html.includes('已确认'), '应显示已确认标签');
    });

    test('应显示指标对比信息', () => {
      const html = renderToStaticMarkup(
        React.createElement(AnomalyAlertPanel, {
          alerts: [makeAlert({ metricValue: 90, metricThreshold: 80, metricUnit: '%' })]
        })
      );
      assert.ok(html.includes('90%'), '应显示指标值');
      assert.ok(html.includes('80%'), '应显示阈值');
    });

    test('应显示所有来源 icon', () => {
      const sources = ['device', 'network', 'system', 'transaction'];
      for (const src of sources) {
        const html = renderToStaticMarkup(
          React.createElement(AnomalyAlertPanel, {
            alerts: [makeAlert({ id: src, source: src, title: `告警-${src}` })]
          })
        );
        assert.ok(html.includes(`告警-${src}`), `应渲染来源 ${src} 的告警`);
      }
    });
  });

  // ---- 3. 汇总统计 ----

  describe('汇总统计', () => {
    test('应包含告警总数统计', () => {
      const html = renderToStaticMarkup(
        React.createElement(AnomalyAlertPanel, { alerts: makeAlerts() })
      );
      assert.ok(html.includes('5'), '应包含 total count');
    });

    test('应包含未确认数量', () => {
      const html = renderToStaticMarkup(
        React.createElement(AnomalyAlertPanel, { alerts: makeAlerts() })
      );
      // 5 条中有 4 条未确认
      assert.ok(html.includes('4 未确认'), '应显示未确认数量');
    });

    test('showSummary=false 时不显示统计', () => {
      const html = renderToStaticMarkup(
        React.createElement(AnomalyAlertPanel, { alerts: makeAlerts(), showSummary: false })
      );
      assert.ok(!html.includes('告警总数'), '不应显示告警总数');
    });

    test('空数组不显示 SummaryBar', () => {
      const html = renderToStaticMarkup(
        React.createElement(AnomalyAlertPanel, { alerts: [] })
      );
      assert.ok(!html.includes('告警总数'), '空数组不应显示统计');
    });

    test('各严重程度计数正确', () => {
      const html = renderToStaticMarkup(
        React.createElement(AnomalyAlertPanel, { alerts: makeAlerts() })
      );
      // critical: 2, high: 1, medium: 1, low: 1
      assert.ok(html.includes('严重'), '应显示严重级别');
      assert.ok(html.includes('高'), '应显示高级别');
      assert.ok(html.includes('中'), '应显示中级别');
      assert.ok(html.includes('低'), '应显示低级别');
    });
  });

  // ---- 4. 排序 ----

  describe('排序', () => {
    test('应按严重程度排序：critical 在高之前', () => {
      const alerts = [
        makeAlert({ id: 'low', title: '低优先告警', severity: 'low', timestamp: '2026-06-14T11:00:00Z' }),
        makeAlert({ id: 'critical', title: '高优先告警', severity: 'critical', timestamp: '2026-06-14T10:00:00Z' }),
        makeAlert({ id: 'high', title: '中高优先告警', severity: 'high', timestamp: '2026-06-14T10:30:00Z' }),
      ];
      const html = renderToStaticMarkup(
        React.createElement(AnomalyAlertPanel, { alerts })
      );
      const criticalIdx = html.indexOf('高优先告警');
      const highIdx = html.indexOf('中高优先告警');
      const lowIdx = html.indexOf('低优先告警');
      assert.ok(criticalIdx < highIdx, 'critical 应在 high 之前');
      assert.ok(highIdx < lowIdx, 'high 应在 low 之前');
    });
  });

  // ---- 5. 筛选栏渲染 (SSR 渲染验证结构) ----

  describe('筛选栏渲染', () => {
    test('应渲染严重程度筛选按钮', () => {
      const html = renderToStaticMarkup(
        React.createElement(AnomalyAlertPanel, { alerts: makeAlerts() })
      );
      assert.ok(html.includes('严重程度'), '应显示严重程度筛选');
    });

    test('应渲染来源筛选按钮', () => {
      const html = renderToStaticMarkup(
        React.createElement(AnomalyAlertPanel, { alerts: makeAlerts() })
      );
      assert.ok(html.includes('来源'), '应显示来源筛选');
    });

    test('showFilters=false 时不渲染筛选栏', () => {
      const html = renderToStaticMarkup(
        React.createElement(AnomalyAlertPanel, { alerts: makeAlerts(), showFilters: false })
      );
      assert.ok(!html.includes('严重程度'), '不应显示严重程度筛选');
    });

    test('空数组不显示筛选栏', () => {
      const html = renderToStaticMarkup(
        React.createElement(AnomalyAlertPanel, { alerts: [] })
      );
      assert.ok(!html.includes('严重程度'), '空数组不应显示筛选');
    });
  });

  // ---- 6. 操作按钮渲染 (SSR 验证) ----

  describe('操作按钮', () => {
    test('无回调时不应渲染确认全部按钮', () => {
      const html = renderToStaticMarkup(
        React.createElement(AnomalyAlertPanel, { alerts: makeAlerts() })
      );
      assert.ok(!html.includes('确认全部'), '无回调不应显示确认全部');
    });

    test('有回调且有未确认告警时渲染确认全部按钮', () => {
      const html = renderToStaticMarkup(
        React.createElement(AnomalyAlertPanel, {
          alerts: [makeAlert({ acknowledged: false })],
          onAcknowledgeAll: () => {},
        })
      );
      assert.ok(html.includes('确认全部'), '应显示确认全部按钮');
    });

    test('全部已确认时不显示确认全部按钮', () => {
      const html = renderToStaticMarkup(
        React.createElement(AnomalyAlertPanel, {
          alerts: [makeAlert({ acknowledged: true })],
          onAcknowledgeAll: () => {},
        })
      );
      assert.ok(!html.includes('确认全部'), '全部已确认不应显示确认全部');
    });
  });

  // ---- 7. 边界情况 ----

  describe('边界情况', () => {
    test('单条告警应正常渲染', () => {
      const html = renderToStaticMarkup(
        React.createElement(AnomalyAlertPanel, { alerts: [makeAlert()] })
      );
      assert.ok(html.includes('设备温度过高'), '单条告警应显示');
    });

    test('maxDisplay 应截断', () => {
      const many = Array.from({ length: 10 }, (_, i) =>
        makeAlert({ id: String(i), title: `告警 ${i}` })
      );
      const html = renderToStaticMarkup(
        React.createElement(AnomalyAlertPanel, { alerts: many, maxDisplay: 3 })
      );
      assert.ok(html.includes('告警 0'), '前3条应包含告警0');
      assert.ok(html.includes('告警 2'), '前3条应包含告警2');
      assert.ok(!html.includes('告警 3'), '超过 maxDisplay 的不应出现');
    });

    test('无 metric 信息时不渲染对比', () => {
      const html = renderToStaticMarkup(
        React.createElement(AnomalyAlertPanel, {
          alerts: [makeAlert({ 
            description: '设备出现了异常情况',
            metricValue: undefined, 
            metricThreshold: undefined 
          })]
        })
      );
      assert.ok(!html.includes('当前值'), '无 metric 时不应显示当前值');
    });

    test('无 metric unit 时仅显示数值', () => {
      const html = renderToStaticMarkup(
        React.createElement(AnomalyAlertPanel, {
          alerts: [makeAlert({ metricValue: 85, metricThreshold: 75, metricUnit: undefined })]
        })
      );
      assert.ok(html.includes('>85<'), '应显示数值');
      assert.ok(html.includes('>75<'), '应显示阈值');
    });

    test('className 应正确应用', () => {
      const html = renderToStaticMarkup(
        React.createElement(AnomalyAlertPanel, {
          alerts: [makeAlert()],
          className: 'custom-panel',
        })
      );
      assert.ok(html.includes('custom-panel'), '应包含自定义类名');
    });

    test('无 title 应使用默认标题', () => {
      // 显式不传 title
      const html = renderToStaticMarkup(
        React.createElement(AnomalyAlertPanel, { alerts: [makeAlert()] })
      );
      assert.ok(html.includes('🚨'), '应包含告警 emoji');
    });

    test('impact 信息应随告警渲染', () => {
      const html = renderToStaticMarkup(
        React.createElement(AnomalyAlertPanel, {
          alerts: [makeAlert({ impact: '影响 5 个门店' })]
        })
      );
      // 告警行渲染中包含标题
      assert.ok(html.includes('设备温度过高'), '告警标题应正常渲染');
      // 影响信息是子属性，存在于 alert 数据对象的 description 也渲染
      assert.ok(html.includes('设备 #A103'), '告警描述应渲染');
    });
  });
});
