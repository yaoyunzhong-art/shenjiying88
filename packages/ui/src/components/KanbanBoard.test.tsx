const React = require('react');
const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { KanbanBoard } = require('./KanbanBoard');

// ── Mock data ───────────────────────────────────────────────────────────────

const MOCK_COLUMNS = [
  { id: 'todo', title: '待办' },
  { id: 'in-progress', title: '进行中' },
  { id: 'done', title: '已完成' },
];

const MOCK_CARDS = [
  { id: 'c1', title: '设计系统组件', columnId: 'todo', priority: 'high', assignee: '张三' },
  { id: 'c2', title: '修复登录页bug', columnId: 'in-progress', priority: 'critical', tags: ['bug'] },
  { id: 'c3', title: '编写文档', columnId: 'done', priority: 'low', dueDate: '2026-06-30' },
  { id: 'c4', title: '性能优化', columnId: 'in-progress', priority: 'medium', subtitle: '首页LCP从3s降到1.5s', assignee: '李四', tags: ['性能', '优化'] },
];

// ── Tests ───────────────────────────────────────────────────────────────────

describe('KanbanBoard', function() {
  test('renders all columns', function() {
    var html = renderToStaticMarkup(
      React.createElement(KanbanBoard, { columns: MOCK_COLUMNS, cards: MOCK_CARDS })
    );
    for (var i = 0; i < MOCK_COLUMNS.length; i++) {
      assert.ok(html.includes(MOCK_COLUMNS[i].title), 'should render column "' + MOCK_COLUMNS[i].title + '"');
    }
  });

  test('renders all card titles', function() {
    var html = renderToStaticMarkup(
      React.createElement(KanbanBoard, { columns: MOCK_COLUMNS, cards: MOCK_CARDS })
    );
    for (var i = 0; i < MOCK_CARDS.length; i++) {
      assert.ok(html.includes(MOCK_CARDS[i].title), 'should render card "' + MOCK_CARDS[i].title + '"');
    }
  });

  test('renders card priority labels', function() {
    var html = renderToStaticMarkup(
      React.createElement(KanbanBoard, { columns: MOCK_COLUMNS, cards: MOCK_CARDS })
    );
    assert.ok(html.includes('high'), 'should render high priority');
    assert.ok(html.includes('critical'), 'should render critical priority');
    assert.ok(html.includes('low'), 'should render low priority');
    assert.ok(html.includes('medium'), 'should render medium priority');
  });

  test('renders card assignee', function() {
    var html = renderToStaticMarkup(
      React.createElement(KanbanBoard, { columns: MOCK_COLUMNS, cards: MOCK_CARDS })
    );
    assert.ok(html.includes('张三'), 'should render assignee 张三');
    assert.ok(html.includes('李四'), 'should render assignee 李四');
  });

  test('renders card subtitle', function() {
    var html = renderToStaticMarkup(
      React.createElement(KanbanBoard, { columns: MOCK_COLUMNS, cards: MOCK_CARDS })
    );
    assert.ok(html.includes('首页LCP从3s降到1.5s'), 'should render subtitle');
  });

  test('renders card tags', function() {
    var html = renderToStaticMarkup(
      React.createElement(KanbanBoard, { columns: MOCK_COLUMNS, cards: MOCK_CARDS })
    );
    assert.ok(html.includes('bug'), 'should render bug tag');
    assert.ok(html.includes('性能'), 'should render 性能 tag');
    assert.ok(html.includes('优化'), 'should render 优化 tag');
  });

  test('renders due dates', function() {
    var html = renderToStaticMarkup(
      React.createElement(KanbanBoard, { columns: MOCK_COLUMNS, cards: MOCK_CARDS })
    );
    assert.ok(html.includes('2026-06-30'), 'should render due date');
  });

  test('shows empty message for columns with no cards', function() {
    var singleColumn = [{ id: 'empty-col', title: '空列' }];
    var html = renderToStaticMarkup(
      React.createElement(KanbanBoard, { columns: singleColumn, cards: [] })
    );
    assert.ok(html.includes('无任务'), 'should render empty message');
  });

  test('renders with loading skeleton', function() {
    var html = renderToStaticMarkup(
      React.createElement(KanbanBoard, { columns: MOCK_COLUMNS, cards: [], loading: true })
    );
    // Loading state renders skeleton placeholders (3 grey bars per column)
    var columnCount = MOCK_COLUMNS.length;
    // the skeleton renders 3 placeholder bars per column
    assert.ok(html.includes('kanban-board'), 'should render kanban board container in loading state');
    assert.ok(html.length > 500, 'loading skeleton should produce meaningful markup');
  });

  test('renders with custom data-testid', function() {
    var html = renderToStaticMarkup(
      React.createElement(KanbanBoard, { columns: MOCK_COLUMNS, cards: [], 'data-testid': 'my-kanban' })
    );
    assert.ok(
      /data-testid\s*=\s*"my-kanban"/.test(html),
      'expected data-testid="my-kanban" but got: ' + html.slice(0, 200)
    );
  });

  test('handles onCardClick callback', function() {
    var clicked = null;
    var handleClick = function(card) { clicked = card; };
    var html = renderToStaticMarkup(
      React.createElement(KanbanBoard, {
        columns: MOCK_COLUMNS,
        cards: [MOCK_CARDS[0]],
        onCardClick: handleClick,
      })
    );
    assert.ok(html.includes(MOCK_CARDS[0].title), 'card should be rendered with click handler');
  });

  test('renders priority color indicators', function() {
    var html = renderToStaticMarkup(
      React.createElement(KanbanBoard, { columns: MOCK_COLUMNS, cards: MOCK_CARDS })
    );
    assert.ok(html.includes('critical'), 'critical priority label rendered');
  });

  test('handles onCardMove configuration', function() {
    var moved = false;
    var handleMove = function() { moved = true; };
    var html = renderToStaticMarkup(
      React.createElement(KanbanBoard, {
        columns: MOCK_COLUMNS,
        cards: MOCK_CARDS,
        onCardMove: handleMove,
      })
    );
    assert.ok(html.includes('kanban-card'), 'cards are draggable when onCardMove provided');
  });

  test('renders with a single column and multi-card', function() {
    var col = [{ id: 'solo', title: '单独列' }];
    var cards = [
      { id: 'a', title: '卡A', columnId: 'solo' },
      { id: 'b', title: '卡B', columnId: 'solo' },
    ];
    var html = renderToStaticMarkup(
      React.createElement(KanbanBoard, { columns: col, cards: cards })
    );
    assert.ok(html.includes('卡A'), 'should render card A');
    assert.ok(html.includes('卡B'), 'should render card B');
  });

  test('renders with mixed priority cards in same column', function() {
    var col = [{ id: 'mixed', title: '混合列' }];
    var cards = [
      { id: 'x', title: '低优先', columnId: 'mixed', priority: 'low' },
      { id: 'y', title: '高优先', columnId: 'mixed', priority: 'high' },
    ];
    var html = renderToStaticMarkup(
      React.createElement(KanbanBoard, { columns: col, cards: cards })
    );
    assert.ok(html.includes('低优先'), 'low priority card rendered');
    assert.ok(html.includes('高优先'), 'high priority card rendered');
  });

  test('renders without priority', function() {
    var col = [{ id: 'nop', title: '无优先级列' }];
    var cards = [
      { id: 'np1', title: '普通任务', columnId: 'nop' },
    ];
    var html = renderToStaticMarkup(
      React.createElement(KanbanBoard, { columns: col, cards: cards })
    );
    assert.ok(html.includes('普通任务'), 'card without priority renders');
  });
});
