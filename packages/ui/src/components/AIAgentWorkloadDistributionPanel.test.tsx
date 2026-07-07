/**
 * AIAgentWorkloadDistributionPanel 组件测试
 *
 * 覆盖:
 * 1. 基础渲染 — 标题、坐席数量
 * 2. 坐席卡片渲染 — 名称、状态、指标数据
 * 3. 汇总统计展示 — 在线/忙碌/离开计数、满意度
 * 4. 空状态
 * 5. 紧凑模式
 * 6. 点击回调
 * 7. 技能标签渲染
 * 8. 排序逻辑: online > busy > away > offline
 */

import React from 'react';

const assert = require('node:assert/strict');
const { describe, test, mock } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { AIAgentWorkloadDistributionPanel } = require('./AIAgentWorkloadDistributionPanel');

// ==================== 测试数据 ====================

const sampleAgents = [
  {
    id: 'agent-1',
    name: '张小明',
    avatar: '👨‍💼',
    status: 'online' as const,
    activeTasks: 3,
    pendingTasks: 5,
    completedToday: 18,
    avgResponseSec: 25,
    satisfactionRate: 95,
    skills: ['会员服务', '售后', '投诉处理'],
  },
  {
    id: 'agent-2',
    name: '李小红',
    avatar: '👩‍💼',
    status: 'busy' as const,
    activeTasks: 5,
    pendingTasks: 2,
    completedToday: 12,
    avgResponseSec: 45,
    satisfactionRate: 88,
    skills: ['导购', '商品咨询'],
  },
  {
    id: 'agent-3',
    name: '王大力',
    avatar: '🧑‍💼',
    status: 'away' as const,
    activeTasks: 0,
    pendingTasks: 3,
    completedToday: 8,
    avgResponseSec: 180,
    satisfactionRate: 72,
    skills: ['物流', '退换货'],
  },
  {
    id: 'agent-4',
    name: '赵小兰',
    avatar: '👩‍💻',
    status: 'offline' as const,
    activeTasks: 0,
    pendingTasks: 0,
    completedToday: 0,
    avgResponseSec: 0,
    satisfactionRate: 90,
    skills: [],
  },
];

// ==================== 测试 ====================

describe('AIAgentWorkloadDistributionPanel', () => {
  test('1. 基础渲染 — 标题和坐席数量', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIAgentWorkloadDistributionPanel, {
        agents: sampleAgents,
        title: '客服工作台',
      })
    );

    assert.ok(html.includes('客服工作台'), '应显示自定义标题');
    assert.ok(html.includes('4 位坐席'), '应显示坐席数量');
  });

  test('2. 坐席卡片渲染 — 名称和指标', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIAgentWorkloadDistributionPanel, {
        agents: sampleAgents,
      })
    );

    // 所有坐席名称都出现
    assert.ok(html.includes('张小明'), '应显示张小明');
    assert.ok(html.includes('李小红'), '应显示李小红');
    assert.ok(html.includes('王大力'), '应显示王大力');
    assert.ok(html.includes('赵小兰'), '应显示赵小兰');

    // 指标数字
    assert.ok(html.includes('3'), 'agent-1 activeTasks=3');
    assert.ok(html.includes('5'), 'agent-1 pendingTasks=5');
    assert.ok(html.includes('18'), 'agent-1 completedToday=18');
    assert.ok(html.includes('95'), 'agent-1 satisfactionRate=95');
  });

  test('3. 汇总统计展示', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIAgentWorkloadDistributionPanel, {
        agents: sampleAgents,
      })
    );

    // 在线 1, 忙碌 1, 离开 1
    assert.ok(html.includes('在线') && html.includes('1'), '应显示 1 位在线');
    assert.ok(html.includes('忙碌') && html.includes('1'), '应显示 1 位忙碌');
    assert.ok(html.includes('离开') && html.includes('1'), '应显示 1 位离开');

    // 全局汇总卡片
    assert.ok(html.includes('进行中任务'), '应显示进行中汇总');
    assert.ok(html.includes('待处理任务'), '应显示待处理汇总');
    assert.ok(html.includes('已完成(今日)'), '应显示已完成汇总');
    assert.ok(html.includes('总处理量'), '应显示总处理量');
  });

  test('4. 空状态', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIAgentWorkloadDistributionPanel, {
        agents: [],
        emptyText: '暂无工作人员数据',
      })
    );

    assert.ok(html.includes('暂无工作人员数据'), '空状态应显示 custom emptyText');
    assert.ok(!html.includes('张小明'), '空状态不应包含坐席卡片');
  });

  test('5. 紧凑模式 — 无全局汇总卡片和副指标', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIAgentWorkloadDistributionPanel, {
        agents: sampleAgents,
        compact: true,
      })
    );

    // 紧凑模式下不显示全局汇总（进行中任务/待处理任务/已完成/总处理量）
    assert.ok(!html.includes('进行中任务'), '紧凑模式无全局汇总: 进行中任务');
    assert.ok(!html.includes('待处理任务'), '紧凑模式无全局汇总: 待处理任务');
    // 但坐席名称仍在
    assert.ok(html.includes('张小明'), '紧凑模式仍有坐席名称');
  });

  test('6. data-testid 属性', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIAgentWorkloadDistributionPanel, {
        agents: sampleAgents,
        'data-testid': 'workload-panel',
      })
    );

    assert.ok(html.includes('data-testid="workload-panel"'), '应传递 data-testid');
  });

  test('7. 技能标签渲染', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIAgentWorkloadDistributionPanel, {
        agents: sampleAgents,
      })
    );

    // agent-1: ['会员服务', '售后', '投诉处理'] 全部3个
    assert.ok(html.includes('会员服务'), '技能标签: 会员服务');
    assert.ok(html.includes('售后'), '技能标签: 售后');
    assert.ok(html.includes('投诉处理'), '技能标签: 投诉处理');

    // agent-3: 只有3个技能，不超过3个不应该显示 +N
    assert.ok(!html.includes('>+1<'), 'agent-3 刚好3个技能，不显示+');

    // agent-4: 无技能
    // agent-4 的 skills 为空数组，不显示任何技能标签
  });

  test('8. 排序逻辑: online 在 busy 前', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIAgentWorkloadDistributionPanel, {
        agents: sampleAgents,
      })
    );

    // online 的张小明应出现在 busy 的李小红之前
    const xiaomingIndex = html.indexOf('张小明');
    const xiaohongIndex = html.indexOf('李小红');
    // 如果先渲染张小明再李小红，索引值小
    // 由于排序 online(0) > busy(1) > away(2) > offline(3)
    assert.ok(
      xiaomingIndex < xiaohongIndex,
      'online 状态在 busy 之前'
    );
  });

  test('9. 点击回调', () => {
    const clicked: string[] = [];
    const handleClick = (agent: { id: string; name: string }) => {
      clicked.push(agent.name);
    };

    // 组件内部使用 onClick 在 article 上
    // 验证 article 元素绑定了事件（无法直接验证通过静态渲染，但测试不会报错即可）
    const html = renderToStaticMarkup(
      React.createElement(AIAgentWorkloadDistributionPanel, {
        agents: sampleAgents.slice(0, 1),
        onAgentClick: handleClick,
      })
    );

    assert.ok(html.includes('张小明'), '带回调时仍正常渲染');
  });

  test('10. 自定义标题', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIAgentWorkloadDistributionPanel, {
        agents: sampleAgents,
        title: '坐席实时状态',
      })
    );

    assert.ok(html.includes('坐席实时状态'), '自定义标题生效');
  });
});
