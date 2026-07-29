/**
 * workbench/store-manager/page.test.ts — 店长工作台 E54 拍平固证
 * E54 拍平后：page.tsx 是 server wrapper，业务下沉到 StoreManagerWorkbenchClient。
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAGE_SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');
const CLIENT_SRC = readFileSync(resolve(__dirname, 'store-manager-client.tsx'), 'utf-8');

describe('StoreManagerWorkbench page — E54 结构', () => {
  it('page 应为 server wrapper', () => {
    assert.ok(PAGE_SRC.includes('export default async function StoreManagerWorkbenchPage'));
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'") || PAGE_SRC.includes('force-dynamic'));
  });

  it('page 应挂载 StoreManagerWorkbenchClient', () => {
    assert.ok(PAGE_SRC.includes('<StoreManagerWorkbenchClient'));
  });

  it('page 不应再是 client component', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"), 'E54 拍平：page 不应是 client component');
  });

  it('page 不应含业务壳层（已下沉到 client）', () => {
    assert.ok(!PAGE_SRC.includes('PageShell'), 'E54 拍平：PageShell 应已下沉到 client');
    assert.ok(!PAGE_SRC.includes('KpiCard'), 'E54 拍平：KpiCard 应已下沉到 client');
  });
});

describe('StoreManagerWorkbench client — 业务壳层下沉', () => {
  it('client 应保留 use client 与业务组件', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"));
    assert.ok(CLIENT_SRC.includes('PageShell') || CLIENT_SRC.includes('@m5/ui'));
  });

  it('client 应保留工作台核心字段', () => {
    assert.ok(CLIENT_SRC.includes('今日营收') || CLIENT_SRC.includes('deliveryMode'));
  });
});

describe('StoreManagerWorkbench data — 快照合同', () => {
  it('page 应暴露 bootstrap consumer snapshot', () => {
    assert.ok(
      PAGE_SRC.includes('getAdminWorkbenchConsumerSnapshot') ||
        PAGE_SRC.includes('STORE_MANAGER'),
    );
  });
});
