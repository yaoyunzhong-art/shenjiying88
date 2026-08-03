/**
 * api/logistics/inspections/[id]/result/route.test.ts — 设备巡检结果录入 L1 测试
 *
 * 覆盖: 正例·边界·防御
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = readFileSync(resolve(import.meta.dirname, 'route.ts'), 'utf-8');

describe('inspections/[id]/result — 正例', () => {
  it('应导出 POST 方法录入巡检结果', () => {
    assert.ok(SRC.includes('export async function POST'), '缺少 POST 导出');
  });

  it('应解析 params.id 获取巡检 ID', () => {
    assert.ok(SRC.includes('params.id'), '缺少 params.id');
  });

  it('应读取 request body 获取结果数据', () => {
    assert.ok(SRC.includes('request.json'), '应解析 JSON body');
  });

  it('应透传 x-tenant-id 实现租户隔离', () => {
    assert.ok(SRC.includes('x-tenant-id'), '缺少 x-tenant-id');
  });

  it('应通过 buildLogisticsForwardHeaders 白名单透传 actor headers', () => {
    assert.ok(SRC.includes('buildLogisticsForwardHeaders'), '缺少统一 logistics header helper');
    assert.ok(SRC.includes('contentType'), '应显式设置 contentType');
  });

  it('应使用 LOGISTICS_API_BASE 构建上游 URL', () => {
    assert.ok(SRC.includes('LOGISTICS_API_BASE'), '缺少 LOGISTICS_API_BASE');
    assert.ok(SRC.includes('/result'), '应包含 result 路径');
    assert.ok(SRC.includes('encodeURIComponent(id)'), '应对 ID 编码');
  });
});

describe('inspections/[id]/result — 防御', () => {
  it('上游失败时应返回错误状态', () => {
    assert.ok(SRC.includes('!res.ok'), '应检查上游响应');
    assert.ok(SRC.includes('record result failed'), '应有错误消息');
  });

  it('应使用 POST 方法转发请求', () => {
    assert.ok(SRC.includes("method: 'POST'"), '应使用 POST');
    assert.ok(SRC.includes('application/json'), 'Content-Type');
  });

  it('无危险 HTML', () => { assert.ok(!SRC.includes('dangerouslySetInnerHTML')); });
  it('无 any 类型', () => { assert.ok(!/:\s*any\b/.test(SRC)); });
  it('应包含 API_BASE 默认值', () => {
    assert.ok(SRC.includes('localhost:3001'), '应包含默认 API_BASE');
  });
});
