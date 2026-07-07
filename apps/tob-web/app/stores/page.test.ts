/**
 * stores/page.test.ts — 门店管理列表页 L1 冒烟测试
 * 覆盖: 正例·边界·防御
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

// ---- 正例 ----

describe('stores — 正例', () => {
  it('应导出一个默认组件 StoresPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function StoresPage'), '缺少默认导出组件');
  });

  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'") || src.includes('"use client"'), '缺少 use client');
  });

  it('应包含 storeService 调用', () => {
    const src = readSource();
    assert.ok(src.includes('storeService'), '缺少 storeService');
  });

  it('应包含 fetchStores 数据加载函数', () => {
    const src = readSource();
    assert.ok(src.includes('fetchStores'), '缺少 fetchStores');
  });

  it('应包含 keyword / page / pageSize 搜索分页状态', () => {
    const src = readSource();
    assert.ok(src.includes('keyword'), '缺少 keyword');
    assert.ok(src.includes('page'), '缺少 page');
    assert.ok(src.includes('pageSize'), '缺少 pageSize');
  });
});

// ---- 边界 ----

describe('stores — 边界', () => {
  it('门店状态包含 active / inactive / suspended 三种', () => {
    const src = readSource();
    assert.ok(src.includes("'active'"), '缺少 active 状态');
    assert.ok(src.includes("'inactive'"), '缺少 inactive 状态');
    assert.ok(src.includes("'suspended'"), '缺少 suspended 状态');
  });

  it('无门店数据时显示 "暂无门店数据"', () => {
    const src = readSource();
    assert.ok(src.includes('暂无门店数据'), '缺少空数据提示');
  });

  it('加载中显示 "加载中..."', () => {
    const src = readSource();
    assert.ok(src.includes('加载中'), '缺少加载状态');
  });

  it('分页按钮 "上一页" 在 page === 1 时 disabled', () => {
    const src = readSource();
    assert.ok(src.includes('上一页'), '缺少上一页按钮');
    assert.ok(src.includes('下一页'), '缺少下一页按钮');
    assert.ok(src.includes('Math.max'), '缺少 page 边界保护');
  });

  it('每页显示 pageSize = 10 条', () => {
    const src = readSource();
    assert.ok(src.includes('const pageSize = 10'), '缺少 pageSize 定义');
  });
});

// ---- 防御 ----

describe('stores — 防御', () => {
  it('未登录时应跳转到 /enterprise/login', () => {
    const src = readSource();
    assert.ok(src.includes('enterprise_access_token') || src.includes('enterprise/login'), '缺少登录校验');
    assert.ok(src.includes('router.push'), '缺少路由跳转');
  });

  it('应包含 添加门店 按钮', () => {
    const src = readSource();
    assert.ok(src.includes('添加门店'), '缺少添加门店按钮');
  });

  it('门店列表每行应包含 查看详情 链接', () => {
    const src = readSource();
    assert.ok(src.includes('查看详情'), '缺少查看详情');
  });

  it('应包含 stores/${id} 详情页路由', () => {
    const src = readSource();
    assert.ok(src.includes('/stores/'), '缺少门店详情路由');
  });

  it('搜索表单应使用 handleSearch 阻止默认提交', () => {
    const src = readSource();
    assert.ok(src.includes('handleSearch'), '缺少 handleSearch');
    assert.ok(src.includes('e.preventDefault'), '缺少 preventDefault');
  });
});
