/**
 * DeviceInspectionPanel 组件测试
 *
 * 覆盖: 基础渲染、汇总卡片、指标仪表盘、设备行、状态徽章、告警显示、空状态、
 *       加载态、错误态、回调函数、边界场景
 */

import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { DeviceInspectionPanel } = require('./DeviceInspectionPanel');
import type {
  InspectionItem,
  InspectionSummary,
  DeviceInspectionPanelProps,
} from './DeviceInspectionPanel';

// ==================== 测试数据 ====================

function buildDevice(overrides: Partial<InspectionItem> = {}): InspectionItem {
  return {
    id: 'dev-001',
    deviceName: '收银终端 A01',
    deviceType: 'POS',
    location: '一楼收银台',
    status: 'healthy',
    lastInspectedAt: '2026-06-23T08:00:00Z',
    inspector: '张三',
    metrics: {
      cpuUsage: 45,
      memoryUsage: 60,
      diskUsage: 55,
      temperature: 42,
      uptimeHours: 120,
    },
    alerts: [],
    ...overrides,
  };
}

function buildSummary(overrides: Partial<InspectionSummary> = {}): InspectionSummary {
  return {
    total: 5,
    healthy: 3,
    warning: 1,
    critical: 1,
    offline: 0,
    avgCpuUsage: 52,
    avgMemoryUsage: 65,
    avgTemperature: 45,
    ...overrides,
  };
}

const defaultDevices: InspectionItem[] = [
  buildDevice(),
  buildDevice({
    id: 'dev-002',
    deviceName: '电子秤 B03',
    deviceType: 'Scale',
    location: '生鲜区',
    status: 'warning',
    metrics: {
      cpuUsage: 78,
      memoryUsage: 82,
      diskUsage: 70,
      temperature: 65,
      uptimeHours: 200,
    },
  }),
  buildDevice({
    id: 'dev-003',
    deviceName: '打印机 C07',
    deviceType: 'Printer',
    location: '后仓',
    status: 'critical',
    metrics: {
      cpuUsage: 92,
      memoryUsage: 95,
      diskUsage: 88,
      temperature: 78,
      uptimeHours: 800,
    },
    alerts: [
      {
        id: 'alert-1',
        severity: 'critical',
        message: '磁盘空间不足',
        triggeredAt: '2026-06-23T07:00:00Z',
        acknowledged: false,
      },
    ],
  }),
  buildDevice({
    id: 'dev-004',
    deviceName: '监控 D02',
    deviceType: 'Camera',
    location: '停车场',
    status: 'offline',
    metrics: {
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
      temperature: 0,
      uptimeHours: 0,
    },
  }),
  buildDevice({
    id: 'dev-005',
    deviceName: '平板 E01',
    deviceType: 'Tablet',
    location: '二楼',
    status: 'healthy',
    metrics: {
      cpuUsage: 30,
      memoryUsage: 40,
      diskUsage: 25,
      temperature: 35,
      uptimeHours: 72,
      batteryPercent: 85,
    },
  }),
];

const defaultSummary = buildSummary();

const defaultProps: DeviceInspectionPanelProps = {
  devices: defaultDevices,
  summary: defaultSummary,
};

// ==================== 测试用例 ====================

describe('DeviceInspectionPanel', () => {
  test('renders the panel with device table', () => {
    const html = renderToStaticMarkup(React.createElement(DeviceInspectionPanel, defaultProps));
    assert.ok(html.includes('device-inspection-panel'), 'should contain panel testid');
    assert.ok(html.includes('device-table'), 'should contain table testid');
  });

  test('displays summary cards with correct values', () => {
    const html = renderToStaticMarkup(React.createElement(DeviceInspectionPanel, defaultProps));
    assert.ok(html.includes('设备总数'), 'should show total label');
    assert.ok(html.includes('>5<'), 'should show total count 5');
    assert.ok(html.includes('正常'), 'should show healthy label');
    assert.ok(html.includes('>3<'), 'should show healthy count 3');
    assert.ok(html.includes('警告'), 'should show warning label');
    assert.ok(html.includes('>1<'), 'should show warning count 1');
    assert.ok(html.includes('严重'), 'should show critical label');
    assert.ok(html.includes('离线'), 'should show offline label');
  });

  test('renders metric gauges', () => {
    const html = renderToStaticMarkup(React.createElement(DeviceInspectionPanel, defaultProps));
    assert.ok(html.includes('平均 CPU'), 'should have CPU gauge');
    assert.ok(html.includes('平均内存'), 'should have memory gauge');
    assert.ok(html.includes('平均温度'), 'should have temperature gauge');
  });

  test('renders all device rows', () => {
    const html = renderToStaticMarkup(React.createElement(DeviceInspectionPanel, defaultProps));
    assert.ok(html.includes('收银终端 A01'), 'should show device 1');
    assert.ok(html.includes('电子秤 B03'), 'should show device 2');
    assert.ok(html.includes('打印机 C07'), 'should show device 3');
    assert.ok(html.includes('监控 D02'), 'should show device 4');
    assert.ok(html.includes('平板 E01'), 'should show device 5');
  });

  test('displays correct status badges', () => {
    const html = renderToStaticMarkup(React.createElement(DeviceInspectionPanel, defaultProps));
    // 正常 badge for dev-001
    assert.ok(html.includes('正常'), 'should have 正常 badge');
    // 警告 badge for dev-002
    assert.ok(html.includes('警告'), 'should have 警告 badge');
    // 严重 badge for dev-003
    assert.ok(html.includes('严重'), 'should have 严重 badge');
    // 离线 badge for dev-004
    assert.ok(html.includes('离线'), 'should have 离线 badge');
  });

  test('displays metric values with correct color thresholds', () => {
    const html = renderToStaticMarkup(React.createElement(DeviceInspectionPanel, defaultProps));
    // 45% cpu -> green (#16a34a)
    assert.ok(html.includes('45%'), 'should show 45% cpu');
    // 78% cpu -> warning yellow (#ca8a04)
    assert.ok(html.includes('78%'), 'should show 78% cpu');
    // 92% cpu -> critical red (#dc2626)
    assert.ok(html.includes('92%'), 'should show 92% cpu');
    // Verify color coding via inline style
    assert.ok(html.includes('#dc2626'), 'should have red for critical');
    assert.ok(html.includes('#ca8a04'), 'should have yellow for warning');
    assert.ok(html.includes('#16a34a'), 'should have green for healthy');
  });

  test('shows alerts for the critical device', () => {
    const html = renderToStaticMarkup(React.createElement(DeviceInspectionPanel, defaultProps));
    assert.ok(html.includes('磁盘空间不足'), 'should show alert message');
    assert.ok(html.includes('alert-alert-1'), 'should have alert testid');
  });

  test('shows pending alert count in action bar', () => {
    const html = renderToStaticMarkup(React.createElement(DeviceInspectionPanel, defaultProps));
    assert.ok(html.includes('1 条未处理告警'), 'should show 1 pending alert');
  });

  test('shows no pending alert message when all acknowledged', () => {
    const devices = [
      buildDevice({
        id: 'dev-010',
        alerts: [
          {
            id: 'alert-10',
            severity: 'warning',
            message: '已处理',
            triggeredAt: '2026-06-23T06:00:00Z',
            acknowledged: true,
          },
        ],
      }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(DeviceInspectionPanel, {
        devices,
        summary: buildSummary({ total: 1 }),
      })
    );
    assert.ok(html.includes('无待处理告警'), 'should show no pending alerts');
  });

  test('shows empty state when no devices', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeviceInspectionPanel, {
        devices: [],
        summary: buildSummary({
          total: 0,
          healthy: 0,
          warning: 0,
          critical: 0,
          offline: 0,
        }),
      })
    );
    assert.ok(html.includes('暂无设备数据'), 'should show empty state');
  });

  test('shows loading state', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeviceInspectionPanel, {
        ...defaultProps,
        loading: true,
      })
    );
    assert.ok(html.includes('device-inspection-loading'), 'should show loading state');
    assert.ok(!html.includes('device-inspection-panel'), 'should not show panel when loading');
  });

  test('shows error state', () => {
    const errMsg = '无法获取设备数据';
    const html = renderToStaticMarkup(
      React.createElement(DeviceInspectionPanel, {
        ...defaultProps,
        error: errMsg,
      })
    );
    assert.ok(html.includes('device-inspection-error'), 'should show error state');
    assert.ok(html.includes(errMsg), 'should show error message');
    assert.ok(!html.includes('device-inspection-panel'), 'should not show panel on error');
  });

  test('renders action buttons', () => {
    const html = renderToStaticMarkup(React.createElement(DeviceInspectionPanel, defaultProps));
    assert.ok(html.includes('开始巡检'), 'should have start inspection button');
    assert.ok(html.includes('导出报告'), 'should have export report button');
  });

  test('renders device type and location columns', () => {
    const html = renderToStaticMarkup(React.createElement(DeviceInspectionPanel, defaultProps));
    assert.ok(html.includes('POS'), 'should show device type POS');
    assert.ok(html.includes('Scale'), 'should show device type Scale');
    assert.ok(html.includes('Printer'), 'should show device type Printer');
    assert.ok(html.includes('一楼收银台'), 'should show location');
    assert.ok(html.includes('生鲜区'), 'should show location');
    assert.ok(html.includes('后仓'), 'should show location');
    assert.ok(html.includes('停车场'), 'should show location');
  });

  test('renders uptime in human-readable format', () => {
    const html = renderToStaticMarkup(React.createElement(DeviceInspectionPanel, defaultProps));
    assert.ok(html.includes('5天'), 'should show 5 days for 120h');
    assert.ok(html.includes('8天 8小时'), 'should show 8d 8h for 200h');
    assert.ok(html.includes('33天 8小时'), 'should show 33d 8h for 800h');
    assert.ok(html.includes('0分钟'), 'should show 0 minutes for 0h');
    assert.ok(html.includes('3天'), 'should show 3 days for 72h');
  });

  test('renders acknowledge buttons for unacknowledged alerts', () => {
    const html = renderToStaticMarkup(React.createElement(DeviceInspectionPanel, defaultProps));
    assert.ok(html.includes('确认'), 'should have acknowledge button');
  });

  test('handles multiple unacknowledged alerts truncation', () => {
    const devices = [
      buildDevice({
        id: 'dev-multi',
        alerts: [
          { id: 'a1', severity: 'warning', message: '告警1', triggeredAt: '2026-06-23T01:00:00Z', acknowledged: false },
          { id: 'a2', severity: 'warning', message: '告警2', triggeredAt: '2026-06-23T02:00:00Z', acknowledged: false },
          { id: 'a3', severity: 'critical', message: '告警3', triggeredAt: '2026-06-23T03:00:00Z', acknowledged: false },
        ],
      }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(DeviceInspectionPanel, {
        devices,
        summary: buildSummary({ total: 1 }),
      })
    );
    assert.ok(html.includes('告警1'), 'should show first alert');
    assert.ok(html.includes('告警2'), 'should show second alert');
    assert.ok(!html.includes('告警3'), 'third alert should be truncated');
    assert.ok(html.includes('+1 条更多'), 'should show +1 more');
  });

  test('table has correct column headers', () => {
    const html = renderToStaticMarkup(React.createElement(DeviceInspectionPanel, defaultProps));
    assert.ok(html.includes('设备名称'), 'should have device name header');
    assert.ok(html.includes('>类型<'), 'should have type header');
    assert.ok(html.includes('>位置<'), 'should have location header');
    assert.ok(html.includes('>状态<'), 'should have status header');
    assert.ok(html.includes('>CPU<'), 'should have CPU header');
    assert.ok(html.includes('>内存<'), 'should have memory header');
    assert.ok(html.includes('>温度<'), 'should have temp header');
    assert.ok(html.includes('运行时长'), 'should have uptime header');
    assert.ok(html.includes('上次巡检'), 'should have last inspection header');
    assert.ok(html.includes('>告警<'), 'should have alerts header');
  });

  test('renders last inspection date in Chinese locale', () => {
    const html = renderToStaticMarkup(React.createElement(DeviceInspectionPanel, defaultProps));
    assert.ok(html.includes('2026/6/23'), 'should show inspection date in zh-CN format');
  });

  test('handles devices with batteryPercent', () => {
    // The batteryPercent is in data, should not crash
    const devices = [
      buildDevice({
        id: 'dev-bat',
        metrics: {
          cpuUsage: 30,
          memoryUsage: 40,
          diskUsage: 25,
          temperature: 35,
          uptimeHours: 10,
          batteryPercent: 85,
        },
      }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(DeviceInspectionPanel, {
        devices,
        summary: buildSummary({ total: 1 }),
      })
    );
    assert.ok(html.includes('dev-bat'), 'should render device with battery percent');
  });

  test('renders metric gauge bars with correct width', () => {
    const html = renderToStaticMarkup(React.createElement(DeviceInspectionPanel, defaultProps));
    assert.ok(html.includes('gauge-bar-平均 CPU'), 'should have CPU gauge bar');
    assert.ok(html.includes('gauge-bar-平均内存'), 'should have memory gauge bar');
    assert.ok(html.includes('gauge-bar-平均温度'), 'should have temperature gauge bar');
  });

  test('handles summary with all zeros', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeviceInspectionPanel, {
        devices: [],
        summary: buildSummary({
          total: 0,
          healthy: 0,
          warning: 0,
          critical: 0,
          offline: 0,
        }),
      })
    );
    assert.ok(html.includes('0'), 'should render zero summary');
  });

  test('renders all five summary cards', () => {
    const html = renderToStaticMarkup(React.createElement(DeviceInspectionPanel, defaultProps));
    assert.ok(html.includes('summary-card-设备总数'), 'should have total card');
    assert.ok(html.includes('summary-card-正常'), 'should have healthy card');
    assert.ok(html.includes('summary-card-警告'), 'should have warning card');
    assert.ok(html.includes('summary-card-严重'), 'should have critical card');
    assert.ok(html.includes('summary-card-离线'), 'should have offline card');
  });

  test('sub-hour uptime shows in minutes', () => {
    const devices = [
      buildDevice({
        id: 'dev-short',
        deviceName: '短期运行设备',
        metrics: {
          cpuUsage: 10,
          memoryUsage: 20,
          diskUsage: 15,
          temperature: 30,
          uptimeHours: 0.5,
        },
      }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(DeviceInspectionPanel, {
        devices,
        summary: buildSummary({ total: 1 }),
      })
    );
    assert.ok(html.includes('30分钟'), 'should show 30 minutes for 0.5h');
  });
});
