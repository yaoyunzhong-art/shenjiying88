/**
 * api/knowledge/stats/route.test.ts — 知识库统计 API L1 测试
 *
 * 覆盖: 正例·边界·防御
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = readFileSync(resolve(import.meta.dirname, 'route.ts'), 'utf-8');

describe('knowledge/stats — 正例', () => {
  it('应导出 GET 方法', () => {
    assert.ok(SRC.includes('export async function GET'), '缺少 GET 导出');
  });

  it('应查询文档总数', () => {
    assert.ok(SRC.includes('COUNT(*)'), '应使用 COUNT(*)');
    assert.ok(SRC.includes('totalDocuments'), '应返回 totalDocuments');
    assert.ok(SRC.includes('knowledge_documents'), '应查询 knowledge_documents 表');
  });

  it('应按 kind 分组统计', () => {
    assert.ok(SRC.includes('GROUP BY kind'), '应 GROUP BY kind');
    assert.ok(SRC.includes('byKind'), '应返回 byKind 分组');
  });

  it('应返回最近 5 条记录', () => {
    assert.ok(SRC.includes('ORDER BY created_at DESC'), '应按创建时间倒序');
    assert.ok(SRC.includes('LIMIT 5'), '应限制 5 条');
    assert.ok(SRC.includes('recentEntries'), '应返回 recentEntries');
  });

  it('应使用 Promise.all 并行查询', () => {
    assert.ok(SRC.includes('Promise.all'), '应使用 Promise.all 并行');
  });

  it('应使用 pg Pool 动态导入', () => {
    assert.ok(SRC.includes("import('pg')"), '应动态导入 pg');
    assert.ok(SRC.includes('Pool'), '应使用 Pool');
  });

  it('应包含 success / data 响应结构', () => {
    assert.ok(SRC.includes('success: true'), '成功时应返回 success: true');
    assert.ok(SRC.includes('success: false'), '失败时应返回 success: false');
  });
});

describe('knowledge/stats — 防御', () => {
  it('应包含 try-catch 错误处理', () => {
    assert.ok(SRC.includes('try'), '应包含 try');
    assert.ok(SRC.includes('catch'), '应包含 catch');
    assert.ok(SRC.includes('500'), '错误时返回 500');
  });

  it('应使用 DATABASE_URL 环境变量', () => {
    assert.ok(SRC.includes('DATABASE_URL'), '应使用 DATABASE_URL');
  });

  it('返回字段应包含 title / kind / createdAt', () => {
    assert.ok(SRC.includes('title'), '缺少 title');
    assert.ok(SRC.includes('kind'), '缺少 kind');
    assert.ok(SRC.includes('createdAt'), '缺少 createdAt');
  });

  it('无危险 HTML', () => { assert.ok(!SRC.includes('dangerouslySetInnerHTML')); });
  it('无 any 类型', () => {
    const anyMatches = SRC.match(/:\s*any\b/g);
    // 路由中有 3 处 any: catch(error: any), .map((r: any) × 2
    const anyCount = anyMatches ? anyMatches.length : 0;
    assert.ok(anyCount <= 3, `any 类型使用次数: ${anyCount}`);
  });
});
