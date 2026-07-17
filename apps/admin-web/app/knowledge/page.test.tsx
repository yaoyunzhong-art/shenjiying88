/**
 * knowledge/page.test.tsx — 知识库 L1 冒烟测试
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8');
const CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'knowledge-client.tsx'), 'utf-8');

describe('knowledge — 服务端页面', () => {
  it('包含async组件', () => assert.ok(SRC.includes('async function KnowledgePage')));
  it('包含PageShell', () => assert.ok(SRC.includes('<PageShell')));
  it('包含Suspense', () => assert.ok(SRC.includes('<Suspense')));
  it('包含ErrorBoundary', () => assert.ok(SRC.includes('<ErrorBoundary')));
  it('包含client组件', () => assert.ok(SRC.includes('knowledge-client')));
  it('包含数据加载', () => assert.ok(SRC.includes('loadKnowledge')));
  it('force-dynamic', () => assert.ok(SRC.includes("export const dynamic = 'force-dynamic'")));
});

describe('knowledge — 客户端组件', () => {
  it('use client', () => assert.ok(CLIENT_SRC.includes("'use client'")));
  it('useState', () => assert.ok(CLIENT_SRC.includes('useState')));
  it('分类数据', () => assert.ok(CLIENT_SRC.includes('categories')));
  it('最近文档', () => assert.ok(CLIENT_SRC.includes('recentDocuments')));
  it('map渲染', () => assert.ok(CLIENT_SRC.includes('.map(')));
  it('Conditional', () => assert.ok(CLIENT_SRC.includes(' && ') || CLIENT_SRC.includes(' ? ')));
  it('Card组件', () => assert.ok(CLIENT_SRC.includes('<Card')));
  it('Tabs组件', () => assert.ok(CLIENT_SRC.includes('<Tabs')));
  it('StatusBadge', () => assert.ok(CLIENT_SRC.includes('StatusBadge')));
});
