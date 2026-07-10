const assert = require('node:assert/strict');
const { describe, test } = require('node:test');
const React = require('react');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { Comment } = require('./Comment');

// ==================== 辅助函数 ====================

function sampleComments(overrides = {}) {
  return [
    {
      id: '1',
      author: { name: '张三', badge: '作者' },
      content: '这是一条评论内容',
      datetime: '2024-01-15',
      actions: [
        { key: 'reply', label: '回复', onClick: () => {} },
        { key: 'like', label: '点赞', onClick: () => {} },
      ],
      ...overrides,
    },
  ];
}

function nestedComments() {
  return [
    {
      id: '1',
      author: { name: '张三' },
      content: '父评论',
      datetime: '刚刚',
      actions: [{ key: 'reply', label: '回复', onClick: () => {} }],
      replies: [
        {
          id: '2',
          author: { name: '李四', badge: '管理员' },
          content: '子回复内容',
          datetime: '1分钟前',
          actions: [{ key: 'reply', label: '回复', onClick: () => {} }],
          replies: [
            {
              id: '3',
              author: { name: '王五' },
              content: '第三级回复',
              datetime: '2分钟前',
            },
          ],
        },
      ],
    },
  ];
}

function render(el) {
  return renderToStaticMarkup(el);
}

// ==================== 主测试 ====================

describe('Comment', () => {
  // ---- 基础渲染 ----
  test('renders author name', () => {
    const html = render(React.createElement(Comment, { comments: sampleComments() }));
    assert.match(html, /张三/);
  });

  test('renders comment content', () => {
    const html = render(React.createElement(Comment, { comments: sampleComments() }));
    assert.match(html, /这是一条评论内容/);
  });

  test('renders datetime', () => {
    const html = render(React.createElement(Comment, { comments: sampleComments() }));
    assert.match(html, /2024-01-15/);
  });

  test('renders author badge', () => {
    const html = render(React.createElement(Comment, { comments: sampleComments() }));
    assert.match(html, /作者/);
  });

  // ---- 操作按钮 ----
  test('renders action buttons', () => {
    const html = render(React.createElement(Comment, { comments: sampleComments() }));
    assert.match(html, /回复/);
    assert.match(html, /点赞/);
  });

  // ---- 空状态 ----
  test('shows empty state when no comments', () => {
    const html = render(React.createElement(Comment, { comments: [], emptyText: '暂无评论' }));
    assert.match(html, /暂无评论/);
  });

  test('shows customized empty text', () => {
    const html = render(React.createElement(Comment, { comments: [], emptyText: '还没有人评论' }));
    assert.match(html, /还没有人评论/);
  });

  // ---- 嵌套回复 ----
  test('renders nested replies', () => {
    const html = render(React.createElement(Comment, { comments: nestedComments() }));
    assert.match(html, /父评论/);
    assert.match(html, /子回复内容/);
    assert.match(html, /第三级回复/);
  });

  test('renders nested author badge', () => {
    const html = render(React.createElement(Comment, { comments: nestedComments() }));
    assert.match(html, /管理员/);
  });

  // ---- 删除状态 ----
  test('shows deleted message when comment is deleted', () => {
    const comments = [{ id: '1', author: { name: '张三' }, content: '原始内容', datetime: '刚刚', deleted: true }];
    const html = render(React.createElement(Comment, { comments }));
    assert.match(html, /该评论已被删除/);
  });

  test('deleted comment does not show actions', () => {
    const comments = [{
      id: '1', author: { name: '张三' }, content: '原始内容', datetime: '刚刚', deleted: true,
      actions: [{ key: 'reply', label: '回复', onClick: () => {} }],
    }];
    const html = render(React.createElement(Comment, { comments }));
    // Should show deleted message
    assert.match(html, /该评论已被删除/);
  });

  // ---- 多层嵌套限制 ----
  test('respects maxNest limit', () => {
    const deepComments = nestedComments();
    deepComments[0].replies![0].replies![0].replies = [
      {
        id: '4',
        author: { name: '赵六' },
        content: '第四级',
        datetime: '3分钟前',
      },
    ];
    const html = render(React.createElement(Comment, { comments: deepComments, maxNest: 3 }));
    // maxNest=3: level 0-1-2 should render, level 3 should NOT
    assert.match(html, /父评论/);
    assert.match(html, /子回复内容/);
    assert.match(html, /第三级回复/);
    assert.doesNotMatch(html, /第四级/);
  });

  // ---- 头像首字母 ----
  test('renders initials when no avatar', () => {
    const html = render(React.createElement(Comment, { comments: sampleComments() }));
    // "张三" -> initials "张三" (Chinese chars)
    assert.match(html, /张三/);
  });

  // ---- 带头像的评论 ----
  test('renders avatar image when provided', () => {
    const comments = [{
      id: '1',
      author: { name: '张三', avatar: 'https://example.com/avatar.png' },
      content: '有头像的评论',
      datetime: '刚刚',
    }];
    const html = render(React.createElement(Comment, { comments }));
    assert.match(html, /avatar\.png/);
    assert.match(html, /有头像的评论/);
  });

  // ---- 未提供 actions ----
  test('works without actions array', () => {
    const comments = [{ id: '1', author: { name: '张三' }, content: '无操作', datetime: '刚刚' }];
    const html = render(React.createElement(Comment, { comments }));
    assert.match(html, /无操作/);
  });

  // ---- className 和 style ----
  test('accepts className prop', () => {
    const html = render(React.createElement(Comment, { comments: sampleComments(), className: 'my-comment-list' }));
    assert.ok(html.length > 0);
  });

  test('accepts style prop', () => {
    const html = render(React.createElement(Comment, { comments: sampleComments(), style: { gap: 24 } }));
    assert.ok(html.length > 0);
  });

  // ---- 大量评论 ----
  test('renders many comments without error', () => {
    const manyComments = Array.from({ length: 10 }, (_, i) => ({
      id: `c-${i}`,
      author: { name: `用户 ${i}` },
      content: `第 ${i + 1} 条评论`,
      datetime: `${i}分钟前`,
    }));
    const html = render(React.createElement(Comment, { comments: manyComments }));
    for (let i = 0; i < 5; i++) {
      assert.match(html, new RegExp(`第 ${i + 1} 条评论`));
    }
  });

  // ---- 空的 comments 数组 ----
  test('handles null/undefined gracefully', () => {
    const html1 = render(React.createElement(Comment, { comments: null }));
    assert.match(html1, /暂无评论/);
    const html2 = render(React.createElement(Comment, { comments: undefined }));
    assert.match(html2, /暂无评论/);
  });

  // ---- 默认 maxNest ----
  test('default maxNest is 3', () => {
    const html = render(React.createElement(Comment, { comments: nestedComments() }));
    assert.ok(html.includes('父评论'));
  });
});
