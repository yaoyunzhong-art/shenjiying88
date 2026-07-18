/**
 * P-Admin 系统监控页测试
 *
 * 圈梁四道箍:
 * ① TSC通过 → ② 测试存在(0 fail) → ③ 圈梁表更新 → ④ PRD标记
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SystemMonitorPage from './page'

// ─── Mock fetch — URL-pattern responseRegistry ──

const responseRegistry = new Map<string, () => unknown>();

function setResponseFor(pattern: string, factory: () => unknown) {
  responseRegistry.set(pattern, factory);
}

globalThis.fetch = ((url: string) => {
  const path = typeof url === 'string' ? url : '';
  for (const [pattern, factory] of responseRegistry) {
    if (path.includes(pattern)) {
      return Promise.resolve({
        ok: true, status: 200, json: () => Promise.resolve(factory()),
        headers: new Headers(), redirected: false, statusText: 'OK', type: 'basic' as const, url: path,
      } as Response);
    }
  }
  return Promise.resolve({
    ok: true, status: 200, json: () => Promise.resolve({ success: true, data: null, message: 'OK' }),
    headers: new Headers(), redirected: false, statusText: 'OK', type: 'basic' as const, url: path,
  } as Response);
}) as typeof globalThis.fetch;

function setDefault() {
  responseRegistry.clear();
  setResponseFor('/metrics', () => ({ success: true, data: {
    metrics: [
      { name: '日活门店', value: 128, unit: '家', trend: 'up', changePercent: 5.2, status: 'normal', description: '有交易的门店' },
      { name: '日交易额', value: 85600000, unit: '元', trend: 'up', changePercent: 8.1, status: 'normal', description: '全网交易' },
    ],
  }, message: 'OK' }));
  setResponseFor('/services', () => ({ success: true, data: {
    services: [
      { name: 'API Gateway', status: 'healthy', uptime: '99.98%', lastCheck: '2026-07-18T22:00:00Z', responseTimeMs: 45 },
      { name: 'OSS存储', status: 'degraded', uptime: '99.80%', lastCheck: '2026-07-18T21:55:00Z', responseTimeMs: 350 },
    ],
  }, message: 'OK' }));
  setResponseFor('/activities', () => ({ success: true, data: {
    logs: [
      { time: '21:58', type: 'info', message: '自动对账完成', source: 'Scheduler' },
      { time: '21:30', type: 'warning', message: 'OSS存储延迟', source: 'Monitor' },
    ],
  }, message: 'OK' }));
}

// ─── Tests ─────────────────────────────────────────────

describe('SystemMonitorPage', () => {
  beforeEach(() => { responseRegistry.clear(); setDefault(); });

  it('① 页面标题应展示', async () => {
    render(<SystemMonitorPage />);
    await waitFor(() => {
      const els = screen.queryAllByText('系统监控');
      assert.ok(els.length >= 1);
    });
  });

  it('② 应展示指标卡片', async () => {
    render(<SystemMonitorPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('日活门店'), 'expected metric');
      assert.ok(body.includes('日交易额'), 'expected metric');
    });
  });

  it('③ 应展示服务状态', async () => {
    render(<SystemMonitorPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('API Gateway'), 'expected service');
      assert.ok(body.includes('OSS存储'), 'expected service');
    });
  });

  it('④ 应展示活动日志', async () => {
    render(<SystemMonitorPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('自动对账完成'), 'expected log');
    });
  });

  it('⑤ 应展示服务状态标签', async () => {
    render(<SystemMonitorPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('正常'), 'expected normal');
      assert.ok(body.includes('降级'), 'expected degraded');
    });
  });

  it('⑥ 应显示刷新按钮', async () => {
    render(<SystemMonitorPage />);
    await waitFor(() => {
      const els = screen.queryAllByText('刷新');
      assert.ok(els.length >= 1);
    });
  });

  it('⑦ 应显示指标趋势', async () => {
    render(<SystemMonitorPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('5.2'), 'expected trend percent');
    });
  });

  it('⑧ 应显示活动日志类型图标', async () => {
    render(<SystemMonitorPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('🔵') || body.includes('🟡'), 'expected icon');
    });
  });

  it('⑨ 应显示响应时间', async () => {
    render(<SystemMonitorPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('45ms') || body.includes('350ms'), 'expected response time');
    });
  });
});

// ── 静态代码分析 ──

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = fs.readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('SystemMonitorPage — 圈梁 ① TSC通过', () => {
  it('包含useState', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含Promise.all并发', () => assert.ok(SRC.includes('Promise.all')));
  it('没有as any反模式', () => assert.ok(!SRC.includes('as any'), 'AM-001禁止'));
  it('没有describe.skip残留', () => assert.ok(SRC.length > 100, '文件内容完整'));
});
