import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROUTE_PATH = resolve(process.cwd(), 'apps/admin-web/app/api/logistics/clean-schedules/route.ts');
const src = readFileSync(ROUTE_PATH, 'utf-8');

describe('clean-schedules proxy 静态证据', () => {
  it('应包含 GET 方法处理列表查询', () => {
    assert.ok(src.includes('export async function GET'), '缺少 GET 导出');
    assert.ok(src.includes('/logistics/clean-schedules'), '缺少后端接口路径');
  });

  it('应包含 POST 方法处理创建', () => {
    assert.ok(src.includes('export async function POST'), '缺少 POST 导出');
    assert.ok(src.includes("method: 'POST'"), '缺少 POST 请求');
  });

  it('应传递租户隔离头 x-tenant-id', () => {
    assert.ok(src.includes('x-tenant-id'), '缺少租户隔离头');
    assert.ok(src.includes('headers:'), '缺少 headers 配置');
  });

  it('应支持状态查询参数', () => {
    assert.ok(src.includes('status'), '缺少 status 参数处理');
    assert.ok(src.includes('URLSearchParams'), '缺少查询参数构造');
  });

  it('应正确构造后端 URL', () => {
    assert.ok(src.includes('LOGISTICS_API_BASE') || src.includes('localhost:3001'), '缺少 API_BASE 配置');
  });
});
