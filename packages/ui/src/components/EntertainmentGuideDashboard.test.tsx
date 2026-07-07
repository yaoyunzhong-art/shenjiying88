import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { EntertainmentGuideDashboard } = require('./EntertainmentGuideDashboard');
import type {
  GuideDailyMetrics,
  GuestTask,
  AreaStatus,
  PropRental,
} from './EntertainmentGuideDashboard';

// ---- 模拟数据 ----

const mockMetrics: GuideDailyMetrics = {
  guestCount: 86,
  avgPlayDuration: 45,
  satisfactionScore: 4.7,
  conversionCount: 7,
  guestTrend: 12.5,
  durationTrend: -1.2,
  satisfactionTrend: 0.4,
  conversionTrend: 33.3,
};

const mockTasks: GuestTask[] = [
  { id: '1', guestType: 'family', guestCount: 3, area: '淘气堡', status: 'accompanying', startedAt: '10:30', note: '需要讲解规则' },
  { id: '2', guestType: 'child', guestCount: 1, area: '沙池', status: 'waiting', startedAt: '10:45' },
  { id: '3', guestType: 'adult', guestCount: 2, area: '电玩区', status: 'completed', startedAt: '09:15' },
];

const mockAreas: AreaStatus[] = [
  { id: 'a1', name: '淘气堡区', currentGuests: 18, capacity: 30, queueLength: 2, needsMaintenance: false, deviceOnline: true },
  { id: 'a2', name: '电玩区', currentGuests: 12, capacity: 20, queueLength: 5, needsMaintenance: false, deviceOnline: true },
  { id: 'a3', name: '沙池', currentGuests: 8, capacity: 10, queueLength: 0, needsMaintenance: true, deviceOnline: false },
];

const mockProps: PropRental[] = [
  { id: 'p1', propName: '泡泡枪', borrowedAt: '09:30', expectedReturnAt: '10:00', guestName: '李小朋友', status: 'active' },
  { id: 'p2', propName: '遥控车', borrowedAt: '09:45', expectedReturnAt: '10:15', guestName: '张小朋友', status: 'overdue' },
  { id: 'p3', propName: '积木桶', borrowedAt: '10:00', expectedReturnAt: '11:00', guestName: '王小朋友', status: 'returned' },
];

function render(el: React.ReactElement): string {
  return renderToStaticMarkup(el);
}

function hasText(html: string, text: string): boolean {
  return html.includes(text);
}

// ---- 测试用例 ----

describe('EntertainmentGuideDashboard', () => {
  test('呈现导玩员标题', () => {
    const html = render(<EntertainmentGuideDashboard guideName="王小明" />);
    assert.ok(hasText(html, '王小明 工作台'));
    assert.ok(hasText(html, 'data-testid="guidedashboard-title"'));
  });

  test('不指定姓名时显示默认标题', () => {
    const html = render(<EntertainmentGuideDashboard />);
    assert.ok(hasText(html, '导玩员工作台'));
  });

  test('显示当前区域', () => {
    const html = render(<EntertainmentGuideDashboard assignedArea="淘气堡区" />);
    assert.ok(hasText(html, '当前区域: 淘气堡区'));
  });

  test('loading 状态下显示骨架屏', () => {
    const html = render(<EntertainmentGuideDashboard loading />);
    assert.ok(hasText(html, 'guidedashboard-loading'));
    assert.ok(hasText(html, '正在加载导玩数据...'));
  });

  test('呈现四个核心指标', () => {
    const html = render(<EntertainmentGuideDashboard dailyMetrics={mockMetrics} />);
    assert.ok(hasText(html, 'guidedashboard-metrics'));
    assert.ok(hasText(html, '86'));
    assert.ok(hasText(html, '45min'));
    assert.ok(hasText(html, '4.7'));
    assert.ok(hasText(html, '7'));
  });

  test('无指标时显示占位符', () => {
    const html = render(<EntertainmentGuideDashboard />);
    const placeholderCount = (html.match(/--/g) || []).length;
    assert.ok(placeholderCount >= 4);
  });

  describe('接待任务', () => {
    test('显示任务列表', () => {
      const html = render(<EntertainmentGuideDashboard guestTasks={mockTasks} />);
      assert.ok(hasText(html, '淘气堡'));
      assert.ok(hasText(html, '沙池'));
    });

    test('显示任务数量', () => {
      const html = render(<EntertainmentGuideDashboard guestTasks={mockTasks} />);
      assert.ok(hasText(html, '(3)'));
    });

    test('无任务时显示空状态', () => {
      const html = render(<EntertainmentGuideDashboard guestTasks={[]} />);
      assert.ok(hasText(html, '当前无接待任务'));
    });

    test('显示客人类型标签和人数区域', () => {
      const html = render(<EntertainmentGuideDashboard guestTasks={mockTasks} />);
      assert.ok(hasText(html, '3人 · 淘气堡'));
    });

    test('显示任务备注', () => {
      const html = render(<EntertainmentGuideDashboard guestTasks={mockTasks} />);
      assert.ok(hasText(html, '需要讲解规则'));
    });

    test('显示状态标签', () => {
      const html = render(<EntertainmentGuideDashboard guestTasks={mockTasks} />);
      assert.ok(hasText(html, '陪同中'));
      assert.ok(hasText(html, '待接待'));
      assert.ok(hasText(html, '已完成'));
    });
  });

  describe('区域状态', () => {
    test('显示区域列表', () => {
      const html = render(<EntertainmentGuideDashboard areaStatuses={mockAreas} />);
      assert.ok(hasText(html, 'guidedashboard-areas'));
      assert.ok(hasText(html, '淘气堡区'));
      assert.ok(hasText(html, '电玩区'));
      assert.ok(hasText(html, '沙池'));
    });

    test('显示容量信息', () => {
      const html = render(<EntertainmentGuideDashboard areaStatuses={mockAreas} />);
      assert.ok(hasText(html, '60%') || hasText(html, '18/30'));
      assert.ok(hasText(html, '80%') || hasText(html, '8/10'));
    });

    test('设备离线时显示离线标签', () => {
      const html = render(<EntertainmentGuideDashboard areaStatuses={mockAreas} />);
      assert.ok(hasText(html, '离线'));
    });

    test('需维护时显示维护标签', () => {
      const html = render(<EntertainmentGuideDashboard areaStatuses={mockAreas} />);
      assert.ok(hasText(html, '维护'));
    });

    test('显示排队人数', () => {
      const html = render(<EntertainmentGuideDashboard areaStatuses={mockAreas} />);
      assert.ok(hasText(html, '排队 2') && hasText(html, '排队 5'));
    });

    test('无区域时显示空状态', () => {
      const html = render(<EntertainmentGuideDashboard areaStatuses={[]} />);
      assert.ok(hasText(html, '暂无区域数据'));
    });
  });

  describe('道具管理', () => {
    test('显示道具借用列表', () => {
      const html = render(<EntertainmentGuideDashboard propRentals={mockProps} />);
      assert.ok(hasText(html, 'guidedashboard-props'));
      assert.ok(hasText(html, '泡泡枪'));
      assert.ok(hasText(html, '遥控车'));
      assert.ok(hasText(html, '积木桶'));
    });

    test('显示借用数量', () => {
      const html = render(<EntertainmentGuideDashboard propRentals={mockProps} />);
      assert.ok(hasText(html, '(3)'));
    });

    test('显示道具状态标签', () => {
      const html = render(<EntertainmentGuideDashboard propRentals={mockProps} />);
      assert.ok(hasText(html, '使用中'));
      assert.ok(hasText(html, '逾期'));
      assert.ok(hasText(html, '已归还'));
    });

    test('无道具时隐藏道具区域', () => {
      const html = render(<EntertainmentGuideDashboard propRentals={[]} />);
      assert.ok(!hasText(html, 'guidedashboard-props'));
    });
  });

  describe('同步时间', () => {
    test('显示同步时间戳', () => {
      const html = render(<EntertainmentGuideDashboard lastSyncAt="10:45:23" />);
      assert.ok(hasText(html, '同步: 10:45:23'));
    });

    test('不指定时不显示', () => {
      const html = render(<EntertainmentGuideDashboard />);
      assert.ok(!hasText(html, '同步:'));
    });
  });

  describe('紧凑模式', () => {
    test('在紧凑模式下渲染不报错', () => {
      const html = render(
        <EntertainmentGuideDashboard
          compact
          dailyMetrics={mockMetrics}
          guestTasks={mockTasks}
          areaStatuses={mockAreas}
          propRentals={mockProps}
        />
      );
      assert.ok(hasText(html, 'guidedashboard-root'));
    });

    test('紧凑模式道具更多显示省略', () => {
      const manyProps: PropRental[] = Array.from({ length: 6 }, (_, i) => ({
        id: `p${i}`,
        propName: `道具${i}`,
        borrowedAt: '10:00',
        expectedReturnAt: '11:00',
        guestName: `客人${i}`,
        status: 'active' as const,
      }));

      const html = render(<EntertainmentGuideDashboard compact propRentals={manyProps} />);
      // Should see "+N 更多" for overflow compact rendering
      assert.ok(hasText(html, '更多'));
    });
  });

  describe('自定义 className', () => {
    test('应用自定义类名', () => {
      const html = render(<EntertainmentGuideDashboard className="my-custom-class" />);
      assert.ok(hasText(html, 'my-custom-class'));
    });
  });
});
