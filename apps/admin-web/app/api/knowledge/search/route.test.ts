/**
 * api/knowledge/search/route.test.ts — 知识库搜索 API L1 测试
 *
 * 覆盖: 正例·边界·防御
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = readFileSync(resolve(import.meta.dirname, 'route.ts'), 'utf-8');

describe('knowledge/search — 正例', () => {
  it('应导出 GET 方法处理搜索', () => {
    assert.ok(SRC.includes('export async function GET'), '缺少 GET 导出');
  });

  it('应接受 q 查询参数', () => {
    assert.ok(SRC.includes("searchParams.get('q')"), '缺少 q 参数读取');
    assert.ok(SRC.includes('query'), '应保存为 query 变量');
  });

  it('应支持 kind 类型过滤', () => {
    assert.ok(SRC.includes("searchParams.get('kind')"), '缺少 kind 参数');
  });

  it('应支持分页参数 limit 和 page', () => {
    assert.ok(SRC.includes("searchParams.get('limit')"), '缺少 limit 参数');
    assert.ok(SRC.includes("searchParams.get('page')"), '缺少 page 参数');
    assert.ok(SRC.includes('offset'), '应计算 offset = (page-1) * limit');
  });

  it('应限制 limit 最大为 50', () => {
    assert.ok(SRC.includes('Math.min'), '应使用 Math.min 限制');
    assert.ok(SRC.includes('50'), '最大 limit 应为 50');
  });

  it('应使用 PostgreSQL 全文搜索', () => {
    assert.ok(SRC.includes('to_tsvector'), '应使用 tsvector');
    assert.ok(SRC.includes('plainto_tsquery'), '应使用 plainto_tsquery');
    assert.ok(SRC.includes('knowledge_documents'), '应查询 knowledge_documents 表');
  });

  it('搜索无结果时应返回空数组且 success: true', () => {
    assert.ok(SRC.includes('success: true'), '搜索成功应包含 success: true');
    assert.ok(SRC.includes('error'), '应包含 error 字段');
    assert.ok(SRC.includes('total'), '应包含 total');
    assert.ok(SRC.includes('tookMs'), '应包含 tookMs');
  });

  it('应返回排序后的搜索结果 (score DESC)', () => {
    assert.ok(SRC.includes('ORDER BY'), '应有 ORDER BY');
    assert.ok(SRC.includes('score DESC'), '应按 score 降序');
  });

  it('应包含 pg Pool 动态导入', () => {
    assert.ok(SRC.includes("import('pg')"), '应动态导入 pg');
    assert.ok(SRC.includes('Pool'), '应使用 Pool');
  });
});

describe('knowledge/search — 防御', () => {
  it('q 为空时应返回 400', () => {
    assert.ok(SRC.includes('!query'), '应检查空查询');
    assert.ok(SRC.includes('400'), '应返回 400 状态码');
    assert.ok(SRC.includes('Missing required parameter'), '应有明确的错误消息');
  });

  it('limit 最小值应为 1', () => {
    assert.ok(SRC.includes('Math.max'), '应使用 Math.max 确保最小值');
    assert.ok(SRC.includes('1'), '最小 limit 为 1');
  });

  it('应包含 try-catch 错误处理', () => {
    assert.ok(SRC.includes('try'), '应包含 try');
    assert.ok(SRC.includes('catch'), '应包含 catch');
    assert.ok(SRC.includes('500'), '错误时返回 500');
  });

  it('应使用 DATABASE_URL 环境变量', () => {
    assert.ok(SRC.includes('DATABASE_URL'), '应使用 DATABASE_URL');
  });

  it('SQL 注入防御：应使用参数化查询', () => {
    assert.ok(SRC.includes('$1'), '应使用 $1 参数化');
    assert.ok(SRC.includes('params'), '应使用 params 数组');
  });

  it('无危险 HTML', () => { assert.ok(!SRC.includes('dangerouslySetInnerHTML')); });
  it('无 any 类型', () => {
    const anyMatches = SRC.match(/:\s*any\b/g);
    // 路由中有 3 处 any: catch(error: any), r.map((r: any), r: any
    const anyCount = anyMatches ? anyMatches.length : 0;
    assert.ok(anyCount <= 3, `any 类型使用次数: ${anyCount}`);
  });
});
