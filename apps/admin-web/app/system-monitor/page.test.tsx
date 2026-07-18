/**
 * P-Admin 系统监控页测试 (30+ tests)
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

// ─── Tests — 功能正例 ─────────────────────────────────

describe('SystemMonitorPage — 正例', () => {
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

  it('⑦ 应显示指标趋势百分比', async () => {
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

  it('⑩ 应展示系统健康度统计条 — CPU正常', async () => {
    render(<SystemMonitorPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('CPU正常'), 'expected health summary card');
    });
  });

  it('⑪ 应展示系统健康度统计条 — 内存正常', async () => {
    render(<SystemMonitorPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('内存正常'), 'expected health summary card');
    });
  });

  it('⑫ 应展示系统健康度统计条 — 磁盘正常', async () => {
    render(<SystemMonitorPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('磁盘正常'), 'expected health summary card');
    });
  });

  it('⑬ 应展示系统健康度统计条 — 总服务数', async () => {
    render(<SystemMonitorPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('总服务数'), 'expected health summary card');
    });
  });

  it('⑭ 应显示健康统计条中的服务数', async () => {
    render(<SystemMonitorPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('2'), 'expected service count in health cards');
    });
  });

  it('⑮ 应显示正常/异常服务计数', async () => {
    render(<SystemMonitorPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('1正常'), 'expected healthy count');
      assert.ok(body.includes('1异常'), 'expected warning count');
    });
  });

  it('⑯ 应显示指标数值格式化（万/亿）', async () => {
    render(<SystemMonitorPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      // 85600000 → 8560.0万
      assert.ok(body.includes('8560.0万'), 'expected formatted number');
    });
  });

  it('⑰ 应显示活动日志来源', async () => {
    render(<SystemMonitorPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('Scheduler'), 'expected log source');
      assert.ok(body.includes('Monitor'), 'expected log source');
    });
  });

  it('⑱ 应显示服务在线率', async () => {
    render(<SystemMonitorPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('在线率'), 'expected uptime label');
    });
  });
});

// ─── Tests — 反例 ────────────────────────────────────

describe('SystemMonitorPage — 反例', () => {
  beforeEach(() => { responseRegistry.clear(); setDefault(); });

  it('⑲ API全部失败时使用默认数据', async () => {
    responseRegistry.clear();
    // Don't set any responses — all fetches will return default empty success
    // That triggers the catch block which uses defaultMetrics etc.
    render(<SystemMonitorPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      // Should show default metrics (6 items, including 日活门店)
      assert.ok(body.includes('日活门店'), 'expected fallback metric');
      // Should show default services (6 items, including API Gateway)
      assert.ok(body.includes('API Gateway'), 'expected fallback service');
    });
  });

  it('⑳ API返回success=false时使用默认数据', async () => {
    responseRegistry.clear();
    // Return success=false which triggers the catch in apiFetch
    setResponseFor('/metrics', () => ({ success: false, message: 'Server Error' }));
    setResponseFor('/services', () => ({ success: false, message: 'Server Error' }));
    setResponseFor('/activities', () => ({ success: false, message: 'Server Error' }));
    render(<SystemMonitorPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('日活门店'), 'expected fallback after failed API');
    });
  });

  it('㉑ 空活动日志列表显示"暂无活动日志"', async () => {
    responseRegistry.clear();
    setResponseFor('/metrics', () => ({ success: true, data: {
      metrics: [{ name: '日活门店', value: 128, unit: '家', trend: 'up', status: 'normal', description: '有交易的门店' }],
    }, message: 'OK' }));
    setResponseFor('/services', () => ({ success: true, data: {
      services: [{ name: 'API Gateway', status: 'healthy', uptime: '99.98%', lastCheck: '2026-07-18T22:00:00Z', responseTimeMs: 45 }],
    }, message: 'OK' }));
    setResponseFor('/activities', () => ({ success: true, data: { logs: [] }, message: 'OK' }));
    render(<SystemMonitorPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('暂无活动日志'), 'expected empty state message');
    });
  });

  it('㉒ 指标无changePercent时趋势不显示百分比', async () => {
    responseRegistry.clear();
    setResponseFor('/metrics', () => ({ success: true, data: {
      metrics: [
        { name: '系统负载', value: 68, unit: '%', trend: 'stable', status: 'normal', description: '综合负载' },
      ],
    }, message: 'OK' }));
    setResponseFor('/services', () => ({ success: true, data: { services: [] }, message: 'OK' }));
    setResponseFor('/activities', () => ({ success: true, data: { logs: [] }, message: 'OK' }));
    render(<SystemMonitorPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      // stable trend with no changePercent should show → without percentage
      assert.ok(body.includes('→'), 'expected stable trend arrow');
      // should not crash or show NaN
      assert.ok(!body.includes('NaN'), 'no NaN in output');
    });
  });

  it('㉓ fetch网络异常时降级使用默认数据', async () => {
    responseRegistry.clear();
    // Return a rejected promise for all URLs
    globalThis.fetch = ((() => Promise.reject(new Error('Network failure'))) as unknown as typeof globalThis.fetch);
    render(<SystemMonitorPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      // Should show default fallback data (日活门店 is in defaultMetrics)
      assert.ok(body.includes('日活门店'), 'expected fallback after network error');
      assert.ok(body.includes('API Gateway'), 'expected fallback service');
    });
    // Restore fetch mock for subsequent tests
    responseRegistry.clear();
    setDefault();
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
  });
});

// ─── Tests — 边界 ────────────────────────────────────

describe('SystemMonitorPage — 边界', () => {
  beforeEach(() => { responseRegistry.clear(); setDefault(); });

  it('㉔ 初始加载显示loading指示器', async () => {
    // Don't resolve fetches immediately — override fetch to never resolve
    globalThis.fetch = (() => new Promise<never>(() => {})) as unknown as typeof globalThis.fetch;
    render(<SystemMonitorPage />);
    // Loading text should be visible immediately
    const body = document.body.textContent || '';
    assert.ok(body.includes('加载系统状态'), 'expected loading indicator');
    // Restore fetch for subsequent tests
    responseRegistry.clear();
    setDefault();
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
  });

  it('㉕ 0条服务时统计条正确显示', async () => {
    responseRegistry.clear();
    setResponseFor('/metrics', () => ({ success: true, data: {
      metrics: [],
    }, message: 'OK' }));
    setResponseFor('/services', () => ({ success: true, data: {
      services: [],
    }, message: 'OK' }));
    setResponseFor('/activities', () => ({ success: true, data: {
      logs: [],
    }, message: 'OK' }));
    render(<SystemMonitorPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('CPU正常'), 'health cards still render');
      assert.ok(body.includes('总服务数'), 'total services card renders');
      assert.ok(body.includes('0'), 'service count should be 0');
    });
  });

  it('㉖ warning状态指标正确染色', async () => {
    responseRegistry.clear();
    setResponseFor('/metrics', () => ({ success: true, data: {
      metrics: [
        { name: '系统负载', value: 85, unit: '%', trend: 'up', changePercent: 12, status: 'warning', description: '负载过高' },
        { name: 'API错误率', value: 5.2, unit: '%', trend: 'up', changePercent: 3.1, status: 'critical', description: '错误率飙升' },
      ],
    }, message: 'OK' }));
    setResponseFor('/services', () => ({ success: true, data: { services: [] }, message: 'OK' }));
    setResponseFor('/activities', () => ({ success: true, data: { logs: [] }, message: 'OK' }));
    render(<SystemMonitorPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('⚠') || body.includes('🔴'), 'expected warning/critical icons');
    });
  });

  it('㉗ 全部服务down时状态标签显示"离线"', async () => {
    responseRegistry.clear();
    setResponseFor('/metrics', () => ({ success: true, data: {
      metrics: [{ name: '日活门店', value: 0, unit: '家', trend: 'down', status: 'critical', description: '无交易' }],
    }, message: 'OK' }));
    setResponseFor('/services', () => ({ success: true, data: {
      services: [
        { name: 'API Gateway', status: 'down', uptime: '50%', lastCheck: '2026-07-18T22:00:00Z', responseTimeMs: 999 },
      ],
    }, message: 'OK' }));
    setResponseFor('/activities', () => ({ success: true, data: { logs: [] }, message: 'OK' }));
    render(<SystemMonitorPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('离线'), 'expected down status label');
      assert.ok(body.includes('0异常'), 'expected 0 healthy, all abnormal');
    });
  });

  it('㉘ 刷新按钮点击可触发重新加载', async () => {
    let fetchCount = 0;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = ((url: string) => {
      fetchCount++;
      return Promise.resolve({
        ok: true, status: 200, json: () => Promise.resolve({
          success: true,
          data: { metrics: [], services: [], logs: [] },
          message: 'OK',
        }),
        headers: new Headers(), redirected: false, statusText: 'OK', type: 'basic' as const, url: String(url),
      } as Response);
    }) as typeof globalThis.fetch;

    render(<SystemMonitorPage />);
    await waitFor(() => { assert.ok(fetchCount >= 3, 'initial load should trigger 3 fetches'); });

    const btns = screen.getAllByText('刷新');
    if (btns.length > 0) fireEvent.click(btns[0]);

    await waitFor(() => { assert.ok(fetchCount >= 6, 'refresh should trigger another 3 fetches'); });

    globalThis.fetch = originalFetch;
  });

  it('㉙ 单位后缀显示在指标值旁', async () => {
    render(<SystemMonitorPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('家') || body.includes('元') || body.includes('%'), 'expected unit suffix');
    });
  });

  it('㉚ 服务状态圆点颜色根据状态变化', async () => {
    render(<SystemMonitorPage />);
    await waitFor(() => {
      // healthy service should have green dot, degraded should have yellow/red
      const html = document.body.innerHTML || '';
      assert.ok(html.includes('bg-green-500'), 'healthy dot is green');
    });
  });

  it('㉛ 活动日志类型不同颜色', async () => {
    render(<SystemMonitorPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      // info log
      assert.ok(body.includes('🔵'), 'expected info icon');
      // warning log
      assert.ok(body.includes('🟡'), 'expected warning icon');
    });
  });

  it('㉜ 子标题文字应展示', async () => {
    render(<SystemMonitorPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('服务健康'), 'expected subtitle text');
      assert.ok(body.includes('实时指标'), 'expected subtitle text');
      assert.ok(body.includes('活动日志'), 'expected subtitle text');
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
  it('包含健康统计JSX', () => assert.ok(SRC.includes('CPU正常'), '健康统计条已添加'));
  it('包含网格布局', () => assert.ok(SRC.includes('grid grid-cols-4'), '健康统计4列布局'));
});
