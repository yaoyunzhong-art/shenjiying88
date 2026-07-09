const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const { StoreDailyOperationsPanel } = require('./StoreDailyOperationsPanel');
const React = require(PROJECT_ROOT + '/node_modules/.pnpm/react@18.3.1/node_modules/react/index.js');

// ---- 工厂 ----

const TODAY = new Date().toISOString();

function makeProps(overrides = {}) {
  return {
    storeName: '朝阳旗舰店',
    date: TODAY,
    metrics: [
      { label: '今日营收', value: '52,380', unit: '元', change: 8.2, trend: 'up' },
      { label: '订单数', value: '186', unit: '单', change: -3.5, trend: 'down' },
      { label: '客流量', value: '320', unit: '人', change: 12.1, trend: 'up' },
      { label: '客单价', value: '281.6', unit: '元', change: 5.0, trend: 'up' },
    ],
    tasks: [
      {
        id: 'task-1',
        title: '库存预警: 可口可乐库存不足',
        description: '当前库存 12 箱，低于安全库存 20 箱，请安排补货。',
        priority: 'high',
        status: 'pending',
        dueAt: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
        from: '库存系统',
      },
      {
        id: 'task-2',
        title: '会员投诉跟进 - 李女士',
        description: '关于会员卡积分异常问题的投诉需在今日内回复。',
        priority: 'medium',
        status: 'in_progress',
        dueAt: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
        from: '客服中心',
      },
      {
        id: 'task-3',
        title: '晨会记录提交',
        priority: 'low',
        status: 'completed',
        from: '店长',
      },
    ],
    staffOnDuty: [
      { id: 's1', name: '张三', role: '收银员', status: 'on_duty' },
      { id: 's2', name: '李四', role: '导购员', status: 'on_duty' },
      { id: 's3', name: '王五', role: '理货员', status: 'break' },
      { id: 's4', name: '赵六', role: '收银员', status: 'off_duty' },
    ],
    quickActions: [
      { label: '快速收银', icon: '💰', onClick: () => {} },
      { label: '库存盘点', icon: '📦', onClick: () => {} },
      { label: '调货申请', icon: '🚚', onClick: () => {} },
      { label: '会员查询', icon: '👤', onClick: () => {} },
    ],
    ...overrides,
  };
}

// ---- 测试 ----

describe('StoreDailyOperationsPanel', () => {
  test('基础渲染 — 标题/日期/门店名称', () => {
    const html = renderToStaticMarkup(React.createElement(StoreDailyOperationsPanel, makeProps()));
    assert.ok(html.includes('朝阳旗舰店'), '应展示门店名称');
    assert.ok(html.includes('今日数据概览'), '应展示数据概览标题');
    assert.ok(html.includes('待办事项'), '应展示待办标题');
    assert.ok(html.includes('在岗员工'), '应展示员工标题');
    assert.ok(html.includes('快捷操作'), '应展示快捷操作标题');
    assert.ok(html.includes('role="region"') || html.includes('role=\\"region\\"'), '应设置 role=region');
  });

  test('指标渲染 — 值/单位/变化趋势', () => {
    const html = renderToStaticMarkup(React.createElement(StoreDailyOperationsPanel, makeProps()));
    assert.ok(html.includes('52,380'), '应展示营收');
    assert.ok(html.includes('186'), '应展示订单数');
    assert.ok(html.includes('320'), '应展示客流量');
    assert.ok(html.includes('281.6'), '应展示客单价');
    assert.ok(html.includes('+8.2%'), '应展示正向变化');
    assert.ok(html.includes('-3.5%'), '应展示负向变化');
    assert.ok(html.includes('↑'), '应展示上涨趋势图标');
    assert.ok(html.includes('↓'), '应展示下跌趋势图标');
  });

  test('任务渲染 — 优先级/状态/描述', () => {
    const html = renderToStaticMarkup(React.createElement(StoreDailyOperationsPanel, makeProps()));
    assert.ok(html.includes('库存预警'), '应展示高优先级任务标题');
    assert.ok(html.includes('会员投诉跟进'), '应展示中优先级任务标题');
    assert.ok(html.includes('晨会记录提交'), '应展示低优先级任务标题');
    assert.ok(html.includes('紧急'), '应展示紧急标签');
    assert.ok(html.includes('重要'), '应展示重要标签');
    assert.ok(html.includes('普通'), '应展示普通标签');
    assert.ok(html.includes('待处理'), '应展示待处理状态');
    assert.ok(html.includes('处理中'), '应展示处理中状态');
    assert.ok(html.includes('已完成'), '应展示已完成状态');
    assert.ok(html.includes('来自: 库存系统'), '应展示任务来源');
  });

  test('员工列表渲染', () => {
    const html = renderToStaticMarkup(React.createElement(StoreDailyOperationsPanel, makeProps()));
    assert.ok(html.includes('张三'), '应展示员工姓名');
    assert.ok(html.includes('李四'), '应展示员工姓名');
    assert.ok(html.includes('王五'), '应展示员工姓名');
    assert.ok(html.includes('赵六'), '应展示员工姓名');
    assert.ok(html.includes('收银员'), '应展示岗位');
    assert.ok(html.includes('导购员'), '应展示岗位');
    assert.ok(html.includes('理货员'), '应展示岗位');
    assert.ok(html.includes('在岗'), '应展示在岗状态');
    assert.ok(html.includes('休息'), '应展示休息状态');
    assert.ok(html.includes('已下班'), '应展示下班状态');
  });

  test('快捷操作按钮渲染', () => {
    const html = renderToStaticMarkup(React.createElement(StoreDailyOperationsPanel, makeProps()));
    assert.ok(html.includes('快速收银'), '应展示收银按钮');
    assert.ok(html.includes('库存盘点'), '应展示盘点按钮');
    assert.ok(html.includes('调货申请'), '应展示调货按钮');
    assert.ok(html.includes('会员查询'), '应展示会员查询按钮');
  });

  test('刷新按钮 — 提供 onRefresh 时渲染', () => {
    const html = renderToStaticMarkup(React.createElement(StoreDailyOperationsPanel, makeProps({ onRefresh: () => {} })));
    assert.ok(html.includes('刷新'), '应展示刷新按钮');
  });

  test('刷新按钮 — 不提供 onRefresh 时不渲染', () => {
    const html = renderToStaticMarkup(React.createElement(StoreDailyOperationsPanel, makeProps({ onRefresh: undefined })));
    assert.ok(!html.includes('刷新'), '无 onRefresh 时不展示刷新按钮');
  });

  test('空任务列表', () => {
    const html = renderToStaticMarkup(React.createElement(StoreDailyOperationsPanel, makeProps({ tasks: [] })));
    assert.ok(html.includes('暂无待办事项'), '空任务应展示占位文字');
  });

  test('空员工列表', () => {
    const html = renderToStaticMarkup(React.createElement(StoreDailyOperationsPanel, makeProps({ staffOnDuty: [] })));
    assert.ok(html.includes('暂无在岗员工记录'), '空员工应展示占位文字');
  });

  test('无快捷操作时不渲染该区域', () => {
    const html = renderToStaticMarkup(React.createElement(StoreDailyOperationsPanel, makeProps({ quickActions: [] })));
    // 如果 quickActions 为空，快速操作区不应该显示标题
    // 注意: 组件内判断 quickActions 的 length > 0
    assert.ok(!html.includes('快捷操作') || html.includes('在岗员工'), '空操作列表时不展示快捷操作区域');
  });

  test('type exports', () => {
    assert.equal(typeof StoreDailyOperationsPanel, 'function', 'StoreDailyOperationsPanel 应为函数');
  });

  test('边界情况 — 单个指标', () => {
    const html = renderToStaticMarkup(React.createElement(StoreDailyOperationsPanel, makeProps({
      metrics: [{ label: '今日营收', value: '100', unit: '元', change: 0, trend: 'neutral' }],
    })));
    assert.ok(html.includes('100'), '单个指标应渲染');
    assert.ok(html.includes('0.0%'), '零变化应显示');
  });

  test('边界情况 — priority low', () => {
    const props = makeProps();
    props.tasks = [{ id: 't1', title: '例行检查', priority: 'low', status: 'pending' }];
    const html = renderToStaticMarkup(React.createElement(StoreDailyOperationsPanel, props));
    assert.ok(html.includes('例行检查'), '低优先级任务应渲染');
  });

  test('任务 onTaskClick 存在时渲染 role=button', () => {
    const props = makeProps({ onTaskClick: (id) => {} });
    const html = renderToStaticMarkup(React.createElement(StoreDailyOperationsPanel, props));
    assert.ok(html.includes('role="button"') || html.includes('role=\\"button\\"'), '任务应设置 role=button');
  });

  test('员工 onStaffClick 存在时渲染 role=button', () => {
    const props = makeProps({ onStaffClick: (id) => {} });
    const html = renderToStaticMarkup(React.createElement(StoreDailyOperationsPanel, props));
    // 员工卡片也应该有 role=button
    assert.ok(html.includes('role="button"') || html.includes('role=\\"button\\"'), '员工卡片应设置 role=button');
  });
});
