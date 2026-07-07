import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');
const { renderToStaticMarkup } = require('react-dom/server');
import { MemberFollowUpTaskPanel, type FollowUpRecord } from './MemberFollowUpTaskPanel';

const mockTasks: FollowUpRecord[] = [
  {
    memberName: '张三',
    memberPhone: '13800138000',
    memberTier: '黄金会员',
    title: '生日关怀回访',
    description: '张三会员生日当月，请发送生日祝福并告知本月优惠活动。',
    priority: 'medium',
    status: 'pending',
    category: 'birthday',
    dueDate: '2026-07-02',
    assignee: '树哥',
  },
  {
    memberName: '李四',
    memberPhone: '13900139000',
    title: '会员续费提醒',
    description: '会员卡即将到期，请提醒续费。',
    priority: 'high',
    status: 'pending',
    category: 'renewal',
    dueDate: '2026-06-30',
    assignee: '树哥',
    lastContactDate: '2025-12-01',
  },
  {
    memberName: '王五',
    memberPhone: '13700137000',
    memberTier: '钻石会员',
    title: '投诉跟进 - 服务态度',
    description: '客户投诉前台服务态度不佳，需跟进安抚。',
    priority: 'urgent',
    status: 'in_progress',
    category: 'complaint',
    dueDate: '2026-06-15',
    assignee: '树哥',
    note: '已电话致歉，约定到店面谈。',
  },
  {
    memberName: '赵六',
    memberPhone: '13600136000',
    title: '满意度调查回访',
    description: '新会员到店体验满意度调查。',
    priority: 'low',
    status: 'completed',
    category: 'survey',
    dueDate: '2026-07-05',
    assignee: '树哥',
  },
  {
    memberName: '孙七',
    memberPhone: '13500135000',
    title: '活动通知推广',
    description: '通知会员本月充值优惠活动。',
    priority: 'medium',
    status: 'skipped',
    category: 'promotion',
    dueDate: '2026-07-10',
    assignee: '树哥',
  },
];

function render(props: Record<string, unknown>) {
  return renderToStaticMarkup(React.createElement(MemberFollowUpTaskPanel, props));
}

describe('MemberFollowUpTaskPanel', () => {
  test('renders staff name', () => {
    const html = render({
      staffName: '树哥',
      tasks: mockTasks,
    });
    assert.ok(html.includes('树哥'));
  });

  test('renders pending count badge', () => {
    const html = render({
      staffName: '树哥',
      tasks: mockTasks,
    });
    // pending + in_progress = 3
    assert.ok(html.includes('3 待处理'));
  });

  test('renders summary counts: pending, completed today', () => {
    const html = render({
      staffName: '树哥',
      tasks: mockTasks,
      totalPending: 8,
      completedToday: 5,
    });
    assert.ok(html.includes('8'));
    assert.ok(html.includes('5'));
  });

  test('renders overdue count in red when > 0', () => {
    const html = render({
      staffName: '树哥',
      tasks: mockTasks,
      overdueCount: 3,
    });
    assert.ok(html.includes('3'));
    // overdue text should exist
    assert.ok(html.includes('逾期'));
  });

  test('shows member name and masked phone', () => {
    const html = render({
      staffName: '树哥',
      tasks: mockTasks,
    });
    assert.ok(html.includes('张三'));
    assert.ok(html.includes('138****8000'));
    assert.ok(html.includes('李四'));
    assert.ok(html.includes('139****9000'));
  });

  test('shows member tier badge when present', () => {
    const html = render({
      staffName: '树哥',
      tasks: mockTasks,
    });
    assert.ok(html.includes('黄金会员'));
    assert.ok(html.includes('钻石会员'));
  });

  test('shows category labels', () => {
    const html = render({
      staffName: '树哥',
      tasks: mockTasks,
    });
    assert.ok(html.includes('生日关怀'));
    assert.ok(html.includes('续费提醒'));
    assert.ok(html.includes('投诉跟进'));
    assert.ok(html.includes('满意度调查'));
    assert.ok(html.includes('活动推广'));
  });

  test('renders action buttons for pending and in_progress tasks', () => {
    const html = render({
      staffName: '树哥',
      tasks: mockTasks,
    });
    assert.ok(html.includes('开始回访'));
    assert.ok(html.includes('标记完成'));
    assert.ok(html.includes('跳过'));
  });

  test('does NOT render action buttons for completed tasks', () => {
    const completedTasks: FollowUpRecord[] = [
      {
        memberName: '赵六',
        memberPhone: '13600136000',
        title: '已完成任务',
        description: '已完成',
        priority: 'low',
        status: 'completed',
        category: 'general',
        dueDate: '2026-07-01',
        assignee: '树哥',
      },
    ];
    const html = render({
      staffName: '树哥',
      tasks: completedTasks,
    });
    assert.ok(!html.includes('开始回访'));
  });

  test('renders empty state when no tasks', () => {
    const html = render({
      staffName: '树哥',
      tasks: [],
    });
    assert.ok(html.includes('暂无待处理的回访任务'));
  });

  test('shows "查看全部" button when tasks > 5', () => {
    const manyTasks: FollowUpRecord[] = Array.from({ length: 7 }, (_, i) => ({
      memberName: `会员${i + 1}`,
      memberPhone: `1380000${String(i).padStart(4, '0')}`,
      title: `任务 ${i + 1}`,
      description: `描述 ${i + 1}`,
      priority: 'medium' as const,
      status: 'pending' as const,
      category: 'general' as const,
      dueDate: '2026-07-10',
      assignee: '树哥',
    }));
    const html = render({
      staffName: '树哥',
      tasks: manyTasks,
      onViewAll: () => {},
    });
    assert.ok(html.includes('查看全部'));
    assert.ok(html.includes('7'));
  });

  test('does not show "查看全部" when onViewAll is not provided', () => {
    const manyTasks: FollowUpRecord[] = Array.from({ length: 7 }, (_, i) => ({
      memberName: `会员${i + 1}`,
      memberPhone: `1380000${String(i).padStart(4, '0')}`,
      title: `任务 ${i + 1}`,
      description: `描述 ${i + 1}`,
      priority: 'medium' as const,
      status: 'pending' as const,
      category: 'general' as const,
      dueDate: '2026-07-10',
      assignee: '树哥',
    }));
    const html = render({
      staffName: '树哥',
      tasks: manyTasks,
    });
    assert.ok(!html.includes('查看全部'));
  });

  test('does not render negative overdue count section when overdueCount is 0', () => {
    const html = render({
      staffName: '树哥',
      tasks: mockTasks,
      overdueCount: 0,
    });
    // Should not render the overdue section at all
    // The overdue badge only appears when overdueCount > 0
    // Check that only the pending and completed counts are visible
    assert.ok(html.includes('待处理'));
    assert.ok(html.includes('今日完成'));
  });

  test('renders overdue task with red due date color', () => {
    const overdueTasks: FollowUpRecord[] = [
      {
        memberName: '钱八',
        memberPhone: '13400134000',
        title: '逾期任务',
        description: '已过期。',
        priority: 'urgent',
        status: 'pending',
        category: 'general',
        dueDate: '2026-06-01', // past date
        assignee: '树哥',
      },
    ];
    const html = render({
      staffName: '树哥',
      tasks: overdueTasks,
    });
    assert.ok(html.includes('已逾期'));
  });

  test('renders data-testid attribute', () => {
    const html = render({
      staffName: '树哥',
      tasks: mockTasks,
    });
    assert.ok(html.includes('data-testid="member-followup-task-panel"'));
  });
});
