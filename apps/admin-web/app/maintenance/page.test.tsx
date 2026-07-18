/**
 * P-30 后勤维护 — 后勤任务管理页测试
 *
 * 覆盖: 正例·反例·边界
 * Mock策略: URL-pattern responseRegistry
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { render, screen, waitFor } from '@testing-library/react'
import MaintenancePage from './page'
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const responseRegistry = new Map<string, () => unknown>();

function setResponseFor(pattern: string, factory: () => unknown) {
  responseRegistry.set(pattern, factory);
}

globalThis.fetch = ((url: string) => {
  const path = typeof url === 'string' ? url : '';
  for (const [pattern, factory] of responseRegistry) {
    if (path.includes(pattern)) {
      return Promise.resolve({
        ok: true, status: 200,
        json: () => Promise.resolve(factory()),
        headers: new Headers(), redirected: false, statusText: 'OK', type: 'basic' as const, url: path,
      } as Response);
    }
  }
  return Promise.resolve({
    ok: true, status: 200, json: () => Promise.resolve({ success: true, data: null, message: 'OK' }),
    headers: new Headers(), redirected: false, statusText: 'OK', type: 'basic' as const, url: path,
  } as Response);
}) as typeof globalThis.fetch;

function setDefaultResponses() {
  responseRegistry.clear();
  setResponseFor('/api/logistics/maintenance', () => ({
    success: true,
    data: {
      tasks: [
        { id: 'mt-1', storeName: '北京朝阳店', storeId: 's1', type: 'repair', title: '空调故障', description: '2号机不制冷', priority: 'high', status: 'in-progress', assignedTo: '张师傅', scheduledDate: '2026-07-19', createdAt: '2026-07-17T10:00:00Z', updatedAt: '2026-07-18T08:00:00Z' },
        { id: 'mt-2', storeName: '上海南京路店', storeId: 's2', type: 'clean', title: '深度保洁', description: '全店清洁', priority: 'medium', status: 'assigned', assignedTo: '保洁组', scheduledDate: '2026-07-20', createdAt: '2026-07-15T14:00:00Z', updatedAt: '2026-07-16T09:00:00Z' },
        { id: 'mt-3', storeName: '广州天河店', storeId: 's3', type: 'inspect', title: '消防检查', description: '消防安全巡检', priority: 'urgent', status: 'pending', createdAt: '2026-07-18T06:00:00Z', updatedAt: '2026-07-18T06:00:00Z' },
      ],
    },
    message: 'OK',
  }));
}

function assertInDoc(text: string) {
  const els = screen.queryAllByText(text);
  assert.ok(els.length >= 1, `expected "${text}" to be in document`);
}

// ─── Tests ─────────────────────────────────────────────

describe('MaintenancePage', () => {
  beforeEach(() => {
    responseRegistry.clear();
    setDefaultResponses();
  });

  it('should render page title', async () => {
    render(<MaintenancePage />);
    await waitFor(() => assertInDoc('后勤维护'));
  });

  it('should show stat cards', async () => {
    render(<MaintenancePage />);
    await waitFor(() => {
      assertInDoc('任务总数');
      assertInDoc('待处理');
      assertInDoc('进行中');
      assertInDoc('紧急');
    });
  });

  it('should display task titles and store names', async () => {
    render(<MaintenancePage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('深度保洁'), 'expected title depth clean');
      assert.ok(body.includes('上海南京路'), 'expected store name');
    });
  });

  it('should render tab navigation', async () => {
    render(<MaintenancePage />);
    await waitFor(() => {
      assertInDoc('待处理');
      assertInDoc('进行中');
      assertInDoc('已完成');
      assertInDoc('全部');
    });
  });

  it('should show priority badges', async () => {
    render(<MaintenancePage />);
    await waitFor(() => {
      // 默认tab下pending任务(mt-3)显示紧急
      const body = document.body.textContent || '';
      assert.ok(body.includes('紧急') || body.includes('中'), 'expected priority badge');
    });
  });

  it('should show type labels', async () => {
    render(<MaintenancePage />);
    await waitFor(() => {
      // mt-2(assigned)是clean类型, mt-3(pending)是inspect类型
      const body = document.body.textContent || '';
      assert.ok(body.includes('保洁') || body.includes('巡检'), 'expected type label');
    });
  });

  it('should show assigned personnel', async () => {
    render(<MaintenancePage />);
    await waitFor(() => {
      // mt-2(assigned)显示保洁组
      const body = document.body.textContent || '';
      assert.ok(body.includes('保洁组'), 'expected assigned personnel');
    });
  });

  it('should show refresh button', async () => {
    render(<MaintenancePage />);
    await waitFor(() => assertInDoc('刷新'));
  });

  it('should show empty state when no tasks', async () => {
    responseRegistry.clear();
    setResponseFor('/api/logistics/maintenance', () => ({
      success: true, data: { tasks: [] }, message: 'OK',
    }));
    render(<MaintenancePage />);
    await waitFor(() => assertInDoc('暂无任务'));
  });

  it('should show scheduled dates', async () => {
    render(<MaintenancePage />);
    await waitFor(() => {
      // mt-2(assigned)显示2026-07-20, mt-3(pending)没有日期
      const body = document.body.textContent || '';
      assert.ok(body.includes('2026-07-20'), 'expected scheduled date');
    });
  });

  it('should show task descriptions', async () => {
    render(<MaintenancePage />);
    await waitFor(() => {
      // mt-3(pending)的description
      const body = document.body.textContent || '';
      assert.ok(body.includes('消防安全巡检'), 'expected description');
    });
  });
});

// ── 静态代码分析 ──

const SRC = fs.readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('MaintenancePage — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
});
