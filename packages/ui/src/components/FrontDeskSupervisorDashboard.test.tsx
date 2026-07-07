import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { FrontDeskSupervisorDashboard } from './FrontDeskSupervisorDashboard';
import type {
  StaffShiftInfo,
  QueueOverview,
  FrontDeskMetrics,
  ServiceRecord,
} from './FrontDeskSupervisorDashboard';

const mockShiftInfo: StaffShiftInfo = {
  date: '2026-06-30',
  shiftName: '早班',
  staffCount: 8,
  onDuty: 6,
  onBreak: 2,
  shiftLeadName: '张主管',
};

const mockQueueOverview: QueueOverview[] = [
  { queueType: 'service', queueTypeLabel: '服务台', waitingCount: 12, avgWaitMinutes: 9, maxWaitMinutes: 22, trend: 8.5 },
  { queueType: 'pickup', queueTypeLabel: '取货', waitingCount: 5, avgWaitMinutes: 4, maxWaitMinutes: 9, trend: -12.3 },
  { queueType: 'return', queueTypeLabel: '退换货', waitingCount: 3, avgWaitMinutes: 14, maxWaitMinutes: 30, trend: 5.0 },
];

const mockMetrics: FrontDeskMetrics = {
  totalVisitors: 256,
  servedCount: 198,
  avgServiceMinutes: 8.5,
  satisfactionScore: 8.9,
  peakHourRevenue: 45800,
};

const mockServiceRecords: ServiceRecord[] = [
  { id: 's1', visitorName: '王小明', serviceType: '咨询', staffName: '李红', startTime: '14:15', durationMinutes: 6, status: 'completed', notes: '咨询会员积分' },
  { id: 's2', visitorName: '赵大勇', serviceType: '退换货', staffName: '陈芳', startTime: '14:22', durationMinutes: 12, status: 'in_progress' },
  { id: 's3', visitorName: '钱丽丽', serviceType: '取货', staffName: '周杰', startTime: '14:28', durationMinutes: 3, status: 'awaiting' },
  { id: 's4', visitorName: '孙建强', serviceType: '投诉', staffName: '吴敏', startTime: '14:10', durationMinutes: 18, status: 'transferred', notes: '转交店长' },
];

/** Strip HTML comments (<!-- ... -->) that React inserts between JSX expressions */
function stripComments(html: string): string {
  return html.replace(/<!--\s*-->/g, '');
}

// ----- Tests -----

test('FrontDeskSupervisorDashboard: renders shift info header', () => {
  const html = renderToString(
    <FrontDeskSupervisorDashboard
      shiftInfo={mockShiftInfo}
      queueOverview={mockQueueOverview}
      metrics={mockMetrics}
      serviceRecords={mockServiceRecords}
    />,
  );
  const text = stripComments(html);
  assert.ok(text.includes('前台主管工作台'));
  assert.ok(text.includes('2026-06-30'));
  assert.ok(text.includes('早班'));
  assert.ok(text.includes('当班 6 人'));
  assert.ok(text.includes('领班 张主管'));
});

test('FrontDeskSupervisorDashboard: renders quick stat items', () => {
  const html = renderToString(
    <FrontDeskSupervisorDashboard
      shiftInfo={mockShiftInfo}
      queueOverview={mockQueueOverview}
      metrics={mockMetrics}
      serviceRecords={mockServiceRecords}
    />,
  );
  assert.ok(html.includes('今日客流'));
  assert.ok(html.includes('已接待'));
  assert.ok(html.includes('平均服务时长'));
  assert.ok(html.includes('满意度'));
  assert.ok(html.includes('256'));
  assert.ok(html.includes('198'));
  assert.ok(html.includes('8.5min'));
  assert.ok(html.includes('8.9'));
});

test('FrontDeskSupervisorDashboard: renders queue overview cards', () => {
  const html = renderToString(
    <FrontDeskSupervisorDashboard
      shiftInfo={mockShiftInfo}
      queueOverview={mockQueueOverview}
      metrics={mockMetrics}
      serviceRecords={mockServiceRecords}
    />,
  );
  assert.ok(html.includes('服务台'));
  assert.ok(html.includes('取货'));
  assert.ok(html.includes('退换货'));
  assert.ok(html.includes('12'));
  assert.ok(html.includes('5'));
  assert.ok(html.includes('3'));
});

test('FrontDeskSupervisorDashboard: renders action buttons', () => {
  const html = renderToString(
    <FrontDeskSupervisorDashboard
      shiftInfo={mockShiftInfo}
      queueOverview={mockQueueOverview}
      metrics={mockMetrics}
      serviceRecords={mockServiceRecords}
    />,
  );
  assert.ok(html.includes('查看排队'));
  assert.ok(html.includes('叫号下一位'));
  assert.ok(html.includes('快速登记'));
  assert.ok(html.includes('排班调整'));
});

test('FrontDeskSupervisorDashboard: renders onViewQueue button present', () => {
  const html = renderToString(
    <FrontDeskSupervisorDashboard
      shiftInfo={mockShiftInfo}
      queueOverview={mockQueueOverview}
      metrics={mockMetrics}
      serviceRecords={mockServiceRecords}
      onViewQueue={() => {}}
    />,
  );
  assert.ok(html.includes('查看排队'));
});

test('FrontDeskSupervisorDashboard: renders onCallNext button present', () => {
  const html = renderToString(
    <FrontDeskSupervisorDashboard
      shiftInfo={mockShiftInfo}
      queueOverview={mockQueueOverview}
      metrics={mockMetrics}
      serviceRecords={mockServiceRecords}
      onCallNext={() => {}}
    />,
  );
  assert.ok(html.includes('叫号下一位'));
});

test('FrontDeskSupervisorDashboard: renders onOpenQuickCheck button present', () => {
  const html = renderToString(
    <FrontDeskSupervisorDashboard
      shiftInfo={mockShiftInfo}
      queueOverview={mockQueueOverview}
      metrics={mockMetrics}
      serviceRecords={mockServiceRecords}
      onOpenQuickCheck={() => {}}
    />,
  );
  assert.ok(html.includes('快速登记'));
});

test('FrontDeskSupervisorDashboard: renders onAssignShift button present', () => {
  const html = renderToString(
    <FrontDeskSupervisorDashboard
      shiftInfo={mockShiftInfo}
      queueOverview={mockQueueOverview}
      metrics={mockMetrics}
      serviceRecords={mockServiceRecords}
      onAssignShift={() => {}}
    />,
  );
  assert.ok(html.includes('排班调整'));
});

test('FrontDeskSupervisorDashboard: renders service records table', () => {
  const html = renderToString(
    <FrontDeskSupervisorDashboard
      shiftInfo={mockShiftInfo}
      queueOverview={mockQueueOverview}
      metrics={mockMetrics}
      serviceRecords={mockServiceRecords}
    />,
  );
  assert.ok(html.includes('实时接待记录'));
  assert.ok(html.includes('6min'));
  assert.ok(html.includes('12min'));
  assert.ok(html.includes('3min'));
  assert.ok(html.includes('18min'));
});

test('FrontDeskSupervisorDashboard: renders peak hour revenue', () => {
  const html = renderToString(
    <FrontDeskSupervisorDashboard
      shiftInfo={mockShiftInfo}
      queueOverview={mockQueueOverview}
      metrics={mockMetrics}
      serviceRecords={mockServiceRecords}
    />,
  );
  assert.ok(html.includes('高峰时段营收'));
  // toLocaleString('zh-CN') inserts &#x200E; or similar separators — check by stripping comments
  const text = stripComments(html);
  assert.ok(text.includes('45,800'));
});

test('FrontDeskSupervisorDashboard: renders status badges', () => {
  const html = renderToString(
    <FrontDeskSupervisorDashboard
      shiftInfo={mockShiftInfo}
      queueOverview={mockQueueOverview}
      metrics={mockMetrics}
      serviceRecords={mockServiceRecords}
    />,
  );
  assert.ok(html.includes('已完成'));
  assert.ok(html.includes('进行中'));
  assert.ok(html.includes('待接洽'));
  assert.ok(html.includes('已转交'));
});

test('FrontDeskSupervisorDashboard: renders onViewServiceRecord handler present', () => {
  const html = renderToString(
    <FrontDeskSupervisorDashboard
      shiftInfo={mockShiftInfo}
      queueOverview={mockQueueOverview}
      metrics={mockMetrics}
      serviceRecords={mockServiceRecords}
      onViewServiceRecord={() => {}}
    />,
  );
  assert.ok(html.includes('实时接待记录'));
});

test('FrontDeskSupervisorDashboard: renders empty state when no records', () => {
  const html = renderToString(
    <FrontDeskSupervisorDashboard
      shiftInfo={mockShiftInfo}
      queueOverview={mockQueueOverview}
      metrics={mockMetrics}
      serviceRecords={[]}
    />,
  );
  assert.ok(html.includes('暂无接待记录'));
});

test('FrontDeskSupervisorDashboard: renders trend values', () => {
  const html = renderToString(
    <FrontDeskSupervisorDashboard
      shiftInfo={mockShiftInfo}
      queueOverview={mockQueueOverview}
      metrics={mockMetrics}
      serviceRecords={mockServiceRecords}
    />,
  );
  assert.ok(html.includes('8.5%'));
  assert.ok(html.includes('-12.3%'));
});

test('FrontDeskSupervisorDashboard: exports correct types', () => {
  const s: StaffShiftInfo = mockShiftInfo;
  assert.equal(s.shiftLeadName, '张主管');
  const q: QueueOverview = mockQueueOverview[0];
  assert.equal(q.queueTypeLabel, '服务台');
  const m: FrontDeskMetrics = mockMetrics;
  assert.equal(m.satisfactionScore, 8.9);
  assert.equal(mockServiceRecords.length, 4);
});
