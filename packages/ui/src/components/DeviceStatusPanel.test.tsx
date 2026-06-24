/**
 * DeviceStatusPanel 组件测试
 * 
 * 覆盖: 基础渲染、空状态、汇总统计、设备行、状态筛选、搜索、展开/收起、格式化函数
 */

import React from 'react';

const assert = require('node:assert/strict');
const { describe, test, before, after } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { DeviceStatusPanel, computeDeviceSummary } = require('./DeviceStatusPanel');

// ==================== 测试数据 ====================

const now = new Date().toISOString();
const fiveMinAgo = new Date(Date.now() - 5 * 60000).toISOString();
const oneHourAgo = new Date(Date.now() - 60 * 60000).toISOString();
const oneDayAgo = new Date(Date.now() - 24 * 60 * 60000).toISOString();

const basicDevices = [
  {
    id: 'pos-01',
    name: '收银台POS-01',
    type: 'pos' as const,
    status: 'online' as const,
    lastSeen: now,
    uptimeHours: 72.5,
    cpuUsage: 45,
    memoryUsage: 62,
    temperature: 52,
    firmwareVersion: '3.2.1',
    location: '收银区',
    ipAddress: '192.168.1.101',
  },
  {
    id: 'printer-01',
    name: '票据打印机',
    type: 'printer' as const,
    status: 'offline' as const,
    lastSeen: oneHourAgo,
    uptimeHours: 0,
    location: '后厨',
    ipAddress: '192.168.1.201',
  },
  {
    id: 'scanner-01',
    name: '手持扫描枪',
    type: 'scanner' as const,
    status: 'warning' as const,
    lastSeen: fiveMinAgo,
    alertMessage: '连接不稳定',
    ipAddress: '192.168.1.151',
    cpuUsage: 92,
    memoryUsage: 88,
  },
  {
    id: 'network-01',
    name: '核心路由器',
    type: 'network' as const,
    status: 'maintenance' as const,
    lastSeen: oneDayAgo,
    uptimeHours: 720,
    firmwareVersion: '5.1.0',
    location: '机房',
    ipAddress: '10.0.0.1',
    temperature: 65,
  },
  {
    id: 'display-01',
    name: '广告屏-大厅',
    type: 'display' as const,
    status: 'error' as const,
    lastSeen: oneDayAgo,
    alertMessage: '屏幕无响应',
    location: '大厅',
    ipAddress: '192.168.1.50',
  },
];

const emptyDevices: typeof basicDevices = [];

describe('DeviceStatusPanel', () => {
  // ==================== 基础渲染 ====================

  test('渲染默认标题', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeviceStatusPanel, { devices: basicDevices })
    );
    assert.match(html, /设备状态监控/);
  });

  test('渲染自定义标题', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeviceStatusPanel, {
        devices: basicDevices,
        title: '门店A设备面板',
      })
    );
    assert.match(html, /门店A设备面板/);
  });

  test('渲染设备总数', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeviceStatusPanel, { devices: basicDevices })
    );
    assert.match(html, /5台/);
  });

  test('渲染所有设备名称', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeviceStatusPanel, { devices: basicDevices })
    );
    assert.match(html, /收银台POS-01/);
    assert.match(html, /票据打印机/);
    assert.match(html, /手持扫描枪/);
    assert.match(html, /核心路由器/);
    assert.match(html, /广告屏-大厅/);
  });

  test('包含role=region和无障碍标签', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeviceStatusPanel, { devices: basicDevices })
    );
    assert.match(html, /role="region"/);
    assert.match(html, /aria-label="设备状态监控"/);
  });

  // ==================== 空状态 ====================

  test('空数组显示空状态文案', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeviceStatusPanel, { devices: emptyDevices })
    );
    assert.match(html, /暂无设备数据/);
  });

  test('自定义空状态文案', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeviceStatusPanel, {
        devices: emptyDevices,
        emptyText: '请添加设备',
      })
    );
    assert.match(html, /请添加设备/);
  });

  // ==================== 汇总统计 ====================

  test('显示汇总统计卡', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeviceStatusPanel, {
        devices: basicDevices,
        showSummary: true,
      })
    );
    // 1 online, 1 offline, 1 warning, 1 maintenance, 1 error = 5 total
    assert.match(html, /device-status-panel__summary/);
  });

  test('隐藏汇总统计卡', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeviceStatusPanel, {
        devices: basicDevices,
        showSummary: false,
      })
    );
    assert.doesNotMatch(html, /device-status-panel__summary/);
  });

  // ==================== 状态指示灯 ====================

  test('渲染在线/离线/告警/维护/故障状态', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeviceStatusPanel, { devices: basicDevices })
    );
    assert.match(html, /在线/);
    assert.match(html, /离线/);
    assert.match(html, /告警/);
    assert.match(html, /维护中/);
    assert.match(html, /故障/);
  });

  test('渲染状态指示灯动画元素', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeviceStatusPanel, { devices: basicDevices })
    );
    assert.match(html, /device-status-panel__status-dot/);
  });

  // ==================== 设备详情 ====================

  test('显示CPU/内存信息', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeviceStatusPanel, {
        devices: basicDevices,
        showDetails: true,
      })
    );
    assert.match(html, />45%/);
    assert.match(html, />62%/);
  });

  test('显示温度信息', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeviceStatusPanel, {
        devices: basicDevices,
        showDetails: true,
      })
    );
    assert.match(html, /52°C/);
  });

  test('显示固件版本', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeviceStatusPanel, {
        devices: basicDevices,
        showDetails: true,
      })
    );
    assert.match(html, /v3.2.1/);
  });

  test('显示告警消息', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeviceStatusPanel, {
        devices: basicDevices,
        showDetails: true,
      })
    );
    assert.match(html, /连接不稳定/);
    assert.match(html, /屏幕无响应/);
  });

  test('隐藏详情时不显示CPU内存', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeviceStatusPanel, {
        devices: basicDevices,
        showDetails: false,
      })
    );
    assert.doesNotMatch(html, /device-status-panel__row-details/);
  });

  // ==================== 搜索 ====================

  test('包含搜索框', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeviceStatusPanel, {
        devices: basicDevices,
        showSearch: true,
      })
    );
    assert.match(html, /placeholder="搜索设备名称、ID、IP\.\.\./);
  });

  test('隐藏搜索框', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeviceStatusPanel, {
        devices: basicDevices,
        showSearch: false,
      })
    );
    assert.doesNotMatch(html, /device-status-panel__search/);
  });

  // ==================== 筛选 ====================

  test('包含筛选按钮', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeviceStatusPanel, {
        devices: basicDevices,
        showFilters: true,
      })
    );
    assert.match(html, /全部/);
    assert.match(html, /device-status-panel__filter-btn/);
  });

  test('隐藏筛选按钮', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeviceStatusPanel, {
        devices: basicDevices,
        showFilters: false,
      })
    );
    assert.doesNotMatch(html, /device-status-panel__filters/);
  });

  // ==================== 刷新按钮 ====================

  test('包含刷新按钮', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeviceStatusPanel, {
        devices: basicDevices,
        onRefresh: () => {},
      })
    );
    assert.match(html, /刷新/);
  });

  test('无刷新回调时不显示刷新按钮', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeviceStatusPanel, { devices: basicDevices })
    );
    assert.doesNotMatch(html, /device-status-panel__refresh-btn/);
  });

  // ==================== 自定义类名 ====================

  test('自定义className', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeviceStatusPanel, {
        devices: basicDevices,
        className: 'my-custom-panel',
      })
    );
    assert.match(html, /my-custom-panel/);
  });

  // ==================== maxDisplay ====================

  test('限制显示条数', () => {
    const manyDevices = Array.from({ length: 30 }, (_, i) => ({
      id: `dev-${i}`,
      name: `设备${i}`,
      type: 'other' as const,
      status: 'online' as const,
      lastSeen: now,
    }));
    const html = renderToStaticMarkup(
      React.createElement(DeviceStatusPanel, {
        devices: manyDevices,
        maxDisplay: 5,
      })
    );
    // Should show "显示 5/30 台设备"
    assert.match(html, /显示 5\/30 台设备/);
  });

  // ==================== 设备类型图标 ====================

  test('显示设备类型图标', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeviceStatusPanel, { devices: basicDevices })
    );
    assert.match(html, /🖥/u);
    assert.match(html, /🖨/u);
    assert.match(html, /📡/u);
    assert.match(html, /🌐/u);
  });

  // ==================== 收起/展开 ====================

  test('包含收起展开按钮', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeviceStatusPanel, { devices: basicDevices })
    );
    assert.match(html, /device-status-panel__collapse-btn/);
  });

  // ==================== computeDeviceSummary ====================

  test('computeDeviceSummary 正确计算统计', () => {
    const summary = computeDeviceSummary(basicDevices);
    assert.equal(summary.total, 5);
    assert.equal(summary.online, 1);
    assert.equal(summary.offline, 1);
    assert.equal(summary.warning, 1);
    assert.equal(summary.maintenance, 1);
    assert.equal(summary.error, 1);
  });

  test('computeDeviceSummary 空数组', () => {
    const summary = computeDeviceSummary([]);
    assert.equal(summary.total, 0);
    assert.equal(summary.online, 0);
    assert.equal(summary.offline, 0);
    assert.equal(summary.warning, 0);
    assert.equal(summary.maintenance, 0);
    assert.equal(summary.error, 0);
  });

  // ==================== IP和位置显示 ====================

  test('显示设备位置', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeviceStatusPanel, { devices: basicDevices })
    );
    assert.match(html, /收银区/);
    assert.match(html, /后厨/);
    assert.match(html, /机房/);
  });

  test('显示IP地址', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeviceStatusPanel, { devices: basicDevices })
    );
    assert.match(html, /192\.168\.1\.101/);
    assert.match(html, /192\.168\.1\.201/);
  });

  // ==================== lastSeen 格式化 ====================

  test('渲染最后在线时间', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeviceStatusPanel, { devices: basicDevices })
    );
    // 刚刚 / 分钟前 / 小时前 / 天前 都应该能渲染
    assert.doesNotMatch(html, /未知/);
  });
});
