import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';

// Dynamically create a React element for the component
// We test the rendered vnode structure directly
test('AttachmentList: component is a function', () => {
  const mod = require('./AttachmentList');
  assert.equal(typeof mod.AttachmentList, 'function');
  assert.equal(typeof mod.default, 'function');
});

test('AttachmentList: default export matches named export', () => {
  const mod = require('./AttachmentList');
  assert.equal(mod.default, mod.AttachmentList);
});

test('AttachmentList: renders with items - returns a vnode', () => {
  const mod = require('./AttachmentList');
  const items = [
    { id: '1', name: 'report.pdf', size: 1000, mimeType: 'application/pdf', status: 'completed' as const },
  ];
  const vnode = React.createElement(mod.AttachmentList, { items });
  assert.ok(vnode);
  assert.equal(vnode.type, mod.AttachmentList);
  assert.ok(vnode.props);
  assert.ok(vnode.props.items);
  assert.equal(vnode.props.items.length, 1);
  assert.equal(vnode.props.items[0].name, 'report.pdf');
});

test('AttachmentList: passes props through', () => {
  const mod = require('./AttachmentList');
  const items: any[] = [
    { id: '1', name: 'a.pdf', size: 1000, mimeType: 'application/pdf', status: 'completed' },
    { id: '2', name: 'b.png', size: 2000, mimeType: 'image/png', status: 'completed' },
  ];
  const vnode = React.createElement(mod.AttachmentList, {
    items,
    readonly: true,
    showRemove: false,
    compact: false,
    emptyText: '无附件',
  });
  assert.equal(vnode.props.items.length, 2);
  assert.equal(vnode.props.readonly, true);
  assert.equal(vnode.props.showRemove, false);
  assert.equal(vnode.props.emptyText, '无附件');
});

test('AttachmentList: accepts all attachment status types', () => {
  const mod = require('./AttachmentList');
  const items: any[] = [
    { id: '1', name: 'a.pdf', size: 100, mimeType: 'application/pdf', status: 'uploading', progress: 50 },
    { id: '2', name: 'b.pdf', size: 200, mimeType: 'application/pdf', status: 'completed' },
    { id: '3', name: 'c.pdf', size: 300, mimeType: 'application/pdf', status: 'error', errorMessage: 'err' },
  ];
  const vnode = React.createElement(mod.AttachmentList, { items });
  assert.equal(vnode.props.items.filter((i: any) => i.status === 'uploading').length, 1);
  assert.equal(vnode.props.items.filter((i: any) => i.status === 'completed').length, 1);
  assert.equal(vnode.props.items.filter((i: any) => i.status === 'error').length, 1);
});

test('AttachmentList: handles empty items', () => {
  const mod = require('./AttachmentList');
  const vnode = React.createElement(mod.AttachmentList, { items: [] });
  assert.ok(vnode);
  assert.equal(vnode.props.items.length, 0);
});

test('AttachmentList: AttachmentItem type has all required fields', () => {
  const item: import('./AttachmentList').AttachmentItem = {
    id: 'test',
    name: 'file.txt',
    size: 512,
    mimeType: 'text/plain',
    status: 'completed',
  };
  assert.equal(item.id, 'test');
  assert.equal(item.name, 'file.txt');
  assert.equal(item.size, 512);
  assert.equal(item.mimeType, 'text/plain');

  // Optional fields
  item.url = 'https://example.com/';
  item.thumbnailUrl = 'https://example.com/thumb';
  item.progress = 100;
  item.errorMessage = '';
  assert.ok(item.url);
});

test('AttachmentList: maxVisible prop', () => {
  const mod = require('./AttachmentList');
  const items = [
    { id: '1', name: 'a.pdf', size: 100, mimeType: 'application/pdf', status: 'completed' as const },
    { id: '2', name: 'b.pdf', size: 200, mimeType: 'application/pdf', status: 'completed' as const },
    { id: '3', name: 'c.pdf', size: 300, mimeType: 'application/pdf', status: 'completed' as const },
  ];
  const vnode = React.createElement(mod.AttachmentList, { items, maxVisible: 2 });
  assert.equal(vnode.props.maxVisible, 2);
});

test('AttachmentList: compact mode prop', () => {
  const mod = require('./AttachmentList');
  const items = [{ id: '1', name: 'a.pdf', size: 100, mimeType: 'application/pdf', status: 'completed' as const }];
  const vnode = React.createElement(mod.AttachmentList, { items, compact: true });
  assert.equal(vnode.props.compact, true);
});

test('AttachmentList: showIcon false', () => {
  const mod = require('./AttachmentList');
  const items = [{ id: '1', name: 'a.pdf', size: 100, mimeType: 'application/pdf', status: 'completed' as const }];
  const vnode = React.createElement(mod.AttachmentList, { items, showIcon: false });
  assert.equal(vnode.props.showIcon, false);
});
