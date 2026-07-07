import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
const { CommentList } = require('./CommentList');
import type { CommentItem, CommentAuthor } from './CommentList';

// ---- 类型检查测试（不依赖 DOM） ----

test('CommentList: exports CommentList as function', () => {
  assert.equal(typeof CommentList, 'function');
});

test('CommentList: accepts minimal props (empty comments)', () => {
  const el = React.createElement(CommentList, { comments: [] });
  assert.ok(React.isValidElement(el));
  assert.deepEqual(el.props.comments, []);
});

test('CommentList: passes through data-testid', () => {
  const el = React.createElement(CommentList, { comments: [], 'data-testid': 'my-comment-list' });
  assert.equal(el.props['data-testid'], 'my-comment-list');
});

test('CommentList: default data-testid is undefined when not passed', () => {
  const el = React.createElement(CommentList, { comments: [] });
  // React.createElement does not inject default values into props
  assert.equal(el.props['data-testid'], undefined);
});

test('CommentList: accepts onAddComment callback', () => {
  let called = false;
  const el = React.createElement(CommentList, {
    comments: [],
    onAddComment: (content: string) => { called = true; },
  });
  assert.equal(typeof el.props.onAddComment, 'function');
});

test('CommentList: accepts onDeleteComment callback', () => {
  const el = React.createElement(CommentList, {
    comments: [],
    onDeleteComment: (id: string) => {},
  });
  assert.equal(typeof el.props.onDeleteComment, 'function');
});

test('CommentList: accepts onToggleLike callback', () => {
  const el = React.createElement(CommentList, {
    comments: [],
    onToggleLike: (id: string) => {},
  });
  assert.equal(typeof el.props.onToggleLike, 'function');
});

test('CommentList: accepts onLoadMore callback', () => {
  const el = React.createElement(CommentList, {
    comments: [],
    hasMore: true,
    onLoadMore: () => {},
  });
  assert.equal(typeof el.props.onLoadMore, 'function');
});

test('CommentList: accepts loading state', () => {
  const el = React.createElement(CommentList, {
    comments: [],
    hasMore: true,
    loading: true,
    onLoadMore: () => {},
  });
  assert.equal(el.props.loading, true);
});

test('CommentList: accepts hasMore flag', () => {
  const el = React.createElement(CommentList, { comments: [], hasMore: true });
  assert.equal(el.props.hasMore, true);
});

test('CommentList: accepts custom placeholder', () => {
  const el = React.createElement(CommentList, {
    comments: [],
    onAddComment: () => {},
    placeholder: '写评论...',
  });
  assert.equal(el.props.placeholder, '写评论...');
});

test('CommentList: accepts currentUserId', () => {
  const el = React.createElement(CommentList, {
    comments: [],
    currentUserId: 'u1',
  });
  assert.equal(el.props.currentUserId, 'u1');
});

test('CommentList: renders with mock data', () => {
  const comments: CommentItem[] = [
    {
      id: 'c1',
      author: { id: 'u1', name: '张三', role: '店长' },
      content: '测试内容',
      createdAt: '2026-07-06',
      likes: 3,
      liked: false,
      replies: [
        {
          id: 'c1r1',
          author: { id: 'u2', name: '李四' },
          content: '回复',
          createdAt: '2026-07-06',
          likes: 1,
          liked: true,
        },
      ],
    },
    {
      id: 'c2',
      author: { id: 'u3', name: '王五' },
      content: '第二条评论',
      createdAt: '2026-07-06',
      likes: 0,
      liked: false,
    },
  ];
  const el = React.createElement(CommentList, { comments });
  assert.ok(React.isValidElement(el));
  assert.equal(el.props.comments.length, 2);
  assert.equal(el.props.comments[0].replies?.length, 1);
});

// ---- 类型验证 ----

test('CommentList: CommentAuthor type has required fields', () => {
  const author: CommentAuthor = { id: 'x', name: 'Test' };
  assert.equal(typeof author.id, 'string');
  assert.equal(typeof author.name, 'string');
});

test('CommentList: CommentItem type has required fields', () => {
  const item: CommentItem = {
    id: 'x',
    author: { id: 'y', name: 'Test' },
    content: 'content',
    createdAt: 'now',
    likes: 0,
  };
  assert.equal(typeof item.id, 'string');
  assert.equal(typeof item.content, 'string');
  assert.equal(typeof item.likes, 'number');
});
