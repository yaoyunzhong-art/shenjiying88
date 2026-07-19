import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');
const SRC = readFileSync(SOURCE, 'utf-8');

describe('scheduling — actor headers', () => {
  it('应导出默认组件', () => {
    assert.ok(SRC.includes('export default function SchedulingPage'));
  });

  it('应通过 buildActorHeaders 统一注入 actor 身份', () => {
    assert.ok(SRC.includes('buildActorHeaders'), '缺少统一 actor header helper');
    assert.ok(SRC.includes('admin-store-scheduling'), '缺少排班页面 actor 标识');
    assert.ok(SRC.includes('buildSchedulingHeaders'), '缺少排班页面 header 构造');
  });

  it('应保留 clean-schedules 真接口接线', () => {
    assert.ok(SRC.includes('/api/logistics/clean-schedules'), '缺少 clean-schedules API');
    assert.ok(SRC.includes('check-in'), '缺少签到动作');
  });
});
